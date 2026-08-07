// src/modules/enrollment-portal/serializers.ts
//
// Maps a raw EnrollmentApplication row into the shape exposed to applicants
// after create/edit/verify. Kept separate so the service stays free of
// response-format shuffling.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resultToApplicationView(record: any) {
  return {
    id: record.id,
    application_code: record.application_code,
    first_name: record.first_name,
    middle_name: record.middle_name,
    last_name: record.last_name,
    age: record.age,
    address: record.address,
    contact_number: record.contact_number,
    last_school_graduated: record.last_school_graduated,
    program_id: record.program_id,
    course_id: record.course_id,
    strand_id: record.strand_id,
    level_id: record.level_id,
    status: record.status,
    submitted_at: record.submitted_at,
    updated_at: record.updated_at,
  };
}