# Treatment Access Command Center

## Supplemental UiPath Environment Evidence Packet

**Project:** Treatment Access Command Center  
**Hackathon:** UiPath AgentHack 2026  
**Track:** Track 1 - UiPath Maestro Case / Agentic Case Management  
**Public repository:** https://github.com/AbhinavGupta707/Treatment-Access  
**Prepared:** 2026-06-30

## Purpose

This packet is intended as supplemental evidence for the Devpost submission
field asking for the UiPath Labs link/environment URL where the solution was
built.

The separate UiPath Labs staging sandbox URL was not provisioned for this
submission before the access-request window closed. The project was instead
built, verified, and documented in a UiPath Automation Cloud organization owned
by the submitter. This packet gives judges the same practical review evidence
they would look for in a sandbox:

1. the exact UiPath organization, tenant, and folder used;
2. the UiPath components used by the solution;
3. live UiPath proof identifiers for Action Center, Data Fabric, Solutions,
   Orchestrator, and Maestro debug evidence;
4. setup and verification commands;
5. clear boundaries around synthetic data, patient safety, and what is not
   claimed.

Recommended Devpost environment field value:

```text
https://cloud.uipath.com/galacticus/
```

Tenant-level deep link used by live proof records:

```text
https://cloud.uipath.com/galacticus/DefaultTenant/
```

## Requirement Interpretation

The official UiPath AgentHack listing asks participants to build a real working
solution on the UiPath Platform and states that all solutions must run on
UiPath Automation Cloud. It also states that UiPath Labs access was sent through
a separate access process after requesting the sandbox.

This project satisfies the platform-run requirement through Automation Cloud:
UiPath owns the governed records, human gate proof, solution lifecycle,
Orchestrator job proof, and case/flow debug evidence. The missing item is not
the project implementation; it is the organizer-provisioned staging Labs URL.

This packet is therefore not a replacement for organizer access if the judges
strictly require a staging URL. It is a compact proof bundle showing that the
project was built on UiPath Automation Cloud and can be reviewed without
guessing where the UiPath evidence lives.

## UiPath Environment Identity

Read-only verification was run using the UiPath CLI on 2026-06-30.

| Field | Value |
| --- | --- |
| Base URL | `https://cloud.uipath.com` |
| Organization display name | `Galacticus` |
| Organization logical name | `galacticus` |
| Organization ID | `1aa6cebf-ee8e-4fec-8520-b7971407d266` |
| Tenant | `DefaultTenant` |
| Tenant ID | `360e9052-0ec2-4b79-b879-e6c7f992c443` |
| Primary project folder | `TreatmentAccessHackathon` |
| Folder ID | `7986316` |
| Folder key | `4fba2fa1-012b-469a-b6aa-e5be3811c173` |
| Folder type | `Standard` |
| Folder description | `Treatment Access Command Center hackathon demo folder` |

CLI evidence:

```bash
uip login status --output json
uip login tenant list --output json
uip or folders get TreatmentAccessHackathon --output json
```

Observed results:

```text
BaseUrl: https://cloud.uipath.com
Organization: galacticus
OrganizationId: 1aa6cebf-ee8e-4fec-8520-b7971407d266
Tenant: DefaultTenant
TenantId: 360e9052-0ec2-4b79-b879-e6c7f992c443
Folder: TreatmentAccessHackathon
Folder ID: 7986316
Folder key: 4fba2fa1-012b-469a-b6aa-e5be3811c173
```

## Product Summary

Treatment Access Command Center turns specialty-medication prior authorization
into a governed treatment-access case.

Prior authorization is not just a form. It combines payer policy, chart
evidence, clinician attestation, payer channel failure, denial rescue, appeal
work, and pharmacy handoff. The product helps access teams see which patient is
stuck, why the case is at risk, what evidence supports each payer criterion,
which human or automation owns the next step, and how the case can keep moving
when the payer path fails.

The operating model is:

```text
AI assembles.
UiPath governs.
Humans approve.
```

## End-to-End Workflow

```text
Synthetic specialty medication order
  -> Maestro-governed treatment access case
  -> Policy criteria extraction
  -> Source-grounded evidence matrix
  -> Clinician approval gate
  -> Payer submission route
  -> Payer API unavailable exception path
  -> Orchestrator / RPA portal fallback proof
  -> Denial rescue strategy
  -> Clinician-reviewed appeal packet
  -> Pharmacy and care handoff
  -> Data Fabric / event proof trail
```

## UiPath Components Used

| UiPath component | Role in the solution | Evidence location |
| --- | --- | --- |
| Maestro Case | Coordinates intake, policy check, evidence mapping, signoff, submission, denial rescue, appeal, approval, and handoff. | `uipath/maestro/`, `uipath/solution/treatment-access-command-center/TreatmentAccessCase/`, live debug evidence in `docs/live-uipath-proof-closeout.md`. |
| Maestro Flow / HITL | Models clinician-validation and human-task boundaries. | `uipath/solution/treatment-access-command-center/resources/solution_folder/process/flow/ClinicianValidationFlow.json`. |
| Agent Builder-style agents | Defines seven domain agents and contracts. | `uipath/agents/**`. |
| Coded agents | Implements the TypeScript seven-agent runtime and schemas. | `packages/agent-runtime`, `packages/shared-schemas`, `CI=true pnpm smoke:agents`. |
| Action Center | Holds clinician evidence approval and appeal signoff patterns. | Live ExternalTask `4401667` was created, assigned, completed, and read back. |
| API Workflows | Represents EHR hydration, payer submission/status, pharmacy handoff, and event writes. | `uipath/api-workflows/`, `uipath/solution/treatment-access-command-center/resources/solution_folder/process/`. |
| Data Fabric / Data Service | Stores synthetic proof events and case-state records. | Live entity `TreatmentAccessProofEvent` and proof records in `TreatmentAccessHackathon`. |
| Orchestrator | Owns folder governance, machine assignment, process visibility, and robot job proof. | Successful job `6d9b9fa9-f582-4983-98fa-167e87d57f2a`. |
| RPA / Assistant robot | Provides the `PayerPortalFallback` process for payer API unavailable scenarios. | `uipath/robots/`, solution-packaged process, successful Orchestrator job. |
| Solutions | Packages, deploys, and activates the UiPath project boundary. | `treatment-access-command-center@1.0.20260629`. |
| Apps / Action App contracts | Defines intended intake and human-review surfaces. | `uipath/apps/`, `uipath/action-center/`. |
| IXP / Document Understanding path | Production extraction target for policy documents, chart notes, labs, and denial letters. | `uipath/agents/extraction/`; local parser preserves source-span evidence contract. |
| UiPath for Coding Agents / Codex | Used to build, checkpoint, test, and integrate the product. | `.agents/skills`, checkpoint docs, orchestration logs, committed implementation history. |

## Agent Type

The solution uses both:

- **Low-code / Agent Builder-style agents:** seven UiPath agent packet folders,
  contracts, entry points, and validation artifacts live under `uipath/agents/**`.
- **Coded agents:** a TypeScript runtime in `packages/agent-runtime` uses shared
  Zod contracts to produce source-grounded outputs and smoke-testable behavior.

The custom Command Center UI visualizes case state. UiPath remains the
orchestration and governance layer for case lifecycle, human gates, records,
solution lifecycle, robot jobs, and audit proof.

## Seven Agent Responsibilities

| Agent | Responsibility |
| --- | --- |
| Coverage Requirement Agent | Converts payer policy into requirement criteria, required documents, channels, citations, and source spans. |
| Evidence Retrieval Agent | Maps chart artifacts to payer requirements with source references, confidence, and review flags. |
| Missing Evidence Agent | Detects blocking gaps and prepares human task payloads. |
| Submission Packet Agent | Builds payer packet fields and attachment lists after evidence and approval gates are satisfied. |
| Denial Rescue Agent | Classifies denial or RFI reasons and selects the recovery strategy. |
| Appeal Packet Agent | Drafts administrative appeal content for clinician review with citations and unsupported-claim warnings. |
| Care Continuity Agent | Prepares pharmacy, scheduling, and care-team handoff after approval. |

## Live UiPath Proof

The approved final proof run is recorded in
`docs/live-uipath-proof-closeout.md`. All data is synthetic.

| Proof area | Live identifier / result |
| --- | --- |
| Data Fabric entity | `feea1705-e673-f111-ac9a-002248a16d28` |
| Proof run | `tacc-live-uipath-proof-20260629-final` |
| Primary proof record | `B2501C19-E673-F111-AC9A-0022489A9A06` |
| Action Center task | `4401667` |
| Action Center task key | `93c09da5-3edb-455e-9679-d513113fd4fa` |
| Action Center ExternalTag | `TACC-2026-001` |
| Action Center completed | `2026-06-29T19:44:16.577Z` |
| Maestro Case instance | `cad900ae-e4f9-4e59-a1c8-c6f15934f5bc` |
| Maestro Flow instance | `4e17f6d2-a2d7-4730-b1ed-9d0dcadef9b0` |
| Solution package | `treatment-access-command-center@1.0.20260629` |
| Solution deployment | `46ec1e63-3b09-4308-8b44-ed4b65e4e7f7` |
| Solution activation record | `E20AF4F4-C121-422C-B55A-019F149CAA9C` |
| Process key | `A9F5CE77-B566-49F0-98C3-CED31D98CA0F` |
| Process package key | `treatment-access-command-center.Rpa.PayerPortalFallback` |
| Orchestrator job | `6d9b9fa9-f582-4983-98fa-167e87d57f2a` |
| Job trace ID | `6d9b9fa9f582498398fa167e87d57f2a` |

## Read-Back Verification

After live proof, the tenant was queried again without mutating state:

- Data Fabric record list returned all four proof records and `TotalCount: 4`.
- Solution deployment returned `DeploymentSucceeded` and `SuccessfulActivate`
  for deployment `46ec1e63-3b09-4308-8b44-ed4b65e4e7f7`.
- Orchestrator jobs list returned job
  `6d9b9fa9-f582-4983-98fa-167e87d57f2a` with state `Successful`.
- Action Center task `4401667` returned status `Completed`, type
  `ExternalTask`, folder ID `7986316`, and ExternalTag `TACC-2026-001`.
- Maestro Flow instance `4e17f6d2-a2d7-4730-b1ed-9d0dcadef9b0` returned
  `Faulted` at the inline HITL task boundary, confirming the current boundary
  is the AppTasks/QuickForm binding rather than login, folder, or task-read
  discovery.

## Judge Reproduction Path

Clone and run:

```bash
git clone https://github.com/AbhinavGupta707/Treatment-Access.git
cd Treatment-Access
CI=true pnpm install
CI=true pnpm verify:setup
CI=true pnpm smoke:agents
CI=true pnpm smoke:checkpoint8-live-uipath
CI=true pnpm smoke:checkpoint8-action-center-proof
```

Start the local product surfaces:

```bash
CI=true pnpm dev:api
CI=true pnpm dev:command-center
CI=true pnpm dev:mock-payer
```

Open:

```text
Command Center:    http://127.0.0.1:5173
Mock payer portal: http://127.0.0.1:5174
Mock API:          http://127.0.0.1:8787
```

Recommended walkthrough:

1. Dashboard: show the active case, risk, clinician signoff load, and case
   orchestration card.
2. Cases: show case progress, actors, deadlines, and recent activity.
3. Evidence: select the `Needs Signoff` row and inspect source-backed evidence.
4. Dashboard: run case orchestration and open UiPath records.
5. Submissions: show payer API unavailable as an exception branch.
6. Appeals: show denial rescue, appeal packet builder, and clinician signoff.
7. UiPath records drawer: show the live proof IDs and safety status.

## Submission File Recommendations

If Devpost permits supplemental files, upload:

1. `Treatment-Access-UiPath-Environment-Evidence-Packet.pdf`
2. `Treatment-Access-UiPath-Evidence-Pack.zip`

The ZIP should include:

- this Markdown evidence packet;
- the generated PDF evidence packet;
- `README.md`;
- `docs/live-uipath-proof-closeout.md`;
- `docs/action-center-live-proof.md`;
- `docs/submission.md`;
- `uipath/screenshots/manifest.md`.

## Safety, Privacy, And Boundaries

- All healthcare data is synthetic.
- No real patient, payer, provider, credential, or PHI data was used.
- No real payer submission was performed.
- Every clinical assertion must have source evidence, policy citation, or human
  approval.
- Appeal language is an administrative draft for clinician review, not
  autonomous medical or legal advice.
- The completed Orchestrator job proves live UiPath deployment and process
  execution. The current RPA `Main.xaml` is scaffold-only and does not claim
  captured portal UI automation.
- The live Maestro case/flow reached the human-task boundary. The completed
  human gate is proven through the live Action Center ExternalTask.

## Suggested Devpost Field Note

If a short note can be added near the URL field or in the project story, use:

```text
UiPath Labs staging access was not provisioned before the sandbox window closed,
so I built and verified the project in my Automation Cloud org instead:
https://cloud.uipath.com/galacticus/. The supplemental evidence packet includes
org, tenant, folder, proof IDs, verification commands, and UiPath component
mapping for judges.
```

