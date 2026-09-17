import type { ImageProps } from "next/image";

/** The preloaded first banner must stay eager after it rotates out of view. */
export function getHeroImageLoadingProps(
  index: number,
  currentIndex: number,
): Pick<ImageProps, "priority" | "loading" | "fetchPriority"> {
  const isFirstImage = index === 0;
  const isEager = isFirstImage || index === currentIndex;
  return {
    priority: isFirstImage,
    loading: isEager ? "eager" : "lazy",
    fetchPriority: isEager ? "high" : "low",
  };
}
