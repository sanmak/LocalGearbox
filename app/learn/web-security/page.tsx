/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import Link from 'next/link';
import { AlertTriangle, Info, Lock, Shield, Terminal, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function WebSecurityEducationPage() {
  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold">Web Security Fundamentals</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Understanding browser security policies and why they matter for modern web development.
        </p>
      </div>

      <Separator />

      {/* Introduction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Why Web Security Matters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Web browsers implement multiple security policies to protect users from malicious
            websites and attacks. These security mechanisms are not obstacles - they are essential
            protections that every developer should understand and respect.
          </p>
          <div className="bg-muted p-4 rounded-lg border">
            <h4 className="font-semibold mb-2">Our Philosophy</h4>
            <p className="text-sm">
              LocalGearbox believes in education over circumvention. When a security policy blocks
              your request, we explain why it exists and provide legitimate alternatives rather than
              bypassing the protection.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="cors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cors">CORS</TabsTrigger>
          <TabsTrigger value="csp">CSP</TabsTrigger>
          <TabsTrigger value="framing">X-Frame-Options</TabsTrigger>
          <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
        </TabsList>

        {/* CORS Section */}
        <TabsContent value="cors" className="space-y-6">
          <Card id="cors">
            <CardHeader>
              <CardTitle>Cross-Origin Resource Sharing (CORS)</CardTitle>
              <CardDescription>
                Understanding why browsers block cross-origin requests and how to handle them
                properly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* What is CORS */}
              <div>
                <h3 className="text-lg font-semibold mb-3">What is CORS?</h3>
                <p className="mb-4">
                  CORS is a security mechanism that allows servers to specify which origins can
                  access their resources from a web browser. It builds on the Same-Origin Policy,
                  which by default prevents scripts from one origin from accessing resources on
                  another origin.
                </p>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="text-sm font-semibold">Same-Origin Policy Example:</p>
                  <code className="text-xs block">
                    https://example.com:443/page
                    <br />
                    ├─ Protocol: https
                    <br />
                    ├─ Domain: example.com
                    <br />
                    └─ Port: 443
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    All three must match for two URLs to be same-origin
                  </p>
                </div>
              </div>

              {/* Why CORS Exists */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Why Browsers Enforce CORS</h3>
                <div className="grid gap-3">
                  <div className="flex gap-3 p-3 bg-muted rounded-lg">
                    <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Prevent Credential Theft</p>
                      <p className="text-xs text-muted-foreground">
                        Without CORS, malicious sites could make authenticated requests to your bank
                        using your cookies
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-muted rounded-lg">
                    <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Protect User Data</p>
                      <p className="text-xs text-muted-foreground">
                        Prevents unauthorized access to private APIs and user information
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-muted rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Stop Unauthorized Actions</p>
                      <p className="text-xs text-muted-foreground">
                        Blocks scripts from performing actions on your behalf without permission
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Common CORS Errors */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Common CORS Error Messages</h3>
                <div className="space-y-3">
                  <div className="border rounded-lg p-4">
                    <code className="text-xs text-destructive block mb-2">
                      Access to fetch at &apos;https://api.example.com&apos; from origin
                      &apos;http://localhost:3000&apos; has been blocked by CORS policy
                    </code>
                    <p className="text-sm">
                      <strong>What it means:</strong> The API server hasn&apos;t configured CORS
                      headers to allow requests from your origin.
                    </p>
                  </div>
                </div>
              </div>

              {/* How to Fix CORS */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  How to Properly Handle CORS (Server-Side)
                </h3>
                <p className="mb-4">
                  If you control the API server, you can configure CORS headers to allow specific
                  origins:
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Node.js/Express Example:</p>
                  <code className="text-xs block">
                    {`app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://yourdomain.com');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  next();
});`}
                  </code>
                </div>
              </div>

              {/* What NOT to Do */}
              <div className="border-l-4 border-destructive bg-destructive/10 p-4 rounded-r-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-destructive mb-2">What NOT to Do</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Don&apos;t use server-side proxies to bypass CORS (security risk)</li>
                      <li>Don&apos;t set Access-Control-Allow-Origin: * on sensitive APIs</li>
                      <li>Don&apos;t disable CORS in production browsers (opens security holes)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CSP Section */}
        <TabsContent value="csp" className="space-y-6">
          <Card id="csp">
            <CardHeader>
              <CardTitle>Content Security Policy (CSP)</CardTitle>
              <CardDescription>
                A powerful defense against Cross-Site Scripting (XSS) and other injection attacks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* What is CSP */}
              <div>
                <h3 className="text-lg font-semibold mb-3">What is CSP?</h3>
                <p className="mb-4">
                  Content Security Policy is an added layer of security that helps detect and
                  mitigate certain types of attacks, including Cross-Site Scripting (XSS) and data
                  injection attacks.
                </p>
              </div>

              {/* How CSP Works */}
              <div>
                <h3 className="text-lg font-semibold mb-3">How CSP Protects Your Site</h3>
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div>
                    <p className="font-medium text-sm mb-1">script-src</p>
                    <p className="text-xs text-muted-foreground">
                      Controls which scripts can execute (prevents injected malicious scripts)
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="font-medium text-sm mb-1">frame-ancestors</p>
                    <p className="text-xs text-muted-foreground">
                      Controls which sites can embed your page in an iframe (prevents clickjacking)
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="font-medium text-sm mb-1">connect-src</p>
                    <p className="text-xs text-muted-foreground">
                      Controls which URLs the page can connect to via fetch, WebSocket, etc.
                    </p>
                  </div>
                </div>
              </div>

              {/* CSP Example */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Example CSP Header</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <code className="text-xs block">
                    {`Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  frame-ancestors 'none';`}
                  </code>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  This policy only allows resources from the same origin, blocks all framing, and
                  allows images from any HTTPS source.
                </p>
              </div>

              {/* Implementing CSP */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Implementing CSP in Your Apps</h3>
                <Tabs defaultValue="nextjs" className="w-full">
                  <TabsList>
                    <TabsTrigger value="nextjs">Next.js</TabsTrigger>
                    <TabsTrigger value="express">Express</TabsTrigger>
                    <TabsTrigger value="nginx">Nginx</TabsTrigger>
                  </TabsList>
                  <TabsContent value="nextjs" className="bg-muted p-4 rounded-lg">
                    <code className="text-xs block">
                      {`// next.config.js
async headers() {
  return [{
    source: '/(.*)',
    headers: [{
      key: 'Content-Security-Policy',
      value: "default-src 'self'; script-src 'self' 'unsafe-inline'"
    }]
  }]
}`}
                    </code>
                  </TabsContent>
                  <TabsContent value="express" className="bg-muted p-4 rounded-lg">
                    <code className="text-xs block">
                      {`app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'"
  );
  next();
});`}
                    </code>
                  </TabsContent>
                  <TabsContent value="nginx" className="bg-muted p-4 rounded-lg">
                    <code className="text-xs block">
                      {`add_header Content-Security-Policy
  "default-src 'self'; script-src 'self';" always;`}
                    </code>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* X-Frame-Options Section */}
        <TabsContent value="framing" className="space-y-6">
          <Card id="x-frame-options">
            <CardHeader>
              <CardTitle>X-Frame-Options & Clickjacking Protection</CardTitle>
              <CardDescription>
                Understanding why websites block iframe embedding and how to test responsively
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* What is Clickjacking */}
              <div>
                <h3 className="text-lg font-semibold mb-3">What is Clickjacking?</h3>
                <p className="mb-4">
                  Clickjacking is an attack where a malicious site tricks users into clicking on
                  something different from what they perceive, potentially performing unwanted
                  actions.
                </p>
                <div className="bg-muted p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2 text-sm">Attack Example:</h4>
                  <ol className="text-xs space-y-2 list-decimal list-inside">
                    <li>Attacker creates malicious site (evil.com)</li>
                    <li>Loads trusted site (bank.com) in invisible iframe with high z-index</li>
                    <li>Overlays fake &quot;Win a Prize&quot; button on top of iframe</li>
                    <li>
                      User clicks fake button, actually clicks &quot;Transfer Money&quot; in iframe
                    </li>
                    <li>User unknowingly authorizes transaction</li>
                  </ol>
                </div>
              </div>

              {/* X-Frame-Options Header */}
              <div>
                <h3 className="text-lg font-semibold mb-3">X-Frame-Options Header</h3>
                <div className="grid gap-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <code className="text-sm font-semibold">X-Frame-Options: DENY</code>
                    <p className="text-xs text-muted-foreground mt-1">
                      Page cannot be displayed in any iframe, even from same origin
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <code className="text-sm font-semibold">X-Frame-Options: SAMEORIGIN</code>
                    <p className="text-xs text-muted-foreground mt-1">
                      Page can only be framed by same origin
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <code className="text-sm font-semibold">
                      CSP: frame-ancestors &apos;none&apos;
                    </code>
                    <p className="text-xs text-muted-foreground mt-1">
                      Modern CSP alternative to X-Frame-Options DENY
                    </p>
                  </div>
                </div>
              </div>

              {/* Why Sites Block Framing */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Legitimate Reasons to Block Framing</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">
                      Banking
                    </Badge>
                    <p className="text-sm">
                      Prevent clickjacking attacks on financial transactions
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">
                      Social Media
                    </Badge>
                    <p className="text-sm">
                      Protect users from fake login pages and credential theft
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">
                      Government
                    </Badge>
                    <p className="text-sm">Prevent UI redressing attacks on official services</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">
                      E-commerce
                    </Badge>
                    <p className="text-sm">Protect checkout flows and payment information</p>
                  </div>
                </div>
              </div>

              {/* Setting Frame Protection */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Setting Frame Protection (Server-Side)
                </h3>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Next.js Example:</p>
                  <code className="text-xs block">
                    {`// next.config.js
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" }
    ]
  }]
}`}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alternatives Section */}
        <TabsContent value="alternatives" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Developer Alternatives & Best Practices</CardTitle>
              <CardDescription>
                Legitimate ways to test and develop without bypassing security policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Testing Alternatives */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Testing APIs (When CORS Blocks You)</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">Server-Side Requests</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use Node.js, Python, or any backend to make API calls. CORS only applies to
                      browsers.
                    </p>
                    <Badge variant="secondary">Recommended</Badge>
                  </div>

                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">Postman / Insomnia</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Desktop API clients that don&apos;t run in browser context, bypassing CORS
                      naturally.
                    </p>
                    <Badge variant="secondary">Popular Choice</Badge>
                  </div>

                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">curl / HTTPie</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Command-line HTTP clients for quick testing and automation scripts.
                    </p>
                    <Badge variant="outline">Developer Tool</Badge>
                  </div>

                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">Official SDKs</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Many APIs provide JavaScript SDKs that handle authentication and CORS
                      properly.
                    </p>
                    <Badge variant="outline">Best Practice</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Responsive Testing Alternatives */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Responsive Testing (When Framing is Blocked)
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold">Browser DevTools</h4>
                    <p className="text-sm text-muted-foreground">
                      Press F12 → Click device toolbar → Select device size. Built into Chrome,
                      Firefox, Safari, Edge.
                    </p>
                    <code className="text-xs">Ctrl+Shift+M (Windows) / Cmd+Shift+M (Mac)</code>
                  </div>

                  <div className="border rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold">Resize Browser Window</h4>
                    <p className="text-sm text-muted-foreground">
                      Open site in new tab and manually resize browser window to different viewport
                      sizes.
                    </p>
                    <Badge variant="secondary">Simple & Effective</Badge>
                  </div>

                  <div className="border rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold">Real Device Testing</h4>
                    <p className="text-sm text-muted-foreground">
                      Test on actual phones, tablets, and devices for most accurate results.
                    </p>
                    <Badge variant="outline">Production Testing</Badge>
                  </div>

                  <div className="border rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold">BrowserStack / LambdaTest</h4>
                    <p className="text-sm text-muted-foreground">
                      Cloud-based testing platforms with real browsers and devices.
                    </p>
                    <Badge variant="outline">Enterprise Solution</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* When Circumvention is Acceptable */}
              <div className="border-l-4 border-primary bg-primary/10 p-4 rounded-r-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-2">When Circumvention IS Acceptable</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Your own servers (you control both client and server)</li>
                      <li>
                        Authorized penetration testing (with written permission from site owner)
                      </li>
                      <li>CTF (Capture The Flag) challenges and security competitions</li>
                      <li>Educational security research in controlled environments</li>
                      <li>Development/testing environments (never production)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ethical Considerations */}
          <Card>
            <CardHeader>
              <CardTitle>Ethical Development Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex gap-3">
                  <Shield className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Respect Security Boundaries</h4>
                    <p className="text-sm text-muted-foreground">
                      If a website has set security headers, they did so intentionally. Respecting
                      these decisions is both ethical and legally important.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Understand Legal Implications</h4>
                    <p className="text-sm text-muted-foreground">
                      Bypassing security measures may violate Terms of Service, Computer Fraud and
                      Abuse Act (CFAA), or other laws. Always obtain authorization first.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Lock className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Educate, Don&apos;t Circumvent</h4>
                    <p className="text-sm text-muted-foreground">
                      Understanding why security policies exist makes you a better developer. Learn
                      the proper solutions rather than quick workarounds.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Back to Home
            </Link>
            <div className="flex gap-4">
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                MDN: CORS <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                MDN: CSP <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
