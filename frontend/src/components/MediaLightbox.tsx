"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ListingImage } from "@/lib/api";
import { mediaUrl } from "@/lib/api";
import { isVideo } from "@/lib/format";

type Props = {
  media: ListingImage[];
  startIndex: number;
  alt: string;
  open: boolean;
  onClose: () => void;
  closeLabel: string;
};

export function MediaLightbox({
  media,
  startIndex,
  alt,
  open,
  onClose,
  closeLabel,
}: Props) {
  const [index, setIndex] = useState(startIndex);
  const [mounted, setMounted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(index);
  indexRef.current = index;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setIndex(startIndex);
    requestAnimationFrame(() => {
      const el = trackRef.current;
      if (!el) return;
      el.scrollTo({ left: startIndex * el.clientWidth, behavior: "auto" });
    });
  }, [open, startIndex]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function go(delta: number) {
      if (!media.length) return;
      const current = indexRef.current;
      const next =
        ((current + delta) % media.length + media.length) % media.length;
      setIndex(next);
      const el = trackRef.current;
      if (el) {
        el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, media.length, onClose]);

  function onTrackScroll() {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1));
    if (i !== index) setIndex(i);
  }

  function goTo(next: number) {
    if (!media.length) return;
    const i = ((next % media.length) + media.length) % media.length;
    setIndex(i);
    const el = trackRef.current;
    if (el) {
      el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    }
  }

  if (!mounted || !open || media.length === 0) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
          aria-label={closeLabel}
        >
          <X className="h-5 w-5" />
        </button>
        <span className="rounded-full bg-black/50 px-3 py-1.5 text-sm font-medium text-white">
          {index + 1} / {media.length}
        </span>
        <span className="w-10" aria-hidden />
      </div>

      <div
        ref={trackRef}
        onScroll={onTrackScroll}
        className="scrollbar-hide flex h-full w-full snap-x snap-mandatory overflow-x-auto"
      >
        {media.map((m, i) => {
          const url = mediaUrl(m.url);
          const active = i === index;
          return (
            <div
              key={m.id}
              className="flex h-full w-full shrink-0 snap-center items-center justify-center px-2"
            >
              {isVideo(m.url) ? (
                <video
                  src={url}
                  controls
                  playsInline
                  preload={active ? "auto" : "metadata"}
                  className="max-h-[100dvh] max-w-full object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt={alt}
                  draggable={false}
                  className="max-h-[100dvh] max-w-full object-contain"
                />
              )}
            </div>
          );
        })}
      </div>

      {media.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            className="absolute top-1/2 left-3 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25 md:flex"
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className="absolute top-1/2 right-3 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25 md:flex"
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex items-center justify-center gap-1.5 pb-[env(safe-area-inset-bottom)]">
            {media.map((m, i) => (
              <span
                key={m.id}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === index ? "w-4 bg-white" : "w-1.5 bg-white/45"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
