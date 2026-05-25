"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Eye, Pencil, Check, X, Trash2, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGuide, useUpdateGuide, useDeleteGuide, useCreateStep, useUpdateStep, useDeleteStep } from "@/hooks/platform/useGuides";
import { GuideStepEditor } from "@/components/platform/guide/GuideStepEditor";
import { GuidePreview } from "@/components/platform/guide/GuidePreview";
import type { GuideStep } from "@/types/platform/guide.types";

export default function GuideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: guide, isLoading } = useGuide(id);
  const updateGuide = useUpdateGuide();
  const deleteGuide = useDeleteGuide();
  const createStep = useCreateStep();
  const updateStep = useUpdateStep();
  const deleteStep = useDeleteStep();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Local edits for existing steps — only persisted on "Save Changes"
  const [stepEdits, setStepEdits] = useState<Record<string, { title: string; content: string; imageUrl: string | null }>>({});

  // Track removed step ids to delete on save
  const [removedStepIds, setRemovedStepIds] = useState<Set<string>>(new Set());

  // Track new steps that haven't been saved yet
  const [newSteps, setNewSteps] = useState<
    { title: string; content: string; imageUrl: string | null }[]
  >([]);

  const [saving, setSaving] = useState(false);

  const dirtyCount = Object.keys(stepEdits).length;

  const getStepValue = useCallback(
    (step: GuideStep, field: "title" | "content" | "imageUrl"): string => {
      const edit = stepEdits[step.id];
      if (edit && edit[field] !== undefined) return edit[field] ?? "";
      return step[field] ?? "";
    },
    [stepEdits],
  );

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="space-y-4">
        <Link href="/platform/guides">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Guides
          </Button>
        </Link>
        <p className="text-muted-foreground">Guide not found</p>
      </div>
    );
  }

  const handleSaveTitle = () => {
    if (titleDraft !== guide.title) {
      updateGuide.mutate({ id, dto: { title: titleDraft } });
    }
    setEditingTitle(false);
  };

  const handleStepChange = (
    stepId: string,
    field: "title" | "content" | "imageUrl",
    value: string,
  ) => {
    setStepEdits((prev) => {
      const current = prev[stepId] ?? {
        title: guide.steps.find((s) => s.id === stepId)?.title ?? "",
        content: guide.steps.find((s) => s.id === stepId)?.content ?? "",
        imageUrl: guide.steps.find((s) => s.id === stepId)?.imageUrl ?? null,
      };
      const next = { ...current, [field]: field === "imageUrl" ? (value || null) : value };

      // If the value matches the original, remove from edits
      const original = guide.steps.find((s) => s.id === stepId);
      if (original) {
        const origField = field === "imageUrl" ? (original.imageUrl ?? "") : (original[field as keyof GuideStep] ?? "");
        if (next[field] === origField || (field === "imageUrl" && !next[field] && !original.imageUrl)) {
          const { [field]: _, ...rest } = next as any;
          if (Object.keys(rest).length === 0) {
            const { [stepId]: _s, ...remaining } = prev;
            return remaining;
          }
          return { ...prev, [stepId]: rest };
        }
      }

      return { ...prev, [stepId]: next };
    });
  };

  const handleRemoveStep = (stepId: string) => {
    setRemovedStepIds((prev) => new Set(prev).add(stepId));
  };

  const handleUndoRemove = (stepId: string) => {
    setRemovedStepIds((prev) => {
      const next = new Set(prev);
      next.delete(stepId);
      return next;
    });
  };

  const handleAddStep = () => {
    setNewSteps((prev) => [
      ...prev,
      { title: "", content: "", imageUrl: null },
    ]);
  };

  const handleSaveNewStep = (index: number) => {
    const step = newSteps[index];
    if (!step.content) return;

    const maxOrder = guide.steps.length > 0
      ? Math.max(...guide.steps.map((s) => s.orderIndex))
      : 0;

    createStep.mutate(
      {
        guideId: id,
        dto: {
          orderIndex: maxOrder + 1,
          title: step.title || undefined,
          content: step.content,
          imageUrl: step.imageUrl || undefined,
        },
      },
      {
        onSuccess: () => {
          setNewSteps((prev) => prev.filter((_, i) => i !== index));
        },
      },
    );
  };

  const handleRemoveNewStep = (index: number) => {
    setNewSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveChanges = async () => {
    setSaving(true);

    try {
      // Save deleted steps first
      for (const stepId of removedStepIds) {
        deleteStep.mutate({ stepId, guideId: id });
      }

      // Save edited steps
      for (const [stepId, edits] of Object.entries(stepEdits)) {
        updateStep.mutate({
          stepId,
          dto: {
            ...(edits.title !== undefined && { title: edits.title || undefined }),
            ...(edits.content !== undefined && { content: edits.content }),
            ...(edits.imageUrl !== undefined && { imageUrl: edits.imageUrl || undefined }),
          },
        });
      }

      setStepEdits({});
      setRemovedStepIds(new Set());
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = dirtyCount > 0 || removedStepIds.size > 0;

  const visibleSteps = guide.steps.filter((s) => !removedStepIds.has(s.id));

  const allSteps: (GuideStep | {
    id: string;
    orderIndex: number;
    title: string | null;
    content: string;
    imageUrl: string | null;
    createdAt: string;
    updatedAt: string;
    isNew: true;
  })[] = [
    ...visibleSteps,
    ...newSteps.map((s, i) => ({
      id: `new-${i}`,
      orderIndex: visibleSteps.length + i,
      title: s.title || null,
      content: s.content,
      imageUrl: s.imageUrl,
      createdAt: "",
      updatedAt: "",
      isNew: true as const,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/platform/guides">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                className="max-w-xs"
                autoFocus
              />
              <Button size="icon-xs" onClick={handleSaveTitle}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setTitleDraft(guide.title);
                  setEditingTitle(false);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                {guide.title}
              </h1>
              <button
                onClick={() => {
                  setTitleDraft(guide.title);
                  setEditingTitle(true);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {guide.slug}
            <span className="ml-2 capitalize">({guide.portal})</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showPreview ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="mr-1 h-4 w-4" />
            {showPreview ? "Edit" : "Preview"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              updateGuide.mutate({
                id,
                dto: { isActive: !guide.isActive },
              })
            }
          >
            {guide.isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              deleteGuide.mutate(id, {
                onSuccess: () => router.push("/platform/guides"),
              });
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Description */}
      {guide.description && (
        <p className="text-sm text-muted-foreground">{guide.description}</p>
      )}

      {/* Unsaved changes bar */}
      {hasChanges && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm">
          <span className="text-amber-800">
            {dirtyCount > 0 && `${dirtyCount} step${dirtyCount > 1 ? "s" : ""} edited`}
            {dirtyCount > 0 && removedStepIds.size > 0 && " · "}
            {removedStepIds.size > 0 && `${removedStepIds.size} step${removedStepIds.size > 1 ? "s" : ""} removed (will be deleted)`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStepEdits({});
                setRemovedStepIds(new Set());
              }}
            >
              Discard
            </Button>
            <Button size="sm" onClick={handleSaveChanges} disabled={saving}>
              <Save className="mr-1 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}

      {/* Preview Mode */}
      {showPreview ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Guide Preview
          </h2>
          <GuidePreview steps={allSteps as GuideStep[]} />
        </div>
      ) : (
        <>
          {/* Steps List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Steps ({visibleSteps.length + newSteps.length})
              </h2>
              <Button onClick={handleAddStep} size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Add Step
              </Button>
            </div>

            {/* Saved Steps */}
            {visibleSteps.map((step, index) => (
              <GuideStepEditor
                key={step.id}
                index={index}
                title={getStepValue(step, "title")}
                content={getStepValue(step, "content")}
                imageUrl={stepEdits[step.id]?.imageUrl ?? step.imageUrl}
                onTitleChange={(value) => handleStepChange(step.id, "title", value)}
                onContentChange={(value) => handleStepChange(step.id, "content", value)}
                onImageChange={(url) => handleStepChange(step.id, "imageUrl", url ?? "")}
                onRemove={() => handleRemoveStep(step.id)}
              />
            ))}

            {/* New Steps (unsaved) */}
            {newSteps.map((step, index) => {
              const globalIndex = visibleSteps.length + index;
              return (
                <div key={`new-${index}`} className="relative">
                  <div className="absolute -top-2 right-4 z-10 flex gap-1">
                    <Button
                      size="xs"
                      onClick={() => handleSaveNewStep(index)}
                      disabled={!step.content}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleRemoveNewStep(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <GuideStepEditor
                    index={globalIndex}
                    title={step.title}
                    content={step.content}
                    imageUrl={step.imageUrl}
                    onTitleChange={(value) => {
                      setNewSteps((prev) =>
                        prev.map((s, i) =>
                          i === index ? { ...s, title: value } : s,
                        ),
                      );
                    }}
                    onContentChange={(value) => {
                      setNewSteps((prev) =>
                        prev.map((s, i) =>
                          i === index ? { ...s, content: value } : s,
                        ),
                      );
                    }}
                    onImageChange={(url) => {
                      setNewSteps((prev) =>
                        prev.map((s, i) =>
                          i === index ? { ...s, imageUrl: url } : s,
                        ),
                      );
                    }}
                    onRemove={() => handleRemoveNewStep(index)}
                  />
                </div>
              );
            })}

            {allSteps.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  No steps added yet. Click &quot;Add Step&quot; to get started.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
