"use client";

import React from "react";

type Props = {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
};

/**
 * Avatar premium con fallback "incognito".
 * - Si hay src => muestra imagen
 * - Si no hay src => fallback SVG tipo incognito (premium)
 */
export default function Avatar({ src, alt = "avatar", size = 40, className = "" }: Props) {
  const s = size;

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 ${className}`}
      style={{ width: s, height: s }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-white/10 to-white/5">
          {/* Incognito SVG */}
          <svg
            width={Math.max(18, Math.floor(s * 0.55))}
            height={Math.max(18, Math.floor(s * 0.55))}
            viewBox="0 0 24 24"
            fill="none"
            className="opacity-90"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Gafas */}
            <path
              d="M3.5 13.5C4.3 12 6 11.5 8 11.5C10 11.5 11.7 12 12.5 13.5"
              stroke="white"
              strokeOpacity="0.9"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M11.5 13.5C12.3 12 14 11.5 16 11.5C18 11.5 19.7 12 20.5 13.5"
              stroke="white"
              strokeOpacity="0.9"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            {/* Puente */}
            <path
              d="M12.5 13.5H11.5"
              stroke="white"
              strokeOpacity="0.9"
              strokeWidth="1.6"
              strokeLinecap="round"
            />

            {/* Cara */}
            <path
              d="M7.5 16.5C8.5 15.7 9.9 15.3 12 15.3C14.1 15.3 15.5 15.7 16.5 16.5"
              stroke="white"
              strokeOpacity="0.65"
              strokeWidth="1.4"
              strokeLinecap="round"
            />

            {/* Sombrero */}
            <path
              d="M6.5 10.3C7.6 8.2 9.7 7 12 7C14.3 7 16.4 8.2 17.5 10.3"
              stroke="white"
              strokeOpacity="0.35"
              strokeWidth="1.4"
              strokeLinecap="round"
            />

            {/* Cejas */}
            <path
              d="M7.2 12C7.8 11.4 8.7 11.2 9.7 11.4"
              stroke="white"
              strokeOpacity="0.35"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M16.8 12C16.2 11.4 15.3 11.2 14.3 11.4"
              stroke="white"
              strokeOpacity="0.35"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
