export const defaultTheme = {
  primaryColor: '#0f172a',
  secondaryColor: '#f472b6',
  tertiaryColor: '#38bdf8',
  textColor: '#f8fafc',
  mutedTextColor: '#cbd5f5',
  borderColor: 'rgba(248, 250, 252, 0.18)',
};

export const buildTheme = (config = {}) => ({
  primaryColor: config.primary_color || defaultTheme.primaryColor,
  secondaryColor: config.secondary_color || defaultTheme.secondaryColor,
  tertiaryColor: config.tertiary_color || defaultTheme.tertiaryColor,
  textColor: defaultTheme.textColor,
  mutedTextColor: defaultTheme.mutedTextColor,
  borderColor: defaultTheme.borderColor,
});
