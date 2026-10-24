export const REFERENCE_ROLES = [
  "style",
  "palette",
  "materials",
  "furniture",
  "layout",
] as const;
export type ReferenceRole = typeof REFERENCE_ROLES[number];
export type EditScope = "branch" | "turn";
export type Quality = "lite" | "quality" | "next" | "fast";
export type ImageSize = "1K" | "2K" | "4K";
export interface DesignBrief {
  room: string;
  style: string;
  palette: string;
  density: string;
  notes: string;
  preserve: boolean;
}
export interface ReferenceBinding {
  assetId: string;
  role: ReferenceRole;
  scope: EditScope;
  priority: "primary" | "supporting";
  analysisId?: string;
  accepted: Record<string, string[]>;
}
export interface DesignContext {
  brief: DesignBrief;
  references: ReferenceBinding[];
  profileVersionId: string | null;
  profileGuidance?: string;
  epoch?: string;
  decisions?: string[];
}
export interface DesignAsset {
  id: string;
  project_id: string;
  kind: "original" | "reference" | "generated";
  bucket: string;
  storage_path: string;
  mime_type: string;
  width: number;
  height: number;
  byte_size: number;
  content_hash: string;
  url: string;
}
export interface DesignVersion {
  id: string;
  project_id: string;
  branch_id: string;
  parent_version_id: string | null;
  asset_id: string;
  turn_id: string | null;
  context_snapshot: DesignContext;
  label: string;
  state: "candidate" | "accepted" | "rejected";
  created_at: string;
  model: string | null;
  image_size: string | null;
  returned_model?: string | null;
}
export interface DesignBranch {
  id: string;
  project_id: string;
  name: string;
  head_version_id: string;
  forked_from_version_id: string | null;
  context: DesignContext;
  context_revision: number;
}
export interface DesignTurn {
  id: string;
  branch_id: string;
  base_version_id: string;
  user_edit: string;
  scope: EditScope;
  operation: string;
  context_snapshot: DesignContext;
  created_at: string;
}
export type JobStatus =
  | "queued"
  | "running"
  | "saving"
  | "succeeded"
  | "failed"
  | "needs_recovery"
  | "cancelled";
export interface DesignJob {
  id: string;
  branch_id: string;
  turn_id: string;
  base_version_id: string;
  status: JobStatus;
  error_code: string | null;
  error_message: string | null;
  result_version_ids: string[];
  cancel_requested: boolean;
  created_at: string;
  quality: Quality;
  image_size: ImageSize;
}
export interface AssetAnalysis {
  id: string;
  asset_id: string;
  role: ReferenceRole;
  model: string;
  schema_version: number;
  observations: Record<string, string[]>;
  uncertainty: string[];
  created_at: string;
}
export interface StyleProfileVersion {
  id: string;
  profile_id: string;
  version: number;
  context: DesignContext;
  created_at: string;
}
export interface StyleProfile {
  id: string;
  name: string;
  latest_version_id: string;
  versions: StyleProfileVersion[];
}
export interface DesignProject {
  id: string;
  title: string;
  original_asset_id: string;
  active_branch_id: string;
  current_version_id: string;
  created_at: string;
}
export interface ProjectHistory {
  project: DesignProject;
  branches: DesignBranch[];
  versions: DesignVersion[];
  assets: DesignAsset[];
  turns: DesignTurn[];
  jobs: DesignJob[];
  analyses: AssetAnalysis[];
}
export interface ModelCapability {
  preset: Quality;
  model: string;
  available: boolean;
  description: string;
}
export const DEFAULT_BRIEF: DesignBrief = {
  room: "Living room",
  style: "Warm modern",
  palette: "Earth and linen",
  density: "Balanced",
  notes: "",
  preserve: true,
};
export const EMPTY_CONTEXT: DesignContext = {
  brief: DEFAULT_BRIEF,
  references: [],
  profileVersionId: null,
};

export const ROLE_FIELDS: Record<ReferenceRole, string[]> = {
  style: ["style", "mood", "materials"],
  palette: ["colours"],
  materials: ["materials"],
  furniture: ["furniture"],
  layout: ["arrangement"],
};
