# Demo Script

The final video should be under five minutes. Use synthetic fixture data only.
Appeal language is an administrative draft for clinician review, not autonomous
medical or legal advice.

## Local Demo-Proof Rehearsal

Before recording, run the deterministic Checkpoint 4 smoke:

```bash
CI=true pnpm smoke:checkpoint4
```

This proves the local fallback story without live UiPath side effects:

1. reset the mock runtime;
2. force the payer API unavailable path;
3. verify the portal fallback secondary stage;
4. write a synthetic robot fallback event;
5. confirm the event is visible to the Command Center state;
6. confirm both frontend apps build.

## Video Flow

1. Start in UiPath, not the custom dashboard. Show the `Treatment Access
Intake` app launching a synthetic case in `TreatmentAccessHackathon`.
2. Show Maestro Case stage progression from intake to policy/evidence review.
3. Switch to the Command Center and show the same synthetic case rendered from
   the event mirror.
4. Show the policy-to-evidence matrix. Call out that every clinical assertion
   has source evidence, a policy citation, or a human approval gate.
5. Complete clinician validation in Action Center using synthetic approval
   language only.
6. Submit to the payer API and show `PAYER_API_DOWN`.
7. Launch the approved portal fallback robot or show the locally rehearsed
   portal fallback proof if live robot execution is not approved.
8. In the Mock Payer Portal, show the synthetic form and confirmation
   `AVFH-PORTAL-SYN-001`.
9. Return to the Command Center timeline and show the robot
   `portal_fallback_submitted` event with the fallback secondary stage.
10. Trigger denial rescue, show the appeal strategy, and approve the appeal in
    the human review surface.
11. Create pharmacy handoff.
12. Close with the audit timeline and architecture: UiPath is the orchestration
    and governance layer; the Command Center visualizes UiPath-written state.

## Approval Gates To Say Out Loud

If any live step was not approved or not available, say exactly which gate is
still pending:

- RPA run/debug approval for the portal robot.
- Orchestrator job start approval.
- Solution upload, publish, deploy, or activation approval.
- Action Center task creation approval.
- Data Service write approval.
- Payer submission approval outside the local synthetic mock.

Do not imply these were completed unless the orchestrator approved and ran the
live action.
