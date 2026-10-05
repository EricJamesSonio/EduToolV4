/**
 * Narrow view of the org schedule config that other modules depend on.
 *
 * Declared as an abstract class rather than a TypeScript interface so it works
 * as a Nest DI token. `emitDecoratorMetadata` reads the runtime type off a
 * constructor parameter; with `import type` (or a plain interface) that value
 * is erased and Nest reports an unresolvable `Object` dependency at boot —
 * which no unit test or `tsc` run catches. `useClass` binds it to the real
 * service, so consumers still depend only on this narrow contract.
 */
export abstract class OrgScheduleConfigProvider {
  abstract getByOrg(orgId: string): Promise<{
    startTime: string;
    endTime: string;
    slotDuration: number;
    activeWeekdays?: number[];
    breaks?: { label: string; start: string; end: string }[];
  }>;
}