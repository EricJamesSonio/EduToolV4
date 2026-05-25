"use client";

import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useOrganization } from "@/hooks/admin/useOrganization";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailExtensionGuardProps {
  /** Text for the alert description */
  alertText?: string;
  /** Text for the button label */
  buttonLabel?: string;
  /** Variant for the button */
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  /** Show alert or not */
  showAlert?: boolean;
  /** Custom button onClick handler (default goes to /admin/organization) */
  onNavigate?: () => void;
  children?: React.ReactNode;
}

export function EmailExtensionGuard({
  alertText = "You need to set up an email extension before creating accounts.",
  buttonLabel = "Setup Email Extension",
  buttonVariant = "destructive",
  showAlert = true,
  onNavigate,
  children,
}: EmailExtensionGuardProps) {
  const router = useRouter();
  const { data: org, isLoading } = useOrganization();
  const hasEmailExtension = !!org?.emailExtension;

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      router.push("/admin/organization");
    }
  };

  // If has email extension, render children (or render button)
  if (hasEmailExtension) {
    return children || null;
  }

  // Show guard UI
  return (
    <div className="space-y-4">
      {showAlert && !isLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {alertText}{" "}
            <button
              onClick={handleNavigate}
              className="underline font-semibold hover:opacity-80"
            >
              Organization Settings
            </button>
            .
          </AlertDescription>
        </Alert>
      )}

      {children || (
        <Button
          onClick={handleNavigate}
          variant={buttonVariant}
          disabled={isLoading}
        >
          <AlertCircle className="mr-1.5 h-4 w-4" />
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}