# AGENTS.md

## Project Rule

- Diagnose in layer order, not by symptom: if a feature is "missing", "unavailable", or not listed, first check registration/discovery/install state and official activation flows; only debug permissions/runtime after the feature is actually present.

## Product Rules

- UiPath must remain the orchestration and governance layer. The custom apps may visualize state, but live case state must be produced by UiPath workflows, agents, robots, human actions, or UiPath-written event records.
- Use synthetic data only. Do not add real patient, payer, provider, credential, or personal health data.
- Every clinical assertion must have source evidence, a policy citation, or human approval.
- Appeal language is an administrative draft for clinician review, not autonomous medical or legal advice.
- Keep the two hackathon projects separated. This project uses the UiPath Orchestrator folder `TreatmentAccessHackathon`; do not reuse or modify `AgentFactoryDemo` unless the user explicitly asks.

## Local Setup

- Project root: `/Users/abhinavgupta/Desktop/UiPath/Treatment Access`
- GitHub remote: `https://github.com/AbhinavGupta707/Treatment-Access.git`
- UiPath org logical name: `galacticus`
- UiPath tenant: `DefaultTenant`
- UiPath folder: `TreatmentAccessHackathon`
- UiPath folder ID: `7986316`
- UiPath folder key: `4fba2fa1-012b-469a-b6aa-e5be3811c173`

## Coding-Agent Skills

UiPath skills are generated locally and ignored by git. If `.agents/skills` is missing, run:

```bash
uip skills install --agent codex --local
```

Use the relevant local UiPath skill docs when authoring UiPath artifacts:

- `.agents/skills/uipath-platform/SKILL.md`
- `.agents/skills/uipath-maestro-case/SKILL.md`
- `.agents/skills/uipath-agents/SKILL.md`
- `.agents/skills/uipath-api-workflow/SKILL.md`
- `.agents/skills/uipath-human-in-the-loop/SKILL.md`
- `.agents/skills/uipath-rpa/SKILL.md`
- `.agents/skills/uipath-tasks/SKILL.md`
- `.agents/skills/uipath-solution/SKILL.md`

## Verification

Before claiming a checkpoint is complete, run the strongest available checks:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm verify:setup
git diff --check
```

If a check cannot run because a live UiPath, GitHub, Vercel, or network dependency is unavailable, state exactly what was unavailable and what narrower check was run instead.
