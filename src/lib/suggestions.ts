import { MilestoneCategory } from '../types';

const catalog = [
  { keywords: ['flat', 'home', 'apartment', 'pune'], label: 'Pune flat', cost: 8000000, category: 'home' as MilestoneCategory, icon: '⌂', note: 'Typical entry-level metro home target.' },
  { keywords: ['car', 'vehicle', 'sedan'], label: 'Car purchase', cost: 1600000, category: 'vehicle' as MilestoneCategory, icon: '⟠', note: 'A practical mid-range car target.' },
  { keywords: ['bike', 'scooter'], label: 'Bike upgrade', cost: 180000, category: 'vehicle' as MilestoneCategory, icon: '⟡', note: 'Lightweight mobility goal.' },
  { keywords: ['college', 'education', 'mba'], label: 'College fund', cost: 2500000, category: 'education' as MilestoneCategory, icon: '🎓', note: 'Higher education reserve.' },
  { keywords: ['retire', 'retirement'], label: 'Retirement corpus', cost: 0, category: 'retirement' as MilestoneCategory, icon: '◔', note: 'Keep the corpus growing and avoid drawdown pressure.' },
  { keywords: ['trip', 'travel', 'holiday'], label: 'Family trip', cost: 850000, category: 'travel' as MilestoneCategory, icon: '✈', note: 'A fun high-visibility milestone.' },
  { keywords: ['health', 'medical', 'emergency'], label: 'Health reserve', cost: 600000, category: 'emergency' as MilestoneCategory, icon: '✚', note: 'Safety buffer for unexpected costs.' },
];

export function suggestMilestone(query: string) {
  const normalized = query.toLowerCase();
  const match = catalog.find((entry) => entry.keywords.some((keyword) => normalized.includes(keyword)));

  if (match) {
    return match;
  }

  const costMatch = normalized.match(/(\d+[.,]?\d*)\s*(l|lac|lakhs|k|thousand|cr|crore)?/);
  const rawAmount = costMatch ? Number(costMatch[1].replace(/,/g, '')) : 0;
  const multiplier =
    costMatch?.[2] === 'cr'
      ? 10000000
      : costMatch?.[2] === 'crore'
        ? 10000000
        : costMatch?.[2] === 'k' || costMatch?.[2] === 'thousand'
          ? 1000
          : costMatch?.[2] === 'l' || costMatch?.[2] === 'lac' || costMatch?.[2] === 'lakhs'
            ? 100000
            : 100000;

  return {
    label: query.trim() || 'Custom milestone',
    cost: rawAmount * multiplier || 1000000,
    category: 'other' as MilestoneCategory,
    icon: '•',
    note: 'Auto-suggested from the text prompt.',
  };
}
