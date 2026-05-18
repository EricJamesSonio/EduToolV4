"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Eye, Pencil, Check, X, Trash2 } from "lucide-react";
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

  // Track new steps that haven't been saved yet
  const [newSteps, setNewSteps] = useState<
    { title: string; text: string; imageUrl: string | null }[]
  >([]);

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

  const handleAddStep = () => {
    setNewSteps((prev) => [
      ...prev,
      { title: "", text: "", imageUrl: null },
    ]);
  };

  const handleSaveNewStep = (index: number) => {
    const step = newSteps[index];
    if (!step.text) return;

    const maxOrder = guide.steps.length > 0
      ? Math.max(...guide.steps.map((s) => s.orderIndex))
      : 0;

    createStep.mutate(
      {
        guideId: id,
        dto: {
          orderIndex: maxOrder + 1,
          title: step.title || undefined,
          text: step.text,
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

  const allSteps: (GuideStep | {
    id: string;
    orderIndex: number;
    title: string | null;
    text: string;
    imageUrl: string | null;
    createdAt: string;
    updatedAt: string;
    isNew: true;
  })[] = [
    ...guide.steps,
    ...newSteps.map((s, i) => ({
      id: `new-${i}`,
      orderIndex: guide.steps.length + i,
      title: s.title || null,
      text: s.text,
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
            {guide.pagePath}
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
                Steps ({guide.steps.length + newSteps.length})
              </h2>
              <Button onClick={handleAddStep} size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Add Step
              </Button>
            </div>

            {/* Saved Steps */}
            {guide.steps.map((step, index) => (
              <GuideStepEditor
                key={step.id}
                index={index}
                title={step.title ?? ""}
                text={step.text}
                imageUrl={step.imageUrl}
                onTitleChange={(value) => {
                  updateStep.mutate({
                    stepId: step.id,
                    dto: { title: value || undefined },
                  });
                }}
                onTextChange={(value) => {
                  updateStep.mutate({
                    stepId: step.id,
                    dto: { text: value },
                  });
                }}
                onImageChange={(url) => {
                  updateStep.mutate({
                    stepId: step.id,
                    dto: { imageUrl: url || undefined },
                  });
                }}
                onRemove={() => {
                  deleteStep.mutate({ stepId: step.id, guideId: id });
                }}
              />
            ))}

            {/* New Steps (unsaved) */}
            {newSteps.map((step, index) => {
              const globalIndex = guide.steps.length + index;
              return (
                <div key={`new-${index}`} className="relative">
                  <div className="absolute -top-2 right-4 z-10 flex gap-1">
                    <Button
                      size="xs"
                      onClick={() => handleSaveNewStep(index)}
                      disabled={!step.text}
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
                    text={step.text}
                    imageUrl={step.imageUrl}
                    onTitleChange={(value) => {
                      setNewSteps((prev) =>
                        prev.map((s, i) =>
                          i === index ? { ...s, title: value } : s,
                        ),
                      );
                    }}
                    onTextChange={(value) => {
                      setNewSteps((prev) =>
                        prev.map((s, i) =>
                          i === index ? { ...s, text: value } : s,
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
