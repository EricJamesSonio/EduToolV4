export interface CreateForm {
  start_date: string;
  end_date:   string;
}

export interface ShortDurationWarning {
  pendingValues: CreateForm;
}