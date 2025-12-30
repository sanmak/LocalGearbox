/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { getTool } from '../../lib/tool-registry';
import SimpleLineChart from '../../components/SimpleLineChart';

const tool = getTool('rate-limit-backoff');

const STRATEGIES = [
  { value: 'exponential', label: 'Exponential' },
  { value: 'exponential-jitter', label: 'Exponential Jitter' },
  { value: 'equal', label: 'Equal' },
  { value: 'full-jitter', label: 'Full Jitter' },
  { value: 'decorrelated', label: 'Decorrelated' },
];

// Icons
const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ClearIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const CodeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
    />
  </svg>
);

const ShareIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
    />
  </svg>
);

export default function RateLimitBackoffPage() {
  // Get initial params from URL query parameters
  const getInitialParams = () => {
    if (typeof window === 'undefined')
      return {
        requestsPerWindow: 10,
        windowSeconds: 60,
        retryType: 'equal',
        baseDelayMs: 1000,
        maxRetries: 5,
        maxDelayMs: 32000,
        burstFactor: 1,
        distribution: 'uniform',
      };

    const urlParams = new URLSearchParams(window.location.search);
    return {
      requestsPerWindow: 10,
      windowSeconds: 60,
      retryType: urlParams.get('strategy') || 'equal',
      baseDelayMs: Number(urlParams.get('base')) || 1000,
      maxRetries: Number(urlParams.get('retries')) || 5,
      maxDelayMs: Number(urlParams.get('maxDelay')) || 32000,
      burstFactor: 1,
      distribution: 'uniform',
    };
  };

  const [params, setParams] = useState(getInitialParams());
  const [output, setOutput] = useState<string>('');
  const [unit, setUnit] = useState<'seconds' | 'milliseconds'>('seconds');
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [codeCopied, setCodeCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (field: string, value: any) => {
    setParams((prev) => ({ ...prev, [field]: value }));
  };

  const handleProcess = useCallback(async () => {
    if (!tool) {
      setOutput('');
      return;
    }
    setLoading(true);
    try {
      const result = await tool.process(JSON.stringify(params));
      setOutput(result);
    } catch (e: any) {
      setOutput('');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const handleClear = useCallback(() => {
    const defaultParams = {
      requestsPerWindow: 10,
      windowSeconds: 60,
      retryType: 'equal',
      baseDelayMs: 1000,
      maxRetries: 5,
      maxDelayMs: 32000,
      burstFactor: 1,
      distribution: 'uniform',
    };
    setParams(defaultParams);

    // Reset URL to default
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Auto-process on param change with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      handleProcess();
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [params, handleProcess]);

  // Update URL when params change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    url.searchParams.set('base', params.baseDelayMs.toString());
    url.searchParams.set('retries', params.maxRetries.toString());
    url.searchParams.set('strategy', params.retryType);
    if (params.maxDelayMs) {
      url.searchParams.set('maxDelay', params.maxDelayMs.toString());
    } else {
      url.searchParams.delete('maxDelay');
    }

    // Only update if the URL actually changed
    if (url.toString() !== window.location.href) {
      window.history.replaceState({}, '', url.toString());
    }
  }, [params]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [output]);

  const generateCode = useCallback(
    (language: string) => {
      const baseDelay = params.baseDelayMs;
      const maxRetries = params.maxRetries;
      const maxDelay = params.maxDelayMs || 'Infinity';
      const strategy = params.retryType;

      switch (language) {
        case 'javascript':
          return `// Exponential Backoff Implementation
// Strategy: ${strategy}
// Base Delay: ${baseDelay}ms
// Max Retries: ${maxRetries}
// Max Delay: ${maxDelay === 'Infinity' ? 'unlimited' : maxDelay + 'ms'}

async function retryWithBackoff(fn, options = {}) {
  const {
    baseDelay = ${baseDelay},
    maxRetries = ${maxRetries},
    maxDelay = ${maxDelay},
    strategy = '${strategy}'
  } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      let delay = baseDelay;
      switch (strategy) {
        case 'exponential':
          delay = baseDelay * Math.pow(2, attempt);
          break;
        case 'exponential-jitter':
          delay = Math.floor(Math.random() * baseDelay * Math.pow(2, attempt));
          break;
        case 'equal':
          delay = baseDelay;
          break;
        case 'full-jitter':
          delay = Math.floor(Math.random() * baseDelay);
          break;
        case 'decorrelated':
          delay = Math.min(maxDelay, Math.floor(Math.random() * (attempt === 0 ? baseDelay : delay * 3)));
          break;
      }

      delay = Math.min(delay, maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage example:
retryWithBackoff(() => fetch('/api/data'), {
  baseDelay: ${baseDelay},
  maxRetries: ${maxRetries},
  maxDelay: ${maxDelay},
  strategy: '${strategy}'
});`;

        case 'typescript':
          return `// Exponential Backoff Implementation
// Strategy: ${strategy}
// Base Delay: ${baseDelay}ms
// Max Retries: ${maxRetries}
// Max Delay: ${maxDelay === 'Infinity' ? 'unlimited' : maxDelay + 'ms'}

interface RetryOptions {
  baseDelay?: number;
  maxRetries?: number;
  maxDelay?: number;
  strategy?: '${strategy}';
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    baseDelay = ${baseDelay},
    maxRetries = ${maxRetries},
    maxDelay = ${maxDelay},
    strategy = '${strategy}'
  } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      let delay = baseDelay;
      switch (strategy) {
        case 'exponential':
          delay = baseDelay * Math.pow(2, attempt);
          break;
        case 'exponential-jitter':
          delay = Math.floor(Math.random() * baseDelay * Math.pow(2, attempt));
          break;
        case 'equal':
          delay = baseDelay;
          break;
        case 'full-jitter':
          delay = Math.floor(Math.random() * baseDelay);
          break;
        case 'decorrelated':
          delay = Math.min(maxDelay, Math.floor(Math.random() * (attempt === 0 ? baseDelay : delay * 3)));
          break;
      }

      delay = Math.min(delay, maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage example:
const result = await retryWithBackoff(() => fetch('/api/data'), {
  baseDelay: ${baseDelay},
  maxRetries: ${maxRetries},
  maxDelay: ${maxDelay},
  strategy: '${strategy}'
});`;

        case 'python':
          return `# Exponential Backoff Implementation
# Strategy: ${strategy}
# Base Delay: ${baseDelay}ms
# Max Retries: ${maxRetries}
# Max Delay: ${maxDelay === 'Infinity' ? 'unlimited' : maxDelay + 'ms'}

import asyncio
import random
import time

async def retry_with_backoff(func, base_delay=${baseDelay}, max_retries=${maxRetries}, max_delay=${maxDelay}, strategy='${strategy}'):
    for attempt in range(max_retries + 1):
        try:
            return await func()
        except Exception as error:
            if attempt == max_retries:
                raise error

            delay = base_delay
            if strategy == 'exponential':
                delay = base_delay * (2 ** attempt)
            elif strategy == 'exponential-jitter':
                delay = random.randint(0, int(base_delay * (2 ** attempt)))
            elif strategy == 'equal':
                delay = base_delay
            elif strategy == 'full-jitter':
                delay = random.randint(0, base_delay)
            elif strategy == 'decorrelated':
                prev_delay = base_delay if attempt == 0 else delay
                delay = random.randint(0, int(prev_delay * 3))

            delay = min(delay, max_delay) / 1000  # Convert to seconds
            await asyncio.sleep(delay)

# Usage example:
async def fetch_data():
    # Your API call here
    pass

result = await retry_with_backoff(fetch_data)`;

        case 'go':
          return `// Exponential Backoff Implementation
// Strategy: ${strategy}
// Base Delay: ${baseDelay}ms
// Max Retries: ${maxRetries}
// Max Delay: ${maxDelay === 'Infinity' ? 'unlimited' : maxDelay + 'ms'}

package main

import (
    "fmt"
    "math"
    "math/rand"
    "time"
)

type RetryOptions struct {
    BaseDelay  time.Duration
    MaxRetries int
    MaxDelay   time.Duration
    Strategy   string
}

func retryWithBackoff(fn func() error, options RetryOptions) error {
    baseDelay := options.BaseDelay
    if baseDelay == 0 {
        baseDelay = ${baseDelay} * time.Millisecond
    }
    maxRetries := options.MaxRetries
    if maxRetries == 0 {
        maxRetries = ${maxRetries}
    }
    maxDelay := options.MaxDelay
    if maxDelay == 0 {
        maxDelay = ${maxDelay} * time.Millisecond
    }
    strategy := options.Strategy
    if strategy == "" {
        strategy = "${strategy}"
    }

    for attempt := 0; attempt <= maxRetries; attempt++ {
        err := fn()
        if err == nil {
            return nil
        }
        if attempt == maxRetries {
            return err
        }

        var delay time.Duration
        switch strategy {
        case "exponential":
            delay = time.Duration(float64(baseDelay) * math.Pow(2, float64(attempt)))
        case "exponential-jitter":
            maxJitter := float64(baseDelay) * math.Pow(2, float64(attempt))
            delay = time.Duration(rand.Float64() * maxJitter)
        case "equal":
            delay = baseDelay
        case "full-jitter":
            delay = time.Duration(rand.Float64() * float64(baseDelay))
        case "decorrelated":
            prevDelay := baseDelay
            if attempt > 0 {
                prevDelay = delay
            }
            delay = time.Duration(rand.Float64() * float64(prevDelay) * 3)
        }

        if delay > maxDelay {
            delay = maxDelay
        }

        time.Sleep(delay)
    }
    return nil
}

func main() {
    err := retryWithBackoff(func() error {
        // Your API call here
        return fmt.Errorf("simulated error")
    }, RetryOptions{})

    if err != nil {
        fmt.Println("All retries failed:", err)
    }
}`;

        case 'csharp':
          return `// Exponential Backoff Implementation
// Strategy: ${strategy}
// Base Delay: ${baseDelay}ms
// Max Retries: ${maxRetries}
// Max Delay: ${maxDelay === 'Infinity' ? 'unlimited' : maxDelay + 'ms'}

using System;
using System.Threading.Tasks;

public class RetryHelper
{
    public static async Task<T> RetryWithBackoff<T>(
        Func<Task<T>> func,
        int baseDelay = ${baseDelay},
        int maxRetries = ${maxRetries},
        int maxDelay = ${maxDelay === 'Infinity' ? 'int.MaxValue' : maxDelay},
        string strategy = "${strategy}")
    {
        Random random = new Random();

        for (int attempt = 0; attempt <= maxRetries; attempt++)
        {
            try
            {
                return await func();
            }
            catch (Exception error)
            {
                if (attempt == maxRetries) throw error;

                int delay = baseDelay;
                switch (strategy)
                {
                    case "exponential":
                        delay = baseDelay * (int)Math.Pow(2, attempt);
                        break;
                    case "exponential-jitter":
                        delay = random.Next(0, baseDelay * (int)Math.Pow(2, attempt));
                        break;
                    case "equal":
                        delay = baseDelay;
                        break;
                    case "full-jitter":
                        delay = random.Next(0, baseDelay);
                        break;
                    case "decorrelated":
                        int prevDelay = attempt == 0 ? baseDelay : delay;
                        delay = random.Next(0, prevDelay * 3);
                        break;
                }

                delay = Math.Min(delay, maxDelay);
                await Task.Delay(delay);
            }
        }

        throw new InvalidOperationException("Should not reach here");
    }
}

// Usage example:
public async Task ExampleUsage()
{
    var result = await RetryHelper.RetryWithBackoff(
        async () => {
            // Your API call here
            using var client = new HttpClient();
            return await client.GetStringAsync("https://api.example.com/data");
        },
        baseDelay: ${baseDelay},
        maxRetries: ${maxRetries},
        maxDelay: ${maxDelay},
        strategy: "${strategy}"
    );
}`;

        case 'java':
          return `// Exponential Backoff Implementation
// Strategy: ${strategy}
// Base Delay: ${baseDelay}ms
// Max Retries: ${maxRetries}
// Max Delay: ${maxDelay === 'Infinity' ? 'unlimited' : maxDelay + 'ms'}

import java.util.Random;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

public class RetryHelper {

    public static <T> CompletableFuture<T> retryWithBackoff(
            java.util.function.Supplier<CompletableFuture<T>> func,
            int baseDelay,
            int maxRetries,
            int maxDelay,
            String strategy) {

        baseDelay = baseDelay > 0 ? baseDelay : ${baseDelay};
        maxRetries = maxRetries > 0 ? maxRetries : ${maxRetries};
        maxDelay = maxDelay > 0 ? maxDelay : ${
          maxDelay === 'Infinity' ? 'Integer.MAX_VALUE' : maxDelay
        };
        strategy = strategy != null ? strategy : "${strategy}";

        Random random = new Random();

        return CompletableFuture.supplyAsync(() -> {
            for (int attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    return func.get().get();
                } catch (Exception error) {
                    if (attempt == maxRetries) {
                        throw new RuntimeException(error);
                    }

                    int delay = baseDelay;
                    switch (strategy) {
                        case "exponential":
                            delay = baseDelay * (int) Math.pow(2, attempt);
                            break;
                        case "exponential-jitter":
                            delay = random.nextInt(baseDelay * (int) Math.pow(2, attempt));
                            break;
                        case "equal":
                            delay = baseDelay;
                            break;
                        case "full-jitter":
                            delay = random.nextInt(baseDelay);
                            break;
                        case "decorrelated":
                            int prevDelay = attempt == 0 ? baseDelay : delay;
                            delay = random.nextInt(prevDelay * 3);
                            break;
                    }

                    delay = Math.min(delay, maxDelay);

                    try {
                        Thread.sleep(delay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException(ie);
                    }
                }
            }
            throw new RuntimeException("Should not reach here");
        });
    }

    // Usage example:
    public static void main(String[] args) {
        retryWithBackoff(
            () -> {
                // Your API call here
                return CompletableFuture.supplyAsync(() -> "API Response");
            },
            ${baseDelay},
            ${maxRetries},
            ${maxDelay},
            "${strategy}"
        ).thenAccept(System.out::println);
    }
}`;

        case 'php':
          return `<?php
// Exponential Backoff Implementation
// Strategy: ${strategy}
// Base Delay: ${baseDelay}ms
// Max Retries: ${maxRetries}
// Max Delay: ${maxDelay === 'Infinity' ? 'unlimited' : maxDelay + 'ms'}

class RetryHelper
{
    public static function retryWithBackoff(
        callable $func,
        int $baseDelay = ${baseDelay},
        int $maxRetries = ${maxRetries},
        int $maxDelay = ${maxDelay === 'Infinity' ? 'PHP_INT_MAX' : maxDelay},
        string $strategy = '${strategy}'
    ) {
        for ($attempt = 0; $attempt <= $maxRetries; $attempt++) {
            try {
                return $func();
            } catch (Exception $error) {
                if ($attempt === $maxRetries) {
                    throw $error;
                }

                $delay = $baseDelay;
                switch ($strategy) {
                    case 'exponential':
                        $delay = $baseDelay * pow(2, $attempt);
                        break;
                    case 'exponential-jitter':
                        $delay = rand(0, $baseDelay * pow(2, $attempt));
                        break;
                    case 'equal':
                        $delay = $baseDelay;
                        break;
                    case 'full-jitter':
                        $delay = rand(0, $baseDelay);
                        break;
                    case 'decorrelated':
                        $prevDelay = $attempt === 0 ? $baseDelay : $delay;
                        $delay = rand(0, $prevDelay * 3);
                        break;
                }

                $delay = min($delay, $maxDelay);
                usleep($delay * 1000); // Convert to microseconds
            }
        }

        throw new RuntimeException('Should not reach here');
    }
}

// Usage example:
try {
    $result = RetryHelper::retryWithBackoff(
        function() {
            // Your API call here
            return file_get_contents('https://api.example.com/data');
        },
        ${baseDelay},
        ${maxRetries},
        ${maxDelay},
        '${strategy}'
    );
    echo $result;
} catch (Exception $e) {
    echo "All retries failed: " . $e->getMessage();
}
?>`;

        case 'ruby':
          return `# Exponential Backoff Implementation
# Strategy: ${strategy}
# Base Delay: ${baseDelay}ms
# Max Retries: ${maxRetries}
// Max Delay: ${maxDelay === 'Infinity' ? 'unlimited' : maxDelay + 'ms'}

require 'net/http'
require 'json'

class RetryHelper
  def self.retry_with_backoff(
    func,
    base_delay: ${baseDelay},
    max_retries: ${maxRetries},
    max_delay: ${maxDelay === 'Infinity' ? 'Float::INFINITY' : maxDelay},
    strategy: '${strategy}'
  )
    (0..max_retries).each do |attempt|
      begin
        return func.call
      rescue => error
        raise error if attempt == max_retries

        delay = base_delay
        case strategy
        when 'exponential'
          delay = base_delay * (2 ** attempt)
        when 'exponential-jitter'
          delay = rand(0..(base_delay * (2 ** attempt)))
        when 'equal'
          delay = base_delay
        when 'full-jitter'
          delay = rand(0..base_delay)
        when 'decorrelated'
          prev_delay = attempt == 0 ? base_delay : delay
          delay = rand(0..(prev_delay * 3))
        end

        delay = [delay, max_delay].min
        sleep(delay / 1000.0) # Convert to seconds
      end
    end
  end
end

# Usage example:
result = RetryHelper.retry_with_backoff(
  -> {
    # Your API call here
    uri = URI('https://api.example.com/data')
    response = Net::HTTP.get(uri)
    JSON.parse(response)
  },
  base_delay: ${baseDelay},
  max_retries: ${maxRetries},
  max_delay: ${maxDelay},
  strategy: '${strategy}'
)`;

        case 'rust':
          return `// Exponential Backoff Implementation
// Strategy: ${strategy}
// Base Delay: ${baseDelay}ms
// Max Retries: ${maxRetries}
// Max Delay: ${maxDelay === 'Infinity' ? 'unlimited' : maxDelay + 'ms'}

use std::time::Duration;
use tokio::time::sleep;
use rand::Rng;

#[derive(Clone)]
pub struct RetryOptions {
    pub base_delay: u64,
    pub max_retries: usize,
    pub max_delay: u64,
    pub strategy: String,
}

impl Default for RetryOptions {
    fn default() -> Self {
        Self {
            base_delay: ${baseDelay},
            max_retries: ${maxRetries},
            max_delay: ${maxDelay === 'Infinity' ? 'u64::MAX' : maxDelay},
            strategy: "${strategy}".to_string(),
        }
    }
}

pub async fn retry_with_backoff<F, Fut, T>(
    mut func: F,
    options: RetryOptions,
) -> Result<T, Box<dyn std::error::Error + Send + Sync>>
where
    F: FnMut() -> Fut,
    Fut: std::future::Future<Output = Result<T, Box<dyn std::error::Error + Send + Sync>>>,
{
    let mut rng = rand::thread_rng();

    for attempt in 0..=options.max_retries {
        match func().await {
            Ok(result) => return Ok(result),
            Err(error) => {
                if attempt == options.max_retries {
                    return Err(error);
                }

                let mut delay = options.base_delay;
                match options.strategy.as_str() {
                    "exponential" => {
                        delay = options.base_delay * (1 << attempt);
                    }
                    "exponential-jitter" => {
                        let max_jitter = options.base_delay * (1 << attempt);
                        delay = rng.gen_range(0..max_jitter);
                    }
                    "equal" => {
                        delay = options.base_delay;
                    }
                    "full-jitter" => {
                        delay = rng.gen_range(0..options.base_delay);
                    }
                    "decorrelated" => {
                        let prev_delay = if attempt == 0 { options.base_delay } else { delay };
                        delay = rng.gen_range(0..(prev_delay * 3));
                    }
                    _ => {}
                }

                delay = delay.min(options.max_delay);
                sleep(Duration::from_millis(delay)).await;
            }
        }
    }

    unreachable!()
}

// Usage example:
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let result = retry_with_backoff(
        || async {
            // Your API call here
            Ok("API Response".to_string())
        },
        RetryOptions::default(),
    ).await?;

    println!("{}", result);
    Ok(())
}`;

        case 'swift':
          return `// Exponential Backoff Implementation
// Strategy: ${strategy}
// Base Delay: ${baseDelay}ms
// Max Retries: ${maxRetries}
// Max Delay: ${maxDelay === 'Infinity' ? 'unlimited' : maxDelay + 'ms'}

import Foundation

struct RetryOptions {
    var baseDelay: UInt64 = ${baseDelay}
    var maxRetries: Int = ${maxRetries}
    var maxDelay: UInt64 = ${maxDelay === 'Infinity' ? 'UInt64.max' : maxDelay}
    var strategy: String = "${strategy}"
}

func retryWithBackoff<T>(
    _ operation: @escaping () async throws -> T,
    options: RetryOptions = RetryOptions()
) async throws -> T {
    for attempt in 0...options.maxRetries {
        do {
            return try await operation()
        } catch {
            if attempt == options.maxRetries {
                throw error
            }

            var delay = options.baseDelay
            switch options.strategy {
            case "exponential":
                delay = options.baseDelay * UInt64(1 << attempt)
            case "exponential-jitter":
                let maxJitter = options.baseDelay * UInt64(1 << attempt)
                delay = UInt64.random(in: 0...maxJitter)
            case "equal":
                delay = options.baseDelay
            case "full-jitter":
                delay = UInt64.random(in: 0...options.baseDelay)
            case "decorrelated":
                let prevDelay = attempt == 0 ? options.baseDelay : delay
                delay = UInt64.random(in: 0...(prevDelay * 3))
            default:
                break
            }

            delay = min(delay, options.maxDelay)
            try await Task.sleep(nanoseconds: delay * 1_000_000) // Convert to nanoseconds
        }
    }

    fatalError("Should not reach here")
}

// Usage example:
Task {
    do {
        let result = try await retryWithBackoff({
            // Your API call here
            return "API Response"
        }, options: RetryOptions(
            baseDelay: ${baseDelay},
            maxRetries: ${maxRetries},
            maxDelay: ${maxDelay},
            strategy: "${strategy}"
        ))
        print(result)
    } catch {
        print("All retries failed: \\(error)")
    }
}`;

        case 'kotlin':
          return `// Exponential Backoff Implementation
// Strategy: ${strategy}
// Base Delay: ${baseDelay}ms
// Max Retries: ${maxRetries}
// Max Delay: ${maxDelay === 'Infinity' ? 'unlimited' : maxDelay + 'ms'}

import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlin.random.Random

data class RetryOptions(
    val baseDelay: Long = ${baseDelay}L,
    val maxRetries: Int = ${maxRetries},
    val maxDelay: Long = ${maxDelay === 'Infinity' ? 'Long.MAX_VALUE' : maxDelay}L,
    val strategy: String = "${strategy}"
)

suspend fun <T> retryWithBackoff(
    operation: suspend () -> T,
    options: RetryOptions = RetryOptions()
): T {
    for (attempt in 0..options.maxRetries) {
        try {
            return operation()
        } catch (error: Exception) {
            if (attempt == options.maxRetries) {
                throw error
            }

            var delay = options.baseDelay
            when (options.strategy) {
                "exponential" -> {
                    delay = options.baseDelay * (1L shl attempt)
                }
                "exponential-jitter" -> {
                    val maxJitter = options.baseDelay * (1L shl attempt)
                    delay = Random.nextLong(0, maxJitter)
                }
                "equal" -> {
                    delay = options.baseDelay
                }
                "full-jitter" -> {
                    delay = Random.nextLong(0, options.baseDelay)
                }
                "decorrelated" -> {
                    val prevDelay = if (attempt == 0) options.baseDelay else delay
                    delay = Random.nextLong(0, prevDelay * 3)
                }
            }

            delay = minOf(delay, options.maxDelay)
            delay(delay)
        }
    }

    error("Should not reach here")
}

// Usage example:
fun main() = runBlocking {
    try {
        val result = retryWithBackoff(
            operation = {
                // Your API call here
                "API Response"
            },
            options = RetryOptions(
                baseDelay = ${baseDelay}L,
                maxRetries = ${maxRetries},
                maxDelay = ${maxDelay}L,
                strategy = "${strategy}"
            )
        )
        println(result)
    } catch (e: Exception) {
        println("All retries failed: $e")
    }
}`;

        default:
          return `// Unsupported language: ${language}`;
      }
    },
    [params],
  );

  const handleCopyCode = useCallback(async () => {
    const code = generateCode(selectedLanguage);
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [selectedLanguage, generateCode]);

  const handleExportCode = useCallback(() => {
    setShowExportModal(true);
  }, []);

  const handleShare = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('base', params.baseDelayMs.toString());
    url.searchParams.set('retries', params.maxRetries.toString());
    url.searchParams.set('strategy', params.retryType);
    if (params.maxDelayMs) {
      url.searchParams.set('maxDelay', params.maxDelayMs.toString());
    } else {
      url.searchParams.delete('maxDelay');
    }
    navigator.clipboard.writeText(url.toString());
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }, [params]);

  if (!tool) return <div>Tool not found</div>;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-background">
      {/* Tool Header */}
      <div className="flex-shrink-0 border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-text-primary">{tool.name}</h1>
            {loading && (
              <div className="flex items-center gap-1.5 text-xs text-accent">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                <span>Processing...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-text-tertiary">
              <kbd>⌘</kbd>
              <span>+</span>
              <kbd>Enter</kbd>
              <span className="mx-1">to process</span>
              <kbd>⌘</kbd>
              <span>+</span>
              <kbd>K</kbd>
              <span>to clear</span>
            </span>
          </div>
        </div>
        <p className="mt-1 text-sm text-text-secondary">{tool.description}</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 p-3 gap-3">
        {/* Parameters Panel */}
        <div className="flex-1 flex flex-col panel min-h-[300px] lg:min-h-0">
          <div className="panel-header">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Parameters
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary rounded transition-colors"
                title="Reset parameters (⌘K)"
              >
                <ClearIcon />
              </button>
            </div>
          </div>
          <div className="flex-1 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="baseDelayMs">
                  Base Interval (ms)
                </label>
                <input
                  id="baseDelayMs"
                  type="number"
                  min={1}
                  max={60000}
                  className="bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50 w-full"
                  value={params.baseDelayMs}
                  onChange={(e) => handleChange('baseDelayMs', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="maxRetries">
                  Max Retries
                </label>
                <input
                  id="maxRetries"
                  type="number"
                  min={1}
                  max={20}
                  className="bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50 w-full"
                  value={params.maxRetries}
                  onChange={(e) => handleChange('maxRetries', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="retryType">
                  Jitter Strategy
                </label>
                <select
                  id="retryType"
                  className="bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50 w-full"
                  value={params.retryType}
                  onChange={(e) => handleChange('retryType', e.target.value)}
                >
                  {STRATEGIES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="maxDelayMs">
                  Max Delay (ms) - Optional
                </label>
                <input
                  id="maxDelayMs"
                  type="number"
                  min={1}
                  className="bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50 w-full"
                  value={params.maxDelayMs}
                  onChange={(e) => handleChange('maxDelayMs', Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded transition-colors flex items-center gap-2"
                onClick={handleExportCode}
              >
                <CodeIcon />
                <span>Export Code</span>
              </button>
              <button
                type="button"
                className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded transition-colors flex items-center gap-2"
                onClick={handleShare}
              >
                <ShareIcon />
                <span>{shareCopied ? 'Share link copied!' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Visualization Panel */}
        <div className="flex-1 flex flex-col panel min-h-[300px] lg:min-h-0">
          <div className="panel-header">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Visualization
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                disabled={!output}
                className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Copy output JSON"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {(() => {
              let parsed: any = null;
              try {
                parsed = JSON.parse(output);
              } catch {}
              if (!parsed || !parsed.retryEvents) {
                return (
                  <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
                    {loading ? 'Calculating...' : 'Adjust parameters to see visualization'}
                  </div>
                );
              }

              const x = parsed.retryEvents.map((e: any) => e.attempt);
              const minLine = parsed.retryEvents.map((_: any, i: number) => {
                return (params.baseDelayMs * Math.pow(2, i)) / (unit === 'seconds' ? 1000 : 1);
              });
              const maxLine = parsed.retryEvents.map((e: any) => {
                return (
                  (params.maxDelayMs ? Math.min(params.maxDelayMs, e.delayMs) : e.delayMs) /
                  (unit === 'seconds' ? 1000 : 1)
                );
              });
              const simLine = parsed.retryEvents.map(
                (e: any) => e.delayMs / (unit === 'seconds' ? 1000 : 1),
              );

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-end">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Units:</span>
                      <select
                        className="bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50 w-32"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as any)}
                      >
                        <option value="seconds">Seconds</option>
                        <option value="milliseconds">Milliseconds</option>
                      </select>
                    </div>
                  </div>
                  <SimpleLineChart
                    x={x}
                    lines={[
                      {
                        label: 'Minimum Delay',
                        color: '#f87171',
                        data: minLine,
                      },
                      { label: 'Max Delay', color: '#34d399', data: maxLine },
                      {
                        label: 'Simulated Delay',
                        color: '#6366f1',
                        data: simLine,
                      },
                    ]}
                    xLabel="Attempt"
                    yLabel={`Delay (${unit})`}
                    height={250}
                    width={480}
                  />
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border border-border rounded shadow-sm">
                      <thead className="bg-surface-secondary">
                        <tr>
                          <th className="px-3 py-2 border-b text-left">Attempt</th>
                          <th className="px-3 py-2 border-b text-left">Min ({unit})</th>
                          <th className="px-3 py-2 border-b text-left">Max ({unit})</th>
                          <th className="px-3 py-2 border-b text-left">Simulated ({unit})</th>
                          <th className="px-3 py-2 border-b text-left">Elapsed ({unit})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsed.retryEvents.map((e: any, i: number) => {
                          const min =
                            (params.baseDelayMs * Math.pow(2, i)) / (unit === 'seconds' ? 1000 : 1);
                          const max =
                            (params.maxDelayMs
                              ? Math.min(params.maxDelayMs, e.delayMs)
                              : e.delayMs) / (unit === 'seconds' ? 1000 : 1);
                          const sim = e.delayMs / (unit === 'seconds' ? 1000 : 1);
                          const elapsed =
                            parsed.retryEvents
                              .slice(0, i + 1)
                              .reduce((sum: number, ev: any) => sum + ev.delayMs, 0) /
                            (unit === 'seconds' ? 1000 : 1);
                          return (
                            <tr key={i} className="even:bg-surface">
                              <td className="px-3 py-2">{e.attempt}</td>
                              <td className="px-3 py-2">{min.toFixed(2)}</td>
                              <td className="px-3 py-2">{max.toFixed(2)}</td>
                              <td className="px-3 py-2">{sim.toFixed(2)}</td>
                              <td className="px-3 py-2">{elapsed.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="flex-shrink-0 px-4 py-2 border-t border-border flex items-center justify-between">
            <span className="text-xs text-text-tertiary">
              {output.length.toLocaleString()} chars
            </span>
            {copied && <span className="text-xs text-success font-medium">Copied!</span>}
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="flex-shrink-0 border-t border-border bg-surface-secondary/50 px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Understanding Exponential Backoff & Rate Limiting
            </h2>
            <p className="text-text-secondary">
              Learn how to handle failures gracefully in computer systems
            </p>
          </div>

          {/* What is Exponential Backoff */}
          <div className="bg-surface rounded-lg p-6 border border-border">
            <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span className="text-2xl">🤔</span>
              What is Exponential Backoff?
            </h3>
            <div className="space-y-4 text-text-secondary">
              <p className="text-lg">
                <strong>
                  Imagine you&apos;re trying to call your friend on the phone, but they&apos;re busy
                  and not answering.
                </strong>
              </p>
              <p>
                Instead of calling them every second (&ldquo;Are you free yet? Are you free
                yet?&rdquo;), you wait a little longer each time. First you wait 1 second, then 2
                seconds, then 4 seconds, then 8 seconds... This is exponential backoff!
              </p>
              <p>
                In computer terms: When a service fails (like an API call), instead of immediately
                retrying, the system waits longer and longer between attempts. This prevents
                overwhelming the failing service and gives it time to recover.
              </p>
              <div className="bg-accent/10 border border-accent/20 rounded p-4">
                <p className="font-medium text-accent mb-2">Why is this important?</p>
                <ul className="space-y-1 text-sm">
                  <li>
                    • Prevents &ldquo;thundering herd&rdquo; problems where many systems retry at
                    the same time
                  </li>
                  <li>• Gives failing services time to recover</li>
                  <li>• Reduces server load during outages</li>
                  <li>• Makes systems more resilient and polite</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Jitter Strategies */}
          <div className="bg-surface rounded-lg p-6 border border-border">
            <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span className="text-2xl">🎲</span>
              Jitter Strategies: Adding Randomness
            </h3>
            <div className="space-y-6">
              <p className="text-text-secondary">
                Pure exponential backoff has a problem: everyone waits the same amount of time, so
                they all retry at the same moment! Jitter adds randomness to prevent this
                &ldquo;retry storm&rdquo;.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* No Jitter */}
                <div className="border border-border rounded p-4">
                  <h4 className="font-semibold text-text-primary mb-2">❌ No Jitter (Basic)</h4>
                  <p className="text-sm text-text-secondary mb-3">
                    Everyone waits exactly the same time: 1s, 2s, 4s, 8s...
                  </p>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                      Problems:
                    </p>
                    <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                      <li>• All systems retry at the same time</li>
                      <li>• Creates &ldquo;thundering herd&rdquo; effect</li>
                      <li>• Overwhelms recovering services</li>
                    </ul>
                  </div>
                </div>

                {/* Full Jitter */}
                <div className="border border-border rounded p-4">
                  <h4 className="font-semibold text-text-primary mb-2">🎯 Full Jitter</h4>
                  <p className="text-sm text-text-secondary mb-3">
                    Waits a random time between 0 and the maximum delay
                  </p>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                      Benefits:
                    </p>
                    <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                      <li>• Maximum spread of retry times</li>
                      <li>• Best at preventing coordination</li>
                      <li>• May retry very quickly sometimes</li>
                    </ul>
                  </div>
                </div>

                {/* Equal Jitter */}
                <div className="border border-border rounded p-4">
                  <h4 className="font-semibold text-text-primary mb-2">⚖️ Equal Jitter</h4>
                  <p className="text-sm text-text-secondary mb-3">
                    Mixes fixed and random delays for balance
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Balanced approach:
                    </p>
                    <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• Guarantees minimum wait time</li>
                      <li>• Adds randomness to prevent storms</li>
                      <li>• Good for most applications</li>
                    </ul>
                  </div>
                </div>

                {/* Decorrelated Jitter */}
                <div className="border border-border rounded p-4">
                  <h4 className="font-semibold text-text-primary mb-2">🔄 Decorrelated Jitter</h4>
                  <p className="text-sm text-text-secondary mb-3">
                    Each retry uses previous delay × random factor
                  </p>
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded p-3">
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">
                      Advanced:
                    </p>
                    <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                      <li>• Adapts based on previous attempts</li>
                      <li>• Good for long-running operations</li>
                      <li>• More complex but very effective</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real World Examples */}
          <div className="bg-surface rounded-lg p-6 border border-border">
            <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span className="text-2xl">🌍</span>
              Real World Examples
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-text-primary mb-3">📱 Mobile App API Calls</h4>
                <p className="text-sm text-text-secondary mb-3">
                  Your phone app tries to sync data but the server is busy. Instead of hammering the
                  server every second, it waits 1s, then 2s, then 4s... giving the server breathing
                  room.
                </p>
                <div className="bg-surface-secondary rounded p-3 text-xs font-mono">
                  Attempt 1: Wait 1 second
                  <br />
                  Attempt 2: Wait 2 seconds
                  <br />
                  Attempt 3: Wait 4 seconds
                  <br />
                  Attempt 4: Wait 8 seconds
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-text-primary mb-3">☁️ Cloud Service Scaling</h4>
                <p className="text-sm text-text-secondary mb-3">
                  During a traffic spike, hundreds of servers try to scale up. Without backoff, they
                  all hit the scaling API simultaneously. With backoff, they spread out their
                  requests naturally.
                </p>
                <div className="bg-surface-secondary rounded p-3 text-xs">
                  <strong>Without backoff:</strong> 1000 servers hit API at once ❌<br />
                  <strong>With backoff:</strong> Servers retry at 1s, 1.5s, 2.3s, 3.1s... ✅
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-text-primary mb-3">💳 Payment Processing</h4>
                <p className="text-sm text-text-secondary mb-3">
                  When a payment gateway is temporarily down, retrying immediately would just waste
                  resources. Exponential backoff gives the payment system time to recover.
                </p>
                <div className="bg-surface-secondary rounded p-3 text-xs">
                  <strong>Bad:</strong> Retry every 1 second for 5 minutes
                  <br />
                  <strong>Good:</strong> 1s → 2s → 4s → 8s → 16s → 32s...
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-text-primary mb-3">🔄 Message Queues</h4>
                <p className="text-sm text-text-secondary mb-3">
                  When processing messages from a queue fails, workers use backoff to avoid
                  overwhelming downstream services while giving them time to recover.
                </p>
                <div className="bg-surface-secondary rounded p-3 text-xs">
                  <strong>Queue processing:</strong>
                  <br />
                  Message fails → wait 1s → retry
                  <br />
                  Still fails → wait 2s → retry
                  <br />
                  Success! → continue normally
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Guide */}
          <div className="bg-surface rounded-lg p-6 border border-border">
            <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span className="text-2xl">⚙️</span>
              Configuration Best Practices
            </h3>
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-surface-secondary rounded">
                  <div className="text-2xl mb-2">⏱️</div>
                  <h4 className="font-semibold text-text-primary mb-1">Base Delay</h4>
                  <p className="text-xs text-text-secondary">
                    Start with 1-5 seconds. Too short = still overwhelming, too long = slow
                    recovery.
                  </p>
                </div>
                <div className="text-center p-4 bg-surface-secondary rounded">
                  <div className="text-2xl mb-2">🔢</div>
                  <h4 className="font-semibold text-text-primary mb-1">Max Retries</h4>
                  <p className="text-xs text-text-secondary">
                    3-7 attempts typically. More than 10 is usually pointless - if it hasn&apos;t
                    worked by then, something else is wrong.
                  </p>
                </div>
                <div className="text-center p-4 bg-surface-secondary rounded">
                  <div className="text-2xl mb-2">🎯</div>
                  <h4 className="font-semibold text-text-primary mb-1">Max Delay</h4>
                  <p className="text-xs text-text-secondary">
                    Cap at 30-300 seconds. Prevents infinite waiting and gives users reasonable
                    timeout expectations.
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="font-semibold text-text-primary mb-3">Strategy Recommendations:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-green-600 font-bold">✓</span>
                    <div>
                      <strong className="text-text-primary">Equal Jitter</strong> - Best for most
                      applications. Balances predictability with randomness.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold">✓</span>
                    <div>
                      <strong className="text-text-primary">Full Jitter</strong> - When you have
                      many clients that might fail simultaneously (high contention scenarios).
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-orange-600 font-bold">⚠️</span>
                    <div>
                      <strong className="text-text-primary">No Jitter</strong> - Only use when you
                      have a single client and need predictable timing.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Common Pitfalls */}
          <div className="bg-surface rounded-lg p-6 border border-border">
            <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span className="text-2xl">🚨</span>
              Common Mistakes to Avoid
            </h3>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded p-4">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    ❌ Immediate Retries
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Retrying failed operations immediately just makes the problem worse. Give
                    systems time to recover!
                  </p>
                </div>

                <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded p-4">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    ❌ Fixed Intervals
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Waiting 5 seconds every time doesn&apos;t help when the problem persists. Use
                    exponential growth!
                  </p>
                </div>

                <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded p-4">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    ❌ No Maximum Delay
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Without a cap, you could wait hours or days. Always set reasonable limits!
                  </p>
                </div>

                <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded p-4">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    ❌ Too Many Retries
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    If something fails 20 times in a row, it&apos;s probably not going to work. Know
                    when to give up gracefully.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Circuit Breaker Pattern */}
          <div className="bg-surface rounded-lg p-6 border border-border">
            <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span className="text-2xl">🔌</span>
              Circuit Breaker Pattern
            </h3>
            <div className="space-y-4">
              <p className="text-text-secondary">
                Exponential backoff is great, but sometimes you need to be smarter. The circuit
                breaker pattern watches for repeated failures and temporarily stops trying
                altogether.
              </p>

              <div className="bg-surface-secondary rounded p-4">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Closed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium">Open</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">Half-Open</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong className="text-text-primary">Closed:</strong> Normal operation,
                    requests flow through normally.
                  </div>
                  <div>
                    <strong className="text-text-primary">Open:</strong> Too many failures, requests
                    fail immediately without hitting the service.
                  </div>
                  <div>
                    <strong className="text-text-primary">Half-Open:</strong> Testing if the service
                    has recovered, allows limited requests through.
                  </div>
                </div>
              </div>

              <p className="text-sm text-text-secondary">
                <strong>Pro tip:</strong> Combine circuit breakers with exponential backoff for
                maximum resilience. The circuit breaker prevents wasted retries, while backoff makes
                the retries you do attempt more effective.
              </p>
            </div>
          </div>

          {/* Learn More */}
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Want to Learn More?</h3>
            <p className="text-text-secondary mb-4">
              Exponential backoff is a fundamental pattern in distributed systems. Understanding it
              will make you a better engineer!
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <a
                href="https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                AWS Backoff Guide
              </a>
              <a
                href="https://en.wikipedia.org/wiki/Exponential_backoff"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Wikipedia Article
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Export Code Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">Export Code</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-text-tertiary hover:text-text-primary p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-text-primary">
                  Programming Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50 w-full"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="go">Go</option>
                  <option value="csharp">C#</option>
                  <option value="java">Java</option>
                  <option value="php">PHP</option>
                  <option value="ruby">Ruby</option>
                  <option value="rust">Rust</option>
                  <option value="swift">Swift</option>
                  <option value="kotlin">Kotlin</option>
                </select>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">Code</span>
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 text-xs bg-accent hover:bg-accent-hover text-white rounded transition-colors flex items-center gap-1.5"
                  >
                    {codeCopied ? (
                      <>
                        <CheckIcon />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-surface-secondary border border-border rounded p-4 text-sm overflow-x-auto max-h-96">
                  <code className="text-text-primary">{generateCode(selectedLanguage)}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
