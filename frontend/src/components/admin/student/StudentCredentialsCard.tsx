"use client";

import { CredentialsCard } from "@/components/shared/CredentialsCard";

interface StudentCredentials {
  fullName:  string;
  email:     string;
  studentId: string;
  password:  string;
}

interface StudentCredentialsCardProps {
  open:        boolean;
  onClose:     () => void;
  credentials: StudentCredentials;
  title?:      string;
}

export function StudentCredentialsCard({
  open,
  onClose,
  credentials,
  title = "Student account created",
}: StudentCredentialsCardProps): React.JSX.Element {
  return (
    <CredentialsCard
      open={open}
      onClose={onClose}
      title={title}
      filename={`student-credentials-${credentials.email}`}
      rows={[
        { label: "Full Name",  value: credentials.fullName },
        { label: "Email",      value: credentials.email },
        { label: "Student ID", value: credentials.studentId, mono: true },
      ]}
      password={credentials.password}
    />
  );
}
