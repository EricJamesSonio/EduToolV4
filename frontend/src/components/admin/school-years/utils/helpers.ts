import { isAxiosError } from "axios";

interface ApiErrorBody {
  error?: unknown;
  message?: unknown;
}

export function isShortDurationError(err: unknown): boolean {
  return (
    isAxiosError(err) &&
    err.response?.data?.error === "SHORT_DURATION_WARNING"
  );
}

export function getSchoolYearOverlapMessage(err: unknown): string | null {
  if (!isAxiosError<ApiErrorBody>(err)) return null;

  const data = err.response?.data;
  if (data?.error !== "SCHOOL_YEAR_OVERLAP") return null;

  return typeof data.message === "string"
    ? data.message
    : "The selected dates overlap with an existing school year.";
}