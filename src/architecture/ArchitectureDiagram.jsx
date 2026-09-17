import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  getSmoothStepPath,
  useReactFlow,
} from "@xyflow/react";
import { useReducedMotion } from "motion/react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Focus,
  PanelRight,
  Pause,
  Play,
  X,
} from "lucide-react";
import {
  GEOMETRY,
  NODE_KINDS,
  nodeHeight,
  nodePosition,
  tracePath,
} from "./templates";
import { CAMERA, getDiagramViewport } from "./viewport";
import "@xyflow/react/dist/style.css";
import "./architecture.css";

export function ToolButton({
  label,
  children,
  active,
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      className={`diagram-tool ${active ? "is-on" : ""} ${className}`}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      data-tooltip={label}
      {...props}
    >
      {children}
    </button>
  );
}

function Glyph({ type }) {
  return (
    <div className={`node-glyph glyph-${type}`} aria-hidden="true">
      {type === "text" ? (
        <>
          <span>Aa</span>
          <i />
          <i />
        </>
      ) : type === "layers" ? (
        <>
          <i />
          <i />
          <i />
        </>
      ) : type === "projector" ? (
        <>
          <i />
          <b />
          <i />
        </>
      ) : type === "norm" ? (
        <>
          <i />
          <i />
          <i />
        </>
      ) : type === "output" ? (
        <>
          <span>y</span>
          <i />
          <i />
          <i />
        </>
      ) : (
        Array.from(
          {
            length:
              type === "matrix"
                ? 9
                : type === "image" || type === "patches"
                  ? 12
                  : 7,
          },
          (_, index) => <i key={index} />,
        )
      )}
    </div>
  );
}

const ArchitectureNode = memo(function ArchitectureNode({
  id,
  data,
  selected,
}) {
  const { node, expanded, dimmed, onExpand, concise } = data;
  return (
    <div
      className={`architecture-node kind-${node.kind} ${selected ? "is-selected" : ""} ${expanded ? "is-expanded" : ""} ${dimmed ? "is-dimmed" : ""}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        isConnectable={false}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="aux"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        isConnectable={false}
      />
      {!concise && (
        <div className="node-topline">
          <span>{NODE_KINDS[node.kind]}</span>
          {node.repeat && <code>x {node.repeat}</code>}
        </div>
      )}
      <Glyph type={node.symbol} />
      <div className="node-name">{node.label}</div>
      <div className="node-subtitle">{node.subtitle}</div>
      {expanded && (
        <ol className="node-steps">
          {node.steps.map((step, index) => (
            <li key={step + index}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {step}
            </li>
          ))}
        </ol>
      )}
      {!concise && node.steps?.length > 0 && (
        <button
          type="button"
          className="node-expand nodrag nopan"
          aria-label={`${expanded ? "Collapse" : "Expand"} ${node.label}`}
          aria-expanded={expanded}
          onClick={(event) => {
            event.stopPropagation();
            onExpand(id);
          }}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      )}
    </div>
  );
});

function StageNode({ data }) {
  return (
    <div className="diagram-stage">
      {!data.concise && <span>{String(data.index + 1).padStart(2, "0")}</span>}
      {data.label}
    </div>
  );
}

function SignalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 10,
    offset: 24,
  });
  return (
    <g className={`signal-edge ${data.dimmed ? "is-dimmed" : ""}`}>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke: data.active ? "#191919" : "#898989",
          strokeWidth: data.active ? 1.75 : 1.25,
          strokeDasharray: data.kind === "conditioning" ? "5 5" : undefined,
        }}
      />
      {data.playing && !data.dimmed && (
        <circle r="3" fill="#191919" className="signal-particle">
          <animateMotion dur="2.8s" repeatCount="indefinite" path={path} />
        </circle>
      )}
      {!data.concise && data.label && (
        <EdgeLabelRenderer>
          <div
            className={`signal-label ${data.dimmed ? "is-dimmed" : ""}`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 20}px)`,
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  );
}

const nodeTypes = { architecture: ArchitectureNode, stage: StageNode };
const edgeTypes = { signal: SignalEdge };
const cameraEase = (t) => 1 - (1 - t) ** 3;
const defaultNotation = [
  ["N_v / T", "Visual / text tokens"],
  ["d_v / d_model", "Hidden dimensions"],
  ["L_v / L", "Repeated layers"],
  ["S / |V|", "Sequence / vocabulary"],
];

function Inspector({ template, node, onSelect, onClose }) {
  const isReference = template.evidence === "Reference schematic";
  const connections =
    node &&
    template.edges.filter(
      (edge) => edge.source === node.id || edge.target === node.id,
    );
  return (
    <aside className="diagram-inspector" aria-label="Module details">
      <div className="inspector-top">
        <span>
          {node
            ? "Module details"
            : isReference
              ? "Reference details"
              : "Model details"}
        </span>
        <ToolButton label="Close details" onClick={onClose}>
          <X size={15} />
        </ToolButton>
      </div>
      <div className="inspector-body" key={node?.id || template.id}>
        <div className="inspector-kind">
          {node ? NODE_KINDS[node.kind] : template.evidence}
        </div>
        <h3>{node?.label || template.title}</h3>
        <p>{node?.description || template.description}</p>
        {node ? (
          <>
            <section className="inspector-section">
              <h4>Tensor interface</h4>
              <dl className="tensor-interface">
                <div>
                  <dt>IN</dt>
                  <dd>{node.input}</dd>
                </div>
                <div>
                  <dt>OUT</dt>
                  <dd>{node.output}</dd>
                </div>
              </dl>
            </section>
            <section className="inspector-section">
              <h4>Properties</h4>
              <dl className="node-properties">
                {node.properties.map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            {node.steps && (
              <section className="inspector-section">
                <h4>
                  Inside the module{" "}
                  {node.repeat && <span>x {node.repeat}</span>}
                </h4>
                <ol className="inspector-steps">
                  {node.steps.map((step, index) => (
                    <li key={step + index}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </section>
            )}
            <section className="inspector-section">
              <h4>Connections</h4>
              <div className="inspector-node-list">
                {connections.map((edge) => {
                  const isInput = edge.target === node.id;
                  const neighbor = template.nodes.find(
                    (entry) =>
                      entry.id === (isInput ? edge.source : edge.target),
                  );
                  return (
                    <button
                      key={edge.id}
                      type="button"
                      onClick={() => onSelect(neighbor.id)}
                    >
                      <span>{isInput ? "IN" : "OUT"}</span>
                      {neighbor.label}
                      {isInput ? (
                        <ArrowLeft size={12} />
                      ) : (
                        <ArrowRight size={12} />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="inspector-section">
              <h4>
                Modules{" "}
                <span>{String(template.nodes.length).padStart(2, "0")}</span>
              </h4>
              <div className="inspector-node-list">
                {template.nodes.map((entry, index) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onSelect(entry.id)}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {entry.label}
                    <ArrowUpRight size={12} />
                  </button>
                ))}
              </div>
            </section>
            <section className="inspector-section">
              <h4>Notation</h4>
              <dl className="node-properties">
                {(template.notation || defaultNotation).map(
                  ([symbol, meaning]) => (
                    <div key={symbol}>
                      <dt>{symbol}</dt>
                      <dd>{meaning}</dd>
                    </div>
                  ),
                )}
              </dl>
            </section>
          </>
        )}
        <div className="inspector-note">
          <span>{isReference ? "REFERENCE ONLY" : "SCOPE"}</span>
          <p>{template.note}</p>
        </div>
        {template.sources.length > 0 && (
          <section className="inspector-section">
            <h4>Sources</h4>
            <div className="inspector-sources">
              {template.sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>
                    {source.title}
                    <ArrowUpRight size={12} />
                  </span>
                  <small>{source.location}</small>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}

function DiagramCanvas({ template, concise }) {
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [inspectorOpen, setInspectorOpen] = useState(
    () => !concise && window.matchMedia("(min-width: 1100px)").matches,
  );
  const reducedMotion = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const canvasRef = useRef(null);
  const pointerGesture = useRef(null);
  const cameraReady = useRef(false);
  const { setViewport, viewportInitialized } = useReactFlow();
  const activeId = hoveredId || selectedId;
  const path = useMemo(
    () => tracePath(template, activeId),
    [template, activeId],
  );
  const selectedNode = template.nodes.find((node) => node.id === selectedId);
  const templateDownload = useMemo(
    () =>
      `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(template, null, 2) + "\n")}`,
    [template],
  );
  const selectNode = useCallback((id) => {
    setSelectedId(id);
    setHoveredId(null);
    setInspectorOpen(true);
  }, []);
  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setHoveredId(null);
  }, []);
  const closeDetails = () => {
    clearSelection();
    setInspectorOpen(false);
  };
  const expandNode = useCallback(
    (id) => {
      selectNode(id);
      setExpandedIds((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [selectNode],
  );

  const nodes = useMemo(
    () => [
      ...template.stages.map((label, index) => ({
        id: `stage-${index}`,
        type: "stage",
        position: { x: index * GEOMETRY.column, y: 0 },
        data: { label, index, concise },
        selectable: false,
        focusable: false,
        draggable: false,
        hidden: !!selectedId,
        style: { width: GEOMETRY.width, height: GEOMETRY.stageHeight },
      })),
      ...template.nodes.map((node) => ({
        id: node.id,
        type: "architecture",
        className: "nopan",
        position: nodePosition(node, expandedIds.has(node.id)),
        data: {
          node,
          expanded: expandedIds.has(node.id),
          dimmed: path && !path.has(node.id),
          onExpand: expandNode,
          concise,
        },
        selected: node.id === selectedId,
        ariaLabel: `${node.label}, ${NODE_KINDS[node.kind]}`,
        style: {
          width: GEOMETRY.width,
          height: nodeHeight(node, expandedIds.has(node.id)),
        },
      })),
    ],
    [template, expandedIds, selectedId, path, expandNode, concise],
  );

  const edges = useMemo(
    () =>
      template.edges.map((edge) => {
        const active = !!path && path.has(edge.source) && path.has(edge.target);
        return {
          ...edge,
          type: "signal",
          sourceHandle: edge.sourcePort,
          targetHandle: edge.targetPort,
          selectable: false,
          focusable: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: active ? "#191919" : "#898989",
            width: 14,
            height: 14,
          },
          data: {
            label: edge.label,
            kind: edge.kind,
            active,
            dimmed: !!path && !active,
            playing: playing && !reducedMotion,
            concise,
          },
        };
      }),
    [template, path, playing, reducedMotion, concise],
  );

  useEffect(() => {
    if (!viewportInitialized) return;
    let frame;
    const updateCamera = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const viewport = getDiagramViewport({
          template,
          expandedIds,
          selectedId,
          width: canvasRef.current.clientWidth,
          height: canvasRef.current.clientHeight,
        });
        if (!viewport) return;
        setViewport(viewport, {
          duration: cameraReady.current && !reducedMotion ? CAMERA.duration : 0,
          ease: cameraEase,
          interpolate: "linear",
        });
        cameraReady.current = true;
      });
    };
    // A single camera owner keeps panel resizing and detail focus in sync.
    const observer = new ResizeObserver(updateCamera);
    observer.observe(canvasRef.current);
    updateCamera();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [
    template,
    expandedIds,
    selectedId,
    reducedMotion,
    setViewport,
    viewportInitialized,
  ]);

  return (
    <div
      className={`diagram-workbench ${concise ? "is-concise" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          clearSelection();
        }
      }}
    >
      <div className="diagram-toolbar">
        {concise ? (
          <span className="diagram-model-summary">{template.subtitle}</span>
        ) : (
          <div className="diagram-identity">
            <span className="diagram-reference-number">{template.number}</span>
            <div>
              <strong>{template.title}</strong>
              <span>{template.subtitle}</span>
            </div>
          </div>
        )}
        <div className="diagram-actions">
          {concise ? (
            <ToolButton
              label="Overview"
              active={!selectedId}
              onClick={clearSelection}
            >
              <Focus size={17} />
            </ToolButton>
          ) : (
            <div
              className="diagram-segmented"
              role="group"
              aria-label="Level of detail"
            >
              <button
                type="button"
                aria-pressed={!selectedId && expandedIds.size === 0}
                onClick={() => {
                  clearSelection();
                  setExpandedIds(new Set());
                }}
              >
                Overview
              </button>
              <button
                type="button"
                aria-pressed={!selectedId && expandedIds.size > 0}
                onClick={() => {
                  clearSelection();
                  setExpandedIds(
                    new Set(
                      template.nodes
                        .filter((node) => node.steps?.length)
                        .map((node) => node.id),
                    ),
                  );
                }}
              >
                Expanded
              </button>
            </div>
          )}
          <span className="control-divider" />
          <ToolButton
            label={playing ? "Pause signal flow" : "Animate signal flow"}
            active={playing}
            disabled={!!reducedMotion}
            onClick={() => setPlaying((value) => !value)}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </ToolButton>
          <ToolButton
            label="Module details"
            active={inspectorOpen}
            onClick={() => {
              if (inspectorOpen) closeDetails();
              else setInspectorOpen(true);
            }}
          >
            <PanelRight size={17} />
          </ToolButton>
          <a
            className="diagram-tool"
            aria-label="Download architecture JSON"
            data-tooltip="Download architecture JSON"
            href={templateDownload}
            download={`${template.id}.architecture.json`}
          >
            <ArrowDownToLine size={17} />
          </a>
        </div>
      </div>
      <div className={`diagram-body ${inspectorOpen ? "has-inspector" : ""}`}>
        <div
          className="diagram-canvas"
          ref={canvasRef}
          onPointerDownCapture={(event) => {
            pointerGesture.current = {
              x: event.clientX,
              y: event.clientY,
              moved: false,
            };
          }}
          onPointerMoveCapture={(event) => {
            const gesture = pointerGesture.current;
            if (
              gesture &&
              event.buttons &&
              Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) >
                6
            ) {
              gesture.moved = true;
            }
          }}
          onPointerCancelCapture={() => {
            pointerGesture.current = null;
          }}
          onClickCapture={(event) => {
            // A drag must not become a click that selects or dismisses details.
            const gesture = pointerGesture.current;
            pointerGesture.current = null;
            if (event.detail > 0 && gesture?.moved) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
        >
          {!concise && (
            <div className="canvas-caption">
              <span>FIG. {template.number}</span>
              <span>{template.evidence}</span>
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            edgesReconnectable={false}
            deleteKeyCode={null}
            multiSelectionKeyCode={null}
            selectionKeyCode={null}
            minZoom={CAMERA.minZoom}
            maxZoom={CAMERA.focusMaxZoom}
            panOnDrag={false}
            panOnScroll={false}
            panActivationKeyCode={null}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            zoomActivationKeyCode={null}
            autoPanOnNodeFocus={false}
            autoPanOnNodeDrag={false}
            autoPanOnSelection={false}
            selectionOnDrag={false}
            preventScrolling={false}
            onNodeClick={(event, node) => {
              event.stopPropagation();
              if (node.type === "architecture") selectNode(node.id);
            }}
            onNodeMouseEnter={(_, node) => {
              if (node.type === "architecture") setHoveredId(node.id);
            }}
            onNodeMouseLeave={() => setHoveredId(null)}
            onPaneClick={clearSelection}
            onNodesChange={(changes) => {
              const selected = changes.find(
                (change) => change.type === "select" && change.selected,
              );
              if (
                selected &&
                template.nodes.some((node) => node.id === selected.id)
              )
                selectNode(selected.id);
            }}
            aria-label={`${template.title} architecture diagram`}
            attributionPosition="bottom-right"
          >
            <Background
              variant={BackgroundVariant.Lines}
              gap={32}
              lineWidth={0.5}
              color="#eeeeee"
            />
          </ReactFlow>
          {!concise && (
            <div className="canvas-meta">
              {template.nodes.length} modules <span>/</span>{" "}
              {template.edges.length} connections
            </div>
          )}
        </div>
        {inspectorOpen && (
          <Inspector
            template={template}
            node={selectedNode}
            onSelect={selectNode}
            onClose={closeDetails}
          />
        )}
      </div>
      {!concise && (
        <div className="diagram-legend" aria-label="Diagram legend">
          <div className="legend-nodes">
            <span>
              <i className="legend-input" />
              Input
            </span>
            <span>
              <i className="legend-operation" />
              Operation
            </span>
            <span>
              <i className="legend-stack" />
              Repeated block
            </span>
            <span>
              <i className="legend-tokens" />
              Token sequence
            </span>
            <span>
              <i className="legend-output" />
              Output
            </span>
          </div>
          <div className="legend-edges">
            <span>
              <i />
              Data
            </span>
            <span>
              <i className="is-dashed" />
              Conditioning
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArchitectureDiagram({ template, concise = false }) {
  return (
    <ReactFlowProvider key={template.id}>
      <DiagramCanvas template={template} concise={concise} />
    </ReactFlowProvider>
  );
}
