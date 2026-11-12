import dynamic from 'next/dynamic';
import { describe, test, expect, jest } from '@jest/globals';

jest.mock('@/components/admin/subject/hierarchy/SubjectHierarchyGraph', () => ({
  SubjectHierarchyGraph: () => null,
}));

jest.mock('@/components/admin/subject/hierarchy/SubjectHierarchyLegend', () => ({
  SubjectHierarchyLegend: () => null,
}));

jest.mock('@/hooks/admin/useSubjectHierarchy', () => ({
  useSubjectHierarchy: () => ({ data: undefined, isLoading: false }),
  useHierarchyStatuses: () => ({ data: undefined }),
}));

const SubjectHierarchyModal = dynamic(
  () =>
    import('@/components/admin/subject/hierarchy/SubjectHierarchyModal').then(
      (m) => m.SubjectHierarchyModal,
    ),
  { ssr: false },
);

describe('Phase 4B: Subject Hierarchy Modal Dynamic Import', () => {
  test('SubjectHierarchyModal dynamic import resolves correctly', async () => {
    const mod = await import(
      '@/components/admin/subject/hierarchy/SubjectHierarchyModal'
    );
    expect(mod.SubjectHierarchyModal).toBeDefined();
  });

  test('SubjectHierarchyModal dynamic wrapper is defined', () => {
    expect(SubjectHierarchyModal).toBeDefined();
  });

  test('SubjectCompletionPanel source uses a dynamic import for the modal', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const file = path.resolve(
      __dirname,
      '../components/admin/student/detail/SubjectCompletionPanel.tsx',
    );
    const source = fs.readFileSync(file, 'utf8');
    expect(source).toContain('next/dynamic');
    expect(source).toContain(
      '@/components/admin/subject/hierarchy/SubjectHierarchyModal',
    );
    expect(source).toContain('ssr: false');
  });
});