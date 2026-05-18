"use client";

import { useState } from "react";
import { ImagePlus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface GuideStepEditorProps {
  index: number;
  title: string;
  text: string;
  imageUrl: string | null;
  onTitleChange: (value: string) => void;
  onTextChange: (value: string) => void;
  onImageChange: (url: string | null) => void;
  onRemove: () => void;
}

export function GuideStepEditor({
  index,
  title,
  text,
  imageUrl,
  onTitleChange,
  onTextChange,
  onImageChange,
  onRemove,
}: GuideStepEditorProps) {
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [tempUrl, setTempUrl] = useState(imageUrl ?? "");

  const handleSaveImage = () => {
    onImageChange(tempUrl.trim() || null);
    setIsEditingImage(false);
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    setTempUrl("");
    setIsEditingImage(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Step {index + 1}
        </span>
        <div className="flex-1" />
        <Button
          variant="destructive"
          size="icon-sm"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* LEFT: Text */}
        <div className="flex flex-col justify-center gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Step Title (optional)
            </label>
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g. Manage Organization"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="e.g. Manage organization and modify name and description"
              rows={4}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-gray-500 focus-visible:outline-none focus-visible:ring-0 resize-none"
            />
          </div>
        </div>

        {/* RIGHT: Image */}
        <div className="flex flex-col items-center justify-center">
          {imageUrl ? (
            <div className="relative w-full">
              <img
                src={imageUrl}
                alt={`Step ${index + 1}`}
                className="w-full rounded-lg border border-border object-contain"
                style={{ maxHeight: 280 }}
              />
              <div className="absolute right-2 top-2 flex gap-1">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => {
                    setTempUrl(imageUrl);
                    setIsEditingImage(true);
                  }}
                >
                  Change
                </Button>
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={handleRemoveImage}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex h-48 w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30">
              {isEditingImage ? (
                <div className="flex w-full flex-col gap-3 p-4">
                  <Input
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    placeholder="Paste image URL..."
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingImage(false)}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveImage}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingImage(true)}
                  className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-sm">Add screenshot</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
