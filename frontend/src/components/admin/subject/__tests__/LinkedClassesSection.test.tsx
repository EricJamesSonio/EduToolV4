import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LinkedClassesSection } from "@/components/admin/subject/LinkedClassesSection";
import { classApi } from "@/api/admin/class.api";
import type { Class } from "@/types/admin/class.types";

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@/api/admin/class.api", () => ({
  classApi: { getAll: jest.fn() },
}));

const mockGetAll = jest.mocked(classApi.getAll);

const cls = (over: Partial<Class> = {}): Class =>
  ({
    id: "class-1",
    orgId: "org-1",
    subjectId: "subj-1",
    subjectName: "Computer Programming 1",
    sectionId: "sec-1",
    sectionName: "A",
    semesterId: "sem-1",
    semesterName: "1st Sem",
    schoolYearId: "sy-1",
    educatorId: "edu-1",
    educatorName: "Dela Cruz",
    capacity: 30,
    enrolledCount: 12,
    status: "active",
    schedules: [],
    createdAt: "2026-01-01",
    ...over,
  }) as Class;

function renderSection(props?: Partial<React.ComponentProps<typeof LinkedClassesSection>>) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <LinkedClassesSection subjectId="subj-1" schoolYearId="sy-1" {...props} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("LinkedClassesSection", () => {
  it("lists the classes linked to the subject", async () => {
    mockGetAll.mockResolvedValue([
      cls(),
      cls({ id: "class-2", title: "BSCS-1B", sectionName: "B" }),
    ]);

    renderSection();

    // Falls back to subjectName when the class has no explicit title.
    expect(await screen.findByText("Computer Programming 1")).toBeDefined();
    expect(await screen.findByText("BSCS-1B")).toBeDefined();
    // Section / educator / semester are shown on the row. Both fixtures share
    // an educator, so match the composed meta line per row instead.
    expect(await screen.findByText("A · Dela Cruz · 1st Sem · —")).toBeDefined();
    expect(await screen.findByText("B · Dela Cruz · 1st Sem · —")).toBeDefined();
  });

  it("scopes the request to the subject AND the school year", async () => {
    mockGetAll.mockResolvedValue([]);

    renderSection();

    await waitFor(() =>
      expect(mockGetAll).toHaveBeenCalledWith({ subjectId: "subj-1", schoolYearId: "sy-1" }),
    );
  });

  it("navigates to the class when its row is clicked", async () => {
    mockGetAll.mockResolvedValue([cls()]);

    renderSection();

    const row = await screen.findByTitle("Open Computer Programming 1");
    fireEvent.click(row);

    expect(push).toHaveBeenCalledWith("/admin/classes/class-1");
  });

  it("is reachable by keyboard", async () => {
    mockGetAll.mockResolvedValue([cls()]);

    renderSection();

    const row = await screen.findByTitle("Open Computer Programming 1");
    fireEvent.keyDown(row, { key: "Enter" });

    expect(push).toHaveBeenCalledWith("/admin/classes/class-1");
  });

  it("shows the enrolled / capacity count", async () => {
    mockGetAll.mockResolvedValue([cls()]);

    renderSection();

    expect(await screen.findByText("12 / 30")).toBeDefined();
  });

  it("marks archived classes", async () => {
    mockGetAll.mockResolvedValue([cls({ isArchived: true })]);

    renderSection();

    expect(await screen.findByText("Archived")).toBeDefined();
  });

  it("renders an empty state when nothing is linked", async () => {
    mockGetAll.mockResolvedValue([]);

    renderSection();

    expect(
      await screen.findByText("No classes linked to this subject yet."),
    ).toBeDefined();
  });

  it("keeps the View All Classes button pointing at the filtered list", async () => {
    mockGetAll.mockResolvedValue([]);

    renderSection();

    // Must wait out the loading skeleton — the header renders after data lands.
    await screen.findByText("No classes linked to this subject yet.");
    fireEvent.click(screen.getByRole("button", { name: /view all classes/i }));
    expect(push).toHaveBeenCalledWith("/admin/classes?subjectId=subj-1");
  });
});