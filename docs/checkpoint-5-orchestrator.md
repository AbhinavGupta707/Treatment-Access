# Checkpoint 5 Orchestrator

Checkpoint 5 outcome: finish production/demo readiness for Devpost while
closing the live-readiness gap left by Checkpoint 4. The repo should become a
truthful submission package with clear setup, video/deck guidance, evidence
capture, final QA, and a real UiPath RPA project/solution path if the local
Studio/.NET prerequisite can be resolved safely.

Base branch: `main`
Base commit: `2142714`
Launch commit: `97413b9`
Worker base commit: `97413b9`
Launch time: `2026-06-29T01:46:15Z`

## Active Lanes

| Merge order | Lane                          | Thread ID                              | Worktree path                                                | Ownership                                                              |
| ----------- | ----------------------------- | -------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| 1           | RPA Runtime & Solution Import | `019f1111-dd23-7811-808d-6026e4185b1a` | `/Users/abhinavgupta/.codex/worktrees/97ee/Treatment Access` | `uipath/robots/**`, `uipath/solution/**`, RPA setup notes              |
| 2           | Evidence Capture & Final QA   | `019f1111-dcf9-7ae3-9dbf-c92a53b13d79` | `/Users/abhinavgupta/.codex/worktrees/5d6a/Treatment Access` | `uipath/screenshots/**`, `docs/testing.md`, final QA scripts/docs      |
| 3           | README & Submission Package   | `019f1111-dcd9-7411-b1d7-cbed628604b0` | `/Users/abhinavgupta/.codex/worktrees/284a/Treatment Access` | `README.md`, `docs/submission.md`, license/submission checklist        |
| 4           | Demo Script & Deck Outline    | `019f1111-df2e-7991-aaab-4643545917ea` | `/Users/abhinavgupta/.codex/worktrees/55e8/Treatment Access` | `docs/demo-script.md`, `docs/architecture.md`, deck/video outline docs |

## Lane Goals

### 1. RPA Runtime & Solution Import

- Diagnose the Checkpoint 4 `uip rpa init` blocker in layer order: command
  surface, local SDK/Studio restore prerequisite, project creation, validation,
  solution import.
- If the prerequisite is now satisfied, create the real `PayerPortalFallback`
  UiPath project via `uip rpa init`, preserve a real UiPath project structure,
  add only safe placeholder UIA indication markers where live target capture is
  not possible, and import/register it in the existing solution shell.
- If the prerequisite is still blocked, update the setup/runbook with exact
  evidence and the shortest manual remediation path. Do not hand-write fake
  XAML or a fake `project.json`.
- Do not run live `uip rpa run`, `uip rpa debug`, Orchestrator jobs, solution
  upload/publish/deploy/activate, or payer submission without explicit approval.

### 2. Evidence Capture & Final QA

- Turn browser/dev-server proof into durable submission evidence under
  `uipath/screenshots`.
- Add a final QA checklist that covers local smoke, browser rendering, privacy,
  synthetic data, UiPath live gates, mocked-vs-live disclosures, and demo reset.
- Add or update non-live verification scripts only when they are genuinely
  useful and safe.
- Use browser/Chrome testing for local Command Center and Mock Payer Portal
  evidence when available. Do not mutate live UiPath resources.

### 3. README & Submission Package

- Upgrade the root README from scaffold status to current demo-ready status.
- Complete `docs/submission.md` with Devpost-ready sections: problem, solution,
  UiPath components, seven agents, architecture, setup, mocked-vs-live status,
  safety/privacy, coding-agent evidence, screenshots/video/deck checklist, and
  remaining approval-gated live steps.
- Confirm license posture. Add a license file only if appropriate and consistent
  with `package.json`.
- Do not claim live UiPath side effects that have not actually run.

### 4. Demo Script & Deck Outline

- Produce a five-minute video script with exact screen transitions, fallback
  language for unavailable live steps, and judge-facing narration.
- Add a concise deck outline and architecture story that keeps UiPath as the
  orchestration/governance layer.
- Ensure the script starts in UiPath or immediately proves the UiPath-controlled
  lifecycle before moving to the custom Command Center.
- Keep medical/appeal language clearly administrative and clinician-reviewed.

## Merge Order

1. RPA Runtime & Solution Import
2. Evidence Capture & Final QA
3. README & Submission Package
4. Demo Script & Deck Outline

Hold later lanes if an earlier lane changes a contract or materially changes
truthful live-vs-mocked status.

## Integration Checks

After each merge:

```bash
CI=true pnpm verify:setup
git diff --check
```

After all lanes merge:

```bash
CI=true pnpm verify
CI=true pnpm format:check
CI=true pnpm seed
DEBUG_SMOKE=1 CI=true pnpm smoke:checkpoint1 -- --port 8878
CI=true pnpm smoke:agents
DEBUG_SMOKE=1 CI=true pnpm smoke:checkpoint4 -- --port 8894
git diff --check
```

Run any new Checkpoint 5 QA/browser command added by the QA lane.

## Safety Gates

These require explicit user approval before execution:

- `uip rpa run`, `uip rpa debug`, Studio Web debug, or Assistant robot
  execution.
- `uip or jobs start` or equivalent job launch.
- `uip solution upload`, `publish`, `deploy`, or `activate`.
- live Agent Builder debug/run.
- Maestro debug/run with side effects.
- IXP project creation/upload/publish/mutation.
- Action Center task creation.
- Data Service writes.
- any live payer submission outside the synthetic local mock.

Read-only discovery and local non-live validation are allowed when needed.

## Stop Conditions

Stop and notify the user only if:

- a live side-effecting UiPath action is required to proceed;
- a worker requires a browser/account action that cannot be automated safely;
- a merge conflict affects the truthfulness of live-vs-mocked claims;
- local dependencies are missing and cannot be installed or documented without
  user action;
- a privacy/safety scan finds real PHI, credentials, or unsupported medical/legal
  claims.
