"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

export const PLACEHOLDER_IMAGE = "/images/placeholder.svg";

type Props = Omit<ImageProps, "src"> & { src: string | null | undefined };

/** next/image that falls back to a neutral placeholder when the source is missing or fails to load. */
export default function ProductImage({ src, alt, ...props }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolved = src && src !== failedSrc ? src : PLACEHOLDER_IMAGE;

  return (
    <Image
      {...props}
      src={resolved}
      alt={alt}
      unoptimized={resolved.endsWith(".svg") || props.unoptimized}
      onError={() => {
        if (src) setFailedSrc(src);
      }}
    />
  );
}
