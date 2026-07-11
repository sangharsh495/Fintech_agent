// ============================================================================
// PROFESSIONAL DESIGN SYSTEM - Industry Standard
// FinTech Application UI/UX Framework
// ============================================================================

import { DesignTokens } from './design-system'

// ============================================================================
// ENHANCED DESIGN TOKENS - Professional Grade
// ============================================================================

export const ProDesignTokens = {
  // ==========================================================================
  // SPACING SYSTEM - 8px Base Grid (Industry Standard)
  // ==========================================================================
  spacing: {
    // Base units (8px = 1rem)
    xs: 8,       // 0.5rem - Tight spacing
    sm: 12,      // 0.75rem - Small spacing
    md: 16,      // 1rem - Standard spacing
    lg: 24,      // 1.5rem - Large spacing
    xl: 32,      // 2rem - Extra large
    '2xl': 48,   // 3rem
    '3xl': 64,   // 4rem
    '4xl': 80,   // 5rem

    // Section spacing
    section: {
      mobile: 24,    // 1.5rem
      tablet: 40,    // 2.5rem
      desktop: 64,   // 4rem
    },

    // Component spacing
    component: {
      button: {
        padding: {
          sm: '8px 16px',    // 0.5rem 1rem
          md: '12px 24px',   // 0.75rem 1.5rem
          lg: '16px 32px',   // 1rem 2rem
        },
        gap: 8,
      },
      card: {
        padding: {
          sm: 16,    // 1rem
          md: 24,    // 1.5rem
          lg: 32,    // 2rem
          xl: 40,    // 2.5rem
        },
      },
      form: {
        fieldGap: 24,       // 1.5rem between form fields
        labelGap: 8,        // 0.5rem between label and input
        helperGap: 4,       // 0.25rem between input and helper text
      },
    },
  },

  // ==========================================================================
  // TYPOGRAPHY - Professional Scale
  // ==========================================================================
  typography: {
    // Font families
    fontFamilies: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace",
      serif: "'Georgia', 'Times New Roman', serif",
    },

    // Font weights
    fontWeights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },

    // Line heights
    lineHeights: {
      tight: 1.1,
      normal: 1.4,
      relaxed: 1.6,
      loose: 2,
    },

    // Letter spacing
    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
    },

    // Font sizes - Mobile First Scale
    scale: {
      // Body text
      body: {
        xs: {
          mobile: 12,
          tablet: 12,
          desktop: 12,
        },
        sm: {
          mobile: 14,
          tablet: 14,
          desktop: 14,
        },
        md: {
          mobile: 16,
          tablet: 16,
          desktop: 16,
        },
        lg: {
          mobile: 18,
          tablet: 18,
          desktop: 18,
        },
        xl: {
          mobile: 20,
          tablet: 20,
          desktop: 20,
        },
      },

      // Headings
      heading: {
        h1: {
          mobile: 36,
          tablet: 48,
          desktop: 56,
        },
        h2: {
          mobile: 30,
          tablet: 36,
          desktop: 42,
        },
        h3: {
          mobile: 24,
          tablet: 28,
          desktop: 32,
        },
        h4: {
          mobile: 20,
          tablet: 22,
          desktop: 24,
        },
        h5: {
          mobile: 18,
          tablet: 20,
          desktop: 20,
        },
        h6: {
          mobile: 16,
          tablet: 16,
          desktop: 18,
        },
      },

      // Numeric display
      numeric: {
        sm: {
          mobile: 20,
          tablet: 24,
          desktop: 28,
        },
        md: {
          mobile: 28,
          tablet: 32,
          desktop: 36,
        },
        lg: {
          mobile: 36,
          tablet: 44,
          desktop: 52,
        },
        xl: {
          mobile: 48,
          tablet: 56,
          desktop: 64,
        },
      },
    },
  },

  // ==========================================================================
  // BORDER RADIUS - Modern, Smooth Corners
  // ==========================================================================
  borderRadius: {
    none: 0,
    xs: 4,      // 0.25rem - Sharp corners
    sm: 6,      // 0.375rem - Subtle rounding
    md: 8,      // 0.5rem - Standard rounding
    lg: 12,     // 0.75rem - Pronounced rounding
    xl: 16,     // 1rem - Strong rounding
    '2xl': 24,  // 1.5rem - Very rounded
    '3xl': 32,  // 2rem - Pill-like
    full: 9999, // Fully rounded (pill/circle)

    // Component-specific radii
    button: 8,          // 0.5rem
    card: 12,           // 0.75rem
    input: 8,           // 0.5rem
    badge: 9999,        // Full pill
    avatar: 9999,       // Full circle
    dialog: 16,         // 1rem
    sheet: 16,          // 1rem
    popover: 8,         // 0.5rem
    tooltip: 6,         // 0.375rem
  },

  // ==========================================================================
  // SHADOWS - Layered, Professional Depth
  // ==========================================================================
  shadows: {
    // Web shadows (box-shadow)
    web: {
      none: '0 0 0 0 rgba(0, 0, 0, 0)',
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

      // Colored shadows for brand elements
      primarySm: '0 0 0 3px rgba(67, 56, 202, 0.1), 0 2px 4px rgba(67, 56, 202, 0.1)',
      primaryMd: '0 0 0 4px rgba(67, 56, 202, 0.15), 0 4px 8px rgba(67, 56, 202, 0.15)',
      primaryLg: '0 0 0 6px rgba(67, 56, 202, 0.2), 0 8px 16px rgba(67, 56, 202, 0.2)',

      // Inner shadows for pressed states
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
    },

    // Text shadows
    text: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
      md: '0 2px 4px rgba(0, 0, 0, 0.1)',
      lg: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
  },

  // ==========================================================================
  // ANIMATIONS - Smooth, Professional Transitions
  // ==========================================================================
  animation: {
    duration: {
      instant: 0,
      fast: 150,      // 150ms - Micro-interactions
      normal: 200,    // 200ms - Standard transitions
      slow: 300,      // 300ms - Noticeable animations
      slower: 500,    // 500ms - Emphasis animations
      slowest: 1000,  // 1000ms - Dramatic effects
    },

    timing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },

    // Predefined animations
    presets: {
      fadeIn: 'fadeIn 200ms ease-out',
      fadeOut: 'fadeOut 200ms ease-in',
      slideIn: 'slideIn 300ms ease-out',
      slideOut: 'slideOut 300ms ease-in',
      scaleIn: 'scaleIn 200ms ease-out',
      scaleOut: 'scaleOut 200ms ease-in',
      spin: 'spin 1s linear infinite',
      pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      bounce: 'bounce 1s ease-in-out infinite',
      shake: 'shake 500ms ease-in-out',
    },
  },

  // ==========================================================================
  // Z-INDEX SCALE - Layer Management
  // ==========================================================================
  zIndex: {
    base: 0,
    raised: 10,
    dropdown: 100,
    sticky: 200,
    fixed: 300,
    modalBackdrop: 400,
    modal: 500,
    popover: 600,
    tooltip: 700,
    notification: 800,
    max: 9999,
  },

  // ==========================================================================
  // LAYOUT CONSTRAINTS - Professional Container System
  // ==========================================================================
  layout: {
    // Maximum widths
    maxWidth: {
      xs: 320,    // Mobile cards
      sm: 425,    // Small containers
      md: 768,    // Tablet/Modal
      lg: 1024,   // Large containers
      xl: 1280,   // Desktop max
      '2xl': 1536, // Wide desktop
      full: '100%',
    },

    // Sidebar widths
    sidebar: {
      collapsed: 64,    // 4rem - Icon only
      compact: 256,    // 16rem - Compact
      expanded: 288,   // 18rem - Full
    },

    // Header heights
    header: {
      mobile: 56,      // 3.5rem
      desktop: 64,     // 4rem
    },

    // Border widths
    borderWidth: {
      hairline: 1,
      thin: 1,
      standard: 1,
      thick: 2,
      heavy: 4,
    },
  },

  // ==========================================================================
  // COMPONENT DIMENSIONS - Standardized Sizing
  // ==========================================================================
  componentSizes: {
    // Icons
    icon: {
      xs: 12,    // 0.75rem
      sm: 16,    // 1rem
      md: 20,    // 1.25rem
      lg: 24,    // 1.5rem
      xl: 28,    // 1.75rem
      '2xl': 32, // 2rem
      '3xl': 40, // 2.5rem
    },

    // Buttons
    button: {
      height: {
        sm: 32,   // 2rem
        md: 40,   // 2.5rem
        lg: 48,   // 3rem
      },
      icon: {
        sm: 24,   // 1.5rem
        md: 32,   // 2rem
        lg: 40,   // 2.5rem
      },
    },

    // Cards
    card: {
      radius: 12,      // 0.75rem
      padding: {
        sm: 16,        // 1rem
        md: 24,        // 1.5rem
        lg: 32,        // 2rem
        xl: 40,        // 2.5rem
      },
    },

    // Inputs
    input: {
      height: {
        sm: 32,   // 2rem
        md: 40,   // 2.5rem
        lg: 48,   // 3rem
      },
      padding: {
        horizontal: 16, // 1rem
        vertical: 12,   // 0.75rem
      },
    },

    // Avatars
    avatar: {
      xs: 24,   // 1.5rem
      sm: 32,   // 2rem
      md: 40,   // 2.5rem
      lg: 48,   // 3rem
      xl: 56,   // 3.5rem
      '2xl': 64, // 4rem
    },

    // Badges/Chips
    badge: {
      height: {
        sm: 16,   // 1rem
        md: 20,   // 1.25rem
        lg: 24,   // 1.5rem
      },
      padding: {
        horizontal: 8,  // 0.5rem
        vertical: 4,    // 0.25rem
      },
    },
  },

  // ==========================================================================
  // ELEVATION SYSTEM - Material Design Inspired
  // ==========================================================================
  elevation: {
    '0': {
      boxShadow: 'none',
      transform: 'translateY(0)',
    },
    '1': {
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      transform: 'translateY(0)',
    },
    '2': {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
      transform: 'translateY(-1px)',
    },
    '3': {
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
      transform: 'translateY(-2px)',
    },
    '4': {
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.06)',
      transform: 'translateY(-4px)',
    },
    '5': {
      boxShadow: '0 16px 32px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',
      transform: 'translateY(-8px)',
    },
  },
}

// ============================================================================
// RESPONSIVE BREAKPOINTS - Tailwind CSS Standard
// ============================================================================

export const Breakpoints = {
  sm: 640,    // 40rem
  md: 768,    // 48rem
  lg: 1024,   // 64rem
  xl: 1280,   // 80rem
  '2xl': 1536, // 96rem
}

// ============================================================================
// PROFESSIONAL UI COMPONENT SPECIFICATIONS
// ============================================================================

export const ProComponentSpecs = {
  // Button specifications
  Button: {
    variants: {
      primary: {
        base: {
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          border: 'none',
          hover: {
            background: 'var(--primary-hover)',
            transform: 'translateY(-1px)',
            boxShadow: ProDesignTokens.shadows.web.lg,
          },
          active: {
            background: 'var(--primary-active)',
            transform: 'translateY(0)',
          },
          disabled: {
            background: 'var(--muted)',
            color: 'var(--muted-foreground)',
            cursor: 'not-allowed',
            opacity: 0.5,
          },
        },
      },
      secondary: {
        base: {
          background: 'var(--secondary)',
          color: 'var(--secondary-foreground)',
          border: '1px solid var(--border)',
          hover: {
            background: 'var(--secondary-hover)',
            borderColor: 'var(--border-hover)',
          },
          active: {
            background: 'var(--secondary-active)',
          },
        },
      },
      outline: {
        base: {
          background: 'transparent',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
          hover: {
            background: 'var(--secondary)',
            borderColor: 'var(--border-hover)',
          },
          active: {
            background: 'var(--secondary-active)',
          },
        },
      },
      ghost: {
        base: {
          background: 'transparent',
          color: 'var(--foreground)',
          border: 'none',
          hover: {
            background: 'var(--secondary)',
          },
          active: {
            background: 'var(--secondary-active)',
          },
        },
      },
      destructive: {
        base: {
          background: 'var(--destructive)',
          color: 'var(--destructive-foreground)',
          border: 'none',
          hover: {
            background: 'var(--destructive-hover)',
          },
          active: {
            background: 'var(--destructive-active)',
          },
        },
      },
      link: {
        base: {
          background: 'transparent',
          color: 'var(--primary)',
          border: 'none',
          textDecoration: 'underline',
          hover: {
            color: 'var(--primary-hover)',
            textDecoration: 'none',
          },
        },
      },
    },
    sizes: {
      sm: {
        height: ProDesignTokens.componentSizes.button.height.sm,
        padding: `${ProDesignTokens.spacing.xs}px ${ProDesignTokens.spacing.sm}px`,
        fontSize: ProDesignTokens.typography.scale.body.sm.mobile,
        iconSize: ProDesignTokens.componentSizes.icon.sm,
        gap: ProDesignTokens.spacing.xs,
      },
      md: {
        height: ProDesignTokens.componentSizes.button.height.md,
        padding: `${ProDesignTokens.spacing.sm}px ${ProDesignTokens.spacing.md}px`,
        fontSize: ProDesignTokens.typography.scale.body.md.mobile,
        iconSize: ProDesignTokens.componentSizes.icon.md,
        gap: ProDesignTokens.spacing.sm,
      },
      lg: {
        height: ProDesignTokens.componentSizes.button.height.lg,
        padding: `${ProDesignTokens.spacing.md}px ${ProDesignTokens.spacing.lg}px`,
        fontSize: ProDesignTokens.typography.scale.body.lg.mobile,
        iconSize: ProDesignTokens.componentSizes.icon.lg,
        gap: ProDesignTokens.spacing.md,
      },
    },
  },

  // Card specifications
  Card: {
    base: {
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: ProDesignTokens.borderRadius.card,
      padding: ProDesignTokens.componentSizes.card.padding.md,
      boxShadow: ProDesignTokens.shadows.web.sm,
      transition: `box-shadow ${ProDesignTokens.animation.duration.normal}ms, transform ${ProDesignTokens.animation.duration.normal}ms`,
    },
    hover: {
      boxShadow: ProDesignTokens.shadows.web.md,
      transform: 'translateY(-2px)',
    },
    variants: {
      default: {},
      elevated: {
        boxShadow: ProDesignTokens.shadows.web.lg,
      },
      flat: {
        border: 'none',
        boxShadow: 'none',
      },
      bordered: {
        border: '1px solid var(--border)',
      },
      interactive: {
        cursor: 'pointer',
        transition: `all ${ProDesignTokens.animation.duration.normal}ms`,
        hover: {
          boxShadow: ProDesignTokens.shadows.web.lg,
          transform: 'translateY(-4px)',
        },
      },
    },
  },

  // Input specifications
  Input: {
    base: {
      width: '100%',
      padding: `${ProDesignTokens.spacing.md}px ${ProDesignTokens.spacing.md}px`,
      borderRadius: ProDesignTokens.borderRadius.input,
      border: '1px solid var(--input)',
      background: 'var(--background)',
      fontSize: ProDesignTokens.typography.scale.body.md.mobile,
      color: 'var(--foreground)',
      transition: `border-color ${ProDesignTokens.animation.duration.fast}ms, box-shadow ${ProDesignTokens.animation.duration.fast}ms`,
    },
    states: {
      focus: {
        borderColor: 'var(--ring)',
        boxShadow: ProDesignTokens.shadows.web.primarySm,
        outline: 'none',
      },
      error: {
        borderColor: 'var(--destructive)',
        boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
      },
      disabled: {
        background: 'var(--muted)',
        color: 'var(--muted-foreground)',
        cursor: 'not-allowed',
        opacity: 0.5,
      },
    },
  },

  // Form specifications
  Form: {
    field: {
      gap: ProDesignTokens.spacing.lg,
      label: {
        fontSize: ProDesignTokens.typography.scale.body.md.mobile,
        fontWeight: ProDesignTokens.typography.fontWeights.medium,
        color: 'var(--foreground)',
        marginBottom: ProDesignTokens.spacing.xs,
        display: 'block',
      },
      helperText: {
        fontSize: ProDesignTokens.typography.scale.body.sm.mobile,
        color: 'var(--muted-foreground)',
        marginTop: ProDesignTokens.spacing.xs,
      },
      errorText: {
        fontSize: ProDesignTokens.typography.scale.body.sm.mobile,
        color: 'var(--destructive)',
        marginTop: ProDesignTokens.spacing.xs,
      },
    },
  },

  // Typography specifications
  Typography: {
    h1: {
      fontSize: ProDesignTokens.typography.scale.heading.h1,
      fontWeight: ProDesignTokens.typography.fontWeights.bold,
      lineHeight: ProDesignTokens.typography.lineHeights.tight,
      letterSpacing: ProDesignTokens.typography.letterSpacing.tight,
      color: 'var(--foreground)',
      marginBottom: ProDesignTokens.spacing.md,
    },
    h2: {
      fontSize: ProDesignTokens.typography.scale.heading.h2,
      fontWeight: ProDesignTokens.typography.fontWeights.bold,
      lineHeight: ProDesignTokens.typography.lineHeights.tight,
      color: 'var(--foreground)',
      marginBottom: ProDesignTokens.spacing.md,
    },
    h3: {
      fontSize: ProDesignTokens.typography.scale.heading.h3,
      fontWeight: ProDesignTokens.typography.fontWeights.semibold,
      lineHeight: ProDesignTokens.typography.lineHeights.normal,
      color: 'var(--foreground)',
      marginBottom: ProDesignTokens.spacing.sm,
    },
    h4: {
      fontSize: ProDesignTokens.typography.scale.heading.h4,
      fontWeight: ProDesignTokens.typography.fontWeights.semibold,
      lineHeight: ProDesignTokens.typography.lineHeights.normal,
      color: 'var(--foreground)',
      marginBottom: ProDesignTokens.spacing.sm,
    },
    body: {
      fontSize: ProDesignTokens.typography.scale.body.md,
      fontWeight: ProDesignTokens.typography.fontWeights.normal,
      lineHeight: ProDesignTokens.typography.lineHeights.relaxed,
      color: 'var(--foreground)',
    },
    bodySmall: {
      fontSize: ProDesignTokens.typography.scale.body.sm,
      fontWeight: ProDesignTokens.typography.fontWeights.normal,
      lineHeight: ProDesignTokens.typography.lineHeights.relaxed,
      color: 'var(--muted-foreground)',
    },
    caption: {
      fontSize: ProDesignTokens.typography.scale.body.xs,
      fontWeight: ProDesignTokens.typography.fontWeights.normal,
      lineHeight: ProDesignTokens.typography.lineHeights.normal,
      color: 'var(--muted-foreground)',
    },
  },
}

// ============================================================================
// LAYOUT PATTERNS - Professional Page Structures
// ============================================================================

export const ProLayoutPatterns = {
  // Dashboard layout
  Dashboard: {
    header: {
      height: ProDesignTokens.layout.header.desktop,
      padding: {
        horizontal: ProDesignTokens.spacing.xl,
        vertical: ProDesignTokens.spacing.md,
      },
      borderBottom: '1px solid var(--border)',
      background: 'var(--background)',
    },
    sidebar: {
      width: ProDesignTokens.layout.sidebar.expanded,
      background: 'var(--sidebar-background)',
      borderRight: '1px solid var(--border)',
    },
    main: {
      padding: ProDesignTokens.spacing.xl,
      maxWidth: ProDesignTokens.layout.maxWidth.xl,
    },
    grid: {
      // Standard dashboard grid
      columns: {
        mobile: 1,
        tablet: 2,
        desktop: 3,
        wide: 4,
      },
      gap: ProDesignTokens.spacing.lg,
    },
  },

  // Page container
  PageContainer: {
    maxWidth: ProDesignTokens.layout.maxWidth.xl,
    margin: '0 auto',
    padding: {
      mobile: ProDesignTokens.spacing.md,
      tablet: ProDesignTokens.spacing.xl,
      desktop: ProDesignTokens.spacing.xl,
    },
  },

  // Section spacing
  Section: {
    padding: {
      top: ProDesignTokens.spacing.xl,
      bottom: ProDesignTokens.spacing.xl,
    },
    margin: {
      top: ProDesignTokens.spacing.xl,
      bottom: ProDesignTokens.spacing.xl,
    },
  },
}

// ============================================================================
// ACCESSIBILITY GUIDELINES
// ============================================================================

export const Accessibility = {
  // Focus states
  focus: {
    visible: {
      outline: '2px solid var(--ring)',
      outlineOffset: 2,
      boxShadow: '0 0 0 4px rgba(67, 56, 202, 0.3)',
    },
    ring: {
      width: 2,
      color: 'var(--ring)',
      offset: 2,
    },
  },

  // Color contrast
  contrast: {
    minimum: 4.5, // WCAG AA minimum
    enhanced: 7,   // WCAG AAA enhanced
  },

  // Touch targets
  touch: {
    minimum: 44, // 44x44px minimum touch target
    recommended: 48, // 48x48px recommended
  },

  // Keyboard navigation
  keyboard: {
    focusTrap: true,
    skipLinks: true,
    visibleFocus: true,
  },

  // Screen reader
  screenReader: {
    only: {
      position: 'absolute',
      width: 1,
      height: 1,
      padding: 0,
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: 0,
    },
  },
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Generate CSS custom properties
export function generateCSSVariables(tokens: typeof ProDesignTokens): string {
  const variables: string[] = []

  // Add spacing variables
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    if (typeof value === 'number') {
      variables.push(`--spacing-${key}: ${value}px;`)
    }
  })

  // Add typography variables
  Object.entries(tokens.typography.fontWeights).forEach(([key, value]) => {
    variables.push(`--font-weight-${key}: ${value};`)
  })

  Object.entries(tokens.typography.lineHeights).forEach(([key, value]) => {
    variables.push(`--line-height-${key}: ${value};`)
  })

  // Add border radius variables
  Object.entries(tokens.borderRadius).forEach(([key, value]) => {
    if (typeof value === 'number') {
      variables.push(`--radius-${key}: ${value}px;`)
    }
  })

  return variables.join('\n')
}

// Create responsive styles
export function responsiveStyle(
  property: string,
  values: Record<'mobile' | 'tablet' | 'desktop', string | number>
): string {
  const { mobile, tablet, desktop } = values
  return `${property}: ${mobile}; @media (min-width: 768px) { ${property}: ${tablet}; } @media (min-width: 1024px) { ${property}: ${desktop}; }`
}

// Create typography utility
export function typographyStyle(
  scale: keyof typeof ProDesignTokens.typography.scale,
  variant: keyof typeof ProDesignTokens.typography.scale[keyof typeof ProDesignTokens.typography.scale]
): string {
  const size = ProDesignTokens.typography.scale[scale][variant]
  return `font-size: ${size}px;`
}

// Export all professional design tokens and specifications
export {
  ProDesignTokens as default,
  Breakpoints,
  ProComponentSpecs,
  ProLayoutPatterns,
  Accessibility,
  generateCSSVariables,
  responsiveStyle,
  typographyStyle,
}