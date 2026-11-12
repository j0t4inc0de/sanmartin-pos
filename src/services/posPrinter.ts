import type { PosPrintJob } from './posLocalStore';

type UsbEndpoint = { direction: 'in' | 'out'; type: string; endpointNumber: number };
type UsbAlternate = { interfaceClass: number; endpoints: UsbEndpoint[] };
type UsbInterface = { interfaceNumber: number; alternates: UsbAlternate[] };
type UsbConfiguration = { configurationValue: number; interfaces: UsbInterface[] };
type UsbDevice = {
  productName?: string;
  manufacturerName?: string;
  configurations: UsbConfiguration[];
  configuration: UsbConfiguration | null;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(value: number): Promise<void>;
  claimInterface(number: number): Promise<void>;
  releaseInterface(number: number): Promise<void>;
  transferOut(endpoint: number, data: ArrayBuffer): Promise<{ status: string }>;
};
type UsbApi = { requestDevice(options: { filters: Record<string, never>[] }): Promise<UsbDevice>; getDevices(): Promise<UsbDevice[]> };

const usbApi = () => (navigator as Navigator & { usb?: UsbApi }).usb;
const encoder = new TextEncoder();
const codePage850: Record<string, number> = { á: 160, é: 130, í: 161, ó: 162, ú: 163, ü: 129, ñ: 164, Ñ: 165, Á: 181, É: 144, Í: 214, Ó: 224, Ú: 233, Ü: 154, '¿': 168, '¡': 173, '°': 248 };
const esc = (...values: number[]) => Uint8Array.from(values);
const append = (...arrays: Uint8Array[]) => {
  const output = new Uint8Array(arrays.reduce((total, array) => total + array.length, 0));
  let offset = 0;
  arrays.forEach(array => { output.set(array, offset); offset += array.length; });
  return output;
};
const text = (value: string) => Uint8Array.from(Array.from(value.normalize('NFC')).flatMap(character => {
  if (codePage850[character] !== undefined) return [codePage850[character]];
  if (character === '×') return [120];
  if (character === '·') return [45];
  if (character === '—' || character === '–') return [45];
  if (character === ' ') return [32];
  return [...encoder.encode(character.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))];
}));
const line = (value = '') => append(text(value), esc(10));
const centered = (value: string) => append(esc(27, 97, 1), line(value), esc(27, 97, 0));
const money = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value).replace(/\u00a0/g, ' ');
const fit = (value: string, width: number) => Array.from(value).slice(0, width).join('');
const wrap = (value: string, width = 46) => {
  const words = value.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';
  words.forEach(word => {
    if (word.length > width) {
      if (current) lines.push(current);
      current = '';
      for (let i = 0; i < word.length; i += width) lines.push(word.slice(i, i + width));
    } else if (!current) current = word;
    else if (`${current} ${word}`.length <= width) current += ` ${word}`;
    else { lines.push(current); current = word; }
  });
  if (current) lines.push(current);
  return lines;
};
const row = (label: string, value: string, width = 46) => {
  const right = fit(value, width);
  const left = fit(label, Math.max(1, width - right.length - 1));
  return line(`${left}${' '.repeat(Math.max(1, width - left.length - right.length))}${right}`);
};
const dateText = (iso: string) => new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
const orderNo = (number: number) => String(number).padStart(3, '0');
const totalForItem = (item: PosPrintJob['items'][number]) => item.quantity * (item.unit_price + item.modifiers.reduce((sum, modifier) => sum + (modifier.price_at_sale > 0 ? modifier.price_at_sale * modifier.quantity_per_unit : 0), 0));

const customerReceipt = (job: PosPrintJob, reprint: boolean) => {
  const parts: Uint8Array[] = [esc(27, 64), esc(27, 116, 2), centered('SAN MARTÍN'), esc(27, 69, 1), centered('VALE PARA RETIRAR'), esc(27, 69, 0)];
  if (reprint) parts.push(centered('REIMPRESION'));
  parts.push(esc(29, 33, 17), centered(`N. ${orderNo(job.shift_order_number)}`), esc(29, 33, 0));
  parts.push(centered(job.consumption_type === 'PARA_LLEVAR' ? 'PARA LLEVAR' : 'PARA SERVIR'), centered(dateText(job.created_at)), line('-'.repeat(46)));
  job.items.forEach(item => {
    wrap(`${item.quantity} x ${item.product_name}`).forEach((value, index) => parts.push(line(index === 0 ? value : `  ${value}`)));
    item.modifiers.filter(modifier => modifier.price_at_sale > 0).forEach(modifier => {
      wrap(`  + ${modifier.modifier_name}${modifier.quantity_per_unit > 1 ? ` x${modifier.quantity_per_unit}` : ''}`).forEach(value => parts.push(line(value)));
    });
    parts.push(row('', money(totalForItem(item))));
  });
  parts.push(line('-'.repeat(46)), esc(27, 69, 1), row('TOTAL', money(job.total_amount)), esc(27, 69, 0));
  parts.push(line(`Pago: ${job.payment_method.replace('_', ' ')}`));
  if (job.payment_method === 'EFECTIVO' && job.amount_paid !== null) {
    parts.push(row('Recibido', money(job.amount_paid)), row('Vuelto', money(job.change_given ?? 0)));
  }
  parts.push(line(''), centered('Conserve este numero para retirar'), centered('Gracias por su compra'), esc(10, 10), esc(29, 86, 0, 0));
  return append(...parts);
};

const kitchenChit = (job: PosPrintJob, reprint: boolean) => {
  const parts: Uint8Array[] = [esc(27, 64), esc(27, 116, 2), centered('SAN MARTÍN'), esc(27, 69, 1), centered('COMANDA COCINA'), esc(27, 69, 0)];
  if (reprint) parts.push(centered('REIMPRESION'));
  parts.push(esc(29, 33, 17), centered(`N. ${orderNo(job.shift_order_number)}`), esc(29, 33, 0));
  parts.push(centered(job.consumption_type === 'PARA_LLEVAR' ? 'PARA LLEVAR' : 'PARA SERVIR'), centered(dateText(job.created_at)), line('-'.repeat(46)));
  job.items.forEach(item => {
    parts.push(esc(29, 33, 17));
    wrap(`${item.quantity} x ${item.product_name}`).forEach(value => parts.push(line(value)));
    parts.push(esc(29, 33, 0));
    item.modifiers.forEach(modifier => {
      const prefix = modifier.price_at_sale > 0 ? '+ ' : '';
      const count = modifier.price_at_sale > 0 && modifier.quantity_per_unit > 1 ? ` x${modifier.quantity_per_unit}` : '';
      wrap(`  ${prefix}${modifier.modifier_name}${count}`).forEach(value => parts.push(line(value)));
    });
    if ((item.notes ?? '').trim()) wrap(`  Nota: ${item.notes.trim()}`).forEach(value => parts.push(line(value)));
    parts.push(line(''));
  });
  parts.push(line('-'.repeat(46)), esc(10, 10), esc(29, 86, 0, 0));
  return append(...parts);
};

export const isPosUsbSupported = () => Boolean(usbApi());
export const requestPosPrinter = async () => {
  const api = usbApi();
  if (!api) throw new Error('WebUSB no está disponible. Usa Chrome o Edge en el equipo conectado a la impresora.');
  return api.requestDevice({ filters: [{}] });
};

const send = async (data: Uint8Array) => {
  const api = usbApi();
  if (!api) throw new Error('WebUSB no está disponible. Usa Chrome o Edge en el equipo conectado a la impresora.');
  const devices = await api.getDevices();
  const candidates = devices.filter(candidate => candidate.configurations.some(configuration => configuration.interfaces.some(iface =>
    iface.alternates.some(alternate => (alternate.interfaceClass === 7 || alternate.interfaceClass === 255)
      && alternate.endpoints.some(endpoint => endpoint.direction === 'out' && endpoint.type === 'bulk')))));
  const device = candidates.find(candidate => `${candidate.manufacturerName ?? ''} ${candidate.productName ?? ''}`.toLocaleLowerCase().includes('dinon'))
    ?? (candidates.length === 1 ? candidates[0] : undefined);
  if (!device && candidates.length > 1) throw new Error('Hay varios dispositivos USB de impresión autorizados. En Configuración del equipo, selecciona solo la DINON y vuelve a intentar.');
  if (!device) throw new Error('No hay una impresora ESC/POS autorizada en este navegador. Abre Impresora en el POS y vincula la DINON.');
  await device.open();
  let claimed: number | undefined;
  try {
    if (!device.configuration) await device.selectConfiguration(device.configurations[0]?.configurationValue ?? 1);
    const config = device.configuration ?? device.configurations[0];
    const pair = config?.interfaces.map(iface => ({ iface, alternate: iface.alternates.find(alt => alt.endpoints.some(endpoint => endpoint.direction === 'out' && endpoint.type === 'bulk')) }))
      .find(candidate => candidate.alternate && (candidate.alternate.interfaceClass === 7 || candidate.alternate.interfaceClass === 255));
    if (!pair?.alternate) throw new Error('La DINON no expone una interfaz USB compatible con ESC/POS. Revisa si Windows o su controlador la mantienen ocupada.');
    await device.claimInterface(pair.iface.interfaceNumber);
    claimed = pair.iface.interfaceNumber;
    const endpoint = pair.alternate.endpoints.find(item => item.direction === 'out' && item.type === 'bulk')!;
    for (let offset = 0; offset < data.length; offset += 4096) {
      const chunk = data.slice(offset, Math.min(offset + 4096, data.length));
      const result = await device.transferOut(endpoint.endpointNumber, chunk.buffer as ArrayBuffer);
      if (result.status !== 'ok') throw new Error(`La impresora devolvió el estado USB: ${result.status}.`);
    }
  } finally {
    if (claimed !== undefined) await device.releaseInterface(claimed).catch(() => undefined);
    await device.close().catch(() => undefined);
  }
};

export const printPosSale = async (job: PosPrintJob, options: { reprint?: boolean; openDrawer?: boolean } = {}) => {
  const data = append(customerReceipt(job, Boolean(options.reprint)), kitchenChit(job, Boolean(options.reprint)), ...(options.openDrawer ? [esc(27, 112, 0, 25, 250)] : []));
  await send(data);
};

export const openPosCashDrawer = async () => send(esc(27, 112, 0, 25, 250));
