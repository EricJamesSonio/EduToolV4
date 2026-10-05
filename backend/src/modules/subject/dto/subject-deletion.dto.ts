export class DeletionImpactItemDto {
  key: string;
  label: string;
  count: number;
}

export class SubjectDeletionCheckDto {
  canDelete: boolean;
  outcome: 'delete' | 'archive';
  blockers: DeletionImpactItemDto[];
  willDelete: DeletionImpactItemDto[];
}

export class SubjectDeleteResultDto {
  id: string;
  outcome: 'deleted' | 'archived';
}
