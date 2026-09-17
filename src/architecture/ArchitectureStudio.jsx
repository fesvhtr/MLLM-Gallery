import React from "react";
import { Download, FileText } from "lucide-react";
import ArchitectureDiagram from "./ArchitectureDiagram";
import { DIAGRAM_VERSION, templates } from "./templates";
import specification from "../../docs/architecture-diagram-standard.md?raw";

const specificationDownload = `data:text/markdown;charset=utf-8,${encodeURIComponent(specification)}`;

export default function ArchitectureStudio({ templateId, onTemplateChange }) {
  const template =
    templates.find((entry) => entry.id === templateId) || templates[0];
  return (
    <section
      className="architecture-studio"
      aria-label="Architecture design system"
    >
      <header className="studio-header">
        <div className="studio-title">
          <span className="studio-eyebrow">
            MLLM GALLERY / DESIGN REFERENCE
          </span>
          <h1>
            Architecture system<span>v{DIAGRAM_VERSION}</span>
          </h1>
        </div>
        <a
          className="spec-download"
          aria-label="Download diagram specification"
          title="Download diagram specification"
          href={specificationDownload}
          download="MLLM-Gallery-Diagram-Standard.md"
        >
          <FileText size={15} />
          <span>Specification</span>
          <Download size={13} />
        </a>
      </header>
      <div className="studio-navigation">
        <div
          className="studio-tabs"
          role="tablist"
          aria-label="Reference architectures"
        >
          {templates.map((entry, index) => (
            <button
              key={entry.id}
              role="tab"
              type="button"
              aria-selected={entry.id === template.id}
              tabIndex={entry.id === template.id ? 0 : -1}
              aria-controls="architecture-reference"
              id={`template-${entry.id}`}
              onClick={() => onTemplateChange(entry.id)}
              onKeyDown={(event) => {
                const targets = {
                  ArrowRight: (index + 1) % templates.length,
                  ArrowLeft: (index + templates.length - 1) % templates.length,
                  Home: 0,
                  End: templates.length - 1,
                };
                if (!(event.key in targets)) return;
                event.preventDefault();
                const next = targets[event.key];
                event.currentTarget.parentElement.children[next].focus();
                onTemplateChange(templates[next].id);
              }}
            >
              <span>{entry.number}</span>
              {entry.title}
            </button>
          ))}
        </div>
        <div className="studio-palette" aria-label="Monochrome palette">
          <i title="#191919" />
          <i title="#707070" />
          <i title="#D4D4D4" />
          <i title="#F4F4F4" />
          <i title="#FFFFFF" />
        </div>
      </div>
      <div
        id="architecture-reference"
        role="tabpanel"
        aria-labelledby={`template-${template.id}`}
        className="studio-reference"
      >
        <ArchitectureDiagram template={template} />
      </div>
    </section>
  );
}
