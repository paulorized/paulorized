"use client";

/**
 * CannabisLoader — PNG flipbook loader (seed → mature plant loop).
 *
 * Expects 6 PNG frames at:
 *   public/loader/scan/1.png    ... 6.png    (emerald scan version)
 *   public/loader/strain/1.png  ... 6.png    (purple StrainAI version, optional)
 *
 * Usage:
 *   <CannabisLoader variant="scan"   label="Scanning" />
 *   <CannabisLoader variant="strain" label="Consulting StrainAI" size={96} />
 */

import React, { useEffect, useState } from "react";

type Variant = "scan" | "strain";

interface CannabisLoaderProps {
  /** "scan" = emerald frames, "strain" = purple frames (default "scan") */
  variant?: Variant;
  /** Pixel size of the loader square (default 96) */
  size?: number;
  /** Text under the loader with animated ellipsis. Omit to hide. */
  label?: string;
  /** Full animation cycle length in seconds (default 3) */
  cycleSeconds?: number;
  /** Extra className for the outer wrapper */
  className?: string;
}

const FRAME_COUNT = 6;

export default function CannabisLoader({
  variant = "scan",
  size = 96,
  label,
  cycleSeconds = 3,
  className = "",
}: CannabisLoaderProps) {
  const folder = variant === "strain" ? "strain" : "scan";
  const frameMs = (cycleSeconds * 1000) / FRAME_COUNT;
  const [frame, setFrame] = useState(0);

  // Preload all frames once so the first loop doesn't flash
  useEffect(() => {
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = `/loader/${folder}/${i}.png`;
    }
  }, [folder]);

  // Frame-swap timer
  useEffect(() => {
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % FRAME_COUNT);
    }, frameMs);
    return () => clearInterval(id);
  }, [frameMs]);

  return (
    <div
      className={`cbai-loader-wrap ${className}`}
      role="status"
      aria-label={label || "Loading"}
    >
      <div
        className="cbai-stage"
        style={{ width: size, height: size }}
      >
        {Array.from({ length: FRAME_COUNT }, (_, i) => (
          <img
            key={i}
            src={`/loader/${folder}/${i + 1}.png`}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              width: size,
              height: size,
              opacity: frame === i ? 1 : 0,
            }}
          />
        ))}
      </div>

      {label && (
        <div className="cbai-label" aria-live="polite">
          {label}
          <span className="cbai-dot">.</span>
          <span className="cbai-dot">.</span>
          <span className="cbai-dot">.</span>
        </div>
      )}

      <style jsx>{`
        .cbai-loader-wrap {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .cbai-stage {
          position: relative;
          display: block;
        }
        .cbai-stage img {
          position: absolute;
          inset: 0;
          display: block;
          pointer-events: none;
          user-select: none;
          /* no transition — instant frame swap for crisp flipbook feel */
        }
        .cbai-label {
          font-size: 13px;
          color: #a1a1aa;
          letter-spacing: 0.02em;
          display: inline-flex;
          gap: 1px;
        }
        .cbai-dot {
          animation: cbai-dot 1.4s infinite;
        }
        .cbai-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .cbai-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes cbai-dot {
          0%, 20% { opacity: 0.2; }
          50%     { opacity: 1; }
          100%    { opacity: 0.2; }
        }

        /* Respect prefers-reduced-motion — hold on the final frame */
        @media (prefers-reduced-motion: reduce) {
          .cbai-dot { animation: none; }
        }
      `}</style>
    </div>
  );
}
