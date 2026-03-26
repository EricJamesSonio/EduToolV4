/**
 * Triggers a CSV file download in the browser.
 *
 * @param data   Array of objects — each key becomes a column header
 * @param filename  Downloaded file name (without extension)
 */
export function downloadCsv(
  data: Record<string, string | number | boolean | null | undefined>[],
  filename: string
): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);

  const escape = (val: unknown): string => {
    const str = val === null || val === undefined ? "" : String(val);
    // Wrap in quotes if the value contains a comma, quote, or newline
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = [
    headers.map(escape).join(","),
    ...data.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses a CSV File object into an array of row objects.
 * The first row is treated as headers.
 *
 * @param file  A File object (from an <input type="file"> or drop zone)
 * @returns     Array of objects keyed by header name
 */
export function parseCsvFile(
  file: File
): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);

        if (lines.length < 2) {
          resolve([]);
          return;
        }

        const headers = parseRow(lines[0]);
        const rows: Record<string, string>[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseRow(lines[i]);
          const row: Record<string, string> = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx] ?? "";
          });
          rows.push(row);
        }

        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read CSV file"));
    reader.readAsText(file, "UTF-8");
  });
}

/**
 * Splits a single CSV row into values, respecting quoted fields.
 */
function parseRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote inside a quoted field
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}