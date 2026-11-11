import { useEffect, useRef, useState } from "react";

export function OptiSprite({ src, alt, className = "", reduced = false }: { src: string; alt: string; className?: string; reduced?: boolean }) {
  const [shown, setShown] = useState(src);
  const [previous, setPrevious] = useState<string | null>(null);
  const shownRef = useRef(src);
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const image = new Image();
    image.onload = () => {
      if (cancelled || shownRef.current === src) return;
      setPrevious(reduced ? null : shownRef.current);
      shownRef.current = src;
      setShown(src);
      timer = setTimeout(() => setPrevious(null), 320);
    };
    image.src = src;
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [src, reduced]);
  return <span className={`relative inline-block shrink-0 ${className}`}>
    {previous && <img src={previous} alt="" aria-hidden className="opti-sprite-out absolute inset-0 size-full object-contain" />}
    <img key={shown} src={shown} alt={alt} className={`size-full object-contain ${previous ? "opti-sprite-in" : ""}`} />
  </span>;
}