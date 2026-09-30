export type SchoolYearStatus = "pending" | "active" | "ended";

export interface SchoolYear {
  id:         string;
  org_id:     string;
  name:       string;
  status:     SchoolYearStatus;
  start_date: string | null;
  end_date:   string | null;
  in_use?:    boolean;
}

export type ReadinessSeverity = "blocking" | "warning";

/**
 * The entity kinds a readiness issue can point at. Mirrors the backend's
 * `ReadinessEntityType` union (school-year-readiness.service.ts) so both the
 * per-entity (`ref`) and aggregated (`entities`) shapes resolve through one
 * route table. Keep in sync with the backend.
 */
export type ReadinessEntityType =
  | "program"
  | "course"
  | "strand"
  | "level"
  | "subject"
  | "section"
  | "class";

export interface ReadinessEntity {
  id:     string;
  name:   string;
  /**
   * What kind of entity `id` refers to. The backend always sends it — without
   * it an id cannot be resolved to a page, so no link can be built.
   */
  type:   ReadinessEntityType;
}

export interface ReadinessIssue {
  code:     string;
  severity: ReadinessSeverity;
  message:  string;
  /** How many entities are affected by this issue (aggregated checks only). */
  count?:   number;
  /** Optional detail list of affected entities (aggregated checks only). */
  entities?: ReadinessEntity[];
  ref?:     {
    type: ReadinessEntityType;
    id:   string;
    name: string;
    /**
     * Owning program's id. Sent on `course` and `strand` refs only — their
     * detail pages are nested under the program and need it to be reachable.
     */
    programId?: string;
  };
}

export interface SchoolYearReadiness {
  ready:         boolean;
  blockingCount: number;
  warningCount:  number;
  issues:        ReadinessIssue[];
}

export interface ReadinessSummary {
  schoolYearId:  string;
  ready:         boolean;
  blockingCount: number;
  warningCount:  number;
}