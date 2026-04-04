export interface Educator {
  id:           string;
  orgId:        string;
  fullName:     string;
  email:        string;
  educatorId?:  string;  // backend field: "EDU-XXXXXXXX"
  educatorCode?: string; // alias, may not be present
  classCount:   number;
  status?:      string;
  createdAt:    string;
  updatedAt?:   string;
  password?:    string;
}

export interface EducatorCredentials {
  fullName:     string;
  email:        string;
  educatorCode: string;
  password:     string;
}