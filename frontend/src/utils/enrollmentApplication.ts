// src/utils/enrollmentApplication.ts
// Pure mappers between the public application view / upsert payload and the
// browser-draft shape. Kept free of React and storage concerns.

import type {
  EnrollmentApplicationView,
  ApplicationDraft,
} from "@/types/enrollment-portal.types";
import type { UpsertApplicationPayload } from "@/api/public/enrollment-portal.api";

/** Maps a stored/verified application into the string-based draft shape. */
export function applicationToDraft(app: EnrollmentApplicationView): ApplicationDraft {
  return {
    first_name: app.first_name ?? "",
    middle_name: app.middle_name ?? "",
    last_name: app.last_name ?? "",
    age: app.age != null ? String(app.age) : "",
    address: app.address ?? "",
    contact_number: app.contact_number ?? "",
    last_school_graduated: app.last_school_graduated ?? "",
    program_id: app.program_id ?? "",
    course_id: app.course_id ?? "",
    strand_id: app.strand_id ?? "",
    level_id: app.level_id ?? "",
  };
}

/** Serializes the draft into the payload accepted by the public API. */
export function draftToApplicationPayload(draft: ApplicationDraft): UpsertApplicationPayload {
  return {
    first_name: draft.first_name.trim(),
    middle_name: draft.middle_name.trim() || undefined,
    last_name: draft.last_name.trim(),
    age: draft.age ? Number(draft.age) : undefined,
    address: draft.address.trim() || undefined,
    contact_number: draft.contact_number.trim() || undefined,
    last_school_graduated: draft.last_school_graduated.trim() || undefined,
    program_id: draft.program_id,
    course_id: draft.course_id || undefined,
    strand_id: draft.strand_id || undefined,
    level_id: draft.level_id,
  };
}