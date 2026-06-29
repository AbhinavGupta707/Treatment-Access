# Checkpoint 7 QA, Demo, And Submission Handoff

## Lane

Checkpoint 7 QA, Demo, and Submission Readiness.

## Files Changed

- `package.json`: registers `smoke:checkpoint7-live-proof`.
- `scripts/verify-checkpoint7-live-proof.ts`: adds the static no-side-effect
  Checkpoint 7 live-proof readiness gate.
- `docs/testing.md`: documents Checkpoint 7 verification order and boundaries.
- `docs/demo-script.md`: adds value-first narration and Checkpoint 7 smoke prep.
- `docs/submission.md`: adds healthcare-value-first language and the Checkpoint
  7 smoke to final submission checks.
- `docs/checkpoint-7-lane-handoffs/qa-demo-submission.md`: this handoff.

## Commands Run

Dependency hydration:

```bash
CI=true pnpm install --frozen-lockfile
```

Initial direct script sanity check:

```bash
node --experimental-strip-types scripts/verify-checkpoint7-live-proof.ts
```

Final verification:

```bash
CI=true pnpm verify:setup
CI=true pnpm format:check
CI=true pnpm verify:submission-readiness
CI=true pnpm smoke:checkpoint6-readiness
CI=true pnpm smoke:checkpoint7-live-proof
git diff --check
```

Formatting note: the first `CI=true pnpm format:check` run flagged
`docs/demo-script.md`; `CI=true pnpm prettier --write docs/demo-script.md` fixed
the table wrapping, and the final `format:check` passed.

## Risks And Caveats

- This lane is based at Checkpoint 7 prep commit `02ddaf0`; the contract/API/UI
  implementation lanes are not present in this isolated worktree.
- `smoke:checkpoint7-live-proof` is therefore a static readiness/evidence gate,
  not a live UiPath execution test.
- No live side-effecting UiPath or payer commands were run. No Agent Builder
  debug/run, Maestro run/debug, Action Center task creation, Data Service write,
  Orchestrator job start, RPA run/debug, solution upload/publish/deploy/activate,
  IXP mutation, or payer submission is claimed.
- `.agents/skills` is absent in this worktree. This lane did not install it
  because it did not author UiPath artifacts.

## Integration Notes

- After earlier Checkpoint 7 lanes merge, keep this script registered as the
  outer demo-readiness gate.
- If the live-proof runtime lane adds a deeper execution smoke, either call it
  from `smoke:checkpoint7-live-proof` after the static checks or add a separate
  package command and document the paired command in `docs/testing.md`.
- Preserve the value-first wording unless stronger evidence exists. Claims about
  live UiPath side effects should remain caveated until screenshots or logs from
  `TreatmentAccessHackathon` prove the approved action.
