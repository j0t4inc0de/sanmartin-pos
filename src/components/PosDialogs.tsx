import { createContext, useCallback, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

type Tone = 'primary' | 'warning' | 'danger';
type ConfirmOptions = { title: string; message: string; confirmLabel?: string; cancelLabel?: string; tone?: Tone };
type PromptOptions = ConfirmOptions & { placeholder?: string; inputLabel?: string };
type Request =
  | { kind: 'confirm'; options: ConfirmOptions; resolve: (value: boolean) => void }
  | { kind: 'prompt'; options: PromptOptions; resolve: (value: string | null) => void };
type DialogApi = { confirm: (options: ConfirmOptions) => Promise<boolean>; prompt: (options: PromptOptions) => Promise<string | null> };

const DialogContext = createContext<DialogApi | null>(null);

export function usePosDialogs() {
  const value = useContext(DialogContext);
  if (!value) throw new Error('usePosDialogs debe usarse dentro de PosDialogProvider.');
  return value;
}

export function PosDialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>(resolve => {
    setRequest({ kind: 'confirm', options, resolve });
  }), []);
  const prompt = useCallback((options: PromptOptions) => new Promise<string | null>(resolve => {
    setInputValue('');
    setRequest({ kind: 'prompt', options, resolve });
  }), []);

  const finish = (value: boolean | string | null) => {
    if (!request) return;
    if (request.kind === 'confirm' && typeof value === 'boolean') request.resolve(value);
    if (request.kind === 'prompt' && (typeof value === 'string' || value === null)) request.resolve(value);
    setRequest(null);
  };

  useEffect(() => {
    if (!request) return;
    if (!restoreFocusRef.current) restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (request.kind === 'prompt') inputRef.current?.focus();
    else cancelRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); finish(request.kind === 'confirm' ? false : null); }
      if (event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)');
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [request]);

  useEffect(() => {
    if (request) return;
    restoreFocusRef.current?.focus();
    restoreFocusRef.current = null;
  }, [request]);

  const submitPrompt = (event: FormEvent) => {
    event.preventDefault();
    if (inputValue.trim()) finish(inputValue.trim());
  };

  const options = request?.options;
  const tone = options?.tone ?? 'primary';
  const Icon = tone === 'danger' ? AlertTriangle : tone === 'warning' ? Info : CheckCircle2;

  return <DialogContext.Provider value={{ confirm, prompt }}>
    {children}
    {request && options && <div className="pos-dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) finish(request.kind === 'confirm' ? false : null); }}>
      {request.kind === 'confirm' ? <section ref={dialogRef} className="pos-dialog" role="alertdialog" aria-modal="true" aria-labelledby="pos-dialog-title" aria-describedby="pos-dialog-message">
        <div className={`pos-dialog-icon is-${tone}`}><Icon className="h-5 w-5" aria-hidden="true" /></div>
        <h2 id="pos-dialog-title" className="pos-dialog-title">{options.title}</h2>
        <p id="pos-dialog-message" className="pos-dialog-message">{options.message}</p>
        <div className="pos-dialog-actions"><button ref={cancelRef} type="button" className="pos-dialog-secondary" onClick={() => finish(false)}>{options.cancelLabel ?? 'Volver'}</button><button type="button" className={`pos-dialog-primary is-${tone}`} onClick={() => finish(true)}>{options.confirmLabel ?? 'Confirmar'}</button></div>
      </section> : <form ref={element => { dialogRef.current = element; }} className="pos-dialog" role="alertdialog" aria-modal="true" aria-labelledby="pos-dialog-title" aria-describedby="pos-dialog-message" onSubmit={submitPrompt}>
        <div className="pos-dialog-icon is-warning"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></div>
        <h2 id="pos-dialog-title" className="pos-dialog-title">{options.title}</h2>
        <p id="pos-dialog-message" className="pos-dialog-message">{options.message}</p>
        <label className="pos-dialog-label" htmlFor="pos-dialog-input">{request.options.inputLabel ?? 'Motivo'}</label>
        <input ref={inputRef} id="pos-dialog-input" autoComplete="off" required maxLength={240} value={inputValue} onChange={event => setInputValue(event.target.value)} placeholder={request.options.placeholder ?? 'Escribe el motivo'} className="pos-dialog-input" />
        <div className="pos-dialog-actions"><button type="button" className="pos-dialog-secondary" onClick={() => finish(null)}>{options.cancelLabel ?? 'Cancelar'}</button><button type="submit" className={`pos-dialog-primary is-${tone}`} disabled={!inputValue.trim()}>{options.confirmLabel ?? 'Continuar'}</button></div>
      </form>}
    </div>}
  </DialogContext.Provider>;
}
