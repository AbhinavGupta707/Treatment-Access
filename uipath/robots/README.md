# Robots

Owns the mock payer portal fallback robot.

Current setup: Assistant/Robot is installed, `TreatmentAccessHackathon` is
visible in Orchestrator, and the real `PayerPortalFallback` UiPath project shell
has been created under `uipath/robots/PayerPortalFallback`.

Use `.agents/skills/uipath-rpa/SKILL.md` before authoring RPA artifacts.

## Checkpoint 4 Portal Fallback

The portal fallback lane contract and runtime wiring notes live in
`payer-portal-fallback/`. The deployable solution copy is imported under
`../solution/treatment-access-command-center/PayerPortalFallback`.

Do not run live `uip rpa run`, `uip rpa debug`, Orchestrator job start,
solution publish/deploy/activate, or payer submission without explicit approval.
The next implementation step is to add/capture the UIA activities listed in the
Studio indication checklist, then re-run static validation/build and solution
pack dry-run through `scripts/uipath-with-dotnet8.sh`.
