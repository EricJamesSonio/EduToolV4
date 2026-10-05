export class DeletionImpactItemDto {
  key: string;
  label: string;
  count: number;
}

export class SchoolYearDeletionCheckDto {
  canDelete: boolean;
  blockers: DeletionImpactItemDto[];
  willDelete: DeletionImpactItemDto[];
}
