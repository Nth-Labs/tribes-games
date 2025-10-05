export const defaultTheme = {
  primaryColor: '#1f2937',
  secondaryColor: '#38bdf8',
  tertiaryColor: '#fcd34d',
  textColor: '#f9fafb',
  mutedTextColor: '#cbd5f5',
  panelColor: 'rgba(17, 24, 39, 0.72)',
  borderColor: 'rgba(255, 255, 255, 0.12)',
};

export const buildTheme = (config = {}) => ({
  primaryColor: config.primary_color || defaultTheme.primaryColor,
  secondaryColor: config.secondary_color || defaultTheme.secondaryColor,
  tertiaryColor: config.tertiary_color || defaultTheme.tertiaryColor,
  textColor: defaultTheme.textColor,
  mutedTextColor: defaultTheme.mutedTextColor,
  panelColor: defaultTheme.panelColor,
  borderColor: defaultTheme.borderColor,
});
