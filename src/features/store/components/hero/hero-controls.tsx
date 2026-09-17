"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

interface HeroControlsProps {
  currentIndex: number;
  count: number;
  isPaused: boolean;
  isPlaying: boolean;
  canAutoplay: boolean;
  goToPrevious: () => void;
  goToNext: () => void;
  togglePause: () => void;
}

/** Always-visible 44px controls replace hover-only arrows and tiny dots. */
export function HeroControls({
  currentIndex,
  count,
  isPaused,
  isPlaying,
  canAutoplay,
  goToPrevious,
  goToNext,
  togglePause,
}: HeroControlsProps) {
  const t = useTranslations("store.hero");
  if (count <= 1) return null;

  return (
    <div className="absolute bottom-3 start-3 end-3 z-10 flex justify-center">
      <div className="flex max-w-full items-center gap-1 rounded-full border border-border bg-background/95 p-1 text-foreground">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-full"
          onClick={goToPrevious}
          aria-label={t("previousImage")}
        >
          <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
        </Button>
        <span
          className="min-w-0 px-1 text-center text-xs font-medium tabular-nums"
          aria-live={isPlaying ? "off" : "polite"}
          aria-atomic="true"
        >
          {t("slidePosition", { index: currentIndex + 1, total: count })}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-full"
          onClick={goToNext}
          aria-label={t("nextImage")}
        >
          <ChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
        </Button>
        {canAutoplay && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full"
            onClick={togglePause}
            aria-label={t(isPaused ? "resumeRotation" : "pauseRotation")}
          >
            {isPaused ? (
              <Play className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Pause className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
