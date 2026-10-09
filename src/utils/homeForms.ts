/** Suppress native validation bubbles and render errors beside the owning field. */
export function homeFormErrors(form: HTMLFormElement): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const el of Array.from(
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input,select'),
  )) {
    if (el.disabled || !el.id) continue;
    if (el.required && !el.value.trim()) errors[el.id] = 'Preenche este campo.';
    else if (el.value && !el.validity.valid)
      errors[el.id] = 'Indica um valor válido para este campo.';
  }
  return errors;
}
