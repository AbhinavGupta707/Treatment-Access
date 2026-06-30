# Three-Minute Final Product Demo Script

Use this for the concise UiPath AgentHack recording or live walkthrough. This
version is optimized for the Track 1 Maestro Case judging criteria: lead with
healthcare value, show a working product flow, then show UiPath governance proof
without overclaiming side effects.

## Positioning Decision

Do not say the product is a fully completed live Maestro run unless a later live
run actually completes through the human task boundary. The stronger truthful
positioning is:

> Treatment Access Command Center is a Maestro case-management product: the
> Command Center is the access-team cockpit, while UiPath Automation Cloud is
> the governed orchestration layer underneath.

That is both accurate and judge-friendly. The UI does not need to look like
Maestro; it needs to make the governed case understandable to the user. The
proof manifest is where we show that UiPath owns the live evidence trail:
Data Fabric proof records, completed Action Center task `4401667`, published
and activated solution, Maestro debug proof to the HITL boundary, and a
successful Orchestrator job.

## Setup

- Open Command Center: `http://127.0.0.1:5173`.
- Keep Mock Payer Portal ready: `http://127.0.0.1:5174`.
- Start on `Dashboard`, then move through `Cases`, `Evidence`,
  `Start case orchestration`, `Submissions`, `Appeals`, and
  `Open UiPath records`.
- Before recording, run `CI=true pnpm smoke:checkpoint8-live-uipath`.
- If showing live model/provider evidence, also run
  `CI=true pnpm smoke:checkpoint6-live-providers` and
  `CI=true pnpm smoke:live-agents -- --require-live --call-model` after loading
  the ignored local environment.

## Broad Navigation Track

Use this as the visual choreography while recording:

1. `Dashboard` - establish the operational pain: active cases, at-risk delays,
   urgent featured case, and next best actions.
2. `Cases` - open `TACC-2026-001` and show the access coordinator view:
   patient, payer, treatment, deadline, progress, actors, and recent activity.
3. `Evidence` - click the first evidence row and show why the system stops at
   `Needs Signoff` instead of submitting an unsupported clinical assertion.
4. `Dashboard` - click `Start case orchestration` and pause on the orchestration
   card so the viewer sees the case being prepared through governed steps.
5. `Submissions` - show the exception route: payer API unavailable, UiPath
   robot fallback waiting, and no fake confirmation claimed.
6. `Appeals` - show denial rescue and appeal packet assembly: denial reason,
   supporting documents, clinician attestation, signoff, and next actions.
7. `Dashboard` - click `Open UiPath records` and close on the governance proof:
   records, Action Center, solution deployment, Maestro boundary, Orchestrator
   job, and safety rows.

## Critical Analysis Prompt

Use this prompt if you want to re-check the script before recording:

```text
Critically review docs/demo-script-3min-final.md against the current repo,
docs/live-uipath-proof-closeout.md, README.md, docs/submission.md, and the
official UiPath AgentHack Devpost requirements. Verify that the script
prioritizes business impact and Track 1 Maestro Case criteria, that every live
claim is backed by current proof, that it does not imply completed live Maestro
HITL, portal UI automation, Agent Builder execution, IXP mutation, real PHI, or
real payer submission, and that every screen cue matches the current Command
Center UI. Then patch only docs/demo-script-3min-final.md with the best
3-minute version.
```

## Spoken Script

**0:00-0:20 - Dashboard: The Problem**

Navigation / visual action: Start on `Dashboard`. Keep the KPI row and featured
urgent case visible. Hover or point at `At-Risk Delays`, `Awaiting Clinician
Signoff`, the featured `Synthetic Patient TAC-001` case, and the `Next Best
Actions` panel.

What to say:

Hello everyone, my name is Abhinav, and this is Treatment Access Command
Center: a UiPath-governed case-management product for specialty-medication
access. Prior authorization is the payer approval step before treatment can
move forward. The AMA reports that physicians and staff spend about 13 hours a
week on prior authorization, with 40 requests per physician per week. That is
the gap Treatment Access Command Center is built for.

**0:20-0:43 - Case Detail: The User View**

Navigation / visual action: Click `Open Case` on the featured case, or click
`Cases` in the left nav and open `TACC-2026-001`. Hold on the case header, then
move your cursor across `Case Progress`, `Involved Actors`, and `Recent
Activity`.

What to say:

Here is what an access coordinator sees first: which patient is stuck, why the
case is at risk, who owns the next action, and how close the payer deadline is.
This is not a chat window or a form filler. It is a Maestro case lifecycle made
readable for the team: intake, policy check, evidence mapping, clinician
signoff, submission, denial rescue, appeal, and pharmacy handoff.

**0:43-1:08 - Evidence Matrix: Why It Is Safer**

Navigation / visual action: Click `Evidence` in the left nav. Select the first
evidence row, which should show `Needs Signoff`. Keep the selected evidence
drawer visible on the right, then point to the source, confidence, and review
requirement.

What to say:

This is the core workflow. The system turns payer policy into a requirement
checklist, then maps each requirement to chart evidence, source spans, and
confidence. If evidence is partial, missing, or high-impact, the case stops for
human review instead of guessing. The product saves time by preparing the
packet, but it keeps the safety rule simple: every clinical assertion needs
evidence, a policy citation, or clinician approval.

**1:08-1:35 - Start Case Orchestration: The Agentic Work**

Navigation / visual action: Return to `Dashboard`. Click `Start case
orchestration`. Pause on the updated orchestration card and let the viewer see
the sequence: policy, evidence, human gate, payer channel, and rescue path.

What to say:

Behind this one click, seven specialist agents work on the case: coverage
requirements, evidence retrieval, missing evidence, submission packet, denial
rescue, appeal packet, and care continuity. The agents do the repetitive
assembly and reasoning work against synthetic policy, chart, and payer data.
UiPath provides the case orchestration and governance, so the output is not a
loose AI response; it becomes structured case state, audit events, human gates,
API workflow handoffs, and Orchestrator robot work.

**1:35-1:58 - Human Gate: Where People Stay In Charge**

Navigation / visual action: Either stay on the orchestration card if it shows
the next safe action, or jump back to `Evidence` and point at `Needs Signoff`.
The visual goal is to make the human gate feel like a product control, not a
technical disclaimer.

What to say:

This is where the product matters clinically. A diagnosis-severity assertion
can be supported by evidence, but it still needs clinician attestation before
submission. In the live UiPath proof, Action Center task `4401667` was created,
assigned, completed, and read back with synthetic clinician-review output.
That is the handoff pattern: AI prepares, UiPath governs, and humans approve
the accountable decision.

**1:58-2:20 - Submission Fallback: Exception Handling**

Navigation / visual action: Click `Submissions`. Move left to right across the
route: `Payer API Unavailable`, `UiPath Robot Waiting`, and `Confirmation Not
mirrored`. Emphasize that the system is preserving work and routing the
exception, not pretending the payer submission succeeded.

What to say:

Prior authorization breaks most often at the exceptions: payer API unavailable,
missing evidence, denial reason unclear, or appeal deadline approaching. Here,
when the payer API path is unavailable, the case moves into a portal-fallback
route instead of disappearing into a workqueue. The live Orchestrator proof
shows the deployed `PayerPortalFallback` process can run as a UiPath job; the
screen is honest that browser portal automation and confirmation write-back are
the next hardening step, not a fake payer submission.

**2:20-2:43 - Denial Rescue And Appeal**

Navigation / visual action: Click `Appeals`. Hold on `Denial Summary`, then
move to `Appeal Packet Builder`. Point at `Appeal Letter`, `Supporting
Attachments`, `Clinician Attestation`, `Clinician Signoff`, and `Recommended
Next Actions`.

What to say:

If the payer denies the request, Denial Rescue changes the strategy instead of
starting from scratch. A step-therapy denial routes to prior-therapy evidence.
A safety-screen denial routes back to missing labs. Appeal Packet drafts
administrative language with citations and warnings, then waits for clinician
signoff. The point is faster recovery from denial without turning AI into the
final medical or legal decision-maker.

**2:43-3:00 - UiPath Records And Close**

Navigation / visual action: Return to `Dashboard` and click `Open UiPath
records`. Scroll only if needed. Briefly point at the rows for proof records,
Action Center, solution deployment, Maestro boundary proof, Orchestrator job,
and safety constraints.

What to say:

This final drawer is the governance layer underneath the product. UiPath Automation
Cloud holds live proof records, the completed Action Center gate, a published
and activated solution, Maestro debug evidence up to the human-task boundary,
and a successful Orchestrator job. The custom UI is only the access-team
cockpit; UiPath is the execution and governance layer tying agents, APIs,
robots, records, and people together. Treatment Access Command Center is a
Maestro case-management cockpit for access teams: the AI assembles, UiPath
governs, and humans approve.

## If The Recording Runs Long

Cut the source-stat detail and say:

> Prior authorization takes hours every week and delays care. That is the gap
> Treatment Access Command Center is built for.

Cut the portal-hardening sentence and say:

> This demo shows the exception route and UiPath job proof, while clearly
> labelling portal UI automation as production hardening.

## Fallback Lines

- If the local proof run is slow:
  "I will use the latest prepared run. The important product behavior is that
  the case produces governed proof records and stops at human approval when a
  clinical claim needs accountability."
- If live provider evidence is not available:
  "This recording uses deterministic agent mode. Live model and trace claims
  are only made when the provider readiness smoke has passed."
- If asked whether Maestro is fully live end-to-end:
  "The product is built as a Maestro case-management workflow, and live Maestro
  debug proof reached the human-task boundary. The completed human gate is
  proven through live Action Center task `4401667`; I am not claiming a fully
  completed live Maestro HITL run."
- If asked about portal automation:
  "The local portal contract is implemented, and UiPath Orchestrator job
  execution is proven. Browser UI automation and portal confirmation write-back
  are labelled as production hardening, not claimed as complete."
- If asked about real healthcare data:
  "Everything in this recording is synthetic. No real PHI, payer credential,
  provider data, or real payer submission is used."

## Judge Criteria Map

| Criterion                                      | Script moment                                                                                                                                       |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Business Impact & Adoption Potential           | Opens with prior-auth burden, at-risk case, next action, evidence blocker, fewer preventable denials, faster appeal readiness.                      |
| Platform Usage                                 | Positions UiPath as Maestro case/governance layer; proof manifest shows Data Fabric, Action Center, solution deployment, Maestro, Orchestrator job. |
| Technical Execution, Feasibility & Versatility | Evidence blocking, human approval, payer API failure, portal fallback route, denial variation, appeal drafting, truthful proof boundaries.          |
| Completeness of Delivery                       | Working Command Center, local synthetic flow, live UiPath proof IDs, smoke commands, README/setup, public repo, demo under five minutes.            |
| Creativity & Innovation                        | Reframes prior authorization as governed treatment-access orchestration rather than form filling or chat.                                           |
| Presentation                                   | Product-first flow: dashboard, case, evidence, case orchestration, human gate, fallback, appeal, UiPath-record close.                               |
| Coding Agents Bonus                            | Closing and Devpost materials can mention Codex checkpoint orchestration and repo logs; keep detailed coding-agent evidence outside the 3 minutes.  |

## Source Notes

- UiPath AgentHack official page: Track 1 rewards dynamic, exception-heavy
  Maestro Case work with agents, robots, people, stages, handoffs, human
  control, and auditability. Submissions must run on UiPath Automation Cloud
  and include a demo video of no more than five minutes plus a public GitHub
  repo and setup instructions.
- Judging criteria checked on Devpost: Business Impact & Adoption Potential,
  Platform Usage, Technical Execution, Completeness of Delivery, Creativity &
  Innovation, Presentation, and Coding Agents bonus points.
- AMA prior authorization source: `2025 AMA prior authorization physician
survey`, official AMA PDF. Spoken stat uses 13 hours per week and 40 prior
  authorizations per physician per week.
- Current repo state source: `README.md`, `docs/submission.md`, and
  `docs/live-uipath-proof-closeout.md`.
