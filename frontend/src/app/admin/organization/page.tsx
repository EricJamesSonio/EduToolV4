"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { organizationApi } from "@/api/admin/organization.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SchoolYear } from "@/types/admin/school-year.types";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Loader2,
  Database,
  BookOpen,
  Layers,
  GraduationCap,
  CalendarDays,
  Plus,
} from "lucide-react";

const PROGRAMS = [
  { key: "daycare",    label: "Daycare / Pre-School" },
  { key: "kinder",     label: "Kindergarten" },
  { key: "elementary", label: "Elementary School" },
  { key: "jhs",        label: "Junior High School" },
  { key: "shs",        label: "Senior High School" },
  { key: "college",    label: "College / University" },
]

const COLLEGE_COURSES = [
  { code: "BSIT",      name: "BS Information Technology" },
  { code: "BSBA",      name: "BS Business Administration" },
  { code: "BSED",      name: "Bachelor of Secondary Education" },
  { code: "BSA",       name: "BS Accountancy" },
  { code: "BSCS",      name: "BS Computer Science" },
  { code: "BSHM",      name: "BS Hospitality Management" },
  { code: "BSCRIM",    name: "BS Criminology" },
  { code: "BSTM",      name: "BS Tourism Management" },
  { code: "BSED-ENG",  name: "BSED – English Major" },
  { code: "BSED-MATH", name: "BSED – Mathematics Major" },
  { code: "BSED-SCI",  name: "BSED – Science Major" },
  { code: "BSED-SS",   name: "BSED – Social Studies Major" },
  { code: "BSED-FIL",  name: "BSED – Filipino Major" },
  { code: "BSED-TLE",  name: "BSED – TLE Major" },
]

const SHS_STRANDS = [
  "ABM", "STEM", "HUMSS", "GAS", "ICT", "HE", "IA",
  "Agri-Fishery", "Sports", "Arts and Design",
]

const LEVEL_DEFS: Record<string, string[]> = {
  daycare:    ["Daycare 1", "Daycare 2"],
  kinder:     ["Kinder 1", "Kinder 2"],
  elementary: ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6"],
  jhs:        ["Grade 7","Grade 8","Grade 9","Grade 10"],
}

const LEVEL_SUBJECTS: Record<string, string[]> = {
  "Daycare 1":  ["Language and Literacy","Cognitive and Numeracy Skills","Physical Development, Health, and Safety","Social and Emotional Development","Creative Arts and Music","Understanding the World / Discovery"],
  "Daycare 2":  ["Language and Literacy","Cognitive and Numeracy Skills","Physical Development, Health, and Safety","Social and Emotional Development","Creative Arts and Music","Understanding the World / Discovery"],
  "Kinder 1":   ["Language, Literacy, and Communication","Mathematical Thinking","Physical Development, Health, and Safety","Social and Emotional Development / Values Formation","Creative Arts","Understanding the World / Discovery"],
  "Kinder 2":   ["Language, Literacy, and Communication","Mathematical Thinking","Physical Development, Health, and Safety","Social and Emotional Development / Values Formation","Creative Arts","Understanding the World / Discovery"],
  "Grade 1":    ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)"],
  "Grade 2":    ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)"],
  "Grade 3":    ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)"],
  "Grade 4":    ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)"],
  "Grade 5":    ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)"],
  "Grade 6":    ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)"],
  "Grade 7":    ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)","TLE"],
  "Grade 8":    ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)","TLE"],
  "Grade 9":    ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)","TLE"],
  "Grade 10":   ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)","TLE"],
}

const SHS_STRAND_SUBJECTS: Record<string, string[]> = {
  ABM:   ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","Fundamentals of Accounting","Business Math","Fundamentals of Economics","Principles of Management","Entrepreneurship","Organization and Management","Business Finance","Business Ethics","Applied Economics","Strategic Business Planning"],
  STEM:  ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","General Biology","General Chemistry","General Physics","Earth and Life Science","Calculus and Analytical Geometry","Advanced Physics","Organic Chemistry","Research in Science","Engineering and Technology Applications","Applied Mathematics"],
  HUMSS: ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","Introduction to Philosophy","Understanding Culture and Society","Creative Writing","Philippine Politics and Governance","Psychology","Social Research and Statistics","World History and Globalization","Philosophy of Human Person","Economics for Social Sciences","Applied Social Sciences / Ethics in Society"],
  GAS:   ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","Introduction to Humanities","Introduction to Social Sciences","Fundamentals of Business and Management","Basic Principles of Science and Technology","Creative Writing","Introduction to Philosophy","Research Methods / Applied Research","Economics / Business Economics","Social Issues and Ethics","Interdisciplinary Elective"],
  ICT:   ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","Computer Programming 1","Introduction to Computing","Web Development 1 (HTML, CSS)","Computer Programming 2","Web Development 2 (JavaScript)","Database Management Systems","Systems Analysis and Design","Mobile Application Development","Computer Networks and Security","Capstone Project","ICT Project Management","Emerging Technologies in ICT"],
  HE:    ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","Introduction to Home Economics","Cookery / Culinary Basics","Bread and Pastry Production","Food and Beverage Services","Housekeeping","Caregiving (Basic)","Dressmaking / Tailoring","Advanced Cookery / International Cuisine","Events Management Services","Entrepreneurship in Home Economics","Work Immersion (OJT)","Capstone Project / Practical Assessment"],
  IA:    ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","Introduction to Industrial Arts","Basic Electrical Installation and Maintenance","Carpentry Fundamentals","Shielded Metal Arc Welding (SMAW) NC I","Plumbing Basics","Automotive Servicing NC I","Electrical Installation and Maintenance NC II","Shielded Metal Arc Welding (SMAW) NC II","Advanced Carpentry / Construction Technology","Industrial Safety and Maintenance","Work Immersion (OJT)","Capstone Project / Practical Assessment"],
  "Agri-Fishery": ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","Introduction to Agri-Fishery Arts","Crop Production (Basic)","Animal Production (Basic)","Aquaculture (Basic)","Horticulture","Agricultural Machinery and Tools","Crop Production NC II","Animal Production NC II","Aquaculture NC II","Farm Management","Work Immersion (OJT)","Capstone Project / Practical Assessment"],
  Sports: ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","Introduction to Sports Science","Physical Fitness and Conditioning","Fundamentals of Coaching","Sports Officiating and Rules","Sports Psychology","Safety and First Aid in Sports","Advanced Coaching and Training Techniques","Sports Event Management","Anatomy and Physiology for Athletes","Sports Analytics and Performance Analysis","Work Immersion (OJT)","Capstone Project / Practical Assessment"],
  "Arts and Design": ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","Introduction to Arts and Design","Elements and Principles of Design","Creative Industries I (Applied Arts)","Creative Industries II (Media Arts)","Fundamentals of Performing Arts","Visual Arts Production","Specialization in Arts","Portfolio Development","Arts Production and Management","Contemporary Arts Practices","Work Immersion (OJT)","Capstone Project / Culminating Exhibit"],
}

const COURSE_SUBJECTS: Record<string, string[]> = {
  BSIT:        ["Introduction to Computing","Computer Programming 1","Computer Programming 2","Data Structures and Algorithms","Database Management Systems","Web Systems and Technologies","Software Engineering","Human-Computer Interaction","Operating Systems","Computer Networks","Information Assurance and Security","Systems Analysis and Design","IT Project Management","Capstone Project / Thesis"],
  BSBA:        ["Principles of Management","Microeconomics","Macroeconomics","Business Statistics","Principles of Marketing","Financial Management","Business Law","Human Resource Management","Operations Management","Business Ethics","Organizational Behavior","Strategic Management","International Business","Entrepreneurial Management","Business Research","Project Management"],
  BSA:         ["Fundamentals of Accounting","Financial Accounting and Reporting I","Business Law","Management Accounting","Regulatory Framework and Legal Issues in Business","Cost Accounting","Accounting Information Systems","Auditing Theory","Advanced Financial Accounting and Reporting","Financial Management","Auditing and Assurance Services","Taxation (Income Tax, Business Tax)","Strategic Cost Management","Governance, Business Ethics, Risk Management, and Internal Control","Accounting Research","Integrated Review Courses (Board Exam Preparation)"],
  BSCS:        ["Introduction to Computing","Computer Programming 1","Computer Programming 2","Discrete Mathematics","Object-Oriented Programming","Computer Architecture","Data Structures and Algorithms","Database Systems","Algorithms and Complexity","Automata Theory","Operating Systems","Numerical Methods","Programming Languages","Software Engineering","Computer Networks","Human-Computer Interaction","Artificial Intelligence","Machine Learning","CS Thesis / Capstone Project"],
  BSHM:        ["Introduction to Hospitality Industry","Food and Beverage Service Operations","Housekeeping Operations","Front Office Operations","Culinary Arts / Basic Cooking","Hospitality Marketing","Hospitality Financial Management","Food Safety and Sanitation","Hospitality Law","Customer Service Management","Tourism Planning and Development","Hotel and Restaurant Management","Beverage Management (Bar and Drinks)","Event Management","Banquet and Catering Management","Entrepreneurship in Hospitality","Internship / OJT"],
  BSCRIM:      ["Introduction to Criminology","Criminal Law","Criminological Theories","Law Enforcement Administration","Ethics and Moral Values in Law Enforcement","Criminalistics / Forensic Science","Crime Detection and Investigation","Juvenile Delinquency","Police Administration","Criminal Psychology","Correctional Administration","Disaster and Risk Management","Research in Criminology","Criminal Investigation Practicum","Community Policing and Public Safety"],
  BSTM:        ["Principles of Tourism","Tourism Research and Statistics","Tourism Planning and Development","Travel Agency Operations","Tour Guiding and Tour Operations","Hospitality and Tourism Law","Tourism Marketing and Promotion","Event and Convention Management","Sustainable Tourism","Cultural and Heritage Tourism","Tourism Policy and Governance","Airline and Cruise Management","Tourism Entrepreneurship","Internship / OJT"],
  BSED:        ["The Teaching Profession","Foundations of Education","Child and Adolescent Development","Principles of Teaching","Facilitating Learner-Centered Teaching","Educational Technology","Assessment of Learning 1","Assessment of Learning 2","Curriculum Development","Field Study (Practice Teaching Preparation)","Practice Teaching / Internship"],
  "BSED-ENG":  ["The Teaching Profession","Foundations of Education","Child and Adolescent Development","Principles of Teaching","Facilitating Learner-Centered Teaching","Educational Technology","Assessment of Learning 1","Assessment of Learning 2","Curriculum Development","Field Study (Practice Teaching Preparation)","Practice Teaching / Internship"],
  "BSED-MATH": ["The Teaching Profession","Foundations of Education","Child and Adolescent Development","Principles of Teaching","Facilitating Learner-Centered Teaching","Educational Technology","Assessment of Learning 1","Assessment of Learning 2","Curriculum Development","Field Study (Practice Teaching Preparation)","Practice Teaching / Internship"],
  "BSED-SCI":  ["The Teaching Profession","Foundations of Education","Child and Adolescent Development","Principles of Teaching","Facilitating Learner-Centered Teaching","Educational Technology","Assessment of Learning 1","Assessment of Learning 2","Curriculum Development","Field Study (Practice Teaching Preparation)","Practice Teaching / Internship"],
  "BSED-SS":   ["The Teaching Profession","Foundations of Education","Child and Adolescent Development","Principles of Teaching","Facilitating Learner-Centered Teaching","Educational Technology","Assessment of Learning 1","Assessment of Learning 2","Curriculum Development","Field Study (Practice Teaching Preparation)","Practice Teaching / Internship"],
  "BSED-FIL":  ["The Teaching Profession","Foundations of Education","Child and Adolescent Development","Principles of Teaching","Facilitating Learner-Centered Teaching","Educational Technology","Assessment of Learning 1","Assessment of Learning 2","Curriculum Development","Field Study (Practice Teaching Preparation)","Practice Teaching / Internship"],
  "BSED-TLE":  ["The Teaching Profession","Foundations of Education","Child and Adolescent Development","Principles of Teaching","Facilitating Learner-Centered Teaching","Educational Technology","Assessment of Learning 1","Assessment of Learning 2","Curriculum Development","Field Study (Practice Teaching Preparation)","Practice Teaching / Internship"],
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Checkbox({
  checked,
  onChange,
  label,
  subtle,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  subtle?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-left group"
    >
      <div className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-muted-foreground/40 group-hover:border-primary/60"
      )}>
        {checked && <Check className="h-3 w-3" />}
      </div>
      <span className={cn("text-sm", subtle ? "text-muted-foreground" : "font-medium")}>
        {label}
      </span>
    </button>
  )
}

function Collapsible({
  title,
  count,
  total,
  children,
  defaultOpen = false,
}: {
  title: string
  count: number
  total: number
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-medium">{title}</span>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {count}/{total} selected
          </Badge>
          {open
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          }
        </div>
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  )
}

// ─── School Year Step ─────────────────────────────────────────────────────────

function SchoolYearStep({
  schoolYears,
  isLoading,
  selectedId,
  onSelect,
  onCreate,
  isCreating,
}: {
  schoolYears: SchoolYear[]
  isLoading:   boolean
  selectedId:  string | null
  onSelect:    (id: string) => void
  onCreate:    (name: string) => void
  isCreating:  boolean
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName]       = useState("")

  function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed) return
    onCreate(trimmed)
    setNewName("")
    setShowCreate(false)
  }

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          {/* Existing school years */}
          {schoolYears.length > 0 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {schoolYears.map((sy) => (
                <button
                  key={sy.id}
                  type="button"
                  onClick={() => onSelect(sy.id)}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50",
                    selectedId === sy.id && "border-primary bg-primary/5"
                  )}
                >
                  <span className="font-medium">{sy.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        sy.status === "active"
                          ? "default"
                          : sy.status === "ended"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs capitalize"
                    >
                      {sy.status}
                    </Badge>
                    {selectedId === sy.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No school years yet */}
          {schoolYears.length === 0 && !showCreate && (
            <p className="text-sm text-muted-foreground">
              No school years found. Create one below to proceed.
            </p>
          )}

          {/* Create inline */}
          {showCreate ? (
            <div className="flex gap-2">
              <Input
                autoFocus
                placeholder="e.g. S.Y. 2025–2026"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCreate}
                disabled={isCreating || !newName.trim()}
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => { setShowCreate(false); setNewName("") }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Create new school year
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ─── Page form type ───────────────────────────────────────────────────────────

interface OrgForm {
  name:        string
  description: string
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrganizationPage(): React.JSX.Element {
  const queryClient = useQueryClient()

  // ── Org details ──
  const { data: org, isLoading } = useQuery({
    queryKey: ["admin", "organization"],
    queryFn:  organizationApi.getOrg,
  })

  const { register, handleSubmit, reset, formState: { errors, isDirty } } =
    useForm<OrgForm>({ defaultValues: { name: "", description: "" } })

  useEffect(() => {
    if (org) reset({ name: org.name, description: org.description ?? "" })
  }, [org, reset])

  const updateMutation = useMutation({
    mutationFn: (values: OrgForm) =>
      organizationApi.updateOrg({
        name:        values.name,
        description: values.description || undefined,
      }),
    onSuccess: (updated) => {
      toast.success("Organization updated.")
      queryClient.invalidateQueries({ queryKey: ["admin", "organization"] })
      reset({ name: updated.name, description: updated.description ?? "" })
    },
    onError: () => toast.error("Failed to update organization."),
  })

  // ── School years ──
  const { data: schoolYears = [], isLoading: syLoading } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn:  schoolYearApi.getAll,
  })

  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null)

  // Auto-select active school year when data loads
  useEffect(() => {
    if (schoolYears.length > 0 && !selectedSchoolYearId) {
      const active = schoolYears.find((sy) => sy.status === "active")
      if (active) setSelectedSchoolYearId(active.id)
    }
  }, [schoolYears, selectedSchoolYearId])

  const createSchoolYearMutation = useMutation({
    mutationFn: (name: string) => schoolYearApi.create({ name }),
    onSuccess: (created) => {
      toast.success(`School year "${created.name}" created.`)
      queryClient.invalidateQueries({ queryKey: ["admin", "school-years"] })
      setSelectedSchoolYearId(created.id)
    },
    onError: () => toast.error("Failed to create school year."),
  })

  // ── Seeder state ──
  const [selectedPrograms,  setSelectedPrograms]  = useState<Set<string>>(new Set())
  const [selectedCourses,   setSelectedCourses]   = useState<Set<string>>(new Set(COLLEGE_COURSES.map((c) => c.code)))
  const [selectedStrands,   setSelectedStrands]   = useState<Set<string>>(new Set(SHS_STRANDS))
  const [selectedLevels,    setSelectedLevels]    = useState<Set<string>>(() => {
    const all = new Set<string>()
    Object.values(LEVEL_DEFS).flat().forEach((l) => all.add(l))
    return all
  })
  const [selectedSubjects,  setSelectedSubjects]  = useState<Set<string>>(() => {
    const all = new Set<string>()
    Object.values(LEVEL_SUBJECTS).flat().forEach((s) => all.add(s))
    Object.values(SHS_STRAND_SUBJECTS).flat().forEach((s) => all.add(s))
    Object.values(COURSE_SUBJECTS).flat().forEach((s) => all.add(s))
    return all
  })

  const seedMutation = useMutation({
    mutationFn: organizationApi.seedOrg,
    onSuccess:  () => toast.success("Seed completed! Your programs, levels, and subjects are ready."),
    onError:    () => toast.error("Seed failed. Please try again."),
  })

  function toggleSet(set: Set<string>, key: string, setter: (s: Set<string>) => void) {
    const next = new Set(set)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setter(next)
  }

  function selectAll(keys: string[], setter: (s: Set<string>) => void) {
    setter(new Set(keys))
  }

  function deselectAll(setter: (s: Set<string>) => void) {
    setter(new Set())
  }

  const allSelectableSubjects = useMemo(() => {
    const out = new Set<string>()
    selectedPrograms.forEach((prog) => {
      if (LEVEL_DEFS[prog]) {
        LEVEL_DEFS[prog].forEach((lvl) => {
          if (selectedLevels.has(lvl)) {
            LEVEL_SUBJECTS[lvl]?.forEach((s) => out.add(s))
          }
        })
      }
      if (prog === "shs") {
        selectedStrands.forEach((strand) => {
          SHS_STRAND_SUBJECTS[strand]?.forEach((s) => out.add(s))
        })
      }
      if (prog === "college") {
        selectedCourses.forEach((code) => {
          COURSE_SUBJECTS[code]?.forEach((s) => out.add(s))
        })
      }
    })
    return Array.from(out)
  }, [selectedPrograms, selectedLevels, selectedStrands, selectedCourses])

  function handleSeed() {
    if (!selectedSchoolYearId) {
      toast.error("Select or create a school year first.")
      return
    }
    if (selectedPrograms.size === 0) {
      toast.error("Select at least one program.")
      return
    }

    const allLevels = Object.entries(LEVEL_DEFS)
      .filter(([prog]) => selectedPrograms.has(prog))
      .flatMap(([, levels]) => levels)

    const excludedLevels   = allLevels.filter((l) => !selectedLevels.has(l))
    const excludedSubjects = allSelectableSubjects.filter((s) => !selectedSubjects.has(s))

    seedMutation.mutate({
      schoolYearId:     selectedSchoolYearId,
      programs:         Array.from(selectedPrograms),
      courses:          selectedPrograms.has("college") ? Array.from(selectedCourses)  : undefined,
      strands:          selectedPrograms.has("shs")     ? Array.from(selectedStrands)  : undefined,
      excludedLevels:   excludedLevels.length   > 0     ? excludedLevels               : undefined,
      excludedSubjects: excludedSubjects.length > 0     ? excludedSubjects             : undefined,
    })
  }

  const onSubmit = (values: OrgForm) => updateMutation.mutate(values)

  // ── Render ──
  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader title="Organization" />

      {/* ── Org details card ── */}
      <div className="rounded-lg border bg-card p-6 space-y-5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Details
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                placeholder="e.g. St. Mary's Academy"
                {...register("name", {
                  required:  "Name is required",
                  minLength: { value: 2,   message: "At least 2 characters" },
                  maxLength: { value: 100, message: "Max 100 characters" },
                })}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="org-desc">
                Description{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="org-desc"
                placeholder="A brief description of your school..."
                rows={4}
                {...register("description", {
                  maxLength: { value: 500, message: "Max 500 characters" },
                })}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            {isDirty && (
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSubmit(onSubmit)}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Seeder card ── */}
      <div className="rounded-lg border bg-card p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Seeder
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Seed your organization with programs, levels, sections, subjects, and grading schemes.
            Safe to run multiple times — only adds missing data.
          </p>
        </div>

        {/* Step 0 — School Year */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            School Year
            <span className="text-destructive ml-0.5">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">
            All seeded data will be scoped to the selected school year.
          </p>
          <SchoolYearStep
            schoolYears={schoolYears}
            isLoading={syLoading}
            selectedId={selectedSchoolYearId}
            onSelect={setSelectedSchoolYearId}
            onCreate={(name) => createSchoolYearMutation.mutate(name)}
            isCreating={createSchoolYearMutation.isPending}
          />
          {!selectedSchoolYearId && !syLoading && (
            <p className="text-xs text-destructive">
              A school year is required before seeding.
            </p>
          )}
        </div>

        <div className={cn(
          "space-y-5 transition-opacity",
          !selectedSchoolYearId ? "opacity-40 pointer-events-none select-none" : ""
        )}>

          {/* Step 1 — Programs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                Programs
              </Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => selectAll(PROGRAMS.map((p) => p.key), setSelectedPrograms)}
                >All</button>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:underline"
                  onClick={() => deselectAll(setSelectedPrograms)}
                >None</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PROGRAMS.map((prog) => (
                <button
                  key={prog.key}
                  type="button"
                  onClick={() => toggleSet(selectedPrograms, prog.key, setSelectedPrograms)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 text-sm",
                    selectedPrograms.has(prog.key) && "border-primary bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    selectedPrograms.has(prog.key)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40"
                  )}>
                    {selectedPrograms.has(prog.key) && <Check className="h-3 w-3" />}
                  </div>
                  {prog.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 — Levels */}
          {Array.from(selectedPrograms).some((p) => LEVEL_DEFS[p]) && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Levels
              </Label>
              <div className="space-y-2">
                {Array.from(selectedPrograms)
                  .filter((p) => LEVEL_DEFS[p])
                  .map((prog) => {
                    const levels   = LEVEL_DEFS[prog]
                    const selected = levels.filter((l) => selectedLevels.has(l))
                    return (
                      <Collapsible
                        key={prog}
                        title={PROGRAMS.find((p) => p.key === prog)?.label ?? prog}
                        count={selected.length}
                        total={levels.length}
                        defaultOpen
                      >
                        <div className="space-y-2">
                          <div className="flex gap-3 mb-2">
                            <button type="button" className="text-xs text-primary hover:underline"
                              onClick={() => selectAll([...Array.from(selectedLevels), ...levels], setSelectedLevels)}>All</button>
                            <button type="button" className="text-xs text-muted-foreground hover:underline"
                              onClick={() => {
                                const next = new Set(selectedLevels)
                                levels.forEach((l) => next.delete(l))
                                setSelectedLevels(next)
                              }}>None</button>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                            {levels.map((lvl) => (
                              <Checkbox
                                key={lvl}
                                checked={selectedLevels.has(lvl)}
                                onChange={() => toggleSet(selectedLevels, lvl, setSelectedLevels)}
                                label={lvl}
                              />
                            ))}
                          </div>
                        </div>
                      </Collapsible>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Step 3 — SHS Strands */}
          {selectedPrograms.has("shs") && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                SHS Strands
              </Label>
              <Collapsible
                title="Senior High School Strands"
                count={SHS_STRANDS.filter((s) => selectedStrands.has(s)).length}
                total={SHS_STRANDS.length}
                defaultOpen
              >
                <div className="space-y-2">
                  <div className="flex gap-3 mb-2">
                    <button type="button" className="text-xs text-primary hover:underline"
                      onClick={() => selectAll(SHS_STRANDS, setSelectedStrands)}>All</button>
                    <button type="button" className="text-xs text-muted-foreground hover:underline"
                      onClick={() => deselectAll(setSelectedStrands)}>None</button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {SHS_STRANDS.map((strand) => (
                      <Checkbox
                        key={strand}
                        checked={selectedStrands.has(strand)}
                        onChange={() => toggleSet(selectedStrands, strand, setSelectedStrands)}
                        label={strand}
                      />
                    ))}
                  </div>
                </div>
              </Collapsible>
            </div>
          )}

          {/* Step 4 — College Courses */}
          {selectedPrograms.has("college") && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                College Courses
              </Label>
              <Collapsible
                title="Courses"
                count={COLLEGE_COURSES.filter((c) => selectedCourses.has(c.code)).length}
                total={COLLEGE_COURSES.length}
                defaultOpen
              >
                <div className="space-y-2">
                  <div className="flex gap-3 mb-2">
                    <button type="button" className="text-xs text-primary hover:underline"
                      onClick={() => selectAll(COLLEGE_COURSES.map((c) => c.code), setSelectedCourses)}>All</button>
                    <button type="button" className="text-xs text-muted-foreground hover:underline"
                      onClick={() => deselectAll(setSelectedCourses)}>None</button>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {COLLEGE_COURSES.map((course) => (
                      <Checkbox
                        key={course.code}
                        checked={selectedCourses.has(course.code)}
                        onChange={() => toggleSet(selectedCourses, course.code, setSelectedCourses)}
                        label={`${course.code} – ${course.name}`}
                      />
                    ))}
                  </div>
                </div>
              </Collapsible>
            </div>
          )}

          {/* Step 5 — Subjects */}
          {allSelectableSubjects.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Subjects
              </Label>

              {Array.from(selectedPrograms)
                .filter((p) => LEVEL_DEFS[p])
                .map((prog) =>
                  LEVEL_DEFS[prog]
                    .filter((lvl) => selectedLevels.has(lvl))
                    .map((lvl) => {
                      const subjects = LEVEL_SUBJECTS[lvl] ?? []
                      const selCount = subjects.filter((s) => selectedSubjects.has(s)).length
                      return (
                        <Collapsible key={lvl} title={lvl} count={selCount} total={subjects.length}>
                          <div className="space-y-2">
                            <div className="flex gap-3 mb-2">
                              <button type="button" className="text-xs text-primary hover:underline"
                                onClick={() => { const n = new Set(selectedSubjects); subjects.forEach((s) => n.add(s)); setSelectedSubjects(n) }}>All</button>
                              <button type="button" className="text-xs text-muted-foreground hover:underline"
                                onClick={() => { const n = new Set(selectedSubjects); subjects.forEach((s) => n.delete(s)); setSelectedSubjects(n) }}>None</button>
                            </div>
                            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                              {subjects.map((subj) => (
                                <Checkbox key={subj} checked={selectedSubjects.has(subj)}
                                  onChange={() => toggleSet(selectedSubjects, subj, setSelectedSubjects)}
                                  label={subj} subtle />
                              ))}
                            </div>
                          </div>
                        </Collapsible>
                      )
                    })
                )}

              {selectedPrograms.has("shs") &&
                Array.from(selectedStrands).map((strand) => {
                  const subjects = SHS_STRAND_SUBJECTS[strand] ?? []
                  const selCount = subjects.filter((s) => selectedSubjects.has(s)).length
                  return (
                    <Collapsible key={strand} title={`SHS – ${strand}`} count={selCount} total={subjects.length}>
                      <div className="space-y-2">
                        <div className="flex gap-3 mb-2">
                          <button type="button" className="text-xs text-primary hover:underline"
                            onClick={() => { const n = new Set(selectedSubjects); subjects.forEach((s) => n.add(s)); setSelectedSubjects(n) }}>All</button>
                          <button type="button" className="text-xs text-muted-foreground hover:underline"
                            onClick={() => { const n = new Set(selectedSubjects); subjects.forEach((s) => n.delete(s)); setSelectedSubjects(n) }}>None</button>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                          {subjects.map((subj) => (
                            <Checkbox key={subj} checked={selectedSubjects.has(subj)}
                              onChange={() => toggleSet(selectedSubjects, subj, setSelectedSubjects)}
                              label={subj} subtle />
                          ))}
                        </div>
                      </div>
                    </Collapsible>
                  )
                })}

              {selectedPrograms.has("college") &&
                Array.from(selectedCourses).map((code) => {
                  const subjects = COURSE_SUBJECTS[code] ?? []
                  const selCount = subjects.filter((s) => selectedSubjects.has(s)).length
                  return (
                    <Collapsible key={code} title={`${code} Subjects`} count={selCount} total={subjects.length}>
                      <div className="space-y-2">
                        <div className="flex gap-3 mb-2">
                          <button type="button" className="text-xs text-primary hover:underline"
                            onClick={() => { const n = new Set(selectedSubjects); subjects.forEach((s) => n.add(s)); setSelectedSubjects(n) }}>All</button>
                          <button type="button" className="text-xs text-muted-foreground hover:underline"
                            onClick={() => { const n = new Set(selectedSubjects); subjects.forEach((s) => n.delete(s)); setSelectedSubjects(n) }}>None</button>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                          {subjects.map((subj) => (
                            <Checkbox key={subj} checked={selectedSubjects.has(subj)}
                              onChange={() => toggleSet(selectedSubjects, subj, setSelectedSubjects)}
                              label={subj} subtle />
                          ))}
                        </div>
                      </div>
                    </Collapsible>
                  )
                })}
            </div>
          )}

        </div>{/* end dimmed wrapper */}

        {/* Apply button */}
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            {!selectedSchoolYearId
              ? "Select a school year to begin."
              : selectedPrograms.size === 0
              ? "Select at least one program."
              : `${selectedPrograms.size} program(s) · ${
                  selectedPrograms.has("college")
                    ? Array.from(selectedCourses).length + " course(s) · "
                    : ""
                }${
                  selectedPrograms.has("shs")
                    ? Array.from(selectedStrands).length + " strand(s) · "
                    : ""
                }${allSelectableSubjects.filter((s) => selectedSubjects.has(s)).length} subject(s) selected`
            }
          </p>
          <Button
            onClick={handleSeed}
            disabled={
              seedMutation.isPending ||
              !selectedSchoolYearId ||
              selectedPrograms.size === 0
            }
          >
            {seedMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Seeding...</>
            ) : (
              <><Database className="mr-2 h-4 w-4" /> Apply Seed</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}