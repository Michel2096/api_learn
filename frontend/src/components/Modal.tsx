import { useEffect, useRef, type ReactNode } from 'react';
import { BatLogo } from './ui';

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  /** Ancho extra para vistas de dos columnas (Modo Detective). */
  wide?: boolean;
  children: ReactNode;
}

export default function Modal({ title, subtitle, onClose, wide = false, children }: ModalProps) {
  // Guardamos onClose en un ref para no re-suscribir el listener en cada render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/85 p-3 backdrop-blur-sm sm:items-center sm:p-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`modal-in relative w-full transition-[max-width] duration-300 ${wide ? 'max-w-6xl' : 'max-w-3xl'} rounded-xl border border-white/20 bg-black/90 shadow-[0_0_80px_rgba(255,255,255,0.08)] backdrop-blur-md`}
      >
        {/* Esquinas tipo HUD */}
        <span className="pointer-events-none absolute -left-px -top-px h-5 w-5 rounded-tl-xl border-l-2 border-t-2 border-white shadow-[-4px_-4px_14px_-4px_rgba(255,255,255,0.7)]" />
        <span className="pointer-events-none absolute -bottom-px -right-px h-5 w-5 rounded-br-xl border-b-2 border-r-2 border-white shadow-[4px_4px_14px_-4px_rgba(255,255,255,0.7)]" />

        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BatLogo className="hidden h-6 w-14 shrink-0 text-white/80 sm:block" />
            <div>
              {subtitle && <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">{subtitle}</p>}
              <h2 id="modal-title" className="glow-strong font-display text-xl font-bold uppercase tracking-wider text-white sm:text-2xl">
                {title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-2 font-mono text-neutral-500 transition hover:bg-white hover:text-black"
          >
            ✕
          </button>
        </header>

        <div className="px-4 py-5 sm:px-6 sm:py-6">{children}</div>
      </div>
    </div>
  );
}
