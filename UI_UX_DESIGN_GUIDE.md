# Professional UI/UX Design Guide
## Industry-Standard Design System Implementation

---

## 📋 TABLE OF CONTENTS
1. [Design Philosophy](#design-philosophy)
2. [Layout System](#layout-system)
3. [Component Architecture](#component-architecture)
4. [Page-Specific Designs](#page-specific-designs)
5. [User Experience Guidelines](#user-experience-guidelines)
6. [Accessibility Standards](#accessibility-standards)
7. [Responsive Design Rules](#responsive-design-rules)

---

## 🎨 DESIGN PHILOSOPHY

### Core Principles
- **Consistency**: Uniform patterns across all pages
- **Clarity**: Clear hierarchy and purpose for every element
- **Efficiency**: Minimal clicks to complete tasks
- **Aesthetics**: Professional, modern, trustworthy
- **Accessibility**: WCAG 2.1 AA compliance

### Design Tokens Usage
All designs use the existing `lib/design-system.ts` tokens:
- **Colors**: OKLCH-based semantic palette
- **Spacing**: 8px base scale
- **Typography**: Fluid scaling system
- **Border Radius**: 4-32px scale
- **Shadows**: Elevation-based system

---

## 🏗️ LAYOUT SYSTEM

### 1. Grid System
```typescript
// 12-column grid with 8px base
const Grid = {
  columns: 12,
  gutter: DesignTokens.spacing.md, // 16px
  margin: DesignTokens.layout.containerPadding,
  maxWidth: DesignTokens.layout.maxWidth.xl, // 1280px
}
```

### 2. Page Structure
```
┌─────────────────────────────────────────────────────────┐
│                    HEADER (56-64px)                     │
├─────────────────────────────────────────────────────────┤
│  SIDEBAR (288px)  │  MAIN CONTENT (flexible)          │
│  - Collapsible    │  - Min width: 320px               │
│  - Sticky         │  - Max width: 1280px              │
│                   │  - Auto-scroll                    │
└─────────────────┴──────────────────────────────────────┘
                    TAB BAR (88px mobile)
```

### 3. Spacing Rules
```typescript
// Vertical Rhythm
const verticalSpacing = {
  sectionToSection: DesignTokens.spacing.section.desktop, // 64px
  componentToComponent: DesignTokens.spacing.lg, // 24px
  elementToElement: DesignTokens.spacing.md, // 16px
  tight: DesignTokens.spacing.sm, // 8px
}

// Horizontal Alignment
const horizontalSpacing = {
  containerPadding: DesignTokens.layout.containerPadding.desktop, // 32px
  componentPadding: DesignTokens.componentSizes.card.md, // 20px
}
```

---

## 🧩 COMPONENT ARCHITECTURE

### 1. Card System
All content containers follow this structure:

```typescript
// Standard Card Dimensions
const Card = {
  borderRadius: DesignTokens.borderRadius.card, // 16px
  shadow: DesignTokens.shadows.web.md,
  padding: {
    xs: DesignTokens.componentSizes.card.xs, // 12px
    sm: DesignTokens.componentSizes.card.sm, // 16px
    md: DesignTokens.componentSizes.card.md, // 20px
    lg: DesignTokens.componentSizes.card.lg, // 24px
  },
  // Variants
  variants: {
    default: {
      background: DesignTokens.colors.card,
      border: '1px solid ' + DesignTokens.colors.border,
    },
    elevated: {
      background: DesignTokens.colors.card,
      shadow: DesignTokens.shadows.web.lg,
      border: '1px solid ' + DesignTokens.colors.border,
    },
    glass: {
      background: DesignTokens.glass.light.background,
      backdropFilter: `blur(${DesignTokens.glass.light.blur}px)`,
      border: '1px solid ' + DesignTokens.glass.light.border,
    },
  }
}
```

### 2. Button System
```typescript
const Button = {
  // Sizes
  sizes: {
    xs: { height: 32, padding: '0 12px', fontSize: DesignTokens.typography.scale.body.xs },
    sm: { height: 40, padding: '0 16px', fontSize: DesignTokens.typography.scale.body.sm },
    md: { height: 48, padding: '0 20px', fontSize: DesignTokens.typography.scale.body.md },
    lg: { height: 56, padding: '0 24px', fontSize: DesignTokens.typography.scale.body.lg },
  },
  // Variants
  variants: {
    primary: {
      background: DesignTokens.colors.primary,
      color: DesignTokens.colors.primaryForeground,
      hover: DesignTokens.colors.primary,
      opacity: 0.9,
    },
    secondary: {
      background: DesignTokens.colors.secondary,
      color: DesignTokens.colors.secondaryForeground,
      border: '1px solid ' + DesignTokens.colors.border,
    },
    outline: {
      background: 'transparent',
      color: DesignTokens.colors.foreground,
      border: '1px solid ' + DesignTokens.colors.border,
    },
    ghost: {
      background: 'transparent',
      color: DesignTokens.colors.foreground,
    },
    destructive: {
      background: DesignTokens.colors.destructive,
      color: DesignTokens.colors.destructiveForeground,
    },
  },
  // States
  states: {
    disabled: { opacity: 0.5, cursor: 'not-allowed' },
    loading: { opacity: 0.7, cursor: 'wait' },
  },
  // Touch Targets
  touchTarget: {
    minimum: DesignTokens.componentSizes.touchTarget.minimum, // 44px
    comfortable: DesignTokens.componentSizes.touchTarget.comfortable, // 48px
  }
}
```

### 3. Form Components
```typescript
const Form = {
  input: {
    height: {
      xs: 36,
      sm: 40,
      md: 48,
      lg: 56,
    },
    padding: '0 14px',
    borderRadius: DesignTokens.borderRadius.input, // 12px
    border: '1px solid ' + DesignTokens.colors.input,
    background: DesignTokens.colors.background,
    // States
    focus: {
      borderColor: DesignTokens.colors.ring,
      boxShadow: DesignTokens.shadows.web.primarySm,
    },
    error: {
      borderColor: DesignTokens.colors.destructive,
    },
    disabled: {
      background: DesignTokens.colors.muted,
      opacity: 0.6,
    },
  },
  label: {
    fontSize: DesignTokens.typography.scale.body.sm,
    fontWeight: DesignTokens.typography.fontWeights.medium,
    color: DesignTokens.colors.foreground,
    marginBottom: DesignTokens.spacing.xs, // 4px
  },
  helperText: {
    fontSize: DesignTokens.typography.scale.body.xs,
    color: DesignTokens.colors.mutedForeground,
    marginTop: DesignTokens.spacing.xs, // 4px
  },
  // Spacing between form elements
  spacing: {
    vertical: DesignTokens.spacing.md, // 16px
    horizontal: DesignTokens.spacing.lg, // 24px
  }
}
```

### 4. Typography Hierarchy
```typescript
const Typography = {
  // Headings
  h1: {
    fontSize: DesignTokens.typography.scale.heading.h1,
    fontWeight: DesignTokens.typography.fontWeights.bold,
    lineHeight: DesignTokens.typography.lineHeights.tight,
    letterSpacing: DesignTokens.typography.letterSpacing.tighter,
    color: DesignTokens.colors.foreground,
    marginBottom: DesignTokens.spacing.lg, // 24px
  },
  h2: {
    fontSize: DesignTokens.typography.scale.heading.h2,
    fontWeight: DesignTokens.typography.fontWeights.semibold,
    lineHeight: DesignTokens.typography.lineHeights.snug,
    color: DesignTokens.colors.foreground,
    marginBottom: DesignTokens.spacing.md, // 16px
  },
  h3: {
    fontSize: DesignTokens.typography.scale.heading.h3,
    fontWeight: DesignTokens.typography.fontWeights.semibold,
    lineHeight: DesignTokens.typography.lineHeights.normal,
    color: DesignTokens.colors.foreground,
    marginBottom: DesignTokens.spacing.sm, // 8px
  },
  // Body
  body: {
    lg: {
      fontSize: DesignTokens.typography.scale.body.lg,
      lineHeight: DesignTokens.typography.lineHeights.relaxed,
      color: DesignTokens.colors.foreground,
    },
    md: {
      fontSize: DesignTokens.typography.scale.body.md,
      lineHeight: DesignTokens.typography.lineHeights.normal,
      color: DesignTokens.colors.foreground,
    },
    sm: {
      fontSize: DesignTokens.typography.scale.body.sm,
      lineHeight: DesignTokens.typography.lineHeights.snug,
      color: DesignTokens.colors.mutedForeground,
    },
  },
  // Special
  numeric: {
    xl: {
      fontSize: DesignTokens.typography.scale.numeric.xl,
      fontWeight: DesignTokens.typography.fontWeights.bold,
      fontVariantNumeric: 'tabular-nums',
      color: DesignTokens.colors.foreground,
    },
  },
  code: {
    fontFamily: DesignTokens.typography.fontFamilies.mono,
    fontSize: DesignTokens.typography.scale.body.sm,
    background: DesignTokens.colors.muted,
    padding: '2px 6px',
    borderRadius: DesignTokens.borderRadius.xs,
  },
}
```

---

## 📄 PAGE-SPECIFIC DESIGNS

### 1. Dashboard Page (`app/page.tsx`)
```typescript
// Layout Structure
const DashboardLayout = {
  // Header
  header: {
    height: DesignTokens.layout.header.desktop, // 64px
    background: DesignTokens.colors.background,
    borderBottom: '1px solid ' + DesignTokens.colors.border,
    padding: `0 ${DesignTokens.layout.containerPadding.desktop}px`,
    // Navigation items spacing
    navItemSpacing: DesignTokens.spacing.lg, // 24px
  },

  // Hero Section
  hero: {
    padding: `${DesignTokens.spacing.section.desktop}px 0`, // 64px
    maxWidth: DesignTokens.layout.maxWidth.xl, // 1280px
    margin: '0 auto',
    // Title
    title: {
      fontSize: DesignTokens.typography.scale.display.lg.desktop, // 72px
      fontWeight: DesignTokens.typography.fontWeights.extrabold,
      lineHeight: DesignTokens.typography.lineHeights.tight,
      marginBottom: DesignTokens.spacing.md, // 16px
    },
    // Subtitle
    subtitle: {
      fontSize: DesignTokens.typography.scale.body.xl.desktop, // 20px
      color: DesignTokens.colors.mutedForeground,
      maxWidth: DesignTokens.layout.maxWidth.md, // 768px
      marginBottom: DesignTokens.spacing.xl, // 32px
    },
  },

  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: DesignTokens.spacing.lg, // 24px
    marginBottom: DesignTokens.spacing.section.desktop, // 64px
    // Stat Card
    statCard: {
      padding: DesignTokens.componentSizes.card.lg, // 24px
      borderRadius: DesignTokens.borderRadius.card, // 16px
      background: DesignTokens.colors.card,
      border: '1px solid ' + DesignTokens.colors.border,
      // Icon
      icon: {
        size: DesignTokens.componentSizes.icon.xl, // 28px
        marginBottom: DesignTokens.spacing.sm, // 8px
        color: DesignTokens.colors.primary,
      },
      // Value
      value: {
        fontSize: DesignTokens.typography.scale.numeric.lg.desktop, // 40px
        fontWeight: DesignTokens.typography.fontWeights.bold,
        color: DesignTokens.colors.foreground,
        marginBottom: DesignTokens.spacing.xs, // 4px
      },
      // Label
      label: {
        fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
        color: DesignTokens.colors.mutedForeground,
      },
    },
  },

  // Features Section
  features: {
    padding: `${DesignTokens.spacing.section.desktop}px 0`, // 64px
    // Section Header
    sectionHeader: {
      textAlign: 'center',
      marginBottom: DesignTokens.spacing.xl, // 32px
      // Title
      title: {
        fontSize: DesignTokens.typography.scale.heading.h2.desktop, // 36px
        fontWeight: DesignTokens.typography.fontWeights.bold,
        marginBottom: DesignTokens.spacing.sm, // 8px
      },
    },
    // Features Grid
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: DesignTokens.spacing.lg, // 24px
      // Feature Card
      card: {
        padding: DesignTokens.componentSizes.card.lg, // 24px
        borderRadius: DesignTokens.borderRadius.card, // 16px
        background: DesignTokens.colors.card,
        border: '1px solid ' + DesignTokens.colors.border,
        transition: `transform ${DesignTokens.animation.duration.normal}ms ${DesignTokens.animation.easing.easeOut}`,
        hover: {
          transform: 'translateY(-4px)',
          boxShadow: DesignTokens.shadows.web.lg,
        },
        // Icon
        icon: {
          size: DesignTokens.componentSizes.icon['2xl'], // 32px
          marginBottom: DesignTokens.spacing.sm, // 8px
          color: DesignTokens.colors.primary,
        },
        // Title
        title: {
          fontSize: DesignTokens.typography.scale.heading.h3.desktop, // 24px
          fontWeight: DesignTokens.typography.fontWeights.semibold,
          marginBottom: DesignTokens.spacing.sm, // 8px
        },
        // Description
        description: {
          fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
          color: DesignTokens.colors.mutedForeground,
          lineHeight: DesignTokens.typography.lineHeights.relaxed,
        },
      },
    },
  },

  // CTA Section
  cta: {
    padding: `${DesignTokens.spacing.section.desktop}px 0`, // 64px
    background: DesignTokens.colors.primary,
    color: DesignTokens.colors.primaryForeground,
    borderRadius: DesignTokens.borderRadius['3xl'], // 32px
    margin: `${DesignTokens.spacing.section.desktop}px 0`, // 64px
    textAlign: 'center',
    // Content
    content: {
      maxWidth: DesignTokens.layout.maxWidth.md, // 768px
      margin: '0 auto',
      padding: DesignTokens.spacing.xl, // 32px
      // Title
      title: {
        fontSize: DesignTokens.typography.scale.heading.h2.desktop, // 36px
        fontWeight: DesignTokens.typography.fontWeights.bold,
        marginBottom: DesignTokens.spacing.sm, // 8px
      },
      // Description
      description: {
        fontSize: DesignTokens.typography.scale.body.xl.desktop, // 20px
        marginBottom: DesignTokens.spacing.xl, // 32px
        opacity: 0.9,
      },
    },
    // Button
    button: {
      size: 'lg',
      variant: 'secondary',
      minWidth: 200,
    },
  },
}
```

### 2. Analytics Page (`app/analytics/page.tsx`)
```typescript
const AnalyticsLayout = {
  // Header
  header: {
    marginBottom: DesignTokens.spacing.lg, // 24px
    // Title
    title: {
      fontSize: DesignTokens.typography.scale.heading.h1.desktop, // 48px
      fontWeight: DesignTokens.typography.fontWeights.bold,
      marginBottom: DesignTokens.spacing.xs, // 4px
    },
    // Subtitle
    subtitle: {
      fontSize: DesignTokens.typography.scale.body.lg.desktop, // 18px
      color: DesignTokens.colors.mutedForeground,
    },
  },

  // Filter Bar
  filterBar: {
    display: 'flex',
    gap: DesignTokens.spacing.md, // 16px
    marginBottom: DesignTokens.spacing.xl, // 32px
    flexWrap: 'wrap',
    alignItems: 'center',
    // Filter Input
    filterInput: {
      flex: 1,
      minWidth: 240,
    },
    // Date Range Picker
    dateRange: {
      width: 320,
    },
  },

  // Charts Grid
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: DesignTokens.spacing.lg, // 24px
    marginBottom: DesignTokens.spacing.xl, // 32px
    // Chart Card (spans 12 columns on mobile, 6 on tablet, 4 on desktop)
    chartCard: {
      gridColumn: {
        mobile: 'span 12',
        tablet: 'span 6',
        desktop: 'span 4',
      },
      padding: DesignTokens.componentSizes.card.md, // 20px
      borderRadius: DesignTokens.borderRadius.card, // 16px
      background: DesignTokens.colors.card,
      border: '1px solid ' + DesignTokens.colors.border,
      // Header
      header: {
        marginBottom: DesignTokens.spacing.md, // 16px
        // Title
        title: {
          fontSize: DesignTokens.typography.scale.heading.h4.desktop, // 18px
          fontWeight: DesignTokens.typography.fontWeights.semibold,
          marginBottom: DesignTokens.spacing.xs, // 4px
        },
        // Subtitle
        subtitle: {
          fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
          color: DesignTokens.colors.mutedForeground,
        },
      },
      // Chart Container
      chart: {
        height: 280,
        position: 'relative',
      },
    },
  },

  // Data Table
  dataTable: {
    background: DesignTokens.colors.card,
    borderRadius: DesignTokens.borderRadius.card, // 16px
    border: '1px solid ' + DesignTokens.colors.border,
    overflow: 'hidden',
    // Header
    header: {
      background: DesignTokens.colors.muted,
      padding: DesignTokens.spacing.md, // 16px
      // Title
      title: {
        fontSize: DesignTokens.typography.scale.heading.h3.desktop, // 24px
        fontWeight: DesignTokens.typography.fontWeights.semibold,
      },
    },
    // Table
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      // Header Row
      headerRow: {
        background: DesignTokens.colors.muted,
        // Cell
        cell: {
          padding: DesignTokens.spacing.md, // 16px
          textAlign: 'left',
          fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
          fontWeight: DesignTokens.typography.fontWeights.medium,
          color: DesignTokens.colors.mutedForeground,
          borderBottom: '1px solid ' + DesignTokens.colors.border,
        },
      },
      // Body Row
      bodyRow: {
        borderBottom: '1px solid ' + DesignTokens.colors.border,
        transition: `background ${DesignTokens.animation.duration.fast}ms`,
        hover: {
          background: DesignTokens.colors.muted,
        },
        // Cell
        cell: {
          padding: DesignTokens.spacing.md, // 16px
          fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
          color: DesignTokens.colors.foreground,
        },
      },
    },
    // Pagination
    pagination: {
      display: 'flex',
      justifyContent: 'flex-end',
      padding: DesignTokens.spacing.md, // 16px
      gap: DesignTokens.spacing.sm, // 8px
    },
  },
}
```

### 3. Upload Page (`app/upload/page.tsx`)
```typescript
const UploadLayout = {
  // Container
  container: {
    maxWidth: DesignTokens.layout.maxWidth.md, // 768px
    margin: '0 auto',
    padding: `${DesignTokens.spacing.section.desktop}px 0`, // 64px
  },

  // Header
  header: {
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.xl, // 32px
    // Title
    title: {
      fontSize: DesignTokens.typography.scale.heading.h1.desktop, // 48px
      fontWeight: DesignTokens.typography.fontWeights.bold,
      marginBottom: DesignTokens.spacing.sm, // 8px
    },
    // Subtitle
    subtitle: {
      fontSize: DesignTokens.typography.scale.body.xl.desktop, // 20px
      color: DesignTokens.colors.mutedForeground,
    },
  },

  // Upload Zone
  uploadZone: {
    border: `2px dashed ${DesignTokens.colors.border}`,
    borderRadius: DesignTokens.borderRadius.card, // 16px
    padding: DesignTokens.spacing.xl, // 32px
    textAlign: 'center',
    background: DesignTokens.colors.muted,
    marginBottom: DesignTokens.spacing.lg, // 24px
    transition: `all ${DesignTokens.animation.duration.normal}ms`,
    // States
    hover: {
      borderColor: DesignTokens.colors.primary,
      background: DesignTokens.colors.primary,
      color: DesignTokens.colors.primaryForeground,
    },
    active: {
      borderColor: DesignTokens.colors.primary,
      background: DesignTokens.colors.primary,
      color: DesignTokens.colors.primaryForeground,
      opacity: 0.9,
    },
    disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    // Icon
    icon: {
      size: DesignTokens.componentSizes.icon['3xl'], // 40px
      marginBottom: DesignTokens.spacing.md, // 16px
      color: DesignTokens.colors.primary,
    },
    // Label
    label: {
      fontSize: DesignTokens.typography.scale.heading.h3.desktop, // 24px
      fontWeight: DesignTokens.typography.fontWeights.semibold,
      marginBottom: DesignTokens.spacing.sm, // 8px
    },
    // Description
    description: {
      fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
      color: DesignTokens.colors.mutedForeground,
    },
  },

  // File List
  fileList: {
    marginBottom: DesignTokens.spacing.xl, // 32px
    // File Item
    fileItem: {
      display: 'flex',
      alignItems: 'center',
      padding: DesignTokens.spacing.md, // 16px
      background: DesignTokens.colors.card,
      borderRadius: DesignTokens.borderRadius.md, // 12px
      border: '1px solid ' + DesignTokens.colors.border,
      marginBottom: DesignTokens.spacing.sm, // 8px
      // Icon
      icon: {
        size: DesignTokens.componentSizes.icon.lg, // 24px
        marginRight: DesignTokens.spacing.md, // 16px
        color: DesignTokens.colors.primary,
      },
      // Info
      info: {
        flex: 1,
        // Name
        name: {
          fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
          fontWeight: DesignTokens.typography.fontWeights.medium,
          marginBottom: DesignTokens.spacing.xs, // 4px
        },
        // Size
        size: {
          fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
          color: DesignTokens.colors.mutedForeground,
        },
      },
      // Status
      status: {
        marginLeft: DesignTokens.spacing.md, // 16px
      },
      // Actions
      actions: {
        display: 'flex',
        gap: DesignTokens.spacing.sm, // 8px
        marginLeft: DesignTokens.spacing.md, // 16px
      },
    },
  },

  // Progress
  progress: {
    marginBottom: DesignTokens.spacing.xl, // 32px
    // Overall Progress
    overall: {
      marginBottom: DesignTokens.spacing.lg, // 24px
      // Label
      label: {
        fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
        fontWeight: DesignTokens.typography.fontWeights.medium,
        marginBottom: DesignTokens.spacing.sm, // 8px
      },
      // Bar
      bar: {
        height: 8,
        borderRadius: DesignTokens.borderRadius.full,
        background: DesignTokens.colors.muted,
        overflow: 'hidden',
        // Fill
        fill: {
          height: '100%',
          borderRadius: DesignTokens.borderRadius.full,
          background: DesignTokens.colors.primary,
          transition: `width ${DesignTokens.animation.duration.slow}ms ${DesignTokens.animation.easing.easeOut}`,
        },
      },
      // Percentage
      percentage: {
        fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
        color: DesignTokens.colors.mutedForeground,
        marginTop: DesignTokens.spacing.xs, // 4px
      },
    },
    // File Progress
    fileProgress: {
      marginBottom: DesignTokens.spacing.sm, // 8px
      // Container
      container: {
        display: 'flex',
        alignItems: 'center',
        gap: DesignTokens.spacing.md, // 16px
      },
      // Name
      name: {
        flex: 1,
        fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
      },
      // Bar
      bar: {
        width: 160,
        height: 6,
        borderRadius: DesignTokens.borderRadius.full,
        background: DesignTokens.colors.muted,
        overflow: 'hidden',
        // Fill
        fill: {
          height: '100%',
          borderRadius: DesignTokens.borderRadius.full,
          background: DesignTokens.colors.primary,
        },
      },
      // Percentage
      percentage: {
        width: 50,
        fontSize: DesignTokens.typography.scale.body.xs.desktop, // 12px
        color: DesignTokens.colors.mutedForeground,
        textAlign: 'right',
      },
    },
  },

  // Actions
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: DesignTokens.spacing.md, // 16px
    marginTop: DesignTokens.spacing.xl, // 32px
  },
}
```

### 4. AI Chat Page (`app/ai-ca/page.tsx`)
```typescript
const AIChatLayout = {
  // Container
  container: {
    display: 'flex',
    height: 'calc(100vh - 64px)', // Full viewport minus header
    maxWidth: DesignTokens.layout.maxWidth.xl, // 1280px
    margin: '0 auto',
    borderRadius: DesignTokens.borderRadius.card, // 16px
    border: '1px solid ' + DesignTokens.colors.border,
    overflow: 'hidden',
    background: DesignTokens.colors.card,
  },

  // Sidebar
  sidebar: {
    width: DesignTokens.layout.sidebar.default, // 288px
    background: DesignTokens.colors.background,
    borderRight: '1px solid ' + DesignTokens.colors.border,
    padding: DesignTokens.spacing.lg, // 24px
    // Header
    header: {
      marginBottom: DesignTokens.spacing.xl, // 32px
      // Title
      title: {
        fontSize: DesignTokens.typography.scale.heading.h2.desktop, // 36px
        fontWeight: DesignTokens.typography.fontWeights.bold,
        marginBottom: DesignTokens.spacing.sm, // 8px
      },
      // Subtitle
      subtitle: {
        fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
        color: DesignTokens.colors.mutedForeground,
      },
    },
    // New Chat Button
    newChatButton: {
      width: '100%',
      marginBottom: DesignTokens.spacing.xl, // 32px
    },
    // Chat History
    chatHistory: {
      // Title
      title: {
        fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
        fontWeight: DesignTokens.typography.fontWeights.medium,
        color: DesignTokens.colors.mutedForeground,
        marginBottom: DesignTokens.spacing.md, // 16px
        textTransform: 'uppercase',
        letterSpacing: DesignTokens.typography.letterSpacing.wide,
      },
      // List
      list: {
        display: 'flex',
        flexDirection: 'column',
        gap: DesignTokens.spacing.sm, // 8px
        maxHeight: 'calc(100% - 200px)',
        overflowY: 'auto',
      },
      // History Item
      historyItem: {
        padding: DesignTokens.spacing.md, // 16px
        borderRadius: DesignTokens.borderRadius.md, // 12px
        cursor: 'pointer',
        transition: `background ${DesignTokens.animation.duration.fast}ms`,
        // States
        hover: {
          background: DesignTokens.colors.muted,
        },
        active: {
          background: DesignTokens.colors.primary,
          color: DesignTokens.colors.primaryForeground,
        },
        // Title
        title: {
          fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
          fontWeight: DesignTokens.typography.fontWeights.normal,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
        // Date
        date: {
          fontSize: DesignTokens.typography.scale.body.xs.desktop, // 12px
          color: DesignTokens.colors.mutedForeground,
          marginTop: DesignTokens.spacing.xs, // 4px
        },
      },
    },
  },

  // Main Chat Area
  mainChat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    // Header
    header: {
      padding: DesignTokens.spacing.lg, // 24px
      borderBottom: '1px solid ' + DesignTokens.colors.border,
      background: DesignTokens.colors.background,
      // Title
      title: {
        fontSize: DesignTokens.typography.scale.heading.h3.desktop, // 24px
        fontWeight: DesignTokens.typography.fontWeights.semibold,
      },
    },
    // Messages
    messages: {
      flex: 1,
      overflowY: 'auto',
      padding: DesignTokens.spacing.xl, // 32px
      display: 'flex',
      flexDirection: 'column',
      gap: DesignTokens.spacing.md, // 16px
      // Message
      message: {
        maxWidth: DesignTokens.layout.maxWidth.md, // 768px
        padding: DesignTokens.spacing.md, // 16px
        borderRadius: DesignTokens.borderRadius.lg, // 16px
        // User Message
        user: {
          alignSelf: 'flex-end',
          background: DesignTokens.colors.primary,
          color: DesignTokens.colors.primaryForeground,
          borderTopRightRadius: DesignTokens.borderRadius.xs, // 4px
        },
        // Assistant Message
        assistant: {
          alignSelf: 'flex-start',
          background: DesignTokens.colors.muted,
          color: DesignTokens.colors.foreground,
          borderTopLeftRadius: DesignTokens.borderRadius.xs, // 4px
        },
        // Content
        content: {
          fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
          lineHeight: DesignTokens.typography.lineHeights.relaxed,
          // Code Block
          codeBlock: {
            background: DesignTokens.colors.background,
            padding: DesignTokens.spacing.md, // 16px
            borderRadius: DesignTokens.borderRadius.md, // 12px
            margin: `${DesignTokens.spacing.md}px 0`, // 16px
            overflowX: 'auto',
            fontFamily: DesignTokens.typography.fontFamilies.mono,
            fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
            // Header
            header: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: DesignTokens.spacing.sm, // 8px
              // Language
              language: {
                fontSize: DesignTokens.typography.scale.body.xs.desktop, // 12px
                color: DesignTokens.colors.mutedForeground,
              },
              // Copy Button
              copyButton: {
                padding: DesignTokens.spacing.xs, // 4px
                fontSize: DesignTokens.typography.scale.body.xs.desktop, // 12px
              },
            },
          },
          // Link
          link: {
            color: DesignTokens.colors.primary,
            textDecoration: 'underline',
            fontWeight: DesignTokens.typography.fontWeights.medium,
          },
        },
        // Timestamp
        timestamp: {
          fontSize: DesignTokens.typography.scale.body.xs.desktop, // 12px
          color: DesignTokens.colors.mutedForeground,
          marginTop: DesignTokens.spacing.sm, // 8px
          display: 'flex',
          justifyContent: 'flex-end',
        },
      },
    },
    // Input Area
    inputArea: {
      padding: DesignTokens.spacing.xl, // 32px
      borderTop: '1px solid ' + DesignTokens.colors.border,
      background: DesignTokens.colors.background,
      // Container
      container: {
        maxWidth: DesignTokens.layout.maxWidth.md, // 768px
        margin: '0 auto',
        display: 'flex',
        gap: DesignTokens.spacing.md, // 16px
        alignItems: 'flex-end',
      },
      // Input
      input: {
        flex: 1,
        minHeight: 48,
        maxHeight: 160,
        padding: DesignTokens.spacing.md, // 16px
        borderRadius: DesignTokens.borderRadius.input, // 12px
        border: '1px solid ' + DesignTokens.colors.input,
        background: DesignTokens.colors.card,
        fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
        resize: 'none',
        // Placeholder
        placeholder: {
          color: DesignTokens.colors.mutedForeground,
        },
        // Focus
        focus: {
          borderColor: DesignTokens.colors.ring,
          boxShadow: DesignTokens.shadows.web.primarySm,
          outline: 'none',
        },
      },
      // Send Button
      sendButton: {
        height: 48,
        width: 48,
        borderRadius: DesignTokens.borderRadius.full,
        background: DesignTokens.colors.primary,
        color: DesignTokens.colors.primaryForeground,
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: `transform ${DesignTokens.animation.duration.fast}ms, background ${DesignTokens.animation.duration.fast}ms`,
        // States
        hover: {
          background: DesignTokens.colors.primary,
          opacity: 0.9,
          transform: 'scale(1.05)',
        },
        disabled: {
          background: DesignTokens.colors.muted,
          color: DesignTokens.colors.mutedForeground,
          cursor: 'not-allowed',
          opacity: 0.5,
        },
        // Icon
        icon: {
          size: DesignTokens.componentSizes.icon.md, // 20px
        },
      },
    },
  },
}
```

### 5. Calculators Page (`app/calculators/page.tsx`)
```typescript
const CalculatorsLayout = {
  // Container
  container: {
    maxWidth: DesignTokens.layout.maxWidth.xl, // 1280px
    margin: '0 auto',
    padding: `${DesignTokens.spacing.section.desktop}px 0`, // 64px
  },

  // Header
  header: {
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.xl, // 32px
    // Title
    title: {
      fontSize: DesignTokens.typography.scale.heading.h1.desktop, // 48px
      fontWeight: DesignTokens.typography.fontWeights.bold,
      marginBottom: DesignTokens.spacing.sm, // 8px
    },
    // Subtitle
    subtitle: {
      fontSize: DesignTokens.typography.scale.body.xl.desktop, // 20px
      color: DesignTokens.colors.mutedForeground,
      maxWidth: DesignTokens.layout.maxWidth.md, // 768px
      margin: '0 auto',
    },
  },

  // Calculator Grid
  calculatorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: DesignTokens.spacing.lg, // 24px
    // Calculator Card
    calculatorCard: {
      padding: DesignTokens.componentSizes.card.lg, // 24px
      borderRadius: DesignTokens.borderRadius.card, // 16px
      background: DesignTokens.colors.card,
      border: '1px solid ' + DesignTokens.colors.border,
      transition: `transform ${DesignTokens.animation.duration.normal}ms, box-shadow ${DesignTokens.animation.duration.normal}ms`,
      cursor: 'pointer',
      // States
      hover: {
        transform: 'translateY(-4px)',
        boxShadow: DesignTokens.shadows.web.lg,
      },
      // Icon
      icon: {
        size: DesignTokens.componentSizes.icon['2xl'], // 32px
        marginBottom: DesignTokens.spacing.md, // 16px
        color: DesignTokens.colors.primary,
      },
      // Title
      title: {
        fontSize: DesignTokens.typography.scale.heading.h3.desktop, // 24px
        fontWeight: DesignTokens.typography.fontWeights.semibold,
        marginBottom: DesignTokens.spacing.sm, // 8px
      },
      // Description
      description: {
        fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
        color: DesignTokens.colors.mutedForeground,
        lineHeight: DesignTokens.typography.lineHeights.relaxed,
        marginBottom: DesignTokens.spacing.md, // 16px
      },
      // Tag
      tag: {
        display: 'inline-block',
        padding: `${DesignTokens.spacing.xs}px ${DesignTokens.spacing.sm}px`, // 4px 8px
        borderRadius: DesignTokens.borderRadius.chip, // 20px
        fontSize: DesignTokens.typography.scale.body.xs.desktop, // 12px
        fontWeight: DesignTokens.typography.fontWeights.medium,
        background: DesignTokens.colors.primary,
        color: DesignTokens.colors.primaryForeground,
      },
    },
  },

  // Featured Calculator
  featuredCalculator: {
    marginBottom: DesignTokens.spacing.xl, // 32px
    // Container
    container: {
      display: 'grid',
      gridTemplateColumns: {
        mobile: '1fr',
        tablet: '1fr 1fr',
      },
      gap: DesignTokens.spacing.xl, // 32px
      padding: DesignTokens.componentSizes.card.xl, // 32px
      borderRadius: DesignTokens.borderRadius.card, // 16px
      background: DesignTokens.colors.primary,
      color: DesignTokens.colors.primaryForeground,
      border: '1px solid ' + DesignTokens.colors.primary,
    },
    // Content
    content: {
      // Label
      label: {
        fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
        fontWeight: DesignTokens.typography.fontWeights.medium,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: DesignTokens.spacing.sm, // 8px
        textTransform: 'uppercase',
        letterSpacing: DesignTokens.typography.letterSpacing.wide,
      },
      // Title
      title: {
        fontSize: DesignTokens.typography.scale.heading.h2.desktop, // 36px
        fontWeight: DesignTokens.typography.fontWeights.bold,
        marginBottom: DesignTokens.spacing.md, // 16px
      },
      // Description
      description: {
        fontSize: DesignTokens.typography.scale.body.lg.desktop, // 18px
        lineHeight: DesignTokens.typography.lineHeights.relaxed,
        opacity: 0.9,
        marginBottom: DesignTokens.spacing.xl, // 32px
      },
      // Button
      button: {
        size: 'lg',
        variant: 'secondary',
      },
    },
    // Image
    image: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      // Icon
      icon: {
        size: DesignTokens.componentSizes.icon['3xl'], // 40px
      },
    },
  },

  // Categories
  categories: {
    marginBottom: DesignTokens.spacing.xl, // 32px
    // Title
    title: {
      fontSize: DesignTokens.typography.scale.heading.h2.desktop, // 36px
      fontWeight: DesignTokens.typography.fontWeights.bold,
      marginBottom: DesignTokens.spacing.xl, // 32px
    },
    // Grid
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: DesignTokens.spacing.md, // 16px
    },
    // Category Card
    categoryCard: {
      padding: DesignTokens.componentSizes.card.md, // 20px
      borderRadius: DesignTokens.borderRadius.card, // 16px
      background: DesignTokens.colors.card,
      border: '1px solid ' + DesignTokens.colors.border,
      transition: `transform ${DesignTokens.animation.duration.normal}ms`,
      cursor: 'pointer',
      // States
      hover: {
        transform: 'translateY(-2px)',
        boxShadow: DesignTokens.shadows.web.md,
      },
      // Icon
      icon: {
        size: DesignTokens.componentSizes.icon.xl, // 28px
        marginBottom: DesignTokens.spacing.sm, // 8px
        color: DesignTokens.colors.primary,
      },
      // Title
      title: {
        fontSize: DesignTokens.typography.scale.heading.h4.desktop, // 18px
        fontWeight: DesignTokens.typography.fontWeights.semibold,
      },
      // Count
      count: {
        fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
        color: DesignTokens.colors.mutedForeground,
        marginTop: DesignTokens.spacing.xs, // 4px
      },
    },
  },
}

const CalculatorFormLayout = {
  // Container
  container: {
    maxWidth: DesignTokens.layout.maxWidth.md, // 768px
    margin: '0 auto',
    padding: `${DesignTokens.spacing.section.desktop}px 0`, // 64px
  },

  // Header
  header: {
    marginBottom: DesignTokens.spacing.xl, // 32px
    // Back Button
    backButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: DesignTokens.spacing.xs, // 4px
      padding: `${DesignTokens.spacing.sm}px ${DesignTokens.spacing.md}px`, // 8px 16px
      borderRadius: DesignTokens.borderRadius.md, // 12px
      border: '1px solid ' + DesignTokens.colors.border,
      background: DesignTokens.colors.card,
      fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
      fontWeight: DesignTokens.typography.fontWeights.medium,
      color: DesignTokens.colors.foreground,
      cursor: 'pointer',
      transition: `background ${DesignTokens.animation.duration.fast}ms`,
      // States
      hover: {
        background: DesignTokens.colors.muted,
      },
      // Icon
      icon: {
        size: DesignTokens.componentSizes.icon.sm, // 16px
      },
    },
    // Title
    title: {
      fontSize: DesignTokens.typography.scale.heading.h1.desktop, // 48px
      fontWeight: DesignTokens.typography.fontWeights.bold,
      marginBottom: DesignTokens.spacing.sm, // 8px
      marginTop: DesignTokens.spacing.md, // 16px
    },
    // Subtitle
    subtitle: {
      fontSize: DesignTokens.typography.scale.body.xl.desktop, // 20px
      color: DesignTokens.colors.mutedForeground,
    },
  },

  // Form
  form: {
    background: DesignTokens.colors.card,
    borderRadius: DesignTokens.borderRadius.card, // 16px
    border: '1px solid ' + DesignTokens.colors.border,
    padding: DesignTokens.spacing.xl, // 32px
    marginBottom: DesignTokens.spacing.xl, // 32px
    // Field
    field: {
      marginBottom: DesignTokens.spacing.lg, // 24px
      // Label
      label: {
        display: 'block',
        fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
        fontWeight: DesignTokens.typography.fontWeights.medium,
        color: DesignTokens.colors.foreground,
        marginBottom: DesignTokens.spacing.xs, // 4px
      },
      // Input
      input: {
        width: '100%',
        padding: DesignTokens.spacing.md, // 16px
        borderRadius: DesignTokens.borderRadius.input, // 12px
        border: '1px solid ' + DesignTokens.colors.input,
        background: DesignTokens.colors.background,
        fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
        transition: `border-color ${DesignTokens.animation.duration.fast}ms, box-shadow ${DesignTokens.animation.duration.fast}ms`,
        // States
        focus: {
          borderColor: DesignTokens.colors.ring,
          boxShadow: DesignTokens.shadows.web.primarySm,
          outline: 'none',
        },
        error: {
          borderColor: DesignTokens.colors.destructive,
        },
      },
      // Helper Text
      helperText: {
        fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
        color: DesignTokens.colors.mutedForeground,
        marginTop: DesignTokens.spacing.xs, // 4px
      },
      // Error Text
      errorText: {
        fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
        color: DesignTokens.colors.destructive,
        marginTop: DesignTokens.spacing.xs, // 4px
      },
      // Select
      select: {
        width: '100%',
        padding: DesignTokens.spacing.md, // 16px
        borderRadius: DesignTokens.borderRadius.input, // 12px
        border: '1px solid ' + DesignTokens.colors.input,
        background: DesignTokens.colors.background,
        fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
        cursor: 'pointer',
        // States
        focus: {
          borderColor: DesignTokens.colors.ring,
          boxShadow: DesignTokens.shadows.web.primarySm,
          outline: 'none',
        },
      },
      // Checkbox
      checkbox: {
        display: 'flex',
        alignItems: 'center',
        gap: DesignTokens.spacing.sm, // 8px
        marginBottom: DesignTokens.spacing.xs, // 4px
        // Input
        input: {
          width: DesignTokens.componentSizes.icon.md, // 20px
          height: DesignTokens.componentSizes.icon.md, // 20px
          borderRadius: DesignTokens.borderRadius.xs, // 4px
          border: '1px solid ' + DesignTokens.colors.border,
          appearance: 'none',
          cursor: 'pointer',
          transition: `background ${DesignTokens.animation.duration.fast}ms, border-color ${DesignTokens.animation.duration.fast}ms`,
          // States
          checked: {
            background: DesignTokens.colors.primary,
            borderColor: DesignTokens.colors.primary,
          },
          focus: {
            outline: `2px solid ${DesignTokens.colors.ring}`,
            outlineOffset: 2,
          },
        },
        // Label
        label: {
          fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
          color: DesignTokens.colors.foreground,
          cursor: 'pointer',
        },
      },
      // Radio Group
      radioGroup: {
        display: 'flex',
        gap: DesignTokens.spacing.lg, // 24px
        marginBottom: DesignTokens.spacing.xs, // 4px
        // Radio
        radio: {
          display: 'flex',
          alignItems: 'center',
          gap: DesignTokens.spacing.sm, // 8px
          // Input
          input: {
            width: DesignTokens.componentSizes.icon.md, // 20px
            height: DesignTokens.componentSizes.icon.md, // 20px
            borderRadius: DesignTokens.borderRadius.full,
            border: '1px solid ' + DesignTokens.colors.border,
            appearance: 'none',
            cursor: 'pointer',
            transition: `background ${DesignTokens.animation.duration.fast}ms, border-color ${DesignTokens.animation.duration.fast}ms`,
            // States
            checked: {
              background: DesignTokens.colors.primary,
              borderColor: DesignTokens.colors.primary,
            },
          },
          // Label
          label: {
            fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
            color: DesignTokens.colors.foreground,
            cursor: 'pointer',
          },
        },
      },
      // Slider
      slider: {
        width: '100%',
        height: 6,
        borderRadius: DesignTokens.borderRadius.full,
        background: DesignTokens.colors.muted,
        outline: 'none',
        margin: `${DesignTokens.spacing.md}px 0`, // 16px
        // Thumb
        thumb: {
          width: DesignTokens.componentSizes.icon.lg, // 24px
          height: DesignTokens.componentSizes.icon.lg, // 24px
          borderRadius: DesignTokens.borderRadius.full,
          background: DesignTokens.colors.primary,
          cursor: 'pointer',
          transition: `transform ${DesignTokens.animation.duration.fast}ms`,
          // States
          hover: {
            transform: 'scale(1.1)',
          },
          active: {
            transform: 'scale(1.2)',
          },
        },
        // Value Display
        valueDisplay: {
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
          color: DesignTokens.colors.mutedForeground,
          marginTop: DesignTokens.spacing.xs, // 4px
        },
      },
    },
  },

  // Results
  results: {
    background: DesignTokens.colors.card,
    borderRadius: DesignTokens.borderRadius.card, // 16px
    border: '1px solid ' + DesignTokens.colors.border,
    padding: DesignTokens.spacing.xl, // 32px
    // Header
    header: {
      marginBottom: DesignTokens.spacing.xl, // 32px
      // Title
      title: {
        fontSize: DesignTokens.typography.scale.heading.h2.desktop, // 36px
        fontWeight: DesignTokens.typography.fontWeights.bold,
        marginBottom: DesignTokens.spacing.sm, // 8px
      },
      // Subtitle
      subtitle: {
        fontSize: DesignTokens.typography.scale.body.lg.desktop, // 18px
        color: DesignTokens.colors.mutedForeground,
      },
    },
    // Result Grid
    resultGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: DesignTokens.spacing.lg, // 24px
      // Result Card
      resultCard: {
        padding: DesignTokens.componentSizes.card.md, // 20px
        borderRadius: DesignTokens.borderRadius.md, // 12px
        background: DesignTokens.colors.background,
        // Label
        label: {
          fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
          color: DesignTokens.colors.mutedForeground,
          marginBottom: DesignTokens.spacing.xs, // 4px
        },
        // Value
        value: {
          fontSize: DesignTokens.typography.scale.numeric.md.desktop, // 28px
          fontWeight: DesignTokens.typography.fontWeights.bold,
          color: DesignTokens.colors.foreground,
        },
      },
    },
    // Chart
    chart: {
      height: 320,
      marginTop: DesignTokens.spacing.xl, // 32px
      padding: DesignTokens.spacing.md, // 16px
      borderRadius: DesignTokens.borderRadius.md, // 12px
      background: DesignTokens.colors.background,
    },
    // Summary
    summary: {
      marginTop: DesignTokens.spacing.xl, // 32px
      paddingTop: DesignTokens.spacing.xl, // 32px
      borderTop: '1px solid ' + DesignTokens.colors.border,
      // Title
      title: {
        fontSize: DesignTokens.typography.scale.heading.h3.desktop, // 24px
        fontWeight: DesignTokens.typography.fontWeights.semibold,
        marginBottom: DesignTokens.spacing.md, // 16px
      },
      // List
      list: {
        display: 'flex',
        flexDirection: 'column',
        gap: DesignTokens.spacing.sm, // 8px
        // Item
        item: {
          display: 'flex',
          alignItems: 'flex-start',
          gap: DesignTokens.spacing.sm, // 8px
          // Icon
          icon: {
            size: DesignTokens.componentSizes.icon.sm, // 16px
            marginTop: 2,
            color: DesignTokens.colors.primary,
          },
          // Text
          text: {
            fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
            color: DesignTokens.colors.foreground,
          },
        },
      },
    },
  },

  // Actions
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: DesignTokens.spacing.md, // 16px
    marginTop: DesignTokens.spacing.xl, // 32px
    paddingTop: DesignTokens.spacing.xl, // 32px
    borderTop: '1px solid ' + DesignTokens.colors.border,
  },
}
```

### 6. Onboarding Page (`app/onboarding/page.tsx`)
```typescript
const OnboardingLayout = {
  // Container
  container: {
    maxWidth: DesignTokens.layout.maxWidth.md, // 768px
    margin: '0 auto',
    padding: `${DesignTokens.spacing.section.desktop}px 0`, // 64px
  },

  // Stepper
  stepper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: DesignTokens.spacing.xl, // 32px
    // Step
    step: {
      display: 'flex',
      alignItems: 'center',
      gap: DesignTokens.spacing.sm, // 8px
      // Dot
      dot: {
        width: DesignTokens.componentSizes.icon.sm, // 16px
        height: DesignTokens.componentSizes.icon.sm, // 16px
        borderRadius: DesignTokens.borderRadius.full,
        background: DesignTokens.colors.muted,
        transition: `background ${DesignTokens.animation.duration.normal}ms`,
        // States
        active: {
          background: DesignTokens.colors.primary,
        },
        completed: {
          background: DesignTokens.colors.success,
        },
      },
      // Line
      line: {
        width: 40,
        height: 2,
        background: DesignTokens.colors.border,
        marginBottom: DesignTokens.spacing.md, // 16px
      },
      // Label
      label: {
        fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
        color: DesignTokens.colors.mutedForeground,
      },
    },
  },

  // Step Content
  stepContent: {
    // Header
    header: {
      textAlign: 'center',
      marginBottom: DesignTokens.spacing.xl, // 32px
      // Title
      title: {
        fontSize: DesignTokens.typography.scale.heading.h1.desktop, // 48px
        fontWeight: DesignTokens.typography.fontWeights.bold,
        marginBottom: DesignTokens.spacing.sm, // 8px
      },
      // Subtitle
      subtitle: {
        fontSize: DesignTokens.typography.scale.body.xl.desktop, // 20px
        color: DesignTokens.colors.mutedForeground,
      },
    },
    // Form
    form: {
      background: DesignTokens.colors.card,
      borderRadius: DesignTokens.borderRadius.card, // 16px
      border: '1px solid ' + DesignTokens.colors.border,
      padding: DesignTokens.spacing.xl, // 32px
      marginBottom: DesignTokens.spacing.xl, // 32px
      // Field (same as CalculatorFormLayout.field)
    },
    // Progress
    progress: {
      marginBottom: DesignTokens.spacing.xl, // 32px
      // Bar
      bar: {
        height: 6,
        borderRadius: DesignTokens.borderRadius.full,
        background: DesignTokens.colors.muted,
        overflow: 'hidden',
        // Fill
        fill: {
          height: '100%',
          borderRadius: DesignTokens.borderRadius.full,
          background: DesignTokens.colors.primary,
          transition: `width ${DesignTokens.animation.duration.slow}ms ${DesignTokens.animation.easing.easeOut}`,
        },
      },
      // Percentage
      percentage: {
        fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
        color: DesignTokens.colors.mutedForeground,
        marginTop: DesignTokens.spacing.xs, // 4px
        textAlign: 'right',
      },
    },
  },

  // Actions
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: DesignTokens.spacing.md, // 16px
    marginTop: DesignTokens.spacing.xl, // 32px
    // Previous Button
    previousButton: {
      variant: 'outline',
    },
    // Next Button
    nextButton: {
      variant: 'primary',
    },
    // Submit Button
    submitButton: {
      variant: 'primary',
    },
  },

  // Success
  success: {
    textAlign: 'center',
    padding: DesignTokens.spacing.xl, // 32px
    // Icon
    icon: {
      size: DesignTokens.componentSizes.icon['3xl'], // 40px
      marginBottom: DesignTokens.spacing.md, // 16px
      color: DesignTokens.colors.success,
    },
    // Title
    title: {
      fontSize: DesignTokens.typography.scale.heading.h2.desktop, // 36px
      fontWeight: DesignTokens.typography.fontWeights.bold,
      marginBottom: DesignTokens.spacing.sm, // 8px
    },
    // Subtitle
    subtitle: {
      fontSize: DesignTokens.typography.scale.body.xl.desktop, // 20px
      color: DesignTokens.colors.mutedForeground,
      marginBottom: DesignTokens.spacing.xl, // 32px
    },
    // Button
    button: {
      size: 'lg',
      variant: 'primary',
    },
  },
}
```

### 7. Authentication Pages (`app/auth/login/page.tsx`, `app/auth/signup/page.tsx`)
```typescript
const AuthLayout = {
  // Container
  container: {
    display: 'grid',
    gridTemplateColumns: {
      mobile: '1fr',
      tablet: '1fr 1fr',
    },
    minHeight: '100vh',
  },

  // Left Side (Form)
  leftSide: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: DesignTokens.spacing.section.desktop, // 64px
    // Content
    content: {
      maxWidth: DesignTokens.layout.maxWidth.sm, // 480px
      margin: '0 auto',
      width: '100%',
      // Logo
      logo: {
        marginBottom: DesignTokens.spacing.xl, // 32px
        // Image
        image: {
          width: 64,
          height: 64,
          marginBottom: DesignTokens.spacing.md, // 16px
        },
        // Title
        title: {
          fontSize: DesignTokens.typography.scale.heading.h2.desktop, // 36px
          fontWeight: DesignTokens.typography.fontWeights.bold,
        },
      },
      // Header
      header: {
        marginBottom: DesignTokens.spacing.xl, // 32px
        // Title
        title: {
          fontSize: DesignTokens.typography.scale.heading.h1.desktop, // 48px
          fontWeight: DesignTokens.typography.fontWeights.bold,
          marginBottom: DesignTokens.spacing.sm, // 8px
        },
        // Subtitle
        subtitle: {
          fontSize: DesignTokens.typography.scale.body.lg.desktop, // 18px
          color: DesignTokens.colors.mutedForeground,
        },
      },
      // Form
      form: {
        // Field (same as CalculatorFormLayout.field)
      },
      // Divider
      divider: {
        display: 'flex',
        alignItems: 'center',
        margin: `${DesignTokens.spacing.xl}px 0`, // 32px
        // Line
        line: {
          flex: 1,
          height: 1,
          background: DesignTokens.colors.border,
        },
        // Text
        text: {
          fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
          color: DesignTokens.colors.mutedForeground,
          padding: `0 ${DesignTokens.spacing.md}px`, // 16px
        },
      },
      // Social Buttons
      socialButtons: {
        display: 'flex',
        gap: DesignTokens.spacing.md, // 16px
        marginBottom: DesignTokens.spacing.lg, // 24px
        // Button
        button: {
          flex: 1,
          padding: DesignTokens.spacing.md, // 16px
          borderRadius: DesignTokens.borderRadius.md, // 12px
          border: '1px solid ' + DesignTokens.colors.border,
          background: DesignTokens.colors.card,
          fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
          fontWeight: DesignTokens.typography.fontWeights.medium,
          color: DesignTokens.colors.foreground,
          cursor: 'pointer',
          transition: `background ${DesignTokens.animation.duration.fast}ms`,
          // States
          hover: {
            background: DesignTokens.colors.muted,
          },
          // Icon
          icon: {
            size: DesignTokens.componentSizes.icon.md, // 20px
            marginRight: DesignTokens.spacing.sm, // 8px
          },
        },
      },
      // Footer
      footer: {
        textAlign: 'center',
        marginTop: DesignTokens.spacing.xl, // 32px
        // Text
        text: {
          fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
          color: DesignTokens.colors.mutedForeground,
          marginBottom: DesignTokens.spacing.sm, // 8px
        },
        // Link
        link: {
          fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
          color: DesignTokens.colors.primary,
          fontWeight: DesignTokens.typography.fontWeights.medium,
          textDecoration: 'none',
          cursor: 'pointer',
          transition: `color ${DesignTokens.animation.duration.fast}ms`,
          // States
          hover: {
            color: DesignTokens.colors.primary,
            opacity: 0.8,
            textDecoration: 'underline',
          },
        },
      },
    },
  },

  // Right Side (Image)
  rightSide: {
    display: 'none', // Hidden on mobile
    // Show on tablet and above
    tablet: {
      display: 'block',
      background: DesignTokens.colors.primary,
      padding: DesignTokens.spacing.xl, // 32px
      // Content
      content: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: DesignTokens.colors.primaryForeground,
        textAlign: 'center',
        // Image
        image: {
          maxWidth: '100%',
          height: 'auto',
          marginBottom: DesignTokens.spacing.xl, // 32px
        },
        // Title
        title: {
          fontSize: DesignTokens.typography.scale.heading.h2.desktop, // 36px
          fontWeight: DesignTokens.typography.fontWeights.bold,
          marginBottom: DesignTokens.spacing.md, // 16px
        },
        // Description
        description: {
          fontSize: DesignTokens.typography.scale.body.lg.desktop, // 18px
          opacity: 0.9,
          lineHeight: DesignTokens.typography.lineHeights.relaxed,
        },
      },
    },
  },
}
```

### 8. Settings Page (`app/settings/page.tsx`)
```typescript
const SettingsLayout = {
  // Container
  container: {
    maxWidth: DesignTokens.layout.maxWidth.md, // 768px
    margin: '0 auto',
    padding: `${DesignTokens.spacing.section.desktop}px 0`, // 64px
  },

  // Header
  header: {
    marginBottom: DesignTokens.spacing.xl, // 32px
    // Title
    title: {
      fontSize: DesignTokens.typography.scale.heading.h1.desktop, // 48px
      fontWeight: DesignTokens.typography.fontWeights.bold,
      marginBottom: DesignTokens.spacing.sm, // 8px
    },
    // Subtitle
    subtitle: {
      fontSize: DesignTokens.typography.scale.body.xl.desktop, // 20px
      color: DesignTokens.colors.mutedForeground,
    },
  },

  // Navigation
  navigation: {
    display: 'flex',
    gap: DesignTokens.spacing.md, // 16px
    marginBottom: DesignTokens.spacing.xl, // 32px
    borderBottom: '1px solid ' + DesignTokens.colors.border,
    overflowX: 'auto',
    // Nav Item
    navItem: {
      padding: `${DesignTokens.spacing.md}px ${DesignTokens.spacing.lg}px`, // 16px 24px
      borderBottom: '2px solid transparent',
      fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
      fontWeight: DesignTokens.typography.fontWeights.medium,
      color: DesignTokens.colors.mutedForeground,
      cursor: 'pointer',
      transition: `all ${DesignTokens.animation.duration.fast}ms`,
      whiteSpace: 'nowrap',
      // States
      hover: {
        color: DesignTokens.colors.foreground,
      },
      active: {
        color: DesignTokens.colors.primary,
        borderBottomColor: DesignTokens.colors.primary,
      },
    },
  },

  // Section
  section: {
    marginBottom: DesignTokens.spacing.xl, // 32px
    // Header
    header: {
      marginBottom: DesignTokens.spacing.lg, // 24px
      // Title
      title: {
        fontSize: DesignTokens.typography.scale.heading.h2.desktop, // 36px
        fontWeight: DesignTokens.typography.fontWeights.semibold,
        marginBottom: DesignTokens.spacing.xs, // 4px
      },
      // Description
      description: {
        fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
        color: DesignTokens.colors.mutedForeground,
      },
    },
    // Card
    card: {
      background: DesignTokens.colors.card,
      borderRadius: DesignTokens.borderRadius.card, // 16px
      border: '1px solid ' + DesignTokens.colors.border,
      overflow: 'hidden',
      // Content
      content: {
        padding: DesignTokens.spacing.xl, // 32px
      },
      // List
      list: {
        display: 'flex',
        flexDirection: 'column',
        gap: DesignTokens.spacing.md, // 16px
        // Item
        item: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: DesignTokens.spacing.md, // 16px
          borderRadius: DesignTokens.borderRadius.md, // 12px
          transition: `background ${DesignTokens.animation.duration.fast}ms`,
          cursor: 'pointer',
          // States
          hover: {
            background: DesignTokens.colors.muted,
          },
          // Left
          left: {
            display: 'flex',
            alignItems: 'center',
            gap: DesignTokens.spacing.md, // 16px
            // Icon
            icon: {
              size: DesignTokens.componentSizes.icon.md, // 20px
              color: DesignTokens.colors.primary,
            },
            // Content
            content: {
              // Title
              title: {
                fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
                fontWeight: DesignTokens.typography.fontWeights.medium,
              },
              // Description
              description: {
                fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
                color: DesignTokens.colors.mutedForeground,
              },
            },
          },
          // Right
          right: {
            // Icon
            icon: {
              size: DesignTokens.componentSizes.icon.sm, // 16px
              color: DesignTokens.colors.mutedForeground,
            },
          },
        },
      },
    },
  },

  // Profile Section
  profileSection: {
    // Card
    card: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      padding: DesignTokens.spacing.xl, // 32px
      // Avatar
      avatar: {
        width: DesignTokens.componentSizes.avatar.xl, // 64px
        height: DesignTokens.componentSizes.avatar.xl, // 64px
        borderRadius: DesignTokens.borderRadius.avatar, // 9999px
        marginBottom: DesignTokens.spacing.md, // 16px
        // Image
        image: {
          width: '100%',
          height: '100%',
          borderRadius: DesignTokens.borderRadius.avatar, // 9999px
          objectFit: 'cover',
        },
        // Upload Button
        uploadButton: {
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: DesignTokens.componentSizes.icon.md, // 20px
          height: DesignTokens.componentSizes.icon.md, // 20px
          borderRadius: DesignTokens.borderRadius.full,
          background: DesignTokens.colors.primary,
          color: DesignTokens.colors.primaryForeground,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Icon
          icon: {
            size: DesignTokens.componentSizes.icon.xs, // 12px
          },
        },
      },
      // Name
      name: {
        fontSize: DesignTokens.typography.scale.heading.h3.desktop, // 24px
        fontWeight: DesignTokens.typography.fontWeights.semibold,
        marginBottom: DesignTokens.spacing.xs, // 4px
      },
      // Email
      email: {
        fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
        color: DesignTokens.colors.mutedForeground,
        marginBottom: DesignTokens.spacing.md, // 16px
      },
      // Edit Button
      editButton: {
        variant: 'outline',
        size: 'sm',
      },
    },
  },

  // Form Section
  formSection: {
    // Form
    form: {
      // Field (same as CalculatorFormLayout.field)
    },
  },

  // Danger Zone
  dangerZone: {
    // Card
    card: {
      borderColor: DesignTokens.colors.destructive,
      background: 'rgba(239, 68, 68, 0.05)',
      // Header
      header: {
        marginBottom: DesignTokens.spacing.lg, // 24px
        // Title
        title: {
          color: DesignTokens.colors.destructive,
        },
      },
      // List
      list: {
        // Item
        item: {
          // Title
          title: {
            color: DesignTokens.colors.foreground,
          },
          // Description
          description: {
            color: DesignTokens.colors.mutedForeground,
          },
          // Button
          button: {
            variant: 'destructive',
            size: 'sm',
          },
        },
      },
    },
  },

  // Actions
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: DesignTokens.spacing.md, // 16px
    marginTop: DesignTokens.spacing.xl, // 32px
  },
}
```

### 9. Tax Page (`app/tax/page.tsx`)
```typescript
const TaxLayout = {
  // Container
  container: {
    maxWidth: DesignTokens.layout.maxWidth.xl, // 1280px
    margin: '0 auto',
    padding: `${DesignTokens.spacing.section.desktop}px 0`, // 64px
  },

  // Header
  header: {
    marginBottom: DesignTokens.spacing.xl, // 32px
    // Title
    title: {
      fontSize: DesignTokens.typography.scale.heading.h1.desktop, // 48px
      fontWeight: DesignTokens.typography.fontWeights.bold,
      marginBottom: DesignTokens.spacing.sm, // 8px
    },
    // Subtitle
    subtitle: {
      fontSize: DesignTokens.typography.scale.body.xl.desktop, // 20px
      color: DesignTokens.colors.mutedForeground,
    },
  },

  // Summary
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: DesignTokens.spacing.lg, // 24px
    marginBottom: DesignTokens.spacing.xl, // 32px
    // Summary Card
    summaryCard: {
      padding: DesignTokens.componentSizes.card.lg, // 24px
      borderRadius: DesignTokens.borderRadius.card, // 16px
      background: DesignTokens.colors.card,
      border: '1px solid ' + DesignTokens.colors.border,
      // Header
      header: {
        marginBottom: DesignTokens.spacing.md, // 16px
        // Icon
        icon: {
          size: DesignTokens.componentSizes.icon.xl, // 28px
          marginBottom: DesignTokens.spacing.sm, // 8px
          color: DesignTokens.colors.primary,
        },
        // Title
        title: {
          fontSize: DesignTokens.typography.scale.heading.h4.desktop, // 18px
          fontWeight: DesignTokens.typography.fontWeights.semibold,
          marginBottom: DesignTokens.spacing.xs, // 4px
        },
        // Subtitle
        subtitle: {
          fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
          color: DesignTokens.colors.mutedForeground,
        },
      },
      // Value
      value: {
        fontSize: DesignTokens.typography.scale.numeric.lg.desktop, // 40px
        fontWeight: DesignTokens.typography.fontWeights.bold,
        color: DesignTokens.colors.foreground,
        marginBottom: DesignTokens.spacing.xs, // 4px
      },
      // Label
      label: {
        fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
        color: DesignTokens.colors.mutedForeground,
      },
      // Progress
      progress: {
        marginTop: DesignTokens.spacing.md, // 16px
        // Bar
        bar: {
          height: 8,
          borderRadius: DesignTokens.borderRadius.full,
          background: DesignTokens.colors.muted,
          overflow: 'hidden',
          // Fill
          fill: {
            height: '100%',
            borderRadius: DesignTokens.borderRadius.full,
            background: DesignTokens.colors.primary,
          },
        },
        // Text
        text: {
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: DesignTokens.typography.scale.body.xs.desktop, // 12px
          color: DesignTokens.colors.mutedForeground,
          marginTop: DesignTokens.spacing.xs, // 4px
        },
      },
    },
  },

  // Breakdown
  breakdown: {
    marginBottom: DesignTokens.spacing.xl, // 32px
    // Header
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: DesignTokens.spacing.lg, // 24px
      // Title
      title: {
        fontSize: DesignTokens.typography.scale.heading.h2.desktop, // 36px
        fontWeight: DesignTokens.typography.fontWeights.semibold,
      },
      // Filter
      filter: {
        display: 'flex',
        gap: DesignTokens.spacing.sm, // 8px
      },
    },
    // Chart
    chart: {
      height: 320,
      marginBottom: DesignTokens.spacing.xl, // 32px
      padding: DesignTokens.spacing.md, // 16px
      borderRadius: DesignTokens.borderRadius.card, // 16px
      background: DesignTokens.colors.card,
      border: '1px solid ' + DesignTokens.colors.border,
    },
    // Table
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      // Header Row
      headerRow: {
        background: DesignTokens.colors.muted,
        // Cell
        cell: {
          padding: DesignTokens.spacing.md, // 16px
          textAlign: 'left',
          fontSize: DesignTokens.typography.scale.body.sm.desktop, // 14px
          fontWeight: DesignTokens.typography.fontWeights.medium,
          color: DesignTokens.colors.mutedForeground,
          borderBottom: '1px solid ' + DesignTokens.colors.border,
        },
      },
      // Body Row
      bodyRow: {
        borderBottom: '1px solid ' + DesignTokens.colors.border,
        // Cell
        cell: {
          padding: DesignTokens.spacing.md, // 16px
          fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
          color: DesignTokens.colors.foreground,
        },
      },
    },
  },

  // Actions
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: DesignTokens.spacing.md, // 16px
  },
}
```

---

## 🎯 USER EXPERIENCE GUIDELINES

### 1. Navigation
- **Primary Navigation**: Sidebar with collapsible state
- **Secondary Navigation**: Tabs within pages
- **Breadcrumb**: Show path for nested pages
- **Back Button**: Always available for nested views

### 2. Feedback
- **Loading States**: Show skeleton or spinner
- **Success**: Toast notification with checkmark
- **Error**: Toast notification with error message
- **Empty States**: Show helpful illustration and message

### 3. Micro-interactions
- **Hover**: Lift effect on cards (4px up)
- **Focus**: Ring with primary color
- **Click**: Press effect (0.98 scale)
- **Transitions**: Smooth animations (200-300ms)

### 4. Loading States
```typescript
const Loading = {
  // Skeleton
  skeleton: {
    background: DesignTokens.colors.muted,
    borderRadius: DesignTokens.borderRadius.md, // 12px
    // Text
    text: {
      height: 20,
      marginBottom: DesignTokens.spacing.sm, // 8px
      // Variants
      variants: {
        short: { width: '60%' },
        medium: { width: '80%' },
        long: { width: '100%' },
      },
    },
    // Title
    title: {
      height: 28,
      width: '80%',
      marginBottom: DesignTokens.spacing.md, // 16px
    },
    // Avatar
    avatar: {
      width: 48,
      height: 48,
      borderRadius: DesignTokens.borderRadius.full,
    },
    // Card
    card: {
      height: 200,
    },
  },
  // Spinner
  spinner: {
    width: DesignTokens.componentSizes.icon.lg, // 24px
    height: DesignTokens.componentSizes.icon.lg, // 24px
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: DesignTokens.colors.border,
    borderTopColor: DesignTokens.colors.primary,
    borderRadius: DesignTokens.borderRadius.full,
    animation: `spin ${DesignTokens.animation.duration.slow}ms linear infinite`,
  },
  // Progress Bar
  progressBar: {
    height: 4,
    borderRadius: DesignTokens.borderRadius.full,
    background: DesignTokens.colors.muted,
    overflow: 'hidden',
    // Fill
    fill: {
      height: '100%',
      borderRadius: DesignTokens.borderRadius.full,
      background: DesignTokens.colors.primary,
      transition: `width ${DesignTokens.animation.duration.slow}ms ${DesignTokens.animation.easing.easeOut}`,
    },
  },
}
```

### 5. Empty States
```typescript
const EmptyState = {
  // Container
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignTokens.spacing.xl, // 32px
    textAlign: 'center',
  },
  // Icon
  icon: {
    size: DesignTokens.componentSizes.icon['3xl'], // 40px
    marginBottom: DesignTokens.spacing.md, // 16px
    color: DesignTokens.colors.mutedForeground,
  },
  // Title
  title: {
    fontSize: DesignTokens.typography.scale.heading.h3.desktop, // 24px
    fontWeight: DesignTokens.typography.fontWeights.semibold,
    color: DesignTokens.colors.foreground,
    marginBottom: DesignTokens.spacing.sm, // 8px
  },
  // Description
  description: {
    fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
    color: DesignTokens.colors.mutedForeground,
    maxWidth: DesignTokens.layout.maxWidth.sm, // 480px
    marginBottom: DesignTokens.spacing.xl, // 32px
  },
  // Action
  action: {
    variant: 'primary',
    size: 'md',
  },
}
```

### 6. Toast Notifications
```typescript
const Toast = {
  // Container
  container: {
    position: 'fixed',
    bottom: DesignTokens.spacing.xl, // 32px
    right: DesignTokens.spacing.xl, // 32px
    zIndex: DesignTokens.zIndex.toast, // 800
    maxWidth: DesignTokens.layout.maxWidth.sm, // 480px
    padding: DesignTokens.spacing.md, // 16px
    borderRadius: DesignTokens.borderRadius.md, // 12px
    boxShadow: DesignTokens.shadows.web.xl,
    animation: `slideIn ${DesignTokens.animation.duration.normal}ms ${DesignTokens.animation.easing.easeOut}`,
  },
  // Variants
  variants: {
    success: {
      background: DesignTokens.colors.success,
      color: DesignTokens.colors.destructiveForeground,
      icon: 'check-circle',
    },
    error: {
      background: DesignTokens.colors.destructive,
      color: DesignTokens.colors.destructiveForeground,
      icon: 'x-circle',
    },
    warning: {
      background: DesignTokens.colors.warning,
      color: DesignTokens.colors.foreground,
      icon: 'alert-triangle',
    },
    info: {
      background: DesignTokens.colors.primary,
      color: DesignTokens.colors.primaryForeground,
      icon: 'info',
    },
  },
  // Content
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: DesignTokens.spacing.md, // 16px
    // Icon
    icon: {
      size: DesignTokens.componentSizes.icon.md, // 20px
    },
    // Message
    message: {
      flex: 1,
      fontSize: DesignTokens.typography.scale.body.md.desktop, // 16px
    },
    // Close Button
    closeButton: {
      padding: DesignTokens.spacing.xs, // 4px
      background: 'transparent',
      border: 'none',
      color: 'inherit',
      cursor: 'pointer',
      // Icon
      icon: {
        size: DesignTokens.componentSizes.icon.sm, // 16px
      },
    },
  },
}
```

---

## ♿ ACCESSIBILITY STANDARDS

### 1. Color Contrast
- **Text**: Minimum 4.5:1 ratio for normal text
- **Large Text**: Minimum 3:1 ratio for 18px+ bold or 24px+ regular
- **UI Components**: Minimum 3:1 ratio for interactive elements

### 2. Keyboard Navigation
- **Focus Indicators**: Visible focus ring (2px, primary color)
- **Tab Order**: Logical order matching visual layout
- **Skip Links**: Allow skipping to main content
- **Escape**: Close modals/dialogs with Escape key

### 3. Screen Readers
- **ARIA Labels**: All interactive elements have proper labels
- **Semantic HTML**: Use proper heading hierarchy
- **Alt Text**: All images have descriptive alt text
- **Live Regions**: Announce dynamic content changes

### 4. Touch Targets
- **Minimum Size**: 44x44px for iOS, 48x48px for Android
- **Spacing**: Adequate space between interactive elements

### 5. Reduce Motion
```typescript
const ReducedMotion = {
  // Media Query
  mediaQuery: '@media (prefers-reduced-motion: reduce)',
  // Styles
  styles: {
    animation: 'none',
    transition: 'none',
  },
}
```

---

## 📱 RESPONSIVE DESIGN RULES

### 1. Breakpoints
```typescript
const Breakpoints = {
  mobile: `(max-width: ${DesignTokens.breakpoints.tablet - 1}px)`, // < 640px
  tablet: `(min-width: ${DesignTokens.breakpoints.tablet}px) and (max-width: ${DesignTokens.breakpoints.laptop - 1}px)`, // 640-1023px
  laptop: `(min-width: ${DesignTokens.breakpoints.laptop}px) and (max-width: ${DesignTokens.breakpoints.desktop - 1}px)`, // 1024-1279px
  desktop: `(min-width: ${DesignTokens.breakpoints.desktop}px)`, // >= 1280px
}
```

### 2. Adaptive Layouts
- **Mobile**: Single column, stacked elements
- **Tablet**: Two columns for some sections
- **Desktop**: Full multi-column layouts

### 3. Touch vs Desktop
```typescript
// Touch-specific styles
const TouchStyles = {
  // Larger touch targets
  touchTarget: {
    minHeight: DesignTokens.componentSizes.touchTarget.minimum, // 44px
    minWidth: DesignTokens.componentSizes.touchTarget.minimum, // 44px
  },
  // No hover states
  hover: {
    display: 'none',
  },
}

// Desktop-specific styles
const DesktopStyles = {
  // Hover states
  hover: {
    transform: 'translateY(-2px)',
    boxShadow: DesignTokens.shadows.web.md,
  },
  // Tooltips
  tooltip: {
    position: 'absolute',
    background: DesignTokens.colors.foreground,
    color: DesignTokens.colors.background,
    padding: `${DesignTokens.spacing.xs}px ${DesignTokens.spacing.sm}px`, // 4px 8px
    borderRadius: DesignTokens.borderRadius.xs, // 4px
    fontSize: DesignTokens.typography.scale.body.xs.desktop, // 12px
    whiteSpace: 'nowrap',
  },
}
```

### 4. Responsive Typography
```typescript
const ResponsiveTypography = {
  // Fluid typography using clamp()
  h1: {
    fontSize: `clamp(${DesignTokens.typography.scale.heading.h1.mobile}, 2.5vw, ${DesignTokens.typography.scale.heading.h1.desktop})`,
  },
  h2: {
    fontSize: `clamp(${DesignTokens.typography.scale.heading.h2.mobile}, 2vw, ${DesignTokens.typography.scale.heading.h2.desktop})`,
  },
  body: {
    fontSize: `clamp(${DesignTokens.typography.scale.body.md.mobile}, 1.5vw, ${DesignTokens.typography.scale.body.md.desktop})`,
  },
}
```

---

## 🎨 VISUAL DESIGN RULES

### 1. Color Usage
- **Primary**: Main actions, links, important elements
- **Secondary**: Secondary actions, backgrounds
- **Success**: Confirmation, success messages
- **Warning**: Alerts, warnings
- **Destructive**: Errors, destructive actions
- **Muted**: Borders, dividers, disabled states

### 2. Spacing Hierarchy
- **Section**: 64px between major sections
- **Component**: 24px between components
- **Element**: 16px between related elements
- **Tight**: 8px for compact layouts

### 3. Border Radius Usage
- **Cards**: 16px
- **Inputs/Buttons**: 12px
- **Avatars/Badges**: Full (9999px)
- **Tooltips**: 8px
- **Chips**: 20px

### 4. Shadow Usage
- **Cards**: md (0 4px 6px -1px rgba(0,0,0,0.1))
- **Hover**: lg (0 10px 15px -3px rgba(0,0,0,0.1))
- **Modals**: xl (0 20px 25px -5px rgba(0,0,0,0.1))
- **Focus**: primarySm (0 4px 14px 0 primary/0.2)

---

## 📁 FILE STRUCTURE RECOMMENDATIONS

```
components/
├── layout/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── Footer.tsx
│   └── Container.tsx
├── ui/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Dialog.tsx
│   ├── Toast.tsx
│   ├── Tooltip.tsx
│   ├── Skeleton.tsx
│   └── ...
├── forms/
│   ├── Form.tsx
│   ├── FormField.tsx
│   ├── FormLabel.tsx
│   └── FormError.tsx
├── charts/
│   ├── BarChart.tsx
│   ├── LineChart.tsx
│   ├── PieChart.tsx
│   └── ChartContainer.tsx
├── tables/
│   ├── DataTable.tsx
│   ├── TableCell.tsx
│   ├── TableRow.tsx
│   └── TableHeader.tsx
└── pages/
    ├── Dashboard.tsx
    ├── Analytics.tsx
    ├── Upload.tsx
    ├── Calculator.tsx
    └── ...
```

---

## 🚀 IMPLEMENTATION CHECKLIST

### Phase 1: Foundation
- [ ] Set up design tokens in CSS variables
- [ ] Create base styles (reset, typography, colors)
- [ ] Implement responsive grid system
- [ ] Create component library structure

### Phase 2: Core Components
- [ ] Button component with all variants
- [ ] Input and Form components
- [ ] Card component
- [ ] Dialog/Modal component
- [ ] Toast notification component
- [ ] Loading states (Skeleton, Spinner)
- [ ] Empty state component

### Phase 3: Layout Components
- [ ] Header component
- [ ] Sidebar component
- [ ] Footer component
- [ ] Page container component
- [ ] Responsive navigation

### Phase 4: Page Implementation
- [ ] Dashboard page
- [ ] Analytics page
- [ ] Upload page
- [ ] AI Chat page
- [ ] Calculators page
- [ ] Onboarding page
- [ ] Authentication pages
- [ ] Settings page
- [ ] Tax page

### Phase 5: Polish
- [ ] Add animations and transitions
- [ ] Implement dark mode
- [ ] Add accessibility features
- [ ] Optimize performance
- [ ] Test on all devices

---

## ✨ BEST PRACTICES

### 1. Performance
- Use CSS Grid and Flexbox for layouts
- Minimize DOM depth
- Use efficient selectors
- Lazy load non-critical resources
- Optimize images and assets

### 2. Maintainability
- Follow BEM naming convention
- Use semantic class names
- Document component props
- Keep styles co-located with components
- Use consistent naming conventions

### 3. Consistency
- Reuse existing components
- Follow design system tokens
- Maintain consistent spacing
- Use typography hierarchy
- Keep color usage consistent

### 4. User Experience
- Provide clear feedback
- Minimize cognitive load
- Use familiar patterns
- Ensure accessibility
- Test with real users

---

## 📚 RESOURCES

### Design Inspiration
- [Material Design](https://material.io/design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Atlassian Design System](https://atlassian.design/)
- [Shopify Polaris](https://polaris.shopify.com/)
- [Carbon Design System](https://carbondesignsystem.com/)

### Tools
- [Figma](https://www.figma.com/) - Design and prototyping
- [Storybook](https://storybook.js.org/) - Component documentation
- [Chroma](https://www.chroma.com/) - Color accessibility checker
- [Axe](https://www.deque.com/axe/) - Accessibility testing
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/) - Performance auditing

### Libraries
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Radix UI](https://www.radix-ui.com/) - Accessible primitives
- [Recharts](https://recharts.org/) - Charting library
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [React Hook Form](https://react-hook-form.com/) - Form handling

---

## 🎯 FINAL NOTES

This comprehensive UI/UX design guide provides:
1. **Consistent Design Language**: Unified approach across all pages
2. **Industry Standards**: Follows best practices from leading design systems
3. **Accessibility**: WCAG 2.1 AA compliant
4. **Responsive**: Works on all devices
5. **Maintainable**: Organized structure for easy updates
6. **Professional**: Clean, modern, trustworthy appearance

**Next Steps:**
1. Review and approve this design guide
2. Implement design tokens and base styles
3. Create component library
4. Build pages according to specifications
5. Test and refine based on user feedback

This guide ensures your fintech application has a professional, industry-standard UI/UX that provides an excellent user experience while maintaining consistency and accessibility.