# Kvastram — Header & Navigation Design System
### Claude Code Binding Guide v1.0

> **Scope:** Desktop header · Mega menu · Mobile nav drawer · Responsive behavior  
> **Stack:** Next.js / React · Tailwind CSS · Framer Motion  
> **Fonts:** Cormorant Garamond (display) · DM Sans (UI)  
> **Last updated:** May 2026

---

## 1. Design Philosophy

Kvastram ek handmade Indian fashion brand hai — Jaipur ka craft, editorial feel.  
Header "luxury artisan" aesthetic follow karta hai:

- **Logo center** desktop pe — classic fashion house layout (Hermès, Fabindia style)
- **Serif display font** logo aur mega menu links mein — handcrafted feel
- **Warm parchment palette** — off-white surfaces, not cold white
- **Coral accent** (`#c94e2a`) — only for active states, CTAs, brand moments
- **No drop shadows, no gradients** — flat surfaces only
- **Letter-spacing heavy** on nav — uppercase tracking creates luxury feel

---

## 2. Design Tokens

### 2.1 Colors

```css
:root {
  /* Brand */
  --kv-ink:          #1a1714;   /* Primary text, logo */
  --kv-ink-2:        #3d3a36;   /* Body text, nav links */
  --kv-ink-3:        #7a7570;   /* Muted text, labels */
  --kv-ink-4:        #b5b0a8;   /* Placeholder, disabled */
  --kv-coral:        #c94e2a;   /* Accent — active states, CTAs */
  --kv-coral-dark:   #a03d20;   /* Coral hover */

  /* Surfaces */
  --kv-parchment:    #f7f4ef;   /* Page background */
  --kv-parchment-2:  #ede8e0;   /* Mega menu dividers, sub-nav bg */
  --kv-warm:         #e8e2d9;   /* Subtle hover fills */
  --kv-white:        #ffffff;   /* Header bg, card surfaces */

  /* Borders */
  --kv-border:       #d8d2c8;   /* Default border */
  --kv-border-dark:  #1a1714;   /* Mega menu bottom border (1.5px) */
}
```

### 2.2 Typography

```css
/* Google Fonts import — add to _document.tsx or globals.css */
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

:root {
  --font-display: 'Cormorant Garamond', Georgia, serif;  /* Logo, mega menu links */
  --font-ui:      'DM Sans', system-ui, sans-serif;      /* Nav, pills, CTA, labels */
}
```

### 2.3 Spacing & Radius

```css
:root {
  --kv-radius-sm:  4px;
  --kv-radius-md:  8px;
  --kv-radius-lg:  12px;
  --kv-radius-pill: 999px;
}
```

---

## 3. Component Architecture

```
<SiteHeader>                          ← root component, sticky wrapper
  <PromoBar />                        ← top announcement strip
  <HeaderMain>
    <NavLeft />                       ← desktop left nav links
    <Logo />                          ← center logo
    <ActionsRight />                  ← search, account, cart, locale
  </HeaderMain>
  <SearchBar />                       ← toggle on search icon click
  <MegaMenu />                        ← desktop only, hover-triggered
  <MobileHeader>
    <MobileTopBar />                  ← hamburger + logo + icons
    <CategoryPills />                 ← horizontally scrollable pills
  </MobileHeader>
  <MobileDrawer />                    ← full-screen overlay, left slide
</SiteHeader>
```

---

## 4. PromoBar

### Rules
- **RULE PB-1:** Height exactly `32px`. Never expand.
- **RULE PB-2:** Background `var(--kv-ink)`. Text `var(--kv-ink-4)`.
- **RULE PB-3:** Font: DM Sans, 11px, uppercase, `letter-spacing: 0.12em`, `font-weight: 300`.
- **RULE PB-4:** 3 rotating messages separated by `·` bullet or `|` — max 50 chars each.
- **RULE PB-5:** Dismissible on mobile (X button, right side). State persists in `sessionStorage`.
- **RULE PB-6:** Hidden when header becomes sticky (scroll > 32px).

### Content (current)
```
"Handmade in Jaipur, Rajasthan"  ·  "Free shipping above ₹2,000"  ·  "WhatsApp for custom orders"
```

### Code skeleton
```tsx
export function PromoBar() {
  return (
    <div className="h-8 bg-[#1a1714] flex items-center justify-center px-6">
      <p className="text-[#b5b0a8] text-[11px] uppercase tracking-[0.12em] font-light">
        Handmade in Jaipur
        <span className="mx-5 text-[#3d3a36]">·</span>
        Free shipping above ₹2,000
        <span className="mx-5 text-[#3d3a36]">·</span>
        WhatsApp for custom orders
      </p>
    </div>
  );
}
```

---

## 5. Desktop Header (≥ 769px)

### Layout Rule
**RULE DH-1:** 3-column CSS grid: `1fr auto 1fr`
- Col 1: Nav links (left-aligned)
- Col 2: Logo (center)
- Col 3: Action icons (right-aligned)

```css
.header-main {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: 68px;
  padding: 0 32px;
  background: var(--kv-white);
  border-bottom: 1px solid var(--kv-border);
}
```

### 5.1 Logo

- **RULE L-1:** Font: Cormorant Garamond, 26px, weight 500, uppercase, `letter-spacing: 0.18em`
- **RULE L-2:** Color: `var(--kv-ink)`
- **RULE L-3:** "s" in "Kvastram" — color `var(--kv-coral)`. No other letter gets accent.
- **RULE L-4:** Logo links to `/`
- **RULE L-5:** On mobile: 19px, same tracking

```tsx
export function Logo() {
  return (
    <Link href="/" className="font-display text-[26px] font-medium tracking-[0.18em] uppercase text-[#1a1714]">
      Kva<span className="text-[#c94e2a]">s</span>tram
    </Link>
  );
}
```

### 5.2 Desktop Nav Links

- **RULE DN-1:** Font: DM Sans, 12px, uppercase, `letter-spacing: 0.08em`, weight 400
- **RULE DN-2:** Color: `var(--kv-ink-2)`. Hover: `var(--kv-ink)` + `border-bottom: 1px solid var(--kv-ink-4)`
- **RULE DN-3:** Active/current: `color: var(--kv-coral)` + `border-bottom: 1px solid var(--kv-coral)`
- **RULE DN-4:** Border offset from text: `padding-bottom: 4px`
- **RULE DN-5:** Exactly 4 nav items: `Shop`, `Collections`, `New Arrivals`, `About`
- **RULE DN-6:** `Shop` aur `Collections` ke saath mega menu trigger hota hai (hover)
- **RULE DN-7:** Gap between nav items: `36px`

```tsx
const navItems = [
  { label: 'Shop', href: '/shop', hasMega: true },
  { label: 'Collections', href: '/collections', hasMega: true },
  { label: 'New Arrivals', href: '/new-arrivals' },
  { label: 'About', href: '/about' },
];
```

### 5.3 Action Icons (Right)

Order (left to right): Search · Account · Cart · Divider · Locale toggle

- **RULE AI-1:** Icon size: `20x20px`, stroke `1.4`, no fill
- **RULE AI-2:** Color: `var(--kv-ink-2)`. Hover: `var(--kv-ink)`
- **RULE AI-3:** Cart badge — coral dot, top-right, `14x14px`, white `1.5px` border, `8px` DM Sans text
- **RULE AI-4:** Cart count comes from cart context/store — never hardcode
- **RULE AI-5:** Locale toggle: `EN / ₹` — DM Sans 11px, `var(--kv-ink-3)`, hover `var(--kv-ink-2)`
- **RULE AI-6:** Search icon click → SearchBar toggle (not a new page)
- **RULE AI-7:** Vertical divider before locale: `1px` tall `20px`, color `var(--kv-border)`

---

## 6. SearchBar

- **RULE SB-1:** Hidden by default. Toggle on search icon click.
- **RULE SB-2:** Renders below header main, above mega menu
- **RULE SB-3:** Height `44px`. Background `var(--kv-parchment)`. Border-top `1px var(--kv-border)`.
- **RULE SB-4:** Input: DM Sans 13px, no border, no background, `var(--kv-ink)`, `max-width: 400px`
- **RULE SB-5:** Placeholder: `"Search — sarees, kantha jackets, tote bags..."` color `var(--kv-ink-4)`
- **RULE SB-6:** ESC key closes. Click outside closes.
- **RULE SB-7:** Auto-focus input on open.
- **RULE SB-8:** On mobile — SearchBar becomes full-screen overlay.

---

## 7. Mega Menu

Triggers when hovering `Shop` or `Collections` in desktop nav.

### Rules
- **RULE MM-1:** Opens on hover with `120ms` delay (prevent accidental triggers)
- **RULE MM-2:** Closes on `mouseleave` with `180ms` delay
- **RULE MM-3:** Background: `var(--kv-white)`. Bottom border: `1.5px solid var(--kv-border-dark)` (bold line = editorial anchor)
- **RULE MM-4:** 4 columns, `grid-template-columns: 1.1fr 1fr 1fr 180px`
- **RULE MM-5:** Max 6 links per column (per guide rule CO in KVASTRAM_COMPLETE_GUIDE_V2.md)
- **RULE MM-6:** Column 4 is ALWAYS the featured editorial card — never a link list
- **RULE MM-7:** Column dividers: `1px solid var(--kv-parchment-2)`
- **RULE MM-8:** Mega menu mein `position: absolute`, full width, `z-index: 100`
- **RULE MM-9:** Only active (status='active') collections appear in column 3

### Column structure

```
Col 1 — Clothing          Col 2 — Bags & Home       Col 3 — Collections       Col 4 — Feature Card
─────────────────────     ─────────────────────     ─────────────────────     ─────────────────────
CLOTHING (label)          BAGS & HOME (label)       COLLECTIONS (label)       Dark bg card
Jackets                   Tote Bags                 Kantha Essentials         Italic serif headline
Sarees                    Toiletry Pouches          Festival Ready            Subtle texture overlay
Suits & Kurtas            Clutches                  Gifts Under ₹2,000        "Shop the edit →" CTA
Lehengas                  ─────────────────         Block Print Edit
T-Shirts & Tops           HOME & ACC (label)        New Arrivals ● Live
                          Home Textiles
View all clothing →       Scarves & Wraps           All collections →
                          Accessories
```

### Column label style
```css
.mm-col-label {
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--kv-ink-4);
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--kv-parchment-2);
}
```

### Mega menu link style
```css
.mm-link {
  font-family: var(--font-display);  /* serif — brand moment */
  font-size: 15px;
  font-weight: 400;
  color: var(--kv-ink-2);
  padding: 6px 0;
  transition: color 150ms, padding-left 150ms;
  display: flex;
  align-items: center;
  gap: 10px;
}
.mm-link:hover {
  color: var(--kv-coral);
  padding-left: 4px;  /* subtle nudge right */
}
```

### "New" badge on links
```tsx
{item.isNew && (
  <span className="text-[9px] font-ui font-medium tracking-[0.08em] uppercase text-white bg-[#c94e2a] px-1.5 py-px rounded-sm">
    New
  </span>
)}
```

### Featured card (Col 4)
```tsx
export function MegaFeatureCard({ collection }) {
  return (
    <div className="h-full min-h-[240px] bg-[#1a1714] flex flex-col justify-end p-5 relative cursor-pointer group">
      {/* Subtle diagonal texture */}
      <div className="absolute inset-0 opacity-[0.06]"
           style={{backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 1px,transparent 8px)'}} />
      <p className="font-ui text-[9px] tracking-[0.16em] uppercase text-white/45 mb-2">
        Featured this season
      </p>
      <h3 className="font-display text-[20px] italic font-normal text-white leading-tight mb-3">
        {collection.name}
      </h3>
      <span className="font-ui text-[10px] tracking-[0.12em] uppercase text-white/70 border-b border-white/25 pb-0.5 inline-block group-hover:text-white transition-colors">
        Shop the edit →
      </span>
    </div>
  );
}
```

### Animation (Framer Motion)
```tsx
const megaVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.12 } }
};

<AnimatePresence>
  {isOpen && (
    <motion.div variants={megaVariants} initial="hidden" animate="visible" exit="exit">
      {/* mega menu content */}
    </motion.div>
  )}
</AnimatePresence>
```

---

## 8. Mobile Header (≤ 768px)

### 8.1 Mobile Top Bar

- **RULE MB-1:** Height exactly `54px`. Background `var(--kv-white)`. Border-bottom `1px var(--kv-border)`.
- **RULE MB-2:** 3-item flex row: `[Hamburger] [Logo] [Icons]`
- **RULE MB-3:** Logo: Cormorant 19px, same tracking as desktop (`0.18em`)
- **RULE MB-4:** Hamburger icon — 3 lines (uneven: long, short, long). Color `var(--kv-ink-2)`.
- **RULE MB-5:** When drawer open — hamburger becomes **X** (close icon), color `var(--kv-coral)`
- **RULE MB-6:** Right icons: Search + Cart only (Account hidden on mobile by default)
- **RULE MB-7:** Cart badge same spec as desktop (Rule AI-3)

```tsx
export function MobileTopBar({ isOpen, onToggle }) {
  return (
    <div className="flex items-center justify-between h-[54px] px-4 bg-white border-b border-[#d8d2c8]">
      <button onClick={onToggle} className="w-10 h-10 flex items-center justify-center">
        {isOpen ? <XIcon className="text-[#c94e2a]" /> : <MenuIcon className="text-[#3d3a36]" />}
      </button>
      <Logo />
      <div className="flex gap-4 items-center">
        <SearchIcon />
        <CartIconWithBadge />
      </div>
    </div>
  );
}
```

### 8.2 Category Pills Row

- **RULE CP-1:** Height `44px`. Background `var(--kv-parchment)`. Border-bottom `1px var(--kv-border)`.
- **RULE CP-2:** Horizontally scrollable, no visible scrollbar (`scrollbar-width: none`)
- **RULE CP-3:** `padding: 8px 14px`. `gap: 6px` between pills.
- **RULE CP-4:** Pills always show — even when drawer is open
- **RULE CP-5:** Pill style: DM Sans 11px, `letter-spacing: 0.04em`, border `1px var(--kv-border)`, bg white, color `var(--kv-ink-3)`, `border-radius: 999px`, `padding: 5px 12px`
- **RULE CP-6:** Active pill: bg `var(--kv-ink)`, color white, border `var(--kv-ink)`
- **RULE CP-7:** Pills come from active homepage categories — same order as `sort_order` field
- **RULE CP-8:** First pill is always "New Arrivals" pinned, regardless of sort_order
- **RULE CP-9:** Max 6 pills visible; rest are accessible by scrolling

```tsx
const pills = ['New Arrivals', 'Jackets', 'Sarees', 'Tote Bags', 'Suits & Kurtas', 'Gifts ₹2K'];

export function CategoryPills({ activePill, onSelect }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-none px-3.5 py-2 bg-[#f7f4ef] border-b border-[#d8d2c8]">
      {pills.map(pill => (
        <button
          key={pill}
          onClick={() => onSelect(pill)}
          className={`
            flex-shrink-0 px-3 py-1 rounded-full text-[11px] tracking-[0.04em] border transition-all
            ${activePill === pill
              ? 'bg-[#1a1714] text-white border-[#1a1714]'
              : 'bg-white text-[#7a7570] border-[#d8d2c8] hover:border-[#7a7570]'}
          `}
        >
          {pill}
        </button>
      ))}
    </div>
  );
}
```

---

## 9. Mobile Drawer

### Rules
- **RULE DR-1:** Slides from **left**, full width (`100vw`), full height (`100dvh`)
- **RULE DR-2:** Overlay behind drawer: `rgba(26, 23, 20, 0.5)` — click to close
- **RULE DR-3:** Drawer bg: `var(--kv-white)`
- **RULE DR-4:** Animation: `translateX(-100%) → translateX(0)`, `250ms ease-out`
- **RULE DR-5:** Body scroll locked when drawer open (`overflow: hidden` on `<body>`)
- **RULE DR-6:** Top of drawer = same height as MobileTopBar (54px) — logo area repeats or stays visible

### Nav item style
```css
.mob-nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--kv-ink);
  border-bottom: 1px solid var(--kv-warm);
  cursor: pointer;
}
.mob-nav-item:hover { background: var(--kv-parchment); }
.mob-nav-item.active { color: var(--kv-coral); }
```

### Accordion expand (subcategories)
- **RULE DR-7:** Tap parent item → expands inline, chevron rotates 180°
- **RULE DR-8:** Expanded sub-section bg: `var(--kv-parchment)` — visually nested
- **RULE DR-9:** Sub-item style: Cormorant Garamond 14px (serif for product categories = brand consistency)
- **RULE DR-10:** Sub-item has coral dot (`3x3px`) before text
- **RULE DR-11:** "View all →" link at bottom of sub-section: DM Sans 12px caps, coral color
- **RULE DR-12:** Only one section open at a time (accordion, not multi-expand)

### Section labels inside drawer
```css
.mob-section-label {
  font-family: var(--font-ui);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--kv-ink-4);
  padding: 14px 16px 6px;
}
```

### Drawer structure
```
SHOP (parent, tap to expand)
  ├── [CLOTHING section label]
  ├── • Jackets
  ├── • Sarees
  ├── • Suits & Kurtas
  ├── [BAGS & HOME section label]
  ├── • Tote Bags
  ├── • Home Textiles
  └── View all →

COLLECTIONS (parent, tap to expand)
  ├── • Kantha Essentials
  ├── • Festival Ready
  └── • Gifts Under ₹2,000

NEW ARRIVALS
ABOUT
```

### Bottom CTA bar (always visible in drawer)
- **RULE DR-13:** Fixed to bottom of drawer. Height `56px`. Bg white. Border-top `1px var(--kv-border)`.
- **RULE DR-14:** Two buttons: "Track order" (outline) + "WhatsApp us" (coral fill)
- **RULE DR-15:** Button style: DM Sans 11px, uppercase, `letter-spacing: 0.06em`, `font-weight: 500`
- **RULE DR-16:** "WhatsApp us" links to `https://wa.me/{WHATSAPP_NUMBER}?text=Hi, I need help`

```tsx
<div className="border-t border-[#d8d2c8] p-3 flex gap-2">
  <button className="flex-1 py-2.5 rounded-md text-[11px] font-medium uppercase tracking-[0.06em] border border-[#d8d2c8] text-[#3d3a36]">
    Track order
  </button>
  <button className="flex-1 py-2.5 rounded-md text-[11px] font-medium uppercase tracking-[0.06em] bg-[#c94e2a] text-white border-none">
    WhatsApp us
  </button>
</div>
```

---

## 10. Sticky Behavior

### Rules
- **RULE ST-1:** Header becomes sticky after scroll `> 32px` (PromoBar height)
- **RULE ST-2:** When sticky — PromoBar hides, HeaderMain sticks to top
- **RULE ST-3:** Sticky header gets subtle border-bottom: `1px solid var(--kv-border)` (always present)
- **RULE ST-4:** NO background blur or glass effect — flat white only
- **RULE ST-5:** Sticky transition: `background-color 200ms` (handles transparent → white if needed for hero pages)
- **RULE ST-6:** CSS `position: sticky; top: 0; z-index: 50`
- **RULE ST-7:** On mobile — CategoryPills row also sticks below header (total offset = `54px + 44px = 98px`)

```tsx
// Tailwind sticky header
<header className="sticky top-0 z-50 bg-white border-b border-[#d8d2c8]">
  <HeaderMain />
  <CategoryPills /> {/* mobile only */}
</header>
```

---

## 11. Responsive Breakpoints

```css
/* Mobile first */
/* Default: mobile (< 768px) */

@media (min-width: 769px) {
  /* Tablet / Desktop */
  /* Show: desktop nav, mega menu */
  /* Hide: hamburger, mobile drawer, category pills */
}

@media (min-width: 1280px) {
  /* Wide desktop */
  /* Max content width: 1440px centered */
  /* Header padding: 0 48px */
}
```

### What shows where

| Element              | Mobile (≤768) | Tablet+ (≥769) |
|----------------------|:---:|:---:|
| PromoBar             | ✓ (dismissible) | ✓ |
| Desktop nav (3-col)  | ✗ | ✓ |
| Logo (center)        | ✓ | ✓ |
| Hamburger menu       | ✓ | ✗ |
| Category pills       | ✓ | ✗ |
| Mega menu            | ✗ | ✓ |
| Mobile drawer        | ✓ | ✗ |
| Locale toggle        | ✗ | ✓ |
| Account icon         | ✗ | ✓ |

---

## 12. Accessibility Rules

- **RULE A-1:** All interactive elements — `focus-visible` ring: `2px solid var(--kv-coral)`, `offset: 2px`
- **RULE A-2:** Hamburger button — `aria-label="Open navigation"` / `aria-label="Close navigation"`
- **RULE A-3:** Mega menu — `role="navigation"`, `aria-label="Main navigation"`
- **RULE A-4:** Logo — `aria-label="Kvastram — Home"`
- **RULE A-5:** Cart icon — `aria-label="Cart, {count} items"`
- **RULE A-6:** Category pills — `role="tablist"`, each pill `role="tab"`, `aria-selected`
- **RULE A-7:** Mobile drawer — `aria-modal="true"`, focus trap inside when open
- **RULE A-8:** Drawer overlay — `aria-hidden="true"` (decorative)
- **RULE A-9:** Keyboard: `Tab` navigates, `Escape` closes mega menu and drawer
- **RULE A-10:** Reduce motion: wrap Framer Motion in `useReducedMotion()` check

---

## 13. Data Wiring

### Homepage categories → Pills + Mega menu

```tsx
// Fetch from MCP / API
const { data: homepageCategories } = useSWR('/api/homepage-categories');
// Returns: [{ id, name, link_url, sort_order, is_active }]

// Filter: only is_active === true
// Sort: by sort_order ASC
// Pills: first 6 entries
// Mega col 1 & 2: full category tree from /api/categories
```

### Collections → Mega col 3 + Feature card

```tsx
const { data: collections } = useSWR('/api/collections?status=active&show_in_megamenu=true');
// Max 5 collections in col 3 (+ "View all" link = 6 slots max per Rule MM-5)
// Feature card: collection with highest display_order OR admin-pinned flag
```

### Known data bugs to fix before wiring (from audit)

```
❌ Jackets link_url: "/categories/jacket"  →  fix to: "/categories/jackets"
❌ T-Shirts link_url: "/categories/new-arrivals"  →  fix to: "/categories/t-shirts"
❌ T-Shirts category_id: null  →  assign correct category UUID
```

---

## 14. File Structure

```
src/
├── components/
│   └── header/
│       ├── index.tsx              ← SiteHeader root
│       ├── PromoBar.tsx
│       ├── HeaderMain.tsx
│       ├── Logo.tsx
│       ├── DesktopNav.tsx
│       ├── ActionsRight.tsx
│       ├── SearchBar.tsx
│       ├── MegaMenu/
│       │   ├── index.tsx
│       │   ├── MegaColumn.tsx
│       │   ├── MegaLink.tsx
│       │   └── MegaFeatureCard.tsx
│       ├── mobile/
│       │   ├── MobileTopBar.tsx
│       │   ├── CategoryPills.tsx
│       │   ├── MobileDrawer.tsx
│       │   ├── DrawerNavItem.tsx
│       │   └── DrawerSubSection.tsx
│       └── header.module.css      ← only for scrollbar-none, complex selectors
└── styles/
    └── tokens.css                 ← all CSS variables from Section 2
```

---

## 15. Quick Reference — Rule Numbers

| # | Rule | Short description |
|---|------|-------------------|
| PB-1 | PromoBar | Height = 32px always |
| DH-1 | Desktop header | `grid: 1fr auto 1fr` |
| L-3 | Logo | "s" = coral, nothing else |
| DN-1 | Nav links | 12px / uppercase / 0.08em |
| DN-5 | Nav items | Exactly 4 items |
| AI-3 | Cart badge | Coral dot, 14px, white border |
| SB-7 | Search | Auto-focus on open |
| MM-1 | Mega | 120ms hover delay |
| MM-5 | Mega | Max 6 links per column |
| MM-6 | Mega | Col 4 = featured card ALWAYS |
| MB-1 | Mobile bar | Height = 54px |
| MB-5 | Mobile | Hamburger → X = coral |
| CP-1 | Pills | Height = 44px, parchment bg |
| CP-8 | Pills | "New Arrivals" always first |
| DR-1 | Drawer | Slides from left, full width |
| DR-12 | Drawer | One section open at a time |
| DR-13 | Drawer | Bottom CTA bar always visible |
| ST-1 | Sticky | Triggers at scroll > 32px |
| ST-4 | Sticky | No blur / glass — flat white only |
| A-7 | A11y | Focus trap in open drawer |

---

*Kvastram Header Design System v1.0 — Claude Code Guide*  
*Use with: KVASTRAM_COMPLETE_GUIDE_V2.md | Store: kvastram.com*
