import type { ConceptBuild } from './types';

export function validateConceptBuild(build: ConceptBuild): void {
  if (!build.sections.length) {
    throw new Error('Validation failed: at least one section is required');
  }
  if (!build.concepts.length) {
    throw new Error('Validation failed: at least one concept is required');
  }

  for (const sec of build.sections) {
    if (!sec.trim()) {
      throw new Error('Validation failed: section name cannot be empty');
    }
  }

  for (const cap of Object.values(build.questionCapacity)) {
    if (typeof cap !== 'number' || cap <= 0) {
      throw new Error(
        'Validation failed: question capacities must be positive numbers',
      );
    }
  }

  const seenNames = new Set<string>();
  for (const c of build.concepts) {
    if (!c.name.trim()) {
      throw new Error('Validation failed: concept name cannot be empty');
    }
    if (seenNames.has(c.name)) {
      throw new Error(`Validation failed: duplicate concept "${c.name}"`);
    }
    seenNames.add(c.name);

    if (!build.sections.includes(c.section)) {
      throw new Error(
        `Validation failed: concept "${c.name}" references unknown section "${c.section}"`,
      );
    }
  }
}
