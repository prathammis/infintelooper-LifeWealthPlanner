# LifeWealth Planner

An interactive financial life planning Progressive Web App (PWA) built with Vite, React, and D3.

## Features

- **Multi-scenario planning** – Model financial futures for multiple family members side-by-side
- **D3 Life Timeline** – Draggable milestone markers on a zoomable/scrollable timeline
- **Net Worth Projection Chart** – Compound growth curves with drawdown markers and a danger-zone indicator
- **What-If Controls** – Real-time sliders for income, expenses, savings, return rate, and inflation
- **Milestone Management** – Add, edit, and delete life goals (home purchase, college, retirement, etc.)
- **PWA Support** – Installable with offline capability via service worker

## Tech Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/)
- [D3.js](https://d3js.org/) for all visualizations
- CSS custom properties for theming (dark mode)

## Getting Started

```bash
npm install
npm run dev       # Development server at http://localhost:5173
npm run build     # Production build to dist/
npm run preview   # Preview production build
```

## Project Structure

```
src/
  components/       # React UI components
    Timeline.jsx          # D3 draggable timeline
    ProjectionChart.jsx   # D3 net-worth projection
    ScenarioManager.jsx   # Scenario CRUD
    WhatIfControls.jsx    # Financial parameter sliders
    MilestoneList.jsx     # Milestone management
    AddMilestoneModal.jsx # Add milestone dialog
  context/
    PlannerContext.jsx    # Global state via useReducer
  utils/
    finance.js            # Projection math + currency formatting
public/
  manifest.json     # PWA manifest
  sw.js             # Service worker
```
