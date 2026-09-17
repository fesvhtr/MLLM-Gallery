import React from "react";
import { ArrowUpRight, FileText, Code2 } from "lucide-react";
import ArchitectureDiagram from "./ArchitectureDiagram";
import { clip } from "./models/clip";

export default function ModelArchitecture({ modelId }) {
  if (modelId !== clip.id) {
    return (
      <section className="architecture-studio model-architecture">
        <h1>Model not found</h1>
        <a href="#/vision-encoders">
          Vision Encoders <ArrowUpRight size={14} />
        </a>
      </section>
    );
  }

  return (
    <section
      className="architecture-studio model-architecture"
      aria-label="CLIP architecture"
    >
      <header className="studio-header model-header">
        <div className="studio-title">
          <span className="studio-eyebrow">
            VISION ENCODERS / OPENAI / 2021
          </span>
          <h1>
            CLIP<span>{clip.checkpoint}</span>
          </h1>
        </div>
        <div className="model-source-links">
          <a
            href={clip.sources[0].url}
            target="_blank"
            rel="noreferrer"
            aria-label="CLIP paper"
          >
            <FileText size={15} />
            <span>Paper</span>
            <ArrowUpRight size={12} />
          </a>
          <a
            href="https://github.com/openai/CLIP"
            target="_blank"
            rel="noreferrer"
            aria-label="CLIP official code"
          >
            <Code2 size={15} />
            <span>Code</span>
            <ArrowUpRight size={12} />
          </a>
        </div>
      </header>
      <ArchitectureDiagram template={clip} concise />
    </section>
  );
}
