import ExcelJS from 'exceljs';

/**
 * Pure workbook helpers for the grade-template feature. No database access:
 * the service feeds in already-loaded class data and gets back a plan of cell
 * writes, so the same plan can be applied to an educator's filtered copy and
 * to the admin's master workbook.
 */

export const MAX_COLS = 60;
const MAX_TERMS = 20;

export interface SheetMapping {
  headerRow: number;
  dataStartRow?: number | null;
  idCol: number | null;
  nameCols: number[];
  subjectCols: number[];
  termCols: Array<{ col: number; termIndex: number }>;
  finalCol: number | null;
  remarkCol: number | null;
  valueMode?: 'grade' | 'score' | null;
}

export interface TemplateConfig {
  idHeaders?: string[];
  nameHeaders?: string[];
  mapping?: Record<string, SheetMapping>;
}

export interface GradeRangeLite {
  minPercent: number;
  maxPercent: number;
  gradeValue: string;
  remark: string;
}

export interface GradeColumn {
  col: number;
  row: number;
  header: string;
  kind: 'final' | 'remark' | 'term';
  termIndex?: number;
}

interface BaseLayout {
  sheetName: string;
  headerRow: number;
  dataStartRow: number;
  idCol: number | null;
  nameCols: number[];
  subjectCols: number[];
  gradeCols: GradeColumn[];
  valueMode: 'grade' | 'score' | null;
  mapped: boolean;
}

export interface SheetLayout extends BaseLayout {
  termWeights: number[];
  sheetText: string;
}

export interface StudentRow {
  row: number;
  idKey: string;
  nameKey: string;
  subjectText: string;
}

export interface FillClass {
  classId: string;
  subjectName: string;
  subjectKeys: string[];
  terms: Array<{ id: string; name: string }>;
  studentIds: string[];
  byId: Map<string, string>;
  byName: Map<string, string>;
  grades: Map<string, { score: number; grade: string }>;
  ranges: GradeRangeLite[];
}

export interface FillOp {
  sheetName: string;
  row: number;
  classId: string;
  studentId: string;
  cells: Array<{ col: number; value: string | number }>;
}

export interface FillPlan {
  ops: FillOp[];
  matchedRowsBySheet: Map<string, Set<number>>;
  matchedStudents: Map<string, Set<string>>;
  writtenStudents: Map<string, Set<string>>;
  ambiguousRows: number;
}

export interface WorkbookSummary {
  sheets: Array<{
    sheetName: string;
    headerRow: number;
    studentRows: number;
    hasIdColumn: boolean;
    nameColumns: number;
    subjectColumns: number;
    mapped: boolean;
    gradeColumns: Array<{ header: string; kind: string; termIndex?: number }>;
  }>;
  untouchedSheets: string[];
  totalStudentRows: number;
}

const DEFAULT_ID_HEADERS = [
  'student id',
  'student no',
  'student number',
  'student id no',
  'student id number',
  'id no',
  'id number',
  'id',
];

const DEFAULT_NAME_HEADERS = [
  'name',
  'student name',
  'full name',
  'complete name',
  'learner name',
  'name of student',
  'last name',
  'surname',
  'family name',
  'first name',
  'given name',
  'middle name',
];

const SUBJECT_HEADERS = new Set([
  'subject code',
  'subject title',
  'subject name',
  'subject',
  'subject description',
  'subject no',
  'descriptive title',
  'course title',
  'course description',
]);

const FINAL_HEADERS = [
  'overall average',
  'overall grade',
  'overall rating',
  'overall',
  'final grade',
  'final rating',
  'final average',
  'final score',
  'final equivalent',
  'semestral grade',
  'semestral rating',
  'semestral average',
  'general average',
  'average',
  'equivalent',
  'grade equivalent',
  'grade',
  'rating',
];

const REMARK_HEADERS = ['remarks', 'remark'];

const TERM_RE =
  /\b(prelim|preliminary|midterm|mid term|pre final|prefinal|finals?|[1-4](st|nd|rd|th)|first|second|third|fourth|quarter|q[1-4]|term|grading|period)\b/;

export function normalizeHeader(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9%\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function idKeyOf(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Order-insensitive, initial-insensitive: "DELA CRUZ, Juan P." and
// "Juan Dela Cruz" produce the same key.
export function nameKeyOf(text: string): string {
  return normalizeHeader(text)
    .replace(/[0-9%]/g, ' ')
    .split(' ')
    .filter((t) => t.length > 1)
    .sort()
    .join(' ');
}

export function colLetter(n: number): string {
  let s = '';
  let x = n;
  while (x > 0) {
    const m = (x - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

export async function loadWorkbook(data: Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(data as any);
  return wb;
}

export async function writeWorkbook(wb: ExcelJS.Workbook): Promise<Buffer> {
  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out as any);
}

function isSlave(cell: ExcelJS.Cell): boolean {
  return cell.isMerged && cell.master.address !== cell.address;
}

function rawCellText(cell: ExcelJS.Cell): string {
  try {
    return (cell.text ?? '').toString().trim();
  } catch {
    return '';
  }
}

function cellText(cell: ExcelJS.Cell): string {
  if (isSlave(cell)) return '';
  return rawCellText(cell);
}

function headerTextAt(ws: ExcelJS.Worksheet, row: number, col: number): string {
  const first = rawCellText(ws.getCell(row, col));
  if (first) return first;
  return rawCellText(ws.getCell(row + 1, col));
}

function rowCells(
  ws: ExcelJS.Worksheet,
  rowNumber: number,
): Array<{ col: number; text: string }> {
  const out: Array<{ col: number; text: string }> = [];
  ws.getRow(rowNumber).eachCell((cell, col) => {
    const text = cellText(cell);
    if (text) out.push({ col, text });
  });
  return out;
}

function parseNum(text: string): number | null {
  const t = text.replace('%', '').trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function readTermWeights(
  ws: ExcelJS.Worksheet,
  headerRow: number,
  gradeCols: GradeColumn[],
): number[] {
  const terms = gradeCols.filter((g) => g.kind === 'term' && g.termIndex);
  if (terms.length === 0) return [];
  for (let r = headerRow - 1; r >= Math.max(1, headerRow - 4); r--) {
    const vals = terms.map((t) => parseNum(rawCellText(ws.getCell(r, t.col))));
    if (vals.every((v) => v !== null && v > 0)) {
      const out: number[] = [];
      terms.forEach((t, i) => {
        out[(t.termIndex as number) - 1] = vals[i] as number;
      });
      return out;
    }
  }
  return [];
}

function finishLayout(ws: ExcelJS.Worksheet, base: BaseLayout): SheetLayout {
  const parts: string[] = [ws.name];
  for (let r = 1; r < base.headerRow; r++) {
    for (const cell of rowCells(ws, r)) parts.push(cell.text);
  }
  return {
    ...base,
    termWeights: readTermWeights(ws, base.headerRow, base.gradeCols),
    sheetText: ` ${normalizeHeader(parts.join(' ')).slice(0, 6000)} `,
  };
}

function classifyGradeHeader(h: string): 'final' | 'remark' | 'term' | null {
  if (REMARK_HEADERS.includes(h)) return 'remark';
  if (FINAL_HEADERS.includes(h)) return 'final';
  if (TERM_RE.test(h)) return 'term';
  return null;
}

function detectSheet(
  ws: ExcelJS.Worksheet,
  idHeaders: Set<string>,
  nameHeaders: Set<string>,
): SheetLayout | null {
  const scanLimit = Math.min(ws.rowCount, 60);
  type Found = {
    row: number;
    idCol: number | null;
    nameCols: number[];
    subjectCols: number[];
  };
  let found: Found | null = null;
  let fallback: Found | null = null;

  for (let r = 1; r <= scanLimit && !found; r++) {
    let idCol: number | null = null;
    const nameCols: number[] = [];
    const subjectCols: number[] = [];
    for (const cell of rowCells(ws, r)) {
      const h = normalizeHeader(cell.text);
      if (!h) continue;
      if (idCol === null && idHeaders.has(h)) idCol = cell.col;
      else if (nameHeaders.has(h)) nameCols.push(cell.col);
      else if (SUBJECT_HEADERS.has(h)) subjectCols.push(cell.col);
    }
    if (idCol !== null) found = { row: r, idCol, nameCols, subjectCols };
    else if (!fallback && nameCols.length > 0) {
      fallback = { row: r, idCol: null, nameCols, subjectCols };
    }
  }

  const header = found ?? fallback;
  if (!header) return null;

  const used = new Set<number>([...header.nameCols, ...header.subjectCols]);
  if (header.idCol !== null) used.add(header.idCol);

  // Grade headers live on the header row, or on a sub-header row directly
  // below it (recognisable because its Student ID cell is empty).
  const gradeCols: GradeColumn[] = [];
  const seen = new Set<number>();
  for (let r = header.row; r <= header.row + 1; r++) {
    if (r === header.row + 1) {
      if (header.idCol === null) continue;
      if (cellText(ws.getCell(r, header.idCol)) !== '') continue;
    }
    for (const cell of rowCells(ws, r)) {
      if (used.has(cell.col) || seen.has(cell.col)) continue;
      const h = normalizeHeader(cell.text);
      if (!h || /^[0-9.\s%]+$/.test(h)) continue;
      const kind = classifyGradeHeader(h);
      if (!kind) continue;
      seen.add(cell.col);
      gradeCols.push({ col: cell.col, row: r, header: h, kind });
    }
  }
  gradeCols.sort((a, b) => a.col - b.col);
  let n = 0;
  for (const g of gradeCols) {
    if (g.kind === 'term') {
      n += 1;
      g.termIndex = n;
    }
  }

  return finishLayout(ws, {
    sheetName: ws.name,
    headerRow: header.row,
    dataStartRow: header.row + 1,
    idCol: header.idCol,
    nameCols: header.nameCols,
    subjectCols: header.subjectCols,
    gradeCols,
    valueMode: null,
    mapped: false,
  });
}

function layoutFromMapping(
  ws: ExcelJS.Worksheet,
  m: SheetMapping,
): SheetLayout {
  const gradeCols: GradeColumn[] = [];
  const label = (col: number) =>
    normalizeHeader(headerTextAt(ws, m.headerRow, col)) || colLetter(col);
  for (const t of [...m.termCols].sort((a, b) => a.termIndex - b.termIndex)) {
    gradeCols.push({
      col: t.col,
      row: m.headerRow,
      header: label(t.col),
      kind: 'term',
      termIndex: t.termIndex,
    });
  }
  if (m.finalCol) {
    gradeCols.push({
      col: m.finalCol,
      row: m.headerRow,
      header: label(m.finalCol),
      kind: 'final',
    });
  }
  if (m.remarkCol) {
    gradeCols.push({
      col: m.remarkCol,
      row: m.headerRow,
      header: label(m.remarkCol),
      kind: 'remark',
    });
  }
  return finishLayout(ws, {
    sheetName: ws.name,
    headerRow: m.headerRow,
    dataStartRow: m.dataStartRow ?? m.headerRow + 1,
    idCol: m.idCol,
    nameCols: m.nameCols,
    subjectCols: m.subjectCols,
    gradeCols,
    valueMode: m.valueMode ?? null,
    mapped: true,
  });
}

export function detectLayouts(
  wb: ExcelJS.Workbook,
  config: TemplateConfig,
): SheetLayout[] {
  const idHeaders = new Set([
    ...DEFAULT_ID_HEADERS,
    ...(config.idHeaders ?? []).map(normalizeHeader).filter(Boolean),
  ]);
  const nameHeaders = new Set([
    ...DEFAULT_NAME_HEADERS,
    ...(config.nameHeaders ?? []).map(normalizeHeader).filter(Boolean),
  ]);
  const layouts: SheetLayout[] = [];
  for (const ws of wb.worksheets) {
    const mapping = config.mapping?.[ws.name];
    const layout = mapping
      ? layoutFromMapping(ws, mapping)
      : detectSheet(ws, idHeaders, nameHeaders);
    if (layout) layouts.push(layout);
  }
  return layouts;
}

export function layoutToMapping(layout: SheetLayout): SheetMapping {
  return {
    headerRow: layout.headerRow,
    dataStartRow: layout.dataStartRow,
    idCol: layout.idCol,
    nameCols: layout.nameCols,
    subjectCols: layout.subjectCols,
    termCols: layout.gradeCols
      .filter((g) => g.kind === 'term' && g.termIndex)
      .map((g) => ({ col: g.col, termIndex: g.termIndex as number })),
    finalCol: layout.gradeCols.find((g) => g.kind === 'final')?.col ?? null,
    remarkCol: layout.gradeCols.find((g) => g.kind === 'remark')?.col ?? null,
    valueMode: layout.valueMode,
  };
}

/**
 * Validates a column mapping. Returns the cleaned mapping, or an error
 * message when it cannot be used. Also used (ignoring errors) to read back
 * mappings stored in the template config.
 */
export function sanitizeMapping(raw: unknown): SheetMapping | string {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return 'The mapping is missing.';
  }
  const r = raw as Record<string, unknown>;
  const int = (v: unknown, min: number, max: number): number | null =>
    typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max
      ? v
      : null;
  const col = (v: unknown): number | null => int(v, 1, MAX_COLS);

  const headerRow = int(r.headerRow, 1, 100000);
  if (headerRow === null) {
    return 'The header row must be a whole number of 1 or more.';
  }

  const idCol = r.idCol == null ? null : col(r.idCol);
  if (r.idCol != null && idCol === null) {
    return `The Student ID column must be between A and ${colLetter(MAX_COLS)}.`;
  }
  const finalCol = r.finalCol == null ? null : col(r.finalCol);
  if (r.finalCol != null && finalCol === null) {
    return 'The overall column is invalid.';
  }
  const remarkCol = r.remarkCol == null ? null : col(r.remarkCol);
  if (r.remarkCol != null && remarkCol === null) {
    return 'The remarks column is invalid.';
  }

  const colList = (v: unknown, label: string): number[] | string => {
    if (v == null) return [];
    if (!Array.isArray(v)) return `${label} must be a list.`;
    const out: number[] = [];
    for (const item of v) {
      const c = col(item);
      if (c === null) return `${label} contains an invalid column.`;
      if (!out.includes(c)) out.push(c);
    }
    return out;
  };
  const nameCols = colList(r.nameCols, 'The name columns');
  if (typeof nameCols === 'string') return nameCols;
  const subjectCols = colList(r.subjectCols, 'The subject columns');
  if (typeof subjectCols === 'string') return subjectCols;

  const termCols: Array<{ col: number; termIndex: number }> = [];
  if (r.termCols != null) {
    if (!Array.isArray(r.termCols)) return 'The term columns must be a list.';
    const usedIdx = new Set<number>();
    for (const item of r.termCols) {
      if (!item || typeof item !== 'object') return 'A term column is invalid.';
      const t = item as Record<string, unknown>;
      const c = col(t.col);
      const idx = int(t.termIndex, 1, MAX_TERMS);
      if (c === null || idx === null) return 'A term column is invalid.';
      if (usedIdx.has(idx)) return `Term ${idx} is mapped twice.`;
      usedIdx.add(idx);
      termCols.push({ col: c, termIndex: idx });
    }
  }

  if (idCol === null && nameCols.length === 0) {
    return 'Pick the Student ID column, or at least one name column.';
  }
  if (termCols.length === 0 && finalCol === null && remarkCol === null) {
    return 'Pick at least one grade column to fill in.';
  }

  const usedCols = new Set<number>();
  const all = [
    ...(idCol !== null ? [idCol] : []),
    ...nameCols,
    ...subjectCols,
    ...termCols.map((t) => t.col),
    ...(finalCol !== null ? [finalCol] : []),
    ...(remarkCol !== null ? [remarkCol] : []),
  ];
  for (const c of all) {
    if (usedCols.has(c)) {
      return `Column ${colLetter(c)} is used for more than one purpose.`;
    }
    usedCols.add(c);
  }

  const dataStart = int(r.dataStartRow, headerRow + 1, 100000);
  return {
    headerRow,
    dataStartRow: dataStart,
    idCol,
    nameCols,
    subjectCols,
    termCols,
    finalCol,
    remarkCol,
    valueMode:
      r.valueMode === 'grade' || r.valueMode === 'score' ? r.valueMode : null,
  };
}

export function readStudentRows(
  ws: ExcelJS.Worksheet,
  layout: SheetLayout,
): StudentRow[] {
  const out: StudentRow[] = [];
  for (let r = layout.dataStartRow; r <= ws.rowCount; r++) {
    const idKey =
      layout.idCol !== null
        ? idKeyOf(cellText(ws.getCell(r, layout.idCol)))
        : '';
    const nameKey = nameKeyOf(
      layout.nameCols.map((c) => cellText(ws.getCell(r, c))).join(' '),
    );
    if (layout.idCol !== null) {
      // Real student numbers contain digits; this keeps footer lines such as
      // "Prepared by" from being treated as students.
      if (idKey === '' || !/\d/.test(idKey)) continue;
    } else if (nameKey.split(' ').filter(Boolean).length < 2) {
      continue;
    }
    const subjectText =
      layout.subjectCols.length > 0
        ? ` ${normalizeHeader(
            layout.subjectCols
              .map((c) => cellText(ws.getCell(r, c)))
              .join(' '),
          )} `
        : '';
    out.push({ row: r, idKey, nameKey, subjectText });
  }
  return out;
}

function toCellValue(text: string): string | number | null {
  const t = text.trim();
  if (!t || t.toUpperCase() === 'N/A') return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return t;
}

function rangeFor(
  score: number,
  ranges: GradeRangeLite[],
): GradeRangeLite | null {
  const rounded = Math.round(score);
  return (
    ranges.find((r) => rounded >= r.minPercent && rounded <= r.maxPercent) ??
    null
  );
}

// Weighted average of the class's term scores. Weights come from the
// template's own "Term weight" row when it has one, otherwise equal. Terms
// without a grade yet are left out and the remaining weights renormalize.
function overallOf(
  cls: FillClass,
  studentId: string,
  layout: SheetLayout,
): { score: number; lastGrade: string | null } | null {
  let sum = 0;
  let weightSum = 0;
  let lastGrade: string | null = null;
  for (let i = 0; i < cls.terms.length; i++) {
    const g = cls.grades.get(`${studentId}:${cls.terms[i].id}`);
    if (!g) continue;
    const w = layout.termWeights[i] ?? 1;
    sum += g.score * w;
    weightSum += w;
    lastGrade = g.grade;
  }
  if (weightSum <= 0) return null;
  return { score: Math.round((sum / weightSum) * 100) / 100, lastGrade };
}

function valueFor(
  cls: FillClass,
  studentId: string,
  gc: GradeColumn,
  layout: SheetLayout,
): string | number | null {
  const wantsScore =
    layout.valueMode === 'score' ||
    (layout.valueMode !== 'grade' && /score|percent|%/.test(gc.header));

  if (gc.kind === 'term') {
    const term = cls.terms[(gc.termIndex ?? 0) - 1];
    if (!term) return null;
    const g = cls.grades.get(`${studentId}:${term.id}`);
    if (!g) return null;
    return wantsScore ? Math.round(g.score * 100) / 100 : toCellValue(g.grade);
  }

  const overall = overallOf(cls, studentId, layout);
  if (!overall) return null;

  if (gc.kind === 'remark') {
    const range = rangeFor(overall.score, cls.ranges);
    return range?.remark ? range.remark : null;
  }

  if (wantsScore) return overall.score;
  const range = rangeFor(overall.score, cls.ranges);
  if (range) return toCellValue(range.gradeValue);
  return overall.lastGrade ? toCellValue(overall.lastGrade) : null;
}

function bestSubjectMatches(
  classes: FillClass[],
  subjectText: string,
): FillClass[] {
  let best = 0;
  const scored: Array<{ cls: FillClass; score: number }> = [];
  for (const cls of classes) {
    let score = 0;
    for (const key of cls.subjectKeys) {
      if (key && subjectText.includes(` ${key} `) && key.length > score) {
        score = key.length;
      }
    }
    if (score > 0) {
      scored.push({ cls, score });
      if (score > best) best = score;
    }
  }
  return scored.filter((s) => s.score === best).map((s) => s.cls);
}

export function planFills(
  wb: ExcelJS.Workbook,
  layouts: SheetLayout[],
  classes: FillClass[],
): FillPlan {
  const plan: FillPlan = {
    ops: [],
    matchedRowsBySheet: new Map(),
    matchedStudents: new Map(),
    writtenStudents: new Map(),
    ambiguousRows: 0,
  };
  for (const c of classes) {
    plan.matchedStudents.set(c.classId, new Set());
    plan.writtenStudents.set(c.classId, new Set());
  }

  // Sheets without a subject column are matched by what the sheet itself
  // says (its name and the rows above the table).
  const sheetClasses = new Map<string, Set<string>>();
  let subjectAware = false;
  for (const layout of layouts) {
    if (layout.subjectCols.length > 0) continue;
    const hits = new Set<string>();
    for (const c of classes) {
      if (c.subjectKeys.some((k) => layout.sheetText.includes(` ${k} `))) {
        hits.add(c.classId);
      }
    }
    sheetClasses.set(layout.sheetName, hits);
    if (hits.size > 0) subjectAware = true;
  }

  for (const layout of layouts) {
    const ws = wb.getWorksheet(layout.sheetName);
    if (!ws) continue;
    const rowLevel = layout.subjectCols.length > 0;
    const sheetHits = sheetClasses.get(layout.sheetName) ?? new Set<string>();

    for (const row of readStudentRows(ws, layout)) {
      const candidates = rowLevel
        ? bestSubjectMatches(classes, row.subjectText)
        : subjectAware
          ? classes.filter((c) => sheetHits.has(c.classId))
          : classes;

      let pool: Array<{ cls: FillClass; studentId: string }> = [];
      for (const cls of candidates) {
        const sid = row.idKey
          ? cls.byId.get(row.idKey)
          : cls.byName.get(row.nameKey);
        if (sid) pool.push({ cls, studentId: sid });
      }
      if (pool.length === 0) continue;
      if (pool.length > 1) {
        plan.ambiguousRows += 1;
        pool = [pool[0]];
      }
      const { cls, studentId } = pool[0];

      const matchedRows =
        plan.matchedRowsBySheet.get(layout.sheetName) ?? new Set<number>();
      matchedRows.add(row.row);
      plan.matchedRowsBySheet.set(layout.sheetName, matchedRows);
      plan.matchedStudents.get(cls.classId)?.add(studentId);

      const cells: FillOp['cells'] = [];
      for (const gc of layout.gradeCols) {
        const value = valueFor(cls, studentId, gc, layout);
        if (value !== null) cells.push({ col: gc.col, value });
      }
      if (cells.length > 0) {
        plan.ops.push({
          sheetName: layout.sheetName,
          row: row.row,
          classId: cls.classId,
          studentId,
          cells,
        });
        plan.writtenStudents.get(cls.classId)?.add(studentId);
      }
    }
  }
  return plan;
}

export function applyFillOps(wb: ExcelJS.Workbook, ops: FillOp[]): void {
  for (const op of ops) {
    const ws = wb.getWorksheet(op.sheetName);
    if (!ws) continue;
    for (const c of op.cells) {
      const cell = ws.getCell(op.row, c.col);
      if (isSlave(cell)) continue;
      cell.value = c.value;
    }
  }
}

function blankRow(ws: ExcelJS.Worksheet, rowNumber: number): void {
  const row = ws.getRow(rowNumber);
  row.eachCell({ includeEmpty: true }, (cell) => {
    if (!isSlave(cell)) cell.value = null;
  });
  row.hidden = true;
}

/**
 * Reduces a workbook to one educator's students. Sheets with no matched
 * student are removed; on the remaining sheets every other student row is
 * emptied and hidden (rows are not deleted, so merged footers keep their
 * place). Sheets without a student table are left untouched.
 */
export function buildEducatorCopy(
  wb: ExcelJS.Workbook,
  layouts: SheetLayout[],
  plan: FillPlan,
): void {
  for (const layout of layouts) {
    const ws = wb.getWorksheet(layout.sheetName);
    if (!ws) continue;
    const matched = plan.matchedRowsBySheet.get(layout.sheetName);
    if (!matched || matched.size === 0) {
      wb.removeWorksheet(ws.id);
      continue;
    }
    for (const row of readStudentRows(ws, layout)) {
      if (!matched.has(row.row)) blankRow(ws, row.row);
    }
  }
}

export function summarizeWorkbook(
  wb: ExcelJS.Workbook,
  layouts: SheetLayout[],
): WorkbookSummary {
  const detected = new Set(layouts.map((l) => l.sheetName));
  const sheets = layouts.map((l) => {
    const ws = wb.getWorksheet(l.sheetName);
    return {
      sheetName: l.sheetName,
      headerRow: l.headerRow,
      studentRows: ws ? readStudentRows(ws, l).length : 0,
      hasIdColumn: l.idCol !== null,
      nameColumns: l.nameCols.length,
      subjectColumns: l.subjectCols.length,
      mapped: l.mapped,
      gradeColumns: l.gradeCols.map((g) => ({
        header: g.header,
        kind: g.kind,
        termIndex: g.termIndex,
      })),
    };
  });
  return {
    sheets,
    untouchedSheets: wb.worksheets
      .filter((ws) => !detected.has(ws.name))
      .map((ws) => ws.name),
    totalStudentRows: sheets.reduce((n, s) => n + s.studentRows, 0),
  };
}

// ───────────────────────── PREVIEW / MAPPING HELPERS ─────────────────────────

export function readGrid(
  ws: ExcelJS.Worksheet,
  offset: number,
  limit: number,
): {
  rowCount: number;
  colCount: number;
  rows: Array<{ row: number; cells: string[] }>;
} {
  const colCount = Math.min(Math.max(ws.columnCount, 1), MAX_COLS);
  const last = Math.min(ws.rowCount, offset + limit);
  const rows: Array<{ row: number; cells: string[] }> = [];
  for (let r = offset + 1; r <= last; r++) {
    const cells: string[] = [];
    for (let c = 1; c <= colCount; c++) {
      cells.push(cellText(ws.getCell(r, c)).slice(0, 80));
    }
    rows.push({ row: r, cells });
  }
  return { rowCount: ws.rowCount, colCount, rows };
}

export function readColumns(
  ws: ExcelJS.Worksheet,
  headerRow: number,
): Array<{ col: number; letter: string; header: string; sample: string }> {
  const colCount = Math.min(Math.max(ws.columnCount, 1), MAX_COLS);
  // Sample = the first row below the header that has anything in it.
  let sampleRow = headerRow + 1;
  for (let r = headerRow + 1; r <= Math.min(ws.rowCount, headerRow + 6); r++) {
    let any = false;
    for (let c = 1; c <= colCount && !any; c++) {
      if (cellText(ws.getCell(r, c)) !== '') any = true;
    }
    if (any) {
      sampleRow = r;
      break;
    }
  }
  const out: Array<{
    col: number;
    letter: string;
    header: string;
    sample: string;
  }> = [];
  for (let c = 1; c <= colCount; c++) {
    out.push({
      col: c,
      letter: colLetter(c),
      header: headerTextAt(ws, headerRow, c).slice(0, 60),
      sample: cellText(ws.getCell(sampleRow, c)).slice(0, 40),
    });
  }
  return out;
}