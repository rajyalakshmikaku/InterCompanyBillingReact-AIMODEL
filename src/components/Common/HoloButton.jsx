import React, { useRef, useState } from "react";
import "./HoloButton.css";

const HoloButton = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  glowSize = 120,
  onClick,
  disabled,
  type = "button",
  ...props
}) => {
  const buttonRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseMove = (e) => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const sizeClasses = {
    sm: "holo-btn-sm",
    md: "holo-btn-md",
    lg: "holo-btn-lg",
    xl: "holo-btn-xl",
  };

  const variantClasses = {
    primary: "holo-btn-primary",
    secondary: "holo-btn-secondary",
    danger: "holo-btn-danger",
    ghost: "holo-btn-ghost",
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className={[
        "holo-btn",
        sizeClasses[size] || sizeClasses.md,
        variantClasses[variant] || variantClasses.primary,
        isHovered ? "holo-btn-hovered" : "",
        isPressed ? "holo-btn-pressed" : "",
        disabled ? "holo-btn-disabled" : "",
        className,
      ].join(" ")}
      style={{
        transform: isPressed
          ? "scale(0.96)"
          : isHovered
          ? "scale(1.02)"
          : "scale(1)",
      }}
      {...props}
    >
      <span
        className="holo-btn-flare"
        style={{
          left: coords.x - glowSize / 2,
          top: coords.y - glowSize / 2,
          width: glowSize,
          height: glowSize,
          opacity: isHovered ? 1 : 0,
        }}
      />
      <span className="holo-btn-border" aria-hidden="true" />
      <span className="holo-btn-shimmer" aria-hidden="true" />
      <span className="holo-btn-content">{children}</span>
    </button>
  );
};

export default HoloButton;
