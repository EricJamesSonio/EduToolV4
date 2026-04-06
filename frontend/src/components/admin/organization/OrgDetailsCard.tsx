import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { organizationApi } from "@/api/admin/organization.api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"

interface OrgForm {
  name:        string
  description: string
}

export function OrgDetailsCard() {
  const queryClient = useQueryClient()

  const { data: org, isLoading } = useQuery({
    queryKey: ["admin", "organization"],
    queryFn:  organizationApi.getOrg,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<OrgForm>({
    defaultValues: { name: "", description: "" },
  })

  useEffect(() => {
    if (org) reset({ name: org.name, description: org.description ?? "" })
  }, [org, reset])

  const updateMutation = useMutation({
    mutationFn: (values: OrgForm) =>
      organizationApi.updateOrg({
        name:        values.name,
        description: values.description || undefined,
      }),
    onSuccess: (updated) => {
      toast.success("Organization updated.")
      queryClient.invalidateQueries({ queryKey: ["admin", "organization"] })
      reset({ name: updated.name, description: updated.description ?? "" })
    },
    onError: () => toast.error("Failed to update organization."),
  })

  const onSubmit = (values: OrgForm) => updateMutation.mutate(values)

  return (
    <div className="rounded-lg border bg-card p-6 space-y-5">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Details
      </h2>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              placeholder="e.g. St. Mary's Academy"
              {...register("name", {
                required:  "Name is required",
                minLength: { value: 2,   message: "At least 2 characters" },
                maxLength: { value: 100, message: "Max 100 characters" },
              })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="org-desc">
              Description{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
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
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {isDirty && (
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}