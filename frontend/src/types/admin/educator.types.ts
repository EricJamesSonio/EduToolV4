export interface Educator {
  id:           string;
  orgId:        string;
  fullName:     string;
  email:        string;
  educatorCode: string;  // may come as educatorId from backend
  educatorId?:  string;  // backend field name alias
  classCount:   number;
  createdAt:    string;
  updatedAt:    string;
  password?:    string;
}

export interface EducatorCredentials {
  fullName:     string;
  email:        string;
  educatorCode: string;
  password:     string;
}