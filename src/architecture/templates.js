export const DIAGRAM_VERSION = "0.1";

export const NODE_KINDS = {
  input: "Input",
  operation: "Operation",
  stack: "Repeated block",
  tokens: "Token sequence",
  output: "Output",
};

export const GEOMETRY = {
  grid: 8,
  width: 208,
  height: 160,
  expandedHeight: 304,
  column: 280,
  row: 352,
  centerY: 208,
  stageHeight: 32,
};

const image = {
  id: "image",
  kind: "input",
  label: "Image",
  subtitle: "Visual input",
  column: 0,
  row: 0,
  symbol: "image",
  input: "Pixels",
  output: "H x W x C",
  description:
    "An image enters the visual pathway. Resolution, cropping, and normalization are model-specific.",
  properties: [
    ["Modality", "Image"],
    ["Resolution", "Model-specific"],
    ["Channels", "C"],
  ],
};

const prompt = {
  id: "prompt",
  kind: "input",
  label: "Text",
  subtitle: "Language input",
  column: 1,
  row: 1,
  symbol: "text",
  input: "Prompt",
  output: "Text string",
  description:
    "The language input supplies a question, instruction, or context. It follows a separate path before entering the shared sequence.",
  properties: [
    ["Modality", "Text"],
    ["Length", "Variable"],
  ],
};

const embedding = {
  id: "embedding",
  kind: "operation",
  label: "Text embedding",
  subtitle: "Tokenize + embed",
  column: 2,
  row: 1,
  symbol: "tokens",
  input: "Text string",
  output: "T x d_model",
  description:
    "A tokenizer converts text to token IDs, then an embedding table maps those IDs to the language model's hidden dimension.",
  properties: [
    ["Sequence length", "T"],
    ["Hidden width", "d_model"],
  ],
  steps: ["Tokenizer", "Token IDs", "Embedding lookup"],
};

const vision = {
  id: "vision",
  kind: "stack",
  label: "Vision encoder",
  subtitle: "Visual transformer",
  column: 1,
  row: 0,
  symbol: "layers",
  input: "H x W x C",
  output: "N_v x d_v",
  repeat: "L_v",
  description:
    "A visual backbone produces a sequence of image features. The expanded view shows a schematic pre-norm transformer block; the exact block and preprocessing depend on the model.",
  properties: [
    ["Depth", "L_v"],
    ["Visual tokens", "N_v"],
    ["Hidden width", "d_v"],
  ],
  steps: [
    "LayerNorm",
    "Self-attention",
    "+ Residual",
    "LayerNorm + MLP",
    "+ Residual",
  ],
};

const decoder = {
  id: "decoder",
  kind: "stack",
  label: "Language model",
  subtitle: "Causal transformer",
  column: 3,
  row: 0,
  symbol: "layers",
  input: "(N_v + T) x d_model",
  output: "S x d_model",
  repeat: "L",
  description:
    "The language model processes the combined sequence with causal attention. A schematic block is shown here; attention variants, normalization, and layer counts belong to each model's own definition.",
  properties: [
    ["Depth", "L"],
    ["Hidden width", "d_model"],
    ["Attention", "Causal"],
  ],
  steps: [
    "LayerNorm",
    "Causal attention",
    "+ Residual",
    "LayerNorm + MLP",
    "+ Residual",
  ],
};

const output = {
  id: "output",
  kind: "output",
  label: "Next-token logits",
  subtitle: "Language head",
  column: 4,
  row: 0,
  symbol: "output",
  input: "S x d_model",
  output: "S x |V|",
  description:
    "A vocabulary projection produces token logits. Sampling and repeated decoding are outside this single-pass reference graph.",
  properties: [
    ["Projection", "Vocabulary head"],
    ["Vocabulary", "|V|"],
    ["Decoding", "Not expanded"],
  ],
};

const edge = (source, target, label, kind = "data", targetPort = "in") => ({
  id: `${source}-${target}`,
  source,
  target,
  label,
  kind,
  sourcePort: "out",
  targetPort,
});

export const templates = [
  {
    id: "modular-vlm",
    title: "Modular VLM",
    category: "Modular VLMs",
    number: "01",
    subtitle: "Encoder + projector + language model",
    version: DIAGRAM_VERSION,
    evidence: "Reference schematic",
    description:
      "A projector-based visual-language reference. Image features are aligned to the language model's embedding space and combined with embedded text.",
    note: "Symbolic dimensions. No specific checkpoint or training recipe is implied.",
    stages: ["Input", "Encode", "Align", "Fuse + decode", "Output"],
    nodes: [
      image,
      vision,
      {
        id: "projector",
        kind: "operation",
        label: "Projector",
        subtitle: "Modality alignment",
        column: 2,
        row: 0,
        symbol: "projector",
        input: "N_v x d_v",
        output: "N_v x d_model",
        description:
          "A learned bridge maps visual features into the language model's embedding space. This template uses a token-preserving MLP projector; resamplers and cross-attention bridges need their own topology.",
        properties: [
          ["Family", "MLP projector"],
          ["Token count", "Preserved"],
          ["Target width", "d_model"],
        ],
        steps: ["Linear projection", "Activation", "Linear projection"],
      },
      decoder,
      output,
      prompt,
      embedding,
    ],
    edges: [
      edge("image", "vision", "pixels"),
      edge("vision", "projector", "N_v x d_v"),
      edge("projector", "decoder", "N_v x d_model"),
      edge("decoder", "output", "hidden states"),
      edge("prompt", "embedding", "text"),
      edge("embedding", "decoder", "T x d_model", "conditioning", "aux"),
    ],
    sources: [],
  },
  {
    id: "vision-encoder",
    title: "Vision Encoder",
    category: "Vision Encoders",
    number: "02",
    subtitle: "Patch embedding + transformer + features",
    version: DIAGRAM_VERSION,
    evidence: "Reference schematic",
    description:
      "A patch-based vision transformer reference. Spatial patches become a sequence of embeddings, pass through repeated blocks, and produce visual features.",
    note: "Pooling, class tokens, and task-specific heads vary by model and are omitted here.",
    stages: ["Input", "Tokenize", "Encode", "Normalize", "Output"],
    nodes: [
      image,
      {
        id: "patches",
        kind: "operation",
        label: "Patch embedding",
        subtitle: "Patchify + position",
        column: 1,
        row: 0,
        symbol: "patches",
        input: "H x W x C",
        output: "N_v x d_v",
        description:
          "A patch projection maps image regions to embeddings. Positional information is added according to the model's chosen scheme.",
        properties: [
          ["Patch size", "P x P"],
          ["Token count", "N_v"],
          ["Hidden width", "d_v"],
        ],
        steps: ["Patch projection", "Position encoding"],
      },
      {
        ...vision,
        id: "transformer",
        column: 2,
        label: "Vision blocks",
        subtitle: "Transformer stack",
        input: "N_v x d_v",
      },
      {
        id: "norm",
        kind: "operation",
        label: "LayerNorm",
        subtitle: "Feature normalization",
        column: 3,
        row: 0,
        symbol: "norm",
        input: "N_v x d_v",
        output: "N_v x d_v",
        description:
          "Final normalization produces the feature sequence used by a downstream task or multimodal connector.",
        properties: [
          ["Operation", "Normalization"],
          ["Token count", "Preserved"],
        ],
      },
      {
        id: "features",
        kind: "output",
        label: "Visual features",
        subtitle: "Patch-level sequence",
        column: 4,
        row: 0,
        symbol: "tokens",
        input: "N_v x d_v",
        output: "N_v x d_v",
        description:
          "A sequence of visual embeddings. Pooling or token selection must be shown explicitly when present in a concrete model.",
        properties: [
          ["Sequence length", "N_v"],
          ["Hidden width", "d_v"],
        ],
      },
    ],
    edges: [
      edge("image", "patches", "pixels"),
      edge("patches", "transformer", "patch tokens"),
      edge("transformer", "norm", "hidden states"),
      edge("norm", "features", "N_v x d_v"),
    ],
    sources: [],
  },
  {
    id: "native-mllm",
    title: "Native MLLM",
    category: "Native MLLMs",
    number: "03",
    subtitle: "Early fusion with a shared token sequence",
    version: DIAGRAM_VERSION,
    evidence: "Reference schematic",
    description:
      "One early-fusion reference: visual and text representations enter a shared transformer as a mixed sequence. Native multimodal models do not all use this exact design.",
    note: "A reference archetype, not a claim that every native model uses discrete visual tokens.",
    stages: ["Input", "Represent", "Interleave", "Joint modeling", "Output"],
    nodes: [
      image,
      {
        id: "visual-tokens",
        kind: "operation",
        label: "Visual tokenizer",
        subtitle: "Visual representation",
        column: 1,
        row: 0,
        symbol: "patches",
        input: "H x W x C",
        output: "N_v x d_model",
        description:
          "The visual frontend produces embeddings for the shared sequence. A concrete model must specify whether these come from patches, continuous features, or discrete visual codes.",
        properties: [
          ["Representation", "Model-specific"],
          ["Hidden width", "d_model"],
        ],
        steps: ["Visual representation", "Embedding projection"],
      },
      {
        id: "sequence",
        kind: "tokens",
        label: "Mixed sequence",
        subtitle: "Interleaved modalities",
        column: 2,
        row: 0,
        symbol: "mixed",
        input: "Visual + text embeddings",
        output: "S x d_model",
        description:
          "Visual and text embeddings share a sequence. Their ordering, boundaries, and attention mask are defined by the model and task.",
        properties: [
          ["Sequence length", "S"],
          ["Hidden width", "d_model"],
          ["Ordering", "Model-specific"],
        ],
      },
      {
        ...decoder,
        label: "Joint transformer",
        subtitle: "Shared multimodal blocks",
        input: "S x d_model",
      },
      output,
      { ...prompt, column: 0 },
      { ...embedding, column: 1 },
    ],
    edges: [
      edge("image", "visual-tokens", "pixels"),
      edge("visual-tokens", "sequence", "visual tokens"),
      edge("sequence", "decoder", "S x d_model"),
      edge("decoder", "output", "hidden states"),
      edge("prompt", "embedding", "text"),
      edge("embedding", "sequence", "text tokens", "conditioning", "aux"),
    ],
    sources: [],
  },
];

export function nodeHeight(node, expanded) {
  return expanded && node.steps?.length
    ? GEOMETRY.expandedHeight
    : GEOMETRY.height;
}

export function nodePosition(node, expanded) {
  return {
    x: node.column * GEOMETRY.column,
    y:
      GEOMETRY.centerY +
      node.row * GEOMETRY.row -
      nodeHeight(node, expanded) / 2,
  };
}

// Traverse each direction separately so a selected visual branch does not
// accidentally highlight unrelated text inputs at their shared destination.
export function tracePath(template, selectedId) {
  if (!selectedId) return null;
  const ids = new Set([selectedId]);
  for (const direction of ["upstream", "downstream"]) {
    const visited = new Set([selectedId]);
    const pending = [selectedId];
    while (pending.length) {
      const current = pending.pop();
      for (const connection of template.edges) {
        const neighbor =
          direction === "upstream"
            ? connection.target === current && connection.source
            : connection.source === current && connection.target;
        if (neighbor && !visited.has(neighbor)) {
          visited.add(neighbor);
          ids.add(neighbor);
          pending.push(neighbor);
        }
      }
    }
  }
  return ids;
}
