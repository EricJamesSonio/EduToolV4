export interface PageConfig {
  path: string;
  component: React.ComponentType;
  title?: string;
  permissions?: string[];
  isProtected?: boolean;
  isPublic?: boolean;
}

class PageRegistry {
  private pages: Map<string, PageConfig> = new Map();

  register(config: PageConfig): void {
    this.pages.set(config.path, config);
  }

  get(path: string): PageConfig | undefined {
    return this.pages.get(path);
  }

  getAll(): PageConfig[] {
    return Array.from(this.pages.values());
  }

  getPublicPages(): PageConfig[] {
    return this.getAll().filter(page => page.isPublic);
  }

  getProtectedPages(): PageConfig[] {
    return this.getAll().filter(page => page.isProtected);
  }

  clear(): void {
    this.pages.clear();
  }
}

// Singleton instance
export const pageRegistry = new PageRegistry();

// Helper function to register pages
export const registerPage = (config: PageConfig): void => {
  pageRegistry.register(config);
};

// Helper function to get all registered routes
export const getRegisteredRoutes = (): PageConfig[] => {
  return pageRegistry.getAll();
};
