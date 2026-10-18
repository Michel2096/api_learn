import { useRef, useState } from 'react';
import { api, saveFlightPlan } from '../api';
import type { ExecutionDraft, FlightPlan, Lap, ReflectionDraft, ResumeState } from '../types';
import Modal from './Modal';
import CaseReportStep from './steps/CaseReportStep';
import DetectiveStep from './steps/DetectiveStep';
import FlightPlanStep from './steps/FlightPlanStep';
import { ErrorBanner } from './ui';

type Step = 1 | 2 | 3;

const STEPS: Record<Step, { title: string; hint: string }> = {
  1: { title: 'Plan de Vuelo', hint: 'Lo que DEBES hacer' },
  2: { title: 'Modo Detective', hint: 'Lo que ESTÁS haciendo' },
  3: { title: 'Informe de Caso', hint: 'Lo que HICISTE' },
};

interface WizardProps {
  /** Se llama al cerrar el wizard, tanto si la misión se guardó como si se abortó. */
  onClose: () => void;
  /** Misión ya guardada que se retoma (o repite) desde el historial. */
  resume?: ResumeState;
}

/**
 * Orquesta el flujo Plan → Ejecución → Reflexión.
 *
 * Cada ventana persiste SU tabla al pulsar el botón de avanzar, y solo si
 * el guardado tiene éxito se pasa a la siguiente. El flujo es lineal: no se
 * puede volver atrás porque lo anterior ya está en la base de datos.
 * Por eso mismo se puede entrar directamente en la ventana 2 o 3 al retomar.
 */
export default function Wizard({ onClose, resume }: WizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>(resume?.step ?? 1);
  const [activityId, setActivityId] = useState<number | null>(resume?.activityId ?? null);
  const [plan, setPlan] = useState<FlightPlan | null>(resume?.plan ?? null);
  const [elapsedSeconds, setElapsedSeconds] = useState(resume?.elapsedSeconds ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Evita duplicar la reflexión si falla solo el PATCH de estado y se reintenta.
  const reflectionSaved = useRef(false);

  /** Envuelve cada guardado con estado de carga y captura de errores. */
  async function run(task: () => Promise<void>) {
    setSaving(true);
    setError(null);
    try {
      await task();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  }

  // ---- Ventana 1 → 2 -------------------------------------------------------
  const handlePlanSubmit = (newPlan: FlightPlan) =>
    run(async () => {
      const id = await saveFlightPlan(newPlan);
      setActivityId(id);
      setPlan(newPlan);
      setCurrentStep(2);
    });

  // ---- Ventana 2 → 3 -------------------------------------------------------
  const handleExecutionSubmit = (draft: ExecutionDraft, seconds: number, laps: Lap[]) =>
    run(async () => {
      await api.createExecution({
        activity_id: activityId!,
        tiempo_real_minutos: Math.round(seconds / 60),
        notas_de_enfoque: draft.notas_de_enfoque.trim() || null,
        prioridades: draft.prioridades.trim() || null,
        ajustes: draft.ajustes.trim() || null,
        lapsos: laps,
      });
      setElapsedSeconds(seconds);
      setCurrentStep(3);
    });

  // ---- Ventana 3 → Dashboard ----------------------------------------------
  const handleReflectionSubmit = (draft: ReflectionDraft) =>
    run(async () => {
      if (!reflectionSaved.current) {
        await api.createReflection({
          activity_id: activityId!,
          nivel_de_dificultad: draft.nivel_de_dificultad,
          resultados_obtenidos: draft.resultados_obtenidos || null,
          retrospectiva: draft.retrospectiva || null,
        });
        reflectionSaved.current = true;
      }
      await api.updateActivity(activityId!, { estado: 'completada' });
      onClose();
    });

  function requestClose() {
    if (saving) return;
    const message =
      currentStep === 1
        ? '¿Descartar este plan de vuelo?'
        : '¿Abortar la misión? Quedará en el historial como "en progreso".';
    if (window.confirm(message)) onClose();
  }

  const { title, hint } = STEPS[currentStep];

  return (
    <Modal title={title} subtitle={`Paso ${currentStep}/3 · ${hint}`} onClose={requestClose} wide={currentStep === 2}>
      <StepIndicator current={currentStep} />

      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}

      {currentStep === 1 && <FlightPlanStep saving={saving} onSubmit={handlePlanSubmit} />}

      {currentStep === 2 && plan && activityId && (
        <DetectiveStep activityId={activityId} plan={plan} saving={saving} onSubmit={handleExecutionSubmit} />
      )}

      {currentStep === 3 && plan && (
        <CaseReportStep
          estimatedMinutes={plan.tiempoEstimadoMinutos}
          elapsedSeconds={elapsedSeconds}
          saving={saving}
          onSubmit={handleReflectionSubmit}
        />
      )}
    </Modal>
  );
}

function StepIndicator({ current }: { current: Step }) {
  return (
    <ol className="mb-6 grid grid-cols-3 gap-2">
      {([1, 2, 3] as Step[]).map((step) => {
        const state = step < current ? 'done' : step === current ? 'active' : 'todo';
        const styles = {
          done: 'border-white/30 text-neutral-300',
          active: 'border-white bg-white/5 text-white glow shadow-[0_0_18px_rgba(255,255,255,0.3)]',
          todo: 'border-neutral-700 text-neutral-600',
        }[state];
        return (
          <li
            key={step}
            aria-current={state === 'active' ? 'step' : undefined}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 font-mono text-[11px] uppercase tracking-wider ${styles}`}
          >
            <span className="font-display font-bold">{state === 'done' ? '✓' : `0${step}`}</span>
            <span className="truncate">{STEPS[step].title}</span>
          </li>
        );
      })}
    </ol>
  );
}
