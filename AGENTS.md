# MLLM Gallery

This repository is a local React + Vite site for building an MLLM architecture gallery. The current focus is a black-and-white landing experience with a minimal animated hero, category navigation, and early gallery views for:

- Vision Encoders
- Modular VLMs
- Native MLLMs
- Compare

The UI should stay clean, restrained, and interaction-led. Keep the center hero flow available for future animation work and avoid placing extra cards or dense content in that middle area.

## Development

- Use React, Vite, `motion`, `lucide-react`, and plain CSS.
- Keep visual changes consistent with the current black-and-white style.
- Run `npm run build` before committing meaningful UI changes.

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
