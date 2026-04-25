export type MilestoneCategory =
  | 'home'
  | 'education'
  | 'retirement'
  | 'travel'
  | 'vehicle'
  | 'emergency'
  | 'wedding'
  | 'other';

export interface Milestone {
  id: string;
  label: string;
  age: number;
  cost: number;
  category: MilestoneCategory;
  icon: string;
  note?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  age: number;
  income: number;
  contributionShare: number;
  color: string;
}

export interface PlanState {
  currentAge: number;
  targetAge: number;
  monthlyIncome: number;
  monthlySavings: number;
  currentBalance: number;
  annualReturn: number;
  inflationRate: number;
  familyMembers: FamilyMember[];
  milestones: Milestone[];
}

export interface ProjectionPoint {
  month: number;
  age: number;
  balance: number;
}

export interface MilestoneImpact {
  milestoneId: string;
  label: string;
  age: number;
  inflatedCost: number;
  gap: number;
  projectedBalance: number;
}

export interface ProjectionResult {
  points: ProjectionPoint[];
  impacts: MilestoneImpact[];
  endingBalance: number;
  minimumBalance: number;
}
