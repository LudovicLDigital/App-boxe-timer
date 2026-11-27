type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step: number;
  min: number;
  max: number;
  format?: (value: number) => string;
};

export function Stepper({ label, value, onChange, step, min, max, format }: Props) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-controls">
        <button type="button" aria-label={`${label} moins`} disabled={value <= min} onClick={() => set(value - step)}>
          −
        </button>
        <span className="stepper-value">{format ? format(value) : value}</span>
        <button type="button" aria-label={`${label} plus`} disabled={value >= max} onClick={() => set(value + step)}>
          +
        </button>
      </div>
    </div>
  );
}
