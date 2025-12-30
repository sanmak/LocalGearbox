/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Clock,
  Code2,
  Download,
  X,
  Save,
  FileJson,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Zap,
  Layers,
  Database,
  Terminal,
  RefreshCw,
  XCircle,
  Cookie,
} from 'lucide-react';

// ============================================================================
// Types & Interfaces
// ============================================================================

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

type BodyType =
  | 'none'
  | 'json'
  | 'form-data'
  | 'x-www-form-urlencoded'
  | 'raw'
  | 'binary'
  | 'graphql'
  | 'xml';

type AuthType = 'none' | 'bearer' | 'basic' | 'api-key' | 'oauth2' | 'aws-sig' | 'digest';

interface KeyValue {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
  type?: 'text' | 'file';
}

interface AuthConfig {
  type: AuthType;
  bearer?: { token: string };
  basic?: { username: string; password: string };
  apiKey?: { key: string; value: string; addTo: 'header' | 'query' };
  oauth2?: { accessToken: string; tokenType: string; refreshToken?: string };
}

interface RequestConfig {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: KeyValue[];
  headers: KeyValue[];
  body: {
    type: BodyType;
    content: string;
    formData?: KeyValue[];
  };
  auth: AuthConfig;
  preRequestScript?: string;
  testScript?: string;
}

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  cookies: Array<{ name: string; value: string; domain?: string }>;
  size: number;
  time: number;
  timeline: {
    dns: number;
    connect: number;
    ssl: number;
    wait: number;
    download: number;
    total: number;
  };
}

interface Environment {
  id: string;
  name: string;
  variables: KeyValue[];
  isActive: boolean;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: RequestConfig[];
  folders?: Collection[];
  isExpanded?: boolean;
}

interface HistoryItem {
  id: string;
  request: RequestConfig;
  response?: ResponseData;
  timestamp: Date;
}

// ============================================================================
// Utility Functions
// ============================================================================

const generateId = () => Math.random().toString(36).substring(2, 15);

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTime = (ms: number): string => {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const getMethodColor = (method: HttpMethod): string => {
  const colors: Record<HttpMethod, string> = {
    GET: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-400/10 dark:border-emerald-400/20',
    POST: 'text-blue-500 bg-blue-500/10 border-blue-500/20 dark:text-blue-400 dark:bg-blue-400/10 dark:border-blue-400/20',
    PUT: 'text-amber-500 bg-amber-500/10 border-amber-500/20 dark:text-amber-400 dark:bg-amber-400/10 dark:border-amber-400/20',
    PATCH:
      'text-violet-500 bg-violet-500/10 border-violet-500/20 dark:text-violet-400 dark:bg-violet-400/10 dark:border-violet-400/20',
    DELETE:
      'text-rose-500 bg-rose-500/10 border-rose-500/20 dark:text-rose-400 dark:bg-rose-400/10 dark:border-rose-400/20',
    HEAD: 'text-pink-500 bg-pink-500/10 border-pink-500/20 dark:text-pink-400 dark:bg-pink-400/10 dark:border-pink-400/20',
    OPTIONS:
      'text-indigo-500 bg-indigo-500/10 border-indigo-500/20 dark:text-indigo-400 dark:bg-indigo-400/10 dark:border-indigo-400/20',
  };
  return colors[method];
};

const getStatusColor = (status: number): string => {
  if (status >= 200 && status < 300)
    return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-400/10';
  if (status >= 300 && status < 400)
    return 'text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-400 dark:bg-blue-400/10';
  if (status >= 400 && status < 500)
    return 'text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400 dark:bg-amber-400/10';
  return 'text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400 dark:bg-rose-400/10';
};

const syntaxHighlight = (json: string, theme: 'light' | 'dark'): string => {
  try {
    const obj = JSON.parse(json);
    json = JSON.stringify(obj, null, 2);
  } catch {
    return json;
  }

  const keyClass = theme === 'dark' ? 'text-rose-400' : 'text-rose-600';
  const stringClass = theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600';
  const numberClass = theme === 'dark' ? 'text-amber-400' : 'text-amber-600';
  const boolClass = theme === 'dark' ? 'text-violet-400' : 'text-violet-600';
  const nullClass = theme === 'dark' ? 'text-slate-500' : 'text-slate-400';

  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = numberClass;
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = keyClass;
        } else {
          cls = stringClass;
        }
      } else if (/true|false/.test(match)) {
        cls = boolClass;
      } else if (/null/.test(match)) {
        cls = nullClass;
      }
      return `<span class="${cls}">${match}</span>`;
    },
  );
};

const highlightXML = (xml: string, theme: 'light' | 'dark'): string => {
  const tagClass = theme === 'dark' ? 'text-blue-400' : 'text-blue-600';
  const attrClass = theme === 'dark' ? 'text-amber-400' : 'text-amber-600';
  const stringClass = theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600';

  return xml
    .replace(/(&lt;\/?[^&gt;]+&gt;)/g, `<span class="${tagClass}">$1</span>`)
    .replace(/([a-zA-Z-]+)=/g, `<span class="${attrClass}">$1</span>=`)
    .replace(/"([^"]*)"/g, `<span class="${stringClass}">"$1"</span>`);
};

// ============================================================================
// Code Generation
// ============================================================================

const generateCode = (request: RequestConfig, language: string): string => {
  const { method, url, headers, body, auth } = request;

  const activeHeaders = headers.filter((h) => h.enabled && h.key);
  const headerObj: Record<string, string> = {};
  activeHeaders.forEach((h) => {
    headerObj[h.key] = h.value;
  });

  if (auth.type === 'bearer' && auth.bearer?.token) {
    headerObj['Authorization'] = `Bearer ${auth.bearer.token}`;
  } else if (auth.type === 'basic' && auth.basic) {
    const encoded = btoa(`${auth.basic.username}:${auth.basic.password}`);
    headerObj['Authorization'] = `Basic ${encoded}`;
  } else if (auth.type === 'api-key' && auth.apiKey) {
    if (auth.apiKey.addTo === 'header') {
      headerObj[auth.apiKey.key] = auth.apiKey.value;
    }
  }

  switch (language) {
    case 'curl':
      let curl = `curl -X ${method} '${url}'`;
      Object.entries(headerObj).forEach(([k, v]) => {
        curl += ` \\\n  -H '${k}: ${v}'`;
      });
      if (body.type === 'json' && body.content) {
        curl += ` \\\n  -d '${body.content}'`;
      }
      return curl;

    case 'javascript-fetch':
      return `const response = await fetch('${url}', {
  method: '${method}',
  headers: ${JSON.stringify(headerObj, null, 4)},${
    body.type === 'json' && body.content
      ? `
  body: JSON.stringify(${body.content}),`
      : ''
  }
});

const data = await response.json();
console.log(data);`;

    case 'javascript-axios':
      return `import axios from 'axios';

const response = await axios({
  method: '${method.toLowerCase()}',
  url: '${url}',
  headers: ${JSON.stringify(headerObj, null, 4)},${
    body.type === 'json' && body.content
      ? `
  data: ${body.content},`
      : ''
  }
});

console.log(response.data);`;

    case 'python-requests':
      return `import requests

response = requests.${method.toLowerCase()}(
    '${url}',
    headers=${JSON.stringify(headerObj, null, 4).replace(/"/g, "'")},${
      body.type === 'json' && body.content
        ? `
    json=${body.content},`
        : ''
    }
)

print(response.json())`;

    case 'go':
      return `package main

import (
    "fmt"
    "net/http"
    "io/ioutil"
    ${body.type === 'json' && body.content ? '"bytes"' : ''}
)

func main() {
    ${
      body.type === 'json' && body.content
        ? `jsonBody := []byte(\`${body.content}\`)
    req, _ := http.NewRequest("${method}", "${url}", bytes.NewBuffer(jsonBody))`
        : `req, _ := http.NewRequest("${method}", "${url}", nil)`
    }

${Object.entries(headerObj)
  .map(([k, v]) => `    req.Header.Set("${k}", "${v}")`)
  .join('\n')}

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Println(string(body))
}`;

    case 'rust':
      return `use reqwest;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();

    let response = client
        .${method.toLowerCase()}("${url}")
${Object.entries(headerObj)
  .map(([k, v]) => `        .header("${k}", "${v}")`)
  .join('\n')}${
        body.type === 'json' && body.content
          ? `
        .json(&serde_json::json!(${body.content}))`
          : ''
      }
        .send()
        .await?;

    println!("{}", response.text().await?);
    Ok(())
}`;

    case 'php':
      return `<?php
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => '${url}',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => '${method}',
    CURLOPT_HTTPHEADER => [
${Object.entries(headerObj)
  .map(([k, v]) => `        '${k}: ${v}',`)
  .join('\n')}
    ],${
      body.type === 'json' && body.content
        ? `
    CURLOPT_POSTFIELDS => '${body.content}',`
        : ''
    }
]);

$response = curl_exec($curl);
curl_close($curl);

echo $response;`;

    case 'java':
      return `import java.net.http.*;
import java.net.URI;

public class APIRequest {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("${url}"))
            .${method}(${body.type === 'json' && body.content ? `HttpRequest.BodyPublishers.ofString(${JSON.stringify(body.content)})` : 'HttpRequest.BodyPublishers.noBody()'})
${Object.entries(headerObj)
  .map(([k, v]) => `            .header("${k}", "${v}")`)
  .join('\n')}
            .build();

        HttpResponse<String> response = client.send(request,
            HttpResponse.BodyHandlers.ofString());

        System.out.println(response.body());
    }
}`;

    default:
      return '// Select a language to generate code';
  }
};

// ============================================================================
// Components
// ============================================================================

// Key-Value Editor Component
const KeyValueEditor: React.FC<{
  items: KeyValue[];
  onChange: (items: KeyValue[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  showDescription?: boolean;
}> = ({
  items,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  showDescription = false,
}) => {
  const addItem = () => {
    onChange([...items, { id: generateId(), key: '', value: '', enabled: true }]);
  };

  const updateItem = (id: string, field: keyof KeyValue, value: string | boolean) => {
    onChange(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div
        className={`grid ${
          showDescription ? 'grid-cols-[40px_1fr_1fr_1fr_40px]' : 'grid-cols-[40px_1fr_1fr_40px]'
        } gap-2 px-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider`}
      >
        <div></div>
        <div>{keyPlaceholder}</div>
        <div>{valuePlaceholder}</div>
        {showDescription && <div>Description</div>}
        <div></div>
      </div>

      {/* Rows */}
      {items.map((item) => (
        <div
          key={item.id}
          className={`grid ${
            showDescription ? 'grid-cols-[40px_1fr_1fr_1fr_40px]' : 'grid-cols-[40px_1fr_1fr_40px]'
          } gap-2 items-center group`}
        >
          <div className="flex justify-center">
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={(e) => updateItem(item.id, 'enabled', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer transition-colors"
            />
          </div>
          <input
            type="text"
            value={item.key}
            onChange={(e) => updateItem(item.id, 'key', e.target.value)}
            placeholder={keyPlaceholder}
            className={`px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all ${
              !item.enabled && 'opacity-50'
            }`}
          />
          <input
            type="text"
            value={item.value}
            onChange={(e) => updateItem(item.id, 'value', e.target.value)}
            placeholder={valuePlaceholder}
            className={`px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all ${
              !item.enabled && 'opacity-50'
            }`}
          />
          {showDescription && (
            <input
              type="text"
              value={item.description || ''}
              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
              placeholder="Description"
              className={`px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all ${
                !item.enabled && 'opacity-50'
              }`}
            />
          )}
          <button
            onClick={() => removeItem(item.id)}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Add Button */}
      <button
        onClick={addItem}
        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-400/5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500/50 transition-all w-full justify-center mt-4"
      >
        <Plus className="w-4 h-4" />
        Add {keyPlaceholder}
      </button>
    </div>
  );
};

// Method Selector Component
const MethodSelector: React.FC<{
  value: HttpMethod;
  onChange: (method: HttpMethod) => void;
}> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono font-semibold text-sm border ${getMethodColor(
          value,
        )} hover:shadow-md transition-all min-w-[110px] justify-between`}
      >
        {value}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 min-w-[140px] overflow-hidden">
            {methods.map((method) => (
              <button
                key={method}
                onClick={() => {
                  onChange(method);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left font-mono font-semibold text-sm ${getMethodColor(
                  method,
                )} hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                  value === method ? 'bg-slate-50 dark:bg-slate-700/30' : ''
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Tab Component
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
}> = ({ active, onClick, children, badge }) => (
  <button
    onClick={onClick}
    className={`relative px-4 py-2.5 text-sm font-medium transition-all ${
      active
        ? 'text-violet-600 dark:text-violet-400'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
    }`}
  >
    <span className="flex items-center gap-2">
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="px-1.5 py-0.5 text-xs bg-violet-100 dark:bg-slate-700 text-violet-700 dark:text-violet-300 rounded-full min-w-[20px] text-center font-semibold">
          {badge}
        </span>
      )}
    </span>
    {active && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500" />
    )}
  </button>
);

// Response Timeline Component
const ResponseTimeline: React.FC<{ timeline: ResponseData['timeline'] }> = ({ timeline }) => {
  const maxTime = Math.max(
    timeline.dns,
    timeline.connect,
    timeline.ssl,
    timeline.wait,
    timeline.download,
  );

  const phases = [
    { name: 'DNS Lookup', value: timeline.dns, color: 'bg-violet-500' },
    { name: 'TCP Connect', value: timeline.connect, color: 'bg-blue-500' },
    { name: 'SSL Handshake', value: timeline.ssl, color: 'bg-emerald-500' },
    { name: 'Time to First Byte', value: timeline.wait, color: 'bg-amber-500' },
    {
      name: 'Content Download',
      value: timeline.download,
      color: 'bg-rose-500',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">Total Time</span>
        <span className="font-mono font-semibold text-slate-900 dark:text-white">
          {formatTime(timeline.total)}
        </span>
      </div>

      <div className="space-y-3">
        {phases.map((phase) => (
          <div key={phase.name} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">{phase.name}</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {formatTime(phase.value)}
              </span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${phase.color} rounded-full transition-all duration-500`}
                style={{
                  width: `${maxTime > 0 ? (phase.value / maxTime) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Waterfall visualization */}
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700/50">
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-3 font-medium">Waterfall</div>
        <div className="relative h-8 bg-slate-100 dark:bg-slate-800/50 rounded-lg overflow-hidden">
          {phases.map((phase, index) => {
            const startPercent = phases
              .slice(0, index)
              .reduce(
                (sum, p) => sum + (timeline.total > 0 ? (p.value / timeline.total) * 100 : 0),
                0,
              );
            const widthPercent = timeline.total > 0 ? (phase.value / timeline.total) * 100 : 0;
            return (
              <div
                key={phase.name}
                className={`absolute top-1 bottom-1 ${phase.color} rounded`}
                style={{
                  left: `${startPercent}%`,
                  width: `${Math.max(widthPercent, 1)}%`,
                }}
                title={`${phase.name}: ${formatTime(phase.value)}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500 dark:text-slate-500">
          <span>0ms</span>
          <span>{formatTime(timeline.total)}</span>
        </div>
      </div>
    </div>
  );
};

// Code Generator Modal
const CodeGeneratorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  request: RequestConfig;
}> = ({ isOpen, onClose, request }) => {
  const [language, setLanguage] = useState('curl');
  const [copied, setCopied] = useState(false);

  const languages = [
    { id: 'curl', name: 'cURL', icon: Terminal },
    { id: 'javascript-fetch', name: 'JavaScript (Fetch)', icon: FileJson },
    { id: 'javascript-axios', name: 'JavaScript (Axios)', icon: FileJson },
    { id: 'python-requests', name: 'Python', icon: Code2 },
    { id: 'go', name: 'Go', icon: Code2 },
    { id: 'rust', name: 'Rust', icon: Code2 },
    { id: 'php', name: 'PHP', icon: Code2 },
    { id: 'java', name: 'Java', icon: Code2 },
  ];

  const code = generateCode(request, language);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold flex items-center gap-3 text-slate-900 dark:text-white">
            <Code2 className="w-5 h-5 text-violet-500 dark:text-violet-400" />
            Generate Code
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language selector */}
        <div className="flex gap-2 px-6 py-4 border-b border-slate-200 dark:border-slate-700/50 overflow-x-auto">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setLanguage(lang.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                language === lang.id
                  ? 'bg-violet-500 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <lang.icon className="w-4 h-4" />
              {lang.name}
            </button>
          ))}
        </div>

        {/* Code */}
        <div className="flex-1 overflow-auto p-6">
          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-sm transition-colors z-10"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
            <pre className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-mono leading-relaxed overflow-auto">
              <code className="text-slate-800 dark:text-slate-300">{code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

// Environment Manager Modal
const EnvironmentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  environments: Environment[];
  onSave: (environments: Environment[]) => void;
  activeEnv: string | null;
  onSetActive: (id: string | null) => void;
}> = ({ isOpen, onClose, environments, onSave, activeEnv, onSetActive }) => {
  const [localEnvs, setLocalEnvs] = useState<Environment[]>(environments);
  const [selectedEnv, setSelectedEnv] = useState<string | null>(environments[0]?.id || null);

  useEffect(() => {
    setLocalEnvs(environments);
  }, [environments]);

  const addEnvironment = () => {
    const newEnv: Environment = {
      id: generateId(),
      name: 'New Environment',
      variables: [{ id: generateId(), key: '', value: '', enabled: true }],
      isActive: false,
    };
    setLocalEnvs([...localEnvs, newEnv]);
    setSelectedEnv(newEnv.id);
  };

  const updateEnvironment = (id: string, updates: Partial<Environment>) => {
    setLocalEnvs(localEnvs.map((env) => (env.id === id ? { ...env, ...updates } : env)));
  };

  const deleteEnvironment = (id: string) => {
    setLocalEnvs(localEnvs.filter((env) => env.id !== id));
    if (selectedEnv === id) {
      setSelectedEnv(localEnvs[0]?.id || null);
    }
  };

  const handleSave = () => {
    onSave(localEnvs);
    onClose();
  };

  const selectedEnvironment = localEnvs.find((e) => e.id === selectedEnv);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-5xl max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              <Globe className="w-5 h-5 text-violet-500 dark:text-violet-400" />
              Environments
            </h2>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {localEnvs.map((env) => (
              <button
                key={env.id}
                onClick={() => setSelectedEnv(env.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                  selectedEnv === env.id
                    ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-white'
                    : 'text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    activeEnv === env.id ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
                <span className="flex-1 truncate font-medium">{env.name}</span>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={addEnvironment}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors text-slate-900 dark:text-white"
            >
              <Plus className="w-4 h-4" />
              Add Environment
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {selectedEnvironment ? (
            <>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <input
                  type="text"
                  value={selectedEnvironment.name}
                  onChange={(e) =>
                    updateEnvironment(selectedEnvironment.id, {
                      name: e.target.value,
                    })
                  }
                  className="text-lg font-semibold bg-transparent border-none outline-none focus:ring-0 text-slate-900 dark:text-white"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onSetActive(
                        activeEnv === selectedEnvironment.id ? null : selectedEnvironment.id,
                      )
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeEnv === selectedEnvironment.id
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {activeEnv === selectedEnvironment.id ? 'Active' : 'Set Active'}
                  </button>
                  <button
                    onClick={() => deleteEnvironment(selectedEnvironment.id)}
                    className="p-2 text-slate-400 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <KeyValueEditor
                  items={selectedEnvironment.variables}
                  onChange={(variables) => updateEnvironment(selectedEnvironment.id, { variables })}
                  keyPlaceholder="Variable"
                  valuePlaceholder="Value"
                  showDescription
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <p>Select or create an environment</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium transition-colors shadow-md"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Save Request Modal
const SaveRequestModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  request: RequestConfig;
  collections: Collection[];
  onSave: (collectionId: string, requestName: string) => void;
}> = ({ isOpen, onClose, request, collections, onSave }) => {
  const [selectedCollection, setSelectedCollection] = useState<string>(collections[0]?.id || '');
  const [requestName, setRequestName] = useState(request.name);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const handleSave = () => {
    if (isCreatingNew && newCollectionName) {
      onSave(newCollectionName, requestName);
    } else if (selectedCollection) {
      onSave(selectedCollection, requestName);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold flex items-center gap-3 text-slate-900 dark:text-white">
            <Save className="w-5 h-5 text-violet-500 dark:text-violet-400" />
            Save Request
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Request Name
            </label>
            <input
              type="text"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              placeholder="Enter request name"
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Collection
            </label>
            {!isCreatingNew ? (
              <div className="space-y-2">
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                >
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setIsCreatingNew(true)}
                  className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium"
                >
                  + Create new collection
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Enter collection name"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                />
                <button
                  onClick={() => setIsCreatingNew(false)}
                  className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium"
                >
                  ← Back to existing collections
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={
              !requestName ||
              (!selectedCollection && !newCollectionName) ||
              (isCreatingNew && !newCollectionName)
            }
            className="px-6 py-2 bg-violet-500 hover:bg-violet-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-md"
          >
            Save Request
          </button>
        </div>
      </div>
    </div>
  );
};

// Collection Tree Item
const CollectionTreeItem: React.FC<{
  collection: Collection;
  depth?: number;
  onSelectRequest: (request: RequestConfig) => void;
  onUpdateCollection: (collection: Collection) => void;
  onDeleteRequest: (collectionId: string, requestId: string) => void;
}> = ({ collection, depth = 0, onSelectRequest, onUpdateCollection, onDeleteRequest }) => {
  const [isExpanded, setIsExpanded] = useState(collection.isExpanded ?? true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(collection.name);

  const handleSaveName = () => {
    onUpdateCollection({ ...collection, name: editName });
    setIsEditing(false);
  };

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer group transition-colors"
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        <button onClick={() => setIsExpanded(!isExpanded)}>
          <ChevronRight
            className={`w-4 h-4 text-slate-500 dark:text-slate-500 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
        </button>
        {isExpanded ? (
          <FolderOpen className="w-4 h-4 text-amber-500 dark:text-amber-400" />
        ) : (
          <Folder className="w-4 h-4 text-amber-500 dark:text-amber-400" />
        )}
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveName();
              if (e.key === 'Escape') {
                setEditName(collection.name);
                setIsEditing(false);
              }
            }}
            className="flex-1 px-2 py-0.5 text-sm font-medium bg-white dark:bg-slate-800 border border-violet-500 rounded outline-none"
            autoFocus
          />
        ) : (
          <span
            className="flex-1 text-sm font-medium truncate text-slate-900 dark:text-slate-200"
            onDoubleClick={() => setIsEditing(true)}
          >
            {collection.name}
          </span>
        )}
        <span className="text-xs text-slate-500 dark:text-slate-500">
          {collection.requests.length}
        </span>
      </div>

      {isExpanded && (
        <div>
          {collection.requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center gap-3 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer group transition-colors"
              style={{ paddingLeft: `${28 + depth * 16}px` }}
            >
              <button
                onClick={() => onSelectRequest(request)}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <span
                  className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border ${getMethodColor(
                    request.method,
                  )}`}
                >
                  {request.method}
                </span>
                <span className="flex-1 text-sm truncate text-slate-700 dark:text-slate-300">
                  {request.name}
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRequest(collection.id, request.id);
                }}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-400/10 rounded opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {collection.folders?.map((folder) => (
            <CollectionTreeItem
              key={folder.id}
              collection={folder}
              depth={depth + 1}
              onSelectRequest={onSelectRequest}
              onUpdateCollection={onUpdateCollection}
              onDeleteRequest={onDeleteRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main API Client Component
// ============================================================================

export default function APIClient() {
  // State
  const [request, setRequest] = useState<RequestConfig>({
    id: generateId(),
    name: 'New Request',
    method: 'GET',
    url: '',
    params: [{ id: generateId(), key: '', value: '', enabled: true }],
    headers: [{ id: generateId(), key: '', value: '', enabled: true }],
    body: { type: 'none', content: '' },
    auth: { type: 'none' },
  });

  const [response, setResponse] = useState<ResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [requestTab, setRequestTab] = useState<'params' | 'headers' | 'body' | 'auth' | 'scripts'>(
    'params',
  );
  const [responseTab, setResponseTab] = useState<'body' | 'headers' | 'cookies' | 'timeline'>(
    'body',
  );
  const [sidebarTab, setSidebarTab] = useState<'history' | 'collections'>('history');
  const [bodyViewMode, setBodyViewMode] = useState<'raw' | 'preview'>('raw');

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);

  const [activeEnvId, setActiveEnvId] = useState<string | null>(null);
  const [showCodeGen, setShowCodeGen] = useState(false);
  const [showEnvManager, setShowEnvManager] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const urlInputRef = useRef<HTMLInputElement>(null);

  // Get current theme
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    const observer = new MutationObserver(() => {
      const isDark = root.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    });

    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('api-client-history');
      const savedCollections = localStorage.getItem('api-client-collections');
      const savedEnvironments = localStorage.getItem('api-client-environments');
      const savedActiveEnv = localStorage.getItem('api-client-active-env');

      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        setHistory(
          parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          })),
        );
      }

      if (savedCollections) {
        setCollections(JSON.parse(savedCollections));
      } else {
        // Set default collection if none exists
        setCollections([
          {
            id: generateId(),
            name: 'My Requests',
            requests: [],
            isExpanded: true,
          },
        ]);
      }

      if (savedEnvironments) {
        setEnvironments(JSON.parse(savedEnvironments));
      }

      if (savedActiveEnv) {
        setActiveEnvId(savedActiveEnv);
      }
    } catch (err) {
      console.error('Failed to load from localStorage:', err);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('api-client-history', JSON.stringify(history));
    } catch (err) {
      console.error('Failed to save history:', err);
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem('api-client-collections', JSON.stringify(collections));
    } catch (err) {
      console.error('Failed to save collections:', err);
    }
  }, [collections]);

  useEffect(() => {
    try {
      localStorage.setItem('api-client-environments', JSON.stringify(environments));
    } catch (err) {
      console.error('Failed to save environments:', err);
    }
  }, [environments]);

  useEffect(() => {
    try {
      if (activeEnvId) {
        localStorage.setItem('api-client-active-env', activeEnvId);
      } else {
        localStorage.removeItem('api-client-active-env');
      }
    } catch (err) {
      console.error('Failed to save active environment:', err);
    }
  }, [activeEnvId]);

  // Get active environment
  const activeEnv = environments.find((e) => e.id === activeEnvId);

  // Replace environment variables in URL
  const replaceEnvVariables = useCallback(
    (text: string): string => {
      if (!activeEnv) return text;
      let result = text;
      activeEnv.variables.forEach((v) => {
        if (v.enabled) {
          result = result.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), v.value);
        }
      });
      return result;
    },
    [activeEnv],
  );

  // Send request
  const sendRequest = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const startTime = performance.now();

    try {
      // Build URL with params
      let finalUrl = replaceEnvVariables(request.url);
      const activeParams = request.params.filter((p) => p.enabled && p.key);
      if (activeParams.length > 0) {
        const searchParams = new URLSearchParams();
        activeParams.forEach((p) => searchParams.append(p.key, replaceEnvVariables(p.value)));
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + searchParams.toString();
      }

      // Build headers
      const headers: Record<string, string> = {};
      request.headers
        .filter((h) => h.enabled && h.key)
        .forEach((h) => {
          headers[h.key] = replaceEnvVariables(h.value);
        });

      // Add auth headers
      if (request.auth.type === 'bearer' && request.auth.bearer?.token) {
        headers['Authorization'] = `Bearer ${replaceEnvVariables(request.auth.bearer.token)}`;
      } else if (request.auth.type === 'basic' && request.auth.basic) {
        const encoded = btoa(`${request.auth.basic.username}:${request.auth.basic.password}`);
        headers['Authorization'] = `Basic ${encoded}`;
      } else if (request.auth.type === 'api-key' && request.auth.apiKey) {
        if (request.auth.apiKey.addTo === 'header') {
          headers[request.auth.apiKey.key] = request.auth.apiKey.value;
        }
      }

      // Prepare body
      let body: string | undefined;
      if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body.type !== 'none') {
        if (request.body.type === 'json') {
          headers['Content-Type'] = headers['Content-Type'] || 'application/json';
          body = replaceEnvVariables(request.body.content);
        } else if (request.body.type === 'x-www-form-urlencoded') {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
          body = replaceEnvVariables(request.body.content);
        } else if (request.body.type === 'xml') {
          headers['Content-Type'] = headers['Content-Type'] || 'application/xml';
          body = replaceEnvVariables(request.body.content);
        } else if (request.body.type === 'raw') {
          body = replaceEnvVariables(request.body.content);
        }
      }

      // Send request
      const fetchResponse = await fetch(finalUrl, {
        method: request.method,
        headers,
        body,
      });

      const endTime = performance.now();
      const responseBody = await fetchResponse.text();

      // Build response headers
      const responseHeaders: Record<string, string> = {};
      fetchResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Parse cookies
      const cookies: Array<{ name: string; value: string; domain?: string }> = [];
      const setCookieHeader = responseHeaders['set-cookie'];
      if (setCookieHeader) {
        setCookieHeader.split(',').forEach((cookie) => {
          const [nameValue] = cookie.split(';');
          const [name, value] = nameValue.split('=');
          if (name && value) {
            cookies.push({ name: name.trim(), value: value.trim() });
          }
        });
      }

      // Simulate timeline (in a real app, you'd use Performance API)
      const totalTime = endTime - startTime;
      const timeline = {
        dns: totalTime * 0.05,
        connect: totalTime * 0.1,
        ssl: totalTime * 0.15,
        wait: totalTime * 0.5,
        download: totalTime * 0.2,
        total: totalTime,
      };

      const responseData: ResponseData = {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: responseHeaders,
        body: responseBody,
        cookies,
        size: new Blob([responseBody]).size,
        time: totalTime,
        timeline,
      };

      setResponse(responseData);
      setResponseTab('body');

      // Add to history
      const historyItem: HistoryItem = {
        id: generateId(),
        request: { ...request },
        response: responseData,
        timestamp: new Date(),
      };
      setHistory((prev) => [historyItem, ...prev].slice(0, 50));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setIsLoading(false);
    }
  }, [request, replaceEnvVariables]);

  // Load request from history or collection
  const loadRequest = (req: RequestConfig) => {
    setRequest({
      ...req,
      id: generateId(),
      params:
        req.params.length > 0
          ? req.params
          : [{ id: generateId(), key: '', value: '', enabled: true }],
      headers:
        req.headers.length > 0
          ? req.headers
          : [{ id: generateId(), key: '', value: '', enabled: true }],
    });
    setResponse(null);
    setError(null);
  };

  // Save request to collection
  const saveRequest = (collectionId: string, requestName: string) => {
    const updatedRequest = { ...request, name: requestName };

    // Check if this is a new collection name (string) or existing ID
    const existingCollection = collections.find((c) => c.id === collectionId);

    if (existingCollection) {
      // Add to existing collection
      setCollections(
        collections.map((col) =>
          col.id === collectionId ? { ...col, requests: [...col.requests, updatedRequest] } : col,
        ),
      );
    } else {
      // Create new collection
      const newCollection: Collection = {
        id: generateId(),
        name: collectionId, // collectionId is the name when creating new
        requests: [updatedRequest],
        isExpanded: true,
      };
      setCollections([...collections, newCollection]);
    }
  };

  // Delete request from collection
  const deleteRequestFromCollection = (collectionId: string, requestId: string) => {
    setCollections(
      collections.map((col) =>
        col.id === collectionId
          ? {
              ...col,
              requests: col.requests.filter((r) => r.id !== requestId),
            }
          : col,
      ),
    );
  };

  // Create new request
  const createNewRequest = () => {
    setRequest({
      id: generateId(),
      name: 'New Request',
      method: 'GET',
      url: '',
      params: [{ id: generateId(), key: '', value: '', enabled: true }],
      headers: [{ id: generateId(), key: '', value: '', enabled: true }],
      body: { type: 'none', content: '' },
      auth: { type: 'none' },
    });
    setResponse(null);
    setError(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (request.url) {
          sendRequest();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        urlInputRef.current?.focus();
        urlInputRef.current?.select();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        setShowSaveModal(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCodeGen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [request, sendRequest]);

  // Detect content type for response
  const getContentType = () => {
    if (!response) return 'text';
    const contentType = response.headers['content-type']?.toLowerCase() || '';
    if (contentType.includes('json')) return 'json';
    if (contentType.includes('xml')) return 'xml';
    if (contentType.includes('html')) return 'html';
    if (contentType.includes('image')) return 'image';
    return 'text';
  };

  const contentType = getContentType();

  return (
    <div className="h-screen bg-slate-50 dark:bg-[#0A0E14] text-slate-900 dark:text-white flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 bg-white dark:bg-[#111822] border-r border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">API Client</h2>
          <button
            onClick={createNewRequest}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-400/10 rounded-lg transition-all"
            title="New Request (Ctrl+N)"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setSidebarTab('history')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              sidebarTab === 'history'
                ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-500'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            History
          </button>
          <button
            onClick={() => setSidebarTab('collections')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              sidebarTab === 'collections'
                ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-500'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Collections
          </button>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-auto p-2">
          {sidebarTab === 'history' ? (
            <div className="space-y-1">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-500">
                  <Clock className="w-10 h-10 mb-3 opacity-50" />
                  <p className="text-sm">No history yet</p>
                  <p className="text-xs mt-1 text-center px-4">Send a request to get started</p>
                </div>
              ) : (
                history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadRequest(item.request)}
                    className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg text-left transition-colors group"
                  >
                    <span
                      className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5 ${getMethodColor(
                        item.request.method,
                      )}`}
                    >
                      {item.request.method}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-slate-900 dark:text-slate-200">
                        {item.request.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                        {item.request.url}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {item.response && (
                      <span
                        className={`text-xs font-mono px-2 py-0.5 rounded border flex-shrink-0 ${getStatusColor(
                          item.response.status,
                        )}`}
                      >
                        {item.response.status}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {collections.map((collection) => (
                <CollectionTreeItem
                  key={collection.id}
                  collection={collection}
                  onSelectRequest={loadRequest}
                  onUpdateCollection={(updated) => {
                    setCollections(collections.map((c) => (c.id === updated.id ? updated : c)));
                  }}
                  onDeleteRequest={deleteRequestFromCollection}
                />
              ))}
              <button
                onClick={() => {
                  const newCol: Collection = {
                    id: generateId(),
                    name: 'New Collection',
                    requests: [],
                    isExpanded: true,
                  };
                  setCollections([...collections, newCol]);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-4 text-sm text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-400/5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500/50 transition-all"
              >
                <Plus className="w-4 h-4" />
                New Collection
              </button>
            </div>
          )}
        </div>

        {sidebarTab === 'history' && history.length > 0 && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setHistory([])}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-400/5 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Request URL bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#111822] border-b border-slate-200 dark:border-slate-800">
          <MethodSelector
            value={request.method}
            onChange={(method) => setRequest({ ...request, method })}
          />

          <div className="flex-1 relative">
            <input
              ref={urlInputRef}
              type="text"
              value={request.url}
              onChange={(e) => setRequest({ ...request, url: e.target.value })}
              placeholder="Enter URL or paste cURL command"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-slate-200 dark:bg-slate-700/50 rounded text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              ⌘L
            </kbd>
          </div>

          <button
            onClick={sendRequest}
            disabled={isLoading || !request.url}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-sm text-white shadow-md hover:shadow-lg transition-all"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send
            <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-[10px]">⌘↵</kbd>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaveModal(true)}
              className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Save to Collection (Ctrl+S)"
            >
              <Save className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowCodeGen(true)}
              className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Generate Code (Ctrl+K)"
            >
              <Code2 className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowEnvManager(true)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm transition-colors"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  activeEnv ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                }`}
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {activeEnv?.name || 'No Environment'}
              </span>
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Request panel */}
          <div className="flex-1 flex flex-col bg-white dark:bg-[#0D1117] overflow-hidden border-r border-slate-200 dark:border-slate-800">
            {/* Request tabs */}
            <div className="flex items-center justify-between px-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex">
                <TabButton
                  active={requestTab === 'params'}
                  onClick={() => setRequestTab('params')}
                  badge={request.params.filter((p) => p.enabled && p.key).length}
                >
                  Params
                </TabButton>
                <TabButton
                  active={requestTab === 'headers'}
                  onClick={() => setRequestTab('headers')}
                  badge={request.headers.filter((h) => h.enabled && h.key).length}
                >
                  Headers
                </TabButton>
                <TabButton active={requestTab === 'body'} onClick={() => setRequestTab('body')}>
                  Body
                </TabButton>
                <TabButton active={requestTab === 'auth'} onClick={() => setRequestTab('auth')}>
                  Auth
                </TabButton>
                <TabButton
                  active={requestTab === 'scripts'}
                  onClick={() => setRequestTab('scripts')}
                >
                  Scripts
                </TabButton>
              </div>
            </div>

            {/* Request content */}
            <div className="flex-1 overflow-auto p-4">
              {requestTab === 'params' && (
                <KeyValueEditor
                  items={request.params}
                  onChange={(params) => setRequest({ ...request, params })}
                  keyPlaceholder="Parameter"
                  valuePlaceholder="Value"
                />
              )}

              {requestTab === 'headers' && (
                <KeyValueEditor
                  items={request.headers}
                  onChange={(headers) => setRequest({ ...request, headers })}
                  keyPlaceholder="Header"
                  valuePlaceholder="Value"
                />
              )}

              {requestTab === 'body' && (
                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {(
                      [
                        'none',
                        'json',
                        'xml',
                        'form-data',
                        'x-www-form-urlencoded',
                        'raw',
                        'graphql',
                      ] as BodyType[]
                    ).map((type) => (
                      <button
                        key={type}
                        onClick={() =>
                          setRequest({
                            ...request,
                            body: { ...request.body, type },
                          })
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          request.body.type === type
                            ? 'bg-violet-500 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                      >
                        {type === 'none'
                          ? 'None'
                          : type === 'json'
                            ? 'JSON'
                            : type === 'xml'
                              ? 'XML'
                              : type === 'form-data'
                                ? 'Form Data'
                                : type === 'x-www-form-urlencoded'
                                  ? 'URL Encoded'
                                  : type === 'raw'
                                    ? 'Raw'
                                    : 'GraphQL'}
                      </button>
                    ))}
                  </div>

                  {request.body.type !== 'none' && request.body.type !== 'form-data' && (
                    <textarea
                      value={request.body.content}
                      onChange={(e) =>
                        setRequest({
                          ...request,
                          body: {
                            ...request.body,
                            content: e.target.value,
                          },
                        })
                      }
                      placeholder={
                        request.body.type === 'json'
                          ? '{\n  "key": "value"\n}'
                          : request.body.type === 'xml'
                            ? '<?xml version="1.0"?>\n<root>\n  <item>value</item>\n</root>'
                            : request.body.type === 'graphql'
                              ? 'query {\n  user {\n    id\n    name\n  }\n}'
                              : 'Enter request body...'
                      }
                      className="w-full h-96 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 resize-none"
                      spellCheck={false}
                    />
                  )}

                  {request.body.type === 'form-data' && (
                    <KeyValueEditor
                      items={
                        request.body.formData || [
                          {
                            id: generateId(),
                            key: '',
                            value: '',
                            enabled: true,
                          },
                        ]
                      }
                      onChange={(formData) =>
                        setRequest({
                          ...request,
                          body: { ...request.body, formData },
                        })
                      }
                      keyPlaceholder="Field"
                      valuePlaceholder="Value"
                    />
                  )}
                </div>
              )}

              {requestTab === 'auth' && (
                <div className="space-y-6">
                  <div className="flex gap-2 flex-wrap">
                    {(['none', 'bearer', 'basic', 'api-key', 'oauth2'] as AuthType[]).map(
                      (type) => (
                        <button
                          key={type}
                          onClick={() =>
                            setRequest({
                              ...request,
                              auth: { ...request.auth, type },
                            })
                          }
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            request.auth.type === type
                              ? 'bg-violet-500 text-white shadow-md'
                              : 'bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
                          }`}
                        >
                          {type === 'none'
                            ? 'No Auth'
                            : type === 'bearer'
                              ? 'Bearer Token'
                              : type === 'basic'
                                ? 'Basic Auth'
                                : type === 'api-key'
                                  ? 'API Key'
                                  : 'OAuth 2.0'}
                        </button>
                      ),
                    )}
                  </div>

                  {request.auth.type === 'bearer' && (
                    <div className="space-y-4 max-w-lg">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Token
                        </label>
                        <input
                          type="text"
                          value={request.auth.bearer?.token || ''}
                          onChange={(e) =>
                            setRequest({
                              ...request,
                              auth: {
                                ...request.auth,
                                bearer: { token: e.target.value },
                              },
                            })
                          }
                          placeholder="Enter bearer token"
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                        />
                      </div>
                    </div>
                  )}

                  {request.auth.type === 'basic' && (
                    <div className="space-y-4 max-w-lg">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Username
                        </label>
                        <input
                          type="text"
                          value={request.auth.basic?.username || ''}
                          onChange={(e) =>
                            setRequest({
                              ...request,
                              auth: {
                                ...request.auth,
                                basic: {
                                  ...request.auth.basic,
                                  username: e.target.value,
                                  password: request.auth.basic?.password || '',
                                },
                              },
                            })
                          }
                          placeholder="Enter username"
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={request.auth.basic?.password || ''}
                            onChange={(e) =>
                              setRequest({
                                ...request,
                                auth: {
                                  ...request.auth,
                                  basic: {
                                    ...request.auth.basic,
                                    username: request.auth.basic?.username || '',
                                    password: e.target.value,
                                  },
                                },
                              })
                            }
                            placeholder="Enter password"
                            className="w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {request.auth.type === 'api-key' && (
                    <div className="space-y-4 max-w-lg">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Key Name
                        </label>
                        <input
                          type="text"
                          value={request.auth.apiKey?.key || ''}
                          onChange={(e) =>
                            setRequest({
                              ...request,
                              auth: {
                                ...request.auth,
                                apiKey: {
                                  ...request.auth.apiKey,
                                  key: e.target.value,
                                  value: request.auth.apiKey?.value || '',
                                  addTo: request.auth.apiKey?.addTo || 'header',
                                },
                              },
                            })
                          }
                          placeholder="e.g., X-API-Key"
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Key Value
                        </label>
                        <input
                          type="text"
                          value={request.auth.apiKey?.value || ''}
                          onChange={(e) =>
                            setRequest({
                              ...request,
                              auth: {
                                ...request.auth,
                                apiKey: {
                                  ...request.auth.apiKey,
                                  key: request.auth.apiKey?.key || '',
                                  value: e.target.value,
                                  addTo: request.auth.apiKey?.addTo || 'header',
                                },
                              },
                            })
                          }
                          placeholder="Enter API key value"
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Add To
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setRequest({
                                ...request,
                                auth: {
                                  ...request.auth,
                                  apiKey: {
                                    ...request.auth.apiKey!,
                                    addTo: 'header',
                                  },
                                },
                              })
                            }
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              request.auth.apiKey?.addTo === 'header'
                                ? 'bg-violet-500 text-white shadow-md'
                                : 'bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
                            }`}
                          >
                            Header
                          </button>
                          <button
                            onClick={() =>
                              setRequest({
                                ...request,
                                auth: {
                                  ...request.auth,
                                  apiKey: {
                                    ...request.auth.apiKey!,
                                    addTo: 'query',
                                  },
                                },
                              })
                            }
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              request.auth.apiKey?.addTo === 'query'
                                ? 'bg-violet-500 text-white shadow-md'
                                : 'bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
                            }`}
                          >
                            Query Param
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {request.auth.type === 'none' && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-500">
                      <Lock className="w-10 h-10 mb-3 opacity-50" />
                      <p className="text-sm">No authentication</p>
                      <p className="text-xs mt-1">Select an auth type above to configure</p>
                    </div>
                  )}
                </div>
              )}

              {requestTab === 'scripts' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Pre-request Script
                      </label>
                      <span className="text-xs text-slate-500 dark:text-slate-500">JavaScript</span>
                    </div>
                    <textarea
                      value={request.preRequestScript || ''}
                      onChange={(e) =>
                        setRequest({
                          ...request,
                          preRequestScript: e.target.value,
                        })
                      }
                      placeholder="// Runs before the request is sent&#10;// e.g., pm.environment.set('timestamp', Date.now())"
                      className="w-full h-48 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 resize-none"
                      spellCheck={false}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Test Script
                      </label>
                      <span className="text-xs text-slate-500 dark:text-slate-500">JavaScript</span>
                    </div>
                    <textarea
                      value={request.testScript || ''}
                      onChange={(e) => setRequest({ ...request, testScript: e.target.value })}
                      placeholder="// Runs after the response is received&#10;// e.g., pm.test('Status is 200', () => pm.response.to.have.status(200))"
                      className="w-full h-48 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 resize-none"
                      spellCheck={false}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Response panel */}
          <div className="flex-1 flex flex-col bg-white dark:bg-[#0D1117] overflow-hidden">
            {/* Response tabs */}
            <div className="flex items-center justify-between px-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex">
                <TabButton active={responseTab === 'body'} onClick={() => setResponseTab('body')}>
                  Body
                </TabButton>
                <TabButton
                  active={responseTab === 'headers'}
                  onClick={() => setResponseTab('headers')}
                  badge={response ? Object.keys(response.headers).length : undefined}
                >
                  Headers
                </TabButton>
                <TabButton
                  active={responseTab === 'cookies'}
                  onClick={() => setResponseTab('cookies')}
                  badge={response?.cookies?.length}
                >
                  Cookies
                </TabButton>
                <TabButton
                  active={responseTab === 'timeline'}
                  onClick={() => setResponseTab('timeline')}
                >
                  Timeline
                </TabButton>
              </div>

              {response && (
                <div className="flex items-center gap-4 pr-2">
                  <span
                    className={`px-3 py-1 rounded-lg text-sm font-mono font-semibold border ${getStatusColor(
                      response.status,
                    )}`}
                  >
                    {response.status} {response.statusText}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    {formatTime(response.time)}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5" />
                    {formatBytes(response.size)}
                  </span>
                </div>
              )}
            </div>

            {/* Response content */}
            <div className="flex-1 overflow-auto p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <RefreshCw className="w-8 h-8 text-violet-500 dark:text-violet-400 animate-spin mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">Sending request...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center mb-4">
                    <XCircle className="w-8 h-8 text-rose-500 dark:text-rose-400" />
                  </div>
                  <p className="text-rose-600 dark:text-rose-400 font-medium mb-2">
                    Request Failed
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md">
                    {error}
                  </p>
                </div>
              ) : response ? (
                <>
                  {responseTab === 'body' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider font-medium">
                            {response.headers['content-type']?.split(';')[0] || 'Response'}
                          </span>
                          {contentType === 'html' && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => setBodyViewMode('raw')}
                                className={`px-2 py-1 text-xs rounded ${
                                  bodyViewMode === 'raw'
                                    ? 'bg-violet-500 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                Raw
                              </button>
                              <button
                                onClick={() => setBodyViewMode('preview')}
                                className={`px-2 py-1 text-xs rounded ${
                                  bodyViewMode === 'preview'
                                    ? 'bg-violet-500 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                Preview
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(response.body)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                          </button>
                          <button
                            onClick={() => {
                              const blob = new Blob([response.body], {
                                type: 'text/plain',
                              });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `response-${Date.now()}.txt`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                        </div>
                      </div>

                      {contentType === 'html' && bodyViewMode === 'preview' ? (
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                          <iframe
                            srcDoc={response.body}
                            className="w-full h-[600px] bg-white"
                            sandbox="allow-same-origin"
                            title="HTML Preview"
                          />
                        </div>
                      ) : contentType === 'image' ? (
                        <div className="flex items-center justify-center p-8 bg-slate-100 dark:bg-slate-800/30 rounded-xl">
                          <img
                            src={`data:${response.headers['content-type']};base64,${btoa(response.body)}`}
                            alt="Response"
                            className="max-w-full max-h-[600px] rounded-lg shadow-lg"
                          />
                        </div>
                      ) : (
                        <pre className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-mono leading-relaxed overflow-auto max-h-[600px]">
                          {contentType === 'json' ? (
                            <code
                              dangerouslySetInnerHTML={{
                                __html: syntaxHighlight(response.body, theme),
                              }}
                            />
                          ) : contentType === 'xml' ? (
                            <code
                              dangerouslySetInnerHTML={{
                                __html: highlightXML(
                                  response.body.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
                                  theme,
                                ),
                              }}
                            />
                          ) : (
                            <code className="text-slate-800 dark:text-slate-300">
                              {response.body}
                            </code>
                          )}
                        </pre>
                      )}
                    </div>
                  )}

                  {responseTab === 'headers' && (
                    <div className="space-y-2">
                      {Object.entries(response.headers).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-start gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg"
                        >
                          <span className="text-sm font-mono text-rose-600 dark:text-rose-400 min-w-[200px] font-medium">
                            {key}
                          </span>
                          <span className="text-sm font-mono text-slate-700 dark:text-slate-300 break-all">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {responseTab === 'cookies' && (
                    <div>
                      {response.cookies && response.cookies.length > 0 ? (
                        <div className="space-y-2">
                          {response.cookies.map((cookie, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg"
                            >
                              <span className="text-sm font-mono text-amber-600 dark:text-amber-400 min-w-[200px] font-medium">
                                {cookie.name}
                              </span>
                              <span className="text-sm font-mono text-slate-700 dark:text-slate-300 break-all">
                                {cookie.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-500">
                          <Cookie className="w-10 h-10 mb-3 opacity-50" />
                          <p className="text-sm">No cookies in response</p>
                        </div>
                      )}
                    </div>
                  )}

                  {responseTab === 'timeline' && <ResponseTimeline timeline={response.timeline} />}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <Send className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">
                    Send a request to see the response
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-500">
                    Press{' '}
                    <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                      ⌘ Enter
                    </kbd>{' '}
                    or click Send
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <CodeGeneratorModal
        isOpen={showCodeGen}
        onClose={() => setShowCodeGen(false)}
        request={request}
      />

      <EnvironmentModal
        isOpen={showEnvManager}
        onClose={() => setShowEnvManager(false)}
        environments={environments}
        onSave={setEnvironments}
        activeEnv={activeEnvId}
        onSetActive={setActiveEnvId}
      />

      <SaveRequestModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        request={request}
        collections={collections}
        onSave={saveRequest}
      />
    </div>
  );
}
