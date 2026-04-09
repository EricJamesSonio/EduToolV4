Let me check what's DONE ✅ vs TODO ⏳:

DONE ✅
Types:

✅ grading-scheme.types.ts - removed isDefault, has classId, templateId
✅ grading-scheme-template.types.ts - created with all required types
✅ subject.types.ts - already aligned (no educator_id)
✅ semester.types.ts - ProgramSemesterAssignment uses program_id

API:

✅ grading-scheme.api.ts - has applyToClass() & applyToProgram()
✅ grading-scheme-template.api.ts - created with CRUD + apply methods
✅ subject.api.ts - updated, removed educatorId
✅ semester-template.api.ts - updated, removed programType

Hooks:

✅ useGradingSchemes.ts - updated, has useApplyTemplateToProgram()
✅ useGradingSchemeTemplates.ts - created with all CRUD hooks

Components:

✅ GradingSchemeTemplateList.tsx - created
✅ TemplateAssignmentPanel.tsx - created (program + class apply modes)
✅ TemplateFormDialog.tsx - created
✅ src/app/admin/grading-schemes/page.tsx - redesigned & modularized
✅ SemesterFormDialog.tsx - removed programType selector
✅ semester-settings/page.tsx - fixed program filtering

Backend:

✅ Grading scheme template controller - added apply/class & apply/program endpoints
✅ Grading scheme template service - added applyToClass() & applyToProgram() methods
✅ DTOs - added ApplyTemplateToClassDto & ApplyTemplateToProgramDto


TODO ⏳
Frontend:

⏳ SubjectDialog.tsx - Add course/strand conditionals + smart defaults
⏳ GradingSchemeComponentRow.tsx - Minor updates (already aligned though)
⏳ ClassesFilterBar.tsx - Remove school year filter
⏳ PersonalEmailCard.tsx - Create (for profile)
⏳ ProfileContent.tsx - Add personal_email field
⏳ useSchoolYear.ts - Add endSchoolYear() mutation
⏳ useSubject.ts - Remove educator_id from payload
⏳ profile.api.ts - Create if not exists

Backend:

⏳ Class controller/service - add endpoint to get classes by program
⏳ Profile module - add updatePersonalEmail endpoint


What should we tackle next? Pick one:

SubjectDialog.tsx - add course/strand conditionals + smart defaults
Profile/PersonalEmail - create card + update ProfileContent
Class filtering - remove school year filter
useSchoolYear hook - add endSchoolYear mutation
Backend Profile - add updatePersonalEmail endpoint