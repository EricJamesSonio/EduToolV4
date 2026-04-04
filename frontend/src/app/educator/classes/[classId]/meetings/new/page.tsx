"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, ArrowLeft, Users, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/shared/PageHeader";
import { useCreateMeeting, useEnrolledStudents } from "@/hooks/educator/useMeeting";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AxiosError } from "axios";

interface Props {
  params: Promise<{ classId: string }>;
}

export default function NewMeetingPage({ params }: Props) {
  const { classId } = use(params);
  const router      = useRouter();
  const createMutation       = useCreateMeeting(classId);
  const { data: studentsRaw } = useEnrolledStudents(classId);
  const students = Array.isArray(studentsRaw) ? studentsRaw : [];

  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime]     = useState("");
  const [inviteAll, setInviteAll]     = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const canSave = title.trim().length > 0 && startTime.length > 0 && !createMutation.isPending;

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    const invitedStudentIds = inviteAll ? [] : Array.from(selectedIds);
    createMutation.mutate(
      {
        title:       title.trim(),
        description: description.trim() || undefined,
        startTime:   new Date(startTime).toISOString(),
        invitedStudentIds,
      },
      {
        onSuccess: (meeting) => {
          toast.success("Meeting created.");
          router.push(`/educator/classes/${classId}/meetings/${meeting.id}`);
        },
        onError: (err: unknown) => {
          const axiosErr = err as AxiosError<{ message: string }>;
          toast.error(axiosErr?.response?.data?.message ?? "Failed to create meeting.");
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="New Meeting"
        breadcrumbs={[
          { label: "Meetings", href: `/educator/classes/${classId}/meetings` },
          { label: "New Meeting" },
        ]}
      />

      <div className="space-y-5 rounded-lg border bg-card p-6">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
          <Input
            id="title"
            placeholder="e.g. Week 3 Live Session"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={createMutation.isPending}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Textarea
            id="description"
            placeholder="What will this meeting cover?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={createMutation.isPending}
            rows={3}
          />
        </div>

        {/* Start Date/Time */}
        <div className="space-y-1.5">
          <Label htmlFor="startTime">Start Date & Time <span className="text-destructive">*</span></Label>
          <Input
            id="startTime"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={createMutation.isPending}
          />
        </div>

        {/* Invite */}
        <div className="space-y-3">
          <Label>Invite Students</Label>

          {/* All students toggle */}
          <div
            className="flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
            onClick={() => setInviteAll(true)}
          >
            <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${inviteAll ? "border-primary bg-primary" : "border-muted-foreground"}`}>
              {inviteAll && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
            </div>
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">All enrolled students</p>
              <p className="text-xs text-muted-foreground">{students.length} student{students.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          {/* Select specific */}
          <div
            className="flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
            onClick={() => setInviteAll(false)}
          >
            <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${!inviteAll ? "border-primary bg-primary" : "border-muted-foreground"}`}>
              {!inviteAll && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
            </div>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Select specific students</p>
          </div>

          {/* Student checklist */}
          {!inviteAll && (
            <ScrollArea className="max-h-48 rounded-md border">
              {students.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No enrolled students found.</p>
              ) : (
                <div className="p-2 space-y-1">
                  {students.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors"
                    >
                      <Checkbox
                        checked={selectedIds.has(s.id)}
                        onCheckedChange={() => toggleStudent(s.id)}
                        disabled={createMutation.isPending}
                      />
                      <div>
                        <p className="text-sm font-medium">{s.fullName}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => router.push(`/educator/classes/${classId}/meetings`)}
          disabled={createMutation.isPending}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Button>
        <Button disabled={!canSave} onClick={handleSave} className="gap-1.5">
          <Save className="h-4 w-4" />
          {createMutation.isPending ? "Saving..." : "Save Meeting"}
        </Button>
      </div>
    </div>
  );
}