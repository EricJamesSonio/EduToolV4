import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type ExcelJS from 'exceljs';
import { DatabaseService } from '@/core/database/database.provider';
import { GradeRepository } from '../grade/grade.repository';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  SaveGradeTemplateMappingDto,
  UploadGradeTemplateDto,
} from './dto/grade-template.dto';
import {
  applyFillOps,
  buildEducatorCopy,
  detectLayouts,
  FillClass,
  FillPlan,
  GradeRangeLite,
  idKeyOf,
  layoutToMapping,
  loadWorkbook,
  nameKeyOf,
  normalizeHeader,
  planFills,
  readColumns,
  readGrid,
  sanitizeMapping,
  SheetMapping,
  summarizeWorkbook,
  TemplateConfig,
  writeWorkbook,
} from './grade-template.workbook';

const META_SELECT = {
  id: true,
  name: true,
  file_name: true,
  school_year_id: true,
  program_id: true,
  uploaded_by: true,
  created_at: true,
  updated_at: true,
  _count: { select: { submissions: true } },
} as const;

const CLASS_SELECT = {
  id: true,
  section_id: true,
  school_year_id: true,
  semester_id: true,
  subject: {
    select: {
      id: true,
      name: true,
      code: true,
      program_id: true,
      course: { select: { program_id: true } },
      strand: { select: { program_id: true } },
      level: { select: { program_id: true } },
    },
  },
} as const;

const SEMESTER_NOT_ENDED =
  'Grades can only be submitted at the end of the semester.';

interface ClassRow {
  id: string;
  section_id: string | null;
  school_year_id: string;
  semester_id: string;
  subject: {
    id: string;
    name: string;
    code: string | null;
    program_id: string | null;
    course: { program_id: string } | null;
    strand: { program_id: string } | null;
    level: { program_id: string } | null;
  };
}

interface MetaRow {
  id: string;
  name: string;
  file_name: string;
  school_year_id: string;
  program_id: string | null;
  created_at: Date;
  updated_at: Date;
  _count: { submissions: number };
}

interface ClassWrite {
  classId: string;
  subjectName: string;
  rowsWritten: number;
  ungraded: number;
  unmatched: number;
}

interface MasterWrite {
  classes: ClassWrite[];
  ambiguousRows: number;
}

function resolveProgramId(subject: ClassRow['subject']): string | null {
  return (
    subject.program_id ??
    subject.course?.program_id ??
    subject.strand?.program_id ??
    subject.level?.program_id ??
    null
  );
}

function appliesTo(
  template: { program_id: string | null },
  cls: ClassRow,
): boolean {
  return (
    template.program_id === null ||
    resolveProgramId(cls.subject) === template.program_id
  );
}

function stripExt(name: string): string {
  return name.replace(/\.xlsx$/i, '');
}

function splitAliases(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => normalizeHeader(s))
    .filter(Boolean);
}

function parseConfig(raw: unknown): TemplateConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const r = raw as Record<string, unknown>;
  const list = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  const mapping: Record<string, SheetMapping> = {};
  if (r.mapping && typeof r.mapping === 'object' && !Array.isArray(r.mapping)) {
    for (const [name, value] of Object.entries(
      r.mapping as Record<string, unknown>,
    )) {
      const parsed = sanitizeMapping(value);
      if (typeof parsed !== 'string') mapping[name] = parsed;
    }
  }
  return {
    idHeaders: list(r.idHeaders),
    nameHeaders: list(r.nameHeaders),
    mapping,
  };
}

function toInt(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const n = Number(value);
  return Number.isInteger(n) ? n : fallback;
}

@Injectable()
export class GradeTemplateService {
  constructor(
    private readonly db: DatabaseService,
    private readonly gradeRepo: GradeRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  // ───────────────────────── ADMIN ─────────────────────────

  async listPrograms(orgId: string, schoolYearId: string) {
    return this.db.program.findMany({
      where: { org_id: orgId, school_year_id: schoolYearId },
      select: { id: true, name: true, type: true },
      orderBy: { name: 'asc' },
    });
  }

  async upload(
    orgId: string,
    actorId: string,
    dto: UploadGradeTemplateDto,
    file: Express.Multer.File | undefined,
  ) {
    if (!file?.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Attach the template as an .xlsx file.');
    }
    // .xlsx is a zip archive, so it starts with "PK".
    if (file.buffer[0] !== 0x50 || file.buffer[1] !== 0x4b) {
      throw new BadRequestException(
        'This is not a valid .xlsx workbook. Re-save it as .xlsx (not .xls) and try again.',
      );
    }

    const year = await this.db.schoolYear.findFirst({
      where: { id: dto.schoolYearId, org_id: orgId },
      select: { id: true },
    });
    if (!year) throw new NotFoundException('School year not found.');

    const programId = dto.programId?.trim() ? dto.programId.trim() : null;
    if (programId) {
      const program = await this.db.program.findFirst({
        where: {
          id: programId,
          org_id: orgId,
          school_year_id: dto.schoolYearId,
        },
        select: { id: true },
      });
      if (!program) {
        throw new NotFoundException(
          'Department not found in this school year.',
        );
      }
    }

    const config: TemplateConfig = {
      idHeaders: splitAliases(dto.idHeader),
      nameHeaders: splitAliases(dto.nameHeader),
    };

    let summary;
    try {
      const wb = await loadWorkbook(file.buffer);
      summary = summarizeWorkbook(wb, detectLayouts(wb, config));
    } catch {
      throw new BadRequestException('The workbook could not be read.');
    }

    const existing = await this.db.gradeTemplate.findFirst({
      where: {
        org_id: orgId,
        school_year_id: dto.schoolYearId,
        program_id: programId,
      },
      select: { id: true },
    });
    if (existing && dto.replace !== 'true') {
      throw new ConflictException(
        'A template already exists for this school year and department. Tick "Replace existing" to overwrite it (grades already collected in it will be lost).',
      );
    }

    const create = this.db.gradeTemplate.create({
      data: {
        org_id: orgId,
        school_year_id: dto.schoolYearId,
        program_id: programId,
        name: dto.name?.trim() || stripExt(file.originalname),
        file_name: file.originalname,
        file_data: file.buffer,
        config: config as unknown as Prisma.InputJsonValue,
        uploaded_by: actorId,
      },
      select: { id: true, name: true },
    });

    const created = existing
      ? (
          await this.db.$transaction([
            this.db.gradeTemplate.deleteMany({
              where: { id: existing.id, org_id: orgId },
            }),
            create,
          ])
        )[1]
      : await create;

    this.auditLog
      .logAdminAction({
        orgId,
        actorId,
        action: 'grade_template_uploaded',
        entityType: 'grade_template',
        entityId: created.id,
        metadata: {
          schoolYearId: dto.schoolYearId,
          programId,
          replaced: !!existing,
          studentRows: summary.totalStudentRows,
        },
      })
      .catch(() => {});

    return { id: created.id, name: created.name, analysis: summary };
  }

  async list(orgId: string, schoolYearId?: string) {
    const rows = (await this.db.gradeTemplate.findMany({
      where: {
        org_id: orgId,
        ...(schoolYearId ? { school_year_id: schoolYearId } : {}),
      },
      select: META_SELECT,
      orderBy: { created_at: 'desc' },
    })) as MetaRow[];
    const names = await this.nameMaps(orgId, rows);
    return rows.map((r) => this.toMeta(r, names));
  }

  async analysis(orgId: string, id: string) {
    const { wb, config } = await this.openTemplate(orgId, id);
    return summarizeWorkbook(wb, detectLayouts(wb, config));
  }

  /** Raw sheet contents, a page of rows at a time, for the admin's own check. */
  async preview(
    orgId: string,
    id: string,
    query: { sheet?: string; offset?: string; limit?: string },
  ) {
    const { wb, config } = await this.openTemplate(orgId, id);
    const layouts = detectLayouts(wb, config);
    const sheets = this.sheetList(wb, layouts, config);
    const name = this.pickSheet(wb, layouts, query.sheet);
    const ws = wb.getWorksheet(name);
    if (!ws) throw new NotFoundException('That sheet is not in the workbook.');

    const offset = Math.max(0, toInt(query.offset, 0));
    const limit = Math.min(200, Math.max(1, toInt(query.limit, 60)));
    const grid = readGrid(ws, offset, limit);
    const layout = layouts.find((l) => l.sheetName === name);

    return {
      sheets,
      sheetName: name,
      offset,
      limit,
      rowCount: grid.rowCount,
      colCount: grid.colCount,
      rows: grid.rows,
      mapping: layout ? layoutToMapping(layout) : null,
    };
  }

  /** Header names of one sheet plus the auto-detected and saved mappings. */
  async mappingInfo(
    orgId: string,
    id: string,
    query: { sheet?: string; headerRow?: string },
  ) {
    const { wb, config } = await this.openTemplate(orgId, id);
    const layouts = detectLayouts(wb, config);
    const sheets = this.sheetList(wb, layouts, config);
    const name = this.pickSheet(wb, layouts, query.sheet);
    const ws = wb.getWorksheet(name);
    if (!ws) throw new NotFoundException('That sheet is not in the workbook.');

    const autoLayout = detectLayouts(wb, { ...config, mapping: {} }).find(
      (l) => l.sheetName === name,
    );
    const effective = layouts.find((l) => l.sheetName === name);
    const requested = toInt(query.headerRow, 0);
    const headerRow =
      requested >= 1 ? requested : (effective?.headerRow ?? 1);
    const columns = readColumns(ws, headerRow);

    return {
      sheets,
      sheetName: name,
      rowCount: ws.rowCount,
      colCount: columns.length,
      headerRow,
      columns,
      auto: autoLayout ? layoutToMapping(autoLayout) : null,
      saved: config.mapping?.[name] ?? null,
      effective: effective ? layoutToMapping(effective) : null,
    };
  }

  async saveMapping(
    orgId: string,
    actorId: string,
    id: string,
    dto: SaveGradeTemplateMappingDto,
  ) {
    const { wb, config } = await this.openTemplate(orgId, id);
    const ws = wb.getWorksheet(dto.sheetName);
    if (!ws) throw new NotFoundException('That sheet is not in the workbook.');

    const mapping: Record<string, SheetMapping> = { ...(config.mapping ?? {}) };
    if (dto.mapping == null) {
      delete mapping[dto.sheetName];
    } else {
      const parsed = sanitizeMapping(dto.mapping);
      if (typeof parsed === 'string') throw new BadRequestException(parsed);
      if (parsed.headerRow > ws.rowCount) {
        throw new BadRequestException(
          'The header row is beyond the end of the sheet.',
        );
      }
      mapping[dto.sheetName] = parsed;
    }

    const next: TemplateConfig = { ...config, mapping };
    await this.db.gradeTemplate.update({
      where: { id },
      data: { config: next as unknown as Prisma.InputJsonValue },
    });

    this.auditLog
      .logAdminAction({
        orgId,
        actorId,
        action: 'grade_template_mapping_saved',
        entityType: 'grade_template',
        entityId: id,
        metadata: { sheet: dto.sheetName, cleared: dto.mapping == null },
      })
      .catch(() => {});

    return summarizeWorkbook(wb, detectLayouts(wb, next));
  }

  async master(orgId: string, id: string) {
    const row = await this.db.gradeTemplate.findFirst({
      where: { id, org_id: orgId },
      select: { file_data: true, file_name: true },
    });
    if (!row) throw new NotFoundException('Grade template not found.');
    return { fileName: row.file_name, buffer: Buffer.from(row.file_data) };
  }

  async progress(orgId: string, id: string) {
    const template = await this.db.gradeTemplate.findFirst({
      where: { id, org_id: orgId },
      select: { id: true, school_year_id: true, program_id: true },
    });
    if (!template) throw new NotFoundException('Grade template not found.');

    const [classRows, submissions] = await Promise.all([
      this.db.class.findMany({
        where: {
          org_id: orgId,
          school_year_id: template.school_year_id,
          deleted_at: null,
        },
        select: { ...CLASS_SELECT, educator_id: true },
      }),
      this.db.gradeTemplateSubmission.findMany({
        where: { org_id: orgId, template_id: id },
      }),
    ]);
    const classes = (classRows as unknown as Array<
      ClassRow & { educator_id: string }
    >).filter((c) => appliesTo(template, c));

    const educatorIds = [...new Set(classes.map((c) => c.educator_id))];
    const sectionIds = [
      ...new Set(
        classes.map((c) => c.section_id).filter((x): x is string => !!x),
      ),
    ];
    const [profiles, sections] = await Promise.all([
      educatorIds.length
        ? this.db.profile.findMany({
            where: { account_id: { in: educatorIds } },
            select: { account_id: true, full_name: true },
          })
        : [],
      sectionIds.length
        ? this.db.section.findMany({
            where: { id: { in: sectionIds } },
            select: { id: true, name: true },
          })
        : [],
    ]);
    const educatorName = new Map(profiles.map((p) => [p.account_id, p.full_name]));
    const sectionName = new Map(sections.map((s) => [s.id, s.name]));
    const subByClass = new Map(submissions.map((s) => [s.class_id, s]));

    const rows = classes.map((c) => {
      const sub = subByClass.get(c.id);
      return {
        classId: c.id,
        subjectName: c.subject.name,
        sectionName: c.section_id ? (sectionName.get(c.section_id) ?? null) : null,
        educatorName: educatorName.get(c.educator_id) ?? 'Unknown',
        status: sub ? ('submitted' as const) : ('pending' as const),
        submittedAt: sub ? sub.submitted_at : null,
        rowsWritten: sub?.rows_written ?? 0,
        ungraded: sub?.ungraded_count ?? 0,
        unmatched: sub?.unmatched_count ?? 0,
      };
    });
    rows.sort(
      (a, b) =>
        a.educatorName.localeCompare(b.educatorName) ||
        a.subjectName.localeCompare(b.subjectName),
    );
    return {
      total: rows.length,
      submitted: rows.filter((r) => r.status === 'submitted').length,
      rows,
    };
  }

  async remove(orgId: string, actorId: string, id: string) {
    const res = await this.db.gradeTemplate.deleteMany({
      where: { id, org_id: orgId },
    });
    if (res.count === 0) throw new NotFoundException('Grade template not found.');
    this.auditLog
      .logAdminAction({
        orgId,
        actorId,
        action: 'grade_template_deleted',
        entityType: 'grade_template',
        entityId: id,
      })
      .catch(() => {});
    return { deleted: true };
  }

  // ───────────────────────── EDUCATOR ─────────────────────────

  async listMine(orgId: string, educatorId: string, schoolYearId?: string) {
    const classes = (await this.db.class.findMany({
      where: {
        org_id: orgId,
        educator_id: educatorId,
        deleted_at: null,
        ...(schoolYearId ? { school_year_id: schoolYearId } : {}),
      },
      select: CLASS_SELECT,
    })) as unknown as ClassRow[];
    if (classes.length === 0) return [];

    const yearIds = [...new Set(classes.map((c) => c.school_year_id))];
    const templates = (await this.db.gradeTemplate.findMany({
      where: { org_id: orgId, school_year_id: { in: yearIds } },
      select: META_SELECT,
      orderBy: { created_at: 'desc' },
    })) as MetaRow[];
    if (templates.length === 0) return [];

    const [names, submissions, sections] = await Promise.all([
      this.nameMaps(orgId, templates),
      this.db.gradeTemplateSubmission.findMany({
        where: {
          org_id: orgId,
          educator_id: educatorId,
          template_id: { in: templates.map((t) => t.id) },
        },
      }),
      this.db.section.findMany({
        where: {
          id: {
            in: classes.map((c) => c.section_id).filter((x): x is string => !!x),
          },
        },
        select: { id: true, name: true },
      }),
    ]);
    const sectionName = new Map(sections.map((s) => [s.id, s.name]));
    const subKey = new Map(
      submissions.map((s) => [`${s.template_id}:${s.class_id}`, s]),
    );

    const out = [];
    for (const t of templates) {
      const matching = classes.filter(
        (c) => c.school_year_id === t.school_year_id && appliesTo(t, c),
      );
      if (matching.length === 0) continue;
      out.push({
        ...this.toMeta(t, names),
        classes: matching.map((c) => ({
          classId: c.id,
          subjectName: c.subject.name,
          sectionName: c.section_id ? (sectionName.get(c.section_id) ?? null) : null,
          submittedAt: subKey.get(`${t.id}:${c.id}`)?.submitted_at ?? null,
        })),
      });
    }
    return out;
  }

  // Always built from the current grades, so the educator's copy is up to
  // date every time it is downloaded.
  async downloadMine(orgId: string, educatorId: string, templateId: string) {
    const prepared = await this.prepare(orgId, educatorId, templateId);
    const wb = await loadWorkbook(prepared.fileData);
    const layouts = detectLayouts(wb, prepared.config);
    const plan = planFills(wb, layouts, prepared.fillClasses);
    if (this.countMatched(plan) === 0) {
      throw new BadRequestException(
        'None of your students were found in this template. Check that the students\' IDs in the workbook match their Student IDs in the system.',
      );
    }
    applyFillOps(wb, plan.ops);
    buildEducatorCopy(wb, layouts, plan);
    const buffer = await writeWorkbook(wb);
    return {
      fileName: `${stripExt(prepared.fileName)} - my classes.xlsx`,
      buffer,
    };
  }

  /** Writes every class of this educator whose semester has ended. */
  async submitMine(orgId: string, educatorId: string, templateId: string) {
    const prepared = await this.prepare(orgId, educatorId, templateId);
    const ended = await this.endedClassIds(orgId, prepared.classes);
    const eligible = prepared.fillClasses.filter((c) => ended.has(c.classId));
    if (eligible.length === 0) throw new ForbiddenException(SEMESTER_NOT_ENDED);

    const result = await this.writeToMaster(
      orgId,
      educatorId,
      templateId,
      eligible,
    );
    if (!result) {
      throw new BadRequestException(
        'None of your students were found in this template, so nothing was sent.',
      );
    }

    const totalRowsWritten = this.sumRows(result.classes);
    this.auditLog
      .logActivityEvent({
        orgId,
        actorId: educatorId,
        action: 'grade_template_submitted',
        entityType: 'grade_template',
        entityId: templateId,
        metadata: { classes: result.classes.length, rowsWritten: totalRowsWritten },
      })
      .catch(() => {});

    return {
      totalRowsWritten,
      ambiguousRows: result.ambiguousRows,
      classes: result.classes,
    };
  }

  /** What the Submit Grades dialog needs: window, templates and ungraded students. */
  async classSubmissionStatus(
    orgId: string,
    educatorId: string,
    classId: string,
  ) {
    const cls = await this.ownedClass(orgId, educatorId, classId);

    const [semester, templates, submissions, terms, enrollments, grades] =
      await Promise.all([
        this.db.semester.findFirst({
          where: { id: cls.semester_id, org_id: orgId },
          select: { name: true, end_date: true },
        }),
        this.templatesFor(orgId, cls),
        this.db.gradeTemplateSubmission.findMany({
          where: { org_id: orgId, class_id: cls.id },
          select: { submitted_at: true },
        }),
        this.gradeRepo.findTemplateTermsByClass(cls.id, orgId),
        this.db.enrollment.findMany({
          where: { org_id: orgId, class_id: cls.id, status: 'active' },
          select: { student_id: true },
        }),
        this.db.grade.findMany({
          where: { org_id: orgId, class_id: cls.id },
          select: { student_id: true, term_id: true },
        }),
      ]);

    const studentIds = [...new Set(enrollments.map((e) => e.student_id))];
    const profiles = await this.gradeRepo.findStudentProfiles(studentIds);

    const gradedTerms = new Map<string, Set<string>>();
    for (const g of grades) {
      const set = gradedTerms.get(g.student_id) ?? new Set<string>();
      set.add(g.term_id);
      gradedTerms.set(g.student_id, set);
    }

    const ungraded = studentIds
      .map((studentId) => {
        const done = gradedTerms.get(studentId);
        const missingTerms = terms
          .filter((t) => !done?.has(t.id))
          .map((t) => t.name);
        return {
          studentId,
          name: profiles.get(studentId)?.name ?? 'Unknown',
          code: profiles.get(studentId)?.code ?? '',
          missingTerms,
        };
      })
      .filter((s) => terms.length > 0 && s.missingTerms.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    const latest = submissions.reduce<Date | null>(
      (best, s) => (!best || s.submitted_at > best ? s.submitted_at : best),
      null,
    );

    return {
      classId: cls.id,
      semesterName: semester?.name ?? null,
      semesterEndDate: semester?.end_date ?? null,
      canSubmit: !!semester && Date.now() >= semester.end_date.getTime(),
      templateCount: templates.length,
      submittedAt: latest,
      totalStudents: studentIds.length,
      ungraded,
    };
  }

  /** Writes one class's current grades into every template that applies to it. */
  async submitClass(orgId: string, educatorId: string, classId: string) {
    const cls = await this.ownedClass(orgId, educatorId, classId);

    const ended = await this.endedClassIds(orgId, [cls]);
    if (!ended.has(cls.id)) throw new ForbiddenException(SEMESTER_NOT_ENDED);

    const templates = await this.templatesFor(orgId, cls);
    if (templates.length === 0) {
      throw new BadRequestException(
        'No grade template has been shared for this class yet.',
      );
    }

    const [fill] = await this.buildFillClasses(orgId, [cls]);

    let templatesUpdated = 0;
    let rowsWritten = 0;
    let ambiguousRows = 0;
    let ungraded = 0;
    let unmatched = 0;
    for (const template of templates) {
      const res = await this.writeToMaster(orgId, educatorId, template.id, [
        fill,
      ]);
      if (!res) continue;
      const written = res.classes[0];
      if (templatesUpdated === 0 && written) {
        ungraded = written.ungraded;
        unmatched = written.unmatched;
      }
      templatesUpdated += 1;
      rowsWritten += written?.rowsWritten ?? 0;
      ambiguousRows += res.ambiguousRows;
    }

    if (templatesUpdated === 0) {
      throw new BadRequestException(
        'None of this class\'s students were found in the grade template, so nothing was sent.',
      );
    }

    this.auditLog
      .logActivityEvent({
        orgId,
        actorId: educatorId,
        action: 'class_grades_submitted',
        entityType: 'class',
        entityId: classId,
        metadata: { templatesUpdated, rowsWritten, ungraded },
      })
      .catch(() => {});

    return { templatesUpdated, rowsWritten, ambiguousRows, ungraded, unmatched };
  }

  // ───────────────────────── INTERNALS ─────────────────────────

  private sumRows(classes: ClassWrite[]): number {
    return classes.reduce((n, c) => n + c.rowsWritten, 0);
  }

  private countMatched(plan: FillPlan): number {
    let n = 0;
    for (const set of plan.matchedStudents.values()) n += set.size;
    return n;
  }

  /**
   * Fills the master workbook for the given classes inside one transaction.
   * Returns null when none of their students were found in the template
   * (nothing is written in that case).
   */
  private async writeToMaster(
    orgId: string,
    educatorId: string,
    templateId: string,
    fillClasses: FillClass[],
  ): Promise<MasterWrite | null> {
    return this.db.$transaction(
      async (tx) => {
        // One writer at a time per master workbook, or concurrent submissions
        // would overwrite each other's changes.
        await tx.$executeRawUnsafe(
          'SELECT pg_advisory_xact_lock(hashtext($1))',
          `grade-template:${templateId}`,
        );
        const fresh = await tx.gradeTemplate.findFirst({
          where: { id: templateId, org_id: orgId },
          select: { file_data: true, config: true },
        });
        if (!fresh) throw new NotFoundException('Grade template not found.');

        const wb = await loadWorkbook(Buffer.from(fresh.file_data));
        const layouts = detectLayouts(wb, parseConfig(fresh.config));
        const plan = planFills(wb, layouts, fillClasses);
        if (this.countMatched(plan) === 0) return null;

        applyFillOps(wb, plan.ops);
        const out = await writeWorkbook(wb);
        await tx.gradeTemplate.update({
          where: { id: templateId },
          data: { file_data: out },
        });

        const classes: ClassWrite[] = fillClasses.map((c) => {
          const matched = plan.matchedStudents.get(c.classId)?.size ?? 0;
          const written = plan.writtenStudents.get(c.classId)?.size ?? 0;
          return {
            classId: c.classId,
            subjectName: c.subjectName,
            rowsWritten: plan.ops.filter((o) => o.classId === c.classId).length,
            ungraded: Math.max(0, matched - written),
            unmatched: Math.max(0, c.studentIds.length - matched),
          };
        });

        for (const c of classes) {
          await tx.gradeTemplateSubmission.upsert({
            where: {
              template_id_class_id: {
                template_id: templateId,
                class_id: c.classId,
              },
            },
            create: {
              org_id: orgId,
              template_id: templateId,
              class_id: c.classId,
              educator_id: educatorId,
              rows_written: c.rowsWritten,
              ungraded_count: c.ungraded,
              unmatched_count: c.unmatched,
            },
            update: {
              educator_id: educatorId,
              rows_written: c.rowsWritten,
              ungraded_count: c.ungraded,
              unmatched_count: c.unmatched,
              submitted_at: new Date(),
            },
          });
        }

        return { classes, ambiguousRows: plan.ambiguousRows };
      },
      { timeout: 30_000, maxWait: 10_000 },
    );
  }

  /** Class ids whose semester has reached its end date. */
  private async endedClassIds(
    orgId: string,
    classes: ClassRow[],
  ): Promise<Set<string>> {
    const semesterIds = [...new Set(classes.map((c) => c.semester_id))];
    if (semesterIds.length === 0) return new Set();
    const semesters = await this.db.semester.findMany({
      where: { org_id: orgId, id: { in: semesterIds } },
      select: { id: true, end_date: true },
    });
    const endAt = new Map(semesters.map((s) => [s.id, s.end_date.getTime()]));
    const now = Date.now();
    return new Set(
      classes
        .filter((c) => {
          const end = endAt.get(c.semester_id);
          return end !== undefined && now >= end;
        })
        .map((c) => c.id),
    );
  }

  private async ownedClass(
    orgId: string,
    educatorId: string,
    classId: string,
  ): Promise<ClassRow> {
    const cls = (await this.db.class.findFirst({
      where: {
        id: classId,
        org_id: orgId,
        educator_id: educatorId,
        deleted_at: null,
      },
      select: CLASS_SELECT,
    })) as unknown as ClassRow | null;
    if (!cls) throw new NotFoundException('Class not found.');
    return cls;
  }

  private async templatesFor(orgId: string, cls: ClassRow) {
    const templates = await this.db.gradeTemplate.findMany({
      where: { org_id: orgId, school_year_id: cls.school_year_id },
      select: { id: true, program_id: true },
    });
    return templates.filter((t) => appliesTo(t, cls));
  }

  private async openTemplate(
    orgId: string,
    id: string,
  ): Promise<{ wb: ExcelJS.Workbook; config: TemplateConfig }> {
    const row = await this.db.gradeTemplate.findFirst({
      where: { id, org_id: orgId },
      select: { file_data: true, config: true },
    });
    if (!row) throw new NotFoundException('Grade template not found.');
    try {
      const wb = await loadWorkbook(Buffer.from(row.file_data));
      return { wb, config: parseConfig(row.config) };
    } catch {
      throw new BadRequestException('The stored workbook could not be read.');
    }
  }

  private sheetList(
    wb: ExcelJS.Workbook,
    layouts: Array<{ sheetName: string }>,
    config: TemplateConfig,
  ) {
    const detected = new Set(layouts.map((l) => l.sheetName));
    return wb.worksheets.map((ws) => ({
      name: ws.name,
      detected: detected.has(ws.name),
      mapped: !!config.mapping?.[ws.name],
    }));
  }

  private pickSheet(
    wb: ExcelJS.Workbook,
    layouts: Array<{ sheetName: string }>,
    requested?: string,
  ): string {
    if (requested && wb.getWorksheet(requested)) return requested;
    const name = layouts[0]?.sheetName ?? wb.worksheets[0]?.name;
    if (!name) throw new BadRequestException('The workbook has no sheets.');
    return name;
  }

  private async prepare(orgId: string, educatorId: string, templateId: string) {
    const template = await this.db.gradeTemplate.findFirst({
      where: { id: templateId, org_id: orgId },
      select: {
        school_year_id: true,
        program_id: true,
        file_name: true,
        file_data: true,
        config: true,
      },
    });
    if (!template) throw new NotFoundException('Grade template not found.');

    const classes = (
      (await this.db.class.findMany({
        where: {
          org_id: orgId,
          educator_id: educatorId,
          school_year_id: template.school_year_id,
          deleted_at: null,
        },
        select: CLASS_SELECT,
      })) as unknown as ClassRow[]
    ).filter((c) => appliesTo(template, c));
    if (classes.length === 0) {
      throw new BadRequestException(
        'You have no classes that belong to this template\'s school year and department.',
      );
    }

    return {
      fileName: template.file_name,
      fileData: Buffer.from(template.file_data),
      config: parseConfig(template.config),
      classes,
      fillClasses: await this.buildFillClasses(orgId, classes),
    };
  }

  private async buildFillClasses(
    orgId: string,
    classes: ClassRow[],
  ): Promise<FillClass[]> {
    const classIds = classes.map((c) => c.id);
    const [enrollments, grades, termsPerClass] = await Promise.all([
      this.db.enrollment.findMany({
        where: { org_id: orgId, class_id: { in: classIds }, status: 'active' },
        select: { class_id: true, student_id: true },
      }),
      this.db.grade.findMany({
        where: { org_id: orgId, class_id: { in: classIds } },
        select: {
          class_id: true,
          student_id: true,
          term_id: true,
          final_score: true,
          final_grade: true,
        },
      }),
      Promise.all(
        classes.map((c) => this.gradeRepo.findTemplateTermsByClass(c.id, orgId)),
      ),
    ]);
    const profiles = await this.gradeRepo.findStudentProfiles([
      ...new Set(enrollments.map((e) => e.student_id)),
    ]);

    // Group once instead of filtering the full lists for every class.
    const enrolledByClass = new Map<string, string[]>();
    for (const e of enrollments) {
      const list = enrolledByClass.get(e.class_id) ?? [];
      list.push(e.student_id);
      enrolledByClass.set(e.class_id, list);
    }
    const gradesByClass = new Map<
      string,
      Map<string, { score: number; grade: string }>
    >();
    for (const g of grades) {
      const map = gradesByClass.get(g.class_id) ?? new Map();
      map.set(`${g.student_id}:${g.term_id}`, {
        score: g.final_score,
        grade: g.final_grade,
      });
      gradesByClass.set(g.class_id, map);
    }

    const scaleCache = new Map<string, GradeRangeLite[]>();
    const out: FillClass[] = [];

    for (let i = 0; i < classes.length; i++) {
      const cls = classes[i];
      const programId = resolveProgramId(cls.subject);
      const scaleKey = `${programId ?? ''}:${cls.school_year_id}`;
      if (!scaleCache.has(scaleKey)) {
        const scale = programId
          ? await this.gradeRepo.findGradingScale(
              programId,
              cls.school_year_id,
              orgId,
            )
          : null;
        scaleCache.set(
          scaleKey,
          scale && Array.isArray(scale.ranges)
            ? (scale.ranges as unknown as GradeRangeLite[])
            : [],
        );
      }

      const studentIds = [...new Set(enrolledByClass.get(cls.id) ?? [])];
      const byId = new Map<string, string>();
      const nameCount = new Map<string, number>();
      const nameOwner = new Map<string, string>();
      for (const sid of studentIds) {
        const profile = profiles.get(sid);
        const idKey = idKeyOf(profile?.code ?? '');
        if (idKey) byId.set(idKey, sid);
        const nameKey = nameKeyOf(profile?.name ?? '');
        if (nameKey) {
          nameCount.set(nameKey, (nameCount.get(nameKey) ?? 0) + 1);
          nameOwner.set(nameKey, sid);
        }
      }
      // Two students sharing a name cannot be told apart by name alone.
      const byName = new Map<string, string>();
      for (const [key, sid] of nameOwner) {
        if (nameCount.get(key) === 1) byName.set(key, sid);
      }

      const subjectKeys = [cls.subject.name, cls.subject.code ?? '']
        .map((s) => normalizeHeader(s))
        .filter((s) => s.length >= 3);

      out.push({
        classId: cls.id,
        subjectName: cls.subject.name,
        subjectKeys,
        terms: termsPerClass[i].map((t) => ({ id: t.id, name: t.name })),
        studentIds,
        byId,
        byName,
        grades: gradesByClass.get(cls.id) ?? new Map(),
        ranges: scaleCache.get(scaleKey) ?? [],
      });
    }
    return out;
  }

  private async nameMaps(
    orgId: string,
    rows: Array<{ school_year_id: string; program_id: string | null }>,
  ) {
    const yearIds = [...new Set(rows.map((r) => r.school_year_id))];
    const programIds = [
      ...new Set(rows.map((r) => r.program_id).filter((x): x is string => !!x)),
    ];
    const [years, programs] = await Promise.all([
      yearIds.length
        ? this.db.schoolYear.findMany({
            where: { org_id: orgId, id: { in: yearIds } },
            select: { id: true, name: true },
          })
        : [],
      programIds.length
        ? this.db.program.findMany({
            where: { org_id: orgId, id: { in: programIds } },
            select: { id: true, name: true },
          })
        : [],
    ]);
    return {
      years: new Map(years.map((y) => [y.id, y.name])),
      programs: new Map(programs.map((p) => [p.id, p.name])),
    };
  }

  private toMeta(
    row: MetaRow,
    names: { years: Map<string, string>; programs: Map<string, string> },
  ) {
    return {
      id: row.id,
      name: row.name,
      fileName: row.file_name,
      schoolYearId: row.school_year_id,
      schoolYearName: names.years.get(row.school_year_id) ?? '',
      programId: row.program_id,
      programName: row.program_id
        ? (names.programs.get(row.program_id) ?? null)
        : null,
      submissionCount: row._count.submissions,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}