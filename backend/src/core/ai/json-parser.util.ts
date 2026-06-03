function repairTruncatedJson(s: string): string {
  let result = s;
  const stack: string[] = [];
  let inString = false;
  let escape = false;
  for (let i = 0; i < result.length; i++) {
    const ch = result[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') stack.push(ch);
    else if (ch === '}') { if (stack.length && stack[stack.length - 1] === '{') stack.pop(); }
    else if (ch === ']') { if (stack.length && stack[stack.length - 1] === '[') stack.pop(); }
  }
  if (inString) result += '"';
  for (let i = stack.length - 1; i >= 0; i--) {
    result += stack[i] === '{' ? '}' : ']';
  }
  return result;
}

export function parseJson<T = any>(raw: string): T {
  let text = raw.trim();

  if (text.startsWith('```')) {
    const lines = text.split('\n').slice(1);
    if (lines.at(-1)?.trim() === '```') lines.pop();
    text = lines.join('\n').trim();
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end)) as T;
      } catch {
        // try repairing truncated JSON
      }
    }

    if (start !== -1) {
      const repaired = repairTruncatedJson(text.slice(start));
      try {
        const result = JSON.parse(repaired) as T;
        return result;
      } catch {
        // fall through to error
      }
    }

    throw new Error(`Could not parse AI response as JSON. Raw (first 500): ${text.slice(0, 500)}`);
  }
}
