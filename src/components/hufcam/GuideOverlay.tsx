import { useState, useEffect } from "react";
import type { PerspectiveId } from "./types";

interface GuideOverlayProps {
  perspective: PerspectiveId;
  onComplete: () => void;
}

export function GuideOverlay({ perspective, onComplete }: GuideOverlayProps) {
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onComplete();
    }
  }, [countdown, onComplete]);

  const renderSVG = () => {
    const amber = "#F5970A";
    switch (perspective) {
      case "dorsal":
        return (
          <svg viewBox="0 0 100 100" className="w-48 h-48">
            <path d="M20,80 Q50,70 80,80 L80,90 L20,90 Z" fill="none" stroke={amber} strokeWidth="2" />
            <line x1="50" y1="20" x2="50" y2="90" stroke={amber} strokeWidth="1" strokeDasharray="4 2" />
            <line x1="10" y1="85" x2="90" y2="85" stroke={amber} strokeWidth="1" />
          </svg>
        );
      case "lateral":
      case "medial":
        return (
          <svg viewBox="0 0 100 100" className="w-48 h-48">
            <path d="M30,85 L70,85 L85,40 L45,30 Z" fill="none" stroke={amber} strokeWidth="2" />
            <line x1="5" y1="85" x2="95" y2="85" stroke={amber} strokeWidth="1" />
            <line x1="30" y1="10" x2="30" y2="90" stroke={amber} strokeWidth="1" strokeDasharray="4 2" />
          </svg>
        );
      case "solar":
        return (
          <svg viewBox="0 0 100 100" className="w-48 h-48">
            <circle cx="50" cy="50" r="40" fill="none" stroke={amber} strokeWidth="2" />
            <path d="M50,20 L50,80 M20,50 L80,50" stroke={amber} strokeWidth="1" />
            <path d="M40,40 L60,60 M60,40 L40,60" stroke={amber} strokeWidth="1" />
          </svg>
        );
      case "palmar":
        return (
          <svg viewBox="0 0 100 100" className="w-48 h-48">
            <path d="M30,80 Q50,60 70,80 Q50,95 30,80" fill="none" stroke={amber} strokeWidth="2" />
            <line x1="50" y1="30" x2="50" y2="90" stroke={amber} strokeWidth="1" strokeDasharray="4 2" />
            <line x1="15" y1="80" x2="85" y2="80" stroke={amber} strokeWidth="1" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getLabel = () => {
    switch (perspective) {
      case "dorsal": return "Vorderansicht (Dorsal)";
      case "lateral": return "Außenseite (Lateral)";
      case "medial": return "Innenseite (Medial)";
      case "solar": return "Hufsohle (Solar)";
      case "palmar": return "Ballenbereich (Palmar)";
      default: return "";
    }
  };

  return (
    <div className="absolute inset-0 z-[60] bg-[#0a0700]/90 flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-8">{renderSVG()}</div>
      <h2 className="text-[#F5970A] text-2xl font-bold mb-2">{getLabel()}</h2>
      <p className="text-zinc-400 text-sm mb-8">Bereite die Kamera vor...</p>
      <div className="w-16 h-16 rounded-full border-4 border-[#F5970A]/20 flex items-center justify-center">
        <span className="text-[#F5970A] text-3xl font-black">{countdown}</span>
      </div>
    </div>
  );
}
