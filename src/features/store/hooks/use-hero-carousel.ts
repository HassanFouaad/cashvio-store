"use client";

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type HTMLAttributes,
} from "react";

import type { StoreFrontHeroImageDto } from "@/features/store/types/store.types";

const AUTO_ROTATE_MS = 6000;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

interface HeroCarouselState {
  images: StoreFrontHeroImageDto[];
  currentIndex: number;
  isPaused: boolean;
  isPlaying: boolean;
  canAutoplay: boolean;
  goToPrevious: () => void;
  goToNext: () => void;
  togglePause: () => void;
  shouldRenderImage: (index: number) => boolean;
  interactionProps: Pick<
    HTMLAttributes<HTMLElement>,
    "onPointerEnter" | "onPointerLeave" | "onFocusCapture" | "onBlurCapture"
  >;
}

function subscribeAutoplay(onChange: () => void): () => void {
  const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  motionQuery.addEventListener("change", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    motionQuery.removeEventListener("change", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function getAutoplaySnapshot(): boolean {
  return (
    document.visibilityState === "visible" &&
    !window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

function getServerAutoplaySnapshot(): boolean {
  return false;
}

/** Shared behavior keeps every hero usable with touch, keyboard and reduced motion. */
export function useHeroCarousel(
  heroImages: StoreFrontHeroImageDto[],
): HeroCarouselState {
  const images = useMemo(
    () => [...heroImages].sort((a, b) => a.displayOrder - b.displayOrder),
    [heroImages],
  );
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const canAutoplay = useSyncExternalStore(
    subscribeAutoplay,
    getAutoplaySnapshot,
    getServerAutoplaySnapshot,
  );
  const count = images.length;
  const currentIndex = count ? index % count : 0;
  const isPlaying =
    count > 1 && canAutoplay && !isPaused && !isHovered && !hasFocus;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % count),
      AUTO_ROTATE_MS,
    );
    return () => clearInterval(timer);
  }, [count, isPlaying]);

  return {
    images,
    currentIndex,
    isPaused,
    isPlaying,
    canAutoplay,
    goToPrevious: () => {
      if (count) setIndex((current) => (current + count - 1) % count);
    },
    goToNext: () => {
      if (count) setIndex((current) => (current + 1) % count);
    },
    togglePause: () => setIsPaused((current) => !current),
    // Opacity-hidden images are still in the viewport and eager to fetch.
    // Only mount the visible and neighboring slides, retaining crossfades.
    shouldRenderImage: (slideIndex) =>
      count > 0 &&
      (slideIndex === currentIndex ||
        slideIndex === (currentIndex + 1) % count ||
        slideIndex === (currentIndex + count - 1) % count),
    interactionProps: {
      onPointerEnter: (event) => {
        if (event.pointerType === "mouse") setIsHovered(true);
      },
      onPointerLeave: () => setIsHovered(false),
      onFocusCapture: () => setHasFocus(true),
      onBlurCapture: (event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setHasFocus(false);
      },
    },
  };
}
