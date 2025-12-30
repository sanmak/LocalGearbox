# Security Policy & Audit Report

**Last Updated:** December 30, 2025
**Status:** 🟢 Secure (100% Client-Side Architecture)

## Security Model

LocalGearbox is defined by a **100% Client-Side** security model. The application runs entirely in your browser with zero server-side APIs.

- **Data Ownership**: You own your data. It is stored in `localStorage` or IndexedDB on your device.
- **Network Isolation**: Zero server APIs. Zero data transmission. All processing happens in-browser.
- **Privacy by Design**: DNS queries use DNS-over-HTTPS (DoH) via public resolvers (Cloudflare/Google).
- **Self-Hosted**: You control your deployment (Docker, Kubernetes, bare metal). You are the admin.

---

## 🛡️ Security Audit Report (Dec 2025)

We believe in radical transparency. Below are the findings from our latest strict code audit.

### 🔴 Critical Findings

#### 1. Dynamic Code Execution (API Client)

**Location:** `lib/sandbox.ts`
**Findings:** The API Client's "Pre-request Scripts" and "Tests" feature executes JavaScript code in an isolated Web Worker.
**Risk:** Previously allowed arbitrary code execution with access to localStorage, cookies, and DOM.
**Mitigation:**

- **Current Status:** ✅ **RESOLVED**. Scripts now run in isolated Web Workers with:
  - **DOM Isolation**: No access to `window`, `document`, or any DOM APIs
  - **Storage Isolation**: Cannot access `localStorage`, `sessionStorage`, `cookies`, or `indexedDB`
  - **Context Isolation**: No access to parent page's JavaScript context or variables
  - **Timeout Protection**: 10-second hard limit with forced termination
  - **Resource Cleanup**: Worker terminated and blob URL revoked after each execution
  - **CSP Enforcement**: `worker-src blob:` restricts worker sources to inline code only
- **Known Limitations**:
  - Workers CAN make `fetch()` requests to same-origin endpoints (restricted by `connect-src 'self'`)
  - Workers CAN perform CPU-intensive computations (limited by 10s timeout)
  - The `pm` API allows environment variable modification (by design for the feature)
- **Advisory**: While significantly safer than the previous implementation, still **avoid running scripts from untrusted sources**. A malicious script could:
  - Exfiltrate environment variables via same-origin fetch requests
  - Consume CPU resources for up to 10 seconds
  - Modify environment variables in unexpected ways

### 🟠 High Severity Findings

#### 2. Missing HTTP Security Headers

**Location:** `next.config.js`
**Findings:** The application now enforces strict Content Security Policy (CSP), HSTS, X-Frame-Options, and X-Content-Type-Options headers by default.
**Risk:** Previously vulnerable to Clickjacking/XSS.
**Mitigation:**

- **Current Status:** ✅ **Resolved**. Headers are injected via `next.config.js`.
- **Advisory:** If using a custom proxy (NGINX), ensure these headers are passed through or reinforced.

### 🔵 Informational Findings

#### 3. Proxy Removal & Client-Side Architecture (Dec 2025)

**Decision:** ALL server-side API routes have been permanently removed (including `/api/proxy`, `/api/tools/dns`, `/api/html-proxy`).
**Rationale:**

- **Privacy Enhancement**: Zero server-side data processing eliminates server logging risks
- **Security Hardening**: Removes SSRF attack surface, rate limiting complexity, and proxy abuse potential
- **Ethical Design**: Users now understand browser security (CORS, CSP, X-Frame-Options) through educational error panels
- **Transparency**: Users see exactly what's blocked and why, with clear alternatives

**Current Implementation:**

- **API Client**: Direct `fetch()` from browser. CORS errors trigger educational panels with alternatives (browser extensions, local proxies)
- **DNS Tools**: DNS-over-HTTPS (DoH) via Cloudflare (`1.1.1.1`) and Google (`8.8.8.8`) public resolvers
  - **Privacy Benefits**: Encrypted DNS queries prevent ISP snooping and DNS hijacking
  - **No Server Storage**: Queries go directly from browser to public DoH endpoints
  - **Industry Standard**: Same DoH providers used by major browsers (Firefox, Chrome, Edge)
- **Responsive Tester**: Direct iframe embedding. X-Frame-Options errors show educational alternatives

**Trade-offs:**

- ✅ **Gained**: Complete privacy, zero server attack surface, educational user experience
- ⚠️ **Lost**: CORS bypass capability (now requires user to use browser extensions if needed)
- ⚠️ **Educational Shift**: Users learn why browsers block certain operations instead of silently bypassing security

#### 4. DNS-over-HTTPS (DoH) Privacy Model

**Implementation:** All DNS tools (7 total) use DNS-over-HTTPS for queries.
**Providers:**

- **Cloudflare** (`https://1.1.1.1/dns-query`) - Primary resolver
- **Google** (`https://8.8.8.8/dns-query`) - Fallback resolver

**Privacy Guarantees:**

- ✅ **Encrypted Transport**: All DNS queries encrypted via HTTPS (TLS 1.3)
- ✅ **No Logging**: Queries not logged by LocalGearbox (zero server-side code)
- ✅ **Direct Communication**: Browser → DoH Provider (no intermediary)
- ✅ **Industry Standard**: RFC 8484 compliant, same DoH used by major browsers
- ✅ **ISP Privacy**: ISP cannot see DNS queries (encrypted HTTPS tunnel)

**Provider Privacy Policies:**

- Cloudflare: Does not log IP addresses, deletes query data within 24 hours ([Privacy Policy](https://www.cloudflare.com/privacypolicy/))
- Google: Logs queries temporarily for security/abuse prevention ([Privacy Policy](https://developers.google.com/speed/public-dns/privacy))

**User Control:**

- Users can choose DoH provider in DNS tool settings (future enhancement)
- Users can self-host DoH resolvers if desired (e.g., `pihole-doh`, `cloudflared`)

#### 5. DOM Injection (Code Highlighter)

**Location:** `components/CodeHighlighter.tsx`
**Findings:** Uses `dangerouslySetInnerHTML` to render syntax-highlighted code.
**Risk:** Potential XSS if input is not sanitized.
**Mitigation:**

- **Current Status:** ✅ **Verified Safe**. The component explicitly escapes HTML entities (`<`, `>`, `&`) _before_ applying highlighting spans. Input is treated as text, not HTML.

---

## Security Principles

Despite the findings above, we adhere to these core principles:

1.  **100% Client-Side**: Zero server APIs, zero data transmission, complete browser-based processing.
2.  **Zero Telemetry**: We do not include analytics (Google Analytics, Mixpanel, etc.).
3.  **Open Source**: You can audit every line of code in `lib/`. No hidden server logic.
4.  **Minimal Dependencies**: We prefer native browser APIs over heavy 3rd-party libs where possible.
5.  **Educational Security**: When browser security blocks operations, users learn why and see alternatives.

## Input Limits

To prevent browser crashes:

- **JSON/XML**: ~10MB (Browser memory limit)
- **URL Strings**: 1MB

## Reporting Vulnerabilities

If you find a security issue _not_ listed above (e.g., a way to leak data to a third party automatically):

1.  **Do not open a GitHub Issue.**
2.  Email
3.  We will address it immediately.

## Safe Usage Guide

1.  **Run in Docker**: Isolate the process from your host system.
2.  **Use Private Mode**: If working with sensitive tokens, use Incognito/Private windows to ensure memory is cleared on close.
3.  **Audit Scripts**: Read any pre-request scripts before running them.

---

**Copyright (c) 2025 LocalGearbox Contributors**
