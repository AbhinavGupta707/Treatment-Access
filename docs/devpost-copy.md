# Devpost Copy: Treatment Access Command Center

Use this file as the paste-ready answer bank for the Devpost fields.

## Elevator Pitch

Treatment Access Command Center turns specialty-medication prior authorization
into a UiPath-governed case where agents assemble evidence, humans approve
clinical risk, and robots handle payer exceptions.

## Built With

- UiPath Maestro Case
- UiPath Maestro Flow
- UiPath Agent Builder
- UiPath Coded Agents
- UiPath Action Center
- UiPath Orchestrator
- UiPath Data Fabric / Data Service
- UiPath API Workflows
- UiPath Solutions
- UiPath RPA / Assistant
- UiPath Apps and Action App contracts
- UiPath IXP / Document Understanding design path
- UiPath for Coding Agents / Codex
- TypeScript
- React
- Vite
- Fastify
- Node.js
- pnpm
- Zod
- Fireworks AI provider integration
- LangSmith tracing integration
- Playwright

## UiPath Labs Link / Environment URL

Use this for the Devpost field if it matches the organizer-provided Labs access
email:

```text
https://staging.uipath.com/hackathon26_244/
```

If the organizer-provided Labs access email shows a different
`hackathon26_###` URL, paste that exact URL instead. Do not use the GitHub URL,
localhost URL, demo video URL, or general product URL for this field.

Verified Automation Cloud proof tenant used by the CLI and live proof records:

```text
https://cloud.uipath.com/galacticus/DefaultTenant/
```

## About The Project

# Treatment Access Command Center

**Treatment Access Command Center is a UiPath-governed case-management product
for specialty-medication access: agents assemble the prior-auth work, UiPath
orchestrates the workflow and audit trail, and humans approve clinical risk
before payer-facing action.**

## Inspiration

Prior authorization is one of the least visible but most painful bottlenecks in
healthcare. Before a patient can receive a specialty medication, the care team
often has to prove medical necessity against payer-specific policy, collect
chart evidence, chase missing documentation, wait for clinician attestation,
submit through whichever payer channel works that day, respond to denials, and
coordinate pharmacy handoff.

The cost is not abstract. Physicians and staff spend about **13 hours per week**
on prior authorization, with roughly **40 requests per physician per week**. For
patients, that administrative drag can mean delayed treatment. For doctors and
access teams, it means hours lost to repetitive chart review, payer rule
translation, portal work, and appeal rework.

I built Treatment Access Command Center around a simple belief:
**AI should not become an ungoverned medical decision-maker. It should remove the
administrative sludge around treatment access while UiPath keeps the process
accountable, auditable, and human-approved where it matters.**

## What It Does

Treatment Access Command Center turns one specialty-medication order into a
governed treatment-access case.

The product lets an access coordinator see:

- **Which patient is stuck**
- **Why the case is at risk**
- **Which payer requirement is blocking progress**
- **What evidence supports each clinical claim**
- **Which human, agent, workflow, or robot owns the next action**
- **How close the payer deadline is**

The core workflow:

1. **Case intake** starts from a synthetic specialty-medication order.
2. **Policy analysis** converts payer rules into a source-backed requirement
   checklist.
3. **Evidence mapping** links chart artifacts to each payer criterion with
   source spans, confidence, and review flags.
4. **Human gates** stop high-impact clinical assertions for clinician approval.
5. **Submission routing** prepares the payer packet when evidence is complete.
6. **Exception handling** routes payer API downtime into a governed
   portal-fallback path.
7. **Denial rescue** classifies the denial reason and changes the recovery
   strategy.
8. **Appeal preparation** drafts administrative appeal material with citations
   and unsupported-claim warnings.
9. **Care continuity** prepares pharmacy and scheduling handoff after approval.
10. **Audit packaging** preserves the proof trail across agents, workflows,
    humans, robots, and UiPath records.

The result is not a chat window and not a generic form filler. It is a
case-management cockpit for treatment-access teams: a user can see the case,
understand the next best action, review the evidence, and trust that accountable
approval gates exist before payer-facing work proceeds.

## The Agentic Workflow

The workflow uses **seven specialist agents**, each with a narrow job:

| Agent                          | What It Does                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **Coverage Requirement Agent** | Reads payer policy context and turns it into requirements, criteria, documents, channels, citations, and source spans. |
| **Evidence Retrieval Agent**   | Maps synthetic chart artifacts to policy criteria with confidence scores and review flags.                             |
| **Missing Evidence Agent**     | Detects blocking evidence gaps and drafts the human task payload needed to resolve them.                               |
| **Submission Packet Agent**    | Builds payer packet fields and attachment lists once evidence and clinician gates are ready.                           |
| **Denial Rescue Agent**        | Parses denial or request-for-information reasons and selects the right recovery strategy.                              |
| **Appeal Packet Agent**        | Drafts administrative appeal content for clinician review with policy citations and unsupported-claim warnings.        |
| **Care Continuity Agent**      | Prepares pharmacy, scheduling, and care-team handoff once approval is available.                                       |

The agents do the repetitive reasoning and assembly work that burns staff time:
policy interpretation, evidence matching, missing-document detection, packet
generation, denial classification, appeal drafting, and care coordination.

UiPath is what makes those agent outputs operational. Instead of leaving the
result as a loose AI response, UiPath turns it into structured case state, human
approval gates, API workflow handoffs, Orchestrator robot work, Data Fabric proof
records, and an audit timeline.

## UiPath Orchestration

UiPath is the orchestration and governance layer of the project.

| UiPath Component                             | How It Is Used                                                                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Maestro Case**                             | Coordinates the treatment-access lifecycle: intake, policy check, evidence mapping, clinician signoff, submission, denial rescue, appeal, approval, and pharmacy handoff. |
| **Maestro Flow / HITL**                      | Models the clinician-validation boundary and human-task handoff.                                                                                                          |
| **Agent Builder contracts**                  | Defines the seven domain-agent contracts and their traceable outputs.                                                                                                     |
| **Coded Agents**                             | Implements the TypeScript agent runtime and shared Zod schemas used by smoke tests and local product behavior.                                                            |
| **Action Center**                            | Holds clinician attestation and appeal signoff patterns for accountable review.                                                                                           |
| **API Workflows**                            | Represent EHR hydration, payer submission/status, pharmacy handoff, and event-write contracts.                                                                            |
| **Data Fabric / Data Service**               | Stores proof records and synthetic event state in the UiPath folder.                                                                                                      |
| **Orchestrator**                             | Owns process execution, runtime governance, machine assignment, job logs, and robot execution proof.                                                                      |
| **RPA / Assistant**                          | Provides the `PayerPortalFallback` robot path for payer API unavailable scenarios.                                                                                        |
| **Solutions**                                | Packages and activates the UiPath project boundary for the final live proof.                                                                                              |
| **IXP / Document Understanding design path** | Defines the production extraction route for policy documents, chart notes, labs, and denial letters.                                                                      |

The custom React Command Center is the access-team cockpit. UiPath remains the
system responsible for orchestration, governance, human approval, robot
execution, and proof records.

## How I Built It

I built the project as a TypeScript/pnpm monorepo with shared contracts across
the product UI, mock healthcare API, synthetic data, agent runtime, and UiPath
handoff artifacts.

**Frontend:** React, Vite, custom Command Center UI, mock payer portal, polished
case-management screens, evidence matrix, submission status, appeal builder, and
UiPath proof drawer.

**Backend:** Fastify mock healthcare API for synthetic EHR, payer, pharmacy,
demo toggles, event mirror behavior, and proof-state reads.

**Agent runtime:** TypeScript coded-agent runtime with Zod contracts for coverage
requirements, evidence retrieval, missing evidence, submission packets, denial
rescue, appeal packets, care continuity, traces, and audit events.

**UiPath:** Maestro case and flow artifacts, Action Center task proof, Data
Fabric proof entity and records, API Workflow contracts, Orchestrator process
and job proof, RPA project shell, and Solution package lifecycle.

**Verification:** Setup checks, seed scripts, smoke tests, live-provider
readiness, UI smoke paths, submission-readiness checks, and a live UiPath proof
closeout document.

## Live Proof

The final project includes live UiPath proof in the
`TreatmentAccessHackathon` folder:

- Data Fabric proof entity and synthetic proof records
- Action Center ExternalTask `4401667` created, assigned, completed, and read
  back with synthetic clinician-attestation output
- Solution package `treatment-access-command-center@1.0.20260629` published,
  deployed, and activated
- Orchestrator job `6d9b9fa9-f582-4983-98fa-167e87d57f2a` completed
  successfully
- Maestro case and flow debug proof up to the human-task boundary

All data is synthetic. The project does **not** use real patient, provider,
payer, credential, or PHI data, and it does **not** perform a real payer
submission or autonomous medical/legal decision.

## Challenges I Ran Into

**Turning healthcare complexity into a usable product.** Prior authorization is
not one workflow; it is a chain of exceptions. I had to design the UI so judges
could understand the problem in seconds while the backend still represented the
real moving parts: policy, evidence, human approval, payer routing, denial
rescue, appeal, and handoff.

**Keeping AI powerful without making unsafe claims.** The agents needed to feel
useful and load-bearing, but every high-impact clinical assertion had to remain
source-backed or human-approved. The product deliberately blocks unsupported
claims rather than letting an agent invent certainty.

**Making UiPath visible without making the demo feel like a console.** The
customer-facing product needed to look like something an access team would use,
not a technical proof dashboard. I separated the experience into a polished
Command Center for operators and a proof drawer for live UiPath records.

**Working through real integration boundaries.** Live UiPath proof required
folder-scoped setup, Data Fabric records, Action Center task handling,
Orchestrator process execution, solution lifecycle work, and Maestro debug
validation. Some boundaries, such as inline HITL app binding and captured portal
UI automation, became honest production-hardening items rather than fake claims.

## Accomplishments I Am Proud Of

- I built an end-to-end prior-authorization case flow that is understandable to
  non-technical judges and technically grounded for UiPath reviewers.
- I designed a premium product UI that shows the user value first: risk,
  evidence, next action, deadline, and owner.
- I implemented seven distinct agent roles instead of one generic chatbot.
- I connected agent outputs to governance concepts: case state, human gates,
  API workflow handoffs, robot fallback, audit events, and proof records.
- I produced live UiPath proof across Data Fabric, Action Center, Solutions,
  Orchestrator, and Maestro debug artifacts.
- I kept the healthcare safety boundary explicit: **AI prepares, UiPath governs,
  humans approve.**

## What I Learned

The biggest lesson is that the hard part of healthcare AI is not generating a
sentence. It is making work trustworthy enough to move through a real process.

For treatment access, the value comes from structure:

- Which payer rule applies?
- Which chart artifact supports it?
- Which claim still needs a clinician?
- What happens if the payer channel fails?
- What changes after a denial?
- Where is the audit trail?

I learned that UiPath is strongest when it turns AI output into governed work:
stateful cases, human tasks, robot jobs, API workflows, and records that can be
reviewed later.

## What's Next

The next step is to harden Treatment Access Command Center into a production
workflow for real access teams:

1. Connect to a real EHR sandbox and payer sandbox with approved synthetic test
   data.
2. Replace the local source-span parser with UiPath IXP / Document Understanding
   extraction for policies, chart notes, labs, and denial letters.
3. Complete browser-control automation for the payer portal fallback robot.
4. Deploy the Action App binding so Maestro can complete the full inline HITL
   path.
5. Add role-based views for access coordinators, clinicians, pharmacy teams, and
   operations leaders.
6. Measure operational impact: time to packet, preventable denial rate,
   appeal-prep time, and days saved to therapy.

## Safety, Privacy, And Boundaries

This project uses synthetic data only. No real patient, provider, payer,
credential, or PHI data is included.

Treatment Access Command Center does not make autonomous medical or legal
decisions. Appeal language is an administrative draft for clinician review.
Every clinical assertion must have source evidence, a policy citation, or human
approval.

```text
AI assembles.
UiPath governs.
Humans approve.
```
