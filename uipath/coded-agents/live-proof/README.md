# Treatment Access Live Proof Coded Agent Packet

This folder is an authoring packet for a future UiPath Coded Agent or Agent
Builder path. It is not a hand-authored coded-agent scaffold, and it does not
run a live agent.

Per the local UiPath agent skill, a real greenfield coded agent must be created
with the official CLI flow:

```bash
uip codedagent setup --output json
uip codedagent new TreatmentAccessLiveProofAgent --output json
cd TreatmentAccessLiveProofAgent
uip codedagent init --output json
```

After any UiPath SDK resource calls are added, bindings must be regenerated
through the official coded-agent sync workflow. Do not hand-author
`bindings.json`.

## Intended Role

The future agent should invoke the Checkpoint 7 live proof contract and return a
schema-bounded `TreatmentAccessLiveProofRun`. UiPath remains the orchestration
and governance layer. The Command Center may visualize the output, but live case
state must be produced by UiPath workflows, agents, robots, human actions, or
UiPath-written event records.

## Default Mode

Default execution is no-side-effect:

- run the Fireworks-backed agent graph only when live provider keys are present;
- capture LangSmith trace metadata when available;
- draft UiPath evidence references and event mirror payloads;
- do not create Action Center tasks, write Data Service records, start
  Orchestrator jobs, run RPA, deploy solutions, mutate IXP, or submit to a
  payer.

The approval-gated surfaces and evidence capture requirements are enumerated in
[`../..//live-proof/live-proof-governed-hooks.manifest.json`](../../live-proof/live-proof-governed-hooks.manifest.json).

## Files

- [`coded-agent-authoring-contract.json`](./coded-agent-authoring-contract.json)
  defines the future input/output contract, scaffold rules, and resource binding
  policy.
- [`../../live-proof/samples/live-proof-request.sample.json`](../../live-proof/samples/live-proof-request.sample.json)
  is the synthetic request shape.
- [`../../live-proof/samples/live-proof-events.sample.json`](../../live-proof/samples/live-proof-events.sample.json)
  is the event mirror shape a UiPath-owned proof path should write or draft.
