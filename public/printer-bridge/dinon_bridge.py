#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
  Sanguchería San Martín — Puente Local de Impresión DINON 9390
=============================================================================
Este servicio actúa como intermediario local (HTTP Bridge) entre la aplicación
web del POS (https://sangucheriasanmartin.cl/pos) y el controlador de Windows
de la impresora térmica DINON 9390.

Características:
  - Solo requiere Python estándar (sin 'pip install').
  - Compatible con Windows (usa winspool.drv y ctypes para envío RAW).
  - Soporta apertura automática de gaveta eléctrica por pulso RJ11.
  - Habilita CORS y Private Network Access para llamadas desde navegador HTTPS.
=============================================================================
"""

import base64
import http.server
import json
import os
import platform
import socketserver
import sys
from typing import Dict, List, Optional, Tuple

HOST = "127.0.0.1"
PORT = 9191

IS_WINDOWS = platform.system() == "Windows"

if IS_WINDOWS:
    import ctypes
    from ctypes import wintypes
    import winreg

    winspool = ctypes.WinDLL("winspool.drv")

    class DOC_INFO_1W(ctypes.Structure):
        _fields_ = [
            ("pDocName", wintypes.LPWSTR),
            ("pOutputFile", wintypes.LPWSTR),
            ("pDatatype", wintypes.LPWSTR),
        ]

    winspool.OpenPrinterW.argtypes = [wintypes.LPWSTR, ctypes.POINTER(wintypes.HANDLE), ctypes.c_void_p]
    winspool.OpenPrinterW.restype = wintypes.BOOL

    winspool.StartDocPrinterW.argtypes = [wintypes.HANDLE, wintypes.DWORD, ctypes.POINTER(DOC_INFO_1W)]
    winspool.StartDocPrinterW.restype = wintypes.DWORD

    winspool.StartPagePrinter.argtypes = [wintypes.HANDLE]
    winspool.StartPagePrinter.restype = wintypes.BOOL

    winspool.WritePrinter.argtypes = [wintypes.HANDLE, ctypes.c_char_p, wintypes.DWORD, ctypes.POINTER(wintypes.DWORD)]
    winspool.WritePrinter.restype = wintypes.BOOL

    winspool.EndPagePrinter.argtypes = [wintypes.HANDLE]
    winspool.EndPagePrinter.restype = wintypes.BOOL

    winspool.EndDocPrinter.argtypes = [wintypes.HANDLE]
    winspool.EndDocPrinter.restype = wintypes.BOOL

    winspool.ClosePrinter.argtypes = [wintypes.HANDLE]
    winspool.ClosePrinter.restype = wintypes.BOOL


def list_installed_printers() -> List[str]:
    """Obtiene la lista de impresoras instaladas en Windows."""
    if not IS_WINDOWS:
        return ["Impresora Simulación (No Windows)"]

    printers = []
    try:
        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows NT\CurrentVersion\Devices"
        )
        count = winreg.QueryInfoKey(key)[1]
        for i in range(count):
            name, _, _ = winreg.EnumValue(key, i)
            printers.append(name)
        winreg.CloseKey(key)
    except Exception as err:
        print(f"[!] No se pudo leer el registro de impresoras: {err}", file=sys.stderr)

    return sorted(printers)


def get_default_printer() -> Optional[str]:
    """Devuelve el nombre de la impresora predeterminada de Windows."""
    if not IS_WINDOWS:
        return "Simulación Linux/Mac"

    try:
        size = wintypes.DWORD(0)
        winspool.GetDefaultPrinterW(None, ctypes.byref(size))
        if size.value > 0:
            buf = ctypes.create_unicode_buffer(size.value)
            if winspool.GetDefaultPrinterW(buf, ctypes.byref(size)):
                return buf.value
    except Exception as err:
        print(f"[!] Error al obtener impresora por defecto: {err}", file=sys.stderr)
    return None


def detect_dinon_printer(custom_target: Optional[str] = None) -> Tuple[Optional[str], str]:
    """
    Busca la impresora adecuada:
    1. Si se especificó custom_target y existe, usa esa.
    2. Si alguna contiene 'DINON', '9390', 'POS', 'THERMAL', 'RECIBO' o 'RECEIPT'.
    3. Si no, usa la predeterminada de Windows.
    """
    printers = list_installed_printers()
    default_p = get_default_printer()

    if custom_target:
        for p in printers:
            if custom_target.strip().lower() == p.strip().lower():
                return p, "Selección manual"

    # Buscar por palabras clave de impresoras térmicas DINON
    keywords = ["dinon", "9390", "pos-80", "pos80", "pos-58", "pos58", "thermal", "ticket", "recibo"]
    for kw in keywords:
        for p in printers:
            if kw in p.lower():
                return p, f"Coincidencia automática por palabra clave ('{kw}')"

    if default_p:
        return default_p, "Impresora predeterminada de Windows"

    if printers:
        return printers[0], "Primera impresora detectada"

    return None, "No se encontraron impresoras"


def send_raw_to_printer(printer_name: str, raw_data: bytes, doc_name: str = "Ticket San Martin") -> None:
    """Envía un flujo de bytes RAW directamente al spooler de impresión de Windows."""
    if not IS_WINDOWS:
        print(f"[SIMULACIÓN] Impresión enviada a '{printer_name}' ({len(raw_data)} bytes).")
        return

    h_printer = wintypes.HANDLE()
    if not winspool.OpenPrinterW(printer_name, ctypes.byref(h_printer), None):
        last_error = ctypes.GetLastError()
        raise RuntimeError(f"No se pudo abrir la impresora '{printer_name}' (Código de error Windows: {last_error})")

    try:
        doc_info = DOC_INFO_1W(doc_name, None, "RAW")
        job_id = winspool.StartDocPrinterW(h_printer, 1, ctypes.byref(doc_info))
        if job_id <= 0:
            last_error = ctypes.GetLastError()
            raise RuntimeError(f"Error al iniciar trabajo de impresión en '{printer_name}' (Código: {last_error})")

        try:
            if not winspool.StartPagePrinter(h_printer):
                last_error = ctypes.GetLastError()
                raise RuntimeError(f"Error al iniciar página de impresión (Código: {last_error})")

            try:
                bytes_written = wintypes.DWORD(0)
                success = winspool.WritePrinter(
                    h_printer,
                    raw_data,
                    len(raw_data),
                    ctypes.byref(bytes_written)
                )
                if not success or bytes_written.value != len(raw_data):
                    last_error = ctypes.GetLastError()
                    raise RuntimeError(f"Error al transmitir bytes a la impresora (Código: {last_error})")
            finally:
                winspool.EndPagePrinter(h_printer)
        finally:
            winspool.EndDocPrinter(h_printer)
    finally:
        winspool.ClosePrinter(h_printer)


# Comando estándar ESC/POS para abrir gaveta conectada a RJ11: ESC p 0 25 250
DRAWER_PULSE_BYTES = bytes([27, 112, 0, 25, 250])


class PosPrinterRequestHandler(http.server.BaseHTTPRequestHandler):
    """Manejador HTTP con soporte CORS y Private Network Access."""

    def _send_cors_headers(self, status_code: int = 200, content_type: str = "application/json"):
        self.send_response(status_code)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Max-Age", "86400")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.end_headers()

    def do_OPTIONS(self):
        """Manejo de preflights CORS para Chrome/Edge desde HTTPS."""
        self._send_cors_headers(204, "text/plain")

    def do_GET(self):
        if self.path in ("/", "/status", "/health"):
            printers = list_installed_printers()
            default_p = get_default_printer()
            selected_p, reason = detect_dinon_printer()

            payload = {
                "status": "ok",
                "service": "Sanguchería San Martín — Puente Local DINON",
                "version": "1.0.0",
                "is_windows": IS_WINDOWS,
                "selected_printer": selected_p,
                "selection_reason": reason,
                "default_printer": default_p,
                "printers": printers,
            }
            body = json.dumps(payload, indent=2).encode("utf-8")
            self._send_cors_headers(200, "application/json; charset=utf-8")
            self.wfile.write(body)
            return

        self._send_cors_headers(404)
        self.wfile.write(b'{"error": "Ruta no encontrada"}')

    def do_POST(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len) if content_len > 0 else b"{}"

        try:
            data = json.loads(body.decode("utf-8")) if body else {}
        except Exception as err:
            self._send_cors_headers(400)
            self.wfile.write(json.dumps({"error": f"JSON inválido: {err}"}).encode("utf-8"))
            return

        target_printer = data.get("printer_name")
        active_printer, _ = detect_dinon_printer(target_printer)

        if not active_printer:
            self._send_cors_headers(500)
            self.wfile.write(json.dumps({
                "status": "error",
                "message": "No hay impresoras disponibles o instaladas en el equipo."
            }).encode("utf-8"))
            return

        if self.path == "/open-drawer":
            try:
                send_raw_to_printer(active_printer, DRAWER_PULSE_BYTES, doc_name="Apertura Gaveta San Martin")
                self._send_cors_headers(200)
                self.wfile.write(json.dumps({
                    "status": "ok",
                    "message": f"Pulso de gaveta enviado a '{active_printer}'",
                    "printer": active_printer
                }).encode("utf-8"))
            except Exception as err:
                self._send_cors_headers(500)
                self.wfile.write(json.dumps({
                    "status": "error",
                    "message": str(err),
                    "printer": active_printer
                }).encode("utf-8"))
            return

        if self.path == "/print":
            data_base64 = data.get("data_base64")
            if not data_base64:
                self._send_cors_headers(400)
                self.wfile.write(json.dumps({
                    "status": "error",
                    "message": "Falta el campo 'data_base64' con los bytes ESC/POS."
                }).encode("utf-8"))
                return

            try:
                raw_bytes = base64.b64decode(data_base64)
                if data.get("open_drawer"):
                    raw_bytes += DRAWER_PULSE_BYTES

                send_raw_to_printer(active_printer, raw_bytes, doc_name="Comprobante San Martin POS")
                self._send_cors_headers(200)
                self.wfile.write(json.dumps({
                    "status": "ok",
                    "message": f"Trabajo impreso correctamente en '{active_printer}'",
                    "bytes_printed": len(raw_bytes),
                    "printer": active_printer
                }).encode("utf-8"))
            except Exception as err:
                self._send_cors_headers(500)
                self.wfile.write(json.dumps({
                    "status": "error",
                    "message": f"Fallo al imprimir: {err}",
                    "printer": active_printer
                }).encode("utf-8"))
            return

        self._send_cors_headers(404)
        self.wfile.write(b'{"error": "Endpoint POST no reconocido"}')

    def log_message(self, format, *args):
        # Muestra logs claros y concisos en consola
        sys.stdout.write(f"[{self.log_date_time_string()}] {args[0]} {args[1]} -> {args[2]}\n")
        sys.stdout.flush()


class ThreadedTCPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def main():
    selected_p, reason = detect_dinon_printer()
    printers = list_installed_printers()

    print("=" * 68)
    print("  🍔 Sanguchería San Martín — Puente Local de Impresora DINON 9390")
    print("=" * 68)
    print(f"  * Sistema Operativo:   {platform.system()} ({platform.release()})")
    print(f"  * Servidor Local:      http://{HOST}:{PORT}")
    print(f"  * Impresora activa:    {selected_p or 'NO DETECTADA'}")
    print(f"  * Criterio:            {reason}")
    print(f"  * Impresoras en PC:    {len(printers)} encontradas")
    for idx, p in enumerate(printers, 1):
        indicator = " -> [ACTIVA]" if p == selected_p else ""
        print(f"     {idx}. {p}{indicator}")
    print("=" * 68)
    print("  Esperando órdenes desde el POS Web (https://sangucheriasanmartin.cl/pos)...")
    print("  (Presiona Ctrl+C para detener el servicio)")
    print("=" * 68)
    sys.stdout.flush()

    try:
        with ThreadedTCPServer((HOST, PORT), PosPrinterRequestHandler) as server:
            server.serve_forever()
    except KeyboardInterrupt:
        print("\n[+] Puente local detenido por el usuario.")
    except Exception as err:
        print(f"\n[!] Error en el servidor local: {err}", file=sys.stderr)


if __name__ == "__main__":
    main()
