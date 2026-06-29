# Extraction Readiness And Fallback

This folder owns Checkpoint 3 extraction readiness for IXP/Document Understanding and the schema-compatible fallback parser contract.

## Read-Only Discovery Result

Allowed command attempted:

```bash
uip ixp projects list --output json
```

Result in this workspace: `ValidationError: unknown command 'ixp'`. The installed UiPath CLI is `1.195.1`; `uip --help --output json` and `uip tools list --output json` do not expose an `ixp` command prefix. Following the project layer-order rule, this is documented as a CLI registration/tool-surface blocker before any permission/runtime diagnosis.

No IXP project creation, upload, labelling, prompt update, delete, publish, or tag operation was run.

## Preferred Path

When IXP is available, create or bind a synthetic-only Treatment Access extraction project with these document classes:

- payer policy
- progress note
- lab report
- safety screening
- denial letter

The published model should return fields that map into `EvidenceArtifact.structured_fields`, `EvidenceMapping.source_span`, and denial/appeal fields without changing shared schemas.

## Fallback Parser Contract

Use `fallback-parser-contract.json` and `schemas/fallback-extraction-output.schema.json` when IXP activation is unavailable. The fallback parser must preserve:

- `extraction_method: fallback_parser`
- per-field confidence
- source spans with fixture URI, section label, line/character offsets when available, and short excerpts
- low-confidence or clinical-assertion flags for human review

The fallback parser is allowed for the demo only with synthetic fixture documents.
