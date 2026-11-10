import { useEffect, useState } from 'react';
import { Printer, Usb, Wallet } from 'lucide-react';

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
  ESC(27, 64), ESC(27, 116, 2), centered('SAN MARTIN'), ESC(27, 69, 1), centered('PRUEBA DE IMPRESION'), ESC(27, 69, 0),
  centered('VALE PARA RETIRAR'), line(''), centered('N.° DEMO-001'), line('PARA LLEVAR  ·  12:34'), line('10 nov 2026'), line('------------------------------------------'),
  line('1 x Churrasco Italiano       $5.000'), line('  + Extra queso                 $500'), line(''), ESC(27, 69, 1), line('TOTAL                         $5.500'), ESC(27, 69, 0),
  line('Pago: EFECTIVO'), line('Recibido                      $10.000'), line('Vuelto                         $4.500'), line(''), centered('MUESTRA: NO ES UNA VENTA'), centered('Gracias'), ESC(10, 10, 10), ESC(29, 86, 0, 0)
);
const kitchenSlip = () => append(
  ESC(27, 64), ESC(27, 116, 2), centered('SAN MARTIN'), ESC(27, 69, 1), centered('COMANDA DE PRUEBA'), ESC(27, 69, 0),
  centered('N.° DEMO-001'), centered('PARA LLEVAR  ·  12:34'), line('------------------------------------------'),
  ESC(29, 33, 17), line('1 x Churrasco Italiano'), ESC(29, 33, 0), line('  + Extra queso'), line('  Sin mayo'), line('  Nota: sin tomate, por favor'), line(''), centered('MUESTRA: NO PREPARAR'), ESC(10, 10, 10), ESC(29, 86, 0, 0)
);

export function PosPrinterDiagnostics() {
  const [device, setDevice] = useState<UsbDevice | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const supported = Boolean(usbApi());

  useEffect(() => { void usbApi()?.getDevices().then(devices => { if (devices[0]) setDevice(devices[0]); }).catch(() => undefined); }, []);

  const connect = async () => {
    setError(''); setMessage('');
    if (!usbApi()) { setError('Este navegador no ofrece WebUSB. Prueben desde Google Chrome o Microsoft Edge en el equipo conectado por USB.'); return; }
    setBusy(true);
    try { const picked = await usbApi()!.requestDevice({ filters: [{}] }); setDevice(picked); setMessage(`Impresora autorizada: ${picked.productName || picked.manufacturerName || 'dispositivo USB'}.`); }
    catch (e) { if (e instanceof Error && e.name !== 'NotFoundError') setError(`No se pudo vincular la impresora: ${e.message}`); }
    finally { setBusy(false); }
  };

  const send = async (data: Uint8Array) => {
    if (!device) throw new Error('Primero vincula la impresora USB.');
    await device.open();
    let claimed: number | undefined;
    try {
      if (!device.configuration) await device.selectConfiguration(device.configurations[0]?.configurationValue ?? 1);
      const configs = device.configurations;
      const current = device.configuration ?? configs[0];
      const iface = current?.interfaces.map(i => ({ i, alt: i.alternates.find(a => a.endpoints.some(e => e.direction === 'out' && e.type === 'bulk')) })).find(x => x.alt && (x.alt.interfaceClass === 7 || x.alt.interfaceClass === 255));
      if (!iface?.alt) throw new Error('El dispositivo no expone una interfaz USB de impresión ESC/POS. Windows puede tenerla reservada a un controlador; necesitaremos revisar cómo aparece instalada.');
      await device.claimInterface(iface.i.interfaceNumber); claimed = iface.i.interfaceNumber;
      const endpoint = iface.alt.endpoints.find(e => e.direction === 'out' && e.type === 'bulk')!;
      for (let offset = 0; offset < data.length; offset += 4096) {
        const result = await device.transferOut(endpoint.endpointNumber, new Uint8Array(data.subarray(offset, Math.min(offset + 4096, data.length))).buffer as ArrayBuffer);
        if (result.status !== 'ok') throw new Error(`La impresora devolvió estado USB: ${result.status}.`);
      }
    } finally { if (claimed !== undefined) await device.releaseInterface(claimed).catch(() => undefined); await device.close().catch(() => undefined); }
  };

  const printSample = async () => { setBusy(true); setError(''); setMessage('Enviando comprobante de cliente y comanda de cocina…'); try { await send(append(customerSlip(), kitchenSlip())); setMessage('Muestra enviada: deben salir dos papeles. No se registró ninguna venta ni se abrió la gaveta.'); } catch (e) { setMessage(''); setError(e instanceof Error ? e.message : 'Falló la impresión de prueba.'); } finally { setBusy(false); } };
  const testDrawer = async () => {
    if (!window.confirm('Prueba de gaveta: se enviará un pulso eléctrico a la salida RJ11 de la impresora. Asegura el área y confirma que la gaveta compatible esté conectada. ¿Continuar?')) return;
    setBusy(true); setError(''); setMessage('Enviando pulso de prueba a la gaveta…');
    try { await send(ESC(27, 112, 0, 25, 250)); setMessage('Pulso enviado. Confirma físicamente si la gaveta abrió.'); }
    catch (e) { setMessage(''); setError(e instanceof Error ? e.message : 'No se pudo probar la gaveta.'); }
    finally { setBusy(false); }
  };

  return <section className="rounded-2xl border border-white/10 bg-[#171717] p-5 sm:p-6" aria-labelledby="pos-printer-title">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#FACC15]">Preparación de hardware</p><h2 id="pos-printer-title" className="mt-1 flex items-center gap-2 font-heading text-xl font-bold text-white"><Printer className="h-5 w-5 text-[#FACC15]" />Prueba de impresora DINON 9390</h2><p className="mt-2 text-sm leading-relaxed text-gray-400">Vincula la impresora USB y envía dos muestras ESC/POS en papel de 80 mm. Esta prueba no crea una venta. La gaveta se prueba aparte y solo después de confirmarlo.</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void connect()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/5 disabled:opacity-50"><Usb className="h-4 w-4" />{device ? 'Elegir impresora USB' : 'Vincular impresora USB'}</button><button type="button" onClick={() => void printSample()} disabled={busy || !device} className="rounded-xl bg-[#FACC15] px-4 py-2.5 text-sm font-bold text-[#171717] hover:brightness-105 disabled:opacity-40">Imprimir dos pruebas</button></div>
    </div>
    <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center"><div className="rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-sm"><p className="font-medium text-white">{device ? `${device.manufacturerName ?? ''} ${device.productName ?? 'Dispositivo USB autorizado'}`.trim() : 'Impresora no vinculada'}</p><p className="mt-1 text-xs text-gray-500">{supported ? 'Permiso USB guardado por este navegador, si ya se autorizó.' : 'WebUSB no está disponible en este navegador.'}</p></div><button type="button" onClick={() => void testDrawer()} disabled={busy || !device} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/25 px-4 py-3 text-sm font-semibold text-amber-200 hover:bg-amber-950/20 disabled:opacity-40"><Wallet className="h-4 w-4" />Probar gaveta</button></div>
    {message && <p role="status" className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">{message}</p>}{error && <p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-950/20 px-4 py-3 text-sm text-red-200">{error}</p>}
  </section>;
}
