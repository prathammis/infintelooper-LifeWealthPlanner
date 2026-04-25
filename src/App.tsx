import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import AdvancedWealthStudio from './components/AdvancedWealthStudio';
import { downloadSvg, downloadSvgAsPng, downloadText, decodePlan, encodePlan } from './lib/export';
import { simulatePlan, splitSavingsByMember } from './lib/projection';
import { suggestMilestone } from './lib/suggestions';
import { templates } from './lib/templates';
import { parseMilestonesCsv } from './lib/csv';
import { FamilyMember, Milestone, PlanState } from './types';

type AuthMode = 'login' | 'signup';
type AuthUser = {
  name: string;
  email: string;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const categoryLabels: Record<Milestone['category'], string> = {
  home: 'Home',
  education: 'Education',
  retirement: 'Retirement',
  travel: 'Travel',
  vehicle: 'Vehicle',
  emergency: 'Safety',
  wedding: 'Wedding',
  other: 'Other',
};

const categoryColors: Record<Milestone['category'], string> = {
  home: '#60a5fa',
  education: '#34d399',
  retirement: '#f59e0b',
  travel: '#38bdf8',
  vehicle: '#a78bfa',
  emergency: '#f97316',
  wedding: '#fb7185',
  other: '#94a3b8',
};

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const percent = new Intl.NumberFormat('en-IN', {
  style: 'percent',
  maximumFractionDigits: 1,
});

const viewOptions: Array<{ label: string; value: number | 'full' }> = [
  { label: '5 yr', value: 5 },
  { label: '10 yr', value: 10 },
  { label: 'Full', value: 'full' },
];

const initialPlan = (): PlanState => {
  const hashPlan = decodePlan(window.location.hash);

  if (hashPlan) {
    return hashPlan;
  }

  return templates[0].plan;
};

const createId = () => Math.random().toString(36).slice(2, 9);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const initialUser = (): AuthUser | null => {
  try {
    const stored = window.localStorage.getItem('lifewealth-user');
    return stored ? JSON.parse(stored) as AuthUser : null;
  } catch {
    return null;
  }
};

function EditorField({
  label,
  value,
  onChange,
  type = 'text',
  min,
  max,
  step,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  suffix: string;
}) {
  return (
    <label className="slider-field">
      <div className="slider-header">
        <span>{label}</span>
        <strong>{value.toFixed(step < 1 ? 1 : 0)}{suffix}</strong>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export default function App() {
  const [plan, setPlan] = useState<PlanState>(initialPlan);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(plan.milestones[0]?.id ?? '');
  const [viewRange, setViewRange] = useState<number | 'full'>(10);
  const [showFamily, setShowFamily] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showFamilyDrawer, setShowFamilyDrawer] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authUser, setAuthUser] = useState<AuthUser | null>(initialUser);
  const [authDraft, setAuthDraft] = useState({ name: 'Pratham', email: '', password: '' });
  const [editorMode, setEditorMode] = useState<'milestone' | 'member'>('milestone');
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'premium'>('free');
  const [draftMilestone, setDraftMilestone] = useState<Milestone>({
    id: createId(),
    label: 'New milestone',
    age: plan.currentAge + 5,
    cost: 1000000,
    category: 'other',
    icon: '•',
    note: '',
  });
  const [draftMember, setDraftMember] = useState<FamilyMember>({
    id: createId(),
    name: 'Member',
    age: plan.currentAge,
    income: 0,
    contributionShare: 50,
    color: '#60a5fa',
  });
  const [quickGoal, setQuickGoal] = useState('Pune flat 80L age 32');
  const [statusMessage, setStatusMessage] = useState('Ready to plan four steps ahead.');
  const [isListening, setIsListening] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    setSelectedMilestoneId(plan.milestones[0]?.id ?? '');
  }, [plan.milestones]);

  const projection = useMemo(() => simulatePlan(plan), [plan]);
  const optimisticProjection = useMemo(
    () => simulatePlan({ ...plan, annualReturn: Math.min(15, plan.annualReturn + 2) }),
    [plan],
  );
  const conservativeProjection = useMemo(
    () => simulatePlan({ ...plan, annualReturn: Math.max(1, plan.annualReturn - 2) }),
    [plan],
  );
  const savingsSplit = useMemo(() => splitSavingsByMember(plan), [plan]);

  const visiblePoints = useMemo(() => {
    const startAge = plan.currentAge;
    const endAge = viewRange === 'full' ? plan.targetAge : Math.min(plan.targetAge, plan.currentAge + viewRange);
    return projection.points.filter((point) => point.age >= startAge && point.age <= endAge);
  }, [plan.currentAge, plan.targetAge, projection.points, viewRange]);

  const visibleMilestones = useMemo(
    () => plan.milestones.filter((milestone) => milestone.age >= plan.currentAge && milestone.age <= (viewRange === 'full' ? plan.targetAge : plan.currentAge + viewRange)),
    [plan.currentAge, plan.targetAge, plan.milestones, viewRange],
  );

  const balanceRange = useMemo(() => {
    const balances = visiblePoints.map((point) => point.balance);
    const minBalance = Math.min(...balances, 0);
    const maxBalance = Math.max(...balances, plan.currentBalance);
    const margin = Math.max((maxBalance - minBalance) * 0.15, 100000);
    return { min: minBalance - margin, max: maxBalance + margin };
  }, [plan.currentBalance, visiblePoints]);

  const timelinePath = useMemo(() => {
    if (!visiblePoints.length) {
      return '';
    }

    const width = 1000;
    const height = 420;
    const padX = 56;
    const padY = 34;
    const startAge = visiblePoints[0].age;
    const endAge = visiblePoints[visiblePoints.length - 1].age;
    const { min, max } = balanceRange;
    const xScale = (age: number) => padX + ((age - startAge) / Math.max(0.001, endAge - startAge)) * (width - padX * 2);
    const yScale = (balance: number) => height - padY - ((balance - min) / Math.max(0.001, max - min)) * (height - padY * 2);

    return visiblePoints
      .map((point, index) => {
        const x = xScale(point.age);
        const y = yScale(point.balance);
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }, [balanceRange, visiblePoints]);

  const riskBandPath = useMemo(() => {
    const startAge = plan.currentAge;
    const endAge = viewRange === 'full' ? plan.targetAge : Math.min(plan.targetAge, plan.currentAge + viewRange);
    const optimisticVisible = optimisticProjection.points.filter((point) => point.age >= startAge && point.age <= endAge);
    const conservativeVisible = conservativeProjection.points.filter((point) => point.age >= startAge && point.age <= endAge);

    if (optimisticVisible.length < 2 || conservativeVisible.length < 2) {
      return '';
    }

    const width = 1000;
    const height = 420;
    const padX = 56;
    const padY = 34;
    const xScale = (age: number) => padX + ((age - startAge) / Math.max(0.001, endAge - startAge)) * (width - padX * 2);
    const yScale = (balance: number) => height - padY - ((balance - balanceRange.min) / Math.max(0.001, balanceRange.max - balanceRange.min)) * (height - padY * 2);

    const upperPath = optimisticVisible
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xScale(point.age).toFixed(2)} ${yScale(point.balance).toFixed(2)}`)
      .join(' ');

    const lowerPath = [...conservativeVisible]
      .reverse()
      .map((point) => `L ${xScale(point.age).toFixed(2)} ${yScale(point.balance).toFixed(2)}`)
      .join(' ');

    return `${upperPath} ${lowerPath} Z`;
  }, [balanceRange.max, balanceRange.min, conservativeProjection.points, optimisticProjection.points, plan.currentAge, plan.targetAge, viewRange]);

  const yearlyGraph = useMemo(() => {
    const yearlyPoints = projection.points
      .filter((point) => point.month % 12 === 0)
      .slice(0, 18);
    const maxBalance = Math.max(...yearlyPoints.map((point) => point.balance), plan.currentBalance, 1);
    const totalInvested = plan.currentBalance + plan.monthlySavings * Math.max(0, projection.points[projection.points.length - 1]?.month ?? 0);
    const wealthCreated = projection.endingBalance - totalInvested;
    const positiveEnding = Math.max(0, projection.endingBalance);
    const investedShare = positiveEnding > 0 ? clamp(totalInvested / positiveEnding, 0, 1) : 0;
    const growthShare = positiveEnding > 0 ? clamp(Math.max(0, wealthCreated) / positiveEnding, 0, 1) : 0;

    return {
      yearlyPoints,
      maxBalance,
      totalInvested,
      wealthCreated,
      investedShare,
      growthShare,
    };
  }, [plan.currentBalance, plan.monthlySavings, projection.endingBalance, projection.points]);

  const handlePlanPatch = (patch: Partial<PlanState>) => {
    setPlan((current) => ({ ...current, ...patch }));
  };

  const handleMilestoneChange = (milestoneId: string, patch: Partial<Milestone>) => {
    setPlan((current) => ({
      ...current,
      milestones: current.milestones.map((milestone) => (milestone.id === milestoneId ? { ...milestone, ...patch } : milestone)),
    }));
  };

  const handleRemoveMilestone = (milestoneId: string) => {
    setPlan((current) => ({
      ...current,
      milestones: current.milestones.filter((milestone) => milestone.id !== milestoneId),
    }));
  };

  const handleAddMilestone = () => {
    setDraftMilestone({
      id: createId(),
      label: 'New milestone',
      age: clamp(plan.currentAge + 5, 0, 100),
      cost: 1000000,
      category: 'other',
      icon: '•',
      note: '',
    });
    setEditorMode('milestone');
    setShowEditor(true);
  };

  const handleSmartAdd = () => {
    const suggestion = suggestMilestone(quickGoal);
    setDraftMilestone({
      id: createId(),
      label: suggestion.label,
      age: clamp(plan.currentAge + 4, 0, 100),
      cost: suggestion.cost,
      category: suggestion.category,
      icon: suggestion.icon,
      note: suggestion.note,
    });
    setEditorMode('milestone');
    setShowEditor(true);
    setStatusMessage(`Suggested milestone loaded from "${quickGoal}".`);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatusMessage('Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      speechRecognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setQuickGoal(transcript);
        setStatusMessage(`Heard: ${transcript}`);
      }
    };
    recognition.onerror = (event) => {
      setStatusMessage(`Voice input error: ${event.error}`);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      speechRecognitionRef.current = null;
    };

    speechRecognitionRef.current = recognition;
    setIsListening(true);
    setStatusMessage('Listening for a milestone phrase...');
    recognition.start();
  };

  const handleImportTemplate = (templateId: string) => {
    const template = templates.find((entry) => entry.id === templateId);
    if (!template) {
      return;
    }

    setPlan(template.plan);
    setStatusMessage(`Imported ${template.label}.`);
  };

  const handleCopyShareLink = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#${encodePlan(plan)}`;
    await navigator.clipboard.writeText(shareUrl);
    window.history.replaceState(null, '', `#${encodePlan(plan)}`);
    setStatusMessage('Share link copied to clipboard.');
  };

  const handleExportPdf = () => {
    const summary = [
      'LifeWealth Planner',
      `Age: ${plan.currentAge}`,
      `Income: ${currency.format(plan.monthlyIncome)}`,
      `Savings: ${currency.format(plan.monthlySavings)} / month`,
      '',
      'Milestones',
      ...plan.milestones.map((milestone) => `${milestone.label} @ ${milestone.age} | ${currency.format(milestone.cost)}`),
    ].join('\n');

    downloadText('lifewealth-plan.txt', summary, 'text/plain;charset=utf-8');
    setStatusMessage('Exported a print-friendly text plan.');
  };

  const handleAuthSubmit = () => {
    const email = authDraft.email.trim() || 'demo@lifewealth.app';
    const name = authMode === 'signup'
      ? authDraft.name.trim() || email.split('@')[0]
      : email.split('@')[0] || 'Planner';
    const user = { name, email };

    setAuthUser(user);
    window.localStorage.setItem('lifewealth-user', JSON.stringify(user));
    setShowAuth(false);
    setStatusMessage(`${authMode === 'signup' ? 'Account created' : 'Signed in'} as ${user.name}.`);
  };

  const handleSignOut = () => {
    setAuthUser(null);
    window.localStorage.removeItem('lifewealth-user');
    setStatusMessage('Signed out. Your current plan is still visible on this device.');
  };

  const handleCsvImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    const parsed = parseMilestonesCsv(text, plan.currentAge);

    if (!parsed.imported.length) {
      setStatusMessage('No valid milestones found in CSV. Use: label,age,cost,category,icon,note');
      event.target.value = '';
      return;
    }

    setPlan((current) => ({
      ...current,
      milestones: [
        ...current.milestones,
        ...parsed.imported.map((milestone) => ({ ...milestone, id: createId() })),
      ],
    }));

    setStatusMessage(
      `Imported ${parsed.imported.length} milestone${parsed.imported.length === 1 ? '' : 's'}${parsed.skipped ? `, skipped ${parsed.skipped} invalid row${parsed.skipped === 1 ? '' : 's'}` : ''}.`,
    );
    event.target.value = '';
  };

  const updateMilestoneFromPointer = (clientX: number) => {
    if (!draggingId || !svgRef.current) {
      return;
    }

    const svg = svgRef.current;
    const bounds = svg.getBoundingClientRect();
    const width = 1000;
    const padX = 56;
    const startAge = plan.currentAge;
    const endAge = viewRange === 'full' ? plan.targetAge : Math.min(plan.targetAge, plan.currentAge + viewRange);
    const normalizedX = clamp(clientX - bounds.left, 0, bounds.width);
    const age = clamp(startAge + ((normalizedX - padX) / Math.max(1, width - padX * 2)) * (endAge - startAge), 0, 100);

    setPlan((current) => ({
      ...current,
      milestones: current.milestones.map((milestone) => (milestone.id === draggingId ? { ...milestone, age: Number(age.toFixed(1)) } : milestone)),
    }));
  };

  const selectedMilestone = plan.milestones.find((milestone) => milestone.id === selectedMilestoneId) ?? plan.milestones[0];
  const nextFour = [...projection.impacts]
    .sort((left, right) => left.age - right.age)
    .slice(0, 4);

  const firstGapImpact = nextFour.find((impact) => impact.gap > 0);
  const activeSavingsShortfall = firstGapImpact?.gap ?? 0;
  const monthsToGap = firstGapImpact ? Math.max(1, Math.round((firstGapImpact.age - plan.currentAge) * 12)) : 1;
  const recommendedIncrease = firstGapImpact ? Math.ceil(firstGapImpact.gap / monthsToGap) : 0;

  return (
    <div className="app-shell">
      <header className="hero-card">
        <div>
          <p className="eyebrow">LifeWealth Planner</p>
          <h1>Plan four steps ahead without spreadsheets.</h1>
          <p className="hero-copy">
            Drag milestones, see compounding, and keep the plan flexible for family, education, and retirement decisions.
          </p>
        </div>
        <div className="hero-actions">
          <div className="auth-chip">
            {authUser ? (
              <>
                <span>{authUser.name}</span>
                <button className="button ghost small" onClick={handleSignOut}>Sign out</button>
              </>
            ) : (
              <>
                <button
                  className="button ghost small"
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuth(true);
                  }}
                >
                  Login
                </button>
                <button
                  className="button primary small"
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuth(true);
                  }}
                >
                  Sign up
                </button>
              </>
            )}
          </div>
          <button className="button primary" onClick={handleAddMilestone}>Add milestone</button>
          <button className="button primary" onClick={() => document.getElementById('wealth-suite')?.scrollIntoView({ behavior: 'smooth' })}>Open wealth suite</button>
          <button className="button ghost" onClick={handleCopyShareLink}>Copy share link</button>
          <button className="button ghost" onClick={() => downloadSvgAsPng(svgRef.current, 'lifewealth-planner.png')}>Export PNG</button>
          <button className="button ghost" onClick={() => downloadSvg(svgRef.current, 'lifewealth-planner.svg')}>Export SVG</button>
        </div>
      </header>

      <section className="premium-preview">
        <div>
          <p className="eyebrow">Premium modules added</p>
          <h2>FIRE, dividends, SIP, SWP, net worth, passive income, goals, DRIP, inflation, retirement, emergency fund, and wealth score.</h2>
        </div>
        <div className="premium-preview-actions">
          <span>{subscriptionTier === 'premium' ? 'Premium unlocked' : 'Some engines locked in Free preview'}</span>
          <button
            className="button primary"
            onClick={() => document.getElementById('wealth-suite')?.scrollIntoView({ behavior: 'smooth' })}
          >
            View all 12 features
          </button>
        </div>
      </section>

      <AdvancedWealthStudio
        currentAge={plan.currentAge}
        defaultMonthlyIncome={plan.monthlyIncome}
        defaultMonthlySavings={plan.monthlySavings}
        tier={subscriptionTier}
        onUpgrade={() => {
          setSubscriptionTier('premium');
          setStatusMessage('Premium wealth engines unlocked: FIRE, dividends, SWP, DRIP, net worth, and AI-style insights.');
        }}
      />

      <main className="workspace">
        <section className="timeline-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Projection</p>
              <h2>Zoomable timeline</h2>
            </div>
            <div className="segmented-control">
              {viewOptions.map((option) => (
                <button
                  key={String(option.value)}
                  className={viewRange === option.value ? 'segmented active' : 'segmented'}
                  onClick={() => setViewRange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <svg
            ref={svgRef}
            className="timeline-svg"
            viewBox="0 0 1000 420"
            role="img"
            aria-label="Projected financial timeline"
            onPointerMove={(event) => updateMilestoneFromPointer(event.clientX)}
            onPointerUp={() => setDraggingId(null)}
            onPointerLeave={() => setDraggingId(null)}
          >
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7dd3fc" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="riskBandGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {Array.from({ length: 6 }).map((_, index) => {
              const y = 40 + index * 58;
              return <line key={index} x1="56" x2="944" y1={y} y2={y} className="grid-line" />;
            })}

            {visiblePoints.length > 1 && (
              <path
                d={`${timelinePath} L 944 386 L 56 386 Z`}
                fill="url(#fillGradient)"
                opacity="0.8"
              />
            )}
            {riskBandPath && <path d={riskBandPath} className="risk-band" fill="url(#riskBandGradient)" />}
            <path d={timelinePath} className="timeline-line" filter="url(#glow)" />

            {showFamily && savingsSplit.map(({ member }, index) => {
              const memberPlan = {
                ...plan,
                monthlySavings: savingsSplit[index].savings,
              };
              const memberProjection = simulatePlan(memberPlan);
              const memberPoints = memberProjection.points.filter((point) => point.age >= plan.currentAge && point.age <= (viewRange === 'full' ? plan.targetAge : plan.currentAge + viewRange));
              if (!memberPoints.length) {
                return null;
              }

              const memberPath = memberPoints
                .map((point, pointIndex) => {
                  const startAge = memberPoints[0].age;
                  const endAge = memberPoints[memberPoints.length - 1].age;
                  const x = 56 + ((point.age - startAge) / Math.max(0.001, endAge - startAge)) * 888;
                  const y = 386 - ((point.balance - balanceRange.min) / Math.max(0.001, balanceRange.max - balanceRange.min)) * 324;
                  return `${pointIndex === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
                })
                .join(' ');

              return <path key={member.id} d={memberPath} className="member-line" stroke={member.color} />;
            })}

            {visibleMilestones.map((milestone) => {
              const startAge = plan.currentAge;
              const endAge = viewRange === 'full' ? plan.targetAge : Math.min(plan.targetAge, plan.currentAge + viewRange);
              const x = 56 + ((milestone.age - startAge) / Math.max(0.001, endAge - startAge)) * 888;
              const y = 386 - ((projection.points.find((point) => Math.abs(point.age - milestone.age) < 0.15)?.balance ?? plan.currentBalance) - balanceRange.min) / Math.max(0.001, balanceRange.max - balanceRange.min) * 324;
              const selected = milestone.id === selectedMilestoneId;

              return (
                <g key={milestone.id} transform={`translate(${x}, ${y})`}>
                  <circle
                    r={selected ? 13 : 10}
                    className="milestone-dot"
                    style={{ fill: categoryColors[milestone.category] }}
                    onClick={() => setSelectedMilestoneId(milestone.id)}
                    onPointerDown={() => setDraggingId(milestone.id)}
                  />
                  <text x="16" y="4" className="milestone-label">
                    {milestone.icon} {milestone.label}
                  </text>
                </g>
              );
            })}

            <line x1="56" x2="944" y1="386" y2="386" className="axis-line" />
          </svg>

          <div className="chart-expansion">
            <div className="mini-chart-card wide">
              <div className="panel-header compact">
                <div>
                  <p className="eyebrow">Growth chart</p>
                  <h3>Year-wise wealth runway</h3>
                </div>
                <strong>{currency.format(projection.endingBalance)}</strong>
              </div>
              <div className="wealth-bars">
                {yearlyGraph.yearlyPoints.map((point) => (
                  <div className="wealth-bar-column" key={point.month}>
                    <span
                      className={point.balance < 0 ? 'wealth-bar negative' : 'wealth-bar'}
                      style={{ height: `${clamp(Math.abs(point.balance) / yearlyGraph.maxBalance, 0.04, 1) * 100}%` }}
                      title={`${point.age.toFixed(0)} yrs: ${currency.format(point.balance)}`}
                    />
                    <small>{point.age.toFixed(0)}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="mini-chart-card">
              <p className="eyebrow">Split</p>
              <h3>Invested vs returns</h3>
              <div className="donut-chart" style={{
                background: `conic-gradient(#38bdf8 0 ${yearlyGraph.investedShare * 100}%, #34d399 ${yearlyGraph.investedShare * 100}% ${(yearlyGraph.investedShare + yearlyGraph.growthShare) * 100}%, rgba(148, 163, 184, 0.16) ${(yearlyGraph.investedShare + yearlyGraph.growthShare) * 100}% 100%)`,
              }}>
                <strong>{percent.format(yearlyGraph.growthShare)}</strong>
                <span>growth</span>
              </div>
              <div className="chart-legend">
                <span><i className="legend-dot invested" /> Invested {currency.format(yearlyGraph.totalInvested)}</span>
                <span><i className="legend-dot returns" /> Returns {currency.format(yearlyGraph.wealthCreated)}</span>
              </div>
            </div>

            <div className="mini-chart-card">
              <p className="eyebrow">Milestones</p>
              <h3>Impact radar</h3>
              <div className="impact-list">
                {nextFour.length ? nextFour.map((impact) => (
                  <div className="impact-row" key={impact.milestoneId}>
                    <span>{impact.label}</span>
                    <strong>{impact.gap > 0 ? currency.format(impact.gap) : 'Covered'}</strong>
                  </div>
                )) : <p className="empty-state">Add milestones to see impact.</p>}
              </div>
            </div>
          </div>

          <div className="insight-grid">
            <div className="insight-card accent">
              <span>Ending balance</span>
              <strong>{currency.format(projection.endingBalance)}</strong>
              <p>{projection.minimumBalance < 0 ? 'Plan crosses negative territory.' : 'Runway stays positive through the selected window.'}</p>
            </div>
            <div className="insight-card">
              <span>Shortfall signal</span>
              <strong>{activeSavingsShortfall > 0 ? currency.format(activeSavingsShortfall) : 'None'}</strong>
              <p>{activeSavingsShortfall > 0 ? `Add about ${currency.format(Math.ceil(activeSavingsShortfall / 12))} / month to close the first gap.` : 'Current assumptions keep the first visible step green.'}</p>
              {activeSavingsShortfall > 0 && (
                <button
                  className="button ghost small inline-button"
                  onClick={() => {
                    handlePlanPatch({ monthlySavings: plan.monthlySavings + recommendedIncrease });
                    setStatusMessage(`Raised savings by ${currency.format(recommendedIncrease)} / month to address the nearest gap.`);
                  }}
                >
                  Apply +{currency.format(recommendedIncrease)}/mo
                </button>
              )}
            </div>
            <div className="insight-card">
              <span>Target horizon</span>
              <strong>{viewRange === 'full' ? `${plan.currentAge} to ${plan.targetAge}` : `${viewRange} years`}</strong>
              <p>{percent.format(plan.annualReturn / 100)} annual growth and {percent.format(plan.inflationRate / 100)} inflation sensitivity.</p>
            </div>
          </div>

          <section className="control-card milestone-editor-card">
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Milestones</p>
                <h3>Editor and list</h3>
              </div>
            </div>
            <div className="milestone-list">
              {plan.milestones.map((milestone) => (
                <button key={milestone.id} className={milestone.id === selectedMilestoneId ? 'milestone-row active' : 'milestone-row'} onClick={() => setSelectedMilestoneId(milestone.id)}>
                  <span className="milestone-icon" style={{ background: categoryColors[milestone.category] }}>{milestone.icon}</span>
                  <div>
                    <strong>{milestone.label}</strong>
                    <span>{milestone.age} yrs Â· {currency.format(milestone.cost)} Â· {categoryLabels[milestone.category]}</span>
                  </div>
                </button>
              ))}
            </div>
            {selectedMilestone && (
              <div className="selected-summary">
                <strong>Selected: {selectedMilestone.label}</strong>
                <span>{selectedMilestone.note ?? 'Drag the marker on the timeline to shift age.'}</span>
              </div>
            )}
          </section>
        </section>

        <aside className="control-panel">
          <section className="control-card">
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Onboard</p>
                <h3>Start from a template</h3>
              </div>
            </div>
            <div className="template-list">
              {templates.slice(0, 5).map((template) => (
                <button key={template.id} className="template-item" onClick={() => handleImportTemplate(template.id)}>
                  <strong>{template.label}</strong>
                  <span>{template.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="control-card">
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">What if</p>
                <h3>Live sliders</h3>
              </div>
            </div>
            <SliderField label="Monthly savings" value={plan.monthlySavings} onChange={(value) => handlePlanPatch({ monthlySavings: value })} min={5000} max={200000} step={1000} suffix="" />
            <SliderField label="Inflation" value={plan.inflationRate} onChange={(value) => handlePlanPatch({ inflationRate: value })} min={0} max={10} step={0.1} suffix="%" />
            <SliderField label="Return rate" value={plan.annualReturn} onChange={(value) => handlePlanPatch({ annualReturn: value })} min={3} max={12} step={0.1} suffix="%" />
            <SliderField label="Current balance" value={plan.currentBalance} onChange={(value) => handlePlanPatch({ currentBalance: value })} min={0} max={10000000} step={50000} suffix="" />
          </section>

          <section className="control-card">
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">AI and import</p>
                <h3>Speech, keyword, and CSV add</h3>
              </div>
            </div>
            <EditorField label="Goal prompt" value={quickGoal} onChange={setQuickGoal} />
            <div className="button-row">
              <button className="button primary" onClick={handleSmartAdd}>Parse goal</button>
              <button className="button ghost" onClick={handleVoiceInput}>{isListening ? 'Stop voice' : 'Voice ready'}</button>
              <button className="button ghost" onClick={() => csvInputRef.current?.click()}>Import CSV</button>
            </div>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden-file-input"
              onChange={handleCsvImport}
            />
            <p className="helper-text">CSV columns: label, age, cost, category, icon, note</p>
          </section>

          <section className="control-card">
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Family</p>
                <h3>Shared planning</h3>
              </div>
              <button className="button ghost small" onClick={() => setShowFamily((current) => !current)}>{showFamily ? 'Hide arcs' : 'Show arcs'}</button>
            </div>
            <div className="button-row">
              <button className="button primary" onClick={() => setShowFamilyDrawer(true)}>Add member</button>
              <button className="button ghost" onClick={() => setPlan((current) => ({ ...current, familyMembers: current.familyMembers.slice(0, 1) }))}>Solo mode</button>
            </div>
            <div className="member-list">
              {plan.familyMembers.map((member) => (
                <div className="member-chip" key={member.id}>
                  <span className="member-color" style={{ background: member.color }} />
                  <div>
                    <strong>{member.name}</strong>
                    <span>{member.age} yrs · {currency.format(member.income)} income · {member.contributionShare}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="control-card">
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Milestones</p>
                <h3>Editor and list</h3>
              </div>
            </div>
            <div className="milestone-list">
              {plan.milestones.map((milestone) => (
                <button key={milestone.id} className={milestone.id === selectedMilestoneId ? 'milestone-row active' : 'milestone-row'} onClick={() => setSelectedMilestoneId(milestone.id)}>
                  <span className="milestone-icon" style={{ background: categoryColors[milestone.category] }}>{milestone.icon}</span>
                  <div>
                    <strong>{milestone.label}</strong>
                    <span>{milestone.age} yrs · {currency.format(milestone.cost)} · {categoryLabels[milestone.category]}</span>
                  </div>
                </button>
              ))}
            </div>
            {selectedMilestone && (
              <div className="selected-summary">
                <strong>Selected: {selectedMilestone.label}</strong>
                <span>{selectedMilestone.note ?? 'Drag the marker on the timeline to shift age.'}</span>
              </div>
            )}
          </section>
        </aside>
      </main>

      <section className="bottom-band">
        <div className="control-card wide">
          <div className="panel-header compact">
            <div>
              <p className="eyebrow">4 steps ahead</p>
              <h3>Next actions</h3>
            </div>
            <button className="button ghost small" onClick={handleExportPdf}>Export plan</button>
          </div>
          <div className="roadmap-grid">
            {nextFour.length ? nextFour.map((step, index) => (
              <article key={`${step.milestoneId}-${index}`} className={step.gap > 0 ? 'roadmap-step alert' : 'roadmap-step'}>
                <span>Step {index + 1}</span>
                <strong>{step.label}</strong>
                <p>{step.age.toFixed(1)} yrs · {currency.format(step.inflatedCost)}</p>
                <small>{step.gap > 0 ? `Gap: ${currency.format(step.gap)}` : 'Green at current assumptions'}</small>
              </article>
            )) : <p className="empty-state">Add milestones to generate the next four steps.</p>}
          </div>
        </div>

        <div className="control-card narrow">
          <div className="panel-header compact">
            <div>
              <p className="eyebrow">Status</p>
              <h3>Live snapshot</h3>
            </div>
          </div>
          <div className="status-stack">
            <p>{statusMessage}</p>
            <p>{plan.familyMembers.length} member{plan.familyMembers.length === 1 ? '' : 's'} in the household plan.</p>
            <p>{plan.milestones.length} milestone{plan.milestones.length === 1 ? '' : 's'} across the timeline.</p>
          </div>
        </div>
      </section>

      <section className="closing-panel">
        <div className="closing-copy">
          <p className="eyebrow">Pink portfolio desk</p>
          <h2>Keep the plan moving after every milestone.</h2>
          <p>
            Review your runway, rebalance savings, and keep the next family goal visible before the numbers drift.
          </p>
        </div>
        <div className="closing-metrics">
          <article>
            <span>Projected wealth</span>
            <strong>{currency.format(projection.endingBalance)}</strong>
          </article>
          <article>
            <span>Monthly savings</span>
            <strong>{currency.format(plan.monthlySavings)}</strong>
          </article>
          <article>
            <span>Plan horizon</span>
            <strong>{plan.targetAge - plan.currentAge} yrs</strong>
          </article>
        </div>
      </section>

      {showEditor && (
        <div className="modal-backdrop" onClick={() => setShowEditor(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Editor</p>
                <h3>{editorMode === 'milestone' ? 'Milestone details' : 'Family member'}</h3>
              </div>
              <button className="button ghost small" onClick={() => setShowEditor(false)}>Close</button>
            </div>

            {editorMode === 'milestone' ? (
              <div className="editor-grid">
                <EditorField label="Label" value={draftMilestone.label} onChange={(value) => setDraftMilestone((current) => ({ ...current, label: value }))} />
                <EditorField label="Icon" value={draftMilestone.icon} onChange={(value) => setDraftMilestone((current) => ({ ...current, icon: value.slice(0, 2) }))} />
                <EditorField label="Age" value={String(draftMilestone.age)} onChange={(value) => setDraftMilestone((current) => ({ ...current, age: clamp(Number(value || 0), 0, 100) }))} type="number" min={0} max={100} />
                <EditorField label="Cost" value={String(draftMilestone.cost)} onChange={(value) => setDraftMilestone((current) => ({ ...current, cost: Math.max(0, Number(value || 0)) }))} type="number" min={0} />
                <label className="field field-wide">
                  <span>Category</span>
                  <select
                    value={draftMilestone.category}
                    onChange={(event) => setDraftMilestone((current) => ({ ...current, category: event.target.value as Milestone['category'] }))}
                  >
                    {Object.keys(categoryLabels).map((key) => (
                      <option key={key} value={key}>{categoryLabels[key as Milestone['category']]}</option>
                    ))}
                  </select>
                </label>
                <label className="field field-wide">
                  <span>Note</span>
                  <textarea
                    value={draftMilestone.note ?? ''}
                    onChange={(event) => setDraftMilestone((current) => ({ ...current, note: event.target.value }))}
                    rows={4}
                  />
                </label>
              </div>
            ) : (
              <div className="editor-grid">
                <EditorField label="Name" value={draftMember.name} onChange={(value) => setDraftMember((current) => ({ ...current, name: value }))} />
                <EditorField label="Age" value={String(draftMember.age)} onChange={(value) => setDraftMember((current) => ({ ...current, age: clamp(Number(value || 0), 0, 100) }))} type="number" min={0} max={100} />
                <EditorField label="Income" value={String(draftMember.income)} onChange={(value) => setDraftMember((current) => ({ ...current, income: Math.max(0, Number(value || 0)) }))} type="number" min={0} />
                <EditorField label="Share %" value={String(draftMember.contributionShare)} onChange={(value) => setDraftMember((current) => ({ ...current, contributionShare: clamp(Number(value || 0), 1, 100) }))} type="number" min={1} max={100} />
                <EditorField label="Color" value={draftMember.color} onChange={(value) => setDraftMember((current) => ({ ...current, color: value }))} />
              </div>
            )}

            <div className="button-row end">
              <button
                className="button primary"
                onClick={() => {
                  if (editorMode === 'milestone') {
                    setPlan((current) => ({ ...current, milestones: [...current.milestones, draftMilestone] }));
                    setSelectedMilestoneId(draftMilestone.id);
                  } else {
                    setPlan((current) => ({ ...current, familyMembers: [...current.familyMembers, draftMember] }));
                  }
                  setShowEditor(false);
                  setStatusMessage(editorMode === 'milestone' ? 'Milestone added.' : 'Family member added.');
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuth && (
        <div className="modal-backdrop" onClick={() => setShowAuth(false)}>
          <div className="modal-card auth-modal" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Account</p>
                <h3>{authMode === 'login' ? 'Login to LifeWealth' : 'Create your account'}</h3>
              </div>
              <button className="button ghost small" onClick={() => setShowAuth(false)}>Close</button>
            </div>
            <div className="auth-tabs">
              <button className={authMode === 'login' ? 'segmented active' : 'segmented'} onClick={() => setAuthMode('login')}>Login</button>
              <button className={authMode === 'signup' ? 'segmented active' : 'segmented'} onClick={() => setAuthMode('signup')}>Sign up</button>
            </div>
            <div className="editor-grid">
              {authMode === 'signup' && (
                <EditorField label="Full name" value={authDraft.name} onChange={(name) => setAuthDraft((current) => ({ ...current, name }))} />
              )}
              <EditorField label="Email" value={authDraft.email} onChange={(email) => setAuthDraft((current) => ({ ...current, email }))} type="email" />
              <EditorField label="Password" value={authDraft.password} onChange={(password) => setAuthDraft((current) => ({ ...current, password }))} type="password" />
            </div>
            <div className="auth-note">
              <strong>Demo auth</strong>
              <span>This saves a local profile for the prototype. Real backend auth can be connected later.</span>
            </div>
            <div className="button-row end">
              <button className="button primary" onClick={handleAuthSubmit}>
                {authMode === 'login' ? 'Login' : 'Create account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showFamilyDrawer && (
        <div className="modal-backdrop" onClick={() => setShowFamilyDrawer(false)}>
          <div className="modal-card narrow" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Family mode</p>
                <h3>Add member</h3>
              </div>
              <button className="button ghost small" onClick={() => setShowFamilyDrawer(false)}>Close</button>
            </div>
            <div className="editor-grid">
              <EditorField label="Name" value={draftMember.name} onChange={(value) => setDraftMember((current) => ({ ...current, name: value }))} />
              <EditorField label="Age" value={String(draftMember.age)} onChange={(value) => setDraftMember((current) => ({ ...current, age: clamp(Number(value || 0), 0, 100) }))} type="number" min={0} max={100} />
              <EditorField label="Income" value={String(draftMember.income)} onChange={(value) => setDraftMember((current) => ({ ...current, income: Math.max(0, Number(value || 0)) }))} type="number" min={0} />
              <EditorField label="Share %" value={String(draftMember.contributionShare)} onChange={(value) => setDraftMember((current) => ({ ...current, contributionShare: clamp(Number(value || 0), 1, 100) }))} type="number" min={1} max={100} />
            </div>
            <div className="button-row end">
              <button
                className="button primary"
                onClick={() => {
                  setPlan((current) => ({ ...current, familyMembers: [...current.familyMembers, { ...draftMember, id: createId() }] }));
                  setShowFamilyDrawer(false);
                  setStatusMessage('Family member added.');
                }}
              >
                Add member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
