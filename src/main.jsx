import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { motion } from "motion/react";
import "./styles.css";

const backgroundVideoUrl = "";

const ease = [0.16, 1, 0.3, 1];

const navItems = [
  { label: "Vision Encoders", id: "vision-encoders" },
  { label: "Modular VLMs", id: "modular-vlms" },
  { label: "Native MLLMs", id: "native-mllms" },
  { label: "Compare", id: "compare" },
  { label: "About Me", href: "https://www.sczhang.com", external: true }
];

const models = [
  {
    name: "Qwen2.5-VL",
    label: "Dynamic Vision",
    year: "2025",
    detail: "native resolution, video, grounding"
  },
  {
    name: "InternVL3",
    label: "Native Pretraining",
    year: "2025",
    detail: "variable visual positions"
  },
  {
    name: "Molmo",
    label: "Open Grounding",
    year: "2024",
    detail: "pointing supervision"
  },
  {
    name: "Pixtral",
    label: "Document Vision",
    year: "2024",
    detail: "long context images"
  }
];

const sections = [
  {
    id: "vision-encoders",
    eyebrow: "01 / Components",
    title: "Vision Encoders",
    summary:
      "The visual front-end that turns pixels, pages, frames, and regions into tokens a language system can consume.",
    metrics: ["CLIP / SigLIP", "EVA / DINOv2", "ViT / SAM-style"],
    cards: [
      ["Contrastive towers", "CLIP and SigLIP remain the default foundation for fast image-language alignment."],
      ["High-resolution vision", "Dynamic tiling, native aspect ratios, and patch budgets decide how much visual detail survives."],
      ["Specialized perception", "Document, grounding, and segmentation encoders can be compared by token density and spatial fidelity."]
    ]
  },
  {
    id: "modular-vlms",
    eyebrow: "02 / Families",
    title: "Modular VLMs",
    summary:
      "The classic MLLM stack: a vision encoder, a bridge layer, and a pretrained language model trained into one interface.",
    metrics: ["LLaVA", "Qwen-VL", "InternVL / Molmo"],
    cards: [
      ["Projector-first models", "Simple MLP connectors are still strong baselines when paired with high-quality instruction data."],
      ["Document and video VLMs", "Modern families extend the same stack with multi-image, OCR, chart, and temporal reasoning data."],
      ["Open ecosystem", "Open-weight VLMs make architecture choices inspectable across scale, data recipe, and benchmark behavior."]
    ]
  },
  {
    id: "native-mllms",
    eyebrow: "03 / Native Systems",
    title: "Native MLLMs",
    summary:
      "Models that treat multimodal tokens as a first-class language, rather than only attaching vision after text pretraining.",
    metrics: ["Fuyu", "Chameleon", "GPT-4o / Gemini-style"],
    cards: [
      ["Unified token streams", "Image patches, visual codes, and text can share one autoregressive or mixed-token modeling path."],
      ["Early fusion", "The model learns multimodal structure deeper in the stack instead of relying on a shallow connector."],
      ["Harder to inspect", "Closed native systems often expose strong capabilities but fewer architecture details than modular models."]
    ]
  },
  {
    id: "compare",
    eyebrow: "04 / Workspace",
    title: "Compare",
    summary:
      "A clean comparison surface for architecture, modality support, openness, scale, training recipe, and serving cost.",
    metrics: ["Architecture", "Modality", "Training"],
    cards: [
      ["Architecture filters", "Projector, Q-Former, resampler, cross-attention, visual expert, native tokens, and MoE."],
      ["Capability filters", "Single image, multi-image, video, document, OCR, grounding, coordinates, and long context."],
      ["Operational filters", "Open weights, license class, parameter scale, image-token budget, and deployment footprint."]
    ]
  }
];

function LogoIcon() {
  return (
    <svg className="logo-icon" viewBox="0 0 38 38" aria-hidden="true">
      <rect x="10" y="7" width="8" height="25" rx="4" transform="rotate(-35 14 19.5)" />
      <rect x="20" y="6" width="8" height="26" rx="4" transform="rotate(-35 24 19)" />
    </svg>
  );
}

function Navbar({ currentPage, onNavigate, onHome }) {
  return (
    <motion.nav
      className="navbar"
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease }}
    >
      <button className="brand" onClick={onHome} type="button" aria-label="MLLM Gallery home">
        <LogoIcon />
        <span>MLLM Gallery</span>
      </button>

      <div className="nav-links" aria-label="Gallery sections">
        {navItems.map((item, index) => (
          item.external ? (
            <motion.a
              className="nav-link nav-link-external"
              href={item.href}
              key={item.href}
              rel="noreferrer"
              target="_blank"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.25, ease }}
            >
              {item.label}
            </motion.a>
          ) : (
            <motion.button
              className={[
                "nav-link",
                currentPage === item.id ? "is-active" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.25, ease }}
            >
              {item.label}
              <span className="nav-popover">
                <strong>{sections.find((section) => section.id === item.id)?.title}</strong>
                <small>{sections.find((section) => section.id === item.id)?.summary}</small>
              </span>
            </motion.button>
          )
        ))}
      </div>
    </motion.nav>
  );
}

function BackgroundLayer() {
  return (
    <motion.div
      className="background-wrap"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.8, ease }}
    >
      {backgroundVideoUrl ? (
        <video
          className="hero-video"
          src={backgroundVideoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        <div className="ambient-field" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
      <div className="background-shade" />
    </motion.div>
  );
}

function ModelStrip() {
  return (
    <motion.div
      className="model-strip"
      initial={{ y: 14, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, delay: 1.05, ease }}
    >
      {models.map((model) => (
        <article className="model-chip" key={model.name}>
          <div>
            <strong>{model.name}</strong>
            <span>{model.label}</span>
          </div>
          <p>
            {model.year} / {model.detail}
          </p>
        </article>
      ))}
    </motion.div>
  );
}

function FooterHero({ onNavigate }) {
  return (
    <motion.footer
      className="footer-hero"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, delay: 0.5, ease }}
    >
      <div className="footer-left">
        <motion.div
          className="hero-watermark"
          aria-hidden="true"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.55, ease }}
        >
          <span>MLLM Gallery</span>
        </motion.div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.65, ease }}
        >
          Look Closer.
          <br />
          <span className="title-indent">Think Wider.</span>
        </motion.h1>

        <motion.div
          className="hero-actions"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.85, ease }}
        >
          <button className="button button-dark" onClick={() => onNavigate("modular-vlms")} type="button">
            Explore Models
          </button>
          <button className="button button-light" onClick={() => onNavigate("vision-encoders")} type="button">
            How It Works
          </button>
        </motion.div>
      </div>

      <div className="footer-right">
        <div className="recent-label">
          <span className="recent-dot" />
          <span>Recent Update</span>
        </div>
        <ModelStrip />
      </div>
    </motion.footer>
  );
}

function CategoryGallery({ section }) {
  return (
    <motion.section
      className="gallery-view"
      key={section.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease }}
    >
      <div className="gallery-kicker">
        <span>{section.eyebrow}</span>
      </div>

      <div className="gallery-head">
        <h2>{section.title}</h2>
        <p>{section.summary}</p>
      </div>

      <div className="filter-row" aria-label={`${section.title} filters`}>
        {section.metrics.map((metric) => (
          <button className="filter-chip" key={metric} type="button">
            {metric}
          </button>
        ))}
        <button className="filter-chip" type="button">Architecture</button>
        <button className="filter-chip" type="button">Modality</button>
        <button className="filter-chip" type="button">Open Source</button>
      </div>

      <div className="gallery-grid">
        {section.cards.map(([title, copy], index) => (
          <motion.article
            className="gallery-card"
            key={title}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 * index, ease }}
            whileHover={{ y: -6 }}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const selectedSection =
    sections.find((section) => section.id === currentPage) || sections[1];
  const navigateHome = () => setCurrentPage("home");
  const navigateTo = (id) => setCurrentPage(id);

  return (
    <>
      <Navbar currentPage={currentPage} onNavigate={navigateTo} onHome={navigateHome} />
      <main>
        {currentPage === "home" ? (
          <section id="top" className="landing">
            <BackgroundLayer />

            <section className="center-panel" aria-label="MLLM architecture flow">
              <motion.div
                className="flow-card"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.15, ease }}
              >
                <span>Image / Video / Document</span>
                <i />
                <span>Vision Encoder</span>
                <i />
              <span>Connector</span>
              <i />
              <span>LLM Decoder</span>
            </motion.div>
          </section>

            <FooterHero onNavigate={navigateTo} />
          </section>
        ) : (
          <CategoryGallery section={selectedSection} />
        )}
      </main>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
