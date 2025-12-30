/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState, useEffect } from 'react';
import { ApiRequest } from '@/lib/stores/api-client-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Code, Copy, Check } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { generateCodeSnippet, CodeLanguage } from '@/lib/code-gen-utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const LANGUAGES: { id: CodeLanguage; name: string; group: string }[] = [
  { id: 'curl', name: 'cURL', group: 'Shell' },
  { id: 'shell_httpie', name: 'HTTPie', group: 'Shell' },
  { id: 'shell_wget', name: 'Wget', group: 'Shell' },
  { id: 'http_raw', name: 'HTTP/1.1 Raw', group: 'HTTP' },
  { id: 'javascript_fetch', name: 'Fetch API', group: 'JavaScript' },
  { id: 'javascript_axios', name: 'Axios', group: 'JavaScript' },
  { id: 'javascript_jquery', name: 'jQuery (AJAX)', group: 'JavaScript' },
  { id: 'javascript_xhr', name: 'XMLHttpRequest', group: 'JavaScript' },
  { id: 'nodejs_axios', name: 'Axios', group: 'Node.js' },
  { id: 'python_requests', name: 'Requests', group: 'Python' },
  { id: 'python_http_client', name: 'http.client / urllib', group: 'Python' },
  { id: 'go_native', name: 'net/http', group: 'Go' },
  { id: 'c_libcurl', name: 'libcurl', group: 'C' },
  { id: 'csharp_httpclient', name: 'HttpClient', group: 'C#' },
  { id: 'csharp_restsharp', name: 'RestSharp', group: 'C#' },
  { id: 'java_okhttp', name: 'OkHttp', group: 'Java' },
  { id: 'java_net_http', name: 'java.net.http', group: 'Java' },
  { id: 'java_asynchttpclient', name: 'AsyncHttpClient', group: 'Java' },
  { id: 'java_unirest', name: 'Unirest', group: 'Java' },
  { id: 'kotlin_okhttp', name: 'OkHttp', group: 'Kotlin' },
  { id: 'php_guzzle', name: 'Guzzle', group: 'PHP' },
  { id: 'php_curl', name: 'cURL', group: 'PHP' },
  { id: 'powershell_restmethod', name: 'Invoke-RestMethod', group: 'PowerShell' },
  { id: 'powershell_webrequest', name: 'Invoke-WebRequest', group: 'PowerShell' },
  { id: 'ruby_net_http', name: 'Net::HTTP', group: 'Ruby' },
  { id: 'rust_reqwest', name: 'Reqwest', group: 'Rust' },
  { id: 'swift_nsurlsession', name: 'NSURLSession', group: 'Swift' },
  { id: 'objectivec_nsurlsession', name: 'NSURLSession', group: 'Objective-C' },
  { id: 'clojure_clj_http', name: 'clj-http', group: 'Clojure' },
  { id: 'ocaml_cohttp', name: 'cohttp', group: 'OCaml' },
  { id: 'r_httr', name: 'httr', group: 'R' },
];

export function CodeGenerator({ request }: { request: ApiRequest }) {
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState<CodeLanguage>('curl');
  const [code, setCode] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const snippet = generateCodeSnippet(language, request);
      setCode(snippet);
    } catch (e) {
      setCode(`// Error generating code: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }, [language, request]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          aria-label="Generate code"
        >
          <Code className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden border-muted/20 shadow-2xl">
        <DialogHeader className="p-4 px-6 border-b bg-muted/10 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Code className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Generate Code
                </DialogTitle>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Ready-to-use snippets for your request
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="h-9 w-[220px] justify-between text-xs font-semibold bg-background border-muted capitalize shadow-sm"
                  >
                    {language
                      ? LANGUAGES.find((l) => l.id === language)?.name
                      : 'Select language...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[300px] p-0 shadow-2xl border-muted/20 bg-popover z-[100]"
                  align="end"
                  side="bottom"
                  sideOffset={8}
                >
                  <Command className="overflow-hidden">
                    <CommandInput
                      placeholder="Search language..."
                      className="h-10 text-xs border-none focus:ring-0"
                    />
                    <CommandList className="max-h-[400px] overflow-y-auto">
                      <CommandEmpty className="py-6 text-xs text-muted-foreground text-center">
                        No language found.
                      </CommandEmpty>
                      {Array.from(new Set(LANGUAGES.map((l) => l.group))).map((group) => (
                        <CommandGroup
                          key={group}
                          heading={
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60 px-1">
                              {group}
                            </span>
                          }
                        >
                          {LANGUAGES.filter((l) => l.group === group).map((l) => (
                            <CommandItem
                              key={l.id}
                              value={l.id} // Use ID as value for unique selection
                              onSelect={(currentValue) => {
                                const selected = LANGUAGES.find((item) => item.id === currentValue);
                                if (selected) {
                                  setLanguage(selected.id);
                                  setOpen(false);
                                }
                              }}
                              className="text-xs h-9 cursor-pointer data-[selected=true]:bg-primary/5 data-[selected=true]:text-primary rounded-md transition-all px-3"
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      'h-1.5 w-1.5 rounded-full',
                                      language === l.id ? 'bg-primary' : 'bg-transparent',
                                    )}
                                  />
                                  <span>{l.name}</span>
                                </div>
                                {language === l.id && (
                                  <Check className="h-3.5 w-3.5 text-primary animate-in fade-in zoom-in duration-200" />
                                )}
                              </div>
                              {/* Hidden text for searchability */}
                              <span className="sr-only">
                                {l.name} {l.group}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <div className="h-6 w-[1px] bg-muted mx-1" />
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  'h-9 w-9 transition-all hover:bg-muted',
                  copied
                    ? 'text-green-600 bg-green-500/10 hover:bg-green-500/20'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={handleCopy}
                title={copied ? 'Copied!' : 'Copy code'}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 bg-muted/[0.02] relative group overflow-hidden">
          <Textarea
            value={code}
            readOnly
            className="h-full w-full font-mono text-[13px] leading-relaxed p-8 bg-transparent border-none text-foreground focus-visible:ring-0 resize-none selection:bg-primary/20"
          />
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="px-3 py-1 rounded-full bg-primary/10 backdrop-blur-md border border-primary/20 text-[9px] font-bold text-primary uppercase tracking-tight shadow-sm">
              {language.split('_').join(' ')}
            </div>
          </div>
        </div>
        <div className="p-3 px-6 border-t bg-muted/5 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground font-medium italic">
            Snippets are based on your current request configuration. Always verify before use.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase">
                Ready
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
