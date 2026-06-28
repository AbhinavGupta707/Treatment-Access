# Maestro Case

Owns the Treatment Access case lifecycle, stage rules, secondary stages, and
case field ownership.

## Local Artifacts

- [sdd.md](./sdd.md) is the draft Maestro Case definition blueprint for
  `TreatmentAccessCase`.
- [case-authoring-hard-stop.md](./case-authoring-hard-stop.md) records the
  Maestro skill approval boundary that prevents creating `caseplan.json` until
  the orchestrator approves the SDD and task plan flow.

Use the local UiPath skill before authoring case files:

```text
.agents/skills/uipath-maestro-case/SKILL.md
```

Do not run `uip maestro case debug`, publish, upload, or deploy from this lane
without explicit orchestrator approval.
