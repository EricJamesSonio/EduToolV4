export interface OrgScheduleBreak {
  label: string;
  start: string;
  end: string;
}

export interface OrgScheduleConfig {
  id: string;
  orgId: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  /** Weekdays the school holds classes, 0 = Sunday .. 6 = Saturday. */
  activeWeekdays: number[];
  breaks: OrgScheduleBreak[];
  createdAt: string;
  updatedAt: string;
}

export interface UpsertOrgScheduleConfigRequest {
  startTime: string;
  endTime: string;
  slotDuration: number;
  activeWeekdays: number[];
  breaks: OrgScheduleBreak[];
}
