import { useState } from "react";
import { Monitor } from "lucide-react";
export function ProductImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState("");
  return failed === src ? (
    <div className={`image-fallback ${className}`}>
      <Monitor />
      <span>MERCURY</span>
      <small>Technology. Business. Connected.</small>
    </div>
  ) : (
    <img
      className={className}
      src={src}
      alt={alt}
      onError={() => setFailed(src)}
    />
  );
}
