# Maestro Case Authoring Hard Stop

## Status

This lane produced a local Maestro Case SDD draft and the matching Data
Service/Data Fabric contracts. It did not create `caseplan.json`.

## Why `caseplan.json` Was Not Created

The project did not contain an existing approved `sdd.md` when this lane began.
The local `uipath-maestro-case` skill requires an approval hard stop before a
newly generated SDD can be treated as the source for Phase 1 planning. It also
requires another approval hard stop after `tasks.md` before JSON execution.

Creating a real `caseplan.json` in this lane would skip those gates and violate
the skill's case authoring rules.

## Exact Next Decision

The orchestrator should review [sdd.md](./sdd.md) and choose one:

1. Approve the SDD as the Phase 1 source.
2. Request edits to stages, task types, variables, or transition rules.

## Exact Next Commands After Approval

Run these only after the orchestrator explicitly approves continuing through the
Maestro skill hard stops:

```bash
uip maestro case registry pull --output json
```

Then use `.agents/skills/uipath-maestro-case/SKILL.md` Phase 1 to generate the
skill-owned `tasks/tasks.md` beside the approved SDD. After the task plan hard
stop is approved, proceed through the skill's Phase 2 and Phase 3 JSON authoring
flow, then validate locally:

```bash
uip maestro case validate <caseplan.json> --output json
```

Do not run:

```bash
uip maestro case debug
uip solution upload
uip solution publish
```

without explicit approval.
