<h1 align="center">
  <br>
  LocalGearbox
  <br>
</h1>

<p align="center">
  <strong>Production-grade developer tools that never leave your machine.</strong>
</p>

<p align="center">
  <a href="#the-problem-why-does-localgearbox-exist">Why LocalGearbox?</a> •
  <a href="#the-solution-localgearbox">The Solution</a> •
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/local--first-100%25-brightgreen?style=flat-square" alt="Local First">
  <img src="https://img.shields.io/badge/privacy-zero%20tracking-blue?style=flat-square" alt="Zero Tracking">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT License">
</p>

<p align="center">
  <a href="https://github.com/sanmak/LocalGearbox/actions/workflows/ci.yml"><img src="https://github.com/sanmak/LocalGearbox/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/sanmak/LocalGearbox/actions/workflows/e2e-tests.yml"><img src="https://github.com/sanmak/LocalGearbox/actions/workflows/e2e-tests.yml/badge.svg" alt="E2E Tests"></a>
  <a href="https://github.com/sanmak/LocalGearbox/actions/workflows/codeql.yml"><img src="https://github.com/sanmak/LocalGearbox/actions/workflows/codeql.yml/badge.svg" alt="CodeQL"></a>
  <a href="https://codecov.io/gh/sanmak/LocalGearbox"><img src="https://codecov.io/gh/sanmak/LocalGearbox/branch/main/graph/badge.svg" alt="Coverage"></a>
</p>

---

## The Problem: Why Does LocalGearbox Exist?

> **"In an era of thousands of free online developer tools, why build another one?"**

This is the most important question we answer.

### The Invisible Threat in Your Developer Workflow

Every day, millions of developers paste sensitive data into "free" online tools to speed up their work:

| Common Actions                      | Hidden Risks                          |
| ----------------------------------- | ------------------------------------- |
| Formatting production JSON logs     | Customer PII exposed to third parties |
| Decoding JWTs with auth tokens      | Session tokens harvested by trackers  |
| Testing APIs with real credentials  | API keys stored in unknown databases  |
| Debugging with production data      | Confidential business data leaked     |
| Parsing error logs during incidents | System architecture exposed           |

**The uncomfortable truth:** Developers don't think twice about pasting confidential data into these tools. They're focused on solving problems fast—not auditing third-party JavaScript.

### What Happens Behind the Scenes

Most "free" online developer tools operate on a business model that is fundamentally incompatible with enterprise security:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     THE HIDDEN DATA FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Developer                      "Free" Tool                    Third Parties│
│   ─────────                      ───────────                    ─────────────│
│                                                                              │
│   [Paste Data] ──────────────► [Process + Copy] ──────────────► [Advertisers]│
│                                      │                          [Analytics]  │
│   • JSON with customer PII           │                          [Data Brokers│
│   • JWT tokens                       ▼                          [Unknown]    │
│   • API keys                   [Local Storage]                               │
│   • Production logs            [Cookies: 50+]                                │
│   • Database schemas           [Trackers: 20+]                               │
│                                [Malware Risk]                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**What enterprises don't know about these tools:**

- **🔴 Data Persistence:** Your pasted data may be logged, cached, or stored indefinitely
- **🔴 Tracker Networks:** 20-50+ third-party scripts loading on each page (Google Analytics, Facebook Pixel, Hotjar, etc.)
- **🔴 Cookie Storms:** Dozens of tracking cookies planted in developer browsers
- **🔴 No Audit Trail:** Zero visibility into what happens to your data after submission
- **🔴 Malware Vectors:** Compromised tools become supply chain attack vectors
- **🔴 Browser Fingerprinting:** Unique developer machines identified and tracked across the web

### The Real-World Impact

| Scenario                                                 | Risk Level  | Potential Damage                           |
| -------------------------------------------------------- | ----------- | ------------------------------------------ |
| Developer pastes production database dump for formatting | 🔴 Critical | Full customer data breach                  |
| JWT decoder used with active session tokens              | 🔴 Critical | Account takeover, privilege escalation     |
| API client testing with production credentials           | 🔴 Critical | Unauthorized system access                 |
| Log parser used during production incident               | 🟠 High     | System architecture leaked to competitors  |
| JSON formatter with internal API responses               | 🟠 High     | Business logic and data structures exposed |
| Base64 decoder with encoded secrets                      | 🔴 Critical | Secrets harvested and sold                 |

**A single compromised third-party tool can bring down an entire enterprise.**

This isn't theoretical. Data breaches through third-party tools and browser-based attacks are among the fastest-growing attack vectors in cybersecurity.

---

## The Solution: LocalGearbox

### Enterprise-Grade Developer Tools Built for Security

LocalGearbox exists because **developers deserve powerful tools that don't compromise their organization's security**.

We built a complete suite of 80+ high-fidelity developer utilities with one unwavering principle:

> **Your data never leaves your machine. Period.**

### Security Architecture Guarantees

| Guarantee                       | Implementation                                       | Verification                   |
| ------------------------------- | ---------------------------------------------------- | ------------------------------ |
| **100% Client-Side Processing** | ALL 80+ tools execute entirely in-browser            | [View Source](./lib/tools/)    |
| **Zero Telemetry**              | No analytics, no tracking pixels, no heartbeat pings | [Privacy Policy](./PRIVACY.md) |
| **Zero Cookies**                | No tracking cookies, no session storage abuse        | Browser DevTools               |
| **Zero External Requests**      | No data transmitted to external servers              | Network tab inspection         |
| **Zero Server APIs**            | No backend routes, no proxies, no data transmission  | No `/app/api` directory        |
| **Zero Ads**                    | No advertising networks, no data monetization        | View source                    |
| **Open Source**                 | Full transparency—audit every line of code           | MIT License                    |

### Why Enterprises Trust LocalGearbox

<table>
<tr>
<td width="50%">

#### 🔒 **Privacy-Native Architecture**

- 100% client-side execution for ALL 80+ tools
- No data leaves your browser
- No server-side APIs or proxies
- DNS via DNS-over-HTTPS (DoH)

</td>
<td width="50%">

#### 🛡️ **Zero Attack Surface**

- No third-party trackers
- No advertising scripts
- No analytics packages
- No external dependencies calling home

</td>
</tr>
<tr>
<td width="50%">

#### 🏢 **Self-Hosted Deployment**

- Deploy on your own infrastructure
- Docker, Kubernetes, bare metal
- Air-gapped environment support
- Complete network isolation possible

</td>
<td width="50%">

#### ✅ **Compliance Ready**

- SOC 2 compatible architecture
- GDPR compliant by design
- HIPAA-friendly (no PHI transmission)
- Full audit trail capability

</td>
</tr>
<tr>
<td width="50%">

#### ♿ **Accessibility First**

- WCAG 2.1 AA compliant
- Screen reader optimized
- Keyboard navigation complete
- Focus management built-in

</td>
<td width="50%">

#### ⚡ **Enterprise Performance**

- Sub-second tool loading
- Offline-capable (PWA)
- No bloat, no ads, no delays
- Works in restricted networks

</td>
</tr>
</table>

### Comparison: LocalGearbox vs. Online Alternatives

| Feature          | LocalGearbox         | Typical Online Tool         |
| ---------------- | -------------------- | --------------------------- |
| Data Processing  | 100% Client-Side     | Server-side (unknown)       |
| Trackers         | **0**                | 20-50+                      |
| Cookies          | **0**                | Dozens                      |
| Ads              | **None**             | Multiple networks           |
| Data Logging     | **Never**            | Unknown/Likely              |
| Self-Hosting     | **Yes (Docker/K8s)** | No                          |
| Offline Support  | **Yes (PWA)**        | No                          |
| Source Code      | **Open (MIT)**       | Proprietary                 |
| Audit Capability | **Full**             | None                        |
| Cost             | **Free Forever**     | "Free" (you're the product) |

### Industry Standards & Best Practices

LocalGearbox is built following industry-leading security and development standards:

- **OWASP Security Guidelines** — Input validation, SSRF protection, rate limiting
- **WCAG 2.1 Accessibility** — Level AA compliance for inclusive design
- **12-Factor App Methodology** — Cloud-native, containerized deployment
- **Privacy by Design** — Data minimization as a core architectural principle
- **Zero Trust Architecture** — No implicit trust, all operations verifiable

---

## For Enterprise Security Teams

### Deployment Options

| Option         | Use Case                      | Security Level | Docker Image                         |
| -------------- | ----------------------------- | -------------- | ------------------------------------ |
| **Docker**     | Standard deployment           | High           | `ghcr.io/sanmak/localgearbox:latest` |
| **Kubernetes** | Scalable enterprise           | High           | `ghcr.io/sanmak/localgearbox:latest` |
| **Air-Gapped** | Maximum security environments | Maximum        | Build from source or import image    |
| **On-Premise** | Full infrastructure control   | High           | `ghcr.io/sanmak/localgearbox:latest` |

**Official Docker Images:**

- 🌐 **Registry:** GitHub Container Registry (ghcr.io)
- 📦 **Image:** `ghcr.io/sanmak/localgearbox`
- 🏗️ **Architectures:** `linux/amd64`, `linux/arm64`
- 🔄 **Auto-built:** Every release via GitHub Actions
- ✅ **Verified:** Signed and scanned for vulnerabilities

### Security Audit Checklist

✅ **Source Code:** Fully open, audit every line ([GitHub](https://github.com/sanmak/LocalGearbox))

✅ **Dependencies:** Minimal, well-known packages, regularly updated

✅ **Network Traffic:** Zero outbound data transmission (ALL 80+ tools are client-side)

✅ **Data Persistence:** None. All processing in-memory, client-side

✅ **Authentication:** Not required. No accounts, no user data

✅ **Encryption:** HTTPS enforced. No sensitive data transmitted

### Give Your Developers Safe Tools

**Stop the invisible data leak.** Deploy LocalGearbox and give your engineering team the powerful utilities they need—without the security nightmare.

```bash
# Deploy in minutes (multi-platform: amd64 and arm64)
docker run -p 3000:3000 ghcr.io/sanmak/localgearbox:latest

# For specific platform
docker run --platform linux/amd64 -p 3000:3000 ghcr.io/sanmak/localgearbox:latest
docker run --platform linux/arm64 -p 3000:3000 ghcr.io/sanmak/localgearbox:latest
```

**LocalGearbox: Enterprise-grade developer tools. Zero compromise on security.**

---

## Principles & Architectural Design

This project is built for engineers who value privacy and performance. We adhere to four non-negotiable standards:

- **Local-First Execution:** 100% of data processing occurs in your browser. ALL 80+ tools use client-side logic to ensure your sensitive data (logs, JSON, keys) never touches a wire.
- **Zero-Telemetry Policy:** There are no trackers, no Google Analytics, and no "heartbeat" pings.
- **Architectural Transparency:** Built on a clean Next.js stack with zero server APIs, focusing on low-latency and high accessibility.
- **Open Sovereignty:** Licensed under MIT. No "Open Core" upsells or hidden tiers.

---

## Philosophy

### 🏠 Local-First

Every operation runs in your browser. Your API requests, JSON data, and sensitive tokens never touch external servers. What happens in LocalGearbox, stays in LocalGearbox.

### 🔒 Privacy by Design

- **Zero analytics** — No Google Analytics, no Mixpanel, no trackers
- **No cookies** — We don't set any tracking cookies
- **No external requests** — All processing happens client-side
- **No accounts required** — Just open and use

### ♿ Accessibility Native

Built from the ground up to meet WCAG accessibility standards. Proper keyboard navigation, screen reader support, and focus management.

### ⚡ Offline Capable

LocalGearbox includes offline support through Service Workers and PWA capabilities. After the initial page load while online, the app caches essential resources and works without internet. Perfect for air-gapped environments, travel, or unreliable connections.

**Note:** Service Worker registration is automatic in production mode. ALL 80+ tools run entirely client-side and don't require internet connectivity once loaded (DNS tools use public DoH resolvers when online).

### 🛠️ Developer Owned

- **No subscriptions** for basic utilities
- **No feature paywalls**
- **Full source code transparency**
- **Self-host on your infrastructure**

---

## Features

### 🏗️ Engineering Workbenches

Power tools designed for architects and senior engineers to design, test, and analyze systems.

#### 🚀 Advanced API Client

A privacy-first alternative to Postman/Insomnia with 100% client-side execution.

- **Full HTTP Support**: REST, GraphQL, and more with all standard methods (direct `fetch()` from browser).
- **Auth & Security**: OAuth 2.0, Bearer Token, API Key injection.
- **Enterprise Workflow**: Environments, variable interpolation, and request collections.
- **Scripting Engine**: Pre-request scripts and test assertions for automated validation.
- **Educational CORS Handling**: When APIs block CORS, users see clear explanations and alternatives.

#### 📊 Log Analysis Studio

Anomalies and insights from raw logs without uploading data.

- **Multi-Format**: Parse NGINX, Apache, Syslog, and custom JSON log structures.
- **Pattern Detection**: Automated anomaly detection and statistical analysis.
- **Visualization**: Time-series analysis and correlation detection.

#### 📜 Contract & Schema Workbench

Validate and generate code from system contracts.

- **OpenAPI & gRPC**: Lint and validate API specifications against best practices.
- **SQL Analysis**: Parse and visualize `EXPLAIN` plans for Postgres/MySQL optimization.
- **Type Converters**: Generate Typescript, Rust, Go, and Swift structs from JSON/Contracts.

#### 📉 System Design Utilities

- **Rate Limit Calculator**: Design and visualize retry strategies (Exponential Backoff, Jitter).
- **Architecture Diagrams**: (Beta) Create system architecture diagrams with code.

---

### 🛠️ Developer Utilities

| Category       | Tools                                                 |
| -------------- | ----------------------------------------------------- |
| **Formatters** | JSON, XML, HTML, CSS, SQL Formatter                   |
| **Validators** | JSON Schema, XML Validator, Regex Tester              |
| **Encoders**   | URL, Base64, HTML Entity, JWT Decoder                 |
| **Converters** | JSON ↔ CSV, Epoch ↔ Date, JSON5 ↔ JSON, Data Diff     |
| **Generators** | UUID v4, SHA/MD5 Hashes, Lorem Ipsum                  |
| **Network**    | DNS Lookup (A, MX, NS), SSL Cert Checker, Subnet Calc |
| **Text**       | Diff Viewer, Case Converter, String Manipulation      |

---

## Quick Start

### Option 1: Docker (Recommended)

#### Using Pre-built Image (Fastest)

Official multi-platform images are automatically built and published to GitHub Container Registry for every release.

**Supported Architectures:** `linux/amd64`, `linux/arm64`

```bash
# Latest version (automatically built from releases)
docker run -p 3000:3000 ghcr.io/sanmak/localgearbox:latest

# Specific version (e.g., v1.0.0)
docker run -p 3000:3000 ghcr.io/sanmak/localgearbox:1.0.0

# Major version (auto-updates to latest minor/patch)
docker run -p 3000:3000 ghcr.io/sanmak/localgearbox:1

# Open http://localhost:3000
```

**Available Image Tags:**

- `latest` - Latest stable release
- `1.0.0` - Specific version
- `1.0` - Latest patch version of 1.0.x
- `1` - Latest minor/patch version of 1.x.x

All images support both `amd64` and `arm64` platforms. Docker automatically selects the correct architecture.

#### Building from Source

```bash
# Clone the repository
git clone https://github.com/sanmak/LocalGearbox.git
cd local-gearbox

# Build for your platform (auto-detects architecture)
docker build -t local-gearbox .
docker run -p 3000:3000 local-gearbox

# Build for specific platform (cross-platform build)
docker buildx build --platform linux/amd64,linux/arm64 -t local-gearbox .

# Open http://localhost:3000
```

### Option 2: Docker Compose

```bash
# Builds for multiple platforms (amd64 and arm64)
docker-compose up -d

# For ARM64 systems (Apple Silicon, ARM servers), override platform:
# Edit docker-compose.yml and change: platform: linux/arm64

# Open http://localhost:3000
```

### Option 3: Node.js (Static Export)

**Prerequisites:** Node.js 24+ and npm

LocalGearbox uses Next.js static export for 100% client-side deployment without requiring a Node.js server.

```bash
# Clone and install
git clone https://github.com/sanmak/LocalGearbox.git
cd local-gearbox
npm install

# Development mode (with hot reload)
npm run dev

# Production build (generates static export to ./out directory)
npm run build

# Serve static files locally (for testing)
npm start

# Open http://localhost:3000
```

**Deployment:** After `npm run build`, the `out/` directory contains a fully static site that can be deployed to any static hosting provider (Vercel, Netlify, GitHub Pages, AWS S3, Cloudflare Pages, etc.) or served by any web server (nginx, Apache, etc.). No Node.js server required!

### Option 4: One-Line Install

```bash
npx degit sanmak/LocalGearbox my-localgearbox && cd my-localgearbox && npm install && npm run dev
```

---

## Tech Stack

| Layer           | Technology                                                         |
| --------------- | ------------------------------------------------------------------ |
| **Core**        | Next.js 16 (App Router), React 19, TypeScript                      |
| **Styling**     | Tailwind CSS, Lucide Icons, tailwind-merge, tailwindcss-animate    |
| **Components**  | shadcn/ui, Radix UI Primitives, Command (cmdk)                     |
| **Layout**      | react-resizable-panels (IDE-like panes)                            |
| **Utilities**   | Zustand (State), Immer (Immutable state), JMESPath (JSON querying) |
| **Interaction** | @dnd-kit (Drag & Drop), react-zoom-pan-pinch                       |
| **Network**     | DNS-over-HTTPS (DoH), direct browser `fetch()` API                 |

---

## Design Philosophy

### Design System

LocalGearbox uses a cohesive dark-first design system built on these principles:

- **Semantic color tokens** — `bg-background`, `text-foreground`, `border-primary`
- **Component consistency** — All UI elements use shadcn/ui components
- **Accessibility first** — Proper contrast ratios, focus states, ARIA labels
- **Responsive layouts** — Works on desktop, tablet, and mobile

### Architecture

- **Registry-driven** — Tools are defined declaratively in a central registry
- **Modular processors** — Each tool category has isolated, testable logic
- **Type-safe** — Strict TypeScript with comprehensive type checking
- **Zero Lint Tolerance** — Strictly enforced zero-error/zero-warning linting policy
- **Automated Formatting** — Consistent code style via Prettier and Git hooks
- **Security-first** — Input validation, size limits, XSS/XXE protection

> [!IMPORTANT]
> **100% Client-Side Architecture:** ALL 80+ tools are completely client-side. Zero server APIs. Zero data transmission.
>
> - **API Client**: Direct `fetch()` from browser. CORS errors show educational guidance.
> - **DNS Tools**: DNS-over-HTTPS (DoH) via Cloudflare/Google public resolvers.
> - **Responsive Tester**: Direct iframe embedding. X-Frame-Options errors show alternatives.
>
> When browser security features block operations, users see clear explanations and alternative approaches at [/learn/web-security](/learn/web-security).

### Data Flow: 100% Client-Side

**ALL 80+ Tools:**

```
Browser → Local Processing → Browser
```

**Zero exceptions. Zero compromises. Complete privacy.**

- **No server APIs** — Entire `/app/api` directory removed
- **No proxies** — Direct browser `fetch()` API used
- **No data transmission** — Everything stays on your device
- **DNS via DoH** — Privacy-respecting DNS-over-HTTPS for DNS tools
- **Educational errors** — When CORS/CSP blocks operations, users learn why and see alternatives

---

## Project Structure

```
local-gearbox/
├── app/                    # Next.js App Router pages
│   ├── tools/              # Individual tool pages
│   └── learn/              # Educational resources (web security)
├── components/             # React components
│   ├── ui/                 # shadcn/ui primitives
│   ├── errors/             # Security error education panels
│   └── ...                 # Feature components
├── lib/                    # Core logic
│   ├── tool-registry.ts    # Tool definitions (source of truth)
│   ├── types.ts            # TypeScript types
│   ├── tools/              # Tool processors by category
│   └── utils/security/     # CORS/framing error detection
├── docs/                   # Documentation
└── public/                 # Static assets
```

---

## Contributing

**Contributions are welcome!** 🎉

We believe open source thrives on community participation. Whether you're fixing a bug, adding a feature, or improving documentation, your contribution matters.

### Ways to Contribute

- 🐛 **Report bugs** — Open an issue with reproduction steps
- 💡 **Suggest features** — We love new tool ideas
- 🔧 **Submit PRs** — Bug fixes, features, or improvements
- 📖 **Improve docs** — Typos, clarity, examples
- 🌍 **Translations** — Help make LocalGearbox accessible worldwide

### Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/sanmak/LocalGearbox.git`
3. **Create a branch**: `git checkout -b feature/my-feature`
4. **Make changes** and test locally
5. **Commit** with clear messages: `git commit -m "feat: add new tool"`
6. **Push** and open a **Pull Request**

### Adding a New Tool

1. Create processor in `lib/tools/[category]/`
2. Register in `lib/tool-registry.ts`
3. Create page in `app/tools/[tool-name]/page.tsx`
4. Follow the security checklist in `lib/tools/TEMPLATE.ts`

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## Security

Security is a core principle. See [SECURITY.md](./SECURITY.md) for:

- Security model and guarantees
- Reporting vulnerabilities
- Security best practices

---

## Support

- 📖 [Documentation](./docs/)
- 💬 [Discussions](https://github.com/sanmak/LocalGearbox/discussions)
- 🐛 [Issues](https://github.com/sanmak/LocalGearbox/issues)

---

## License

**MIT License** — See [LICENSE](./LICENSE) for details.

```
MIT License

Copyright (c) 2025 LocalGearbox Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## Acknowledgments

Built with love using:

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [React Resizable Panels](https://github.com/bvaughn/react-resizable-panels)

---

<p align="center">
  <strong>LocalGearbox</strong> — Developer tools engineered without compromise.
  <br>
  <sub>100% local-first • Zero tracking • WCAG accessible • MIT licensed</sub>
</p>
