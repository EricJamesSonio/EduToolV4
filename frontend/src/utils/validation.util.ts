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
  .refine(
    (val) => /^[\p{L}\p{N} ]+$/u.test(val) && val.trim() !== "",
    "Name must contain only letters, numbers, and spaces"
  );

export const uuidSchema = z
  .string()
  .uuid("Invalid ID format");

export const dateSchema = z
  .string()
  .min(1, "Date is required")
  .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" });

// ─── Username rules ────────────────────────────────────────────────────────────

/** Letters and numbers only — no symbols, underscores, hyphens, or spaces. */
export const USERNAME_REGEX = /^[a-zA-Z0-9]+$/;

export const USERNAME_MAX_LENGTH = 30;

export const USERNAME_ERROR_MESSAGE =
  "Username can only contain letters and numbers (no symbols or spaces)";

/**
 * Shared username rule used when creating educator, student, and registrar
 * accounts so every account inherits the same restrictions.
 */
export const usernameSchema = z
  .string()
  .min(1, "Username is required")
  .max(
    USERNAME_MAX_LENGTH,
    `Username must be at most ${USERNAME_MAX_LENGTH} characters`
  )
  .regex(USERNAME_REGEX, USERNAME_ERROR_MESSAGE);

/** Returns an error message for an invalid username, or null when valid. */
export function validateUsername(username: string): string | null {
  const result = usernameSchema.safeParse(username);
  return result.success
    ? null
    : (result.error.issues[0]?.message ?? USERNAME_ERROR_MESSAGE);
}

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