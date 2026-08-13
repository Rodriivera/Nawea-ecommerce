"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Rail({
  children,
  slideClass = "w-[78%] sm:w-[46%] lg:w-[30%] xl:w-[23%]",
  className,
  header,
}: {
  children: ReactNode[];
  slideClass?: string;
  className?: string;
  header?: ReactNode;
}) {
  const [emblaRef, embla] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });
  const [progress, setProgress] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const onScroll = useCallback(() => {
    if (!embla) return;
    setProgress(Math.max(0, Math.min(1, embla.scrollProgress())));
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    onScroll();
    embla.on("scroll", onScroll).on("reInit", onScroll).on("select", onScroll);
  }, [embla, onScroll]);

  return (
    <div className={className}>
      <div className="flex items-end justify-between gap-6">
        <div className="min-w-0 flex-1">{header}</div>
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => embla?.scrollPrev()}
            disabled={!canPrev}
            className="flex h-11 w-11 items-center justify-center border border-foreground transition-colors duration-300 hover:bg-foreground hover:text-background disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent rounded-full cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => embla?.scrollNext()}
            disabled={!canNext}
            className="flex h-11 w-11 items-center justify-center border border-foreground transition-colors duration-300 hover:bg-foreground hover:text-background disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent rounded-full cursor-pointer"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-8 overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 md:gap-6">
          {children.map((child, i) => (
            <div key={i} className={cn("min-w-0 shrink-0", slideClass)}>
              {child}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 h-px w-full bg-border">
        <div
          className="h-px bg-foreground transition-[width] duration-200 ease-out"
          style={{ width: `${Math.max(8, progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
