import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ManualCell } from "../ManualCell";

// TICK-GRADE-005. ManualCell is the click-to-edit cell the educator uses to
// score Behavior / Participation directly on the Grades page. It previously
// hardcoded a 0-100 range; now it clamps to the category maximum.
describe("ManualCell (TICK-GRADE-005)", () => {
  const setup = (props: Partial<React.ComponentProps<typeof ManualCell>> = {}) => {
    const onCommit = jest.fn();
    render(
      <table>
        <tbody>
          <tr>
            <td>
              <ManualCell
                value={null}
                studentId="s1"
                category="Behavior"
                isLocked={false}
                onCommit={onCommit}
                {...props}
              />
            </td>
          </tr>
        </tbody>
      </table>,
    );
    return { onCommit, user: userEvent.setup() };
  };

  it("renders an em dash and becomes editable on click", async () => {
    const { user } = setup();
    const cell = screen.getByText("—");
    await user.click(cell);
    expect(screen.getByRole("spinbutton")).toBeInTheDocument();
  });

  it("commits an in-range score on Enter", async () => {
    const { user, onCommit } = setup({ maxScore: 20 });
    await user.click(screen.getByText("—"));
    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "18{Enter}");
    expect(onCommit).toHaveBeenCalledWith("s1", "Behavior", 18);
  });

  it("clamps to the category maximum and does not commit an over-cap score", async () => {
    // The cap is the point of this ticket: the educator must be able to see and
    // respect the ceiling. The server rejects these too; this is the UX half.
    const { user, onCommit } = setup({ maxScore: 20 });
    await user.click(screen.getByText("—"));
    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "25{Enter}");

    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByText(/Maximum is 20/)).toBeInTheDocument();
    // Still open for correction rather than silently discarding the input.
    expect(screen.getByRole("spinbutton")).toBeInTheDocument();
  });

  it("sets the input max attribute from the category maximum", async () => {
    const { user } = setup({ maxScore: 20 });
    await user.click(screen.getByText("—"));
    expect(screen.getByRole("spinbutton")).toHaveAttribute("max", "20");
  });

  it("falls back to 100 when no maximum is provided", async () => {
    const { user } = setup({ maxScore: null });
    await user.click(screen.getByText("—"));
    expect(screen.getByRole("spinbutton")).toHaveAttribute("max", "100");
  });

  it("rejects a negative score", async () => {
    const { user, onCommit } = setup({ maxScore: 20 });
    await user.click(screen.getByText("—"));
    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "-5{Enter}");
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("discards the edit on Escape without committing", async () => {
    const { user, onCommit } = setup({ maxScore: 20, value: 5 });
    await user.click(screen.getByText("5.0"));
    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "12{Escape}");
    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByText("5.0")).toBeInTheDocument();
  });

  it("does not open an editor while grades are locked", async () => {
    const { user } = setup({ isLocked: true, value: 10 });
    await user.click(screen.getByText("10.0"));
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("exposes an accessible name carrying the maximum", async () => {
    const { user } = setup({ maxScore: 20 });
    await user.click(screen.getByText("—"));
    expect(
      screen.getByRole("spinbutton", { name: /Behavior score, maximum 20/ }),
    ).toBeInTheDocument();
  });
});
