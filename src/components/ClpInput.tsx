import { useState, type InputHTMLAttributes } from 'react';

export const normalizeClpDigits = (value: string) =>
  value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');

export const formatClpDigits = (value: string | number | null | undefined) => {
  const digits = normalizeClpDigits(String(value ?? ''));
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

type ClpInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'inputMode' | 'value' | 'onChange'> & {
  value: string | number | null | undefined;
  onValueChange: (digits: string) => void;
};

/** Input for whole-peso CLP values; grouping dots never change the stored integer. */
export function ClpInput({ value, onValueChange, onFocus, onBlur, ...props }: ClpInputProps) {
  const [focused, setFocused] = useState(false);
  const [editingValue, setEditingValue] = useState('');
  const digits = normalizeClpDigits(String(value ?? ''));

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={focused ? editingValue : formatClpDigits(digits)}
      onFocus={event => {
        setEditingValue(formatClpDigits(digits));
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={event => {
        onValueChange(normalizeClpDigits(event.currentTarget.value));
        setFocused(false);
        onBlur?.(event);
      }}
      onChange={event => {
        const nextValue = event.currentTarget.value.replace(/[^\d.,]/g, '').replace(/,/g, '.');
        setEditingValue(nextValue);
        onValueChange(normalizeClpDigits(nextValue));
      }}
    />
  );
}
