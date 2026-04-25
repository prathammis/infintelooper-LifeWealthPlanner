import { PlannerProvider } from './context/PlannerContext';
import ScenarioManager from './components/ScenarioManager';
import WhatIfControls from './components/WhatIfControls';
import Timeline from './components/Timeline';
import ProjectionChart from './components/ProjectionChart';
import MilestoneList from './components/MilestoneList';
import './App.css';

function AppLayout() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-brand">
          <span className="header-logo">💰</span>
          <h1>LifeWealth Planner</h1>
        </div>
        <span className="header-tagline">Plan your financial future — for the whole family</span>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <ScenarioManager />
          <div className="sidebar-divider" />
          <WhatIfControls />
          <div className="sidebar-divider" />
          <MilestoneList />
        </aside>

        <main className="main-content">
          <Timeline />
          <ProjectionChart />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <PlannerProvider>
      <AppLayout />
    </PlannerProvider>
  );
}
