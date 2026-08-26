export interface OrgScheduleConfig {
  id: string;
  orgId: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertOrgScheduleConfigRequest {
  startTime: string;
  endTime: string;
  slotDuration: number;
}
