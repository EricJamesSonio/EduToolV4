All steps pass. Lookup worked at the correct path /enroll/lookup/SC0L (public, returns only name/status/code — no PII).
Summary — what we did so far
Endpoint flow (/enroll/:orgSlug/:periodToken), all verified end-to-end:

1. GET portal — org, school year, period, and programs with a conditional tree: college → courses, shs → strands, all others (daycare/kinder/elementary/jhs) → levels only. Correct per mapping.
2. POST otp + POST otp/verify → returns signed session token + mode: create|edit.
3. POST application (create) → validates selection, blocks duplicates with 409, 201 + application code.
4. GET lookup/:code (top-level, public) → name + status + code only.
5. Re-verify → mode: edit + appId; PATCH switches selections (strand/course) correctly.
6. Lock flow → edit blocked with 400 after status locked (expanded to include course/strand/level lock checks).
   Notable fixes along the way:

- Portal ->prorogation corrected to condomial (course vs strand vs level) based on program type.
- OTP/period sex via raw pg vs Prisma have a timezone/discipline normalization issue — test periods are created through the app's Prisma client to stay UTC-consistent (documented but unresolved in production seeding).
  The remaining pieces we haven't exercised yet (opportunities to explore next): gender, meeting PoI/phase-2 seasonality, and the final commitment step. Want me to continue testing those, or is this a good stopping point?
