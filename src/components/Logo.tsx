import { PawPrint } from 'lucide-react';

interface LogoProps {
  /** Tailwind text-size class controls the overall scale, e.g. "text-2xl". */
  className?: string;
  /** Set true when placed on a dark background so the wordmark stays legible. */
  onDark?: boolean;
  /** Render only the paw mark (no wordmark). */
  markOnly?: boolean;
}

// Code-based wordmark logo — no image asset. Uses the rounded "Fredoka" display
// font to read as a real logo, and adapts its color to light/dark surfaces.
export default function Logo({ className = '', onDark = false, markOnly = false }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 font-logo font-semibold select-none ${className}`}>
      <span
        className="grid place-items-center rounded-[0.4em] bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-sm shadow-orange-500/30"
        style={{ width: '1.55em', height: '1.55em' }}
      >
        <PawPrint style={{ width: '1em', height: '1em' }} fill="currentColor" strokeWidth={0} />
      </span>
      {!markOnly && (
        <span className="leading-none tracking-tight">
          <span className="text-orange-500">Paw</span>
          <span className={onDark ? 'text-white' : 'text-zinc-900'}>Rescue</span>
        </span>
      )}
    </span>
  );
}
