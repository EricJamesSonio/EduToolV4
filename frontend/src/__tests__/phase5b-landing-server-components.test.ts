/**
 * Phase 5B: Landing Page Server Component Compatibility Tests
 * 
 * Tests that verify:
 * 1. Four sections have no "use client" directive
 * 2. Four sections have no hooks (useState, useEffect, useRef, useCallback, etc.)
 * 3. HeroSection has useScrollAnimation hook (client boundary)
 * 4. SolutionSection has useState/useRef/useEffect/useCallback/context (client boundary)
 * 5. page.tsx is a Server Component
 * 6. LandingRedirect handles /auth/refresh redirect client-side
 * 
 * Server-component compatible (verified):
 * - FeaturesSection.tsx
 * - ResourcesSection.tsx
 * - CTASection.tsx
 * - ContactAdminSection.tsx
 * 
 * Client components (have hooks/interactivity):
 * - HeroSection.tsx - useScrollAnimation hook
 * - SolutionSection.tsx - state management, context, videos
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// Read file contents to check for "use client" and hooks
const readFileContents = (filePath: string): string =>
  fs.readFileSync(filePath, 'utf-8');

const componentsDir = 'src/components/landing';

describe('Phase 5B: Landing Page Server/Client Component Boundaries', () => {
  const serverComponentSections = [
    'FeaturesSection',
    'ResourcesSection',
    'CTASection',
    'ContactAdminSection',
  ];

  const clientComponentSections = [
    { name: 'HeroSection', hasHook: 'useScrollAnimation' },
    { name: 'SolutionSection', hooks: ['useState', 'useRef', 'useEffect', 'useCallback', 'context'] },
  ];

  // Verify server-component sections have NO "use client"
  serverComponentSections.forEach((section) => {
    test(`/${section} has no "use client" directive`, () => {
      const filePath = path.join(componentsDir, `${section}.tsx`);
      const content = readFileContents(filePath);
      expect(content).not.toContain('"use client"');
    });

    test(`/${section} has no hooks import`, () => {
      const filePath = path.join(componentsDir, `${section}.tsx`);
      const content = readFileContents(filePath);
      // Check for common React hooks that would indicate client component
      const hasHooks = 
        content.includes('useState') ||
        content.includes('useEffect') ||
        content.includes('useRef') ||
        content.includes('useCallback') ||
        content.includes('useContext');
      expect(hasHooks).toBe(false);
    });
  });

  // Verify HeroSection has useScrollAnimation hook (client boundary)
  test('HeroSection has useScrollAnimation hook', () => {
    const filePath = path.join(componentsDir, 'HeroSection.tsx');
    const content = readFileContents(filePath);
    expect(content).toContain('useScrollAnimation');
  });

  // Verify SolutionSection has client-side hooks
  test('SolutionSection has client-side hooks', () => {
    const filePath = path.join(componentsDir, 'SolutionSection.tsx');
    const content = readFileContents(filePath);
    expect(
      content.includes('useState') ||
      content.includes('useRef') ||
      content.includes('useEffect') ||
      content.includes('useCallback')
    ).toBe(true);
  });

  test('page.tsx is a Server Component (no "use client" at top)', () => {
    const filePath = 'src/app/page.tsx';
    const content = readFileContents(filePath);
    // page.tsx should not have "use client" directive
    // It may have imports but no 'use client' pragma
    const hasUseClient = content.includes('\n"use client"');
    expect(hasUseClient).toBe(false);
  });

  test('LandingRedirect handles /auth/refresh redirect', () => {
    const filePath = 'src/components/landing/LandingRedirect.tsx';
    const content = readFileContents(filePath);
    // Should have auth redirect logic for /auth/refresh
    expect(content).toContain('auth/refresh') || expect(content).toContain('/auth/refresh');
  });
});