import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertColor } from '@mui/material/Alert';
import Slide, { SlideProps } from '@mui/material/Slide';

function SlideDownTransition(props: SlideProps) {
  return <Slide {...props} direction="down" />;
}

export type PopupAlertSeverity = 'success' | 'error' | 'warning' | 'info';

export interface PosSnackbarAlertProps {
  open: boolean;
  message: string;
  severity?: PopupAlertSeverity;
  onClose: () => void;
  autoHideDuration?: number | null;
  title?: string;
  action?: React.ReactNode;
}

export function PosSnackbarAlert({
  open,
  message,
  severity = 'info',
  onClose,
  autoHideDuration = 5000,
  title,
  action,
}: PosSnackbarAlertProps) {
  if (!message) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={(_event, reason) => {
        if (reason === 'clickaway') return;
        onClose();
      }}
      slots={{
        transition: SlideDownTransition,
      }}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{
        zIndex: 99999,
        top: { xs: 16, sm: 28 },
      }}
    >
      <MuiAlert
        elevation={8}
        variant="filled"
        severity={severity as AlertColor}
        onClose={onClose}
        action={action}
        className={`pos-popup-alert pos-popup-alert--${severity}`}
        sx={{
          minWidth: { xs: '92vw', sm: '440px' },
          maxWidth: '680px',
          borderRadius: '14px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
          fontSize: '0.95rem',
          fontWeight: 650,
          letterSpacing: '0.01em',
          color: '#ffffff !important',
          display: 'flex',
          alignItems: 'center',
          '& .MuiAlert-icon': {
            fontSize: '1.5rem',
            color: '#ffffff !important',
            mr: 1.5,
          },
          '& .MuiAlert-message': {
            color: '#ffffff !important',
            lineHeight: 1.5,
            py: 0.5,
            flex: 1,
          },
          '& .MuiAlert-action': {
            color: '#ffffff !important',
            pl: 1,
            '& button': {
              color: '#ffffff !important',
            },
          },
          // Filled colors with brand refinement
          '&.MuiAlert-filledSuccess': {
            backgroundColor: '#16a34a !important', // emerald-600
          },
          '&.MuiAlert-filledError': {
            backgroundColor: '#dc2626 !important', // red-600
          },
          '&.MuiAlert-filledWarning': {
            backgroundColor: '#d97706 !important', // amber-600
          },
          '&.MuiAlert-filledInfo': {
            backgroundColor: '#2563eb !important', // blue-600
          },
        }}
      >
        {title && <div className="font-bold text-sm mb-0.5 text-white">{title}</div>}
        <div>{message}</div>
      </MuiAlert>
    </Snackbar>
  );
}
