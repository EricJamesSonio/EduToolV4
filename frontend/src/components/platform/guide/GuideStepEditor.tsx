"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2, GripVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/config/api.config";
import { uploadImage } from "@/api/platform/guide.api";

interface GuideStepEditorProps {
  index: number;
  title: string;
  content: string;
  imageUrl: string | null;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onImageChange: (url: string | null) => void;
  onRemove: () => void;
}

export function GuideStepEditor({
  index,
  title,
  content,
  imageUrl,
  onTitleChange,
  onContentChange,
  onImageChange,
  onRemove,
}: GuideStepEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      onImageChange(url);
    } catch {
      // toast is handled by interceptor
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    onImageChange(null);
  };

  const resolvedImageUrl = imageUrl?.startsWith("/uploads/")
    ? `${API_BASE_URL}${imageUrl}`
    : imageUrl;

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
        {/* LEFT: Content */}
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
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="e.g. Manage organization and modify name and description"
              rows={4}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-gray-500 focus-visible:outline-none focus-visible:ring-0 resize-none"
            />
          </div>
        </div>

        {/* RIGHT: Image */}
        <div className="flex flex-col items-center justify-center">
          {resolvedImageUrl ? (
            <div className="relative w-full">
              <img
                src={resolvedImageUrl!}
                alt={`Step ${index + 1}`}
                className="w-full rounded-lg border border-border object-contain"
                style={{ maxHeight: 280 }}
              />
              <div className="absolute right-2 top-2 flex gap-1">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => fileInputRef.current?.click()}
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
              {uploading ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-sm">Add screenshot</span>
                </button>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
