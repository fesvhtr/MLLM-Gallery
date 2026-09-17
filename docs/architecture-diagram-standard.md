# MLLM Gallery: Architecture Diagram Standard

Version 0.1. The reference implementation is `src/architecture/`.

## Intent

Make different model architectures readable in the same visual language.
Diagrams are interactive technical figures, not slide illustrations or workflow
editors. The model's computation determines the topology; the renderer determines
its appearance. Do not force a different architecture into an existing template.

The preview is available at `/#/diagram-system/modular-vlm`. It includes three
reference schematics, not verified diagrams of named checkpoints.

Concrete model pages use one representative checkpoint per model, not a variant
selector or a mixture of configurations. The first is CLIP ViT-L/14 (224 px) at
`/#/models/clip`.

## Composition

- Primary computation reads left to right. Auxiliary modalities enter from below.
- Use an 8 px base grid. A module is 208 x 160 px at 100% zoom.
- Columns advance by 280 px, leaving a 72 px edge corridor.
- Rows advance by 352 px. The first row's vertical center is y = 208 px.
- Stage headings start at y = 0 and occupy 32 px; they are annotations, not nodes.
- Stage headings appear in overview/expanded views, not during module focus.
- Expanded modules are 208 x 304 px and keep the same vertical center.
- Preserve column and row assignment between overview and expanded views.
- Use 16 px internal padding, a 6 px module radius, and no decorative shadows.
- A repeated block may extend 9 px below its box with two inset stack outlines.
- Keep labels outside module boxes. Edge labels wrap within the 72 px corridor.
- Show a compact overview first. Put long explanations, dimensions, and source
  notes in the inspector. Do not shrink text to fit long explanations inside nodes.
- Concrete model pages use the renderer's `concise` presentation: primary modules
  and data paths only. No kind badges, stage numbers, tensor labels, legend, or
  on-canvas step inventories. Clicking retains automatic focus and opens the
  inspector, where dimensions, internal operations, objectives, and sources live.
- A complete encoder may be one `operation` node with a layer glyph. Do not add
  a repeat badge to the entire encoder when only its internal blocks repeat.
- Retain the same topology on narrow screens. Reserve space for details beside
  the canvas on desktop and below it on mobile; never cover the focused module.
  The renderer fits the diagram to the available canvas automatically. On short
  phones, allow page scrolling rather than clipping the canvas or details.

The five stages in the references are useful examples, not a required model
structure. Native models, video sampling, parallel encoders, experts, and
cross-attention require their actual branches and ports to be represented.

## Color Tokens

Every channel must be neutral: R = G = B. Do not use hue to encode modality.

| Token         | Value     | Role                                   |
| ------------- | --------- | -------------------------------------- |
| Ink           | `#191919` | Main labels, emphasis, output surface  |
| Secondary     | `#707070` | Secondary text                         |
| Border        | `#D4D4D4` | Panel dividers                         |
| Fill          | `#F4F4F4` | Computation surfaces                   |
| Paper         | `#FFFFFF` | Canvas nodes, background, inverse text |
| Canvas        | `#FCFCFC` | Diagram canvas                         |
| Grid          | `#EEEEEE` | Quiet 32 px canvas grid                |
| Wire          | `#898989` | Unselected dataflow                    |
| Module border | `#B8B8B8` | Node outlines                          |

Hierarchy comes from shape, labels, stroke, and fill together. A dark surface
means a terminal output, never an implied trainable state. Frozen/trainable
status is model metadata and must be explicitly sourced if added.

## Typography

- Use Inter 400/500/600 for module names and UI text.
- Use Sora 400 only for the page title, not the technical figure.
- Use the system monospace stack for tensor shapes, counts, and indices.
- At 100% zoom: node title 16 px / 500, metadata 10 px / 400, stage 11 px,
  wire label 9 px, internal operation 10 px.
- Letter spacing is zero. Font sizes do not track viewport width.
- Use a concise canonical operation name and one secondary line per module.
- Keep tensor notation consistent: `N_v`, `T`, `d_v`, `d_model`, `L_v`, `L`,
  `S` (total sequence length), and `|V|` (vocabulary size).
- Define symbols in the inspector. Never invent numerical dimensions.

## Module Grammar

| Kind        | Appearance                                         | Meaning                                        |
| ----------- | -------------------------------------------------- | ---------------------------------------------- |
| `input`     | White fill, dashed boundary                        | External image, text, audio, or other input    |
| `operation` | Light-gray fill, solid outline                     | An explicit transformation                     |
| `stack`     | White fill, two offset lower outlines, `x L` badge | A repeated computation block                   |
| `tokens`    | White fill, small sequence glyph                   | A sequence or multimodal token arrangement     |
| `output`    | Ink fill, white title                              | An explicit terminal output or prediction head |

Glyphs are small code-rendered marks, not colored icons. They supplement labels.
Only use a repetition badge when the block is actually repeated. An expanded
reference is an ordered inventory, not a substitute for a full internal graph.
Residual additions must be named in the inventory. When a model needs a precise
residual branch, represent it as explicit operations and connections in the data.

## Connections

- `data`: solid 1.25 px wire with a small arrow at the destination.
- `conditioning`: dashed 1.25 px wire (5 px dash / 5 px gap), entering a bottom
  `aux` port. In these references this is the text-conditioning branch.
- Dashed wires do not mean optional, frozen, uncertain, or disconnected.
- Use orthogonal routing with 10 px rounded bends and 24 px port clearance.
- Main input port is left (`in`); primary output port is right (`out`).
- The bottom `aux` port also accepts solid `data` edges for a second input. Port
  position does not define semantics: CLIP's two embeddings are both data inputs
  to similarity, not a dashed text-conditioning branch.
- Tensor labels state what flows on a connection, not the name of its operation.
- Repeat loops are represented by a stack count in this version. Arbitrary
  recurrent edges, MoE fan-out, and new port types require an explicit extension
  to the schema and renderer rather than repurposing an unrelated line style.

## Interaction Contract

- Use detail-driven zoom, not a freely navigable canvas. Start with a fitted
  overview. Dragging, wheel/trackpad zoom, pinch zoom, double-click zoom, and
  keyboard-activated panning must not change the diagram's viewport. Do not add
  manual zoom buttons, a zoom percentage, or a draggable minimap. Native browser
  page zoom remains available for accessibility.
- Hover previews the node's upstream and downstream paths. Hover never changes
  the viewport, moves nodes, or replaces the inspector's persistent selection.
- Click, tap, or keyboard selection pins the module, opens its details, and
  automatically centers it at a readable scale. Inspector connection links use
  the same focus behavior when moving to another module.
- Keep camera transitions restrained: 440 ms ease-out, no overshoot or ambient
  camera motion. Fit the whole focused module, including expanded internals and
  stack outlines. Cap detail scale at 115%; overview scale at 100%. Reduce scale
  when necessary to fit the available space. Reserve 24 px horizontally,
  48 px above, and 40 px below for captions and connections (within 1 px rounding).
- Panel or viewport resizing refits the current focus, not an unrelated overview.
  Selecting the same module repeatedly must not accumulate zoom.
- Selection uses an ink outline and a white separation ring.
- Related connections become 1.75 px ink strokes. Unrelated branches fade to
  23% opacity, but retain their layout and labels.
- Traverse upstream and downstream separately: selecting a vision encoder must
  not illuminate an unrelated text branch solely because both enter one decoder.
- Blank-canvas click, Escape, or closing details clears the pinned selection and
  smoothly returns to the full diagram, retaining the current expansion state.
- Node chevrons expand or collapse that module and focus it with details open.
  Overview clears selection, collapses all modules, and fits the whole diagram.
  Expanded clears selection, opens all modules that supply a `steps` inventory,
  and fits the whole diagram. Neither action changes the scientific topology.
- Nodes cannot be edited, deleted, connected, or freely moved in the viewer.
- Signal animation is opt-in. Play adds small monochrome particles along paths;
  these indicate direction only, not latency, throughput, or execution order.
- Respect `prefers-reduced-motion`: no particles or animated camera transitions.
- Icon controls have accessible names, keyboard focus, and hover tooltips.

## Data Contract

Keep model data separate from rendering. `architecture.schema.json` describes the
serializable shape. `templates.js` supplies examples and shared geometry.

| Field                     | Meaning                                                            |
| ------------------------- | ------------------------------------------------------------------ |
| `id`, `title`, `category` | Stable identifier and visible model/family labels                  |
| `version`                 | Diagram standard version, currently `0.1`                          |
| `checkpoint` (optional)   | The single concrete configuration used throughout this model page |
| `evidence`                | `Reference schematic` or `Source-verified architecture`            |
| `description`, `note`     | Model meaning and scope of omissions                               |
| `stages`                  | Left-to-right column labels                                        |
| `nodes`                   | Semantic kind, label, grid position, ports, dimensions, properties |
| `edges`                   | Stable node references, ports, relationship kind, tensor label     |
| `sources`                 | Primary-source title, URL, and section/figure locator              |
| `notation` (optional)     | Model-specific symbol/meaning pairs for the inspector              |

`input` and `output` on a node describe its tensor interface, not node IDs.
`column` and `row` are zero-based integers. `steps` is optional and supports up to
five compact entries; larger internals should become their own subdiagram.
The renderer injects selection, hover, callbacks, and motion at runtime. These
must never be serialized into model data. JSON export contains the template only.

## Adding a Real Model

1. Identify the exact release or checkpoint and read its primary paper or code.
2. Choose the closest reference topology and change it to match the source.
3. Assign semantic node kinds and grid positions, then connect explicit ports.
4. Replace symbolic dimensions only where they are verified for that checkpoint.
5. Record paper/code URLs and exact figure or section locators in `sources`.
6. Document omissions such as training stages, pooling, sampling, or decoding.
7. Validate the JSON contract and run graph/layout tests plus the production build.
8. Inspect overview, expanded, selected, mobile, and reduced-motion states.

Do not claim an unsourced reference is a specific model. A native architecture
must not be assumed to have discrete image tokens or generative image outputs.

## Implementation and Checks

- `ArchitectureDiagram.jsx`: reusable read-only React Flow canvas and inspector.
  Supply a validated `template` and a parent with a bounded height. The component
  loads its own styles and visual tokens.
- `ArchitectureStudio.jsx`: template navigation and specification download.
- `ModelArchitecture.jsx`: individual model page with paper/code links.
- `models/clip.js`: CLIP ViT-L/14 (224 px), nine primary modules; no variant selector.
- `architecture.css`: scoped visual tokens, primitives, and responsive rules.
- `templates.js`: reference data, geometry, and directional path tracing.
- `viewport.js`: shared bounds and automatic overview/detail camera policy.
- `tests/architecture.test.js`: data integrity, spacing, branch tracing, and
  camera framing across desktop/mobile and collapsed/expanded states.
- Commands: `npm test` and `npm run build`.

Before accepting interaction changes, check that drag, wheel, and hover leave
the viewport unchanged; selecting, expanding, and following a connection focus
the intended module; Overview, Escape, blank-canvas click, and closing details
return to the full diagram. Check rapid selection changes and mobile details
without overlap. Reduced-motion mode must make the same state changes instantly.

React Flow owns viewport, routing helpers, handles, and keyboard selection.
References: [custom nodes](https://reactflow.dev/learn/customization/custom-nodes),
[custom edges](https://reactflow.dev/learn/customization/custom-edges),
[viewport API](https://reactflow.dev/api-reference/types/react-flow-instance).

## Generator Brief

Use this brief when generating future diagram data:

> Produce a JSON architecture definition matching architecture.schema.json and
> MLLM Gallery Diagram Standard v0.1. Use only supported semantic node kinds and
> port types. Place primary computation from left to right on the shared grid;
> place auxiliary modalities on lower rows. Use concise English labels and
> consistent tensor notation. Provide primary sources and checkpoint identity.
> Keep unknown dimensions symbolic and mark omissions. Do not emit colors,
> typography, CSS, coordinates in pixels, interaction state, or invented facts.
> The shared renderer supplies presentation and interaction.
