import { PlanState } from '../types';

const basePlan = {
  currentAge: 28,
  targetAge: 60,
  monthlyIncome: 120000,
  monthlySavings: 30000,
  currentBalance: 450000,
  annualReturn: 7,
  inflationRate: 4,
};

export const templates: Array<{ id: string; label: string; description: string; plan: PlanState }> = [
  {
    id: 'urban-pro',
    label: 'Urban Pro',
    description: 'Apartment, studio, and upgrade path for a fast-moving city planner.',
    plan: {
      ...basePlan,
      currentAge: 28,
      monthlyIncome: 180000,
      monthlySavings: 42000,
      currentBalance: 920000,
      milestones: [
        { id: 'home', label: 'Studio upgrade', age: 32, cost: 8500000, category: 'home', icon: '⌂' },
        { id: 'road-trip', label: 'Japan trip', age: 34, cost: 900000, category: 'travel', icon: '✈' },
        { id: 'house', label: 'First home', age: 38, cost: 24000000, category: 'home', icon: '▣' },
      ],
      familyMembers: [
        { id: 'self', name: 'Aditya', age: 28, income: 180000, contributionShare: 100, color: '#60a5fa' },
      ],
    },
  },
  {
    id: 'family-head',
    label: 'Family Head',
    description: 'Joint household planning with education goals and shared contributions.',
    plan: {
      ...basePlan,
      currentAge: 35,
      monthlyIncome: 240000,
      monthlySavings: 65000,
      currentBalance: 1800000,
      milestones: [
        { id: 'kids-school', label: 'Kids school fund', age: 40, cost: 6200000, category: 'education', icon: '◎' },
        { id: 'home-renovation', label: 'Home renovation', age: 42, cost: 1800000, category: 'home', icon: '⌂' },
        { id: 'college', label: 'College fund', age: 48, cost: 9800000, category: 'education', icon: '🎓' },
      ],
      familyMembers: [
        { id: 'self', name: 'Priya', age: 35, income: 160000, contributionShare: 60, color: '#5eead4' },
        { id: 'partner', name: 'Partner', age: 36, income: 90000, contributionShare: 40, color: '#f59e0b' },
      ],
    },
  },
  {
    id: 'pre-retiree',
    label: 'Pre-Retiree',
    description: 'Retirement glide path with drawdowns and safety buffers.',
    plan: {
      ...basePlan,
      currentAge: 55,
      monthlyIncome: 320000,
      monthlySavings: 90000,
      currentBalance: 7800000,
      targetAge: 85,
      milestones: [
        { id: 'retire', label: 'Retirement start', age: 60, cost: 0, category: 'retirement', icon: '◔' },
        { id: 'health', label: 'Health reserve', age: 62, cost: 3500000, category: 'emergency', icon: '✚' },
        { id: 'travel', label: 'World trip', age: 66, cost: 2200000, category: 'travel', icon: '✈' },
      ],
      familyMembers: [
        { id: 'self', name: 'Raj', age: 55, income: 320000, contributionShare: 70, color: '#93c5fd' },
        { id: 'spouse', name: 'Spouse', age: 53, income: 110000, contributionShare: 30, color: '#f472b6' },
      ],
    },
  },
  {
    id: 'starter-teen',
    label: 'Starter Teen',
    description: 'College and first-bike goals with a lighter, playful tone.',
    plan: {
      ...basePlan,
      currentAge: 18,
      monthlyIncome: 42000,
      monthlySavings: 9000,
      currentBalance: 120000,
      targetAge: 30,
      milestones: [
        { id: 'college', label: 'College fund', age: 21, cost: 2200000, category: 'education', icon: '🎓' },
        { id: 'bike', label: 'First bike', age: 23, cost: 180000, category: 'vehicle', icon: '⟡' },
        { id: 'startup', label: 'Side-hustle kit', age: 26, cost: 450000, category: 'other', icon: '⚡' },
      ],
      familyMembers: [
        { id: 'self', name: 'Teen', age: 18, income: 12000, contributionShare: 20, color: '#34d399' },
        { id: 'parent', name: 'Parent', age: 46, income: 30000, contributionShare: 80, color: '#fb7185' },
      ],
    },
  },
  {
    id: 'india-family-starter',
    label: 'India Family Starter',
    description: 'Default family bundle for home, kids, and emergency resilience.',
    plan: {
      ...basePlan,
      currentAge: 31,
      monthlyIncome: 190000,
      monthlySavings: 50000,
      currentBalance: 950000,
      milestones: [
        { id: 'emergency', label: 'Emergency fund', age: 32, cost: 600000, category: 'emergency', icon: '✚' },
        { id: 'home', label: 'Home down payment', age: 34, cost: 12500000, category: 'home', icon: '⌂' },
        { id: 'kids', label: 'Kids education', age: 40, cost: 8500000, category: 'education', icon: '🎓' },
      ],
      familyMembers: [
        { id: 'self', name: 'You', age: 31, income: 130000, contributionShare: 65, color: '#60a5fa' },
        { id: 'partner', name: 'Partner', age: 30, income: 60000, contributionShare: 35, color: '#fbbf24' },
      ],
    },
  },
  {
    id: 'freelancer',
    label: 'Freelancer Glide',
    description: 'Variable income with buffer-heavy planning and shortfall alerts.',
    plan: {
      ...basePlan,
      currentAge: 29,
      monthlyIncome: 150000,
      monthlySavings: 35000,
      currentBalance: 650000,
      milestones: [
        { id: 'gear', label: 'Equipment refresh', age: 30, cost: 420000, category: 'other', icon: '⌁' },
        { id: 'vehicle', label: 'Car purchase', age: 33, cost: 1600000, category: 'vehicle', icon: '⟠' },
        { id: 'home', label: 'Townhouse down payment', age: 37, cost: 14000000, category: 'home', icon: '⌂' },
      ],
      familyMembers: [
        { id: 'self', name: 'Freelancer', age: 29, income: 150000, contributionShare: 100, color: '#22c55e' },
      ],
    },
  },
  {
    id: 'dual-income',
    label: 'Dual Income',
    description: 'Joint goals with split contributions and a shared long runway.',
    plan: {
      ...basePlan,
      currentAge: 34,
      monthlyIncome: 280000,
      monthlySavings: 85000,
      currentBalance: 2200000,
      targetAge: 70,
      milestones: [
        { id: 'house', label: 'Dream house', age: 36, cost: 21000000, category: 'home', icon: '⌂' },
        { id: 'baby', label: 'Baby fund', age: 38, cost: 1100000, category: 'other', icon: '◌' },
        { id: 'retire', label: 'Retirement corpus', age: 60, cost: 0, category: 'retirement', icon: '◔' },
      ],
      familyMembers: [
        { id: 'self', name: 'Member A', age: 34, income: 170000, contributionShare: 55, color: '#38bdf8' },
        { id: 'partner', name: 'Member B', age: 33, income: 110000, contributionShare: 45, color: '#fb7185' },
      ],
    },
  },
  {
    id: 'retirement-lite',
    label: 'Retirement Lite',
    description: 'Late-stage glide path with travel and healthcare cushions.',
    plan: {
      ...basePlan,
      currentAge: 48,
      monthlyIncome: 210000,
      monthlySavings: 58000,
      currentBalance: 4100000,
      targetAge: 90,
      milestones: [
        { id: 'health', label: 'Healthcare buffer', age: 52, cost: 2600000, category: 'emergency', icon: '✚' },
        { id: 'travel', label: 'Annual travel', age: 55, cost: 1200000, category: 'travel', icon: '✈' },
        { id: 'retire', label: 'Semi-retirement', age: 60, cost: 0, category: 'retirement', icon: '◔' },
      ],
      familyMembers: [
        { id: 'self', name: 'Planner', age: 48, income: 210000, contributionShare: 75, color: '#0ea5e9' },
        { id: 'partner', name: 'Partner', age: 46, income: 65000, contributionShare: 25, color: '#f472b6' },
      ],
    },
  },
  {
    id: 'college-launch',
    label: 'College Launch',
    description: 'A compact education-first plan for the next decade.',
    plan: {
      ...basePlan,
      currentAge: 26,
      monthlyIncome: 98000,
      monthlySavings: 24000,
      currentBalance: 380000,
      targetAge: 36,
      milestones: [
        { id: 'mba', label: 'MBA tuition', age: 29, cost: 2600000, category: 'education', icon: '🎓' },
        { id: 'home', label: 'Shared flat', age: 32, cost: 9200000, category: 'home', icon: '⌂' },
        { id: 'emergency', label: 'Emergency fund', age: 35, cost: 800000, category: 'emergency', icon: '✚' },
      ],
      familyMembers: [
        { id: 'self', name: 'Student', age: 26, income: 98000, contributionShare: 100, color: '#a78bfa' },
      ],
    },
  },
];
