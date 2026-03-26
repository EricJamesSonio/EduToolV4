import { z } from "zod";

// ─── Primitives ───────────────────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name must be 100 characters or fewer")
  .regex(/^[\p{L}\s'\-\.]+$/u, "Name contains invalid characters");

export const uuidSchema = z
  .string()
  .uuid("Invalid ID format");

export const dateSchema = z
  .string()
  .min(1, "Date is required")
  .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" });

export const percentageSchema = z
  .number()
  .min(0, "Must be at least 0")
  .max(100, "Must be at most 100");

// ─── Composite schemas ────────────────────────────────────────────────────────

/** Used on the login form */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/** Used when creating admin or educator accounts */
export const createAccountSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
});

export type CreateAccountFormValues = z.infer<typeof createAccountSchema>;

/** Generic date range used in calendar, semester, report filters */
export const dateRangeSchema = z
  .object({
    startDate: dateSchema,
    endDate: dateSchema,
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export type DateRangeFormValues = z.infer<typeof dateRangeSchema>;