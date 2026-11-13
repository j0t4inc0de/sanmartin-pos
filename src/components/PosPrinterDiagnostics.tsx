import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Download, FileCode, Printer, RefreshCw, Usb, Wallet, WifiOff } from 'lucide-react';
import { usePosDialogs } from './PosDialogs';
import { checkLocalBridge, printViaLocalBridge, openDrawerViaLocalBridge, type BridgeStatusResponse } from '../services/posPrinter';

type UsbEndpoint = { direction: 'in' | 'out'; type: string; endpointNumber: number };
type UsbAlternate = { interfaceClass: number; interfaceSubclass: number; interfaceProtocol: number; endpoints: UsbEndpoint[] };
type UsbInterface = { interfaceNumber: number; alternates: UsbAlternate[]; claimed: boolean };
type UsbConfiguration = { configurationValue: number; interfaces: UsbInterface[] };
type UsbDevice = {
  productName?: string; manufacturerName?: string; configurations: UsbConfiguration[];
  configuration: UsbConfiguration | null;
  open(): Promise<void>; close(): Promise<void>; selectConfiguration(value: number): Promise<void>;
  claimInterface(number: number): Promise<void>; releaseInterface(number: number): Promise<void>;
  transferOut(endpoint: number, data: ArrayBuffer): Promise<{ status: string }>;
};
type UsbApi = { requestDevice(options: { filters: Record<string, never>[] }): Promise<UsbDevice>; getDevices(): Promise<UsbDevice[]> };

const usbApi = () => (navigator as Navigator & { usb?: UsbApi }).usb;
const enc = new TextEncoder();
const cp850: Record<string, number> = { á:160, é:130, í:161, ó:162, ú:163, ü:129, ñ:164, Ñ:165, Á:181, É:144, Í:214, Ó:224, Ú:233, Ü:154, '¿':168, '¡':173, '°':248 };
const bytes = (text: string) => Uint8Array.from(Array.from(text).flatMap(char => cp850[char] !== undefined ? [cp850[char]] : [...enc.encode(char)]));
const append = (...arrays: Uint8Array[]) => { const out = new Uint8Array(arrays.reduce((n, a) => n + a.length, 0)); let at = 0; arrays.forEach(a => { out.set(a, at); at += a.length; }); return out; };
const ESC = (...v: number[]) => Uint8Array.from(v);
const line = (value: string) => append(bytes(value), ESC(10));
const centered = (value: string) => append(ESC(27, 97, 1), line(value), ESC(27, 97, 0));
const customerSlip = () => append(
  ESC(27, 64), ESC(27, 116, 2), centered('SAN MARTÍN'), ESC(27, 69, 1), centered('PRUEBA DE IMPRESION'), ESC(27, 69, 0),
  centered('VALE PARA RETIRAR'), line(''), centered('N.° DEMO-001'), line('PARA LLEVAR  ·  12:34'), line('13 nov 2026'), line('------------------------------------------'),
  line('1 x Churrasco Italiano       $5.000'), line('  + Extra queso                 $500'), line(''), ESC(27, 69, 1), line('TOTAL                         $5.500'), ESC(27, 69, 0),
  line('Pago: EFECTIVO'), line('Recibido                      $10.000'), line('Vuelto                         $4.500'), line(''), centered('MUESTRA: NO ES UNA VENTA'), centered('Gracias'), ESC(10, 10, 10), ESC(29, 86, 0, 0)
);
const kitchenSlip = () => append(
  ESC(27, 64), ESC(27, 116, 2), centered('SAN MARTÍN'), ESC(27, 69, 1), centered('COMANDA DE PRUEBA'), ESC(27, 69, 0),
  centered('N.° DEMO-001'), centered('PARA LLEVAR  ·  12:34'), line('------------------------------------------'),
  ESC(29, 33, 17), line('1 x Churrasco Italiano'), ESC(29, 33, 0), line('  + Extra queso'), line('  Sin mayo'), line('  Nota: sin tomate, por favor'), line(''), centered('MUESTRA: NO PREPARAR'), ESC(10, 10, 10), ESC(29, 86, 0, 0)
);

export function PosPrinterDiagnostics() {
  const { confirm } = usePosDialogs();
  const [bridge, setBridge] = useState<BridgeStatusResponse | null>(null);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [checkingBridge, setCheckingBridge] = useState(false);
  const [device, setDevice] = useState<UsbDevice | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showWebUsbAdvanced, setShowWebUsbAdvanced] = useState(false);
  const supportedWebUsb = Boolean(usbApi());

  const pollBridge = async () => {
    try {
      setCheckingBridge(true);
      const res = await checkLocalBridge();
      setBridge(res);
      if (res?.selected_printer && !selectedPrinter) {
        setSelectedPrinter(res.selected_printer);
      }
    } finally {
      setCheckingBridge(false);
    }
  };

  useEffect(() => {
    void pollBridge();
    const interval = setInterval(() => {
      void pollBridge();
    }, 3500);
    return () => clearInterval(interval);
  }, [selectedPrinter]);

  useEffect(() => {
    void usbApi()?.getDevices().then(devices => {
      if (devices[0]) setDevice(devices[0]);
    }).catch(() => undefined);
  }, []);

  const connectUsb = async () => {
    setError(''); setMessage('');
    if (!usbApi()) {
      setError('Este navegador no ofrece WebUSB. Prueben desde Google Chrome o Microsoft Edge.');
      return;
    }
    setBusy(true);
    try {
      const picked = await usbApi()!.requestDevice({ filters: [{}] });
      setDevice(picked);
      setMessage(`Impresora USB autorizada: ${picked.productName || picked.manufacturerName || 'dispositivo USB'}.`);
    } catch (e) {
      if (e instanceof Error && e.name !== 'NotFoundError') {
        setError(`No se pudo vincular la impresora USB: ${e.message}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const sendUsb = async (data: Uint8Array) => {
    if (!device) throw new Error('Primero vincula la impresora USB.');
    await device.open();
    let claimed: number | undefined;
    try {
      if (!device.configuration) await device.selectConfiguration(device.configurations[0]?.configurationValue ?? 1);
      const configs = device.configurations;
      const current = device.configuration ?? configs[0];
      const iface = current?.interfaces.map(i => ({ i, alt: i.alternates.find(a => a.endpoints.some(e => e.direction === 'out' && e.type === 'bulk')) })).find(x => x.alt && (x.alt.interfaceClass === 7 || x.alt.interfaceClass === 255));
      if (!iface?.alt) throw new Error('El dispositivo no expone una interfaz USB de impresión ESC/POS. Windows puede tenerla reservada al controlador; usa el Puente Local.');
      await device.claimInterface(iface.i.interfaceNumber);
      claimed = iface.i.interfaceNumber;
      const endpoint = iface.alt.endpoints.find(e => e.direction === 'out' && e.type === 'bulk')!;
      for (let offset = 0; offset < data.length; offset += 4096) {
        const result = await device.transferOut(endpoint.endpointNumber, new Uint8Array(data.subarray(offset, Math.min(offset + 4096, data.length))).buffer as ArrayBuffer);
        if (result.status !== 'ok') throw new Error(`La impresora devolvió estado USB: ${result.status}.`);
      }
    } finally {
      if (claimed !== undefined) await device.releaseInterface(claimed).catch(() => undefined);
      await device.close().catch(() => undefined);
    }
  };

  const printSample = async () => {
    setBusy(true);
    setError('');
    setMessage('Enviando comprobante de cliente y comanda de cocina…');
    const sampleData = append(customerSlip(), kitchenSlip());

    try {
      if (bridge && bridge.status === 'ok') {
        await printViaLocalBridge(sampleData, { printerName: selectedPrinter || bridge.selected_printer });
        setMessage(`Muestra enviada mediante el Puente Local a '${selectedPrinter || bridge.selected_printer}'. Deben salir dos papeles.`);
      } else if (device) {
        await sendUsb(sampleData);
        setMessage('Muestra enviada por WebUSB. Deben salir dos papeles.');
      } else {
        throw new Error('No hay ninguna impresora conectada. Inicia el puente local de Windows o vincula la impresora por USB.');
      }
    } catch (e) {
      setMessage('');
      setError(e instanceof Error ? e.message : 'Falló la impresión de prueba.');
    } finally {
      setBusy(false);
    }
  };

  const testDrawer = async () => {
    if (!await confirm({
      title: 'Probar gaveta de dinero',
      message: 'Se enviará un pulso eléctrico a la salida RJ11 de la impresora. Asegura el área y verifica que la gaveta compatible esté conectada antes de continuar.',
      confirmLabel: 'Enviar pulso',
      tone: 'warning',
    })) return;

    setBusy(true);
    setError('');
    setMessage('Enviando pulso de prueba a la gaveta…');

    try {
      if (bridge && bridge.status === 'ok') {
        await openDrawerViaLocalBridge({ printerName: selectedPrinter || bridge.selected_printer });
        setMessage(`Pulso enviado a la gaveta a través de '${selectedPrinter || bridge.selected_printer}'. Confirma físicamente si abrió.`);
      } else if (device) {
        await sendUsb(ESC(27, 112, 0, 25, 250));
        setMessage('Pulso enviado por WebUSB. Confirma físicamente si la gaveta abrió.');
      } else {
        throw new Error('No hay impresora disponible para enviar el pulso.');
      }
    } catch (e) {
      setMessage('');
      setError(e instanceof Error ? e.message : 'No se pudo probar la gaveta.');
    } finally {
      setBusy(false);
    }
  };

  const isConnected = Boolean(bridge && bridge.status === 'ok');

  return (
    <section className="space-y-6" aria-labelledby="pos-printer-title">
      {/* Encabezado */}
      <div className="rounded-2xl border border-white/10 bg-[#171717] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#FACC15]">Hardware del Food Truck</p>
            <h2 id="pos-printer-title" className="mt-1 flex items-center gap-2 font-heading text-xl font-bold text-white">
              <Printer className="h-5 w-5 text-[#FACC15]" />
              Impresora DINON 9390 y Gaveta de Dinero
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              Imprime comprobantes para el cliente (80 mm), comandas para cocina y activa el pulso RJ11 para apertura automática de caja en pagos en efectivo.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void pollBridge()}
              disabled={checkingBridge}
              title="Volver a comprobar estado"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-white/5 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${checkingBridge ? 'animate-spin' : ''}`} />
              Verificar
            </button>
            <button
              type="button"
              onClick={() => void printSample()}
              disabled={busy || (!isConnected && !device)}
              className="rounded-xl bg-[#FACC15] px-4 py-2.5 text-sm font-bold text-[#171717] hover:brightness-105 disabled:opacity-40"
            >
              Imprimir dos pruebas
            </button>
            <button
              type="button"
              onClick={() => void testDrawer()}
              disabled={busy || (!isConnected && !device)}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-400/25 px-4 py-2.5 text-sm font-semibold text-amber-200 hover:bg-amber-950/20 disabled:opacity-40"
            >
              <Wallet className="h-4 w-4" />
              Probar gaveta
            </button>
          </div>
        </div>

        {/* Feedback visual de mensajes y errores */}
        {message && (
          <p role="status" className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-950/20 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}
      </div>

      {/* Tarjeta Principal: Estado del Puente Local de Windows */}
      <div className={`rounded-2xl border p-5 sm:p-6 transition-colors ${isConnected ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-amber-500/25 bg-[#171717]'}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 rounded-xl p-2.5 ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400'}`}>
              {isConnected ? <CheckCircle2 className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-heading text-lg font-bold text-white">
                  {isConnected ? 'Puente Local Conectado' : 'Puente Local No Detectado'}
                </h3>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${isConnected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-gray-400'}`}>
                  <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                  {isConnected ? '127.0.0.1:9191 · Activo' : '127.0.0.1:9191 · Desconectado'}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {isConnected
                  ? 'La aplicación web se comunica exitosamente con el controlador oficial de Windows de la DINON 9390.'
                  : 'Windows bloquea el acceso directo por navegador. El puente local en segundo plano permite imprimir a través del driver oficial.'}
              </p>
            </div>
          </div>
        </div>

        {isConnected ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="printer-select" className="block text-xs font-medium text-gray-400">
                  Impresora seleccionada en Windows:
                </label>
                {bridge?.printers && bridge.printers.length > 1 ? (
                  <select
                    id="printer-select"
                    value={selectedPrinter || bridge.selected_printer || ''}
                    onChange={e => setSelectedPrinter(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#171717] px-3 py-2 text-sm text-white focus:border-[#FACC15] focus:outline-none"
                  >
                    {bridge.printers.map(p => (
                      <option key={p} value={p}>
                        {p} {p === bridge.selected_printer ? ' (Recomendada/Detectada)' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-white">
                    {bridge?.selected_printer || 'DINON 9390'}
                  </p>
                )}
                <p className="mt-1 text-xs text-emerald-400">
                  {bridge?.selection_reason || 'Detectada correctamente'}
                </p>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-400">Estado del servicio:</span>
                <p className="mt-1 text-xs text-gray-300">
                  Versión: {bridge?.version || '1.0.0'} · Plataforma: {bridge?.is_windows ? 'Windows Spooler' : 'Genérico'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Responde automáticamente en cada cobro de pedido sin intervención manual.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4 rounded-xl border border-white/10 bg-black/30 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Cómo habilitar la impresora en este computador:</h4>
                <p className="text-xs text-gray-400">Configuración rápida de una sola vez para el Food Truck.</p>
              </div>
              <a
                href="/printer-bridge/sanmartin-bridge.zip"
                download="sanmartin-bridge.zip"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FACC15] px-4 py-2.5 text-xs font-bold text-[#171717] shadow hover:brightness-105"
              >
                <Download className="h-4 w-4" />
                Descargar Puente (.ZIP)
              </a>
            </div>

            <ol className="grid gap-3 sm:grid-cols-3 text-xs text-gray-300">
              <li className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <span className="font-bold text-[#FACC15]">1. Descarga el paquete</span>
                <p className="mt-1 text-gray-400">
                  Descarga el archivo comprimido y extráelo en cualquier carpeta del PC (ej. en el Escritorio o Documentos).
                </p>
              </li>
              <li className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <span className="font-bold text-[#FACC15]">2. Inicio automático</span>
                <p className="mt-1 text-gray-400">
                  Haz doble clic en <strong className="text-white">instalar_inicio_automatico.bat</strong> para que arranque solo al encender el PC.
                </p>
              </li>
              <li className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <span className="font-bold text-[#FACC15]">3. Detección inmediata</span>
                <p className="mt-1 text-gray-400">
                  Esta pantalla cambiará a <strong className="text-emerald-400">Verde</strong> automáticamente y la impresora estará lista.
                </p>
              </li>
            </ol>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-gray-500 border-t border-white/5">
              <span>Archivos incluidos:</span>
              <a href="/printer-bridge/dinon_bridge.py" download className="inline-flex items-center gap-1 text-gray-400 hover:text-white underline">
                <FileCode className="h-3 w-3" /> dinon_bridge.py
              </a>
              <a href="/printer-bridge/iniciar_puente.bat" download className="inline-flex items-center gap-1 text-gray-400 hover:text-white underline">
                iniciar_puente.bat
              </a>
              <a href="/printer-bridge/instalar_inicio_automatico.bat" download className="inline-flex items-center gap-1 text-gray-400 hover:text-white underline">
                instalar_inicio_automatico.bat
              </a>
              <a href="/printer-bridge/LEEME.txt" download className="inline-flex items-center gap-1 text-gray-400 hover:text-white underline">
                LEEME.txt
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Sección Secundaria / Respaldo WebUSB */}
      <div className="rounded-2xl border border-white/10 bg-[#171717] p-4 text-xs">
        <button
          type="button"
          onClick={() => setShowWebUsbAdvanced(!showWebUsbAdvanced)}
          className="flex w-full items-center justify-between font-medium text-gray-400 hover:text-white"
        >
          <span className="flex items-center gap-2">
            <Usb className="h-4 w-4" />
            Conexión directa WebUSB (Alternativa de respaldo para Linux / Mac)
          </span>
          {showWebUsbAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showWebUsbAdvanced && (
          <div className="mt-4 space-y-3 pt-3 border-t border-white/10">
            <p className="text-gray-400 leading-relaxed">
              WebUSB intenta comunicarse directamente con el puerto USB del navegador. En Windows suele fallar porque el driver del sistema operativo bloquea el puerto, por lo que se recomienda el Puente Local.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void connectUsb()}
                disabled={busy || !supportedWebUsb}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/5 disabled:opacity-50"
              >
                <Usb className="h-3.5 w-3.5" />
                {device ? 'Cambiar dispositivo WebUSB' : 'Vincular por WebUSB'}
              </button>
              <span className="text-gray-400">
                {device
                  ? `Vinculado: ${device.manufacturerName ?? ''} ${device.productName ?? 'Dispositivo USB'}`.trim()
                  : 'Ningún dispositivo WebUSB vinculado'}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
