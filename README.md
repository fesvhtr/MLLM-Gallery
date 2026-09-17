# MLLM Gallery

A local React + Vite landing page for an English MLLM architecture gallery.

## Stack

- React 19
- Vite 5
- `motion`
- `lucide-react`
- Plain CSS
- Inter from Google Fonts

## Run Locally

```powershell
npm install
npm run dev
```

The app is configured for:

```text
http://localhost:4173
```

## Build

```powershell
npm run build
```

## Architecture Diagram Standard

CLIP ViT-L/14 (224 px): `http://localhost:4173/#/models/clip`.
The **CLIP** card under **Vision Encoders** opens the same page. The nine-module
graph keeps parameters, encoder internals, the training objective, and source
links in click-through details. No checkpoint selector is shown.

Open `http://localhost:4173/#/diagram-system/modular-vlm` for the interactive
reference. Each category also has an **Architecture reference** link.

The studio includes three monochrome reference templates, module inspection,
directional path tracing, expandable blocks, automatic detail-focus zoom,
optional signal motion, and template JSON export. The canvas is fixed: select a
module to focus it; dismiss selection or use Overview to return to the full
diagram. There are no manual pan/zoom gestures. These are schematics, not
verified model checkpoints.

- [Design standard and generator brief](docs/architecture-diagram-standard.md)
- [Architecture JSON schema](docs/architecture.schema.json)
- Reference data: `src/architecture/templates.js`
- Reusable renderer: `src/architecture/ArchitectureDiagram.jsx`

Run `npm test` for schema, layout, path-tracing, and camera-framing checks.
