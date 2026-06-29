# Three-Minute Final Demo Script

Use this for a concise UiPath AgentHack recording or live walkthrough. It is
written as a product story grounded in the current repository state:
Checkpoint 8 local synthetic proof, live provider readiness, final proof
manifest, strict UiPath event-state bridge, Action Center proof packet, RPA
preflight, seven agent records, and UiPath artifacts. Do not claim live UiPath
side effects unless the proof manifest shows the corresponding live ID and
timestamp.

## Setup

- Open Command Center: `http://127.0.0.1:5173`.
- Keep Mock Payer Portal ready: `http://127.0.0.1:5174`.
- Start on `Dashboard`, then use `Run live proof`, `Evidence`, `Submissions`,
  `Appeals`, and the live proof or audit drawer.
- Before recording, run `CI=true pnpm smoke:checkpoint7-live-proof`.
- Run `CI=true pnpm smoke:checkpoint8-live-uipath` so the final proof manifest
  and live/local wording boundary are checked.
- If using live model evidence, also run
  `CI=true pnpm smoke:checkpoint6-live-providers` and
  `CI=true pnpm smoke:live-agents -- --require-live --call-model` after loading
  the ignored local environment.

## Spoken Script

**0:00-0:22 - Dashboard**

What to do on screen: Show the Treatment Access Dashboard, active case count,
urgent case, SLA risk, and synthetic-data disclosure.

What to say:

Hello everyone, my name is Abhinav, and this is Treatment Access Command
Center: a UiPath Maestro Case for specialty-medication access. In the AMA's
2025 prior authorization survey, 95% of physicians reported care delays from
prior authorization. The hard part is not filling a form. It is coordinating
payer policy, chart evidence, clinician accountability, submission channels,
denials, appeals, and care handoff. That is the gap Treatment Access Command
Center is built for.

**0:22-0:48 - Case View**

What to do on screen: Open `TACC-2026-001` from the case queue.

What to say:

Let's see how it works. This is a synthetic patient prescribed Fictionalimab, a
specialty biologic. The Command Center is the customer-facing cockpit, but the
architecture keeps UiPath as the orchestration and governance layer. The case
is not a chat session. It has stages for intake, policy check, evidence
mapping, clinician signoff, submission, denial rescue, appeal, approval, and
pharmacy coordination.

**0:48-1:20 - Run Live Proof**

What to do on screen: Click `Run live proof`, then open the live proof detail
drawer.

What to say:

Behind that one click, the current prototype creates a live proof run through
the local treatment-access API, executes seven specialist agent records, and
writes seven synthetic mirror events for the visible case timeline. With live
keys configured, Fireworks and LangSmith readiness are verified; with UiPath
side effects gated, no hidden patient, payer, Action Center, Data Service,
robot, or deployment mutation is being claimed unless the proof drawer shows
the live identifier. For AgentHack Track 1, this is the important shape:
dynamic case progression with agents, humans, APIs, robot fallback, and
auditability.

**1:20-1:52 - Evidence Matrix**

What to do on screen: Open `Evidence`; select a row with source/citation
details.

What to say:

The safety move is the evidence matrix. Every payer criterion is tied to a
policy citation and chart evidence. If a safety lab is missing, confidence is
low, or a clinician rejects an assertion, the packet is blocked instead of
being guessed. The AI explains and assembles. The structured workflow contract
decides whether the evidence is sufficient. Human approval carries
accountability.

**1:52-2:20 - Submission And Portal Fallback**

What to do on screen: Open `Submissions`; show API unavailable and robot
fallback status. Optionally switch to the Mock Payer Portal confirmation view.

What to say:

Now the exception path. If the payer API returns `PAYER_API_DOWN`, the intended
UiPath flow moves the case into `api_failure_portal_fallback`, Orchestrator
owns the `PayerPortalFallback` robot, and the synthetic portal confirmation
`AVFH-PORTAL-SYN-*` is written back as an auditable case event. In the current
repo, the portal contract, local fallback smoke, real UiPath RPA project shell,
Checkpoint 8 RPA preflight, and solution pack dry-run are implemented. A live
robot job is only claimed when Orchestrator evidence is on screen.

**2:20-2:45 - Denial Rescue And Appeal**

What to do on screen: Open `Appeals`; show denial reason, appeal packet, and
clinician signoff.

What to say:

If the payer denies, Denial Rescue classifies the reason: step therapy, safety
screen, or documentation gap. Appeal Packet drafts administrative language with
citations and unsupported-claim warnings, then waits for clinician signoff. It
is not medical advice, not legal advice, and not autonomous payer
communication. Care Continuity then plans pharmacy or scheduling so the product
ends at treatment access, not just payer approval.

**2:45-3:05 - Proof And Close**

What to do on screen: Show the live proof/audit drawer, repo docs, or
architecture proof.

What to say:

This is built to score directly against AgentHack: business impact from fewer
manual reviews and preventable denials; platform usage through Maestro Case,
Agent Builder and coded-agent contracts, API Workflows, Action Center,
Orchestrator, RPA, and event records; technical execution through
schema-bounded agents, exception paths, and smoke tests. The checkpoint logs
also show Codex used to build and verify the product for the coding-agent
bonus. Treatment Access Command Center is UiPath-governed access
orchestration: agents assemble, humans approve, robots rescue channels, and
the audit trail carries the evidence.

## If The Recording Runs Long

Add this sentence to the opening if you want more problem proof:

> and practices completed 40 prior authorizations per physician per week.

Cut this sentence from the close:

> For the coding-agent bonus, the checkpoint logs show Codex used to build,
> integrate, and verify the product.

## Fallback Lines

- If the local live proof API is slow:
  "The live proof is deterministic and repeatable, so I will show the latest
  completed run. The important product behavior is that it writes seven stage
  events and stops at a human approval gate."
- If Fireworks or LangSmith evidence is not available:
  "This recording uses deterministic agent mode. Live model and trace claims
  are only made when the provider readiness smoke has passed."
- If live UiPath Cloud proof is not ready:
  "Checkpoint 8 has prepared the live UiPath proof path: a strict event bridge,
  Action Center proof packet, RPA preflight, and proof manifest. This recording
  claims only the local synthetic path unless a live record, task, job, or
  deployment ID is visible."
- If RPA did not run:
  "The portal fallback contract and RPA project are present, but I am not
  claiming a live robot job unless Orchestrator evidence is visible."

## Judge Criteria Map

| Criterion                                      | Script moment                                                                                                                                            |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Business Impact & Adoption Potential           | Opening prior-auth burden stat, access-delay framing, specialty medication workflow.                                                                     |
| Platform Usage                                 | Explicit UiPath governance layer plus Maestro Case, Agent Builder/coded-agent contracts, API Workflows, Action Center, Orchestrator, RPA, event records. |
| Technical Execution, Feasibility & Versatility | Seven schema-bounded agents, live proof run, event mirror, evidence blocking, API-down robot fallback, denial variation, human gates.                    |
| Completeness of Delivery                       | Public repo, setup scripts, smoke tests, demo docs, deck outline, MIT license.                                                                           |
| Creativity & Innovation                        | Reframes prior auth as treatment-access orchestration, not form filling or a generic assistant.                                                          |
| Presentation                                   | Product-first flow: dashboard, case, live proof, evidence, fallback, appeal, audit close.                                                                |
| Coding Agents Bonus                            | Mention Codex checkpoint logs and generated/verified implementation artifacts.                                                                           |

## Source Notes

- UiPath AgentHack official page: Track 1 rewards dynamic, exception-heavy
  Maestro Case work with agents, robots, people, stages, handoffs, human
  control, and auditability. Submissions require a working UiPath Automation
  Cloud solution, public GitHub repo, deck, and a demo video of no more than
  five minutes. Deadline shown on Devpost: June 29, 2026 at 11:45 PM EDT.
- Judging criteria checked on Devpost: Business Impact & Adoption Potential,
  Platform Usage, Technical Execution, Completeness of Delivery, Creativity &
  Innovation, Presentation, and Coding Agents bonus points.
- AMA prior authorization source: `2025 AMA prior authorization physician
survey`, official AMA PDF. Spoken stat uses 95% care delays and 40 prior
  authorizations per physician per week.
- Current repo state source: `docs/AGENT_MEMORY.md` Checkpoint 8 Closeout and
  the Checkpoint 8 lane handoffs.
