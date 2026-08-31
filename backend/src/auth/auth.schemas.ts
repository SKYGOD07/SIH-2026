import { z } from 'zod';
import { INVITABLE_ROLES } from './admin.service';

/**
 * Request shapes for the auth API.
 *
 * Every schema here is a whitelist. `role`, `departmentName` and `designation`
 * appear only in the administrator schemas — a startup completing its own
 * profile has no field through which to name a role, so an escalation attempt
 * is rejected by shape before any handler runs.
 */

export const updateOwnProfileSchema = z.object({
  body: z.object({
    displayName: z.string().trim().min(2).max(120),
  }),
});

export const inviteUserSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    role: z.enum(INVITABLE_ROLES),
    displayName: z.string().trim().min(2).max(120),
    departmentName: z.string().trim().min(2).max(160).optional(),
    designation: z.string().trim().min(2).max(160).optional(),
    redirectTo: z.string().url().optional(),
  }),
});

export const updateProvisioningSchema = z.object({
  body: z.object({
    role: z.enum(INVITABLE_ROLES).optional(),
    displayName: z.string().trim().min(2).max(120).optional(),
    departmentName: z.string().trim().min(2).max(160).nullable().optional(),
    designation: z.string().trim().min(2).max(160).nullable().optional(),
  }),
});

export const setAccessSchema = z.object({
  body: z.object({
    revoked: z.boolean(),
  }),
});
