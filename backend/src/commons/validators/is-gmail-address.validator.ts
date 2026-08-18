// src/commons/validators/is-gmail-address.validator.ts
//
// Reusable class-validator decorator enforcing a strict Gmail-only address.
// Used by the admin account-request flow and retrofitted onto the
// Enrollment Portal's personal_email capture.

import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsGmailAddress(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isGmailAddress',
      target: object.constructor,
      propertyName,
      options: {
        message: 'Only @gmail.com addresses are accepted.',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          return (
            typeof value === 'string' && /^[^\s@]+@gmail\.com$/i.test(value)
          );
        },
      },
    });
  };
}
