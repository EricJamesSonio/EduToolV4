"use client";

import { useState } from "react";
import { Plus, Trash2, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { groupyApi } from "@/api/shared/groupy.api";
import type { GroupyMessage } from "@/types/groupy/groupy.types";

interface PollCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  onCreated: (message: GroupyMessage) => void;
}

export function PollCreatorDialog({
  open,
  onOpenChange,
  classId,
  onCreated,
}: PollCreatorDialogProps): React.JSX.Element {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [submitting, setSubmitting] = useState(false);

  const trimmedOptions = options.map((o) => o.trim()).filter(Boolean);
  const valid = question.trim().length > 0 && trimmedOptions.length >= 2;

  const handleAdd = () => setOptions((prev) => [...prev, ""]);
  const handleRemove = (index: number) =>
    setOptions((prev) => (prev.length > 2 ? prev.filter((_, i) => i !== index) : prev));
  const handleChange = (index: number, value: string) =>
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));

  const handleSubmit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const message = await groupyApi.createPoll(classId, {
        question: question.trim(),
        options: trimmedOptions,
      });
      onCreated(message);
      setQuestion("");
      setOptions(["", ""]);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Create a Poll
          </DialogTitle>
          <DialogDescription>
            Ask a question and let the class weigh in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Question</label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Best topic for next week?"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Options</label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(e) => handleChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(index)}
                  disabled={options.length <= 2}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={handleAdd}
            >
              <Plus className="h-3.5 w-3.5" />
              Add option
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!valid || submitting}>
            Create poll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}