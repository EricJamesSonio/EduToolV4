import { render, screen, fireEvent } from "@testing-library/react";
import SubjectHierarchyPage from "@/app/admin/subjects/hierarchy/page";
import { useHierarchyPrograms } from "@/hooks/admin/useHierarchyPrograms";
import { useSubjectHierarchy } from "@/hooks/admin/useSubjectHierarchy";
import type { SubjectHierarchy } from "@/api/admin/subject-hierarchy.api";

// The page's only job here is the header toggle; everything below it (ReactFlow
// canvas, router, data fetching) is stubbed so the test exercises the collapse
// behaviour rather than the graph. The real graph renders its `header` prop, so
// the stub must too — otherwise the header is never in the DOM.
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/components/admin/subject/hierarchy/SubjectHierarchyGraph", () => ({
  SubjectHierarchyGraph: ({ header }: { header?: React.ReactNode }) => (
    <div data-testid="graph">{header}</div>
  ),
}));

jest.mock("@/components/admin/subject/hierarchy/SubjectHierarchyFilter", () => ({
  SubjectHierarchyFilter: () => <div data-testid="filters">filters</div>,
}));

jest.mock("@/hooks/admin/useHierarchyPrograms");
jest.mock("@/hooks/admin/useSubjectHierarchy");

const mockPrograms = jest.mocked(useHierarchyPrograms);
const mockHierarchy = jest.mocked(useSubjectHierarchy);

const hierarchy = (nodes: number): SubjectHierarchy => ({
  levels: [{ id: "l1", name: "1st Year", rank: 1 }],
  nodes: Array.from({ length: nodes }, (_, i) => ({
    id: `s${i}`,
    name: `Subject ${i}`,
    levelId: "l1",
    levelName: "1st Year",
    yearRank: 1,
    courseName: null,
    strandName: null,
    termLabel: null,
  })),
  edges: [],
  truncated: false,
});

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  mockPrograms.mockReturnValue({
    data: [],
  } as unknown as ReturnType<typeof useHierarchyPrograms>);
  mockHierarchy.mockReturnValue({
    data: undefined,
    isLoading: false,
    columns: [],
  } as unknown as ReturnType<typeof useSubjectHierarchy>);
});

describe("Subject Hierarchy header collapse", () => {
  it("shows the filter block expanded by default", () => {
    render(<SubjectHierarchyPage />);
    expect(screen.getByTestId("filters")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /hide filters/i }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("hides the filter block when collapsed and restores it on expand", () => {
    render(<SubjectHierarchyPage />);
    const toggle = screen.getByRole("button", { name: /hide filters/i });

    fireEvent.click(toggle);

    const body = document.getElementById("hierarchy-header-body");
    expect(body).not.toBeVisible();
    expect(
      screen.getByRole("button", { name: /show filters/i }),
    ).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    expect(document.getElementById("hierarchy-header-body")).toBeVisible();
  });

  it("keeps aria-controls pointing at a node that exists while collapsed", () => {
    render(<SubjectHierarchyPage />);
    fireEvent.click(screen.getByRole("button", { name: /hide filters/i }));
    const controls = screen
      .getByRole("button", { name: /show filters/i })
      .getAttribute("aria-controls");
    expect(document.getElementById(controls as string)).toBeInTheDocument();
  });

  it("remembers the collapsed preference across mounts", () => {
    const { unmount } = render(<SubjectHierarchyPage />);
    fireEvent.click(screen.getByRole("button", { name: /hide filters/i }));
    expect(window.localStorage.getItem("subject-hierarchy-header-collapsed")).toBe(
      "true",
    );
    unmount();

    render(<SubjectHierarchyPage />);
    expect(document.getElementById("hierarchy-header-body")).not.toBeVisible();
  });

  it("survives storage being unavailable (private mode)", () => {
    const spy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    render(<SubjectHierarchyPage />);
    fireEvent.click(screen.getByRole("button", { name: /hide filters/i }));
    expect(document.getElementById("hierarchy-header-body")).not.toBeVisible();
    spy.mockRestore();
  });

  it("shows the subject/link/year summary while collapsed", () => {
    mockHierarchy.mockReturnValue({
      data: hierarchy(22),
      isLoading: false,
      columns: [{ rank: 1, levelName: "1st Year", nodes: [] }],
    } as unknown as ReturnType<typeof useSubjectHierarchy>);

    render(<SubjectHierarchyPage />);
    fireEvent.click(screen.getByRole("button", { name: /hide filters/i }));

    // The summary exists twice in the DOM: once in the now-hidden filter block
    // and once in the collapsed bar. Exactly one must be outside the hidden
    // region — that is the guarantee the collapsed state is meant to give.
    // (`checkVisibility` is not implemented in jsdom.)
    const matches = screen.getAllByText(
      /22 subjects · 0 prerequisite links · 1 years/,
    );
    expect(matches.filter((el) => el.closest("[hidden]") === null)).toHaveLength(1);
  });
});