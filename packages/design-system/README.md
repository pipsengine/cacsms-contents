# CACSMS Contents Design System

## Mission

Design a world-class Autonomous AI Media Operating System (AMOS) with a premium enterprise experience. The design system is built to support over 30 modules, 500+ pages, and a full enterprise workflow platform.

This design system is:
- Modern, premium, elegant, minimal, enterprise, professional
- Fast, intelligent, AI-first, clean, spacious, data-driven
- Scalable, reusable, pixel-perfect, responsive, accessible, implementation-ready
- Designed for Next.js 16+, React 19+, TypeScript, Tailwind CSS 4, Radix UI, shadcn/ui, TanStack, Framer Motion

## Design Philosophy

The interface must feel like an enterprise operating system, not a dashboard template. It should leverage the best qualities of Microsoft Fluent, Apple HIG, Atlassian, Adobe, Linear, Figma, GitHub Enterprise, Vercel, Notion, and Stripe, while establishing a unique CACSMS visual language.

### Core qualities
- Clarity
- Motion-informed refinement
- Spacious typography and layout
- Intelligent, data-first states
- Strong visual hierarchy
- Layered surfaces and depth
- Precise spacing and consistent rhythm
- Accessible interactions and keyboard-first navigation

## Themes

This design system supports four parallel themes with identical structure:
- Light Theme (Primary)
- Dark Theme (Secondary)
- High Contrast Theme
- Accessibility Theme

Each theme uses the same semantic token names and component contracts.

## Token System

A complete enterprise token system is defined for:
- Colors
- Typography
- Spacing
- Border radius
- Elevation and shadows
- Grid and breakpoints
- Iconography
- Motion duration and easing

All tokens are available as:
- TypeScript exports
- CSS custom properties
- Tailwind-compatible token names
- Figma variables

## Structure

`packages/design-system/`
- `README.md` — design system specification and usage guidance
- `tokens.ts` — enterprise design token definitions
- `theme.ts` — theme objects and CSS variable mapping

## Component System

The design system is intentionally split into:
- Primitive tokens and semantic design tokens
- Core layout primitives: grid, spacing, elevation, surfaces
- UI primitives: button, input, select, switch, tabs, modal, tooltip, badge, chip
- Data display: cards, tables, charts, lists, progress, status
- Navigation: sidebar, top bar, breadcrumbs, tabs, paginated navigation
- Enterprise systems: dashboards, workflows, AI panels, forms, tables, cards, reports

This package is the specification layer. Implementation lives in `packages/ui`, `packages/shared`, and module-specific component libraries.

## Figma and Implementation Readiness

Design assets in Figma should mirror this spec exactly with:
- Auto Layout for responsive content
- Variants for component states
- Constraints for responsive resizing
- Shared color variables and typography styles
- Developer annotations for token mapping, accessibility, and motion

Use this package as the single source of truth for developers and designers.

## Accessibility

All components and themes must meet WCAG AA minimum.

Include support for:
- Keyboard navigation
- Focus ring and focus management
- ARIA labels
- Screen reader semantics
- Touch targets >= 44px
- Reduced motion toggle
- Contrast checks for all text and interactive states

## Responsive Design

Support all form factors:
- Desktop
- Laptop
- Tablet
- Phone
- Ultra-wide
- TV

Responsive breakpoints are tokenized and shared.

## Motion System

Motion is an essential part of system polish:
- Page transitions
- Sidebar expansion/collapse
- Card hover and interactions
- Chart animation
- Dialog and drawer opening
- Skeleton loading
- Toast and notification entrance

Use Framer Motion for animation implementation in React.

## Quality Requirements

Delivery must be:
- Enterprise-ready
- Reusable and composable
- Accessible and responsive
- Fully themeable
- AI-ready and data-driven
- Production-ready with no placeholder styling
- Free of duplicate or inconsistent patterns

---

This design system package is the foundational specification for CACSMS Contents. Every token, theme, and component contract should be usable by AI coding agents to implement pages without additional UI decisions.
