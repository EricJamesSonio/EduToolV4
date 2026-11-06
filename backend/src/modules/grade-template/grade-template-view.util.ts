import type ExcelJS from 'exceljs';
import { MAX_COLS } from './grade-template.workbook';

/**
 * Turns one worksheet page into plain JSON the browser can draw like Excel:
 * values plus deduplicated styles, merges and sizes. Read-only; never touches
 * the stored workbook.
 */

export interface ViewStyle {
  bg?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  size?: number;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  wrap?: boolean;
  bt?: string;
  br?: string;
  bb?: string;
  bl?: string;
}

export interface ViewCell {
  t: string;
  s: number;
  rs?: number;
  cs?: number;
  skip?: boolean;
}

export interface ViewRow {
  row: number;
  h: number | null;
  hidden: boolean;
  cells: ViewCell[];
}

export interface SheetView {
  colCount: number;
  rowCount: number;
  first: number;
  last: number;
  showGrid: boolean;
  cols: Array<{ w: number; hidden: boolean }>;
  rows: ViewRow[];
  styles: ViewStyle[];
}

// Excel's default theme: lt1, dk1, lt2, dk2, accent1..accent6.
const THEME = [
  'FFFFFF',
  '000000',
  'E7E6E6',
  '44546A',
  '4472C4',
  'ED7D31',
  'A5A5A5',
  'FFC000',
  '5B9BD5',
  '70AD47',
];

function applyTint(hex: string, tint: number): string {
  const channel = (i: number): string => {
    const c = parseInt(hex.slice(i, i + 2), 16);
    const v = tint >= 0 ? c + (255 - c) * tint : c * (1 + tint);
    return Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, '0');
  };
  return `${channel(0)}${channel(2)}${channel(4)}`;
}

function colorOf(c: Partial<ExcelJS.Color> | undefined): string | undefined {
  if (!c) return undefined;
  if (typeof c.argb === 'string' && c.argb.length >= 6) {
    return `#${c.argb.slice(-6)}`;
  }
  if (typeof c.theme === 'number') {
    const base = THEME[c.theme];
    if (!base) return undefined;
    return `#${applyTint(base, c.tint ?? 0)}`;
  }
  return undefined;
}

function borderCss(b: Partial<ExcelJS.Border> | undefined): string | undefined {
  if (!b || !b.style) return undefined;
  const style = String(b.style);
  const width =
    style === 'medium' || style === 'thick' || style === 'double' ? 2 : 1;
  const line = style.toLowerCase().includes('dash')
    ? 'dashed'
    : style === 'dotted' || style === 'hair'
      ? 'dotted'
      : 'solid';
  return `${width}px ${line} ${colorOf(b.color) ?? '#000000'}`;
}

function colNum(letters: string): number {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

function styleOf(cell: ExcelJS.Cell): ViewStyle {
  const out: ViewStyle = {};

  const fill = cell.fill;
  if (fill && fill.type === 'pattern' && fill.pattern !== 'none') {
    const bg = colorOf(fill.fgColor);
    if (bg) out.bg = bg;
  }

  const font = cell.font;
  if (font) {
    const color = colorOf(font.color);
    if (color) out.color = color;
    if (font.bold) out.bold = true;
    if (font.italic) out.italic = true;
    if (font.underline && font.underline !== 'none') out.underline = true;
    if (typeof font.size === 'number') out.size = font.size;
  }

  const al = cell.alignment;
  const h = al?.horizontal as string | undefined;
  if (h === 'left' || h === 'right') out.align = h;
  else if (h === 'center' || h === 'centerContinuous') out.align = 'center';
  else if (typeof cell.value === 'number') out.align = 'right';
  const v = al?.vertical as string | undefined;
  if (v === 'top' || v === 'middle' || v === 'bottom') out.valign = v;
  if (al?.wrapText) out.wrap = true;

  const border = cell.border;
  if (border) {
    out.bt = borderCss(border.top);
    out.br = borderCss(border.right);
    out.bb = borderCss(border.bottom);
    out.bl = borderCss(border.left);
  }
  return out;
}

function textOf(cell: ExcelJS.Cell): string {
  try {
    return (cell.text ?? '').toString().slice(0, 300);
  } catch {
    return '';
  }
}

export function renderSheet(
  ws: ExcelJS.Worksheet,
  offset: number,
  limit: number,
): SheetView {
  const colCount = Math.min(Math.max(ws.columnCount, 1), MAX_COLS);
  const first = offset + 1;
  const last = Math.min(ws.rowCount, offset + limit);

  // Merges: the top-left cell spans, every other covered cell is skipped.
  // A merge that started on an earlier page keeps its cells (no master here).
  const masters = new Map<string, { rs: number; cs: number }>();
  const skipped = new Set<string>();
  const rawMerges =
    (ws.model as unknown as { merges?: string[] }).merges ?? [];
  for (const range of rawMerges) {
    const m = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(range);
    if (!m) continue;
    const c1 = colNum(m[1]);
    const r1 = Number(m[2]);
    const c2 = colNum(m[3]);
    const r2 = Number(m[4]);
    if (r2 < first || r1 > last || r1 < first || c1 > colCount) continue;
    const endRow = Math.min(r2, last);
    const endCol = Math.min(c2, colCount);
    masters.set(`${r1}:${c1}`, {
      rs: endRow - r1 + 1,
      cs: endCol - c1 + 1,
    });
    for (let r = r1; r <= endRow; r++) {
      for (let c = c1; c <= endCol; c++) {
        if (r !== r1 || c !== c1) skipped.add(`${r}:${c}`);
      }
    }
  }

  const cols: SheetView['cols'] = [];
  for (let c = 1; c <= colCount; c++) {
    const col = ws.getColumn(c);
    const width = typeof col.width === 'number' ? col.width : 8.43;
    cols.push({ w: Math.round(width * 7 + 5), hidden: !!col.hidden });
  }

  const styles: ViewStyle[] = [];
  const styleIndex = new Map<string, number>();
  const indexOf = (s: ViewStyle): number => {
    const key = JSON.stringify(s);
    const found = styleIndex.get(key);
    if (found !== undefined) return found;
    styles.push(s);
    styleIndex.set(key, styles.length - 1);
    return styles.length - 1;
  };

  const rows: ViewRow[] = [];
  for (let r = first; r <= last; r++) {
    const row = ws.getRow(r);
    const cells: ViewCell[] = [];
    for (let c = 1; c <= colCount; c++) {
      const key = `${r}:${c}`;
      if (skipped.has(key)) {
        cells.push({ t: '', s: 0, skip: true });
        continue;
      }
      const cell = ws.getCell(r, c);
      const span = masters.get(key);
      const out: ViewCell = { t: textOf(cell), s: indexOf(styleOf(cell)) };
      if (span) {
        if (span.rs > 1) out.rs = span.rs;
        if (span.cs > 1) out.cs = span.cs;
      }
      cells.push(out);
    }
    rows.push({
      row: r,
      h: typeof row.height === 'number' ? Math.round(row.height * 1.333) : null,
      hidden: !!row.hidden,
      cells,
    });
  }

  const view = ws.views?.[0] as { showGridLines?: boolean } | undefined;
  return {
    colCount,
    rowCount: ws.rowCount,
    first,
    last,
    showGrid: view?.showGridLines !== false,
    cols,
    rows,
    styles,
  };
}