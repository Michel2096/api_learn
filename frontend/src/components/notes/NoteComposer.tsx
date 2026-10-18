import { useState, type FormEvent } from 'react';
import { NOTE_TYPES } from '../../format';
import type { NoteType } from '../../types';
import { BatButton, TextArea } from '../ui';

interface Props {
  tipo: NoteType;
  onAdd: (contenido: string) => Promise<void>;
}

/** Caja para escribir una nota. Ctrl/⌘ + Enter la guarda sin soltar el teclado. */
export default function NoteComposer({ tipo, onAdd }: Props) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    const contenido = text.trim();
    if (!contenido || saving) return;
    setSaving(true);
    try {
      await onAdd(contenido);
      setText('');
    } catch {
      // El padre muestra el error; el texto se conserva para reintentar.
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <TextArea
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void submit();
        }}
        placeholder={NOTE_TYPES[tipo].prompt}
        aria-label={`Nueva nota: ${NOTE_TYPES[tipo].label}`}
      />
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-neutral-600">Ctrl + Enter para guardar</span>
        <BatButton type="submit" variant="outline" className="!px-3 !py-1.5 !text-[10px]" disabled={!text.trim() || saving}>
          {saving ? 'Guardando…' : '+ Anotar'}
        </BatButton>
      </div>
    </form>
  );
}
