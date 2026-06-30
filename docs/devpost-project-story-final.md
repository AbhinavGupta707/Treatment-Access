# Treatment Access Command Center

**Treatment Access Command Center is a UiPath-governed case-management product
for specialty-medication access. It turns prior authorization from a fragmented
administrative chase into a Maestro-orchestrated workflow where agents assemble
the work, UiPath governs the process, and humans approve clinical risk before
payer-facing action.**

## Inspiration

Prior authorization is one of the most frustrating bottlenecks in healthcare
because it sits between a clinician's treatment decision and a patient's ability
to actually receive therapy.

For specialty medication, the work rarely fails because one form is hard to
fill. It fails because the process is scattered:

- payer policy lives in one place,
- chart evidence lives somewhere else,
- clinician attestation is requested late,
- payer APIs and portals behave inconsistently,
- denials arrive with opaque reasons,
- appeals restart the same evidence chase,
- pharmacy handoff is treated as an afterthought.

The administrative load is huge. The AMA has reported that physicians and staff
spend about **13 hours per week** on prior authorization, with roughly **40
requests per physician per week**. Behind those numbers are patients waiting for
treatment and access teams rebuilding the same context over and over again.

I built Treatment Access Command Center because this is exactly the kind of
workflow where AI alone is not enough. A chatbot can draft a paragraph, but it
cannot safely own a healthcare case lifecycle. The real opportunity is to pair
agentic work with UiPath governance: let agents do the repetitive reasoning and
assembly, let UiPath orchestrate the process, and keep humans accountable for
clinical decisions.

## What It Does

Treatment Access Command Center gives access coordinators a premium operational
cockpit for one of the most painful workflows in healthcare: specialty-medication
prior authorization.

An access team can immediately see:

- **which patient is stuck,**
- **why the case is at risk,**
- **which payer requirement is blocking progress,**
- **what evidence supports each clinical claim,**
- **who or what owns the next step,**
- **how close the payer deadline is,**
- **whether the case is waiting on a human, an API, a robot, or an appeal.**

The product turns a synthetic specialty-medication order into a governed
treatment-access case:

1. **Intake:** start from a synthetic order for Fictionalimab.
2. **Policy check:** convert payer policy into source-backed coverage criteria.
3. **Evidence mapping:** match chart artifacts to payer requirements with source
   references, confidence, and review flags.
4. **Human approval:** stop high-impact clinical assertions for clinician
   attestation instead of guessing.
5. **Submission preparation:** assemble payer packet fields and attachments only
   after evidence and governance checks pass.
6. **Exception routing:** if the payer API is unavailable, move into a governed
   portal-fallback route instead of losing the case in a workqueue.
7. **Denial rescue:** classify denial reasons such as step therapy, missing
   safety screening, or documentation gaps.
8. **Appeal packet:** draft administrative appeal material with citations and
   unsupported-claim warnings for clinician review.
9. **Care continuity:** prepare pharmacy and scheduling handoff so the workflow
   ends at treatment access, not just payer approval.
10. **Audit trail:** preserve what happened across agents, humans, workflows,
    robots, records, and source evidence.

The goal is not to replace clinicians. The goal is to remove the administrative
sludge that prevents clinicians and access teams from moving quickly and safely.

## Why It Matters

Most prior-authorization tools optimize one narrow task: form filling, document
collection, status checks, or appeal drafting. Treatment Access Command Center
reframes the whole problem as a governed case lifecycle.

That matters because prior authorization is a chain of dependencies. If evidence
is missing, the packet should stop. If the claim is high-impact, a clinician
should approve it. If the payer API fails, the case should route to a fallback.
If the payer denies, the appeal should build from the evidence already gathered,
not from scratch.

This is the product promise:

```text
AI assembles the work.
UiPath governs the workflow.
Humans approve accountable decisions.
```

## The Agentic Workflow

The product uses **seven specialist agents**. Each agent has a narrow, auditable
role rather than acting like one generic medical chatbot.

| Agent                          | What It Produces                                                                    | Why It Matters                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Coverage Requirement Agent** | Payer criteria, required evidence, submission channel, citations, and source spans. | Turns policy into an actionable checklist.                                     |
| **Evidence Retrieval Agent**   | Evidence matrix with chart references, confidence, and review flags.                | Reduces manual chart review and makes every claim traceable.                   |
| **Missing Evidence Agent**     | Gap analysis and human-task payloads.                                               | Prevents unsafe or incomplete submissions.                                     |
| **Submission Packet Agent**    | Payer-ready packet fields and attachment lists.                                     | Speeds packet assembly after evidence is ready.                                |
| **Denial Rescue Agent**        | Denial classification and recovery strategy.                                        | Converts payer denial into structured next action.                             |
| **Appeal Packet Agent**        | Administrative appeal draft, citations, and unsupported-claim warnings.             | Speeds appeal prep without making autonomous medical/legal claims.             |
| **Care Continuity Agent**      | Pharmacy, scheduling, and care-team handoff recommendations.                        | Keeps the workflow focused on treatment access, not just authorization status. |

The agents are useful because the workflow requires reasoning across payer rules,
clinical evidence, deadlines, exceptions, and handoffs. Traditional deterministic
software can track fields, but it struggles to turn messy policy and evidence
context into a structured, reviewable work product. The agents do that assembly
work, then UiPath turns the result into governed case state.

## Why This Fits The Maestro Track

I am submitting this to **Track 1: UiPath Maestro Case / Agentic Case
Management** because the core product is a dynamic, exception-heavy case
lifecycle.

This is not a standalone AI assistant. The Command Center is the customer-facing
cockpit, but UiPath is the orchestration and governance layer underneath:

- **Maestro Case** coordinates intake, policy check, evidence mapping, clinician
  signoff, submission, denial rescue, appeal, approval, and care handoff.
- **Maestro Flow / HITL** models the clinician-review boundary.
- **Action Center** holds accountable human review and signoff patterns.
- **Agent Builder-style contracts** define the seven domain agents.
- **Coded Agents** implement the TypeScript agent runtime and shared schemas.
- **API Workflows** represent EHR, payer, pharmacy, and event-state handoffs.
- **Orchestrator and RPA** govern the payer portal fallback path.
- **Data Fabric / Data Service** stores proof records and event state.
- **Solutions** packages the UiPath project boundary for deployment and
  activation.

The custom UI makes the case understandable for access teams. UiPath makes it
governed, auditable, and ready for real enterprise workflow patterns.

## Product Architecture

| Layer                                 | What It Does                                                                                                 | Why It Matters                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| **Command Center UI**                 | Shows dashboard, case detail, evidence matrix, submission status, appeal builder, and UiPath records.        | Gives access coordinators a product-grade cockpit instead of a technical console. |
| **Mock Healthcare API**               | Serves synthetic EHR, payer, pharmacy, event mirror, demo toggles, and proof state.                          | Lets judges run the full workflow safely without PHI or real payer credentials.   |
| **Shared Schemas**                    | Zod contracts for cases, evidence, agents, submissions, decisions, appeals, tasks, traces, and audit events. | Keeps the UI, backend, agents, and UiPath handoffs consistent.                    |
| **Seven-Agent Runtime**               | Produces policy, evidence, missing-evidence, packet, denial, appeal, and handoff outputs.                    | Makes agent work structured and auditable instead of free-form.                   |
| **UiPath Maestro**                    | Owns the treatment-access lifecycle and human-task boundary.                                                 | Demonstrates dynamic case orchestration with people, systems, and exceptions.     |
| **UiPath Action Center**              | Handles clinician attestation and appeal signoff.                                                            | Keeps medical accountability with humans.                                         |
| **UiPath Orchestrator / RPA**         | Runs the payer portal fallback process when payer API routing fails.                                         | Shows how exception paths move into governed automation.                          |
| **UiPath Data Fabric / Data Service** | Records proof events and synthetic state in the UiPath folder.                                               | Gives judges a live audit trail rather than only a local UI.                      |
| **UiPath Solutions**                  | Packages, deploys, and activates the project boundary.                                                       | Makes the submission feel like a real UiPath solution, not a loose prototype.     |

Reader-friendly flow:

```text
Synthetic specialty-medication order
  -> UiPath Maestro case lifecycle
  -> API workflows hydrate EHR, payer, pharmacy, and event state
  -> Seven agents produce policy, evidence, packet, denial, appeal, and handoff outputs
  -> Action Center gates clinician approval
  -> Payer API route or Orchestrator robot fallback
  -> Data Fabric proof records
  -> Command Center visualizes governed case state
```

## How I Built It

I built the project as a TypeScript/pnpm monorepo so the product UI, mock API,
agent runtime, synthetic fixtures, and UiPath artifacts all share the same
contracts.

**Frontend:** React, Vite, custom premium Command Center UI, case dashboard,
evidence matrix, submission screen, appeal builder, proof drawer, and
automation-friendly mock payer portal.

**Backend:** Fastify mock healthcare API for synthetic EHR data, payer state,
pharmacy handoff, demo toggles, event ingestion, and proof reads.

**Agents:** TypeScript coded-agent runtime with shared Zod contracts for
coverage requirements, evidence retrieval, missing evidence, submission packet,
denial rescue, appeal packet, care continuity, trace output, and audit events.

**UiPath:** Maestro case/flow artifacts, Action Center proof, Data Fabric proof
entity and records, API Workflow contracts, Orchestrator process/job proof, RPA
project shell, and Solution package lifecycle.

**LLM / observability readiness:** Fireworks and LangSmith integrations are
represented in the live provider path, while the local judge path remains
repeatable with synthetic data and deterministic agent outputs.

**Verification:** setup verification, seed/reset scripts, agent smokes,
Checkpoint 8 live UiPath readiness smoke, submission-readiness check, UI proof
flows, and documented live UiPath proof IDs.

## Live UiPath Proof

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

This proof is important because it shows UiPath is not decorative. UiPath is
where case governance, human review, solution lifecycle, robot execution proof,
and audit records live.

## Challenges I Ran Into

**Designing for a real healthcare workflow, not a toy demo.** Prior
authorization has many edge cases: missing evidence, API downtime, unclear
denials, appeal deadlines, and clinician approval. The hardest product decision
was making the UI simple enough for a three-minute demo while keeping the
workflow rich enough to reflect real access-team work.

**Making agentic AI safe.** The agents needed to be visibly useful, but not
reckless. I built the workflow around a safety rule: every clinical assertion
needs source evidence, a policy citation, or human approval. If the evidence is
partial or high-impact, the system stops at a human gate.

**Keeping UiPath visible without making the product feel like a backend log.**
Judges need to see UiPath integration, but access coordinators need a clean
product. I separated those concerns: the main UI shows the operating workflow,
while the proof drawer exposes UiPath records, Action Center proof, Orchestrator
job evidence, and safety boundaries.

**Working through live platform boundaries.** The final proof involved real
folder-scoped UiPath setup, solution publish/deploy/activation, Data Fabric
proof records, Action Center task handling, Orchestrator process execution, and
Maestro debug validation. Some pieces, like captured portal UI automation and
full inline HITL app binding, became honest production-hardening boundaries
rather than overclaimed demo magic.

## Accomplishments I Am Proud Of

- I built a complete treatment-access product flow: dashboard, case detail,
  evidence matrix, human approval, submission route, denial rescue, appeal
  preparation, care handoff, and audit proof.
- I made the product understandable to healthcare operators while keeping the
  technical architecture strong enough for UiPath judges.
- I implemented seven distinct agent roles instead of one generic chatbot.
- I made the safety boundary central to the product: **AI prepares, UiPath
  governs, humans approve.**
- I connected agent output to operational artifacts: case state, Action Center
  gates, API handoffs, Orchestrator/RPA fallback, Data Fabric records, and proof
  manifests.
- I produced live UiPath evidence across Action Center, Data Fabric, Solutions,
  Orchestrator, and Maestro debug records.
- I built the project during the hackathon window and pushed a public GitHub
  repository with README setup instructions, UiPath component disclosure, coded
  agent disclosure, Devpost copy, demo script, and completed deck.

## What I Learned

The biggest lesson is that healthcare AI needs orchestration more than it needs
flash.

A model can draft text. But a treatment-access workflow needs to answer harder
questions:

- Which payer rule applies?
- Which chart artifact supports it?
- Which claim still needs a clinician?
- What happens when the payer API fails?
- What changes after a denial?
- Where is the audit trail?
- Who is accountable for the next step?

I learned that UiPath is powerful because it turns agent output into governed
work. It gives AI a place in the enterprise workflow: cases, tasks, robots,
API workflows, records, approvals, and logs.

## What's Next

The next step is to harden Treatment Access Command Center into a production
workflow for real access teams:

1. Connect to approved EHR and payer sandboxes with synthetic test patients.
2. Replace the local source-span parser with UiPath IXP / Document Understanding
   for policies, chart notes, labs, and denial letters.
3. Complete browser-control automation for the payer portal fallback robot.
4. Deploy the Action App binding so Maestro can complete the full inline HITL
   path.
5. Add role-specific views for access coordinators, clinicians, pharmacy teams,
   and operations leaders.
6. Measure the outcomes that matter: time to packet, preventable denial rate,
   appeal-prep time, days saved to therapy, and clinician review burden.

## Safety, Privacy, And Boundaries

This project uses synthetic data only. It does not include real patient,
provider, payer, credential, or PHI data.

Treatment Access Command Center does not make autonomous medical or legal
decisions. Appeal language is an administrative draft for clinician review.
Every clinical assertion must have source evidence, a policy citation, or human
approval.

The honest boundary is what makes the product stronger:

```text
AI assembles.
UiPath governs.
Humans approve.
```
