import React from "react";
import { createRoot } from "react-dom/client";
import { Activity, ShieldCheck, Workflow } from "lucide-react";
import "./styles.css";

const setupChecks = [
  "UiPath folder: TreatmentAccessHackathon",
  "Assistant/Robot: installed and signed in",
  "Data Service/Data Fabric: reachable",
  "Action Center: current user task-eligible",
  "Mock API: pending local run",
];

function App() {
  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="project-label">UiPath AgentHack 2026</p>
          <h1>Treatment Access Command Center</h1>
          <p className="lede">
            A live synthetic prior-authorization case system where UiPath
            orchestrates agents, people, APIs, robots, and audit evidence.
          </p>
        </div>
        <div className="status-panel" aria-label="Setup status">
          <div className="panel-title">
            <ShieldCheck size={18} />
            Checkpoint 0 Scaffold
          </div>
          <ul>
            {setupChecks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid">
        <article>
          <Workflow size={22} />
          <h2>UiPath First</h2>
          <p>
            Maestro Case remains the case lifecycle. This app will visualize
            UiPath-written events.
          </p>
        </article>
        <article>
          <Activity size={22} />
          <h2>Live State Backbone</h2>
          <p>
            Next checkpoint wires the mock EHR, payer, pharmacy, and event
            mirror APIs.
          </p>
        </article>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
