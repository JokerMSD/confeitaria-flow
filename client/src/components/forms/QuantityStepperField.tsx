import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  applyQuantityDelta,
  getQuickQuantityActions,
  getQuantityStep,
} from "@/features/inventory/lib/inventory-input-helpers";

interface QuantityStepperFieldProps {
  id: string;
  label: string;
  value: string;
  unit: string;
  placeholder?: string;
  min?: string;
  className?: string;
  inputClassName?: string;
  helpText?: string;
  onChange: (value: string) => void;
}

export function QuantityStepperField({
  id,
  label,
  value,
  unit,
  placeholder,
  min = "0",
  className,
  inputClassName,
  helpText,
  onChange,
}: QuantityStepperFieldProps) {
  const actions = getQuickQuantityActions(unit);

  return (
    <div className={className}>
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          type="number"
          min={min}
          step={getQuantityStep(unit)}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={inputClassName}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {actions.map((delta) => (
          <Button
            key={delta}
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={() => onChange(applyQuantityDelta(value, delta))}
          >
            +{delta}
          </Button>
        ))}
      </div>
      {helpText && (
        <p className="text-xs text-muted-foreground mt-2">{helpText}</p>
      )}
    </div>
  );
}
