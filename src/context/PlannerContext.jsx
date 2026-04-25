import { createContext, useContext, useReducer } from 'react';

const currentYear = new Date().getFullYear();

const defaultScenarios = [
  {
    id: 'you',
    name: 'You',
    color: '#4f8ef7',
    initialSavings: 50000,
    annualIncome: 80000,
    annualExpenses: 40000,
    returnRate: 7,
    inflationRate: 3,
    milestones: [
      { id: 'm1', name: 'Home Purchase', year: currentYear + 5, cost: 60000, type: 'goal', icon: '🏠' },
      { id: 'm2', name: 'Retirement', year: currentYear + 35, cost: 0, type: 'event', icon: '🎉' },
    ],
  },
  {
    id: 'spouse',
    name: 'Spouse',
    color: '#f7a44f',
    initialSavings: 30000,
    annualIncome: 70000,
    annualExpenses: 35000,
    returnRate: 7,
    inflationRate: 3,
    milestones: [
      { id: 'm3', name: "Child's College", year: currentYear + 20, cost: 120000, type: 'goal', icon: '🎓' },
    ],
  },
];

const initialState = {
  scenarios: defaultScenarios,
  activeScenarioId: 'you',
  timelineStartYear: currentYear,
  zoom: 1,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ACTIVE_SCENARIO':
      return { ...state, activeScenarioId: action.id };
    case 'ADD_SCENARIO':
      return { ...state, scenarios: [...state.scenarios, action.scenario], activeScenarioId: action.scenario.id };
    case 'UPDATE_SCENARIO':
      return {
        ...state,
        scenarios: state.scenarios.map(s => s.id === action.id ? { ...s, ...action.updates } : s),
      };
    case 'DELETE_SCENARIO':
      return {
        ...state,
        scenarios: state.scenarios.filter(s => s.id !== action.id),
        activeScenarioId: state.activeScenarioId === action.id
          ? (state.scenarios.find(s => s.id !== action.id)?.id || null)
          : state.activeScenarioId,
      };
    case 'ADD_MILESTONE': {
      const scenario = state.scenarios.find(s => s.id === action.scenarioId);
      const updated = { ...scenario, milestones: [...scenario.milestones, action.milestone] };
      return { ...state, scenarios: state.scenarios.map(s => s.id === action.scenarioId ? updated : s) };
    }
    case 'UPDATE_MILESTONE': {
      const scenario = state.scenarios.find(s => s.id === action.scenarioId);
      const updated = {
        ...scenario,
        milestones: scenario.milestones.map(m => m.id === action.milestoneId ? { ...m, ...action.updates } : m),
      };
      return { ...state, scenarios: state.scenarios.map(s => s.id === action.scenarioId ? updated : s) };
    }
    case 'DELETE_MILESTONE': {
      const scenario = state.scenarios.find(s => s.id === action.scenarioId);
      const updated = { ...scenario, milestones: scenario.milestones.filter(m => m.id !== action.milestoneId) };
      return { ...state, scenarios: state.scenarios.map(s => s.id === action.scenarioId ? updated : s) };
    }
    case 'SET_ZOOM':
      return { ...state, zoom: action.zoom };
    default:
      return state;
  }
}

const PlannerContext = createContext(null);

export function PlannerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <PlannerContext.Provider value={{ state, dispatch }}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  return useContext(PlannerContext);
}
