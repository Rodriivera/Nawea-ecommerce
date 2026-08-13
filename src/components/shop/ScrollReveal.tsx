"use client";

import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AnimationVariant =
  | "fade-up"
  | "fade-down"
  | "slide-left"
  | "slide-right"
  | "zoom-in"
  | "flip-up"
  | "blur-in";

interface ScrollRevealProps {
  children: ReactNode;
  variant?: AnimationVariant;
  delay?: number; // en milisegundos
  duration?: number; // en milisegundos
  threshold?: number; // 0 a 1
  once?: boolean;
  className?: string;
  as?: React.ElementType;
}

const variantStyles: Record<AnimationVariant, { hidden: React.CSSProperties; visible: React.CSSProperties }> = {
  "fade-up": {
    hidden: { opacity: 0, transform: "translate3d(0, 36px, 0)" },
    visible: { opacity: 1, transform: "translate3d(0, 0, 0)" },
  },
  "fade-down": {
    hidden: { opacity: 0, transform: "translate3d(0, -36px, 0)" },
    visible: { opacity: 1, transform: "translate3d(0, 0, 0)" },
  },
  "slide-left": {
    hidden: { opacity: 0, transform: "translate3d(-45px, 0, 0)" },
    visible: { opacity: 1, transform: "translate3d(0, 0, 0)" },
  },
  "slide-right": {
    hidden: { opacity: 0, transform: "translate3d(45px, 0, 0)" },
    visible: { opacity: 1, transform: "translate3d(0, 0, 0)" },
  },
  "zoom-in": {
    hidden: { opacity: 0, transform: "scale(0.92)" },
    visible: { opacity: 1, transform: "scale(1)" },
  },
  "flip-up": {
    hidden: { opacity: 0, transform: "perspective(1000px) rotateX(15deg) translate3d(0, 30px, 0)" },
    visible: { opacity: 1, transform: "perspective(1000px) rotateX(0deg) translate3d(0, 0, 0)" },
  },
  "blur-in": {
    hidden: { opacity: 0, filter: "blur(10px)", transform: "scale(0.98)" },
    visible: { opacity: 1, filter: "blur(0px)", transform: "scale(1)" },
  },
};

export function ScrollReveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 750,
  threshold = 0.12,
  once = true,
  className,
  as: Component = "div",
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = domRef.current;
    if (!node) return;

    // Si el explorador no soporta IntersectionObserver, mostrar directamente
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) {
              observer.unobserve(entry.target);
            }
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, once]);

  const currentStyles = isVisible
    ? variantStyles[variant].visible
    : variantStyles[variant].hidden;

  const transitionStyle: React.CSSProperties = {
    ...currentStyles,
    transitionProperty: "opacity, transform, filter",
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
    transitionDelay: `${delay}ms`,
    willChange: "opacity, transform",
  };

  return (
    <Component
      ref={domRef}
      className={cn(className)}
      style={transitionStyle}
    >
      {children}
    </Component>
  );
}
