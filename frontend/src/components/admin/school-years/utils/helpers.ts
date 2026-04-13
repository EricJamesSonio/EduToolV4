// frontend/src/app/admin/school-years/helpers.ts

import { isAxiosError } from "axios";

export function isShortDurationError(err: unknown): boolean {
  return (
    isAxiosError(err) &&
    err.response?.data?.error === "SHORT_DURATION_WARNING"
  );
}