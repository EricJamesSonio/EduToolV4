"use client";
import { useState } from "react";
import { useOrganization, useUpdateOrganization } from "@/hooks/admin/useOrganization";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AtSign, Loader2 } from "lucide-react";

export function EmailExtensionCard(): React.JSX.Element {
  const { data: org, isLoading } = useOrganization();
  const updateMutation = useUpdateOrganization();

  const [extension, setExtension] = useState<string>("");
  const [editing, setEditing] = useState(false);

  // Sync once org loads
  const currentExtension = org?.emailExtension ?? null;

  function handleEdit() {
    setExtension(currentExtension?.replace("@", "") ?? "");
    setEditing(true);
  }

  function handleSave() {
    const cleaned = extension.trim().replace(/^@/, "");
    updateMutation.mutate(
      { emailExtension: cleaned ? `@${cleaned}` : null },
      {
        onSuccess: () => {
          toast.success("Email extension saved.");
          setEditing(false);
        },
        onError: () => toast.error("Failed to save email extension."),
      }
    );
  }

  function handleRemove() {
    updateMutation.mutate(
      { emailExtension: null },
      {
        onSuccess: () => {
          toast.success("Email extension removed.");
          setEditing(false);
        },
        onError: () => toast.error("Failed to remove extension."),
      }
    );
  }

  if (isLoading) return <></>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AtSign className="h-4 w-4" />
          Email Extension
        </CardTitle>
        <CardDescription>
          Set a default email domain for your organization. When creating educators or
          students, they can just type their username and the extension is applied automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!editing ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-md border bg-muted/40 px-3 py-2 text-sm font-mono">
              {currentExtension ?? (
                <span className="text-muted-foreground italic">No extension set</span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleEdit}>
              {currentExtension ? "Edit" : "Set Extension"}
            </Button>
            {currentExtension && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleRemove}
                disabled={updateMutation.isPending}
              >
                Remove
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Domain</Label>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-sm font-mono">@</span>
                <Input
                  className="font-mono"
                  placeholder="edutool.ph"
                  value={extension}
                  onChange={(e) => setExtension(e.target.value.replace(/^@/, ""))}
                  autoFocus
                />
              </div>
              {extension && (
                <p className="text-xs text-muted-foreground">
                  Preview:{" "}
                  <span className="font-mono text-foreground">
                    username@{extension}
                  </span>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateMutation.isPending || !extension.trim()}
              >
                {updateMutation.isPending ? (
                  <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Saving...</>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}