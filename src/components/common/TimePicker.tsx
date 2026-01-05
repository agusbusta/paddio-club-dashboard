import React from 'react';
import { TextFieldProps } from '@mui/material';
import { TimePicker as MuiTimePicker } from '@mui/x-date-pickers/TimePicker';

interface TimePickerProps extends Omit<TextFieldProps, 'value' | 'onChange'> {
  value: string | null; // Formato HH:MM
  onChange: (time: string | null) => void;
  label: string;
  disabled?: boolean;
  minTime?: Date;
  maxTime?: Date;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  minTime,
  maxTime,
  ...textFieldProps
}) => {
  const timeValue = value ? (() => {
    const [hours, minutes] = value.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return date;
  })() : null;

  const handleChange = (newValue: Date | null) => {
    if (newValue) {
      const hours = String(newValue.getHours()).padStart(2, '0');
      const minutes = String(newValue.getMinutes()).padStart(2, '0');
      onChange(`${hours}:${minutes}`);
    } else {
      onChange(null);
    }
  };

  return (
    <MuiTimePicker
      label={label}
      value={timeValue}
      onChange={handleChange}
      disabled={disabled}
      minTime={minTime}
      maxTime={maxTime}
      slotProps={{
        textField: {
          fullWidth: true,
          ...textFieldProps,
        },
      }}
    />
  );
};
