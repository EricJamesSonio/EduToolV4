"use client";

import { CredentialsCard } from "@/components/shared/CredentialsCard";

interface EducatorCredentials {
  fullName:     string;
  email:        string;
  educatorCode: string;
  password:     string;
}

interface EducatorCredentialsCardProps {
  open:        boolean;
  onClose:     () => void;
  credentials: EducatorCredentials;
  title?:      string;
}

export function EducatorCredentialsCard({
  open,
  onClose,
  credentials,
  title = "Educator account created",
}: EducatorCredentialsCardProps): React.JSX.Element {
  return (
    <CredentialsCard
      open={open}
      onClose={onClose}
      title={title}
      filename={`educator-credentials-${credentials.email}`}
      rows={[
        { label: "Full Name",   value: credentials.fullName },
        { label: "Email",       value: credentials.email },
        { label: "Educator ID", value: credentials.educatorCode, mono: true },
      ]}
      password={credentials.password}
    />
  );
}
