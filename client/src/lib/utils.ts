// Utility to concatenate class names, filtering out falsy values.
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
