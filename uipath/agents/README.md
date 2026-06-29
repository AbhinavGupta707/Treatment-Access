# Agents

Target agents:

1. Coverage Requirement Agent
2. Evidence Retrieval Agent
3. Missing Evidence Agent
4. Submission Packet Agent
5. Denial Rescue Agent
6. Appeal Packet Agent
7. Care Continuity Agent

Use the local UiPath skill before authoring agent files:

```text
.agents/skills/uipath-agents/SKILL.md
```

Checkpoint 6 live runtime decision:

- Existing Agent Builder packets remain low-code artifacts until explicitly
  published or run.
- If the orchestrator chooses a Coded Agent/LangGraph runtime, create the shell
  with `uip codedagent new`; do not hand-author `pyproject.toml`, `main.py`,
  `langgraph.json`, or `entry-points.json`.
- Coded Agent setup/run/debug remains approval-gated in
  `../live-wiring-runbook.md`.
