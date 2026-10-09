// ============================================================
// Design tokens — single source of truth for brand values.
// Use these for any non-MUI styling (charts, brand panels, etc.).
// The MUI theme (theme.js) is derived from these same values.
// ============================================================

export const colors = {
  // Brand green (matches the existing sidebar / headings)
  brand: '#3D8C4F',
  brandDark: '#2e6c3b',
  brandLight: '#e8f3eb',
  brand50: '#ecf8ef',
  brand100: '#d4edda',
  brand200: '#b3dfbd',
  brand300: '#85cb94',
  brand400: '#57b770',
  brand500: '#3D8C4F',
  brand600: '#2e6c3b',
  brand700: '#265832',
  brand800: '#1e4428',
  brand900: '#16311d',

  // Neutrals (cool grey for corporate feel)
  ink: '#111827',
  inkSoft: '#4b5563',
  inkMuted: '#9ca3af',
  line: '#e5e7eb',
  surface: '#ffffff',
  surfaceMuted: '#f9fbfa',
  background: '#f4f7f5',

  // Semantic
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#e0414a',
  info: '#0277bd',
};

// Palette used to color chart series consistently across the app.
export const chartPalette = [
  '#3D8C4F',
  '#2e6c3b',
  '#7cb342',
  '#0277bd',
  '#ed6c02',
  '#8e24aa',
  '#00897b',
  '#c62828',
];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
};

export const radius = {
  sm: 8,
  md: 10,
  lg: 16,
  pill: 999,
};

export const fontFamily =
  "Inter, 'Segoe UI', system-ui, -apple-system, sans-serif";
