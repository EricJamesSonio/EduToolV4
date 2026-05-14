

export const getLevelSortValue = (name: string): number => {
  const gradeMatch = name.match(/Grade\s+(\d+)/i);
  if (gradeMatch) return Number(gradeMatch[1]);

  const yearMatch = name.match(/(\d+)(?:st|nd|rd|th)\s+Year/i);
  if (yearMatch) return Number(yearMatch[1]);

  const trailingNumberMatch = name.match(/(\d+)$/);
  return trailingNumberMatch ? Number(trailingNumberMatch[1]) : 0;
};