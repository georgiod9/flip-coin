import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function TooltipComponent({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
}) {
  const [position, setPosition] = useState({ x, y });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const rect = tooltip.getBoundingClientRect();
    const padding = 10; // Minimum distance from screen edges

    let newX = x;
    let newY = y;

    // Check horizontal bounds
    if (x + rect.width > window.innerWidth - padding) {
      newX = window.innerWidth - rect.width - padding;
    }
    if (x < padding) {
      newX = padding;
    }

    // Check vertical bounds
    if (y + rect.height > window.innerHeight - padding) {
      newY = y - rect.height - 10; // Show above the element instead
    }
    if (y < padding) {
      newY = padding;
    }

    setPosition({ x: newX, y: newY });
  }, [x, y]);

  const style = {
    position: "fixed" as const,
    textAlign: "center" as const,
    top: position.y + "px",
    left: position.x + "px",
    background: "black",
    fontSize: "10px",
    color: "white",
    padding: "5px",
    borderRadius: "5px",
    pointerEvents: "none" as const,
    zIndex: 1000, // on top,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(100, 100, 100, 1)",
  };

  console.log("Tooltip rendering with:", { x, y, children });

  return createPortal(
    <div ref={tooltipRef} style={style}>
      {children || "Fallback text"}
    </div>,
    document.body
  );
}
