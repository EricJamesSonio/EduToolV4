"use client";

import { CredentialsCard } from "@/components/shared/CredentialsCard";

interface RegistrarCredentials {
  username: string;
  email:    string;
  password: string;
}

interface RegistrarCredentialsCardProps {
  open:        boolean;
  onClose:     () => void;
  credentials: RegistrarCredentials;
  title?:      string;
}

export function RegistrarCredentialsCard({
  open,
  onClose,
  credentials,
  title = "Registrar account created",
}: RegistrarCredentialsCardProps): React.JSX.Element {
  return (
    <CredentialsCard
      open={open}
      onClose={onClose}
      title={title}
      filename={`registrar-credentials-${credentials.email}`}
      rows={[
        { label: "Username", value: credentials.username, mono: true },
        { label: "Email", value: credentials.email },
      ]}
      password={credentials.password}
    />
  );
}
