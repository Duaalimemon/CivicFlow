import React, { forwardRef } from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    return (
      <div className="flex flex-col space-y-1 w-full">
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="text-xs font-semibold text-navy">
            {label}
          </label>
          {props.required && <span className="text-[10px] text-navy/40 uppercase">Required</span>}
        </div>
        <input
          id={inputId}
          ref={ref}
          className={`h-10 px-3 py-2 bg-surface text-navy text-sm border rounded-base border-stroke-hairline focus:outline-none focus:border-civic focus:ring-1 focus:ring-civic transition-colors shadow-subtle placeholder:text-navy/40 ${
            error ? 'border-red-500 focus:ring-red-500' : ''
          } ${className}`}
          {...props}
        />
        {hint && !error && <span className="text-[11px] text-navy/60">{hint}</span>}
        {error && <span className="text-[11px] text-red-600 font-medium">{error}</span>}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
