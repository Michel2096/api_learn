import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';
import { DIFFICULTY_LABELS } from '../format';

// ---- Botones: blanco reluciente sobre negro ------------------------------
type Variant = 'primary' | 'outline' | 'danger' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-white text-black shadow-[0_0_18px_rgba(255,255,255,0.3)] hover:shadow-[0_0_34px_rgba(255,255,255,0.6)]',
  outline:
    'border border-white/50 text-white hover:bg-white hover:text-black hover:shadow-[0_0_22px_rgba(255,255,255,0.45)]',
  danger: 'border border-dashed border-white/30 text-neutral-400 hover:border-white hover:text-white',
  ghost: 'text-neutral-500 hover:text-white hover:[text-shadow:0_0_10px_rgba(255,255,255,0.6)]',
};

export function BatButton({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 font-display text-xs font-bold uppercase tracking-[0.2em] transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none ${VARIANTS[variant]} ${className}`}
    />
  );
}

// ---- Inputs ---------------------------------------------------------------
export const inputClass =
  'w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 font-mono text-sm text-white placeholder:text-neutral-600 outline-none transition focus:border-white focus:ring-1 focus:ring-white/40 focus:shadow-[0_0_16px_rgba(255,255,255,0.15)]';

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${className}`} />;
}

export function TextArea({ className = '', rows = 3, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} {...props} className={`${inputClass} resize-y ${className}`} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="font-display text-[11px] uppercase tracking-[0.2em] text-neutral-300">{label}</span>
      {children}
      {hint && <span className="block text-xs text-neutral-600">{hint}</span>}
    </label>
  );
}

// ---- Secciones dentro de un modal -----------------------------------------
export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="glow font-display text-xs font-bold uppercase tracking-[0.25em] text-white">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Errores invertidos (blanco sólido) para que destaquen sin usar color. */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-md bg-white px-4 py-3 font-mono text-sm text-black shadow-[0_0_24px_rgba(255,255,255,0.35)]">
      ⚠ {message}
    </div>
  );
}

export function DifficultyDots({ level, showLabel = false }: { level: number | null; showLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={level ? `Dificultad ${level} de 5` : 'Dificultad sin evaluar'}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`h-1.5 w-1.5 rounded-full ${level && n <= level ? 'bg-white shadow-[0_0_6px_#fff]' : 'bg-neutral-800'}`}
        />
      ))}
      {showLabel && level && <span className="ml-1.5 text-neutral-300">{DIFFICULTY_LABELS[level - 1]}</span>}
    </span>
  );
}

/** Emblema inspirado en la trilogía de Nolan: alas afiladas, orejas cortas y muescas en garra. */
export function BatLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 80" className={className} fill="currentColor" aria-hidden="true">
      <path d="M100 24L104.5 24L109 6L113.5 26C128 32 150 30 166 20C178 13 190 7 199 0C190 14 186 30 188 46C178 32 168 34 160 50C150 36 140 40 132 60C118 58 106 66 100 80C94 66 82 58 68 60C60 40 50 36 40 50C32 34 22 32 12 46C14 30 10 14 1 0C10 7 22 13 34 20C50 30 72 32 86.5 26L91 6L95.5 24Z" />
    </svg>
  );
}

/** Batseñal: el emblema recortado en un foco de luz. */
export function BatSignal({ className = '' }: { className?: string }) {
  return (
    <div className={`bat-signal relative grid place-items-center rounded-full ${className}`}>
      <BatLogo className="relative w-[78%] text-black" />
    </div>
  );
}

// ---- Chips de filtro -------------------------------------------------------
export function Chip({
  active,
  count,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean; count?: number }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      {...props}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition ${
        active
          ? 'border-white bg-white text-black shadow-[0_0_14px_rgba(255,255,255,0.45)]'
          : 'border-white/15 text-neutral-400 hover:border-white/50 hover:text-white'
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`tabular-nums ${active ? 'text-black/60' : 'text-neutral-600'}`}>{count}</span>
      )}
    </button>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/15 p-10 text-center">
      <BatLogo className="mx-auto mb-4 w-16 text-white/15" />
      <p className="font-mono text-sm text-neutral-300">{title}</p>
      {hint && <p className="mt-1 font-mono text-xs text-neutral-600">{hint}</p>}
    </div>
  );
}

/** Cabecera de cada pestaña principal. */
export function SectionTitle({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-neutral-500">{kicker}</p>
        <h2 className="glow mt-1 font-display text-lg font-bold uppercase tracking-[0.2em] text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}
