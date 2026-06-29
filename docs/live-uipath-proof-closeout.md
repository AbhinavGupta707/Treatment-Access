# Live UiPath Proof Closeout

Date: 2026-06-29

This records the approved final UiPath live proof run for Treatment Access
Command Center. All data is synthetic. No real patient, payer, provider,
credential, or PHI was used. No real payer submission was performed.

## Scope

- Organization: `galacticus`
- Tenant: `DefaultTenant`
- Parent folder: `TreatmentAccessHackathon`
- Parent folder ID: `7986316`
- Parent folder key: `4fba2fa1-012b-469a-b6aa-e5be3811c173`
- Deployed solution folder:
  `TreatmentAccessHackathon/TACCFinalLiveProof20260629`
- Deployed solution folder ID: `7988953`
- Deployed solution folder key: `0883039e-9c74-490f-872b-a5b3bf94b682`

## Live Proof Achieved

| Level                   | Result                                                                                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| H1 UiPath-written state | Created folder-scoped Data Fabric entity `TreatmentAccessProofEvent` and inserted verified synthetic proof records.                                                                                                                              |
| H2 Human gate           | Created, assigned, completed, and read back one live synthetic Action Center ExternalTask in `TreatmentAccessHackathon`.                                                                                                                         |
| H3 Orchestrator job     | Deployed `PayerPortalFallback` process and completed one live Development-runtime Orchestrator job. The current XAML is scaffold-only, so this proves Orchestrator execution but not portal UI automation.                                       |
| H4 Solution lifecycle   | Published, deployed, and activated the UiPath solution package under the Treatment Access folder.                                                                                                                                                |
| H5 Maestro proof        | Created a live Maestro Case instance and debugged a valid Maestro Flow. Both reached the human-task boundary; inline HITL faulted at Action/AppTasks binding, so the completed human gate is recorded through the live Action Center task above. |

## Live Identifiers

| Evidence                     | Identifier                                                |
| ---------------------------- | --------------------------------------------------------- |
| Data Fabric entity           | `feea1705-e673-f111-ac9a-002248a16d28`                    |
| Proof run                    | `tacc-live-uipath-proof-20260629-final`                   |
| Primary proof record         | `B2501C19-E673-F111-AC9A-0022489A9A06`                    |
| Action Center surface record | `8A6E828F-0E28-47C4-B3F7-019F149CAA9B`                    |
| Action Center task           | `4401667`                                                 |
| Action Center task key       | `93c09da5-3edb-455e-9679-d513113fd4fa`                    |
| Action Center ExternalTag    | `TACC-2026-001`                                           |
| Action Center completed      | `2026-06-29T19:44:16.577Z`                                |
| Maestro Case instance        | `cad900ae-e4f9-4e59-a1c8-c6f15934f5bc`                    |
| Maestro Flow instance        | `4e17f6d2-a2d7-4730-b1ed-9d0dcadef9b0`                    |
| Solution activation record   | `E20AF4F4-C121-422C-B55A-019F149CAA9C`                    |
| Orchestrator job record      | `01FF1C2C-6A4F-4CA8-AD84-019F149CAA9D`                    |
| Solution package             | `treatment-access-command-center@1.0.20260629`            |
| Solution package version key | `5ce3b060-522a-4f55-9f2c-650d0e6f0c41`                    |
| Solution deployment          | `46ec1e63-3b09-4308-8b44-ed4b65e4e7f7`                    |
| Pipeline deployment          | `ddccb1a1-0781-4a8c-10b0-08ded6011ef2`                    |
| Process key                  | `A9F5CE77-B566-49F0-98C3-CED31D98CA0F`                    |
| Process package key          | `treatment-access-command-center.Rpa.PayerPortalFallback` |
| Orchestrator job             | `6d9b9fa9-f582-4983-98fa-167e87d57f2a`                    |
| Job trace ID                 | `6d9b9fa9f582498398fa167e87d57f2a`                        |

## Commands Run

```bash
uip df entities create TreatmentAccessProofEvent --folder-key 4fba2fa1-012b-469a-b6aa-e5be3811c173 ...
uip df records insert feea1705-e673-f111-ac9a-002248a16d28 --folder-key 4fba2fa1-012b-469a-b6aa-e5be3811c173 ...
scripts/uipath-with-dotnet8.sh uip solution pack uipath/solution/treatment-access-command-center .artifacts/uipath --version 1.0.20260629 ...
uip solution publish .artifacts/uipath/treatment-access-command-center_1.0.20260629.zip --wait --timeout 360 --output json
uip solution deploy run --name tacc-final-live-proof-20260629 --package-name treatment-access-command-center --package-version 1.0.20260629 --folder-name TACCFinalLiveProof20260629 --parent-folder-key 4fba2fa1-012b-469a-b6aa-e5be3811c173 --timeout 360 --output json
uip or machines assign b739aa2f-c12d-419b-b785-c95d8a5cc052 --folder-path TreatmentAccessHackathon/TACCFinalLiveProof20260629 --output json
uip or jobs start A9F5CE77-B566-49F0-98C3-CED31D98CA0F --folder-path TreatmentAccessHackathon/TACCFinalLiveProof20260629 --runtime-type Development --machine-keys b739aa2f-c12d-419b-b785-c95d8a5cc052 --run-as-me --jobs-count 1 --reference tacc-final-live-proof-20260629 --wait-for-completion --timeout 180 --output json
uip maestro case debug TreatmentAccessCase --folder-id 7986316 --poll-interval 2000 --login-validity 0 --output json
uip maestro flow debug ClinicianValidationFlow --folder-id 7986316 --poll-interval 2000 --timeout 600 --inputs '{"externalTag":"TACC-2026-001"}' --login-validity 0 --output json
uip tasks assign 4401667 --user-id <task-eligible-user-id> --output json
uip tasks get 4401667 --task-type ExternalTask --folder-id 7986316 --output json
uip tasks complete 4401667 --type ExternalTask --folder-id 7986316 --data '{"clinicalAttestation":"Approved for synthetic demo after reviewing policy citations and evidence matrix. No real patient data used.","reviewNotes":"Evidence is source-backed; diagnosis severity remains governed by clinician attestation before payer submission."}' --output json
uip tasks get 4401667 --task-type ExternalTask --folder-id 7986316 --output json
```

## Honest Boundaries

- The completed Orchestrator job proves live UiPath deployment and robot/process
  execution in Automation Cloud, but the current `Main.xaml` is scaffold-only.
  It did not capture browser controls or submit the synthetic payer portal form.
- Action Center has live proof: ExternalTask `4401667` was created, assigned,
  completed, and read back with synthetic clinician-attestation output. The
  public `uip tasks` CLI still has no create command; creation used the
  installed UiPath Tasks SDK `GenericTasks/CreateTask` surface.
- The live Maestro Case instance
  `cad900ae-e4f9-4e59-a1c8-c6f15934f5bc` was created but faulted at the case
  action task boundary because no deployed Action App binding was available in
  the tenant registry.
- The live Maestro Flow instance
  `4e17f6d2-a2d7-4730-b1ed-9d0dcadef9b0` reached the inline HITL QuickForm node
  after completing trigger and packet-prep nodes, then faulted in the AppTasks
  request with an `ExternalTag` serializer/validation error.
- The Command Center remains the customer-facing visualization layer. UiPath
  Data Fabric, Solution, Orchestrator, Maestro debug records, and Action Center
  task records are the governed proof sources for the final demo.

## Final Read-Back Verification

After updating the repository closeout docs, the live tenant was queried again
without mutating state:

- Data Fabric record list returned all four proof records and `TotalCount: 4`.
- Solution deployment status returned `DeploymentSucceeded` and
  `SuccessfulActivate` for deployment
  `46ec1e63-3b09-4308-8b44-ed4b65e4e7f7`.
- Orchestrator jobs list in
  `TreatmentAccessHackathon/TACCFinalLiveProof20260629` returned job
  `6d9b9fa9-f582-4983-98fa-167e87d57f2a` with state `Successful`.
- Action Center task `4401667` returned status `Completed`, type
  `ExternalTask`, folder ID `7986316`, and ExternalTag `TACC-2026-001`.
- Maestro Flow instance `4e17f6d2-a2d7-4730-b1ed-9d0dcadef9b0` returned
  `Faulted` at `clinicianEvidenceReview1`, confirming the current boundary is
  inline HITL task creation, not folder/login discovery.
