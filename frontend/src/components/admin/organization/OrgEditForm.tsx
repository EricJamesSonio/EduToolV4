"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OrgForm } from "./types";

interface OrgEditFormProps {
  register: UseFormRegister<OrgForm>;
  errors: FieldErrors<OrgForm>;
  onSubmit: () => void;
  isDirty: boolean;
  isPending: boolean;
}

export function OrgEditForm({
  register,
  errors,
  onSubmit,
  isDirty,
  isPending,
}: OrgEditFormProps): React.JSX.Element {
  return (
    <Card className="border-border/60">
      <CardContent className="px-6 py-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Edit details
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="org-name" className="text-xs text-muted-foreground">
              Organization name
            </Label>
            <Input
              id="org-name"
              placeholder="e.g. St. Mary's Academy"
              {...register("name", {
                required: "Name is required",
                minLength: { value: 2, message: "At least 2 characters" },
                maxLength: { value: 100, message: "Max 100 characters" },
              })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="org-desc" className="text-xs text-muted-foreground">
              Description{" "}
              <span className="text-muted-foreground/70">(optional)</span>
            </Label>
            <Textarea
              id="org-desc"
              placeholder="A brief description of your school..."
              rows={4}
              {...register("description", {
                maxLength: { value: 500, message: "Max 500 characters" },
              })}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending || !isDirty}>
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}