import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  GradingSchemeComponentRow,
  labelForType,
} from "../GradingSchemeComponentRow";
import type {
  ComponentType,
  GradingSchemeComponentDto,
} from "@/types/admin/grading-scheme.types";

// Radix Select leans on pointer APIs jsdom does not implement (TICK-ASSESS-004).
beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn(
    () => false
  ) as unknown as typeof window.HTMLElement.prototype.hasPointerCapture;
  window.HTMLElement.prototype.releasePointerCapture = jest.fn() as unknown as
    typeof window.HTMLElement.prototype.releasePointerCapture;
  window.HTMLElement.prototype.scrollIntoView = jest.fn() as unknown as
    typeof window.HTMLElement.prototype.scrollIntoView;
  // jsdom has no ResizeObserver, which Radix measures its popper with.
  const g = globalThis as unknown as { ResizeObserver?: unknown };
  if (typeof g.ResizeObserver === "undefined") {
    g.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

interface HarnessProps {
  initialName?: string;
  initialType?: ComponentType;
}

/**
 * Mirrors how every editor applies onChange — one functional setState per
 * field — so the two onChange calls the row emits (type, then name) compose
 * exactly like they do in production.
 */
function RowHarness({
  initialName = "",
  initialType = "written_work",
}: HarnessProps) {
  const [row, setRow] = useState<GradingSchemeComponentDto>({
    name: initialName,
    type: initialType,
    weight: 25,
    isOptional: false,
  });

  const handleChange = (
    _index: number,
    field: keyof GradingSchemeComponentDto,
    value: string | number | boolean
  ) => {
    setRow((prev) => ({ ...prev, [field]: value }) as GradingSchemeComponentDto);
  };

  return (
    <GradingSchemeComponentRow
      index={0}
      row={row}
      disabled={false}
      onChange={handleChange}
      onDelete={jest.fn()}
    />
  );
}

async function pickType(
  user: ReturnType<typeof userEvent.setup>,
  label: string
) {
  await user.click(screen.getByRole("combobox"));
  await user.click(await screen.findByRole("option", { name: label }));
}

const nameInput = () => screen.getByLabelText("Category name");

describe("GradingSchemeComponentRow — category name auto-fill (TICK-ASSESS-004)", () => {
  it("fills Name with the canonical label when a type is selected", async () => {
    const user = userEvent.setup();
    render(<RowHarness initialType="written_work" />);

    expect(nameInput()).toHaveValue("");

    await pickType(user, "Behavior");

    expect(nameInput()).toHaveValue("Behavior");
  });

  it("keeps Name in step on later type changes while it stays untouched", async () => {
    const user = userEvent.setup();
    render(<RowHarness initialName="Quiz" initialType="quiz" />);

    await pickType(user, "Project");
    expect(nameInput()).toHaveValue("Project");

    await pickType(user, "Behavior");
    expect(nameInput()).toHaveValue("Behavior");
  });

  it("never overwrites a hand-typed Name when the type changes", async () => {
    const user = userEvent.setup();
    render(<RowHarness initialName="Quiz" initialType="quiz" />);

    await user.clear(nameInput());
    await user.type(nameInput(), "Homework Points");

    await pickType(user, "Behavior");

    expect(nameInput()).toHaveValue("Homework Points");
  });

  it("treats a name that merely matches a label as auto (re-fillable)", async () => {
    const user = userEvent.setup();
    render(<RowHarness initialName="quiz" initialType="quiz" />);

    await pickType(user, "Activity");

    expect(nameInput()).toHaveValue("Activity");
  });

  it("leaves Name editable — auto-fill is a default, not a lock", async () => {
    const user = userEvent.setup();
    render(<RowHarness initialName="Written Work" initialType="written_work" />);

    await user.clear(nameInput());
    await user.type(nameInput(), "Essay A");

    expect(nameInput()).toHaveValue("Essay A");
  });

  it("exposes canonical labels through labelForType", () => {
    expect(labelForType("behavior")).toBe("Behavior");
    expect(labelForType("written_work")).toBe("Written Work");
    expect(labelForType("quarterly_assessment")).toBe("Quarterly Assessment");
    expect(labelForType("activity")).toBe("Activity");
  });
});
