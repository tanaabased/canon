# Front-End Preferences

Use this reference for the stable frontend defaults that are shared across Tanaab-managed frontend and docs-site work.

- Pair this reference with [coding-stack-preferences.md](./coding-stack-preferences.md) for the broader stack defaults.
- Keep this file at the preference layer. Implementation details should stay with the owning frontend skill.

## Defaults

- Prefer Vue 3 for front-end component work.
- Prefer VitePress 1 for static websites and documentation sites.
- Prefer SCSS for Vue component and VitePress theme styling.
- Use plain `.css` only when the task explicitly requires raw CSS or the surrounding toolchain does not support SCSS.
- Do not choose Less or Stylus by default.

## Theme Boundaries

- For Tanaab-styled static sites, prefer subthemes built on [tanaabased/theme](https://github.com/tanaabased/theme).
- For non-Tanaab styled static sites, prefer subthemes built on [lando/vitepress-theme-default-plus](https://github.com/lando/vitepress-theme-default-plus).
- Keep project-specific branding, layout, and presentation changes in the local subtheme layer instead of forking the upstream theme when a subtheme is sufficient.

## Styling Discipline

- Keep SCSS structure readable: shared variables, mixins, token maps, and partials should clarify the design system rather than hide it.
- Prefer local subtheme overrides over upstream theme forks when the task only needs project-specific presentation changes.
