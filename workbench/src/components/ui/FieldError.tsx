interface FieldErrorProps {
  message: string | null;
}

export function FieldError({ message }: FieldErrorProps) {
  return message ? <p className="field-error">{message}</p> : null;
}
