# MLLM Gallery

This repository is a local React + Vite site for building an MLLM architecture gallery. The current focus is a black-and-white landing experience with a minimal animated hero, category navigation, and early gallery views for:

- Vision Encoders
- Modular VLMs
- Native MLLMs

The UI should stay clean, restrained, and interaction-led. Keep the center hero flow available for future animation work and avoid placing extra cards or dense content in that middle area.

## Development

- Use React, Vite, `motion`, `lucide-react`, and plain CSS.
- Keep visual changes consistent with the current black-and-white style.
- Run `npm run build` before committing meaningful UI changes.

## Architecture Diagrams

- Read `docs/architecture-diagram-standard.md` before adding a model diagram.
- Reuse `src/architecture/ArchitectureDiagram.jsx` and its monochrome tokens.
- Keep the canvas fixed: no drag or manual zoom. Module selection/expansion
  automatically focuses details; clearing selection restores the overview.
- Reuse `src/architecture/viewport.js` for framing; never cover the focused
  module with the inspector, including on mobile.
- Keep model definitions separate from rendering and follow `docs/architecture.schema.json`.
- Reference templates are schematics; concrete models require primary sources.
- Use one checkpoint per concrete model, with a concise main graph. Keep numeric
  parameters and internal operations in click-through details, not on the canvas.
- CLIP uses ViT-L/14 at 224 px; do not mix in B/32 or 336 px parameters.
- Run `npm test` and `npm run build` after diagram changes.

## Commit Messages

Use common Conventional Commit prefixes:

- `feat:` for new user-facing features
- `fix:` for bug fixes
- `chore:` for maintenance or repo housekeeping
- `docs:` for documentation-only changes
- `style:` for CSS or formatting-only changes
- `refactor:` for code changes without behavior changes
- `test:` for test additions or changes
- `build:` for build tooling or dependency changes
- `ci:` for CI workflow changes
- `perf:` for performance improvements

Examples:

- `feat: add landing page navigation`
- `fix: restore hero watermark animation`
- `docs: add project agent notes`
