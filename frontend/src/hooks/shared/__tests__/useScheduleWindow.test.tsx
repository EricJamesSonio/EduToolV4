import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { useScheduleWindow } from "../useScheduleWindow";

const mockUseOrgScheduleConfig = jest.fn();
jest.mock("@/hooks/admin/useOrgScheduleConfig", () => ({
  useOrgScheduleConfig: () => mockUseOrgScheduleConfig(),
}));

// The window drives the grid's vertical extent and full-week rendering in
// READ-ONLY mode too, not just when picking slots.

const wrapper = ({ children }: { children: ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

describe("useScheduleWindow", () => {
  beforeEach(() => mockUseOrgScheduleConfig.mockReset());

  it("converts the org config window to minutes", () => {
    mockUseOrgScheduleConfig.mockReturnValue({
      data: { startTime: "07:00", endTime: "17:00", slotDuration: 30 },
    });
    const { result } = renderHook(() => useScheduleWindow(), { wrapper });
    expect(result.current.windowStartMin).toBe(420);
    expect(result.current.windowEndMin).toBe(1020);
    expect(result.current.stepMin).toBe(30);
    expect(result.current.isConfigured).toBe(true);
  });

  it("always requests the full week, even with no config", () => {
    mockUseOrgScheduleConfig.mockReturnValue({ data: undefined });
    const { result } = renderHook(() => useScheduleWindow(), { wrapper });
    expect(result.current.showAllDays).toBe(true);
    expect(result.current.isConfigured).toBe(false);
  });

  it("omits the window when no config is available so the grid falls back", () => {
    mockUseOrgScheduleConfig.mockReturnValue({ data: undefined });
    const { result } = renderHook(() => useScheduleWindow(), { wrapper });
    expect(result.current.windowStartMin).toBeUndefined();
    expect(result.current.windowEndMin).toBeUndefined();
  });

  it("rejects an inverted or equal window", () => {
    mockUseOrgScheduleConfig.mockReturnValue({
      data: { startTime: "17:00", endTime: "07:00", slotDuration: 30 },
    });
    const { result } = renderHook(() => useScheduleWindow(), { wrapper });
    expect(result.current.isConfigured).toBe(false);
    expect(result.current.windowStartMin).toBeUndefined();
  });

  it("supports a non-30m slot duration", () => {
    mockUseOrgScheduleConfig.mockReturnValue({
      data: { startTime: "08:00", endTime: "12:00", slotDuration: 60 },
    });
    const { result } = renderHook(() => useScheduleWindow(), { wrapper });
    expect(result.current.stepMin).toBe(60);
  });
});