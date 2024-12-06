import React from "react";
import "./NeonContainer.css";

interface NeonContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "wide" | "house";
}

export const NeonContainer: React.FC<NeonContainerProps> = ({
  children,
  className = "",
  variant = "default",
}) => {
  const variantClass =
    variant === "wide"
      ? "neon-container-wide"
      : variant === "house"
      ? "neon-container-house"
      : "";

  return (
    <div className={`neon-container ${variantClass} ${className}`}>
      <div className="neon-container-inner">{children}</div>
    </div>
  );
};
