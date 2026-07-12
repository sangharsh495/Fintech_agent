// Professional Design System - Industry Standard Dimensions & Layout
// FinFlow Financial Application Design Tokens

// ============================================
// SPACING SYSTEM (8px Base Grid)
// ============================================
export const spacing = {
  // Base units
  xs: '0.25rem',     // 4px
  sm: '0.5rem',      // 8px
  md: '1rem',        // 16px
  lg: '1.5rem',      // 24px
  xl: '2rem',        // 32px
  '2xl': '3rem',     // 48px
  '3xl': '4rem',     // 64px
  '4xl': '6rem',     // 96px
  '5xl': '8rem',     // 128px

  // Component-specific
  cardPadding: '1.5rem',           // 24px
  cardPaddingSm: '1rem',           // 16px
  cardPaddingLg: '2rem',           // 32px
  sectionPadding: '2rem',          // 32px
  sectionPaddingLg: '3rem',        // 48px
  pagePadding: '1rem',             // 16px mobile
  pagePaddingMd: '2rem',           // 32px tablet
  pagePaddingLg: '4rem',           // 64px desktop

  // Gap sizes
  gapSm: '0.75rem',    // 12px
  gapMd: '1rem',       // 16px
  gapLg: '1.5rem',     // 24px
  gapXl: '2rem',       // 32px

  // Border radius
  radiusSm: '0.375rem',    // 6px
  radius: '0.5rem',        // 8px
  radiusMd: '0.75rem',     // 12px
  radiusLg: '1rem',        // 16px
  radiusXl: '1.5rem',      // 24px
  radius2xl: '2rem',       // 32px
  radiusFull: '9999px',    // Full circle

  // Heights
  headerHeight: '4rem',     // 64px
  footerHeight: '4rem',     // 64px
  sidebarWidth: '16rem',    // 256px
  sidebarCollapsed: '4rem', // 64px
  navbarHeight: '4rem',     // 64px

  // Form elements
  inputHeight: '2.5rem',    // 40px
  inputHeightSm: '2rem',     // 32px
  inputHeightLg: '3rem',     // 48px
  buttonHeight: '2.5rem',    // 40px
  buttonHeightSm: '2rem',     // 32px
  buttonHeightLg: '3rem',     // 48px
}

// ============================================
// TYPOGRAPHY SYSTEM
// ============================================
export const typography = {
  // Font families
  sans: 'Inter, system-ui, -apple-system, sans-serif',
  mono: 'JetBrains Mono, Fira Code, monospace',
  serif: 'Georgia, serif',

  // Font sizes (rem based)
  textXs: '0.75rem',      // 12px
  textSm: '0.875rem',     // 14px
  textBase: '1rem',       // 16px
  textLg: '1.125rem',     // 18px
  textXl: '1.25rem',      // 20px
  text2xl: '1.5rem',      // 24px
  text3xl: '1.875rem',    // 30px
  text4xl: '2.25rem',     // 36px
  text5xl: '3rem',        // 48px
  text6xl: '3.75rem',     // 60px

  // Font weights
  fontLight: 300,
  fontNormal: 400,
  fontMedium: 500,
  fontSemibold: 600,
  fontBold: 700,
  fontExtrabold: 800,
  fontBlack: 900,

  // Line heights
  leadingNone: 1,
  leadingTight: 1.25,
  leadingSnug: 1.375,
  leadingNormal: 1.5,
  leadingRelaxed: 1.625,
  leadingLoose: 2,

  // Letter spacing
  trackingTighter: '-0.05em',
  trackingTight: '-0.025em',
  trackingNormal: '0',
  trackingWide: '0.025em',
  trackingWider: '0.05em',
  trackingWidest: '0.1em',
}

// ============================================
// COLOR SYSTEM (Semantic Tokens)
// ============================================
export const colors = {
  // Primary palette
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',      // Primary brand color
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Secondary palette
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Success palette
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',      // Success color
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Warning palette
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',      // Warning color
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  // Error palette
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',      // Error color
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },

  // Info palette
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
  },

  // Gradient definitions
  gradients: {
    primary: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    purple: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    teal: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
    dark: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  },

  // Semantic colors
  semantic: {
    background: {
      primary: 'hsl(var(--background))',
      secondary: 'hsl(var(--background-secondary))',
      tertiary: 'hsl(var(--background-tertiary))',
    },
    foreground: {
      primary: 'hsl(var(--foreground))',
      secondary: 'hsl(var(--foreground-secondary))',
      tertiary: 'hsl(var(--foreground-tertiary))',
      muted: 'hsl(var(--foreground-muted))',
    },
    border: {
      primary: 'hsl(var(--border))',
      secondary: 'hsl(var(--border-secondary))',
    },
    card: {
      background: 'hsl(var(--card))',
      foreground: 'hsl(var(--card-foreground))',
      border: 'hsl(var(--card-border))',
    },
    accent: {
      primary: 'hsl(var(--accent))',
      foreground: 'hsl(var(--accent-foreground))',
    },
    destructive: {
      background: 'hsl(var(--destructive))',
      foreground: 'hsl(var(--destructive-foreground))',
    },
    muted: {
      background: 'hsl(var(--muted))',
      foreground: 'hsl(var(--muted-foreground))',
    },
    popover: {
      background: 'hsl(var(--popover))',
      foreground: 'hsl(var(--popover-foreground))',
    },
  }
}

// ============================================
// SHADOW SYSTEM
// ============================================
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '3xl': '0 35px 60px -15px rgb(0 0 0 / 0.3)',

  // Colored shadows
  primary: {
    sm: '0 4px 14px 0 rgba(59, 130, 246, 0.15)',
    md: '0 8px 25px 0 rgba(59, 130, 246, 0.2)',
    lg: '0 15px 40px 0 rgba(59, 130, 246, 0.25)',
  },
  success: {
    sm: '0 4px 14px 0 rgba(16, 185, 129, 0.15)',
    md: '0 8px 25px 0 rgba(16, 185, 129, 0.2)',
  },
  warning: {
    sm: '0 4px 14px 0 rgba(245, 158, 11, 0.15)',
  },
  error: {
    sm: '0 4px 14px 0 rgba(239, 68, 68, 0.15)',
  },

  // Inner shadows
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  innerLg: 'inset 0 4px 8px 0 rgb(0 0 0 / 0.1)',

  // Glow effects
  glow: {
    primary: '0 0 20px rgba(59, 130, 246, 0.3)',
    success: '0 0 20px rgba(16, 185, 129, 0.3)',
    warning: '0 0 20px rgba(245, 158, 11, 0.3)',
    error: '0 0 20px rgba(239, 68, 68, 0.3)',
  }
}

// ============================================
// BORDER SYSTEM
// ============================================
export const borders = {
  none: '0',
  sm: '1px',
  md: '2px',
  lg: '4px',
  xl: '8px',

  // Styles
  solid: 'solid',
  dashed: 'dashed',
  dotted: 'dotted',

  // Radii (from spacing)
  radius: spacing.radius,
  radiusSm: spacing.radiusSm,
  radiusMd: spacing.radiusMd,
  radiusLg: spacing.radiusLg,
  radiusXl: spacing.radiusXl,
  radius2xl: spacing.radius2xl,
  radiusFull: spacing.radiusFull,
}

// ============================================
// TRANSITIONS & ANIMATIONS
// ============================================
export const transitions = {
  // Durations
  instant: '75ms',
  fast: '150ms',
  normal: '250ms',
  slow: '350ms',
  slower: '500ms',
  slowest: '700ms',

  // Easing
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

  // Presets
  button: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  card: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  modal: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  fade: 'opacity 0.2s ease-out',
  slide: 'transform 0.3s ease-out',
  scale: 'transform 0.2s ease-out',
  spin: 'transform 0.6s linear',
}

export const animations = {
  // Keyframe animations
  spin: '@keyframes spin { to { transform: rotate(360deg); } }',
  pulse: '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }',
  bounce: '@keyframes bounce { 0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); } 50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); } }',
  fadeIn: '@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }',
  fadeInUp: '@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }',
  fadeInDown: '@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }',
  fadeInLeft: '@keyframes fadeInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }',
  fadeInRight: '@keyframes fadeInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }',
  scaleIn: '@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }',
  slideIn: '@keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }',
  shimmer: '@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }',

  // Animation durations
  durations: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    slower: '500ms',
    slowest: '700ms',
  }
}

// ============================================
// Z-INDEX SCALE
// ============================================
export const zIndex = {
  auto: 'auto',
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  notification: 800,
  max: 9999,
}

// ============================================
// LAYOUT CONSTANTS
// ============================================
export const layout = {
  // Container widths
  containerSm: '640px',
  containerMd: '768px',
  containerLg: '1024px',
  containerXl: '1280px',
  container2xl: '1536px',
  containerFull: '100%',


  // Breakpoints
  breakpoint: {
    xs: '360px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Grid
  grid: {
    columns: {
      mobile: 1,
      tablet: 2,
      desktop: 3,
      wide: 4,
    },
    gap: spacing.gapMd,
    gapLg: spacing.gapLg,
  },

  // Card dimensions
  card: {
    width: {
      sm: '300px',
      md: '384px',
      lg: '448px',
      xl: '512px',
      full: '100%',
    },
    height: {
      auto: 'auto',
      sm: '200px',
      md: '280px',
      lg: '360px',
    },
    aspectRatio: {
      square: '1 / 1',
      video: '16 / 9',
      wide: '21 / 9',
      portrait: '9 / 16',
    }
  },

  // Sidebar
  sidebar: {
    width: spacing.sidebarWidth,
    collapsedWidth: spacing.sidebarCollapsed,
    transition: transitions.normal,
  },

  // Header
  header: {
    height: spacing.headerHeight,
    transition: transitions.normal,
  },

  // Form spacing
  form: {
    labelMarginBottom: spacing.xs,
    inputMarginBottom: spacing.md,
    fieldGap: spacing.gapMd,
    rowGap: spacing.gapLg,
  }
}

// ============================================
// COMPONENT DIMENSIONS
// ============================================
export const components = {
  // Buttons
  button: {
    height: spacing.inputHeight,
    heightSm: spacing.inputHeightSm,
    heightLg: spacing.inputHeightLg,
    paddingX: spacing.md,
    paddingXSm: spacing.sm,
    paddingXLg: spacing.lg,
    paddingY: spacing.sm,
    paddingYLg: spacing.md,
    borderRadius: spacing.radius,
    borderRadiusLg: spacing.radiusLg,
    fontSize: typography.textSm,
    fontSizeLg: typography.textBase,
    fontWeight: typography.fontMedium,
  },

  // Inputs
  input: {
    height: spacing.inputHeight,
    heightSm: spacing.inputHeightSm,
    heightLg: spacing.inputHeightLg,
    paddingX: spacing.md,
    paddingY: spacing.sm,
    borderRadius: spacing.radius,
    fontSize: typography.textBase,
    fontSizeSm: typography.textSm,
  },

  // Cards
  card: {
    borderRadius: spacing.radiusLg,
    borderRadiusSm: spacing.radius,
    borderRadiusLg: spacing.radiusXl,
    padding: spacing.cardPadding,
    paddingSm: spacing.cardPaddingSm,
    paddingLg: spacing.cardPaddingLg,
    shadow: shadows.md,
    shadowLg: shadows.lg,
    shadowHover: shadows.lg,
    borderWidth: borders.sm,
  },

  // Badges
  badge: {
    paddingX: spacing.sm,
    paddingY: spacing.xs,
    borderRadius: spacing.radiusFull,
    fontSize: typography.textXs,
    fontWeight: typography.fontMedium,
    height: spacing.inputHeightSm,
  },

  // Avatars
  avatar: {
    size: {
      xs: spacing.inputHeightSm,
      sm: spacing.inputHeight,
      md: '2.75rem',    // 44px
      lg: '3.5rem',     // 56px
      xl: '4.5rem',     // 72px
    },
    borderRadius: spacing.radiusFull,
  },

  // Alerts
  alert: {
    borderRadius: spacing.radius,
    padding: spacing.md,
    iconSize: spacing.inputHeightSm,
    fontSize: typography.textSm,
  },

  // Dialogs/Modals
  dialog: {
    borderRadius: spacing.radiusXl,
    padding: spacing.sectionPadding,
    maxWidth: layout.containerMd,
    overlayOpacity: 0.5,
    backdropBlur: '4px',
  },

  // Tooltips
  tooltip: {
    borderRadius: spacing.radius,
    padding: spacing.sm,
    fontSize: typography.textSm,
    maxWidth: '200px',
    arrowSize: '8px',
  },

  // Tables
  table: {
    borderRadius: spacing.radius,
    cellPadding: spacing.md,
    rowHeight: '3rem',    // 48px
    headerHeight: '3.5rem', // 56px
    fontSize: typography.textSm,
    fontSizeHeader: typography.textBase,
  },

  // Progress bars
  progress: {
    height: spacing.sm,
    heightLg: spacing.md,
    borderRadius: spacing.radiusFull,
  },

  // Tabs
  tabs: {
    height: spacing.inputHeight,
    paddingX: spacing.md,
    paddingY: spacing.sm,
    fontSize: typography.textSm,
    borderRadius: spacing.radius,
    indicatorHeight: '2px',
  },

  // Accordions
  accordion: {
    borderRadius: spacing.radius,
    padding: spacing.md,
    triggerPadding: spacing.md,
    contentPadding: spacing.md,
    iconSize: spacing.inputHeightSm,
  },

  // Charts
  chart: {
    containerPadding: spacing.md,
    legendFontSize: typography.textXs,
    labelFontSize: typography.textSm,
    tooltipPadding: spacing.sm,
    tooltipBorderRadius: spacing.radius,
  }
}

// ============================================
// RESPONSIVE BREAKPOINTS
// ============================================
export const breakpoints = {
  xs: '(min-width: 360px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
  hover: '(hover: hover)',
  pointer: '(pointer: fine)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
}

// ============================================
// THEME CONFIGURATION
// ============================================
export const theme = {
  // Default theme
  default: {
    name: 'default',
    primary: colors.primary[500],
    secondary: colors.secondary[600],
    success: colors.success[500],
    warning: colors.warning[500],
    error: colors.error[500],
    info: colors.info[500],
    background: '#ffffff',
    foreground: '#1f2937',
    card: '#ffffff',
    border: '#e5e7eb',
    muted: '#f3f4f6',
    popover: '#ffffff',
  },

  // Dark theme
  dark: {
    name: 'dark',
    primary: colors.primary[500],
    secondary: colors.secondary[400],
    success: colors.success[500],
    warning: colors.warning[500],
    error: colors.error[500],
    info: colors.info[500],
    background: '#0f172a',
    foreground: '#f1f5f9',
    card: '#1e293b',
    border: '#334155',
    muted: '#1e293b',
    popover: '#1e293b',
  },

  // System preference
  system: {
    name: 'system',
  }
}

// ============================================
// EXPORT DESIGN TOKENS
// ============================================
export const designTokens = {
  spacing,
  typography,
  colors,
  shadows,
  borders,
  transitions,
  animations,
  zIndex,
  layout,
  components,
  breakpoints,
  theme,
}

// Utility function to generate CSS variables
export function generateCSSVariables() {
  const cssVars: Record<string, string> = {}

  // Spacing
  Object.entries(spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value
  })

  // Typography
  Object.entries(typography).forEach(([key, value]) => {
    if (typeof value === 'string') {
      cssVars[`--typography-${key}`] = value
    }
  })

  // Colors
  Object.entries(colors.primary).forEach(([key, value]) => {
    cssVars[`--color-primary-${key}`] = value
  })

  Object.entries(colors.secondary).forEach(([key, value]) => {
    cssVars[`--color-secondary-${key}`] = value
  })

  Object.entries(colors.success).forEach(([key, value]) => {
    cssVars[`--color-success-${key}`] = value
  })

  Object.entries(colors.warning).forEach(([key, value]) => {
    cssVars[`--color-warning-${key}`] = value
  })

  Object.entries(colors.error).forEach(([key, value]) => {
    cssVars[`--color-error-${key}`] = value
  })

  return cssVars
}

// Export individual modules for tree-shaking
export * from './design-system'