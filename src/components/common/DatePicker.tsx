import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

interface DatePickerProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'type'> {
  value: string | null;
  onChange: (date: string | null) => void;
  label: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  minDate,
  maxDate,
  disabled = false,
  ...textFieldProps
}) => {
  // Convertir Date a string YYYY-MM-DD para el input
  const getMinDateString = () => {
    if (!minDate) return undefined;
    const year = minDate.getFullYear();
    const month = String(minDate.getMonth() + 1).padStart(2, '0');
    const day = String(minDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMaxDateString = () => {
    if (!maxDate) return undefined;
    const year = maxDate.getFullYear();
    const month = String(maxDate.getMonth() + 1).padStart(2, '0');
    const day = String(maxDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue || null);
  };

  return (
    <TextField
      type="date"
      label={label}
      value={value || ''}
      onChange={handleChange}
      disabled={disabled}
      InputLabelProps={{
        shrink: true,
      }}
      inputProps={{
        min: getMinDateString(),
        max: getMaxDateString(),
      }}
      fullWidth
      {...textFieldProps}
    />
  );
};
