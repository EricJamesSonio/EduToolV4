export interface Registrar {
  id:        string;
  orgId:     string;
  email:     string;
  username:  string;
  fullName?: string;
  status?:   string;
  createdAt: string;
}

export interface RegistrarCredentials {
  username: string;
  email:    string;
  password: string;
}
