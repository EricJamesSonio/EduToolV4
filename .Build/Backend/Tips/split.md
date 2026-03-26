Problem:
A single service becomes crowded when it contains role-specific or context-specific logic.

Solution:

1. Create a **core service**

   * Contains shared, reusable logic only
   * No role, user type, or context-specific code

2. Create **separate use-case services** when needed

   * Each represents a specific role or workflow (e.g., admin, user, educator)
   * These services call the core service instead of duplicating logic

3. Keep controllers clean

   * Controllers handle routing and call the appropriate service
   * Optionally split controllers per role if it improves clarity

Structure:
example module : product

```
module/
  product.core.service.ts
  product.admin.service.ts
  product.user.service.ts
  product.controller.ts
```

Rules:

* Do not mix multiple roles inside one service
* Do not duplicate shared logic across services
* Keep core logic centralized
* Keep use-case services focused on behavior, not low-level logic

Mindset:

* Core service = shared logic
* Use-case service = how a specific context uses that logic
* Controller = entry point that connects everything
