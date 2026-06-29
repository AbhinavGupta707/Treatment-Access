# Screenshots

Store final submission screenshots and evidence notes here.

Required local synthetic proof:

- `command-center-local.png` - local Command Center browser rendering.
- `mock-payer-portal-local.png` - local mock payer portal form before submit.
- `mock-payer-portal-confirmation-local.png` - local portal receipt after the
  default synthetic form submit.

Checkpoint 6 product proof after the UI redesign lands:

- product dashboard at desktop and mobile widths.
- case detail with current stage, next best action, and synthetic disclaimer.
- evidence matrix with source-grounding and unsupported-claim warnings.
- appeal builder with clinician-review gate.
- audit/trace drawer showing local deterministic proof or captured live trace
  evidence.

Live Fireworks/LangSmith proof may be captured only after
`CI=true pnpm smoke:checkpoint6-live-providers` passes or equivalent read-only
provider evidence exists. Do not capture or paste `.env.local` contents.

Live UiPath proof requires explicit user/account action before capture:

- Maestro Case in folder `TreatmentAccessHackathon`.
- Action Center approval/signoff task.
- Orchestrator job or robot run for `PayerPortalFallback`.
- Agent Builder trace for one of the seven treatment-access agents.
- Data Service/Data Fabric case or event record.

Update `manifest.md` whenever a screenshot is added. The manifest must say what
each image proves, the exact command or manual path used to capture it, and
whether it is local synthetic proof or live UiPath proof.
