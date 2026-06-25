import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { applyTransition, type Actor, type Status } from '../../domain/workflow.js';
import { config } from '../../lib/config.js';
import { prisma } from '../../lib/db.js';
import { isUploadEnabled, uploadAttachment } from '../../lib/cloudinary.js';
import {
  createApplicationSchema,
  transitionSchema,
  updateApplicationSchema,
} from '../../lib/validation.js';
import { asyncHandler } from '../async-handler.js';
import { ApiError } from '../errors.js';
import type { AuthUser } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import {
  serializeApplicationDetail,
  serializeApplicationSummary,
} from '../serializers.js';

export const applicationsRouter = Router();

const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes },
});

function user(req: Request): AuthUser {
  if (!req.user) throw ApiError.unauthenticated();
  return req.user;
}

function idParam(req: Request): string {
  const id = req.params.id;
  if (typeof id !== 'string' || id.length === 0) {
    throw ApiError.notFound('Application not found');
  }
  return id;
}

const detailInclude = {
  auditEntries: {
    orderBy: { createdAt: 'asc' },
    include: { actor: { select: { id: true, name: true, role: true } } },
  },
} as const;

/** Build the pure-domain Actor for an application, deriving ownership from the DB. */
function actorFor(authUser: AuthUser, ownerId: string): Actor {
  return {
    userId: authUser.id,
    role: authUser.role,
    isOwner: authUser.id === ownerId,
  };
}

const STATUS_VALUES: Status[] = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

// GET /applications
// Applicants see only their own; reviewers see the full queue, filterable by status.
applicationsRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
  const me = user(req);
  const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;

  if (statusParam && !STATUS_VALUES.includes(statusParam as Status)) {
    throw new ApiError(422, 'VALIDATION_ERROR', `Unknown status filter: ${statusParam}`);
  }

  const where =
    me.role === 'REVIEWER'
      ? statusParam
        ? { status: statusParam as Status }
        : {}
      : { ownerId: me.id, ...(statusParam ? { status: statusParam as Status } : {}) };

  const apps = await prisma.application.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ applications: apps.map(serializeApplicationSummary) });
}));

// POST /applications — applicants create a DRAFT.
applicationsRouter.post('/', requireRole('APPLICANT'), asyncHandler(async (req: Request, res: Response) => {
  const me = user(req);
  const input = createApplicationSchema.parse(req.body);

  const app = await prisma.application.create({
    data: {
      ownerId: me.id,
      title: input.title,
      category: input.category,
      description: input.description,
      amount: input.amount ?? null,
    },
  });
  res.status(201).json({ application: serializeApplicationSummary(app) });
}));

// GET /applications/:id — detail with audit trail, availableTransitions, canEdit.
applicationsRouter.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const me = user(req);
  const app = await prisma.application.findUnique({
    where: { id: idParam(req) },
    include: detailInclude,
  });
  if (!app) throw ApiError.notFound('Application not found');

  // Applicants may only read their own applications.
  if (me.role === 'APPLICANT' && app.ownerId !== me.id) {
    throw ApiError.forbidden('You can only view your own applications');
  }

  res.json({ application: serializeApplicationDetail(app, actorFor(me, app.ownerId)) });
}));

// PATCH /applications/:id — owner edits fields while in DRAFT only.
applicationsRouter.patch('/:id', asyncHandler(async (req: Request, res: Response) => {
  const me = user(req);
  const app = await prisma.application.findUnique({ where: { id: idParam(req) } });
  if (!app) throw ApiError.notFound('Application not found');

  if (app.ownerId !== me.id) {
    throw ApiError.forbidden('You can only edit your own applications');
  }
  if (app.status !== 'DRAFT') {
    throw new ApiError(
      409,
      'ILLEGAL_TRANSITION',
      'An application can only be edited while it is a DRAFT',
    );
  }

  const input = updateApplicationSchema.parse(req.body);
  const updated = await prisma.application.update({
    where: { id: app.id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
    },
  });
  res.json({ application: serializeApplicationSummary(updated) });
}));

// POST /applications/:id/transition — the enforced state change + audit write.
applicationsRouter.post('/:id/transition', asyncHandler(async (req: Request, res: Response) => {
  const me = user(req);
  const { action, comment } = transitionSchema.parse(req.body);

  const app = await prisma.application.findUnique({ where: { id: idParam(req) } });
  if (!app) throw ApiError.notFound('Application not found');

  const actor = actorFor(me, app.ownerId);
  // The pure state machine decides; it throws a typed error for illegal,
  // forbidden, or comment-required cases, mapped to HTTP by the error handler.
  const result = applyTransition(app.status as Status, action, actor, comment);

  // The status update and its audit row are written atomically so the trail
  // can never diverge from the state.
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.application.update({
      where: { id: app.id },
      data: { status: result.to },
    });
    await tx.auditEntry.create({
      data: {
        applicationId: app.id,
        actorId: me.id,
        action: result.action,
        fromStatus: result.from,
        toStatus: result.to,
        comment: result.comment,
      },
    });
    return next;
  });

  const withTrail = await prisma.application.findUniqueOrThrow({
    where: { id: updated.id },
    include: detailInclude,
  });
  res.json({ application: serializeApplicationDetail(withTrail, actor) });
}));

// POST /applications/:id/attachment — owner uploads a single file while in DRAFT.
applicationsRouter.post(
  '/:id/attachment',
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    const me = user(req);
    const app = await prisma.application.findUnique({ where: { id: idParam(req) } });
    if (!app) throw ApiError.notFound('Application not found');

    if (app.ownerId !== me.id) {
      throw ApiError.forbidden('You can only attach files to your own applications');
    }
    if (app.status !== 'DRAFT') {
      throw new ApiError(409, 'ILLEGAL_TRANSITION', 'Attachments can only change while in DRAFT');
    }
    if (!req.file) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'No file provided (field name: file)');
    }
    if (!ALLOWED_MIME.has(req.file.mimetype)) {
      throw new ApiError(
        422,
        'VALIDATION_ERROR',
        `Unsupported file type: ${req.file.mimetype}`,
      );
    }
    if (!isUploadEnabled()) {
      throw new ApiError(
        503,
        'UPLOAD_DISABLED',
        'File uploads are not configured (set Cloudinary env vars)',
      );
    }

    const result = await uploadAttachment(req.file.buffer, req.file.originalname);
    const updated = await prisma.application.update({
      where: { id: app.id },
      data: { attachmentUrl: result.url, attachmentName: result.name },
    });
    res.json({ application: serializeApplicationSummary(updated) });
  }),
);
