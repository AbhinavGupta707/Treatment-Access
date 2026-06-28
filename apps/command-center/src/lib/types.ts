import type {
  AuditEvent,
  DemoToggles,
  EvidenceMapping,
  PatientSnapshot,
  PolicyCriterion,
  TreatmentAccessCase,
  TreatmentOrder,
} from "@tacc/shared-schemas";

export type DemoState = {
  case: TreatmentAccessCase | null;
  patient: PatientSnapshot | null;
  order: TreatmentOrder | null;
  criteria: PolicyCriterion[];
  evidenceMappings: EvidenceMapping[];
  toggles: DemoToggles;
  events: AuditEvent[];
};

export type RuntimeSource = "api" | "fallback";

export type RuntimeState = {
  data: DemoState;
  source: RuntimeSource;
  apiBaseUrl: string;
  lastFetchedAt: string;
  error: string | null;
};

export type ActorFilter =
  "all" | "agent" | "api_workflow" | "robot" | "human" | "system";
