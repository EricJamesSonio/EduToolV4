"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Building2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OrgForm } from "./types";

interface OrgCreateFormProps {
  register: UseFormRegister<OrgForm>;
  errors: FieldErrors<OrgForm>;
  onSubmit: () => void;
  isPending: boolean;
}

export function OrgCreateForm({
  register,
  errors,
  onSubmit,
  isPending,
}: OrgCreateFormProps): React.JSX.Element {
  return (
    <div className="mx-auto max-w-xl">
      <Card className="border-border/60">
        <CardContent className="flex flex-col items-center text-center pt-8 pb-6 px-6">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">
            Create Organization
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            You haven&apos;t set up an organization yet. Give your school a
            name to get started.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            className="w-full space-y-4 text-left"
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
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Organization
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}