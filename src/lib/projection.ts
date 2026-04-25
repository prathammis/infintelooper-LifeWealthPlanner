import { FamilyMember, Milestone, MilestoneImpact, PlanState, ProjectionPoint, ProjectionResult } from '../types';

const MONTHS_PER_YEAR = 12;

const cloneMilestones = (milestones: Milestone[]) => [...milestones].sort((left, right) => left.age - right.age);

export function simulatePlan(plan: PlanState): ProjectionResult {
  const endAge = Math.max(plan.targetAge, plan.currentAge + 1);
  const months = Math.max(1, Math.round((endAge - plan.currentAge) * MONTHS_PER_YEAR));
  const annualRate = plan.annualReturn / 100;
  const monthlyRate = annualRate / MONTHS_PER_YEAR;
  const inflation = plan.inflationRate / 100;
  const milestones = cloneMilestones(plan.milestones);
  const points: ProjectionPoint[] = [];
  const impacts: MilestoneImpact[] = [];
  let balance = plan.currentBalance;
  let minimumBalance = balance;

  for (let month = 0; month <= months; month += 1) {
    const age = plan.currentAge + month / MONTHS_PER_YEAR;

    if (month > 0) {
      balance = (balance + plan.monthlySavings) * (1 + monthlyRate);
    }

    const milestoneHits = milestones.filter((milestone) => Math.abs(milestone.age - age) < 1 / MONTHS_PER_YEAR);

    milestoneHits.forEach((milestone) => {
      const yearsAhead = Math.max(0, milestone.age - plan.currentAge);
      const inflatedCost = milestone.cost * Math.pow(1 + inflation, yearsAhead);
      const projectedBalance = balance - inflatedCost;
      const gap = Math.max(0, inflatedCost - balance);

      balance = projectedBalance;
      impacts.push({
        milestoneId: milestone.id,
        label: milestone.label,
        age: milestone.age,
        inflatedCost,
        gap,
        projectedBalance,
      });
    });

    minimumBalance = Math.min(minimumBalance, balance);
    points.push({
      month,
      age,
      balance,
    });
  }

  return {
    points,
    impacts,
    endingBalance: balance,
    minimumBalance,
  };
}

export function splitSavingsByMember(plan: PlanState): Array<{ member: FamilyMember; savings: number }> {
  const totalShare = plan.familyMembers.reduce((sum, member) => sum + member.contributionShare, 0) || 1;

  return plan.familyMembers.map((member) => ({
    member,
    savings: plan.monthlySavings * (member.contributionShare / totalShare),
  }));
}
