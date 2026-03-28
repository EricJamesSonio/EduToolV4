import { Injectable, NotFoundException } from '@nestjs/common';
import { GradeRepository } from '../grade/grade.repository';
import PDFDocument from 'pdfkit';

interface SchemeComponent {
  name: string;
  type: string;   // explicit field — no more name.toLowerCase() fallback
  weight: number;
}

@Injectable()
export class ExportService {
  constructor(private readonly gradeRepo: GradeRepository) {}

  // ── GET /classes/:classId/export/csv ───────────────────────────────────────

  async buildClassCsv(classId: string, orgId: string): Promise<string> {
    const cls = await this.gradeRepo.findClassWithSubject(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    const terms = await this.gradeRepo.findTermsBySemester(cls.semester_id);
    const scheme = await this.gradeRepo.findGradingSchemeForClass(classId, orgId);
    const components = (scheme?.components ?? []) as SchemeComponent[];
    const enrolledStudentIds: string[] = cls.enrollments.map((e: any) => e.student_id);

    // Build header row
    const termHeaders: string[] = [];
    for (const term of terms) {
      for (const comp of components) {
        termHeaders.push(`${term.name} - ${comp.name}`);
      }
      termHeaders.push(`${term.name} - Final Score`);
      termHeaders.push(`${term.name} - Final Grade`);
    }

    const headers = ['Student ID', 'Full Name', ...termHeaders, 'Remark'];
    const rows: string[][] = [headers];

    for (const studentId of enrolledStudentIds) {
      const profile = await this.gradeRepo['db'].profile.findFirst({
        where: { account: { id: studentId } },
        select: { full_name: true, metadata: true },
      });

      const meta = (profile?.metadata as Record<string, any>) ?? {};
      const fullName = profile?.full_name ?? 'Unknown';
      const studentIdLabel = meta.studentId ?? studentId;

      const row: string[] = [studentIdLabel, fullName];
      let overallRemark = '';

      for (const term of terms) {
        const [submissions, manualScores, grade] = await Promise.all([
          this.gradeRepo.findSubmissionsForTerm(classId, term.id, orgId),
          this.gradeRepo.findManualScores(classId, term.id, orgId, studentId),
          this.gradeRepo.findByStudent(studentId, classId, term.id, orgId),
        ]);

        const studentSubs = submissions.filter(
          (s: any) => s.student_id === studentId,
        );

        for (const comp of components) {
          if (comp.type === 'manual') {
            // Match by component type — explicit, no name fallback
            const manual = manualScores.find(
              (m: any) => m.category === comp.type,
            );
            row.push(manual ? String(manual.score) : '');
          } else {
            const compSubs = studentSubs.filter(
              (s: any) => s.assessment.type === comp.type,
            );
            if (compSubs.length === 0) {
              row.push('');
            } else {
              const earned = compSubs.reduce(
                (sum: number, s: any) => sum + (s.manual_score ?? s.score ?? 0),
                0,
              );
              const total = compSubs.reduce(
                (sum: number, s: any) => sum + s.assessment.total_items,
                0,
              );
              row.push(`${earned}/${total}`);
            }
          }
        }

        row.push(grade ? String(grade.final_score) : '');
        row.push(grade ? grade.final_grade : '');
        if (grade) overallRemark = grade.final_grade;
      }

      row.push(overallRemark);
      rows.push(row);
    }

    return rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }

  // ── GET /classes/:classId/students/:studentId/card ─────────────────────────

  async buildClassCard(
    classId: string,
    studentId: string,
    orgId: string,
  ): Promise<Buffer> {
    const cls = await this.gradeRepo.findClassWithSubject(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    const enrollment = cls.enrollments.find(
      (e: any) => e.student_id === studentId,
    );
    if (!enrollment) throw new NotFoundException('Student not enrolled in this class.');

    const terms = await this.gradeRepo.findTermsBySemester(cls.semester_id);
    const scheme = await this.gradeRepo.findGradingSchemeForClass(classId, orgId);
    const components = (scheme?.components ?? []) as SchemeComponent[];

    const profile = await this.gradeRepo['db'].profile.findFirst({
      where: { account: { id: studentId } },
      select: { full_name: true, metadata: true },
    });
    const meta = (profile?.metadata as Record<string, any>) ?? {};
    const fullName = profile?.full_name ?? 'Unknown';
    const studentIdLabel = meta.studentId ?? studentId;

    const educatorProfile = await this.gradeRepo['db'].profile.findFirst({
      where: { account: { id: cls.educator_id } },
      select: { full_name: true },
    });

    const subjectRecord = await this.gradeRepo['db'].subject.findFirst({
      where: { id: cls.subject_id },
      select: { name: true },
    });

    const schoolYear = await this.gradeRepo['db'].schoolYear.findFirst({
      where: { id: cls.school_year_id },
      select: { name: true },
    });

    const org = await this.gradeRepo['db'].organization.findFirst({
      where: { id: orgId },
      select: { name: true },
    });

    return this.buildClassCardSync(
      classId, studentId, orgId, cls,
      terms, components,
      fullName, studentIdLabel,
      educatorProfile?.full_name ?? '',
      subjectRecord?.name ?? '',
      schoolYear?.name ?? '',
      org?.name ?? 'EduTool',
    );
  }

  // ── PDF builder (fully sync after data fetch) ──────────────────────────────

  private async buildClassCardSync(
    classId: string,
    studentId: string,
    orgId: string,
    cls: any,
    terms: any[],
    components: SchemeComponent[],
    fullName: string,
    studentIdLabel: string,
    educatorName: string,
    subjectName: string,
    schoolYearName: string,
    orgName: string,
  ): Promise<Buffer> {
    const termData = await Promise.all(
      terms.map(async (term) => {
        const [submissions, manualScores, grade] = await Promise.all([
          this.gradeRepo.findSubmissionsForTerm(classId, term.id, orgId),
          this.gradeRepo.findManualScores(classId, term.id, orgId, studentId),
          this.gradeRepo.findByStudent(studentId, classId, term.id, orgId),
        ]);
        return {
          term,
          submissions: submissions.filter((s: any) => s.student_id === studentId),
          manualScores,
          grade,
        };
      }),
    );

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // ── Header ────────────────────────────────────────────────────────────
      doc.fontSize(16).font('Helvetica-Bold').text(orgName, { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Class Grade Card', { align: 'center' });
      doc.fontSize(10).text(`School Year: ${schoolYearName}`, { align: 'center' });
      doc.moveDown(1);

      // ── Student info ──────────────────────────────────────────────────────
      doc.fontSize(10).font('Helvetica-Bold').text('Student Information');
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(10);
      doc.text(`Name: ${fullName}     Student ID: ${studentIdLabel}`);
      doc.text(`Subject: ${subjectName}     Educator: ${educatorName}`);
      doc.moveDown(1);

      // ── Term grades ───────────────────────────────────────────────────────
      for (const { term, submissions, manualScores, grade } of termData) {
        doc.fontSize(10).font('Helvetica-Bold').text(term.name);
        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(0.3);
        doc.font('Helvetica').fontSize(9);

        for (const comp of components) {
          let scoreText = 'N/A';

          if (comp.type === 'manual') {
            // Use comp.type for exact match — no name.toLowerCase() guessing
            const manual = manualScores.find(
              (m: any) => m.category === comp.type,
            );
            scoreText = manual ? `${manual.score}` : 'N/A';
          } else {
            const compSubs = submissions.filter(
              (s: any) => s.assessment.type === comp.type,
            );
            if (compSubs.length > 0) {
              const earned = compSubs.reduce(
                (sum: number, s: any) => sum + (s.manual_score ?? s.score ?? 0),
                0,
              );
              const total = compSubs.reduce(
                (sum: number, s: any) => sum + s.assessment.total_items,
                0,
              );
              scoreText = `${earned} / ${total}`;
            }
          }

          doc.text(
            `  ${comp.name} (${comp.weight}%):  ${scoreText}`,
            { indent: 10 },
          );
        }

        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text(
          `  Final Score: ${grade ? grade.final_score : 'N/A'}   ` +
          `Final Grade: ${grade ? grade.final_grade : 'N/A'}`,
          { indent: 10 },
        );
        doc.moveDown(0.8);
      }

      // ── Overall ───────────────────────────────────────────────────────────
      const lastGrade = termData[termData.length - 1]?.grade;
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(
        `Overall Grade: ${lastGrade?.final_grade ?? 'N/A'}   ` +
        `Remark: ${lastGrade?.final_grade ?? 'N/A'}`,
      );

      doc.end();
    });
  }
}