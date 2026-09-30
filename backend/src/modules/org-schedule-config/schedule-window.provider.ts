/**
 * Structural view of the org schedule config that other modules depend on.
 *
 * Declared here (and implemented structurally by OrgScheduleConfigService)
 * so a consumer can depend on the small interface instead of the concrete
 * service and its module — which keeps the module graph acyclic and the
 * consumer trivially testable.
 */
export interface OrgScheduleConfigProvider {
  getByOrg(orgId: string): Promise<{
    slotDuration: number;
    activeWeekdays?: number[];
    breaks?: { label: string; start: string; end: string }[];
  }>;
}