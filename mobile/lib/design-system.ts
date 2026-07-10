// Mobile Design System - React Native / Expo StyleSheet Constants
// Industry-standard dimensions for premium fintech mobile app

import { Dimensions, Platform, PixelRatio, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';
const isTablet = SCREEN_WIDTH >= 768;
const isSmallDevice = SCREEN_WIDTH < 375;

// === BASE SCALE (8px grid system) ===
const BASE_UNIT = 8;

// === RESPONSIVE SCALING ===
const scale = (size: number): number => {
  const guidelineBaseWidth = 375; // iPhone X baseline
  const ratio = SCREEN_WIDTH / guidelineBaseWidth;
  return Math.round(PixelRatio.roundToNearestPixel(size * ratio));
};

const verticalScale = (size: number): number => {
  const guidelineBaseHeight = 812; // iPhone X baseline
  const ratio = SCREEN_HEIGHT / guidelineBaseHeight;
  return Math.round(PixelRatio.roundToNearestPixel(size * ratio));
};

const moderateScale = (size: number, factor = 0.5): number => {
  return Math.round(size + (scale(size) - size) * factor);
};

// === SPACING SYSTEM ===
export const Spacing = {
  base: BASE_UNIT,
  // Scale: 0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96
  0: 0,
  1: scale(4),    // 4px
  2: scale(8),    // 8px
  3: scale(12),   // 12px
  4: scale(16),   // 16px
  5: scale(20),   // 20px
  6: scale(24),   // 24px
  7: scale(28),   // 28px
  8: scale(32),   // 32px
  9: scale(36),   // 36px
  10: scale(40),  // 40px
  12: scale(48),  // 48px
  14: scale(56),  // 56px
  16: scale(64),  // 64px
  18: scale(72),  // 72px
  20: scale(80),  // 80px
  24: scale(96),  // 96px

  // Semantic spacing
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  '2xl': scale(48),
  '3xl': scale(64),
  '4xl': scale(96),

  // Layout spacing
  container: isTablet ? scale(32) : scale(20),
  containerWide: isTablet ? scale(48) : scale(24),
  section: isTablet ? scale(48) : scale(32),
  component: {
    xs: scale(8),
    sm: scale(12),
    md: scale(16),
    lg: scale(20),
    xl: scale(24),
  },
  screenPadding: isTablet ? scale(24) : scale(20),
  screenPaddingHorizontal: isTablet ? scale(32) : scale(20),
} as const;

// === TYPOGRAPHY SYSTEM ===
export const Typography = {
  fontFamilies: {
    regular: 'Geist-Regular',
    medium: 'Geist-Medium',
    semibold: 'Geist-SemiBold',
    bold: 'Geist-Bold',
    extrabold: 'Geist-ExtraBold',
    mono: 'GeistMono-Regular',
    monoMedium: 'GeistMono-Medium',
  },

  // Fluid font sizes (mobile-optimized)
  fontSize: {
    // Display
    displayXl: isTablet ? 56 : scale(48),
    displayLg: isTablet ? 48 : scale(40),
    displayMd: isTablet ? 40 : scale(32),
    displaySm: isTablet ? 32 : scale(28),

    // Headings
    h1: isTablet ? 40 : scale(32),
    h2: isTablet ? 32 : scale(28),
    h3: isTablet ? 24 : scale(22),
    h4: isTablet ? 20 : scale(18),
    h5: isTablet ? 18 : scale(16),
    h6: isTablet ? 16 : scale(14),

    // Body
    bodyXl: isTablet ? 20 : scale(18),
    bodyLg: isTablet ? 18 : scale(16),
    bodyMd: isTablet ? 16 : scale(14),
    bodySm: isTablet ? 14 : scale(13),
    bodyXs: isTablet ? 13 : scale(12),

    // Numeric (tabular)
    numericXl: isTablet ? 48 : scale(40),
    numericLg: isTablet ? 36 : scale(32),
    numericMd: isTablet ? 28 : scale(24),
    numericSm: isTablet ? 20 : scale(18),
  },

  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    widest: 1.6,
  },

  // Pre-computed text styles
  styles: {
    displayXl: {
      fontSize: isTablet ? 56 : scale(48),
      fontWeight: '800' as const,
      lineHeight: isTablet ? 64 : scale(56),
      letterSpacing: -1.2,
      fontFamily: 'Geist-ExtraBold',
    },
    displayLg: {
      fontSize: isTablet ? 48 : scale(40),
      fontWeight: '800' as const,
      lineHeight: isTablet ? 56 : scale(48),
      letterSpacing: -1,
      fontFamily: 'Geist-ExtraBold',
    },
    displayMd: {
      fontSize: isTablet ? 40 : scale(32),
      fontWeight: '700' as const,
      lineHeight: isTablet ? 48 : scale(40),
      letterSpacing: -0.8,
      fontFamily: 'Geist-Bold',
    },
    displaySm: {
      fontSize: isTablet ? 32 : scale(28),
      fontWeight: '700' as const,
      lineHeight: isTablet ? 40 : scale(36),
      letterSpacing: -0.6,
      fontFamily: 'Geist-Bold',
    },
    h1: {
      fontSize: isTablet ? 40 : scale(32),
      fontWeight: '700' as const,
      lineHeight: isTablet ? 48 : scale(40),
      letterSpacing: -0.8,
      fontFamily: 'Geist-Bold',
    },
    h2: {
      fontSize: isTablet ? 32 : scale(28),
      fontWeight: '700' as const,
      lineHeight: isTablet ? 40 : scale(36),
      letterSpacing: -0.6,
      fontFamily: 'Geist-Bold',
    },
    h3: {
      fontSize: isTablet ? 24 : scale(22),
      fontWeight: '600' as const,
      lineHeight: isTablet ? 32 : scale(30),
      letterSpacing: -0.4,
      fontFamily: 'Geist-SemiBold',
    },
    h4: {
      fontSize: isTablet ? 20 : scale(18),
      fontWeight: '600' as const,
      lineHeight: isTablet ? 28 : scale(26),
      letterSpacing: -0.2,
      fontFamily: 'Geist-SemiBold',
    },
    h5: {
      fontSize: isTablet ? 18 : scale(16),
      fontWeight: '600' as const,
      lineHeight: isTablet ? 26 : scale(24),
      letterSpacing: 0,
      fontFamily: 'Geist-SemiBold',
    },
    h6: {
      fontSize: isTablet ? 16 : scale(14),
      fontWeight: '600' as const,
      lineHeight: isTablet ? 24 : scale(22),
      letterSpacing: 0,
      fontFamily: 'Geist-SemiBold',
    },
    bodyXl: {
      fontSize: isTablet ? 20 : scale(18),
      fontWeight: '400' as const,
      lineHeight: isTablet ? 32 : scale(28),
      letterSpacing: 0,
      fontFamily: 'Geist-Regular',
    },
    bodyLg: {
      fontSize: isTablet ? 18 : scale(16),
      fontWeight: '400' as const,
      lineHeight: isTablet ? 28 : scale(26),
      letterSpacing: 0,
      fontFamily: 'Geist-Regular',
    },
    bodyMd: {
      fontSize: isTablet ? 16 : scale(14),
      fontWeight: '400' as const,
      lineHeight: isTablet ? 24 : scale(22),
      letterSpacing: 0,
      fontFamily: 'Geist-Regular',
    },
    bodySm: {
      fontSize: isTablet ? 14 : scale(13),
      fontWeight: '400' as const,
      lineHeight: isTablet ? 22 : scale(20),
      letterSpacing: 0,
      fontFamily: 'Geist-Regular',
    },
    bodyXs: {
      fontSize: isTablet ? 13 : scale(12),
      fontWeight: '400' as const,
      lineHeight: isTablet ? 20 : scale(18),
      letterSpacing: 0.2,
      fontFamily: 'Geist-Regular',
    },
    labelLg: {
      fontSize: isTablet ? 16 : scale(14),
      fontWeight: '500' as const,
      lineHeight: isTablet ? 24 : scale(22),
      letterSpacing: 0.1,
      fontFamily: 'Geist-Medium',
    },
    labelMd: {
      fontSize: isTablet ? 14 : scale(13),
      fontWeight: '500' as const,
      lineHeight: isTablet ? 20 : scale(18),
      letterSpacing: 0.1,
      fontFamily: 'Geist-Medium',
    },
    labelSm: {
      fontSize: isTablet ? 13 : scale(12),
      fontWeight: '500' as const,
      lineHeight: isTablet ? 18 : scale(16),
      letterSpacing: 0.2,
      fontFamily: 'Geist-Medium',
    },
    caption: {
      fontSize: isTablet ? 12 : scale(11),
      fontWeight: '400' as const,
      lineHeight: isTablet ? 16 : scale(16),
      letterSpacing: 0.3,
      fontFamily: 'Geist-Regular',
    },
    overline: {
      fontSize: isTablet ? 11 : scale(10),
      fontWeight: '600' as const,
      lineHeight: isTablet ? 16 : scale(16),
      letterSpacing: 1.5,
      fontFamily: 'Geist-SemiBold',
      textTransform: 'uppercase' as const,
    },
    numericXl: {
      fontSize: isTablet ? 48 : scale(40),
      fontWeight: '800' as const,
      lineHeight: isTablet ? 56 : scale(48),
      letterSpacing: -1,
      fontFamily: 'Geist-ExtraBold',
      fontVariant: ['tabular-nums'] as const,
    },
    numericLg: {
      fontSize: isTablet ? 36 : scale(32),
      fontWeight: '700' as const,
      lineHeight: isTablet ? 44 : scale(40),
      letterSpacing: -0.6,
      fontFamily: 'Geist-Bold',
      fontVariant: ['tabular-nums'] as const,
    },
    numericMd: {
      fontSize: isTablet ? 28 : scale(24),
      fontWeight: '700' as const,
      lineHeight: isTablet ? 36 : scale(32),
      letterSpacing: -0.4,
      fontFamily: 'Geist-Bold',
      fontVariant: ['tabular-nums'] as const,
    },
    numericSm: {
      fontSize: isTablet ? 20 : scale(18),
      fontWeight: '600' as const,
      lineHeight: isTablet ? 28 : scale(26),
      letterSpacing: -0.2,
      fontFamily: 'Geist-SemiBold',
      fontVariant: ['tabular-nums'] as const,
    },
  },
} as const;

// === COLOR SYSTEM (Mobile Hex) ===
export const Colors = {
  // Base
  background: '#0f172a',
  surface: '#1e293b',
  surfaceElevated: '#334155',
  surfaceOverlay: 'rgba(15, 23, 42, 0.85)',
  border: '#334155',
  borderLight: '#475569',
  borderFocus: '#6366f1',

  // Brand
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  primaryContainer: '#312e81',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#e0e7ff',

  secondary: '#0ea5e9',
  secondaryLight: '#38bdf8',
  secondaryDark: '#0284c7',
  onSecondary: '#ffffff',

  accent: '#f43f5e',
  accentLight: '#fb7185',
  accentDark: '#e11d48',
  onAccent: '#ffffff',

  // Semantic
  success: '#22c55e',
  successLight: '#4ade80',
  successDark: '#16a34a',
  successContainer: '#14532d',
  onSuccess: '#ffffff',

  warning: '#f59e0b',
  warningLight: '#fbbf24',
  warningDark: '#d97706',
  warningContainer: '#78350f',
  onWarning: '#0f172a',

  error: '#ef4444',
  errorLight: '#f87171',
  errorDark: '#dc2626',
  errorContainer: '#7f1d1d',
  onError: '#ffffff',

  // Text
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  textInverse: '#0f172a',
  textDisabled: '#475569',
  textLink: '#818cf8',

  // State overlays
  overlay: 'rgba(15, 23, 42, 0.6)',
  overlayDark: 'rgba(15, 23, 42, 0.85)',
  overlayModal: 'rgba(15, 23, 42, 0.9)',
  scrim: 'rgba(0, 0, 0, 0.5)',

  // Gradients
  gradients: {
    primary: ['#6366f1', '#8b5cf6'] as const,
    primaryReverse: ['#8b5cf6', '#6366f1'] as const,
    secondary: ['#0ea5e9', '#06b6d4'] as const,
    accent: ['#f43f5e', '#ec4899'] as const,
    success: ['#22c55e', '#10b981'] as const,
    warning: ['#f59e0b', '#f97316'] as const,
    error: ['#ef4444', '#f97316'] as const,
    surface: ['#1e293b', '#0f172a'] as const,
    surfaceElevated: ['#334155', '#1e293b'] as const,
    hero: ['#0f172a', '#1e1b4b', '#0f172a'] as const,
    card: ['#1e293b', '#1e293b'] as const,
    glass: ['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.9)'] as const,
  },

  // Chart colors (categorical)
  chart: [
    '#6366f1', // indigo
    '#22c55e', // green
    '#f59e0b', // amber
    '#f43f5e', // rose
    '#0ea5e9', // sky
    '#a855f7', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#84cc16', // lime
  ],

  // Chart semantic
  chartIncome: '#22c55e',
  chartExpense: '#ef4444',
  chartNeutral: '#6366f1',
  chartGrid: '#334155',
  chartAxis: '#64748b',
} as const;

// === BORDER RADIUS ===
export const BorderRadius = {
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
  sheet: 24,
  fab: 28,
} as const;

// === SHADOWS / ELEVATION ===
const createShadow = (
  color: string,
  offset: { width: number; height: number },
  opacity: number,
  radius: number,
  elevation: number
) => ({
  shadowColor: color,
  shadowOffset: offset,
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation,
});

export const Shadows = {
  none: {},

  xs: createShadow('#000', { width: 0, height: 1 }, 0.05, 2, 1),
  sm: createShadow('#000', { width: 0, height: 2 }, 0.08, 4, 2),
  md: createShadow('#000', { width: 0, height: 4 }, 0.1, 8, 4),
  lg: createShadow('#000', { width: 0, height: 8 }, 0.12, 16, 8),
  xl: createShadow('#000', { width: 0, height: 16 }, 0.15, 24, 12),
  '2xl': createShadow('#000', { width: 0, height: 24 }, 0.2, 32, 16),

  // Colored shadows (for premium feel)
  primary: createShadow('#6366f1', { width: 0, height: 8 }, 0.25, 16, 8),
  primarySm: createShadow('#6366f1', { width: 0, height: 4 }, 0.15, 8, 4),
  success: createShadow('#22c55e', { width: 0, height: 8 }, 0.25, 16, 8),
  warning: createShadow('#f59e0b', { width: 0, height: 8 }, 0.25, 16, 8),
  error: createShadow('#ef4444', { width: 0, height: 8 }, 0.25, 16, 8),

  // Inner shadows (for pressed states)
  inner: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Glow effects
  glow: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 0,
  },
  glowLg: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 0,
  },
} as const;

// === COMPONENT DIMENSIONS ===
export const ComponentSizes = {
  // Button heights
  button: {
    xs: scale(32),
    sm: scale(40),
    md: scale(48),
    lg: scale(56),
    xl: scale(64),
    icon: { xs: scale(32), sm: scale(40), md: scale(48), lg: scale(56) },
  },

  // Input heights
  input: {
    xs: scale(36),
    sm: scale(40),
    md: scale(48),
    lg: scale(56),
  },

  // Card padding
  card: {
    xs: scale(12),
    sm: scale(16),
    md: scale(20),
    lg: scale(24),
    xl: scale(32),
  },

  // Avatar sizes
  avatar: {
    xs: scale(24),
    sm: scale(32),
    md: scale(40),
    lg: scale(48),
    xl: scale(64),
    '2xl': scale(80),
    '3xl': scale(120),
  },

  // Icon sizes
  icon: {
    xs: scale(12),
    sm: scale(16),
    md: scale(20),
    lg: scale(24),
    xl: scale(28),
    '2xl': scale(32),
    '3xl': scale(40),
  },

  // Touch targets (minimum 44x44 iOS, 48x48 Android)
  touchTarget: {
    minimum: 44,
    comfortable: 48,
    generous: 56,
  },

  // Header/Navbar
  header: {
    height: isIOS ? scale(56) : scale(56),
    heightCompact: scale(48),
    heightLarge: scale(72),
  },

  // Tab bar
  tabBar: {
    height: isIOS ? scale(88) : scale(72), // Includes safe area on iOS
    heightCompact: scale(64),
    itemHeight: scale(48),
  },

  // Sheet/Modal
  sheet: {
    handleHeight: scale(24),
    handleWidth: scale(36),
    borderRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
  },

  // List item
  listItem: {
    height: scale(56),
    heightDense: scale(48),
    heightComfortable: scale(72),
  },

  // Chip/Badge
  chip: {
    height: scale(32),
    heightSm: scale(28),
    heightLg: scale(40),
  },

  // Divider
  divider: {
    thickness: StyleSheet.hairlineWidth,
    thicknessBold: 2,
  },
} as const;

// === LAYOUT CONSTRAINTS ===
export const Layout = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  isTablet,
  isSmallDevice,
  isIOS,

  // Safe areas (approximate)
  safeArea: {
    top: isIOS ? 44 : 24,
    bottom: isIOS ? 34 : 0,
    left: 0,
    right: 0,
  },

  // Max content width
  maxContentWidth: isTablet ? 720 : '100%',

  // Container
  container: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingVertical: Spacing.section,
  },

  // Grid
  grid: {
    columns: isTablet ? 12 : 4,
    gutter: Spacing.md,
    margin: Spacing.screenPaddingHorizontal,
  },

  // Sidebar (for tablet)
  sidebar: {
    collapsed: scale(64),
    compact: scale(200),
    default: scale(288),
    wide: scale(320),
  },
} as const;

// === ANIMATION TOKENS ===
export const Animation = {
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
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    // Premium easings
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    // Platform
    ios: 'cubic-bezier(0.42, 0, 0.58, 1)',
    material: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Spring configs for Reanimated
  spring: {
    gentle: { damping: 20, stiffness: 120, mass: 1 },
    smooth: { damping: 15, stiffness: 150, mass: 1 },
    bouncy: { damping: 10, stiffness: 180, mass: 1 },
    stiff: { damping: 25, stiffness: 200, mass: 1 },
    // Interaction-specific
    press: { damping: 15, stiffness: 150, mass: 0.5 },
    swipe: { damping: 20, stiffness: 150, mass: 1 },
    modal: { damping: 20, stiffness: 180, mass: 1 },
    sheet: { damping: 25, stiffness: 200, mass: 1 },
  },

  // Transition presets
  transitions: {
    quick: { duration: 150, easing: 'ease-out' },
    standard: { duration: 250, easing: 'ease-in-out' },
    smooth: { duration: 350, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' },
    spring: { damping: 15, stiffness: 150 },
  },
} as const;

// === INTERACTION TOKENS ===
export const Interaction = {
  // Press feedback
  press: {
    scale: 0.96,
    duration: 100,
    opacity: 0.8,
  },

  // Hover (web) / Focus (mobile)
  focus: {
    ringWidth: 2,
    ringOffset: 2,
    ringColor: Colors.primary,
  },

  // Swipe gestures
  swipe: {
    threshold: scale(80),
    velocityThreshold: 0.3,
    dismissVelocity: 0.5,
  },

  // Pull to refresh
  pullToRefresh: {
    threshold: scale(60),
    maxPull: scale(120),
  },

  // Haptic feedback
  haptics: {
    light: 'impactLight',
    medium: 'impactMedium',
    heavy: 'impactHeavy',
    selection: 'selectionChanged',
    success: 'notificationSuccess',
    warning: 'notificationWarning',
    error: 'notificationError',
  },
} as const;

// === Z-INDEX ===
export const ZIndex = {
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
} as const;

// === PREMIUM EFFECTS ===
export const PremiumEffects = {
  // Glass morphism
  glass: {
    light: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    dark: {
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    intense: {
      backgroundColor: 'rgba(30, 41, 59, 0.6)',
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
  },

  // Gradients for backgrounds
  gradientBackgrounds: {
    primary: ['#0f172a', '#1e1b4b', '#0f172a'] as const,
    secondary: ['#0f172a', '#1e293b', '#0f172a'] as const,
    card: ['#1e293b', '#1e293b'] as const,
    cardElevated: ['#334155', '#1e293b'] as const,
    hero: ['#0f172a', '#1e1b4b', '#312e81', '#0f172a'] as const,
  },

  // Blur values
  blur: {
    light: 10,
    medium: 20,
    heavy: 40,
    intense: 60,
  },

  // Shimmer loading
  shimmer: {
    baseColor: '#1e293b',
    highlightColor: '#334155',
    duration: 1500,
  },

  // Ripple effect (for pressable)
  ripple: {
    color: 'rgba(99, 102, 241, 0.3)',
    duration: 300,
  },
} as const;

// === EXPORT ALL AS DESIGN SYSTEM ===
export const DesignSystem = {
  Spacing,
  Typography,
  Colors,
  BorderRadius,
  Shadows,
  ComponentSizes,
  Layout,
  Animation,
  Interaction,
  ZIndex,
  PremiumEffects,
} as const;

// Type exports
export type Spacing = typeof Spacing;
export type Typography = typeof Typography;
export type Colors = typeof Colors;
export type BorderRadius = typeof BorderRadius;
export type Shadows = typeof Shadows;
export type ComponentSizes = typeof ComponentSizes;
export type Layout = typeof Layout;
export type Animation = typeof Animation;
export type Interaction = typeof Interaction;
export type ZIndex = typeof ZIndex;
export type PremiumEffects = typeof PremiumEffects;

export default DesignSystem;