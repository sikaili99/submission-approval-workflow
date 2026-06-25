import express, { type Express, type Request, type Response } from 'express';
import { prisma } from '../lib/db.js';
import { authenticate } from './middleware/auth.js';
import { cors } from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { applicationsRouter } from './routes/applications.js';

export function createApp(): Express {
  const app = express();
  app.use(cors);
  app.use(express.json());

  app.get('/healthz', async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok' });
    } catch {
      res.status(503).json({ status: 'unavailable' });
    }
  });

  app.get('/me', authenticate, (req: Request, res: Response) => {
    res.json({ user: req.user });
  });

  app.use('/applications', authenticate, applicationsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
