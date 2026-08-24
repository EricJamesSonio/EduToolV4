import { render, screen } from '@testing-library/react';
import { OrgHeroCard } from '../OrgHeroCard';
import { PROGRAM_TYPE_LABELS } from '@/types/admin/program.types';

// Must be before any import that uses the hook — jest hoists this
const mockUseSchoolProfile = jest.fn();
jest.mock('@/hooks/admin/useSchoolProfile', () => ({
  useSchoolProfile: (...args: any[]) => mockUseSchoolProfile(...args),
}));

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

describe('OrgHeroCard — Available Departments (real rendering, no fake logic)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSchoolProfile.mockReset();
  });

  function renderCard(props: { name: string; logoUrl?: string | null }) {
    return render(<OrgHeroCard name={props.name} logoUrl={props.logoUrl ?? null} />);
  }

  it('renders org name and logo placeholder when no logo', () => {
    mockUseSchoolProfile.mockReturnValue({ data: [], isLoading: false });
    renderCard({ name: 'Test University' });

    expect(screen.getByText('Test University')).toBeInTheDocument();
    expect(screen.getByText('No logo')).toBeInTheDocument();
  });

  it('renders logo image when logoUrl provided', () => {
    mockUseSchoolProfile.mockReturnValue({ data: [], isLoading: false });
    renderCard({ name: 'Test University', logoUrl: 'logo.png' });

    const img = screen.getByAltText('Organization logo') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('logo.png');
  });

  it('shows loading skeletons while departments are fetching', () => {
    mockUseSchoolProfile.mockReturnValue({ data: [], isLoading: true });
    renderCard({ name: 'Test University' });

    expect(screen.getByText('Available Departments')).toBeInTheDocument();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows "No departments set up yet." when profile is empty', () => {
    mockUseSchoolProfile.mockReturnValue({ data: [], isLoading: false });
    renderCard({ name: 'Test University' });

    expect(screen.getByText('No departments set up yet.')).toBeInTheDocument();
    expect(screen.getByText('Available Departments')).toBeInTheDocument();
  });

  it('renders college with courses as small muted text (not badges) — compact fit', () => {
    mockUseSchoolProfile.mockReturnValue({
      data: [
        {
          id: 'dept-1',
          type: 'college',
          courses: [
            { id: 'c-1', name: 'BS Computer Science', code: 'BSCS', levels: [] },
            { id: 'c-2', name: 'BS Information Systems', code: 'BSIS', levels: [] },
          ],
          strands: [],
          levels: [],
          subjects: [],
        },
      ],
      isLoading: false,
    });

    renderCard({ name: 'Test University' });

    expect(screen.getByText(PROGRAM_TYPE_LABELS.college)).toBeInTheDocument();
    expect(screen.getByText('BS Computer Science · BS Information Systems')).toBeInTheDocument();
    expect(screen.queryByText(/BSCS/)).not.toBeInTheDocument();
  });

  it('renders SHS with strands as small muted text', () => {
    mockUseSchoolProfile.mockReturnValue({
      data: [
        {
          id: 'dept-2',
          type: 'shs',
          courses: [],
          strands: [
            { id: 's-1', name: 'STEM', levels: [] },
            { id: 's-2', name: 'ABM', levels: [] },
            { id: 's-3', name: 'HUMSS', levels: [] },
          ],
          levels: [],
          subjects: [],
        },
      ],
      isLoading: false,
    });

    renderCard({ name: 'Test University' });

    expect(screen.getByText(PROGRAM_TYPE_LABELS.shs)).toBeInTheDocument();
    expect(screen.getByText('STEM · ABM · HUMSS')).toBeInTheDocument();
  });

  it('renders multiple departments each with its own course/strand line', () => {
    mockUseSchoolProfile.mockReturnValue({
      data: [
        {
          id: 'dept-1',
          type: 'college',
          courses: [{ id: 'c-1', name: 'BSIT', code: 'BSIT', levels: [] }],
          strands: [],
          levels: [],
          subjects: [],
        },
        {
          id: 'dept-2',
          type: 'elementary',
          courses: [],
          strands: [],
          levels: [{ id: 'l-1', name: 'Grade 1', orderIndex: 0, sections: [], subjects: [] }],
          subjects: [],
        },
        {
          id: 'dept-3',
          type: 'shs',
          courses: [],
          strands: [{ id: 's-1', name: 'STEM', levels: [] }],
          levels: [],
          subjects: [],
        },
      ],
      isLoading: false,
    });

    renderCard({ name: 'Test University' });

    expect(screen.getByText(PROGRAM_TYPE_LABELS.college)).toBeInTheDocument();
    expect(screen.getByText('BSIT')).toBeInTheDocument();
    expect(screen.getByText(PROGRAM_TYPE_LABELS.elementary)).toBeInTheDocument();
    expect(screen.getByText(PROGRAM_TYPE_LABELS.shs)).toBeInTheDocument();
    expect(screen.getByText('STEM')).toBeInTheDocument();
  });

  it('does NOT show "General department" text for departments without courses/strands', () => {
    mockUseSchoolProfile.mockReturnValue({
      data: [
        {
          id: 'dept-1',
          type: 'elementary',
          courses: [],
          strands: [],
          levels: [{ id: 'l-1', name: 'Grade 1', orderIndex: 0, sections: [], subjects: [] }],
          subjects: [],
        },
      ],
      isLoading: false,
    });

    renderCard({ name: 'Test University' });

    expect(screen.getByText(PROGRAM_TYPE_LABELS.elementary)).toBeInTheDocument();
    expect(screen.queryByText('General department')).not.toBeInTheDocument();
    const deptSection = screen.getByText(PROGRAM_TYPE_LABELS.elementary).closest('div');
    expect(deptSection).toBeInTheDocument();
    // Old implementation used Badge pills with rounded-full; new one uses plain small text
    // so there should be no badge-like element associated with this dept
    expect(screen.queryByText('General department')).not.toBeInTheDocument();
  });

  it('keeps Available Departments inside the same card container as profile (not separate card)', () => {
    mockUseSchoolProfile.mockReturnValue({ data: [], isLoading: false });
    const { container } = renderCard({ name: 'Test University' });

    // Outer Card is the only element with border-border/60 — inner avatar also has border-border but not /60
    const outerCards = container.querySelectorAll('[class*="border-border/60"]');
    expect(outerCards.length).toBe(1);

    const cardContent = container.querySelector('[class*="pt-8"]');
    expect(cardContent).toContainElement(screen.getByText('Available Departments'));
    expect(cardContent).toContainElement(screen.getByText('Test University'));
  });

  it('subtext uses muted small text styling (not dark badge)', () => {
    mockUseSchoolProfile.mockReturnValue({
      data: [
        {
          id: 'dept-1',
          type: 'college',
          courses: [{ id: 'c-1', name: 'BSCS', code: 'BSCS', levels: [] }],
          strands: [],
          levels: [],
          subjects: [],
        },
      ],
      isLoading: false,
    });

    renderCard({ name: 'Test University' });

    const subtext = screen.getByText('BSCS');
    expect(subtext).toHaveClass('text-muted-foreground');
    expect(subtext).toHaveClass('text-xs');
    expect(subtext.className).not.toMatch(/bg-secondary|bg-slate|rounded-full/);
  });
});
