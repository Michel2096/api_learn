import { useCallback, useEffect, useState } from 'react';
import { api, prepareWizard } from './api';
import { BatButton, BatSignal, ErrorBanner } from './components/ui';
import DashboardView from './components/views/DashboardView';
import HistoryView from './components/views/HistoryView';
import NotesView from './components/views/NotesView';
import TopicsView from './components/views/TopicsView';
import Wizard from './components/Wizard';
import type { LearningNote, MissionSummary, ResumeState, StudyTopic } from './types';

type Tab = 'dashboard' | 'historial' | 'temas' | 'notas';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Batcomputer', icon: '◆' },
  { id: 'historial', label: 'Historial', icon: '☰' },
  { id: 'temas', label: 'Temas por estudiar', icon: '◎' },
  { id: 'notas', label: 'Lo que me falta', icon: '◌' },
];

/** La pestaña vive en el hash (#temas…) para que recargar no te saque de donde estabas. */
const tabFromHash = (): Tab => {
  const h = window.location.hash.slice(1);
  return TABS.some((t) => t.id === h) ? (h as Tab) : 'dashboard';
};

/** Wizard cerrado, misión nueva (`{}`) o misión retomada (`{ resume }`). */
type WizardState = null | { resume?: ResumeState };

export default function App() {
  const [missions, setMissions] = useState<MissionSummary[]>([]);
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [notes, setNotes] = useState<LearningNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wizard, setWizard] = useState<WizardState>(null);
  const [tab, setTab] = useState<Tab>(tabFromHash);

  const loadAll = useCallback(async () => {
    try {
      const [m, t, n] = await Promise.all([api.listMissions(), api.listTopics(), api.listNotes()]);
      setMissions(m);
      setTopics(t);
      setNotes(n);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const goTo = (t: Tab) => {
    window.location.hash = t === 'dashboard' ? '' : t;
    setTab(t);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function closeWizard() {
    setWizard(null);
    void loadAll(); // la misión pudo guardarse completa o quedar en progreso
  }

  async function deleteMission(m: MissionSummary) {
    if (!window.confirm(`¿Eliminar la misión "${m.titulo}" y todos sus registros?`)) return;
    try {
      await api.deleteActivity(m.id);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }

  async function resumeMission(m: MissionSummary) {
    try {
      setWizard({ resume: await prepareWizard(m.id, 'retomar') });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }

  const gaps = notes.filter((n) => n.tipo === 'me_falta' && !n.resuelta).length;
  const openTopics = topics.filter((t) => t.estado === 'pendiente').length;
  const badge: Partial<Record<Tab, number>> = { temas: openTopics, notas: gaps };

  return (
    <div className="bat-grid min-h-screen">
      <div className="scanlines pointer-events-none fixed inset-0 z-0" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-16">
        <header className="relative pb-8 pt-10 sm:pt-14">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <BatSignal className="h-20 w-20 shrink-0 sm:h-24 sm:w-24" />
              <div>
                <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-neutral-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white shadow-[0_0_8px_#fff]" />
                  Sistema en línea
                </span>
                <h1 className="glow-strong mt-1 font-display text-3xl font-black uppercase tracking-[0.15em] text-white sm:text-5xl">
                  Batcomputer
                </h1>
                <p className="mt-1 font-mono text-xs text-neutral-500 sm:text-sm">
                  Seguimiento del pensamiento complejo y la metacognición
                </p>
              </div>
            </div>
            <BatButton onClick={() => setWizard({})} className="!px-8 !py-4 !text-sm">
              ▶ Iniciar Nueva Misión
            </BatButton>
          </div>
          <Skyline />
        </header>

        <nav
          aria-label="Secciones"
          className="sticky top-0 z-20 -mx-4 mb-8 border-y border-white/10 bg-black/80 px-4 backdrop-blur-md"
        >
          <ul className="flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => goTo(t.id)}
                  aria-current={tab === t.id ? 'page' : undefined}
                  className={`nav-tab relative flex items-center gap-2 whitespace-nowrap px-4 py-3.5 font-display text-[11px] font-bold uppercase tracking-[0.2em] transition ${
                    tab === t.id ? 'is-active glow text-white' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  <span aria-hidden="true">{t.icon}</span>
                  {t.label}
                  {!!badge[t.id] && (
                    <span className="rounded-full bg-white px-1.5 font-mono text-[10px] tracking-normal text-black">{badge[t.id]}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} />
          </div>
        )}

        {loading ? (
          <p className="animate-pulse font-mono text-sm text-neutral-400">Accediendo a los archivos…</p>
        ) : (
          <main key={tab} className="tab-in">
            {tab === 'dashboard' && (
              <DashboardView
                missions={missions}
                topics={topics}
                notes={notes}
                onDelete={deleteMission}
                onResume={resumeMission}
                onGoTo={goTo}
              />
            )}
            {tab === 'historial' && (
              <HistoryView
                missions={missions}
                onChanged={loadAll}
                onLaunch={(resume) => setWizard({ resume })}
                onDelete={deleteMission}
              />
            )}
            {tab === 'temas' && <TopicsView topics={topics} missions={missions} onChanged={loadAll} />}
            {tab === 'notas' && <NotesView notes={notes} missions={missions} onChanged={loadAll} />}
          </main>
        )}
      </div>

      {/* Se monta/desmonta para que cada misión empiece con un estado limpio. */}
      {wizard && <Wizard onClose={closeWizard} resume={wizard.resume} />}
    </div>
  );
}

/** Silueta de Gotham bajo la cabecera: rascacielos de alturas pseudoaleatorias pero estables. */
function Skyline() {
  const buildings = Array.from({ length: 48 }, (_, i) => {
    const h = 14 + ((i * 37) % 23) + (i % 7 === 3 ? 18 : 0) + (i % 11 === 5 ? 26 : 0);
    return { x: i * 21, w: 14 + ((i * 13) % 9), h };
  });
  return (
    <svg
      viewBox="0 0 1000 70"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-14 w-full text-white/[0.06]"
      aria-hidden="true"
    >
      {buildings.map((b, i) => (
        <rect key={i} x={b.x} y={70 - b.h} width={b.w} height={b.h} fill="currentColor" />
      ))}
    </svg>
  );
}
