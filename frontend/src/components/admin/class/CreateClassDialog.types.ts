export interface ScheduleSlotForm {
  weekday:   string;
  startTime: string;
  endTime:   string;
}

export interface CreateClassForm {
  programId:  string;
  semesterId: string;
  trackId:    string;
  levelId:    string;
  sectionId:  string;
  subjectId:  string;
  educatorId: string;
  capacity:   string;
  schedules:  ScheduleSlotForm[];
}

export const EMPTY_DEFAULTS: CreateClassForm = {
  programId:  "",
  semesterId: "",
  trackId:    "",
  levelId:    "",
  sectionId:  "",
  subjectId:  "",
  educatorId: "",
  capacity:   "30",
  schedules:  [],
};

export interface CreateClassDialogProps {
  open:              boolean;
  onClose:           () => void;
  defaultSubjectId?: string;
  schoolYearId:      string | null;
  schoolYearName:    string | null;
  defaultProgramId?:  string;
  defaultSemesterId?: string;
  defaultTrackId?:    string;
  defaultLevelId?:    string;
  defaultSectionId?:  string;
 
}
