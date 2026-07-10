// Design System - Industry Standard UI Dimensions & Tokens
// Compatible with both Web (Tailwind) and Mobile (React Native StyleSheet)

export const DesignTokens = {
  // === COLOR SYSTEM (Preserved from existing) ===
  colors: {
    // Semantic colors (OKLCH-based from existing globals.css)
    background: 'oklch(0.985 0.005 30)',
    foreground: 'oklch(0.14 0.02 30)',
    card: 'oklch(1 0 0)',
    'card-foreground': 'oklch(0.14 0.02 30)',
    primary: 'oklch(0.45 0.24 260)',
    'primary-foreground': 'oklch(0.985 0.005 30)',
    secondary: 'oklch(0.97 0.01 30)',
    'secondary-foreground': 'oklch(0.2 0.02 30)',
    muted: 'oklch(0.97 0.01 30)',
    'muted-foreground': 'oklch(0.55 0.02 30)',
    accent: 'oklch(0.97 0.01 30)',
    'accent-foreground': 'oklch(0.2 0.02 30)',
    destructive: 'oklch(0.58 0.24 27)',
    'destructive-foreground': 'oklch(0.985 0.005 30)',
    border: 'oklch(0.92 0.01 30)',
    ring: 'oklch(0.45 0.24 260)',
    input: 'oklch(0.92 0.01 30)',

    // Dark mode
    dark: {
      background: 'oklch(0.14 0.02 30)',
      foreground: 'oklch(0.985 0.005 30)',
      card: 'oklch(0.16 0.02 30)',
      'card-foreground': 'oklch(0.985 0.005 30)',
      primary: 'oklch(0.6 0.22 260)',
      'primary-foreground': 'oklch(0.985 0.005 30)',
      secondary: 'oklch(0.2 0.02 30)',
      'secondary-foreground': 'oklch(0.985 0.005 30)',
      muted: 'oklch(0.2 0.02 30)',
      'muted-foreground': 'oklch(0.7 0.02 30)',
      accent: 'oklch(0.2 0.02 30)',
      'accent-foreground': 'oklch(0.985 0.005 30)',
      destructive: 'oklch(0.65 0.22 27)',
      'destructive-foreground': 'oklch(0.985 0.005 30)',
      border: 'oklch(0.27 0.02 30)',
      ring: 'oklch(0.6 0.22 260)',
      input: 'oklch(0.27 0.02 30)',
    },

    // Mobile-specific hex colors (for React Native)
    mobile: {
      background: '#0f172a',
      surface: '#1e293b',
      surfaceElevated: '#334155',
      border: '#334155',
      borderLight: '#475569',
      primary: '#6366f1',
      primaryLight: '#818cf8',
      primaryDark: '#4f46e5',
      secondary: '#0ea5e9',
      accent: '#f43f5e',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      textInverse: '#0f172a',
      overlay: 'rgba(15, 23, 42, 0.8)',
      overlayDark: 'rgba(15, 23, 42, 0.95)',
    },
  },

  // === SPACING SYSTEM (8px base - Industry Standard) ===
  spacing: {
    base: 8,
    scale: [0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96],
    // Semantic spacing
    xs: 4,      // 0.5 * base
    sm: 8,      // 1 * base
    md: 16,     // 2 * base
    lg: 24,     // 3 * base
    xl: 32,     // 4 * base
    '2xl': 48,  // 6 * base
    '3xl': 64,  // 8 * base
    '4xl': 96,  // 12 * base

    // Layout spacing
    container: {
      mobile: 20,
      tablet: 24,
      desktop: 32,
      wide: 48,
    },
    section: {
      mobile: 32,
      tablet: 48,
      desktop: 64,
    },
    component: {
      xs: 8,
      sm: 12,
      md: 16,
      lg: 20,
      xl: 24,
    },
  },

  // === TYPOGRAPHY SYSTEM ===
  typography: {
    fontFamilies: {
      sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
      mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
    },

    // Fluid typography scale (clamp-based for responsive)
    scale: {
      // Mobile-first fluid scaling
      display: {
        xl: { mobile: '3.5rem', tablet: '4.5rem', desktop: '6rem' },     // 56px → 72px → 96px
        lg: { mobile: '2.5rem', tablet: '3.5rem', desktop: '4.5rem' },     // 40px → 56px → 72px
        md: { mobile: '2rem', tablet: '2.5rem', desktop: '3rem' },         // 32px → 40px → 48px
        sm: { mobile: '1.75rem', tablet: '2rem', desktop: '2.25rem' },    // 28px → 32px → 36px
      },
      heading: {
        h1: { mobile: '2rem', tablet: '2.5rem', desktop: '3rem' },        // 32px → 40px → 48px
        h2: { mobile: '1.5rem', tablet: '1.75rem', desktop: '2.25rem' },  // 24px → 28px → 36px
        h3: { mobile: '1.25rem', tablet: '1.375rem', desktop: '1.5rem' }, // 20px → 22px → 24px
        h4: { mobile: '1.125rem', tablet: '1.125rem', desktop: '1.25rem' }, // 18px → 18px → 20px
        h5: { mobile: '1rem', tablet: '1rem', desktop: '1.125rem' },      // 16px → 16px → 18px
        h6: { mobile: '0.875rem', tablet: '0.875rem', desktop: '1rem' },  // 14px → 14px → 16px
      },
      body: {
        xl: { mobile: '1.125rem', tablet: '1.125rem', desktop: '1.25rem' }, // 18px → 18px → 20px
        lg: { mobile: '1rem', tablet: '1rem', desktop: '1.125rem' },       // 16px → 16px → 18px
        md: { mobile: '0.875rem', tablet: '0.875rem', desktop: '1rem' },   // 14px → 14px → 16px
        sm: { mobile: '0.8125rem', tablet: '0.8125rem', desktop: '0.875rem' }, // 13px → 13px → 14px
        xs: { mobile: '0.75rem', tablet: '0.75rem', desktop: '0.8125rem' }, // 12px → 12px → 13px
      },
      numeric: {
        xl: { mobile: '2.5rem', tablet: '3rem', desktop: '3.5rem' },       // 40px → 48px → 56px
        lg: { mobile: '2rem', tablet: '2.25rem', desktop: '2.5rem' },      // 32px → 36px → 40px
        md: { mobile: '1.5rem', tablet: '1.5rem', desktop: '1.75rem' },    // 24px → 24px → 28px
        sm: { mobile: '1.125rem', tablet: '1.125rem', desktop: '1.25rem' }, // 18px → 18px → 20px
      },
    },

    fontWeights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },

    lineHeights: {
      tight: 1.1,
      snug: 1.25,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },

    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  // === BORDER RADIUS SYSTEM ===
  borderRadius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
    // Component-specific
    button: 12,
    card: 16,
    input: 12,
    badge: 9999,
    avatar: 9999,
    modal: 24,
    tooltip: 8,
    chip: 20,
  },

  // === SHADOW SYSTEM (Elevation-based) ===
  shadows: {
    // Web (CSS box-shadow)
    web: {
      xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      // Colored shadows
      primary: '0 10px 40px -10px oklch(0.45 0.24 260 / 0.4)',
      primarySm: '0 4px 14px 0 oklch(0.45 0.24 260 / 0.2)',
      success: '0 10px 40px -10px oklch(0.65 0.2 142 / 0.4)',
      warning: '0 10px 40px -10px oklch(0.77 0.18 70 / 0.4)',
      destructive: '0 10px 40px -10px oklch(0.58 0.24 27 / 0.4)',
      glow: '0 0 20px oklch(0.45 0.24 260 / 0.3)',
      glowLg: '0 0 40px oklch(0.45 0.24 260 / 0.2)',
    },

    // Mobile (React Native StyleSheet shadows)
    mobile: {
      xs: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
      },
      xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
      },
      '2xl': {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.2,
        shadowRadius: 32,
        elevation: 16,
      },
      // Colored shadows (using shadowColor with tint)
      primary: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
      },
      success: {
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
      },
      warning: {
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
      },
      destructive: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
      },
    },
  },

  // === BREAKPOINTS ===
  breakpoints: {
    mobile: 0,
    tablet: 640,
    laptop: 1024,
    desktop: 1280,
    wide: 1536,
    // Mobile specific
    mobileSm: 320,
    mobileMd: 375,
    mobileLg: 428,
  },

  // === Z-INDEX SCALE ===
  zIndex: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    fixed: 300,
    modalBackdrop: 400,
    modal: 500,
    popover: 600,
    tooltip: 700,
    toast: 800,
    max: 9999,
  },

  // === ANIMATION & TRANSITION ===
  animation: {
    duration: {
      instant: 0,
      fast: 150,
      normal: 250,
      slow: 350,
      slower: 500,
      slowest: 700,
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      // Premium easings
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      // iOS-like
      ios: 'cubic-bezier(0.42, 0, 0.58, 1)',
      // Material-like
      material: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // === COMPONENT SIZES ===
  componentSizes: {
    // Button heights
    button: {
      xs: 32,
      sm: 40,
      md: 48,
      lg: 56,
      xl: 64,
      icon: { xs: 32, sm: 40, md: 48, lg: 56 },
    },
    // Input heights
    input: {
      xs: 36,
      sm: 40,
      md: 48,
      lg: 56,
    },
    // Card padding
    card: {
      xs: 12,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
    },
    // Avatar sizes
    avatar: {
      xs: 24,
      sm: 32,
      md: 40,
      lg: 48,
      xl: 64,
      '2xl': 80,
      '3xl': 120,
    },
    // Icon sizes
    icon: {
      xs: 12,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 28,
      '2xl': 32,
      '3xl': 40,
    },
    // Touch targets (minimum 44x44 for iOS, 48x48 for Android)
    touchTarget: {
      minimum: 44,
      comfortable: 48,
      generous: 56,
    },
  },

  // === LAYOUT CONSTRAINTS ===
  layout: {
    // Max content widths
    maxWidth: {
      xs: 320,
      sm: 480,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1440,
      '3xl': 1600,
      full: '100%',
    },
    // Container padding
    containerPadding: {
      mobile: 20,
      tablet: 24,
      desktop: 32,
      wide: 48,
    },
    // Sidebar width
    sidebar: {
      collapsed: 64,
      compact: 200,
      default: 288,
      wide: 320,
    },
    // Header/Navbar height
    header: {
      mobile: 56,
      desktop: 64,
      compact: 48,
    },
    // Tab bar height
    tabBar: {
      mobile: 88, // Including safe area
      desktop: 72,
    },
  },

  // === GLASS MORPHISM / BLUR ===
  glass: {
    light: {
      background: 'rgba(255, 255, 255, 0.7)',
      border: 'rgba(255, 255, 255, 0.3)',
      blur: 20,
    },
    dark: {
      background: 'rgba(15, 23, 42, 0.7)',
      border: 'rgba(255, 255, 255, 0.1)',
      blur: 20,
    },
    intense: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'rgba(255, 255, 255, 0.2)',
      blur: 40,
    },
  },

  // === PREMIUM INTERACTIONS ===
  interactions: {
    // Press/tap feedback
    press: {
      scale: 0.98,
      duration: 100,
    },
    // Hover lift
    hover: {
      lift: -4,
      scale: 1.02,
      duration: 200,
    },
    // Focus ring
    focus: {
      width: 2,
      offset: 2,
      color: 'oklch(0.45 0.24 260)',
    },
    // Swipe gestures
    swipe: {
      threshold: 80,
      velocity: 0.3,
      damping: 20,
      stiffness: 150,
    },
    // Spring animations
    spring: {
      gentle: { damping: 20, stiffness: 120 },
      smooth: { damping: 15, stiffness: 150 },
      bouncy: { damping: 10, stiffness: 180 },
      stiff: { damping: 25, stiffness: 200 },
    },
  },
} as const;

// === TYPE HELPERS ===
export type DesignTokens = typeof DesignTokens;
export type ColorScale = keyof typeof DesignTokens.colors;
export type SpacingScale = keyof typeof DesignTokens.spacing;
export type FontSizeScale = keyof typeof DesignTokens.typography.scale.heading;
export type BorderRadiusScale = keyof typeof DesignTokens.borderRadius;
export type ShadowScale = keyof typeof DesignTokens.shadows.web;
export type AnimationDuration = keyof typeof DesignTokens.animation.duration;
export type AnimationEasing = keyof typeof DesignTokens.animation.easing;
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Breakpoint = keyof typeof DesignTokens.breakpoints;

// === UTILITY FUNCTIONS ===
export const getSpacing = (scale: keyof typeof DesignTokens.spacing.scale): number => {
  return DesignTokens.spacing.scale[DesignTokens.spacing.scale.indexOf(scale as any)] ?? 0;
};

export const getFontSize = (
  category: keyof typeof DesignTokens.typography.scale,
  size: string,
  viewport: 'mobile' | 'tablet' | 'desktop' = 'mobile'
): string => {
  const scale = DesignTokens.typography.scale[category] as any;
  return scale?.[size]?.[viewport] ?? scale?.[size]?.mobile ?? '1rem';
};

export const getShadow = (scale: ShadowScale, platform: 'web' | 'mobile' = 'web') => {
  return DesignTokens.shadows[platform][scale];
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

// === RESPONSIVE HELPERS ===
export const mediaQuery = {
  mobile: `@media (max-width: ${DesignTokens.breakpoints.tablet - 1}px)`,
  tablet: `@media (min-width: ${DesignTokens.breakpoints.tablet}px) and (max-width: ${DesignTokens.breakpoints.laptop - 1}px)`,
  laptop: `@media (min-width: ${DesignTokens.breakpoints.laptop}px) and (max-width: ${DesignTokens.breakpoints.desktop - 1}px)`,
  desktop: `@media (min-width: ${DesignTokens.breakpoints.desktop}px) and (max-width: ${DesignTokens.breakpoints.wide - 1}px)`,
  wide: `@media (min-width: ${DesignTokens.breakpoints.wide}px)`,
  // Mobile-first
  smUp: `@media (min-width: ${DesignTokens.breakpoints.tablet}px)`,
  mdUp: `@media (min-width: ${DesignTokens.breakpoints.laptop}px)`,
  lgUp: `@media (min-width: ${DesignTokens.breakpoints.desktop}px)`,
  xlUp: `@media (min-width: ${DesignTokens.breakpoints.wide}px)`,
};

export const fluid = (min: number, max: number, viewportWidth: number): string => {
  const minVw = DesignTokens.breakpoints.mobile;
  const maxVw = DesignTokens.breakpoints.desktop;
  const slope = (max - min) / (maxVw - minVw);
  const intercept = min - slope * minVw;
  return `clamp(${min}px, ${intercept.toFixed(2)}px + ${(slope * 100).toFixed(2)}vw, ${max}px)`;
};

export default DesignTokens;