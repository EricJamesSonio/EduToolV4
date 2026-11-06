import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type ExcelJS from 'exceljs';
import { DatabaseService } from '@/core/database/database.provider';
import { loadWorkbook } from './grade-template.workbook';
import { renderSheet } from './grade-template-view.util';

// One load never returns more than this many rows, so a huge sheet cannot
// freeze the browser. Longer sheets are read in steps of this size.
const MAX_ROWS_PER_LOAD = 20000;

// A parsed workbook is kept briefly so switching sheets or paging does not
// re-read and re-parse the same file on every request.
const CACHE_TTL_MS = 60_000;
const CACHE_MAX = 2;

interface CacheEntry {
  updatedAt: number;
  at: number;
  promise: Promise<ExcelJS.Workbook>;
}

function toInt(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const n = Number(value);
  return Number.isInteger(n) ? n : fallback;
}

@Injectable()
export class GradeTemplateViewService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly db: DatabaseService) {}

  /**
   * Returns the parsed workbook for a template the org owns. The cheap
   * stamp lookup always runs (and enforces org scope); the file bytes are
   * only fetched and parsed when the cache has no fresh entry for that stamp.
   */
  private async open(orgId: string, id: string): Promise<ExcelJS.Workbook> {
    const meta = await this.db.gradeTemplate.findFirst({
      where: { id, org_id: orgId },
      select: { updated_at: true },
    });
    if (!meta) throw new NotFoundException('Grade template not found.');

    const stamp = meta.updated_at.getTime();
    const hit = this.cache.get(id);
    if (hit && hit.updatedAt === stamp && Date.now() - hit.at < CACHE_TTL_MS) {
      return hit.promise;
    }

    const promise = (async () => {
      const row = await this.db.gradeTemplate.findFirst({
        where: { id, org_id: orgId },
        select: { file_data: true },
      });
      if (!row) throw new NotFoundException('Grade template not found.');
      try {
        return await loadWorkbook(Buffer.from(row.file_data));
      } catch {
        throw new BadRequestException('The stored workbook could not be read.');
      }
    })();

    this.cache.delete(id);
    this.cache.set(id, { updatedAt: stamp, at: Date.now(), promise });
    promise.catch(() => {
      if (this.cache.get(id)?.promise === promise) this.cache.delete(id);
    });
    while (this.cache.size > CACHE_MAX) {
      const oldest = this.cache.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      this.cache.delete(oldest);
    }
    return promise;
  }

  private build(
    wb: ExcelJS.Workbook,
    name: string,
    offset: number,
    limit: number,
  ) {
    const ws = wb.getWorksheet(name);
    if (!ws) throw new NotFoundException('That sheet is not in the workbook.');
    const sheetInfo = wb.worksheets.map((w) => ({
      name: w.name,
      rowCount: w.rowCount,
    }));
    return {
      sheets: sheetInfo.map((s) => s.name),
      sheetInfo,
      sheetName: name,
      offset,
      limit,
      ...renderSheet(ws, offset, limit),
    };
  }

  async view(
    orgId: string,
    id: string,
    query: { sheet?: string; offset?: string; limit?: string },
  ) {
    const wb = await this.open(orgId, id);
    const names = wb.worksheets.map((w) => w.name);
    if (names.length === 0) {
      throw new BadRequestException('The workbook has no sheets.');
    }
    const name = query.sheet && names.includes(query.sheet) ? query.sheet : names[0];
    const offset = Math.max(0, toInt(query.offset, 0));
    const limit = Math.min(
      MAX_ROWS_PER_LOAD,
      Math.max(1, toInt(query.limit, 100)),
    );
    return this.build(wb, name, offset, limit);
  }

  /** Every sheet from offset 0 in one response: one request, one parse. */
  async viewAll(orgId: string, id: string) {
    const wb = await this.open(orgId, id);
    const names = wb.worksheets.map((w) => w.name);
    if (names.length === 0) {
      throw new BadRequestException('The workbook has no sheets.');
    }
    return {
      views: names.map((name) => this.build(wb, name, 0, MAX_ROWS_PER_LOAD)),
    };
  }
}