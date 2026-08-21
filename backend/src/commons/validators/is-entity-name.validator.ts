import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * Custom decorator that validates a name field:
 * - Trims whitespace
 * - Min length 1 (non-empty after trim)
 * - Max length 100
 * - Only letters, numbers, and spaces allowed (regex: ^[\p{L}\p{N} ]+$)
 * - Rejects whitespace-only values
 */
export function IsEntityName(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEntityName',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return true; // let required/other validators handle non-strings

          const trimmed = value.trim();
          if (trimmed.length === 0) return false;

          // Regex: letters, numbers, spaces only (unicode aware)
          const pattern = /^[\p{L}\p{N} ]+$/u;
          return pattern.test(trimmed);
        },
        defaultMessage(): string {
          return 'Name must contain only letters, numbers, and spaces';
        },
      },
    });
  };
}

/**
 * Helper: trim and normalize a name value
 * Returns the trimmed value, or undefined if empty/whitespace-only
 */
export function normalizeEntityName(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  return trimmed;
}

/**
 * Constraints available for the decorator
 */
export const IsEntityNameConstraints = {
  minLength: 1,
  maxLength: 100,
};