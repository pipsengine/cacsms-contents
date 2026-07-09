import { colorTokens, typographyTokens, spacingTokens, radiusTokens, shadowTokens, iconTokens, breakpoints } from './tokens'

export type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P]
}

export interface ThemeSpec {
  name: string
  description: string
  colors: typeof colorTokens
  typography: typeof typographyTokens
  spacing: typeof spacingTokens
  radius: typeof radiusTokens
  shadows: typeof shadowTokens
  icons: typeof iconTokens
  breakpoints: typeof breakpoints
}

const mergeDeep = <T extends Record<string, any>>(base: T, override?: PartialDeep<T>): T => {
  if (!override) return base
  const result: Record<string, any> = { ...base }
  for (const key of Object.keys(override)) {
    if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
      result[key] = mergeDeep(base[key] ?? {}, override[key] as any)
    } else {
      result[key] = override[key]
    }
  }
  return result as T
}

export const lightTheme: ThemeSpec = {
  name: 'light',
  description: 'Primary enterprise theme with bright surfaces and refined depth',
  colors: colorTokens,
  typography: typographyTokens,
  spacing: spacingTokens,
  radius: radiusTokens,
  shadows: shadowTokens,
  icons: iconTokens,
  breakpoints,
}

export const darkTheme: ThemeSpec = {
  name: 'dark',
  description: 'Secondary theme optimized for low-light environments with strong contrast and luminous highlights',
  colors: mergeDeep(colorTokens, {
    neutral: {
      0: { ...colorTokens.neutral[800], cssVariable: '--cacs-color-neutral-0', figmaVariable: 'Neutral/0', tailwind: 'neutral-0' },
      100: { ...colorTokens.neutral[500], cssVariable: '--cacs-color-neutral-100', figmaVariable: 'Neutral/100', tailwind: 'neutral-100' },
      300: { ...colorTokens.neutral[300], cssVariable: '--cacs-color-neutral-300', figmaVariable: 'Neutral/300', tailwind: 'neutral-300' },
      500: { ...colorTokens.neutral[100], cssVariable: '--cacs-color-neutral-500', figmaVariable: 'Neutral/500', tailwind: 'neutral-500' },
      800: { ...colorTokens.neutral[0], cssVariable: '--cacs-color-neutral-800', figmaVariable: 'Neutral/800', tailwind: 'neutral-800' },
    },
  }),
  typography: typographyTokens,
  spacing: spacingTokens,
  radius: radiusTokens,
  shadows: shadowTokens,
  icons: iconTokens,
  breakpoints,
}

export const highContrastTheme: ThemeSpec = {
  name: 'high-contrast',
  description: 'Theme designed for maximum readability with sharp contrast and accessible color pairings',
  colors: {
    ...colorTokens,
    neutral: {
      0: { ...colorTokens.neutral[800], cssVariable: '--cacs-color-neutral-0', figmaVariable: 'Neutral/0', tailwind: 'neutral-0' },
      100: { ...colorTokens.neutral[500], cssVariable: '--cacs-color-neutral-100', figmaVariable: 'Neutral/100', tailwind: 'neutral-100' },
      300: { ...colorTokens.neutral[100], cssVariable: '--cacs-color-neutral-300', figmaVariable: 'Neutral/300', tailwind: 'neutral-300' },
      500: { ...colorTokens.neutral[0], cssVariable: '--cacs-color-neutral-500', figmaVariable: 'Neutral/500', tailwind: 'neutral-500' },
      800: { ...colorTokens.neutral[800], cssVariable: '--cacs-color-neutral-800', figmaVariable: 'Neutral/800', tailwind: 'neutral-800' },
    },
  } as any,
  typography: typographyTokens,
  spacing: spacingTokens,
  radius: radiusTokens,
  shadows: shadowTokens,
  icons: iconTokens,
  breakpoints,
}

export const accessibilityTheme: ThemeSpec = {
  name: 'accessibility',
  description: 'Theme optimized for users requiring enhanced legibility, focus states, and consistent contrast',
  colors: {
    ...colorTokens,
    state: {
      ...colorTokens.state,
      focus: {
        ...colorTokens.state.focus,
        hex: '#4D7BFF',
        rgb: '77, 123, 255',
        hsl: '223, 100%, 65%',
        cssVariable: '--cacs-color-state-focus',
        figmaVariable: 'State/Focus',
        tailwind: 'state-focus',
      },
    },
    border: {
      subtle: {
        ...colorTokens.border.subtle,
        hex: '#9BA8D0',
        rgb: '155, 168, 208',
        hsl: '221, 35%, 72%',
        cssVariable: '--cacs-color-border-subtle',
        figmaVariable: 'Border/Subtle',
        tailwind: 'border-subtle',
      },
    },
  } as any,
  typography: {
    ...typographyTokens,
    bodyLarge: { ...typographyTokens.bodyLarge, fontSize: '17px', lineHeight: '28px' },
    bodyMedium: { ...typographyTokens.bodyMedium, fontSize: '16px', lineHeight: '26px' },
    bodySmall: { ...typographyTokens.bodySmall, fontSize: '15px', lineHeight: '24px' },
  },
  spacing: spacingTokens,
  radius: radiusTokens,
  shadows: shadowTokens,
  icons: iconTokens,
  breakpoints,
}

export const themeMap = {
  light: lightTheme,
  dark: darkTheme,
  highContrast: highContrastTheme,
  accessibility: accessibilityTheme,
}

export const cssVariables = {
  color: {
    primary500: '--cacs-color-primary-500',
    neutral100: '--cacs-color-neutral-100',
    surfaceBackground: '--cacs-color-surface-background',
    borderSubtle: '--cacs-color-border-subtle',
    stateHover: '--cacs-color-state-hover',
    statusSuccess: '--cacs-color-status-success',
    statusWarning: '--cacs-color-status-warning',
    statusDanger: '--cacs-color-status-danger',
  },
  typography: {
    fontFamily: '--cacs-font-family-base',
    fontSizeBase: '--cacs-font-size-base',
    lineHeightBase: '--cacs-line-height-base',
  },
  spacing: {
    spacing4: '--cacs-spacing-4',
    spacing8: '--cacs-spacing-8',
    spacing16: '--cacs-spacing-16',
  },
  radius: {
    sm: '--cacs-radius-sm',
    md: '--cacs-radius-md',
    lg: '--cacs-radius-lg',
  },
}

export const themeTokens = {
  light: {
    '--cacs-font-family-base': 'Inter, system-ui, sans-serif',
    '--cacs-font-family-mono': 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
    '--cacs-font-size-base': '16px',
    '--cacs-line-height-base': '24px',
  },
  dark: {
    '--cacs-font-family-base': 'Inter, system-ui, sans-serif',
    '--cacs-font-family-mono': 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
    '--cacs-font-size-base': '16px',
    '--cacs-line-height-base': '24px',
  },
}
