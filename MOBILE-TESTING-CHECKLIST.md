# Mobile Responsive Testing Checklist

## Visual Testing Guide

Use Chrome DevTools (F12) → Toggle Device Toolbar (Ctrl+Shift+M) to test these scenarios.

### Test Devices (Recommended)

- [ ] iPhone SE (375px wide) - Smallest modern phone
- [ ] iPhone 14 Pro (393px wide)
- [ ] Samsung Galaxy S20 (360px wide)
- [ ] iPad Mini (768px wide)
- [ ] iPad Pro (1024px wide)

### Navigation Bar Tests

**Mobile (< 640px)**

- [ ] Navigation shows icons only (no text labels except on larger screens)
- [ ] All nav items fit without wrapping
- [ ] Horizontal scroll works if needed (swipe left/right)
- [ ] Dark mode toggle visible and clickable
- [ ] Cart badge shows if items present
- [ ] Logout button visible (icon only)
- [ ] User info hidden on small screens
- [ ] Navigation height is compact (h-14)

**Tablet (640px - 1024px)**

- [ ] Navigation shows icons + text labels
- [ ] More generous spacing between items
- [ ] User role badge appears at lg: (1024px+)
- [ ] All buttons easily tappable (44x44px minimum)

### Dashboard Tests

**Mobile**

- [ ] Hero heading readable: "Velkommen til Presales Dashboard"
- [ ] Stats cards stack vertically (1 column)
- [ ] Each stat card fully visible without horizontal scroll
- [ ] Cart summary (if items) shows 1 column on mobile, 2 on tablet
- [ ] Quick action buttons fit without wrapping

**Tablet**

- [ ] Stats grid shows 2 columns (md:grid-cols-2)
- [ ] Heading scales up appropriately

**Desktop**

- [ ] Stats grid shows 4 columns (lg:grid-cols-4)
- [ ] Maximum heading size (6xl)

### Product List Tests

**Mobile**

- [ ] Products stack vertically (1 column)
- [ ] Product cards have reduced gap (gap-4)
- [ ] Product details fully visible
- [ ] Add to cart button easily tappable

**Tablet (640px+)**

- [ ] Products show 2 columns (sm:grid-cols-2)
- [ ] Gap increases (gap-6)

**Desktop (1024px+)**

- [ ] Products show 3 columns (lg:grid-cols-3)
- [ ] Full gap spacing (gap-8)

### Customer Detail Tests

**Mobile**

- [ ] Customer name/info header stacks vertically
- [ ] Stats cards stack (1 column)
- [ ] Subscription cards full width
- [ ] Subscription details scroll horizontally (swipe to see all)
- [ ] Provision button clearly visible

**Tablet (768px+)**

- [ ] Header items side-by-side (md:flex-row)
- [ ] Stats show 2 columns (md:grid-cols-2)

**Desktop (1024px+)**

- [ ] Stats show 4 columns (lg:grid-cols-4)

### Calculator (OverallCalculator) Tests

**Mobile**

- [ ] Hero heading readable at text-3xl
- [ ] Action buttons show shortened text: "Excel", "Kurv" (no "Eksporter til", "Tøm")
- [ ] Buttons compact but tappable
- [ ] TotalsCard appears BELOW cart items (not sidebar)
- [ ] TotalsCard full width on mobile
- [ ] Product cards in cart stack nicely
- [ ] Quantity/discount controls easily tappable

**Tablet (640px+)**

- [ ] Buttons show full text
- [ ] Heading grows (text-4xl)

**Desktop (1024px+)**

- [ ] TotalsCard becomes sticky sidebar (lg:w-96, lg:sticky)
- [ ] TotalsCard on right side of content
- [ ] Heading at maximum size (text-6xl)

### Provision Modal Tests

**Mobile**

- [ ] Modal takes up 95% of viewport width (w-[95vw])
- [ ] Modal has compact padding (p-4)
- [ ] Product list stacks vertically (1 column)
- [ ] Search input full width
- [ ] Close button easily tappable
- [ ] Provision button at bottom easily accessible

**Tablet (640px+)**

- [ ] Products show 2 columns (sm:grid-cols-2)
- [ ] Modal padding increases (sm:p-6)

**Desktop**

- [ ] Modal max-width applies (max-w-4xl)
- [ ] Products maintain 2-column layout

### Dialog Tests (Incentive Form, etc.)

**Mobile**

- [ ] Dialogs take up 95% viewport width
- [ ] Compact padding (p-4)
- [ ] Form fields stack vertically
- [ ] All buttons easily tappable
- [ ] Date pickers work on touch devices

**Tablet (768px+)**

- [ ] Form shows 2-column layout (md:grid-cols-2)
- [ ] Padding increases (sm:p-6)

### Subscription Details Tests

**Mobile**

- [ ] Subscription summary cards stack vertically
- [ ] When expanded, detail table scrolls horizontally
- [ ] Minimum width maintained (600px) for table
- [ ] Column headers visible
- [ ] All data accessible via horizontal swipe

**Desktop**

- [ ] Table displays normally without scroll
- [ ] All columns visible at once

### Orientation Tests

**Portrait Mode**

- [ ] All layouts work as expected per breakpoints above
- [ ] No horizontal overflow (except intentional horizontal scroll areas)

**Landscape Mode (especially phones)**

- [ ] Navigation still fits comfortably
- [ ] Content doesn't feel too wide or stretched
- [ ] Tables may be fully visible without horizontal scroll

### Touch Interaction Tests

- [ ] All buttons have adequate touch targets (min 44x44px)
- [ ] No accidental taps due to elements being too close
- [ ] Swipe gestures work for horizontal scroll areas
- [ ] Forms don't zoom on input focus (viewport meta tag check)
- [ ] Double-tap zoom disabled on buttons but enabled on content

### Dark Mode Tests

Run all above tests with dark mode enabled:

- [ ] All responsive changes work correctly in dark mode
- [ ] Text remains readable
- [ ] Contrast sufficient at all breakpoints

### Performance Tests

**Mobile Device (Simulated)**

- [ ] Enable "3G throttling" in DevTools
- [ ] Page loads within reasonable time (< 3 seconds)
- [ ] Interactions feel responsive
- [ ] No layout shift during load

### Accessibility Tests

**Mobile Screen Reader**

- [ ] Navigation landmarks announced correctly
- [ ] Icon-only buttons have aria-labels
- [ ] Focus order makes sense
- [ ] Form labels associated correctly

## Known Issues to Watch For

1. **Horizontal scroll on body**: Should only occur in intentional areas (nav, subscription details)
2. **Fixed elements**: Should not overlap content at any breakpoint
3. **z-index conflicts**: Modals/dropdowns should appear above all content
4. **Input zoom on iOS**: Inputs < 16px font-size cause unwanted zoom
5. **Safe area insets**: On notched devices, content should respect safe areas

## How to Test

1. Open DevTools (F12)
2. Click Toggle Device Toolbar (or Ctrl+Shift+M)
3. Select device from dropdown
4. Navigate through all pages
5. Test both portrait and landscape
6. Check all interactive elements
7. Verify no horizontal scroll on main viewport
8. Test forms and modals

## Quick Test URLs (Local)

Assuming dev server at `http://localhost:5173`:

- Dashboard: `/`
- Products: `/products`
- Customers: `/customers`
- Customer Detail: `/customers/{customerId}` (pick from list)
- Incentives (admin): `/incentives`
- Calculator: `/calculator` (add items from products first)

## Passing Criteria

✅ All checkboxes above checked
✅ No horizontal scroll on body (except intentional areas)
✅ All content readable without zooming
✅ All interactive elements easily tappable
✅ Navigation works smoothly
✅ Forms are usable
✅ Tables/data grids accessible (even if scrollable)
✅ Performance acceptable on throttled connection
✅ Dark mode works correctly
✅ TypeScript compiles without errors (`npm run typecheck`)
