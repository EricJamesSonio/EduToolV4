import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ClassRepository } from '../class/class.repository';
import { SemesterTemplateRepository } from '../semester-template/semester-template.repository';

type WeekSlot = {
  label: string;
  value: number;
  globalWeek: number;
  termWeek: number;
  semesterWeek: number;
  termName: string;
  termId: string;
  semesterName: string;
  semesterIndex: number;
  date: string;
};

@Injectable()
export class LessonWeekStructureService {
  constructor(
    private readonly classRepo: ClassRepository,
    private readonly semesterTemplateRepo: SemesterTemplateRepository,
  ) {}

  async getWeekStructure(classId: string, orgId: string): Promise<WeekSlot[]> {
    const cls = await this.classRepo.findById(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    if (!cls.schedules || cls.schedules.length === 0) {
      throw new BadRequestException('Class has no schedule configured.');
    }

    const classWeekday = cls.schedules[0].weekday;

    const subject = await this.classRepo['db'].subject.findFirst({
      where: { id: cls.subject_id },
      select: { program_id: true },
    });

    if (!subject?.program_id) {
      throw new BadRequestException(
        'Class subject is not linked to a program.',
      );
    }

    const assignment = await this.semesterTemplateRepo.findAssignmentByProgram(
      subject.program_id,
      orgId,
    );

    if (!assignment) {
      throw new BadRequestException(
        'No semester template assigned to this program.',
      );
    }

    const termDatesMap = new Map<string, { start: Date; end: Date }>();

    for (const td of (assignment as any).termDates ?? []) {
      termDatesMap.set(td.term_id, {
        start: new Date(td.start_date),
        end: new Date(td.end_date),
      });
    }

    const result: WeekSlot[] = [];

    const semesters = (assignment.template.semesters ?? []).sort(
      (a: any, b: any) => a.order_index - b.order_index,
    );

    let classSemesterStart: Date | null = null;
    let classSemesterEnd: Date | null = null;
    if (cls.semester_id) {
      const actualSem = await this.classRepo['db'].semester.findUnique({
        where: { id: cls.semester_id },
        select: { start_date: true, end_date: true },
      });
      if (actualSem) {
        classSemesterStart = actualSem.start_date;
        classSemesterEnd = actualSem.end_date;
      }
    }

    let globalWeek = 1;

    for (let si = 0; si < semesters.length; si++) {
      const sem = semesters[si];

      if (classSemesterStart && classSemesterEnd) {
        const semTermDates = (sem.terms ?? [])
          .map((t: any) => termDatesMap.get(t.id))
          .filter(Boolean) as Array<{ start: Date; end: Date }>;

        const semStart =
          semTermDates.length > 0
            ? new Date(Math.min(...semTermDates.map((d) => d.start.getTime())))
            : null;
        const semEnd =
          semTermDates.length > 0
            ? new Date(Math.max(...semTermDates.map((d) => d.end.getTime())))
            : null;

        if (
          !semStart ||
          !semEnd ||
          semEnd < classSemesterStart ||
          semStart > classSemesterEnd
        )
          continue;
      }

      const terms = (sem.terms ?? []).sort(
        (a: any, b: any) => a.order_index - b.order_index,
      );

      let semesterWeek = 1;

      for (const term of terms) {
        const dates = termDatesMap.get(term.id);

        if (!dates) {
          throw new BadRequestException(
            `Term "${term.name}" in semester "${sem.name}" has no date range configured.`,
          );
        }

        const occurrences = this.getWeekdayOccurrences(
          dates.start,
          dates.end,
          classWeekday,
        );

        let termWeek = 1;

        for (const date of occurrences) {
          result.push({
            label: String(globalWeek),
            value: globalWeek,
            globalWeek,
            termWeek,
            semesterWeek,
            termName: term.name,
            termId: term.id,
            semesterName: sem.name,
            semesterIndex: si + 1,
            date: date.toISOString(),
          });

          globalWeek++;
          termWeek++;
          semesterWeek++;
        }
      }
    }

    return result;
  }

  private getWeekdayOccurrences(
    start: Date,
    end: Date,
    weekday: number,
  ): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);

    const diff = (weekday - current.getDay() + 7) % 7;
    current.setDate(current.getDate() + diff);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }

    return dates;
  }
}
