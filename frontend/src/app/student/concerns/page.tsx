"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConcernCenterFeature } from "@/components/shared/concern-center/ConcernCenterFeature";
import {
  useConcernCategories,
  useMyConcerns,
  useConcernThread,
  useSubmitConcern,
  useReplyToConcern,
} from "@/hooks/student/useConcerns";
import type { SubmitConcernRequest } from "@/api/student/concern.api";

export default function StudentConcernsPage() {
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const categoriesQuery = useConcernCategories();
  const mineQuery = useMyConcerns(page, 20);
  const threadQuery = useConcernThread(selectedId);
  const submitMutation = useSubmitConcern();
  const replyMutation = useReplyToConcern();

  const categories = categoriesQuery.data ?? [];
  const mine = mineQuery.data?.data ?? [];

  const myConcernsLoading =
    mineQuery.isPending && mineQuery.isFetching;

  return (
    <ConcernCenterFeature
      categories={categories}
      categoriesLoading={categoriesQuery.isPending}
      myConcerns={mine}
      myConcernsLoading={myConcernsLoading}
      thread={threadQuery.data}
      threadLoading={threadQuery.isPending}
      submitting={submitMutation.isPending}
      replying={replyMutation.isPending}
      onSelect={(id) => setSelectedId(id)}
      onSubmit={async (payload: SubmitConcernRequest) => {
        try {
          await submitMutation.mutateAsync(payload);
          toast.success("Concern submitted");
        } catch {
          toast.error("Failed to submit concern");
        }
      }}
      onReply={async (concernId, body) => {
        try {
          await replyMutation.mutateAsync({ concernId, body });
          toast.success("Reply sent");
        } catch {
          toast.error("Failed to send reply");
        }
      }}
    />
  );
}