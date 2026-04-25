import { Milestone, MilestoneCategory } from '../types';

const validCategories: MilestoneCategory[] = [
  'home',
  'education',
  'retirement',
  'travel',
  'vehicle',
  'emergency',
  'wedding',
  'other',
];

const defaultIcons: Record<MilestoneCategory, string> = {
  home: 'H',
  education: 'E',
  retirement: 'R',
  travel: 'T',
  vehicle: 'V',
  emergency: '+',
  wedding: 'W',
  other: '*',
};

const parseCost = (value: string): number => {
  const normalized = value.trim().toLowerCase().replace(/,/g, '');
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*(cr|crore|l|lac|lakhs|k|thousand)?$/);

  if (!match) {
    return Number(normalized) || 0;
  }

  const amount = Number(match[1]);
  const suffix = match[2];

  if (suffix === 'cr' || suffix === 'crore') {
    return amount * 10000000;
  }
  if (suffix === 'l' || suffix === 'lac' || suffix === 'lakhs') {
    return amount * 100000;
  }
  if (suffix === 'k' || suffix === 'thousand') {
    return amount * 1000;
  }

  return amount;
};

const splitCsvRow = (line: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
};

export interface CsvMilestoneImport {
  imported: Omit<Milestone, 'id'>[];
  skipped: number;
}

export function parseMilestonesCsv(csvText: string, currentAge: number): CsvMilestoneImport {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { imported: [], skipped: 0 };
  }

  let startIndex = 0;
  const firstRow = splitCsvRow(lines[0]).map((cell) => cell.toLowerCase());
  if (firstRow.includes('label') || firstRow.includes('cost') || firstRow.includes('age')) {
    startIndex = 1;
  }

  const imported: Omit<Milestone, 'id'>[] = [];
  let skipped = 0;

  for (let index = startIndex; index < lines.length; index += 1) {
    const cells = splitCsvRow(lines[index]);
    const [labelRaw, ageRaw, costRaw, categoryRaw, iconRaw, noteRaw] = cells;

    const label = (labelRaw || '').trim();
    const age = Number(ageRaw);
    const cost = parseCost(costRaw || '0');
    const rawCategory = (categoryRaw || 'other').toLowerCase() as MilestoneCategory;
    const category: MilestoneCategory = validCategories.includes(rawCategory) ? rawCategory : 'other';

    if (!label || Number.isNaN(age) || age < 0 || age > 100 || cost <= 0) {
      skipped += 1;
      continue;
    }

    imported.push({
      label,
      age: Math.max(currentAge, Number(age.toFixed(1))),
      cost,
      category,
      icon: (iconRaw || '').trim() || defaultIcons[category],
      note: (noteRaw || '').trim() || 'Imported from CSV.',
    });
  }

  return { imported, skipped };
}
