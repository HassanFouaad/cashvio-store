import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getImageProps } from "next/image.js";

import { getHeroImageLoadingProps } from "@/features/store/utils/hero-image-props";

const image = {
  src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>",
  alt: "Fixture banner",
  width: 640,
  height: 320,
};

describe("hero Next.js image loading", () => {
  it("keeps the preloaded first image eager after advancing the carousel", () => {
    const policy = getHeroImageLoadingProps(0, 1);
    assert.equal(policy.priority, true);
    assert.equal(policy.loading, "eager");
    assert.doesNotThrow(() => getImageProps({ ...image, ...policy }));
  });

  it("promotes the active slide without preloading every other image", () => {
    assert.deepEqual(getHeroImageLoadingProps(2, 2), {
      priority: false,
      loading: "eager",
      fetchPriority: "high",
    });
    assert.deepEqual(getHeroImageLoadingProps(3, 2), {
      priority: false,
      loading: "lazy",
      fetchPriority: "low",
    });
  });

  it("passes Next's real prop validation at every position in a five-banner cycle", () => {
    for (let currentIndex = 0; currentIndex < 5; currentIndex++) {
      for (let index = 0; index < 5; index++) {
        assert.doesNotThrow(() =>
          getImageProps({
            ...image,
            ...getHeroImageLoadingProps(index, currentIndex),
          }),
        );
      }
    }
  });
});
