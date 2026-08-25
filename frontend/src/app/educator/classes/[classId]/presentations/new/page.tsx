// src/app/educator/classes/[classId]/presentations/new/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Eye, Save, PaintBucket, Check } from "lucide-react";
import { useLesson } from "@/hooks/educator/useLessons";
import {
  usePresentation, useCreatePresentation, useUpdatePresentation,
  useAutoGenerateSlides, useGenerateSlides,
} from "@/hooks/educator/usePresentations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { TEMPLATE_STYLES } from "@/lib/presentation-templates";
import {
  TemplateSelector, SlideOrganizer, LessonContentPanel, PreviewModal,
  type SlideDraft, type FontSize,
} from "@/components/educator/presentation-builder";
import { newSlideId, parseWords } from "@/components/educator/presentation-builder/utils";
import { FONT_FAMILIES, type FontFamily } from "@/components/educator/presentation-builder/types";
import { cn } from "@/lib/utils";

export default function PresentationBuilderPage(): React.JSX.Element {
  const { classId }        = useParams<{ classId: string }>();
  const searchParams       = useSearchParams();
  const router             = useRouter();
  const lessonId           = searchParams.get("lessonId") ?? "";
  const editPresentationId = searchParams.get("presentationId");

  const { data: lesson, isLoading }  = useLesson(classId, lessonId);
  const { data: existingPres }       = usePresentation(classId, editPresentationId ?? "");
  const { mutateAsync: createPresentation, isPending: isCreating } = useCreatePresentation(classId);
  const { mutateAsync: updatePresentation }  = useUpdatePresentation(classId);
  const { mutateAsync: autoGenerate, isPending: isAutoGenerating } = useAutoGenerateSlides(classId);
  const { mutateAsync: saveSlides }  = useGenerateSlides(classId);

  const scrollRef = useRef<HTMLDivElement>(null);

  const [title,          setTitle]          = useState("");
  const [template,       setTemplate]       = useState("green");
  const [slides,         setSlides]         = useState<SlideDraft[]>([]);
  const [presentationId, setPresentationId] = useState<string | null>(null);
  const [showPreview,    setShowPreview]    = useState(false);
  const [previewSlide,   setPreviewSlide]   = useState(0);

  // ── Active font: only affects NEW slides going forward ───────────────────
  const [activeFont, setActiveFont] = useState<FontFamily>("default");

  const [selMode,      setSelMode]      = useState(false);
  const [startWordIdx, setStartWordIdx] = useState<number | null>(null);
  const [endWordIdx,   setEndWordIdx]   = useState<number | null>(null);
  const [hoverWordIdx, setHoverWordIdx] = useState<number | null>(null);

  const words = useMemo(
    () => (lesson?.detail ? parseWords(lesson.detail) : []),
    [lesson?.detail],
  );

  const slideRanges = useMemo(() => {
    const detail = lesson?.detail;
    if (!detail) return [];
    return slides.map((s) => {
      if (s.charStart !== null && s.charEnd !== null)
        return { slideNumber: s.slideNumber, start: s.charStart, end: s.charEnd };
      const idx = detail.indexOf(s.content);
      if (idx !== -1)
        return { slideNumber: s.slideNumber, start: idx, end: idx + s.content.length };
      return null;
    });
  }, [slides, lesson?.detail]);

  useEffect(() => {
    if (existingPres) {
      setTitle(existingPres.title);
      setTemplate(existingPres.template);
      setPresentationId(existingPres.id);
      setSlides(
        existingPres.slides.map((s, i) => ({
          id:          newSlideId(),
          slideNumber: i + 1,
          title:       s.title ?? `Slide ${i + 1}`,
          content:     s.content,
          charStart:   null,
          charEnd:     null,
          fontSize:    "md" as FontSize,
          fontFamily:  "default" as FontFamily,
        })),
      );
    } else if (lesson && !existingPres) {
      setTitle(lesson.title);
      setSlides([]);
      setPresentationId(null);
    }
  }, [lesson, existingPres]);

  // ── Selection helpers ─────────────────────────────────────────────────────
  const enterSelMode = useCallback(() => {
    setSelMode(true); setStartWordIdx(null); setEndWordIdx(null); setHoverWordIdx(null);
  }, []);

  const cancelSel = useCallback(() => {
    setSelMode(false); setStartWordIdx(null); setEndWordIdx(null); setHoverWordIdx(null);
  }, []);

  const handleWordClick = useCallback((idx: number) => {
    if (startWordIdx === null) { setStartWordIdx(idx); }
    else if (endWordIdx === null) {
      setStartWordIdx(Math.min(startWordIdx, idx));
      setEndWordIdx(Math.max(startWordIdx, idx));
    }
  }, [startWordIdx, endWordIdx]);

  const confirmSelection = useCallback(() => {
    if (startWordIdx === null || endWordIdx === null || !lesson?.detail) return;
    const ws      = words[startWordIdx];
    const we      = words[endWordIdx];
    const content = lesson.detail.slice(ws.start, we.end).trim();
    if (!content) { toast.error("Selected text is empty"); return; }
    const num = slides.length + 1;
    setSlides((prev) => [
      ...prev,
      {
        id: newSlideId(), slideNumber: num,
        title: `Slide ${num}`, content,
        charStart: ws.start, charEnd: we.end,
        fontSize: "md", fontFamily: activeFont,  // ← inherit active font
      },
    ]);
    cancelSel();
  }, [startWordIdx, endWordIdx, lesson, words, slides.length, cancelSel, activeFont]);

  // ── Slide mutations ───────────────────────────────────────────────────────
  const removeSlide = useCallback((id: string) => {
    setSlides((prev) =>
      prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, slideNumber: i + 1 })),
    );
  }, []);

  const moveSlide = useCallback((index: number, direction: "up" | "down") => {
    setSlides((prev) => {
      const next = [...prev];
      const tgt  = index + (direction === "up" ? -1 : 1);
      if (tgt < 0 || tgt >= next.length) return prev;
      [next[index], next[tgt]] = [next[tgt], next[index]];
      return next.map((s, i) => ({ ...s, slideNumber: i + 1 }));
    });
  }, []);

  const updateSlide = useCallback(
    (id: string, field: "title" | "content", value: string) => {
      setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    }, [],
  );

  const updateFontSize = useCallback((id: string, fontSize: FontSize) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, fontSize } : s)));
  }, []);

  // Per-slide font change (from modal) — does NOT change activeFont
  const updateFontFamily = useCallback((id: string, fontFamily: FontFamily) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, fontFamily } : s)));
  }, []);

  // Apply to ALL slides explicitly
  const applyFontToAll = useCallback((fontFamily: FontFamily) => {
    setSlides((prev) => prev.map((s) => ({ ...s, fontFamily })));
    setActiveFont(fontFamily);
    const label = FONT_FAMILIES.find((f) => f.value === fontFamily)?.label ?? fontFamily;
    toast.success(`"${label}" applied to all slides`);
  }, []);

  // ── Auto-generate ─────────────────────────────────────────────────────────
  const handleAutoGenerate = async () => {
    if (!lesson) return;
    const genSlides = (result: Array<{ title: string | null | undefined; content: string }>) =>
      result.map((s, i) => ({
        id: newSlideId(), slideNumber: i + 1,
        title: s.title ?? `Slide ${i + 1}`, content: s.content,
        charStart: null, charEnd: null,
        fontSize: "md" as FontSize, fontFamily: activeFont as FontFamily,
      }));

    if (!presentationId) {
      const pres = await createPresentation({ lessonId: lesson.id, title: title || lesson.title, template });
      setPresentationId(pres.id);
      setSlides(genSlides(await autoGenerate(pres.id)));
    } else {
      setSlides(genSlides(await autoGenerate(presentationId)));
    }
    toast.success("Slides generated!");
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (slides.length === 0) { toast.error("Add at least one slide"); return; }
    try {
      let presId = presentationId;
      if (!presId) {
        if (!lesson) return;
        const pres = await createPresentation({ lessonId: lesson.id, title: title || lesson.title, template });
        presId = pres.id;
        setPresentationId(pres.id);
      } else if (existingPres) {
        await updatePresentation({ id: presId, body: { title: title || undefined, template } });
      }
      await saveSlides({
        id:   presId,
        body: { slides: slides.map((s) => ({ slideNumber: s.slideNumber, title: s.title || undefined, content: s.content })) },
      });
      toast.success("Presentation saved!");
      router.push(`/educator/classes/${classId}/presentations/${presId}/view`);
    } catch {
      toast.error("Failed to save presentation");
    }
  };

  if (isLoading || !lesson) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const ts = TEMPLATE_STYLES[template] ?? TEMPLATE_STYLES.green;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Presentation Builder"
        breadcrumbs={[
          { label: "Classes",          href: `/educator/classes` },
          { label: lesson.title,       href: `/educator/classes/${classId}` },
          { label: "New Presentation" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5"
              onClick={() => setShowPreview((v) => !v)} disabled={slides.length === 0}
            >
              <Eye className="h-3.5 w-3.5" />
              {showPreview ? "Close Preview" : "Preview"}
            </Button>
            <Button size="sm" className="gap-1.5"
              onClick={handleSave} disabled={slides.length === 0 || isCreating}
            >
              {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save & View
            </Button>
          </div>
        }
      />

      {/* Title + Template */}
      <Card size="sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-sm font-medium">Presentation Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter presentation title" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Template</label>
            <TemplateSelector value={template} onChange={setTemplate} />
          </div>
        </div>
      </Card>

      {/* ── Font toolbar ─────────────────────────────────────────────────────
          Selecting a font = sets activeFont for NEW slides only.
          "Apply all" button = explicitly applies that font to every existing slide. */}
      <Card size="sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <PaintBucket className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">Default font for new slides</span>
            {slides.length > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                Click a font to set default · "Apply all" to update existing slides
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {FONT_FAMILIES.map((ff) => {
              const isActive = activeFont === ff.value;
              return (
                <div key={ff.value} className="flex items-center gap-0.5">
                  {/* Font selector button */}
                  <button
                    onClick={() => setActiveFont(ff.value)}
                    title={`Set "${ff.label}" as default for new slides`}
                    className={cn(
                      "h-8 px-3 rounded-l-lg border text-xs transition-all",
                      isActive
                        ? "border-[#93C5FD] bg-[#BFDBFE] text-[#0B1E3A] font-semibold"
                        : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/30",
                    )}
                    style={{ fontFamily: ff.stack }}
                  >
                    {isActive && <Check className="h-3 w-3 inline mr-1" />}
                    {ff.label}
                  </button>

                  {/* Apply-to-all button — only show when slides exist */}
                  {slides.length > 0 && (
                    <button
                      onClick={() => applyFontToAll(ff.value)}
                      title={`Apply "${ff.label}" to ALL existing slides`}
                      className={cn(
                        "h-8 px-1.5 rounded-r-lg border-y border-r text-[10px] transition-all",
                        isActive
                          ? "border-[#93C5FD] bg-[#BFDBFE]/50 text-[#0B1E3A] hover:bg-[#BFDBFE]"
                          : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/30",
                      )}
                    >
                      All
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Main builder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <LessonContentPanel
          detail={lesson.detail}
          description={lesson.description}
          words={words}
          slides={slides}
          slideRanges={slideRanges}
          selMode={selMode}
          startWordIdx={startWordIdx}
          endWordIdx={endWordIdx}
          hoverWordIdx={hoverWordIdx}
          onEnterSelMode={enterSelMode}
          onCancelSel={cancelSel}
          onConfirmSel={confirmSelection}
          onWordClick={handleWordClick}
          onWordHover={setHoverWordIdx}
          onAutoGenerate={handleAutoGenerate}
          isAutoGenerating={isAutoGenerating}
          scrollRef={scrollRef}
        />
        <SlideOrganizer
          slides={slides}
          onUpdate={updateSlide}
          onFontSize={updateFontSize}
          onFontFamily={updateFontFamily}
          onMove={moveSlide}
          onDelete={removeSlide}
        />
      </div>

      {showPreview && slides.length > 0 && (
        <PreviewModal
          slides={slides}
          templateImage={ts.image}
          currentSlide={previewSlide}
          onClose={() => setShowPreview(false)}
          onNavigate={setPreviewSlide}
        />
      )}
    </div>
  );
}
