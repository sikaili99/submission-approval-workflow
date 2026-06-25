import { z } from 'zod';
import { ACTIONS } from '../domain/workflow.js';

export const CATEGORIES = ['GRANT', 'EXPENSE', 'EQUIPMENT', 'TRAVEL', 'OTHER'] as const;

const amountSchema = z
  .number({ invalid_type_error: 'amount must be a number' })
  .nonnegative('amount must be zero or greater')
  .nullable()
  .optional();

export const createApplicationSchema = z.object({
  title: z.string().trim().min(1, 'title is required').max(200),
  category: z.enum(CATEGORIES),
  description: z.string().trim().max(5000).optional().default(''),
  amount: amountSchema,
});

// Edit allows partial updates but at least one field must be present.
export const updateApplicationSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    category: z.enum(CATEGORIES),
    description: z.string().trim().max(5000),
    amount: amountSchema,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'at least one field must be provided',
  });

export const transitionSchema = z.object({
  action: z.enum(ACTIONS),
  comment: z.string().trim().max(2000).optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type TransitionInput = z.infer<typeof transitionSchema>;
