"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Eye, Wand2, Save, ChevronLeft, ChevronRight, Edit3, Crosshair, Check } from "lucide-react";
import { useLesson } from "@/hooks/educator/useLessons";
import { usePresentation, useCreatePresentation, useUpdatePresentation, useAutoGenerateSlides, useGenerateSlides } from "@/hooks/educator/usePresentations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TEMPLATE_STYLES } from "@/lib/presentation-templates";

const TEMPLATES = [
  { id: "green", label: "Green", desc: "Calm natural theme" },
  { id: "blue", label: "Blue", desc: "Cool ocean theme" },
  { id: "pink", label: "Pink", desc: "Warm rose theme" },
];

const SLIDE_COLORS = [
  { bg: "bg-amber-200 dark:bg-amber-900/50 hover:bg-amber-300 dark:hover:bg-amber-800/60", ring: "ring-amber-400" },
  { bg: "bg-rose-200 dark:bg-rose-900/50 hover:bg-rose-300 dark:hover:bg-rose-800/60", ring: "ring-rose-400" },
  { bg: "bg-sky-200 dark:bg-sky-900/50 hover:bg-sky-300 dark:hover:bg-sky-800/60", ring: "ring-sky-400" },
  { bg: "bg-emerald-200 dark:bg-emerald-900/50 hover:bg-emerald-300 dark:hover:bg-emerald-800/60", ring: "ring-emerald-400" },
  { bg: "bg-violet-200 dark:bg-violet-900/50 hover:bg-violet-300 dark:hover:bg-violet-800/60", ring: "ring-violet-400" },
  { bg: "bg-orange-200 dark:bg-orange-900/50 hover:bg-orange-300 dark:hover:bg-orange-800/60", ring: "ring-orange-400" },
  { bg: "bg-teal-200 dark:bg-teal-900/50 hover:bg-teal-300 dark:hover:bg-teal-800/60", ring: "ring-teal-400" },
  { bg: "bg-pink-200 dark:bg-pink-900/50 hover:bg-pink-300 dark:hover:bg-pink-800/60", ring: "ring-pink-400" },
];

interface SlideDraft {
  id: string;
  slideNumber: number;
  title: string;
  content: string;
  charStart: number | null;
  charEnd: number | null;
}

interface WordSeg {
  word: string;
  start: number;
  end: number;
}

let slideIdCounter = 0;
function newSlideId() { return `slide_${++slideIdCounter}`; }

function parseWords(text: string): WordSeg[] {
  const words: WordSeg[] = [];
  const re = /\S+\s*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    words.push({ word: m[0], start: m.index, end: m.index + m[0].length });
  }
  return words;
}

export default function PresentationBuilderPage(): React.JSX.Element {
  const { classId } = useParams<{ classId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lessonId = searchParams.get("lessonId") ?? "";
  const editPresentationId = searchParams.get("presentationId");

  const { data: lesson, isLoading } = useLesson(classId, lessonId);
  const { data: existingPres } = usePresentation(classId, editPresentationId ?? "");
  const { mutateAsync: createPresentation, isPending: isCreating } = useCreatePresentation(classId);
  const { mutateAsync: updatePresentation } = useUpdatePresentation(classId);
  const { mutateAsync: autoGenerate, isPending: isAutoGenerating } = useAutoGenerateSlides(classId);
  const { mutateAsync: saveSlides } = useGenerateSlides(classId);

  const scrollRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState("green");
  const [slides, setSlides] = useState<SlideDraft[]>([]);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [presentationId, setPresentationId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewSlide, setPreviewSlide] = useState(0);

  const [selMode, setSelMode] = useState(false);
  const [startWordIdx, setStartWordIdx] = useState<number | null>(null);
  const [endWordIdx, setEndWordIdx] = useState<number | null>(null);
  const [hoverWordIdx, setHoverWordIdx] = useState<number | null>(null);

  const words = useMemo(() => lesson?.detail ? parseWords(lesson.detail) : [], [lesson?.detail]);

  const slideRanges = useMemo(() => {
    if (!lesson?.detail) return [];
    return slides.map((s) => {
      if (s.charStart !== null && s.charEnd !== null) return { slideNumber: s.slideNumber, start: s.charStart, end: s.charEnd };
      const idx = lesson.detail.indexOf(s.content);
      if (idx !== -1) return { slideNumber: s.slideNumber, start: idx, end: idx + s.content.length };
      return null;
    });
  }, [slides, lesson?.detail]);

  function getSlideIdxForWord(wordIdx: number): number | null {
    const seg = words[wordIdx];
    if (!seg) return null;
    for (let i = 0; i < slideRanges.length; i++) {
      const r = slideRanges[i];
      if (r && seg.start >= r.start && seg.end <= r.end) return i;
    }
    return null;
  }

  useEffect(() => {
    if (existingPres) {
      setTitle(existingPres.title);
      setTemplate(existingPres.template);
      setPresentationId(existingPres.id);
      slideIdCounter = 0;
      setSlides(existingPres.slides.map((s, i) => ({
        id: newSlideId(),
        slideNumber: i + 1,
        title: s.title ?? `Slide ${i + 1}`,
        content: s.content,
        charStart: null,
        charEnd: null,
      })));
    } else if (lesson && !existingPres) {
      setTitle(lesson.title);
      setSlides([]);
      setPresentationId(null);
    }
  }, [lesson, existingPres]);

  const enterSelMode = useCallback(() => {
    setSelMode(true);
    setStartWordIdx(null);
    setEndWordIdx(null);
    setHoverWordIdx(null);
  }, []);

  const cancelSel = useCallback(() => {
    setSelMode(false);
    setStartWordIdx(null);
    setEndWordIdx(null);
    setHoverWordIdx(null);
  }, []);

  const handleWordClick = useCallback((idx: number) => {
    if (startWordIdx === null) {
      setStartWordIdx(idx);
    } else if (endWordIdx === null) {
      const lo = Math.min(startWordIdx, idx);
      const hi = Math.max(startWordIdx, idx);
      setStartWordIdx(lo);
      setEndWordIdx(hi);
    }
  }, [startWordIdx]);

  const confirmSelection = useCallback(() => {
    if (startWordIdx === null || endWordIdx === null || !lesson?.detail) return;
    const ws = words[startWordIdx];
    const we = words[endWordIdx];
    const content = lesson.detail.slice(ws.start, we.end).trim();
    if (!content) { toast.error("Selected text is empty"); return; }
    const num = slides.length + 1;
    setSlides((prev) => [
      ...prev,
      { id: newSlideId(), slideNumber: num, title: `Slide ${num}`, content, charStart: ws.start, charEnd: we.end },
    ]);
    cancelSel();
  }, [startWordIdx, endWordIdx, lesson, words, slides.length, cancelSel]);

  const removeSlide = useCallback((id: string) => {
    setSlides((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return filtered.map((s, i) => ({ ...s, slideNumber: i + 1 }));
    });
  }, []);

  const moveSlide = useCallback((index: number, direction: "up" | "down") => {
    setSlides((prev) => {
      const next = [...prev];
      const tgt = index + (direction === "up" ? -1 : 1);
      if (tgt < 0 || tgt >= next.length) return prev;
      [next[index], next[tgt]] = [next[tgt], next[index]];
      return next.map((s, i) => ({ ...s, slideNumber: i + 1 }));
    });
  }, []);

  const updateSlide = useCallback((id: string, field: "title" | "content", value: string) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }, []);

  const handleAutoGenerate = async () => {
    if (!lesson) return;
    if (!presentationId) {
      const pres = await createPresentation({ lessonId: lesson.id, title: title || lesson.title, template });
      setPresentationId(pres.id);
      const result = await autoGenerate(pres.id);
      setSlides(result.map((s, i) => ({ id: newSlideId(), slideNumber: i + 1, title: s.title ?? `Slide ${i + 1}`, content: s.content, charStart: null, charEnd: null })));
      toast.success("Slides generated!");
    } else {
      const result = await autoGenerate(presentationId);
      setSlides(result.map((s, i) => ({ id: newSlideId(), slideNumber: i + 1, title: s.title ?? `Slide ${i + 1}`, content: s.content, charStart: null, charEnd: null })));
      toast.success("Slides re-generated!");
    }
  };

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
        await updatePresentation({
          id: presId,
          body: { title: title || undefined, template },
        });
      }
      await saveSlides({
        id: presId,
        body: { slides: slides.map((s) => ({ slideNumber: s.slideNumber, title: s.title || undefined, content: s.content })) },
      });
      toast.success("Presentation saved!");
      router.push(`/educator/classes/${classId}/presentations/${presId}/view`);
    } catch {
      toast.error("Failed to save presentation");
    }
  };

  function renderWords() {
    if (!lesson?.detail || words.length === 0) return <span>{lesson?.detail ?? ""}</span>;

    const selLo = startWordIdx !== null && endWordIdx !== null ? Math.min(startWordIdx, endWordIdx) : null;
    const selHi = startWordIdx !== null && endWordIdx !== null ? Math.max(startWordIdx, endWordIdx) : null;
    const previewLo = startWordIdx !== null && endWordIdx === null && hoverWordIdx !== null ? Math.min(startWordIdx, hoverWordIdx) : null;
    const previewHi = startWordIdx !== null && endWordIdx === null && hoverWordIdx !== null ? Math.max(startWordIdx, hoverWordIdx) : null;

    return (
      <span>
        {lesson.description && (
          <div className="text-muted-foreground italic mb-3 pb-3 border-b">{lesson.description}</div>
        )}
        {words.map((seg, idx) => {
          const isHovered = selMode && endWordIdx === null && hoverWordIdx === idx;
          const isStarted = selMode && startWordIdx === idx;
          const isSelected = selLo !== null && selHi !== null && idx >= selLo && idx <= selHi;
          const isPreview = previewLo !== null && previewHi !== null && idx >= previewLo && idx <= previewHi && !isSelected;

          const slideIdx = !selMode ? getSlideIdxForWord(idx) : null;
          const color = slideIdx !== null ? SLIDE_COLORS[slideIdx % SLIDE_COLORS.length] : null;

          return (
            <span
              key={idx}
              data-widx={idx}
              onClick={selMode ? () => handleWordClick(idx) : undefined}
              onMouseEnter={selMode ? () => setHoverWordIdx(idx) : undefined}
              className={cn(
                "inline whitespace-pre-wrap rounded-sm transition-all",
                selMode && "cursor-pointer",
                selMode && isHovered && !isStarted && "bg-muted-foreground/10 ring-1 ring-muted-foreground/20",
                selMode && isStarted && !isSelected && !isPreview && (endWordIdx === null ? "ring-2 ring-yellow-500 bg-yellow-100 dark:bg-yellow-900/30" : "bg-primary/25"),
                selMode && isPreview && "bg-primary/10",
                selMode && isSelected && "bg-primary/25 text-foreground",
                !selMode && color && `${color.bg} ring-1 ${color.ring}`,
              )}
              title={!selMode && slideIdx !== null ? `Slide ${slideIdx + 1}` : undefined}
            >
              {selMode && isStarted && endWordIdx === null && (
                <span className="inline-flex items-center gap-0.5 align-middle text-[9px] font-semibold text-yellow-600 dark:text-yellow-400 mr-0.5">
                  <Crosshair className="h-2.5 w-2.5" />
                </span>
              )}
              {seg.word}
            </span>
          );
        })}
      </span>
    );
  }

  if (isLoading || !lesson) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const hasDetail = !!lesson.detail;
  const hasSelection = startWordIdx !== null && endWordIdx !== null;
  const ts = TEMPLATE_STYLES[template] ?? TEMPLATE_STYLES.green;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Create Presentation</h1>
          <p className="text-sm text-muted-foreground">From: {lesson.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowPreview((v) => !v)} disabled={slides.length === 0}>
            <Eye className="h-3.5 w-3.5" />
            {showPreview ? "Close Preview" : "Preview"}
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={slides.length === 0 || isCreating}>
            {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save & View
          </Button>
        </div>
      </div>

      {/* Title + Template */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-sm font-medium">Presentation Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter presentation title" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Template</label>
          <div className="grid grid-cols-3 gap-2">
            {TEMPLATES.map((t) => {
              const ts = TEMPLATE_STYLES[t.id];
              return (
                <button key={t.id} onClick={() => setTemplate(t.id)} className={cn("relative rounded-lg border-2 overflow-hidden text-left transition-all", template === t.id ? "border-primary ring-1 ring-primary" : "border-border hover:border-muted-foreground/30")}>
                  <div className="h-12 bg-cover bg-center" style={{ backgroundImage: `url(${ts.image})` }} />
                  <div className="p-1.5">
                    <p className="text-[11px] font-medium leading-tight">{t.label}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">{t.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lesson Content */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Lesson Content</h2>
            <div className="flex items-center gap-1">
              {selMode ? (
                <>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={cancelSel}>Cancel</Button>
                  <Button variant="default" size="sm" className="h-7 text-xs gap-1" onClick={confirmSelection} disabled={!hasSelection}>
                    <Check className="h-3 w-3" /> Create Slide {slides.length + 1}
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={enterSelMode} disabled={!hasDetail}>
                  <Crosshair className="h-3 w-3" /> Add Slide {slides.length + 1}
                </Button>
              )}
            </div>
          </div>

          <div
            ref={scrollRef}
            className={cn(
              "rounded-lg border bg-card max-h-[600px] overflow-y-auto p-4 whitespace-pre-wrap text-sm leading-relaxed select-none",
              selMode && "ring-2 ring-primary/40",
            )}
          >
            {hasDetail ? renderWords() : <p className="text-muted-foreground text-center py-8">No lesson content yet.</p>}
          </div>

          {selMode && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
              <Crosshair className="h-3 w-3 shrink-0" />
              {startWordIdx === null && "Click any word to mark it as the start of the slide."}
              {startWordIdx !== null && endWordIdx === null && "Now click another word to mark the end."}
              {startWordIdx !== null && endWordIdx !== null && "Selection complete — click Create Slide to confirm."}
            </div>
          )}

          {/* Slide color legend */}
          {slides.length > 0 && !selMode && (
            <div className="flex flex-wrap gap-2">
              {slides.map((s, i) => {
                const c = SLIDE_COLORS[i % SLIDE_COLORS.length];
                return (
                  <span key={s.id} className={cn("inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium", c.bg)}>
                    <span className="w-1.5 h-1.5 rounded-full" />
                    Slide {i + 1}
                  </span>
                );
              })}
            </div>
          )}

          <Button variant="secondary" size="sm" className="gap-1.5 w-full" onClick={handleAutoGenerate} disabled={isAutoGenerating}>
            {isAutoGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            Auto-Generate Slides
          </Button>
        </div>

        {/* Slide Organizer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Slides ({slides.length})</h2>
          </div>
          <div className="rounded-lg border bg-card divide-y divide-border max-h-[600px] overflow-y-auto">
            {slides.length === 0 ? (
              <div className="px-4 py-12 text-sm text-muted-foreground text-center">
                <p>No slides yet.</p>
                <p className="text-xs mt-1">Click <strong>Add Slide 1</strong> above, then click a word to start and another to end.</p>
              </div>
            ) : (
              slides.map((slide, i) => (
                <div key={slide.id} className="px-3 py-2 group hover:bg-muted/40 transition-colors">
                  <div className="flex items-start gap-2">
                    <div className={cn("flex flex-col items-center gap-0.5 pt-1 px-1 rounded", SLIDE_COLORS[i % SLIDE_COLORS.length].bg)}>
                      <button onClick={() => moveSlide(i, "up")} disabled={i === 0} className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20">
                        <ChevronLeft className="h-3 w-3 rotate-90" />
                      </button>
                      <span className="text-[10px] font-mono font-bold">{slide.slideNumber}</span>
                      <button onClick={() => moveSlide(i, "down")} disabled={i === slides.length - 1} className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20">
                        <ChevronRight className="h-3 w-3 rotate-90" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      {editingSlideId === slide.id ? (
                        <>
                          <Input value={slide.title} onChange={(e) => updateSlide(slide.id, "title", e.target.value)} className="h-7 text-xs" placeholder="Slide title" />
                          <Textarea value={slide.content} onChange={(e) => updateSlide(slide.id, "content", e.target.value)} className="min-h-[60px] text-xs" placeholder="Slide content" />
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditingSlideId(null)}>Done</Button>
                            <Button size="sm" variant="ghost" className="h-6 text-xs text-destructive" onClick={() => { removeSlide(slide.id); setEditingSlideId(null); }}>Delete</Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-medium truncate">{slide.title}</p>
                            <button onClick={() => setEditingSlideId(slide.id)} className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all">
                              <Edit3 className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">{slide.content || "(empty)"}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && slides.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div
            className="relative w-full max-w-4xl mx-4 rounded-xl shadow-2xl overflow-hidden bg-cover bg-center"
            style={{ aspectRatio: "16/9", backgroundImage: `url(${ts.image})` }}
          >
            <div className="absolute top-0 inset-x-0 h-10 bg-zinc-900/60 flex items-center justify-between px-4 z-10">
              <span className="text-xs text-white/80">Slide {previewSlide + 1} / {slides.length}</span>
              <button onClick={() => setShowPreview(false)} className="text-white/80 hover:text-white text-xs">&times;</button>
            </div>
            <div className="relative z-[5] h-full flex flex-col items-center justify-center p-8 md:p-16 text-center text-white drop-shadow-lg">
              {(() => {
                const s = slides[previewSlide];
                if (!s) return null;
                const hideTitle = /^Slide \d+$/i.test(s.title);
                return (
                  <>
                    {!hideTitle && (
                      <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">{s.title}</h2>
                    )}
                    <p className="text-base md:text-xl whitespace-pre-wrap max-w-3xl leading-relaxed">
                      {s.content}
                    </p>
                  </>
                );
              })()}
            </div>
            <div className="absolute bottom-0 inset-x-0 h-12 bg-zinc-900/60 flex items-center justify-between px-4 z-10">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white" onClick={() => setPreviewSlide((p) => Math.max(0, p - 1))} disabled={previewSlide === 0}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <div className="flex gap-1">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setPreviewSlide(i)} className={cn("h-1.5 rounded-full transition-all", i === previewSlide ? "w-6 bg-white" : "w-1.5 bg-white/40")} />
                ))}
              </div>
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white" onClick={() => setPreviewSlide((p) => Math.min(slides.length - 1, p + 1))} disabled={previewSlide === slides.length - 1}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
