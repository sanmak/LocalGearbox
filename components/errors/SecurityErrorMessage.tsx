/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
  Info,
  Shield,
  Lock,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export interface SecurityErrorMessageProps {
  type: 'cors' | 'x-frame-options' | 'csp' | 'network';
  title: string;
  message: string;
  reason: string;
  alternatives: Array<{
    title: string;
    description: string;
    icon?:
      | 'server'
      | 'package'
      | 'terminal'
      | 'settings'
      | 'external-link'
      | 'smartphone'
      | 'tablet'
      | 'camera';
  }>;
  learnMoreUrl: string;
  technicalDetails?: string;
  url?: string;
}

const iconMap = {
  cors: Lock,
  'x-frame-options': Shield,
  csp: Shield,
  network: XCircle,
};

const alternativeIconMap = {
  server: Shield,
  package: Info,
  terminal: AlertTriangle,
  settings: Info,
  'external-link': ExternalLink,
  smartphone: Info,
  tablet: Info,
  camera: Info,
};

const typeColors = {
  cors: 'border-orange-500/50 bg-orange-500/10',
  'x-frame-options': 'border-blue-500/50 bg-blue-500/10',
  csp: 'border-purple-500/50 bg-purple-500/10',
  network: 'border-red-500/50 bg-red-500/10',
};

const typeBadgeColors = {
  cors: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
  'x-frame-options': 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
  csp: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
  network: 'bg-red-500/20 text-red-700 dark:text-red-400',
};

export function SecurityErrorMessage({
  type,
  title,
  message,
  reason,
  alternatives,
  learnMoreUrl,
  technicalDetails,
  url,
}: SecurityErrorMessageProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const Icon = iconMap[type];

  const handleCopy = async () => {
    const errorText = `
${title}

${message}

Why: ${reason}

${technicalDetails || ''}

URL: ${url || 'N/A'}
    `.trim();

    await navigator.clipboard.writeText(errorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={`border-2 ${typeColors[type]}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-background/50 border">
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-xl">{title}</CardTitle>
                <Badge className={typeBadgeColors[type]} variant="outline">
                  {type === 'x-frame-options' ? 'Frame Blocked' : type.toUpperCase()}
                </Badge>
              </div>
              <CardDescription className="text-base">{message}</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            aria-label={copied ? 'Copied' : 'Copy error details'}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        {url && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Blocked URL:</p>
            <code className="text-xs break-all">{url}</code>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Why This Happened */}
        <div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            aria-expanded={showDetails}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-semibold text-sm">Why did this happen?</span>
            </div>
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showDetails && (
            <div className="mt-3 p-4 bg-muted/50 rounded-lg space-y-3">
              <p className="text-sm">{reason}</p>
              {technicalDetails && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold mb-2 text-muted-foreground">
                      Technical Details:
                    </p>
                    <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
                      {technicalDetails}
                    </pre>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Alternatives */}
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Recommended Alternatives
          </h3>
          <div className="grid gap-3">
            {alternatives.map((alt, index) => {
              const AltIcon = alt.icon ? alternativeIconMap[alt.icon] : Info;
              return (
                <div
                  key={index}
                  className="flex gap-3 p-4 bg-background border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="p-2 rounded bg-primary/10 h-fit">
                    <AltIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{alt.title}</h4>
                    <p className="text-xs text-muted-foreground">{alt.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Learn More */}
        <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Want to learn more about web security?</span>
          </div>
          <Link href={learnMoreUrl}>
            <Button variant="outline" size="sm" className="gap-2">
              Learn More <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
