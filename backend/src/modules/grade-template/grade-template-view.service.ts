import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { loadWorkbook } from './grade-template.workbook';
import { renderSheet } from './grade-template-view.util';

// One load never returns more than this many rows, so a huge sheet cannot
// freeze the browser. Longer sheets are read in steps of this size.
const MAX_ROWS_PER_LOAD = 5000;

function toInt(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const n = Number(value);
  return Number.isInteger(n) ? n : fallback;
}

@Injectable()
export class GradeTemplateViewService {
  constructor(private readonly db: DatabaseService) {}

  async view(
    orgId: string,
    id: string,
    query: { sheet?: string; offset?: string; limit?: string },
  ) {
    const row = await this.db.gradeTemplate.findFirst({
      where: { id, org_id: orgId },
      select: { file_data: true },
    });
    if (!row) throw new NotFoundException('Grade template not found.');

    let wb;
    try {
      wb = await loadWorkbook(Buffer.from(row.file_data));
    } catch {
      throw new BadRequestException('The stored workbook could not be read.');
    }

    const sheetInfo = wb.worksheets.map((w) => ({
      name: w.name,
      rowCount: w.rowCount,
    }));
    if (sheetInfo.length === 0) {
      throw new BadRequestException('The workbook has no sheets.');
    }
    const sheets = sheetInfo.map((s) => s.name);
    const name =
      query.sheet && sheets.includes(query.sheet) ? query.sheet : sheets[0];
    const ws = wb.getWorksheet(name);
    if (!ws) throw new NotFoundException('That sheet is not in the workbook.');

    const offset = Math.max(0, toInt(query.offset, 0));
    const limit = Math.min(
      MAX_ROWS_PER_LOAD,
      Math.max(1, toInt(query.limit, 100)),
    );

    return {
      sheets,
      sheetInfo,
      sheetName: name,
      offset,
      limit,
      ...renderSheet(ws, offset, limit),
    };
  }
}