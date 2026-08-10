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

export interface ReadinessIssue {
  code:     string;
  severity: ReadinessSeverity;
  message:  string;
  ref?:     {
    type: "program" | "course" | "strand" | "level" | "subject";
    id:   string;
    name: string;
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