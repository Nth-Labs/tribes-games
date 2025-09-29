const unwrapMongoValue = (value) => {
  if (value && typeof value === 'object') {
    if (value.$numberInt !== undefined) {
      return unwrapMongoValue(value.$numberInt);
    }
    if (value.$numberDouble !== undefined) {
      return unwrapMongoValue(value.$numberDouble);
    }
    if (value.$numberLong !== undefined) {
      return unwrapMongoValue(value.$numberLong);
    }
    if (value.$numberDecimal !== undefined) {
      return unwrapMongoValue(value.$numberDecimal);
    }
    if (value.$oid !== undefined) {
      return unwrapMongoValue(value.$oid);
    }
    if (value.$date !== undefined) {
      return unwrapMongoValue(value.$date);
    }
    if (value.value !== undefined) {
      return unwrapMongoValue(value.value);
    }
  }

  return value;
};

const toCleanString = (value) => {
  const unwrapped = unwrapMongoValue(value);
  if (typeof unwrapped === 'string') {
    return unwrapped.trim();
  }
  if (typeof unwrapped === 'number' && Number.isFinite(unwrapped)) {
    return `${unwrapped}`;
  }
  return '';
};

export const isCssGradient = (value) => {
  return typeof value === 'string' && value.trim().includes('gradient(');
};

const hexToRgba = (hex, alpha) => {
  const cleaned = toCleanString(hex).replace('#', '');

  if (cleaned.length !== 3 && cleaned.length !== 6) {
    return null;
  }

  const expanded = cleaned.length === 3 ? cleaned.split('').map((char) => char + char).join('') : cleaned;
  const numeric = Number.parseInt(expanded, 16);

  if (Number.isNaN(numeric)) {
    return null;
  }

  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;
  const safeAlpha = typeof alpha === 'number' ? Math.min(Math.max(alpha, 0), 1) : 1;

  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
};

const pickColor = (value, fallback) => {
  const trimmed = toCleanString(value);
  if (trimmed) {
    return trimmed;
  }
  return fallback;
};

export const defaultTheme = {
  backgroundColor: '#fdfaf5',
  backgroundImage:
    'radial-gradient(circle at 10% 0%, rgba(125, 211, 252, 0.45), transparent 55%), radial-gradient(circle at 90% -20%, rgba(253, 224, 171, 0.6), transparent 52%), linear-gradient(160deg, #fdfaf5 0%, #e8f3ff 55%, #fdfaf5 100%)',
  backgroundOverlayColor: 'rgba(255, 255, 255, 0.82)',
  accentColor: '#60a5fa',
  titleColor: '#0f172a',
  textColor: '#1f2937',
  subtleTextColor: 'rgba(71, 85, 105, 0.75)',
  panelBackgroundColor: 'rgba(255, 255, 255, 0.88)',
  panelBorderColor: 'rgba(148, 163, 184, 0.32)',
  panelShadowColor: 'rgba(148, 163, 184, 0.26)',
  boardBackgroundColor: 'rgba(255, 255, 255, 0.92)',
  boardBorderColor: 'rgba(191, 219, 254, 0.7)',
  boardShadowColor: 'rgba(100, 116, 139, 0.24)',
  cardBackBackgroundColor: 'rgba(226, 232, 240, 0.85)',
  cardFaceBackgroundColor: 'rgba(239, 246, 255, 0.92)',
  cardBorderColor: 'rgba(191, 219, 254, 0.9)',
  cardMatchedBackgroundColor: 'rgba(191, 227, 255, 0.65)',
  cardMatchedGlowColor: 'rgba(96, 165, 250, 0.58)',
  cardShadowColor: 'rgba(148, 163, 184, 0.4)',
  buttonBackgroundColor: '#3b82f6',
  buttonHoverBackgroundColor: '#2563eb',
  buttonTextColor: '#f8fafc',
  cardFlipDurationMs: 520
};

export const createThemeFromConfig = (config) => {
  const themeOverrides = config && typeof config.theme === 'object' && config.theme ? config.theme : {};

  const backgroundBase = pickColor(config?.primary_color ?? config?.primaryColor, defaultTheme.backgroundColor);
  const accentBase = pickColor(config?.secondary_color ?? config?.secondaryColor, defaultTheme.accentColor);
  const supportBase = pickColor(config?.tertiary_color ?? config?.tertiaryColor, defaultTheme.cardBackBackgroundColor);

  const overlayBase = pickColor(
    config?.background_overlay_color ?? config?.backgroundOverlayColor,
    defaultTheme.backgroundOverlayColor
  );
  const backgroundImageBase =
    toCleanString(config?.background_image ?? config?.backgroundImage ?? config?.game_background_image) ||
    defaultTheme.backgroundImage;

  const backgroundColor = pickColor(themeOverrides.backgroundColor, backgroundBase);
  const accentColor = pickColor(themeOverrides.accentColor, accentBase);
  const cardBackBackgroundColor = pickColor(themeOverrides.cardBackBackgroundColor, supportBase);
  const backgroundOverlayColor = pickColor(themeOverrides.backgroundOverlayColor, overlayBase);
  const backgroundImage = toCleanString(themeOverrides.backgroundImage) || backgroundImageBase;

  const accentSoft = hexToRgba(accentColor, 0.25) || defaultTheme.cardMatchedBackgroundColor;
  const accentGlow = hexToRgba(accentColor, 0.55) || defaultTheme.cardMatchedGlowColor;
  const borderTint = hexToRgba(accentColor, 0.35) || defaultTheme.boardBorderColor;

  const buttonBackgroundColor = pickColor(themeOverrides.buttonBackgroundColor, accentColor);
  const buttonHoverBackgroundColor = pickColor(themeOverrides.buttonHoverBackgroundColor, accentColor);
  const boardBorderColor = pickColor(themeOverrides.boardBorderColor, borderTint);
  const cardBorderColor = pickColor(themeOverrides.cardBorderColor, borderTint);

  return {
    ...defaultTheme,
    backgroundColor,
    accentColor,
    backgroundOverlayColor,
    backgroundImage,
    cardBackBackgroundColor,
    cardMatchedBackgroundColor: pickColor(themeOverrides.cardMatchedBackgroundColor, accentSoft),
    cardMatchedGlowColor: pickColor(themeOverrides.cardMatchedGlowColor, accentGlow),
    buttonBackgroundColor,
    buttonHoverBackgroundColor,
    boardBorderColor,
    cardBorderColor,
    ...themeOverrides
  };
};
