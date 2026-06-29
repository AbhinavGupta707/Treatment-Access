# Robots

Owns the mock payer portal fallback robot.

Current setup caveat: Assistant/Robot is installed and `TreatmentAccessHackathon`
is visible in Orchestrator, but local RPA project creation is blocked on this Mac
until the UiPath headless Studio restore can run with a .NET SDK.

Use `.agents/skills/uipath-rpa/SKILL.md` before authoring RPA artifacts.

## Checkpoint 4 Portal Fallback

The portal fallback lane contract and runtime wiring notes live in
`payer-portal-fallback/`.

Do not run live `uip rpa run`, `uip rpa debug`, Orchestrator job start,
solution publish/deploy/activate, or payer submission without explicit approval.
The next implementation step is to rerun the documented `uip rpa init` command
after the local .NET SDK/Helm restore blocker is resolved, then add the UIA
activities listed in the Studio indication checklist.
