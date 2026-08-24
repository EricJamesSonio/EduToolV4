"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2, Trash2, Users, CheckCircle2, XCircle, RefreshCw,
} from "lucide-react";

interface AssessmentActionsProps {
  classId: string;
  assessmentId: string;
  isPublished: boolean;
  isClosed: boolean;
  isPublishing: boolean;
  isUnpublishing: boolean;
  isDeleting: boolean;
  onAssignOpen: () => void;
  onReopenOpen: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
}

export function AssessmentActions({
  classId,
  assessmentId,
  isPublished,
  isClosed,
  isPublishing,
  isUnpublishing,
  isDeleting,
  onAssignOpen,
  onReopenOpen,
  onPublish,
  onUnpublish,
  onDelete,
}: AssessmentActionsProps): React.JSX.Element {
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">

      {/* Assign Students */}
      <Button size="sm" variant="outline" className="gap-1.5" onClick={onAssignOpen}>
        <Users className="h-4 w-4" />
        Assign Students
      </Button>

      {/* Reopen — only for closed assessments */}
      {isClosed && (
        <Button size="sm" variant="outline" className="gap-1.5" onClick={onReopenOpen}>
          <RefreshCw className="h-4 w-4" />
          Reopen
        </Button>
      )}

      {/* Publish / Unpublish */}
      {isPublished ? (
        <>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={isUnpublishing}
            onClick={() => setUnpublishDialogOpen(true)}
          >
            {isUnpublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Unpublish Scores
          </Button>
          <AlertDialog open={unpublishDialogOpen} onOpenChange={setUnpublishDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unpublish scores?</AlertDialogTitle>
                <AlertDialogDescription>
                  Students will no longer see scores or question reviews.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { onUnpublish(); setUnpublishDialogOpen(false); }}>
                  Unpublish
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={isPublishing}
            onClick={() => setPublishDialogOpen(true)}
          >
            {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 text-success" />}
            Publish Scores
          </Button>
          <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Publish scores?</AlertDialogTitle>
                <AlertDialogDescription>
                  Students will immediately see their scores and reviews.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { onPublish(); setPublishDialogOpen(false); }}>
                  Publish
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {/* View Submissions */}
      <Link href={`/educator/classes/${classId}/assessments/${assessmentId}/submissions`}>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Users className="h-4 w-4" />
          View Submissions
        </Button>
      </Link>

      {/* Delete */}
      <Button
        size="sm"
        variant="destructive"
        className="gap-1.5"
        onClick={() => setDeleteDialogOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all submitted scores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onDelete(); setDeleteDialogOpen(false); }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Assessment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}