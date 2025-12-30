# Contributing to LocalGearbox

Thank you for your interest in contributing! This project is built with high standards for code quality, performance, and privacy. This guide will help you navigate our codebase and maintain our strict requirements.

## 🏛️ Development Philosophy

1.  **100% Client-Side First** - Everything runs in the browser. Zero server APIs. Zero data transmission.
2.  **Privacy First** - Sensitive data never touches external servers. No telemetry, no tracking.
3.  **Zero Lint Tolerance** - `npm run lint` must return **exactly 0 problems**. This is enforced via Git hooks.
4.  **Strict TypeScript** - No `any`. Comprehensive type coverage for all functions and components.
5.  **Continuous Validation** - Every push is validated globally (lint, types, format).
6.  **Quality over Quantity** - We prefer one perfect tool over ten half-baked ones.
7.  **No Shortcuts** - No TODOs, no placeholders, no mock logic, and no console logs in production code.
8.  **Educational Approach** - When browser security blocks operations, educate users instead of bypassing.

## 🛠️ Tech Stack

- **Core**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **UI Components**: Radix UI, shadcn/ui
- **State**: Zustand (State Management), Immer (Immutability)
- **State Persist**: Zustand Persist (LocalStorage)
- **Charts**: Recharts / Simple SVG components
- **Linting**: ESLint 9 (Flat Config), Prettier, Husky, lint-staged

## 🚀 Getting Started

1.  **Fork** the repository
2.  **Clone** your fork
3.  **Install** dependencies: `npm install`
4.  **Set up Husky**: `npm run prepare` (automatically runs on install)
5.  **Create a branch**: `git checkout -b feature/your-feature`

## 📂 Project Structure

```bash
├── app/
│   ├── tools/              # Tool-specific pages
│   ├── learn/              # Educational resources (web security)
│   └── layout.tsx          # Root layout with providers
├── lib/
│   ├── tools/              # 🏗️ CORE: Business logic/Processors
│   ├── stores/             # Zustand stores (e.g., api-client-store)
│   ├── utils/security/     # CORS/framing error detection
│   ├── tool-registry.ts    # 🗺️ MAP: Central tool registry
│   └── types.ts            # Global type definitions
├── components/
│   ├── ToolLayout.tsx      # Main template for tools
│   ├── api-client/         # Advanced API Client sub-components
│   ├── errors/             # Security error education panels
│   └── ui/                 # shadcn/ui primitives
```

## 🏗️ Adding a New Tool

Follow this exact workflow to ensure consistency:

### 1. Implement the Processor (`lib/tools/`)

Create your logic in the appropriate category (e.g., `lib/tools/encoders/`).

- Follow the security checklist in `lib/tools/TEMPLATE.ts`.
- Use `validateInput` from `lib/tools/shared.ts`.
- Ensure async processing where appropriate.

### 2. Register the Tool (`lib/tool-registry.ts`)

Add your tool to the `TOOLS` registry. This is the source of truth for the search, sidebar, and landing page.

### 3. Create the UI Page (`app/tools/`)

Create `app/tools/[tool-id].tsx`. Use `ToolLayout` to handle the standard input/output UI:

```tsx
'use client';
import { ToolLayout } from '@/components/ToolLayout';
import { myProcessor } from '@/lib/tools';

export default function MyTool() {
  return <ToolLayout toolName="My Tool" onProcess={myProcessor} />;
}
```

## 🌐 Client-Side First Guidelines

**CRITICAL:** LocalGearbox is 100% client-side by design. When adding new tools or features, follow these strict guidelines:

### ❌ Never Add Server-Side APIs

- **No `/app/api` routes** - The entire `/app/api` directory has been permanently removed
- **No proxies** - Do not create CORS proxies, HTML proxies, or any server-side data forwarding
- **No backend processing** - All data processing must happen in the browser

### ✅ Client-Side Alternatives

When building features that typically require server APIs:

**For HTTP Requests (API Client):**

- Use browser's native `fetch()` API directly
- Handle CORS errors gracefully with educational error panels
- Show users alternatives (browser extensions, local proxies) when CORS blocks requests
- See `components/errors/CorsErrorPanel.tsx` for reference

**For DNS Lookups:**

- Use DNS-over-HTTPS (DoH) with public resolvers (Cloudflare `1.1.1.1`, Google `8.8.8.8`)
- Make direct HTTPS calls from browser to DoH endpoints
- See `lib/tools/network/dns-doh.ts` for reference implementation

**For Web Previews (Responsive Tester, etc.):**

- Use direct iframe embedding with `src={url}`
- Handle X-Frame-Options/CSP blocks with educational error panels
- Show users testing alternatives when framing is blocked
- See `components/errors/FramingErrorPanel.tsx` for reference

### 🎓 Educational Error Handling

When browser security features block operations, we **educate instead of bypass**:

1. **Detect the error** - Use error detection utilities in `lib/utils/security/`
2. **Show educational content** - Use error panel components from `components/errors/`
3. **Provide alternatives** - Link to `/learn/web-security` for comprehensive guides
4. **Explain why** - Help users understand CORS, CSP, X-Frame-Options, etc.

**Example:**

```tsx
// ✅ Good - Educational approach
try {
  const response = await fetch(url);
} catch (error) {
  if (isCorsError(error)) {
    setErrorType('CORS');
    // Shows CorsErrorPanel with alternatives
  }
}

// ❌ Bad - Bypassing security
fetch('/api/proxy', { body: JSON.stringify({ url }) });
```

### 🔐 Privacy & Security Benefits

By staying 100% client-side, we guarantee:

- ✅ Zero data transmission to servers
- ✅ Zero server logging risks
- ✅ Zero SSRF attack surface
- ✅ Zero proxy abuse potential
- ✅ Complete user privacy
- ✅ Transparency through education

## ✅ Contribution Checklist

Before seeking review, ensure:

- [x] **Client-Side**: All processing happens in browser, no server-side APIs added.
- [x] **Linting**: `npm run lint` returns 0 problems.
- [x] **Formatting**: `npm run format:check` passes.
- [x] **Types**: `npm run type-check` passes.
- [x] **UX**: Tool works in both Light and Dark modes.
- [x] **Accessibility**: Full keyboard navigation support.
- [x] **Performance**: No unnecessary re-renders (use `useMemo`/`useCallback`).
- [x] **Cleanliness**: No commented-out code or `console.log`.
- [x] **Tests**: All tests pass (`npm run test`) and new code has appropriate test coverage.

## 🧪 Testing

We use **Vitest** and **React Testing Library** for comprehensive unit testing.

### Running Tests

```bash
npm run test              # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:ui           # Open Vitest UI
npm run test:coverage     # Run tests with coverage report
npm run test:changed      # Run tests for changed files
```

### Writing Tests

- **Location**: Place test files next to the code they test with `.test.ts` or `.test.tsx` extension
- **Coverage**: Aim for 80%+ coverage on new code
- **Focus Areas**:
  - Business logic in `lib/tools/`
  - State management in `lib/stores/`
  - Complex utility functions
  - Critical UI components

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './my-module';

describe('myFunction', () => {
  it('should handle valid input', () => {
    const result = myFunction('valid');
    expect(result).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(myFunction('')).toBe('');
    expect(myFunction(null)).toThrow();
  });
});
```

### Coverage Thresholds

The project enforces minimum coverage thresholds:

- **Statements**: 50%
- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%

These thresholds will increase over time as test coverage improves.

## ♿ Accessibility Testing Checklist

LocalGearbox is committed to WCAG 2.1 Level AA compliance. All contributions must meet these accessibility standards.

### Before Submitting Your PR

#### Keyboard Navigation

- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical and intuitive
- [ ] Focus indicators are visible on all focusable elements
- [ ] No keyboard traps (can tab in AND out of all components)
- [ ] Escape key closes dialogs/modals
- [ ] Enter/Space activates buttons and links

#### Screen Reader Support

- [ ] All images have alt text (or `aria-label` if decorative with `alt=""`)
- [ ] All icon-only buttons have `aria-label` attributes
- [ ] Form inputs have associated `<label>` elements or `aria-label`
- [ ] Error messages are announced (use `aria-live` regions)
- [ ] Dynamic content updates are announced (use `aria-live="polite"`)
- [ ] Loading states are communicated

#### ARIA Attributes

- [ ] Use semantic HTML first (prefer `<button>` over `<div onClick>`)
- [ ] Add `aria-label` to icon-only buttons
- [ ] Use `aria-live` regions for dynamic content
- [ ] Use `aria-describedby` for form hints/errors
- [ ] Use `aria-invalid` for form validation errors
- [ ] Use `role` attributes only when semantic HTML isn't enough

#### Visual Accessibility

- [ ] Color contrast meets WCAG AA standards (4.5:1 for normal text, 3:1 for large)
- [ ] Text is readable in both light and dark modes
- [ ] Important information is not conveyed by color alone
- [ ] Focus indicators are clearly visible
- [ ] Touch targets are at least 44x44 pixels

#### Component-Specific

**Buttons:**

```tsx
// ✅ Good - Icon button with label
<Button aria-label="Delete item">
  <Trash2 className="h-4 w-4" />
</Button>

// ❌ Bad - No label
<Button>
  <Trash2 className="h-4 w-4" />
</Button>
```

**Forms:**

```tsx
// ✅ Good - Associated label
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

// ❌ Bad - No label
<Input type="email" placeholder="Email" />
```

**Dynamic Content:**

```tsx
// ✅ Good - Announced to screen readers
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// ❌ Bad - Updates not announced
<div>{statusMessage}</div>
```

### Testing Tools

#### Automated Testing

```bash
# Install axe-core CLI (one-time)
npm install -g @axe-core/cli

# Start dev server
npm run dev

# Run accessibility audit
npx axe http://localhost:3000/your-tool-page
```

#### Manual Testing

**Keyboard Testing:**

1. Disconnect your mouse/trackpad
2. Navigate using only Tab, Shift+Tab, Enter, Space, Escape, Arrow keys
3. Verify all functionality is accessible

**Screen Reader Testing:**

- **macOS:** VoiceOver (Cmd+F5)
- **Windows:** NVDA (free) or JAWS
- **Browser:** ChromeVox extension

**Color Contrast:**

- Use browser DevTools or [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Minimum ratio: 4.5:1 for normal text, 3:1 for large text (18pt+)

### Common Patterns

**Skip Links (Already Implemented):**

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only...">
  Skip to main content
</a>
```

**Visually Hidden Text:**

```tsx
import { VisuallyHidden } from '@/components/LiveRegion';

<button>
  <TrashIcon />
  <VisuallyHidden>Delete item</VisuallyHidden>
</button>;
```

**Live Regions:**

```tsx
import { LiveRegion } from '@/components/LiveRegion';

<LiveRegion mode="polite">Request completed successfully</LiveRegion>;
```

### Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Radix UI Accessibility](https://www.radix-ui.com/docs/primitives/overview/accessibility) (we use this)
- [WebAIM Articles](https://webaim.org/articles/)
- [Project Accessibility Audit](./docs/ACCESSIBILITY_AUDIT.md)

## 🛡️ Git Hooks Enforcement

We use Husky and `lint-staged` to enforce quality:

- **Pre-commit**: Runs `eslint --max-warnings=0` and `prettier --write` on changed files. Any warning will block the commit.
- **Pre-push**: Runs `npm run validate` to ensure the project compiles and all semantic checks pass globally.

---

Happy coding! 🚀
