# Professional UI/UX Design Guide
## Industry Standard Design System for Fintech Application

---

## 📋 TABLE OF CONTENTS
1. [Design Philosophy](#-design-philosophy)
2. [Color System](#-color-system)
3. [Typography](#-typography)
4. [Spacing & Layout](#-spacing--layout)
5. [Component Dimensions](#-component-dimensions)
6. [Page Layouts](#-page-layouts)
7. [Responsive Design](#-responsive-design)
8. [Accessibility Standards](#-accessibility-standards)
9. [Interaction Patterns](#-interaction-patterns)
10. [Implementation Checklist](#-implementation-checklist)

---

## 🎨 DESIGN PHILOSOPHY

### Core Principles
- **Clarity First**: Every element must have a clear purpose
- **Consistency**: Unified experience across all pages
- **Accessibility**: WCAG 2.1 AA compliance minimum
- **Performance**: Optimized for fast loading and smooth interactions
- **Modern Aesthetics**: Clean, professional fintech appearance

### Design Tokens Strategy
- 8px base grid system
- Fluid typography with responsive scaling
- OKLCH color space for better color consistency
- Elevation-based shadow system

---

## 🎨 COLOR SYSTEM

### Primary Palette
```css
/* Primary Brand Colors */
--primary-500: oklch(0.45 0.24 260)  /* Main brand color */
--primary-600: oklch(0.40 0.22 260)  /* Darker variant */
--primary-400: oklch(0.50 0.26 260)  /* Lighter variant */
--primary-300: oklch(0.55 0.28 260)  /* Lightest variant */

/* Semantic Colors */
--success: oklch(0.65 0.20 142)     /* Green - Success states */
--warning: oklch(0.77 0.18 70)      /* Orange - Warning states */
--error: oklch(0.58 0.24 27)        /* Red - Error states */
--info: oklch(0.55 0.18 210)        /* Blue - Info states */
```

### Surface Colors
```css
/* Light Mode */
--surface-primary: oklch(1 0 0)       /* Pure white */
--surface-secondary: oklch(0.98 0.01 30)
--surface-tertiary: oklch(0.96 0.01 30)

/* Dark Mode */
--surface-primary-dark: oklch(0.16 0.02 30)
--surface-secondary-dark: oklch(0.20 0.02 30)
--surface-tertiary-dark: oklch(0.24 0.02 30)
```

### Usage Guidelines
- **Primary Actions**: Use --primary-500 for buttons, links
- **Secondary Actions**: Use --secondary-500 for less important actions
- **Success States**: Green for completed actions, positive balance
- **Warning States**: Orange for attention-required items
- **Error States**: Red for errors, destructive actions
- **Neutral Backgrounds**: Use surface colors for cards, containers

---

## 📝 TYPOGRAPHY

### Font Families
```css
--font-sans: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
--font-mono: 'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace
--font-numeric: 'Roboto Mono', 'JetBrains Mono', monospace
```

### Type Scale (Fluid Responsive)

#### Display (Hero/Title)
```css
--text-display-xl: clamp(2.5rem, 5vw, 4.5rem)  /* 40px → 72px */
--text-display-lg: clamp(2rem, 4vw, 3.5rem)    /* 32px → 56px */
--text-display-md: clamp(1.75rem, 3.5vw, 3rem) /* 28px → 48px */
--text-display-sm: clamp(1.5rem, 3vw, 2.25rem)  /* 24px → 36px */
```

#### Headings
```css
--text-h1: clamp(1.75rem, 3vw, 2.5rem)    /* 28px → 40px */
--text-h2: clamp(1.5rem, 2.5vw, 2rem)     /* 24px → 32px */
--text-h3: clamp(1.25rem, 2vw, 1.5rem)    /* 20px → 24px */
--text-h4: clamp(1.125rem, 1.8vw, 1.25rem) /* 18px → 20px */
--text-h5: clamp(1rem, 1.5vw, 1.125rem)   /* 16px → 18px */
--text-h6: clamp(0.875rem, 1.2vw, 1rem)   /* 14px → 16px */
```

#### Body
```css
--text-body-xl: clamp(1.125rem, 1vw, 1.25rem) /* 18px → 20px */
--text-body-lg: clamp(1rem, 0.8vw, 1.125rem)  /* 16px → 18px */
--text-body-md: clamp(0.875rem, 0.6vw, 1rem) /* 14px → 16px */
--text-body-sm: clamp(0.8125rem, 0.5vw, 0.875rem) /* 13px → 14px */
--text-body-xs: clamp(0.75rem, 0.4vw, 0.8125rem) /* 12px → 13px */
```

#### Numeric (For financial data)
```css
--text-numeric-xl: clamp(2rem, 3.5vw, 2.5rem)   /* 32px → 40px */
--text-numeric-lg: clamp(1.5rem, 2.5vw, 1.75rem) /* 24px → 28px */
--text-numeric-md: clamp(1.25rem, 2vw, 1.5rem)  /* 20px → 24px */
--text-numeric-sm: clamp(1rem, 1.5vw, 1.125rem) /* 16px → 18px */
```

### Font Weights
```css
--font-light: 300
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
--font-extrabold: 800
```

### Line Heights
```css
--leading-tight: 1.1
--leading-snug: 1.25
--leading-normal: 1.5
--leading-relaxed: 1.625
--leading-loose: 2
```

### Letter Spacing
```css
--tracking-tighter: -0.05em
--tracking-tight: -0.025em
--tracking-normal: 0
--tracking-wide: 0.025em
--tracking-wider: 0.05em
--tracking-widest: 0.1em
```

---

## 📏 SPACING & LAYOUT

### Base Grid: 8px System
```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-7: 1.75rem;  /* 28px */
  --space-8: 2rem;     /* 32px */
  --space-9: 2.25rem;  /* 36px */
  --space-10: 2.5rem;  /* 40px */
  --space-11: 2.75rem; /* 44px */
  --space-12: 3rem;    /* 48px */
  --space-14: 3.5rem;  /* 56px */
  --space-16: 4rem;    /* 64px */
  --space-20: 5rem;    /* 80px */
  --space-24: 6rem;    /* 96px */
}
```

### Layout Containers
```css
/* Mobile: 20px padding */
--container-mobile: 1.25rem /* 20px */

/* Tablet: 24px padding */
--container-tablet: 1.5rem /* 24px */

/* Desktop: 32px padding */
--container-desktop: 2rem /* 32px */

/* Wide: 48px padding */
--container-wide: 3rem /* 48px */
```

### Section Spacing
```css
/* Vertical rhythm */
--section-gap-mobile: 2rem /* 32px */
--section-gap-tablet: 3rem /* 48px */
--section-gap-desktop: 4rem /* 64px */
```

### Component Spacing
```css
--component-gap-xs: 0.5rem /* 8px */
--component-gap-sm: 0.75rem /* 12px */
--component-gap-md: 1rem /* 16px */
--component-gap-lg: 1.25rem /* 20px */
--component-gap-xl: 1.5rem /* 24px */
```

---

## 🪟 COMPONENT DIMENSIONS

### Buttons
```css
/* Heights */
--button-height-xs: 2rem /* 32px */
--button-height-sm: 2.5rem /* 40px */
--button-height-md: 3rem /* 48px */
--button-height-lg: 3.5rem /* 56px */
--button-height-xl: 4rem /* 64px */

/* Icon Button Sizes */
--button-icon-xs: 2rem /* 32px */
--button-icon-sm: 2.5rem /* 40px */
--button-icon-md: 3rem /* 48px */
--button-icon-lg: 3.5rem /* 56px */

/* Padding */
--button-padding-horizontal-xs: 0.75rem /* 12px */
--button-padding-horizontal-sm: 1rem /* 16px */
--button-padding-horizontal-md: 1.5rem /* 24px */
--button-padding-horizontal-lg: 2rem /* 32px */
--button-padding-horizontal-xl: 2.5rem /* 40px */
```

### Form Inputs
```css
/* Heights */
--input-height-xs: 2.25rem /* 36px */
--input-height-sm: 2.5rem /* 40px */
--input-height-md: 3rem /* 48px */
--input-height-lg: 3.5rem /* 56px */

/* Padding */
--input-padding-vertical-xs: 0.5rem /* 8px */
--input-padding-vertical-sm: 0.75rem /* 12px */
--input-padding-vertical-md: 1rem /* 16px */
--input-padding-vertical-lg: 1.25rem /* 20px */

--input-padding-horizontal: 1rem /* 16px */
```

### Cards
```css
/* Border Radius */
--card-radius-sm: 0.5rem /* 8px */
--card-radius-md: 0.75rem /* 12px */
--card-radius-lg: 1rem /* 16px */
--card-radius-xl: 1.25rem /* 20px */

/* Padding */
--card-padding-xs: 0.75rem /* 12px */
--card-padding-sm: 1rem /* 16px */
--card-padding-md: 1.25rem /* 20px */
--card-padding-lg: 1.5rem /* 24px */
--card-padding-xl: 2rem /* 32px */

/* Shadows */
--card-shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--card-shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
--card-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
--card-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
--card-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)
```

### Avatars
```css
/* Sizes */
--avatar-xs: 1.5rem /* 24px */
--avatar-sm: 2rem /* 32px */
--avatar-md: 2.5rem /* 40px */
--avatar-lg: 3rem /* 48px */
--avatar-xl: 4rem /* 64px */
--avatar-2xl: 5rem /* 80px */
--avatar-3xl: 7.5rem /* 120px */
```

### Icons
```css
/* Sizes */
--icon-xs: 0.75rem /* 12px */
--icon-sm: 1rem /* 16px */
--icon-md: 1.25rem /* 20px */
--icon-lg: 1.5rem /* 24px */
--icon-xl: 1.75rem /* 28px */
--icon-2xl: 2rem /* 32px */
--icon-3xl: 2.5rem /* 40px */
```

### Touch Targets (Mobile-First)
```css
/* Minimum touch target: 44x44px (iOS) */
--touch-minimum: 2.75rem /* 44px */

/* Comfortable touch target: 48x48px */
--touch-comfortable: 3rem /* 48px */

/* Generous touch target: 56x56px */
--touch-generous: 3.5rem /* 56px */
```

---

## 🏗️ PAGE LAYOUTS

### 1. Authentication Pages (Login, Signup, OTP)
```css
Layout Structure:
┌─────────────────────────────────────────────────────────┐
│                    HEADER (Optional)                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│      ┌─────────────────────────────────────────────┐    │
│      │                                             │    │
│      │            AUTH FORM CONTAINER             │    │
│      │    ┌─────────────────────────────────┐     │    │
│      │    │                                     │     │    │
│      │    │   LOGO/ILLUSTRATION (80px-120px)│     │    │
│      │    │                                     │     │    │
│      │    │   TITLE (H1 - 28px-40px)         │     │    │
│      │    │   SUBTITLE (Body LG - 16px-18px) │     │    │
│      │    │                                     │     │    │
│      │    │   FORM FIELDS (48px height)      │     │    │
│      │    │   - Label (14px, Medium)         │     │    │
│      │    │   - Input (48px tall)            │     │    │
│      │    │   - Helper Text (12px-13px)      │     │    │
│      │    │   - Gap: 16px between fields     │     │    │
│      │    │                                     │     │    │
│      │    │   PRIMARY BUTTON (48px-56px)     │     │    │
│      │    │   SECONDARY LINK (14px-16px)      │     │    │
│      │    │                                     │     │    │
│      │    │   DIVIDER (1px line, 16px margin)│     │    │
│      │    │   SOCIAL LOGIN BUTTONS           │     │    │
│      │    └─────────────────────────────────┘     │    │
│      │                                             │    │
│      └─────────────────────────────────────────────┘    │
│                                                         │
│                    FOOTER LINKS (Optional)              │
└─────────────────────────────────────────────────────────┘

Dimensions:
- Container Max Width: 480px (for mobile, full width - 20px padding)
- Form Width: 100% of container
- Illustration Size: 80px-120px (responsive)
- Form Field Height: 48px (56px for touch devices)
- Button Height: 48px (minimum)
- Vertical Gap: 16px between form elements
- Page Padding: 20px (mobile), 24px (tablet+)
```

### 2. Dashboard Layout
```css
Layout Structure:
┌─────────────────────────────────────────────────────────────────┐
│                        HEADER (64px)                            │
│  ┌─────────────┐  ┌──────────────────────────┐  ┌────────────┐ │
│  │ LOGO (32x32)│  │ SEARCH BAR (40px height)  │  │ AVATAR     │ │
│  └─────────────┘  └──────────────────────────┘  └────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │                      │  │                                  │ │
│  │   SIDEBAR (288px)    │  │         MAIN CONTENT            │ │
│  │                      │  │                                  │ │
│  │  ┌────────────────┐  │  │  ┌──────────────────────────┐  │ │
│  │  │ NAV ITEM       │  │  │  │ PAGE HEADER              │  │ │
│  │  │ - Icon (20x20) │  │  │  │ - Title (H1 - 32px)      │  │ │
│  │  │ - Label (14px) │  │  │  │ - Description (16px)     │  │ │
│  │  │ - Height: 44px │  │  │  │ - Actions (Buttons)      │  │ │
│  │  └────────────────┘  │  │  └──────────────────────────┘  │ │
│  │                      │  │                                  │ │
│  │  ┌────────────────┐  │  │  ┌──────────────────────────┐  │ │
│  │  │ ACTIVE NAV ITEM│  │  │  │ CONTENT SECTIONS          │  │ │
│  │  │ - Primary color │  │  │  │ - Cards (16px radius)    │  │ │
│  │  │ - Height: 44px  │  │  │  │ - Gap: 24px between       │  │ │
│  │  └────────────────┘  │  │  │ - Padding: 24px inside    │  │ │
│  │                      │  │  └──────────────────────────┘  │ │
│  │  ┌────────────────┐  │  │                                  │ │
│  │  │ SECTION HEADER │  │  │                                  │ │
│  │  │ (12px, Upper)  │  │  │                                  │ │
│  │  └────────────────┘  │  │                                  │ │
│  │                      │  │                                  │ │
│  └──────────────────────┘  └──────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Dimensions:
- Header Height: 64px (desktop), 56px (mobile)
- Sidebar Width: 288px (default), 200px (compact), 64px (collapsed)
- Main Content Width: Calc(100% - 288px)
- Page Padding: 32px (desktop), 24px (tablet), 20px (mobile)
- Card Radius: 16px
- Card Padding: 24px
- Gap Between Cards: 24px
- Navigation Item Height: 44px (minimum touch target)
```

### 3. Data Dashboard (Analytics, Reports)
```css
Layout Structure:
┌─────────────────────────────────────────────────────────┐
│                    PAGE HEADER                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ TITLE (H1 - 32px-48px)                            │   │
│  │ DESCRIPTION (Body LG - 16px-18px)                 │   │
│  │ ACTIONS (Primary Button + Secondary Button)       │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ FILTERS / CONTROLS                               │   │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │   │
│  │ │ Date Range  │ │ Category    │ │ Search      │ │   │
│  │ │ (40px)      │ │ (40px)      │ │ (40px)      │ │   │
│  │ └─────────────┘ └─────────────┘ └─────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────────┐  │
│  │                      │  │                          │  │
│  │   STATS CARDS        │  │   MAIN CHART             │  │
│  │   (Grid: 1-4 cols)   │  │   (60-70% width)         │  │
│  │                      │  │                          │  │
│  │  ┌────────────┐      │  │  ┌────────────────────┐  │  │
│  │  │ STAT CARD  │      │  │  │ Chart Container     │  │  │
│  │  │ - Value    │      │  │  │ - Height: 300-400px │  │  │
│  │  │   (32px-48px)│     │  │  │ - Padding: 24px     │  │  │
│  │  │ - Label    │      │  │  │ - Radius: 16px      │  │  │
│  │  │   (14px-16px)│     │  │  └────────────────────┘  │  │
│  │  │ - Icon     │      │  │                          │  │
│  │  │   (24x24)  │      │  │                          │  │
│  │  └────────────┘      │  │                          │  │
│  │                      │  │                          │  │
│  └──────────────────────┘  └──────────────────────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ DETAILED TABLE / LIST                            │   │
│  │ ┌─────────────────────────────────────────────┐ │   │
│  │ │ HEADER ROW (14px-16px, Semibold)             │ │   │
│  │ ├─────────────────────────────────────────────┤ │   │
│  │ │ DATA ROWS (14px-16px)                         │ │   │
│  │ │ - Height: 56px per row                       │ │   │
│  │ │ - Padding: 16px horizontal, 12px vertical   │ │   │
│  │ └─────────────────────────────────────────────┘ │   │
│  │ PAGINATION (Below table)                       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘

Dimensions:
- Stats Grid: 1 column (mobile), 2 columns (tablet), 4 columns (desktop)
- Chart Container: 100% width (mobile), 60-70% width (desktop)
- Chart Height: 300px (mobile), 400px (desktop)
- Table Row Height: 56px
- Table Header: 14px-16px, Semibold
- Table Cell: 14px-16px
```

### 4. Form Pages (Onboarding, Settings)
```css
Layout Structure:
┌─────────────────────────────────────────────────────────┐
│                    PAGE HEADER                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ TITLE (H1 - 28px-36px)                            │   │
│  │ DESCRIPTION (Body MD - 14px-16px)                 │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ FORM CONTAINER                                   │   │
│  │ Max Width: 768px (centered)                       │   │
│  │                                                         │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │ FORM SECTION                                 │  │   │
│  │  │ ┌──────────────────────────────────────┐    │  │   │
│  │  │ │ SECTION HEADER (H2 - 20px-24px)      │    │  │   │
│  │  │ │ SECTION DESCRIPTION (14px-16px)      │    │  │   │
│  │  │ └──────────────────────────────────────┘    │  │   │
│  │  │                                              │  │   │
│  │  │ ┌──────────────────────────────────────┐    │  │   │
│  │  │ │ FORM GROUP                             │    │  │   │
│  │  │ │ ┌────────────────────────────────┐   │    │  │   │
│  │  │ │ │ LABEL (14px, Medium)            │   │    │  │   │
│  │  │ │ INPUT (48px height)               │   │    │  │   │
│  │  │ │ HELPER TEXT (12px-13px)          │   │    │  │   │
│  │  │ │ ERROR MESSAGE (12px-13px, Red)   │   │    │  │   │
│  │  │ │                                      │   │    │  │   │
│  │  │ │ Gap between fields: 20px          │   │    │  │   │
│  │  │ │ Gap between groups: 24px          │   │    │  │   │
│  │  │ └────────────────────────────────┘   │    │  │   │
│  │  │                                              │  │   │
│  │  │ ┌──────────────────────────────────────┐    │  │   │
│  │  │ │ ACTION BUTTONS                       │    │  │   │
│  │  │ │ - Primary: 48px-56px height         │    │  │   │
│  │  │ │ - Secondary: 48px-56px height       │    │  │   │
│  │  │ │ - Gap: 12px-16px                    │    │  │   │
│  │  │ └──────────────────────────────────────┘    │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  │                                                         │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘

Dimensions:
- Form Container Max Width: 768px
- Section Gap: 32px (mobile), 48px (desktop)
- Form Group Gap: 24px
- Field Gap: 20px
- Input Height: 48px (56px for touch)
- Label Size: 14px, Medium weight
- Helper/Error Text: 12px-13px
```

### 5. Upload/Processing Pages
```css
Layout Structure:
┌─────────────────────────────────────────────────────────┐
│                    PAGE HEADER                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ TITLE (H1 - 28px-36px)                            │   │
│  │ DESCRIPTION (Body MD - 14px-16px)                 │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ UPLOAD ZONE                                       │   │
│  │ ┌─────────────────────────────────────────────┐ │   │
│  │ │                                                 │ │   │
│  │ │  ┌─────────────────────────────────────┐     │ │   │
│  │ │  │                                     │     │ │   │
│  │ │  │    DRAG & DROP AREA                   │     │ │   │
│  │ │  │    (Min Height: 200px)               │     │ │   │
│  │ │  │                                     │     │ │   │
│  │ │  │    ICON (48x48)                       │     │ │   │
│  │ │  │    TITLE (18px-20px, Bold)           │     │ │   │
│  │ │  │    SUBTITLE (14px-16px, Muted)       │     │ │   │
│  │ │  │                                     │     │ │   │
│  │ │  │    BUTTON (48px height)              │     │ │   │
│  │ │  │    "Select Files"                    │     │ │   │
│  │ │  │                                     │     │ │   │
│  │ │  └─────────────────────────────────────┘     │ │   │
│  │ │                                                 │ │   │
│  │ │    Border: 2px dashed (Primary color)         │ │   │
│  │ │    Radius: 16px                                  │ │   │
│  │ │    Background: Surface Secondary               │ │   │
│  │ └─────────────────────────────────────────────┘ │   │
│  │                                                         │
│  │ FILE LIST (Below upload zone)                       │   │
│  │ ┌─────────────────────────────────────────────┐ │   │
│  │ │ FILE ITEM (56px height)                      │ │   │
│  │ │ - Icon (24x24)                                 │ │   │
│  │ │ - Name (14px-16px)                             │ │   │
│  │ │ - Size (12px-13px, Muted)                     │ │   │
│  │ │ - Status (12px-13px)                          │ │   │
│  │ │ - Actions (Icon buttons)                      │ │   │
│  │ └─────────────────────────────────────────────┘ │   │
│  │                                                         │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ PROCESSING STATUS (When active)                  │   │
│  │ ┌─────────────────────────────────────────────┐ │   │
│  │ │ PROGRESS BAR (4px height)                    │ │   │
│  │ │ STATUS TEXT (14px-16px)                      │ │   │
│  │ │ ESTIMATED TIME (12px-13px, Muted)            │ │   │
│  │ └─────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘

Dimensions:
- Upload Zone Min Height: 200px (mobile), 250px (desktop)
- Upload Zone Border Radius: 16px
- Upload Zone Border: 2px dashed
- File Item Height: 56px
- Progress Bar Height: 4px
```

### 6. Calculator Pages
```css
Layout Structure:
┌─────────────────────────────────────────────────────────┐
│                    PAGE HEADER                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ TITLE (H1 - 28px-36px)                            │   │
│  │ SUBTITLE (Body MD - 14px-16px)                    │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────────────────────────────┐  ┌────────────────┐ │
│  │                                    │                  │ │
│  │   INPUTS SECTION                  │   RESULTS        │ │
│  │   (40-50% width)                  │   (50-60% width) │ │
│  │                                    │                  │ │
│  │  ┌────────────────────────────┐  │  ┌────────────┐ │ │
│  │  │ INPUT GROUP                 │  │  │ RESULT CARD│ │ │
│  │  │ ┌──────────────────────┐   │  │  │            │ │ │
│  │  │ │ LABEL (14px, Medium)  │   │  │  │ TITLE      │ │ │
│  │  │ │ INPUT (48px)          │   │  │  │ (16px-18px)│ │ │
│  │  │ │ SLIDER (Optional)     │   │  │  │            │ │ │
│  │  │ │ VALUE DISPLAY         │   │  │  │ VALUE     │ │ │
│  │  │ │ (24px-32px, Bold)     │   │  │  │ (32px-48px)│ │ │
│  │  │ └──────────────────────┘   │  │  │            │ │ │
│  │  │                              │  │  │ BREAKDOWN  │ │ │
│  │  │ Gap: 20px between inputs    │  │  │ (Optional) │ │ │
│  │  └────────────────────────────┘  │  │  │            │ │ │
│  │                                    │  │  └────────────┘ │ │
│  │  ┌────────────────────────────┐  │  │                  │ │
│  │  │ ACTION BUTTONS               │  │  │ CHART       │ │ │
│  │  │ - Calculate (Primary)       │  │  │ (Optional)  │ │ │
│  │  │ - Reset (Secondary)         │  │  │             │ │ │
│  │  └────────────────────────────┘  │  │             │ │ │
│  │                                    │  │             │ │ │
│  └────────────────────────────────┘  └────────────────┘ │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ DETAILED BREAKDOWN (Optional)                    │   │
│  │ ┌─────────────────────────────────────────────┐ │   │
│  │ │ TABLE / LIST (56px per row)                 │ │   │
│  │ └─────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘

Dimensions:
- Inputs Section: 40-50% width (desktop), 100% (mobile)
- Results Section: 50-60% width (desktop), 100% (mobile)
- Input Height: 48px
- Input Label: 14px, Medium
- Value Display: 24px-32px, Bold
- Result Value: 32px-48px, Bold
- Chart Height: 200px-300px
- Gap Between Inputs: 20px
```

---

## 📱 RESPONSIVE DESIGN

### Breakpoints
```css
/* Mobile-first approach */
:root {
  --breakpoint-mobile: 0px;
  --breakpoint-mobile-sm: 320px;
  --breakpoint-mobile-md: 375px;
  --breakpoint-mobile-lg: 428px;
  --breakpoint-tablet: 640px;
  --breakpoint-laptop: 1024px;
  --breakpoint-desktop: 1280px;
  --breakpoint-wide: 1536px;
}
```

### Media Queries
```css
/* Mobile (Default) */
@media screen { ... }

/* Tablet and up */
@media (min-width: 640px) { ... }

/* Laptop and up */
@media (min-width: 1024px) { ... }

/* Desktop and up */
@media (min-width: 1280px) { ... }

/* Wide screens */
@media (min-width: 1536px) { ... }
```

### Responsive Layout Patterns

#### 1. Stack to Row
```css
/* Mobile: Stacked */
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Desktop: Side by side */
@media (min-width: 1024px) {
  .container {
    flex-direction: row;
    gap: 2rem;
  }
}
```

#### 2. Grid Columns
```css
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1280px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

#### 3. Hide/Show Elements
```css
/* Mobile: Show hamburger, hide desktop nav */
.hamburger { display: block; }
.desktop-nav { display: none; }

@media (min-width: 1024px) {
  .hamburger { display: none; }
  .desktop-nav { display: block; }
}
```

#### 4. Font Size Scaling
```css
.title {
  font-size: clamp(1.5rem, 3vw, 2.5rem);
}
```

#### 5. Container Width
```css
.container {
  width: 100%;
  padding: 0 1.25rem; /* 20px mobile */
  margin: 0 auto;
}

@media (min-width: 640px) {
  .container {
    padding: 0 1.5rem; /* 24px tablet */
    max-width: 640px;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 2rem; /* 32px desktop */
    max-width: 1024px;
  }
}

@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}
```

### Touch vs Desktop Considerations

#### Touch Targets
```css
/* Minimum 44x44px for touch */
.touch-button {
  min-width: 2.75rem; /* 44px */
  min-height: 2.75rem; /* 44px */
}

/* Comfortable 48x48px */
.touch-button-comfortable {
  min-width: 3rem; /* 48px */
  min-height: 3rem; /* 48px */
}
```

#### Hover States
```css
/* Desktop only hover effects */
@media (hover: hover) {
  .button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}
```

#### Focus States
```css
/* Always show focus for keyboard navigation */
.button:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

---

## ♿ ACCESSIBILITY STANDARDS

### WCAG 2.1 AA Compliance

#### Color Contrast
```css
/* Text on light background */
.text-dark {
  color: oklch(0.14 0.02 30); /* 7:1 contrast with white */
}

/* Text on dark background */
.text-light {
  color: oklch(0.985 0.005 30); /* 7:1 contrast with dark */
}

/* Primary text on primary background */
.text-on-primary {
  color: oklch(0.985 0.005 30); /* 7:1 contrast with primary */
}

/* Link contrast */
.link {
  color: oklch(0.45 0.24 260);
  text-decoration: underline;
}

/* Link hover/focus */
.link:hover, .link:focus {
  color: oklch(0.40 0.22 260);
  text-decoration: underline;
}
```

#### Minimum Contrast Ratios
- **Normal Text**: 4.5:1 minimum
- **Large Text (18.66px+)**: 3:1 minimum
- **UI Components**: 3:1 minimum for icons, borders
- **Focus Indicators**: 3:1 minimum

#### Keyboard Navigation
```css
/* Visible focus for all interactive elements */
:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* Skip link for keyboard users */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--primary-500);
  color: white;
  padding: 0.5rem 1rem;
  z-index: 9999;
}

.skip-link:focus {
  top: 0;
}
```

#### Screen Reader Support
```html
<!-- Proper labels for all form inputs -->
<label for="email">Email Address</label>
<input type="email" id="email" aria-describedby="email-help">
<small id="email-help">Enter your email address</small>

<!-- Icon buttons with text alternatives -->
<button aria-label="Search">
  <SearchIcon />
</button>

<!-- Live regions for dynamic content -->
<div aria-live="polite" aria-atomic="true">
  <!-- Dynamic content here -->
</div>

<!-- Semantic HTML -->
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
    <li><a href="/transactions">Transactions</a></li>
  </ul>
</nav>
```

#### Form Accessibility
```html
<!-- Group related form elements -->
<fieldset>
  <legend>Payment Method</legend>
  <input type="radio" id="credit" name="payment" value="credit">
  <label for="credit">Credit Card</label>
  <input type="radio" id="debit" name="payment" value="debit">
  <label for="debit">Debit Card</label>
</fieldset>

<!-- Error messages -->
<input type="text" id="name" aria-invalid="true" aria-describedby="name-error">
<small id="name-error" role="alert">Please enter your name</small>
```

#### Reduced Motion
```css
/* Respect user's reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

#### High Contrast Mode
```css
/* Support Windows High Contrast Mode */
@media (forced-colors: active) {
  .button {
    border: 2px solid ButtonText;
    background: ButtonFace;
    color: ButtonText;
  }

  .button:hover {
    background: Highlight;
    color: HighlightText;
    border-color: Highlight;
  }
}
```

### Accessibility Checklist
- [ ] All images have `alt` text
- [ ] All interactive elements are keyboard accessible
- [ ] All form inputs have associated labels
- [ ] Color is not the only indicator of state
- [ ] Focus indicators are visible
- [ ] Text has sufficient contrast (4.5:1 minimum)
- [ ] Page has a logical heading structure
- [ ] ARIA attributes are used appropriately
- [ ] Error messages are clearly associated with inputs
- [ ] Skip links are provided
- [ ] Language attribute is set on HTML element
- [ ] Video/audio has captions/transcripts

---

## 🎯 INTERACTION PATTERNS

### Button States
```css
.button {
  /* Base state */
  background: var(--primary-500);
  color: var(--primary-foreground);
  border: none;
  border-radius: 12px;
  padding: 0 1.5rem;
  height: 3rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
}

.button:hover {
  /* Hover state */
  background: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.button:active {
  /* Active/pressed state */
  background: var(--primary-700);
  transform: translateY(0);
}

.button:focus-visible {
  /* Focus state */
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

.button:disabled {
  /* Disabled state */
  background: var(--muted);
  color: var(--muted-foreground);
  cursor: not-allowed;
  opacity: 0.6;
}

.button.loading {
  /* Loading state */
  position: relative;
  color: transparent;
}

.button.loading::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1rem;
  height: 1rem;
  margin: -0.5rem 0 0 -0.5rem;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
```

### Input States
```css
.input {
  /* Base state */
  background: var(--surface-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0 1rem;
  height: 3rem;
  font-size: 1rem;
  transition: all 200ms ease;
}

.input:focus {
  /* Focus state */
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.input:hover {
  /* Hover state */
  border-color: var(--border);
}

.input:disabled {
  /* Disabled state */
  background: var(--surface-tertiary);
  color: var(--muted-foreground);
  cursor: not-allowed;
}

.input.error {
  /* Error state */
  border-color: var(--error);
}

.input.success {
  /* Success state */
  border-color: var(--success);
}
```

### Card States
```css
.card {
  /* Base state */
  background: var(--surface-primary);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 200ms ease;
}

.card:hover {
  /* Hover state (for clickable cards) */
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-300);
}

.card:active {
  /* Active state */
  transform: translateY(0);
}

.card.selected {
  /* Selected state */
  border-color: var(--primary-500);
  background: var(--primary-50);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
```

### Loading States
```css
/* Spinner */
.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--border);
  border-top-color: var(--primary-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Skeleton loading */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface-tertiary) 25%,
    var(--surface-secondary) 50%,
    var(--surface-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: skeleton 1.5s infinite;
  border-radius: 4px;
}

/* Progress bar */
.progress-bar {
  height: 0.25rem;
  background: var(--surface-secondary);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--primary-500);
  border-radius: 9999px;
  transition: width 300ms ease;
}
```

### Animation Patterns
```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale in */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Bounce */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Shake */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
```

### Micro-interactions
```css
/* Button ripple effect */
.button {
  position: relative;
  overflow: hidden;
}

.button::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
}

.button:active::after {
  width: 200%;
  height: 200%;
}

/* Input focus ring */
.input {
  position: relative;
}

.input:focus {
  outline: none;
}

.input::after {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid var(--primary-500);
  border-radius: 14px;
  opacity: 0;
  transition: opacity 200ms ease;
}

.input:focus::after {
  opacity: 1;
}

/* Card tilt on hover */
.card {
  transition: transform 300ms ease, box-shadow 300ms ease;
}

.card:hover {
  transform: perspective(1000px) rotateX(2deg) rotateY(2deg);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

/* Checkbox toggle */
.checkbox {
  position: relative;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 200ms ease;
}

.checkbox:checked {
  background: var(--primary-500);
  border-color: var(--primary-500);
}

.checkbox::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 6px;
  width: 3px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  opacity: 0;
  transition: opacity 200ms ease;
}

.checkbox:checked::after {
  opacity: 1;
}
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1: Design System Foundation
- [ ] Create comprehensive CSS variables file
- [ ] Define color palette with OKLCH values
- [ ] Set up typography scale with fluid sizing
- [ ] Implement spacing system (8px base)
- [ ] Create responsive breakpoints
- [ ] Define component dimensions
- [ ] Set up animation and transition patterns

### Phase 2: Base Styles
- [ ] Global CSS reset
- [ ] Base typography styles
- [ ] Form element styling
- [ ] Button variants
- [ ] Card styling
- [ ] Layout containers
- [ ] Utility classes

### Phase 3: Component Library
- [ ] Buttons (Primary, Secondary, Ghost, Icon, etc.)
- [ ] Form inputs (Text, Email, Password, Number, etc.)
- [ ] Select dropdowns
- [ ] Checkboxes and radios
- [ ] Switches
- [ ] Cards
- [ ] Modals and dialogs
- [ ] Tooltips
- [ ] Toasts and notifications
- [ ] Badges and chips
- [ ] Avatars
- [ ] Tabs
- [ ] Accordions
- [ ] Tables
- [ ] Progress indicators

### Phase 4: Page Templates
- [ ] Authentication template (Login, Signup, OTP)
- [ ] Dashboard template
- [ ] Data dashboard template (Analytics, Reports)
- [ ] Form page template (Onboarding, Settings)
- [ ] Upload/processing template
- [ ] Calculator template
- [ ] Profile page template
- [ ] Settings page template

### Phase 5: Responsive Implementation
- [ ] Mobile-first approach
- [ ] Tablet breakpoints
- [ ] Desktop breakpoints
- [ ] Wide screen optimization
- [ ] Touch target sizing
- [ ] Hover vs touch states

### Phase 6: Accessibility
- [ ] Color contrast audit
- [ ] Keyboard navigation testing
- [ ] Screen reader testing
- [ ] Focus management
- [ ] ARIA attributes
- [ ] Reduced motion support
- [ ] High contrast mode support

### Phase 7: Performance
- [ ] CSS optimization (minification, critical CSS)
- [ ] Image optimization
- [ ] Lazy loading
- [ ] Animation performance
- [ ] Font loading strategy

### Phase 8: Testing
- [ ] Cross-browser testing
- [ ] Cross-device testing
- [ ] Accessibility audit
- [ ] Performance audit
- [ ] User testing

---

## 📊 SUCCESS METRICS

### Design Metrics
- **Consistency Score**: 100% component reuse
- **Accessibility Score**: WCAG 2.1 AA compliance
- **Performance Score**: Lighthouse 90+
- **Responsive Coverage**: 100% of breakpoints
- **Color Contrast**: 4.5:1 minimum for all text

### User Experience Metrics
- **Task Completion Rate**: > 95%
- **Error Rate**: < 5%
- **User Satisfaction**: > 4.5/5
- **Time on Task**: < 2 minutes for key flows
- **Bounce Rate**: < 40%

---

## 🛠️ TOOLS & RESOURCES

### Design Tools
- Figma (Design and prototyping)
- Adobe Color (Color palette testing)
- Contrast Checker (Accessibility)
- Browser DevTools (Inspection and debugging)

### Development Tools
- Tailwind CSS (Utility-first CSS)
- PostCSS (CSS processing)
- PurgeCSS (CSS optimization)
- Lighthouse (Performance auditing)
- axe-core (Accessibility testing)

### Testing Tools
- BrowserStack (Cross-browser testing)
- LambdaTest (Cross-device testing)
- NVDA (Screen reader testing)
- VoiceOver (Screen reader testing)
- Chrome DevTools (Accessibility audit)

---

## 📚 REFERENCES

### Industry Standards
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Guidelines](https://material.io/design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [IBM Design Language](https://www.ibm.com/design/language/)
- [AtlasKit (AtlassianDesign)](https://atlassian.design/)

### Color Systems
- [OKLCH Color Picker](https://oklch.com/)
- [Color Contrast Analyzer](https://developer.paciellogroup.com/resources/contrastanalyser/)
- [Adobe Color](https://color.adobe.com/)

### Typography
- [Google Fonts](https://fonts.google.com/)
- [Font Pairings](https://fontpair.co/)
- [Type Scale](https://type-scale.com/)

### Accessibility
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

## 🎓 BEST PRACTICES

### 1. Start with Mobile
- Design mobile-first, then scale up
- Touch targets minimum 44x44px
- Prioritize content and actions

### 2. Use Consistent Spacing
- Stick to 8px base grid
- Use predefined spacing values
- Maintain vertical rhythm

### 3. Limit Color Usage
- Primary color: 60% of UI
- Secondary color: 30% of UI
- Accent color: 10% of UI
- Use semantic colors appropriately

### 4. Typography Hierarchy
- Establish clear hierarchy
- Limit font weights to 3-4
- Use line height appropriately

### 5. Accessibility First
- Check contrast ratios early
- Test keyboard navigation
- Use semantic HTML
- Provide text alternatives

### 6. Performance Matters
- Minimize CSS complexity
- Use efficient selectors
- Optimize animations
- Lazy load non-critical resources

### 7. Test Early and Often
- Test on multiple devices
- Test with different browsers
- Test with assistive technologies
- Conduct user testing

---

**Note**: This guide should be used as a living document. Update it as the design system evolves and new patterns emerge.