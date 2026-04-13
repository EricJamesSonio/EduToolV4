export interface CreateForm {
  name:       string;
  start_date: string;
  end_date:   string;
}

export interface ShortDurationWarning {
  pendingValues: CreateForm;
}