/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: TEXTS.metadata.homeTitle,
  description: TEXTS.metadata.homeDescription,
};
import { getAllToolsByCategory, TOOL_CATEGORIES, TOOLS } from '@/lib/tool-registry';
import { TEXTS } from '@/lib/constants/texts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Lock, Zap, Shield, Keyboard, Eye, Github, ChevronRight } from 'lucide-react';

export default function Home() {
  const toolsByCategory = getAllToolsByCategory();
  const totalTools = Object.values(toolsByCategory).reduce((sum, tools) => sum + tools.length, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Enterprise Focused */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="relative px-4 py-12 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-5xl">
            {/* Trust Badge */}
            <div className="flex justify-center mb-8">
              <Badge variant="secondary" className="px-4 py-1.5 text-xs font-medium">
                <Lock className="h-3 w-3 mr-1.5" />
                {TEXTS.home.hero.badge}
              </Badge>
            </div>

            {/* Main Headline */}
            <h1 className="text-center text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent">
                {TEXTS.home.hero.headlinePrefix}
              </span>
              <br />
              <span className="text-primary">{TEXTS.home.hero.headlineSuffix}</span>
            </h1>

            <p className="text-center text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              {TEXTS.home.hero.description.part1}
              <span className="text-foreground font-medium">
                {TEXTS.home.hero.description.part2}
              </span>
              {TEXTS.home.hero.description.part3}
              <span className="text-foreground font-medium">
                {TEXTS.home.hero.description.part4}
              </span>
              {TEXTS.home.hero.description.part5}
              <span className="text-foreground font-medium">
                {TEXTS.home.hero.description.part6}
              </span>
              {TEXTS.home.hero.description.part7}
              <span className="text-foreground font-medium">
                {TEXTS.home.hero.description.part8}
              </span>
              {TEXTS.home.hero.description.part9}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button size="lg" className="group" asChild>
                <Link href="#tools">
                  {TEXTS.home.hero.cta.explore(totalTools)}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a
                  href="https://github.com/sanmak/LocalGearbox"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="mr-2 h-4 w-4" />
                  {TEXTS.home.hero.cta.github}
                </a>
              </Button>
            </div>

            {/* Quick Stats Grid */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 max-w-4xl mx-auto">
              <div className="text-center p-4 rounded-lg border bg-card min-w-[140px] sm:min-w-[180px]">
                <div className="text-3xl font-bold text-primary mb-1">{totalTools}+</div>
                <div className="text-sm text-muted-foreground">{TEXTS.home.hero.stats.tools}</div>
              </div>
              <div className="text-center p-4 rounded-lg border bg-card min-w-[140px] sm:min-w-[180px]">
                <div className="text-3xl font-bold text-primary mb-1">100%</div>
                <div className="text-sm text-muted-foreground">
                  {TEXTS.home.hero.stats.localFirst}
                </div>
              </div>
              <div className="text-center p-4 rounded-lg border bg-card min-w-[140px] sm:min-w-[180px]">
                <div className="text-3xl font-bold text-primary mb-1">0</div>
                <div className="text-sm text-muted-foreground">
                  {TEXTS.home.hero.stats.trackers}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Features */}
      <section className="px-4 py-20 border-b">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              {TEXTS.home.features.badge}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{TEXTS.home.features.title}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {TEXTS.home.features.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-6 rounded-lg border bg-card hover:border-primary/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{TEXTS.home.features.items[0].title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {TEXTS.home.features.items[0].description}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-6 rounded-lg border bg-card hover:border-primary/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{TEXTS.home.features.items[1].title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {TEXTS.home.features.items[1].description}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-6 rounded-lg border bg-card hover:border-primary/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{TEXTS.home.features.items[2].title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {TEXTS.home.features.items[2].description}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-6 rounded-lg border bg-card hover:border-primary/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Keyboard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{TEXTS.home.features.items[3].title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {TEXTS.home.features.items[3].description}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-6 rounded-lg border bg-card hover:border-primary/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{TEXTS.home.features.items[4].title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {TEXTS.home.features.items[4].description}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-6 rounded-lg border bg-card hover:border-primary/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Github className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{TEXTS.home.features.items[5].title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {TEXTS.home.features.items[5].description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Tools - Redesigned */}
      <section id="tools" className="px-4 py-20 border-b">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-12">
            <div>
              <Badge variant="outline" className="mb-4">
                {TEXTS.home.popular.badge}
              </Badge>
              <h2 className="text-3xl font-bold">{TEXTS.home.popular.title}</h2>
              <p className="text-muted-foreground mt-2">{TEXTS.home.popular.subtitle}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'api-client',
              'json-formatter',
              'log-parser-playground',
              'responsive-tester',
              'dns-analysis',
              'rate-limit-backoff',
              'json-studio',
              'data-diff',
              'uuid-generator',
            ].map((toolId) => {
              const tool = TOOLS[toolId];
              if (!tool || tool.isDraft) return null;
              return (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.id}`}
                  className="group flex items-center justify-between p-4 rounded-lg border bg-card hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm group-hover:text-primary transition-colors block truncate">
                      {tool.name}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1 block truncate">
                      {tool.description}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all ml-3 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* All Tools by Category - Enhanced */}
      <section className="px-4 py-20 bg-muted/5">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              {TEXTS.home.allTools.badge}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {TEXTS.home.allTools.title(totalTools)}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {TEXTS.home.allTools.subtitle(Object.keys(TOOL_CATEGORIES).length)}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {Object.entries(toolsByCategory).map(([categoryId, tools]) => {
              if (tools.length === 0) return null;

              const category = TOOL_CATEGORIES[categoryId as keyof typeof TOOL_CATEGORIES];

              return (
                <div
                  key={categoryId}
                  className="group rounded-lg border bg-card p-6 hover:border-primary/40 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl group-hover:bg-primary/20 transition-colors">
                        {category.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {tools.length} {tools.length === 1 ? 'tool' : 'tools'} available
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {tools.length}
                    </Badge>
                  </div>

                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {tools.map((tool) => (
                      <Link
                        key={tool.id}
                        href={`/tools/${tool.id}`}
                        className="group/item flex items-center gap-2 px-3 py-2 rounded-md hover:bg-primary/5 transition-colors"
                      >
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover/item:text-primary transition-colors flex-shrink-0" />
                        <span className="text-sm text-muted-foreground group-hover/item:text-foreground transition-colors truncate">
                          {tool.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Stats Below Categories */}
          <div className="mt-16 pt-12 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-primary font-semibold mb-1">Formatters</div>
                <div className="text-sm text-muted-foreground">Beautify & minify code</div>
              </div>
              <div>
                <div className="text-primary font-semibold mb-1">Converters</div>
                <div className="text-sm text-muted-foreground">Transform between formats</div>
              </div>
              <div>
                <div className="text-primary font-semibold mb-1">Validators</div>
                <div className="text-sm text-muted-foreground">Verify data integrity</div>
              </div>
              <div>
                <div className="text-primary font-semibold mb-1">Generators</div>
                <div className="text-sm text-muted-foreground">Create test data</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="px-4 py-16 border-t bg-muted/20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-8 text-muted-foreground">
              {TEXTS.home.trust.title}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="text-2xl font-bold mb-1">{TEXTS.home.trust.stats[0].value}</div>
                <div className="text-sm text-muted-foreground">
                  {TEXTS.home.trust.stats[0].label}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold mb-1">{TEXTS.home.trust.stats[1].value}</div>
                <div className="text-sm text-muted-foreground">
                  {TEXTS.home.trust.stats[1].label}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold mb-1">{TEXTS.home.trust.stats[2].value}</div>
                <div className="text-sm text-muted-foreground">
                  {TEXTS.home.trust.stats[2].label}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold mb-1">{TEXTS.home.trust.stats[3].value}</div>
                <div className="text-sm text-muted-foreground">
                  {TEXTS.home.trust.stats[3].label}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 border-t">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{TEXTS.home.cta.title}</h2>
          <p className="text-lg text-muted-foreground mb-8">{TEXTS.home.cta.subtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="#tools">
                {TEXTS.home.cta.button}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a
                href="https://github.com/sanmak/LocalGearbox"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                {TEXTS.home.cta.github}
              </a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">{TEXTS.home.cta.footer}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/5">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">DT</span>
                </div>
                <span className="font-semibold text-lg">{TEXTS.metadata.siteName}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6 max-w-md leading-relaxed">
                {TEXTS.footer.brandDescription}
              </p>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://github.com/sanmak/LocalGearbox"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4 text-sm">{TEXTS.footer.links.quickLinks.title}</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="#tools"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {TEXTS.footer.links.quickLinks.browse}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tools/api-client"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {TEXTS.footer.links.quickLinks.apiClient}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tools/json-formatter"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {TEXTS.footer.links.quickLinks.jsonFormatter}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tools/dns-analysis"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {TEXTS.footer.links.quickLinks.dnsAnalysis}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold mb-4 text-sm">{TEXTS.footer.links.resources.title}</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="https://github.com/sanmak/LocalGearbox"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    {TEXTS.footer.links.resources.documentation}
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/sanmak/LocalGearbox/blob/main/SELF_HOSTING.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    {TEXTS.footer.links.resources.selfHosting}
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/sanmak/LocalGearbox/blob/main/DESIGN_SYSTEM.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    {TEXTS.footer.links.resources.designSystem}
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/sanmak/LocalGearbox/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    {TEXTS.footer.links.resources.license}
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {TEXTS.footer.bottom.copyright(new Date().getFullYear())}
              </p>
              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Lock className="h-3 w-3" />
                  <span>{TEXTS.footer.bottom.privacy}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  <span>{TEXTS.footer.bottom.accessibility}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  <span>{TEXTS.footer.bottom.response}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
