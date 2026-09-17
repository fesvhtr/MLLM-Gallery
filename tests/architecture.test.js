import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import {
  templates,
  GEOMETRY,
  nodeHeight,
  nodePosition,
  tracePath,
} from "../src/architecture/templates.js";
import { CAMERA, getDiagramViewport } from "../src/architecture/viewport.js";
import { clip } from "../src/architecture/models/clip.js";

const diagrams = [...templates, clip];

const schema = JSON.parse(
  readFileSync(
    new URL("../docs/architecture.schema.json", import.meta.url),
    "utf8",
  ),
);
const validate = new Ajv2020().compile(schema);

for (const template of diagrams) {
  test(`${template.id}: exported data follows the generation contract`, () => {
    const exported = JSON.parse(JSON.stringify(template));
    assert.ok(validate(exported), JSON.stringify(validate.errors));
    assert.deepEqual(exported, template);
  });

  test(`${template.id}: edges have real, unique endpoints and supported ports`, () => {
    const ids = new Set(template.nodes.map((node) => node.id));
    assert.equal(ids.size, template.nodes.length);
    assert.equal(
      new Set(template.edges.map((edge) => edge.id)).size,
      template.edges.length,
    );
    for (const edge of template.edges) {
      assert.ok(ids.has(edge.source), `Missing source: ${edge.source}`);
      assert.ok(ids.has(edge.target), `Missing target: ${edge.target}`);
      assert.notEqual(edge.source, edge.target);
      assert.equal(edge.sourcePort, "out");
      assert.ok(["in", "aux"].includes(edge.targetPort));
    }
    for (const node of template.nodes)
      assert.ok(node.column < template.stages.length);
  });

  test(`${template.id}: all expansion combinations preserve spacing`, () => {
    const expandable = template.nodes.filter((node) => node.steps?.length);
    for (let mask = 0; mask < 2 ** expandable.length; mask++) {
      const expanded = new Set(
        expandable
          .filter((_, index) => mask & (1 << index))
          .map((node) => node.id),
      );
      const rects = template.nodes.map((node) => ({
        id: node.id,
        ...nodePosition(node, expanded.has(node.id)),
        width: GEOMETRY.width,
        height:
          nodeHeight(node, expanded.has(node.id)) +
          (node.kind === "stack" ? 9 : 0),
      }));
      for (const rect of rects) {
        assert.ok(
          rect.y >= GEOMETRY.stageHeight + 16,
          `${rect.id} collides with the stage heading`,
        );
        assert.equal(rect.x % GEOMETRY.grid, 0);
        assert.equal(rect.y % GEOMETRY.grid, 0);
      }
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i],
            b = rects[j];
          const separated =
            a.x + a.width + 24 <= b.x ||
            b.x + b.width + 24 <= a.x ||
            a.y + a.height + 24 <= b.y ||
            b.y + b.height + 24 <= a.y;
          assert.ok(
            separated,
            `${a.id} and ${b.id} overlap in expansion state ${mask}`,
          );
        }
      }
    }
  });
}

test("visual-path selection does not sweep into the text branch", () => {
  assert.deepEqual(
    [...tracePath(templates[0], "vision")].sort(),
    ["image", "vision", "projector", "decoder", "output"].sort(),
  );
  assert.deepEqual(
    [...tracePath(templates[0], "embedding")].sort(),
    ["prompt", "embedding", "decoder", "output"].sort(),
  );
});

test("a fusion point includes both upstream modalities", () => {
  assert.equal(
    tracePath(templates[0], "decoder").size,
    templates[0].nodes.length,
  );
  assert.equal(tracePath(templates[0], null), null);
});

test("path traversal terminates on recurrent edges", () => {
  const cyclic = {
    edges: [
      { source: "a", target: "b" },
      { source: "b", target: "a" },
    ],
  };
  assert.deepEqual([...tracePath(cyclic, "a")].sort(), ["a", "b"]);
});

test("verified architectures require at least one source", () => {
  assert.equal(
    validate({ ...templates[0], evidence: "Source-verified architecture" }),
    false,
  );
});

test("schema rejects unsupported presentation and port overrides", () => {
  assert.equal(validate({ ...templates[0], color: "red" }), false);
  const badPort = {
    ...templates[0],
    edges: [{ ...templates[0].edges[0], targetPort: "unknown" }],
  };
  assert.equal(validate(badPort), false);
});

const canvasSizes = [
  { width: 1092, height: 550 },
  { width: 420, height: 460 },
  { width: 356, height: 256 },
  { width: 286, height: 160 },
];

function assertFramed(viewport, rect, size) {
  const left = rect.x * viewport.zoom + viewport.x;
  const top = rect.y * viewport.zoom + viewport.y;
  // React Flow rounds the padding correction to screen pixels.
  const tolerance = 1.1;
  assert.ok(left >= 24 - tolerance, `Left margin: ${left}`);
  assert.ok(top >= 48 - tolerance, `Top margin: ${top}`);
  assert.ok(left + rect.width * viewport.zoom <= size.width - 24 + tolerance);
  assert.ok(top + rect.height * viewport.zoom <= size.height - 40 + tolerance);
}

for (const template of diagrams) {
  test(`${template.id}: overview frames every module and stage on desktop/mobile`, () => {
    for (const expandedIds of [
      new Set(),
      new Set(
        template.nodes
          .filter((node) => node.steps?.length)
          .map((node) => node.id),
      ),
    ]) {
      for (const size of canvasSizes) {
        const viewport = getDiagramViewport({
          template,
          expandedIds,
          selectedId: null,
          ...size,
        });
        assert.ok(viewport.zoom <= CAMERA.overviewMaxZoom);
        for (const node of template.nodes) {
          assertFramed(
            viewport,
            {
              ...nodePosition(node, expandedIds.has(node.id)),
              width: GEOMETRY.width,
              height:
                nodeHeight(node, expandedIds.has(node.id)) +
                (node.kind === "stack" ? 9 : 0),
            },
            size,
          );
        }
        template.stages.forEach((_, index) =>
          assertFramed(
            viewport,
            {
              x: index * GEOMETRY.column,
              y: 0,
              width: GEOMETRY.width,
              height: GEOMETRY.stageHeight,
            },
            size,
          ),
        );
      }
    }
  });

  test(`${template.id}: inspecting each module zooms to bounded, visible details`, () => {
    for (const node of template.nodes) {
      for (const expandedIds of [new Set(), new Set([node.id])]) {
        for (const size of canvasSizes) {
          const options = { template, expandedIds, ...size };
          const overview = getDiagramViewport({ ...options, selectedId: null });
          const focused = getDiagramViewport({
            ...options,
            selectedId: node.id,
          });
          assert.ok(focused.zoom > overview.zoom);
          assert.ok(focused.zoom <= CAMERA.focusMaxZoom);
          assertFramed(
            focused,
            {
              ...nodePosition(node, expandedIds.has(node.id)),
              width: GEOMETRY.width,
              height:
                nodeHeight(node, expandedIds.has(node.id)) +
                (node.kind === "stack" ? 9 : 0),
            },
            size,
          );
          assert.deepEqual(
            getDiagramViewport({ ...options, selectedId: node.id }),
            focused,
          );
          assert.deepEqual(
            getDiagramViewport({ ...options, selectedId: null }),
            overview,
          );
        }
      }
    }
  });
}

test("camera waits for a measurable canvas and falls back for unknown selection", () => {
  const options = {
    template: templates[0],
    expandedIds: new Set(),
    width: 1000,
    height: 600,
  };
  assert.equal(getDiagramViewport({ ...options, width: 0 }), null);
  assert.equal(getDiagramViewport({ ...options, height: 0 }), null);
  assert.deepEqual(
    getDiagramViewport({ ...options, selectedId: "missing" }),
    getDiagramViewport({ ...options, selectedId: null }),
  );
});

test("CLIP uses only the original ViT-L/14 224-pixel parameter set", () => {
  assert.equal(clip.checkpoint, "ViT-L/14");
  const nodes = new Map(clip.nodes.map((node) => [node.id, node]));
  const properties = (id) => Object.fromEntries(nodes.get(id).properties);
  assert.equal(properties("image").Resolution, "224 x 224");
  assert.equal(properties("vision-encoder")["Transformer layers"], "24");
  assert.equal(properties("vision-encoder")["Hidden width"], "1024");
  assert.equal(properties("vision-encoder")["Patch size"], "14 x 14");
  assert.equal(properties("text-encoder")["Transformer layers"], "12");
  assert.equal(properties("text-encoder")["Hidden width"], "768");
  assert.equal(
    nodes.get("vision-encoder").output,
    nodes.get("image-projection").input,
  );
  assert.equal(
    nodes.get("text-encoder").output,
    nodes.get("text-projection").input,
  );
  assert.equal(
    nodes.get("image-projection").output,
    nodes.get("image-embedding").input,
  );
  assert.equal(
    nodes.get("text-projection").output,
    nodes.get("text-embedding").input,
  );
  assert.equal(nodes.get("similarity").output, "B x K logits");
});

test("CLIP keeps independent towers and merges them only at similarity", () => {
  assert.deepEqual(
    [...tracePath(clip, "vision-encoder")].sort(),
    [
      "image",
      "vision-encoder",
      "image-projection",
      "image-embedding",
      "similarity",
    ].sort(),
  );
  assert.deepEqual(
    [...tracePath(clip, "text-encoder")].sort(),
    [
      "text",
      "text-encoder",
      "text-projection",
      "text-embedding",
      "similarity",
    ].sort(),
  );
  assert.equal(tracePath(clip, "similarity").size, clip.nodes.length);
  assert.ok(clip.edges.every((edge) => edge.kind === "data"));
  assert.equal(
    clip.edges.find((edge) => edge.source === "text-embedding").targetPort,
    "aux",
  );
});

test("CLIP stays a concise, sourced nine-module diagram", () => {
  assert.equal(clip.nodes.length, 9);
  assert.equal(clip.evidence, "Source-verified architecture");
  assert.ok(
    clip.sources.some((source) => source.location.includes("Table 20")),
  );
  assert.ok(
    clip.sources.some((source) => source.url.endsWith("clip/model.py")),
  );
  assert.equal(clip.nodes.filter((node) => node.kind === "output").length, 1);
  assert.ok(clip.nodes.every((node) => !node.id.includes("loss")));
});
