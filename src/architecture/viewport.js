import { getViewportForBounds } from "@xyflow/react";
import { GEOMETRY, nodeHeight, nodePosition } from "./templates.js";

export const CAMERA = {
  minZoom: 0.01,
  overviewMaxZoom: 1,
  focusMaxZoom: 1.15,
  duration: 440,
};

export function getDiagramViewport({
  template,
  expandedIds,
  selectedId,
  width,
  height,
}) {
  if (width <= 0 || height <= 0) return null;

  const selected = template.nodes.find((node) => node.id === selectedId);
  const rects = (selected ? [selected] : template.nodes).map((node) => ({
    ...nodePosition(node, expandedIds.has(node.id)),
    width: GEOMETRY.width,
    height:
      nodeHeight(node, expandedIds.has(node.id)) +
      (node.kind === "stack" ? 9 : 0),
  }));

  if (!selected) {
    rects.push(
      ...template.stages.map((_, index) => ({
        x: index * GEOMETRY.column,
        y: 0,
        width: GEOMETRY.width,
        height: GEOMETRY.stageHeight,
      })),
    );
  }

  const x = Math.min(...rects.map((rect) => rect.x));
  const y = Math.min(...rects.map((rect) => rect.y));
  const bounds = {
    x,
    y,
    width: Math.max(...rects.map((rect) => rect.x + rect.width)) - x,
    height: Math.max(...rects.map((rect) => rect.y + rect.height)) - y,
  };

  // Reserve screen-space margins for the caption, ports, and stack outlines.
  return getViewportForBounds(
    bounds,
    width,
    height,
    CAMERA.minZoom,
    selected ? CAMERA.focusMaxZoom : CAMERA.overviewMaxZoom,
    { x: "24px", top: "48px", bottom: "40px" },
  );
}
