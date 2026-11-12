import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type AlertSeverity = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps {
  severity: AlertSeverity;
  children: React.ReactNode;
  title?: string;
  onClose?: () => void;
  action?: React.ReactNode;
  className?: string;
}

const severityConfig = {
  success: {
    bg: 'bg-emerald-600',
    border: 'border-emerald-500',
    icon: CheckCircle2,
    role: 'status' as const,
  },
  error: {
    bg: 'bg-red-600',
    border: 'border-red-500',
    icon: AlertCircle,
    role: 'alert' as const,
  },
  warning: {
    bg: 'bg-amber-600',
    border: 'border-amber-500',
    icon: AlertTriangle,
    role: 'alert' as const,
  },
  info: {
    bg: 'bg-blue-600',
    border: 'border-blue-500',
    icon: Info,
    role: 'status' as const,
  },
};

export { PosSnackbarAlert } from './PosSnackbarAlert';
export type { PosSnackbarAlertProps, PopupAlertSeverity } from './PosSnackbarAlert';

export function Alert({ severity, children, title, onClose, action, className = '' }: AlertProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div
      role={config.role}
      className={`pos-alert-filled pos-alert-filled--${severity} flex items-start gap-3 rounded-xl border ${config.border} ${config.bg} p-3.5 text-white shadow-md font-medium transition-all duration-200 ${className}`}
    >
      <Icon className="h-5 w-5 shrink-0 text-white mt-0.5" aria-hidden="true" />
      <div className="min-w-0 flex-1 leading-relaxed">
        {title && <div className="font-bold text-sm text-white mb-0.5">{title}</div>}
        <div className="text-sm text-white text-opacity-95">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar notificación"
          className="shrink-0 -mr-1 -mt-1 p-1 rounded-lg text-white hover:bg-white/20 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
