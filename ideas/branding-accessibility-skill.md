# Branding Accessibility Skill

Keep this idea deferred until a branding, theme, or visual-system skill exists.

## Summary

Create a future skill for visual accessibility policy that is broader than Vue component markup and more specific than generic frontend implementation.

The future skill should own accessibility choices that live in brand, theme, or design-system decisions:

- color contrast
- typography scale and readable text sizing
- target size
- focus styling
- semantic color roles
- reduced-motion policy
- theme-token accessibility constraints

## Default Standard

Use [WCAG 2.2](https://www.w3.org/TR/WCAG22/) AA as the default target unless the repo, client, or legal context requires a stricter policy.

Use [ARIA in HTML](https://www.w3.org/TR/aria-in-html/) and [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) guidance for component semantics, but keep that markup behavior in the Vue skill until a broader accessibility skill has a clear live owner.

## Current Ownership

- `tanaab-vue-author` owns component-level semantics, ARIA state, accessible names, labels, keyboard behavior, and focus order.
- `tanaab-vitepress-author` owns reuse of accessible global components and semantic HTML in VitePress Markdown pages.
- Repo-local `AGENTS.md` files may carry temporary project-specific accessibility rules for a theme repo, especially when the rule depends on local brand tokens or visual conventions.

## Revisit Criteria

Revisit this skill idea when at least one of these is true:

1. Multiple theme or brand repos need the same accessibility policy.
2. Visual accessibility work repeatedly crosses Vue, VitePress, CSS tokens, and brand guidance.
3. WCAG conformance expectations need reusable checklists or validation workflows.
4. Repo-local `AGENTS.md` guidance starts duplicating the same contrast, focus, motion, or target-size rules across projects.
