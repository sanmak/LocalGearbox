/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { Send } from 'lucide-react';
import { useApiClientStore, HttpMethod, fileMap } from '@/lib/stores/api-client-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SaveRequestDialog } from './SaveRequestDialog';
import { CodeGenerator } from './CodeGenerator';
import { runScript } from '@/lib/sandbox';

const METHODS: { value: HttpMethod; color: string }[] = [
  { value: 'GET', color: 'text-green-500' },
  { value: 'POST', color: 'text-yellow-500' },
  { value: 'PUT', color: 'text-blue-500' },
  { value: 'DELETE', color: 'text-red-500' },
  { value: 'PATCH', color: 'text-purple-500' },
];

export function IntegratedURLBar() {
  const {
    getActiveTab,
    updateTabRequest,
    updateTabResponse,
    addToHistory,
    getActiveEnvironment,
    updateEnvironment,
    resolveAuth,
  } = useApiClientStore();

  const activeTab = getActiveTab();

  if (!activeTab) return null;

  const handleSend = async () => {
    if (!activeTab) return;

    // Reset response
    updateTabResponse(activeTab.id, {
      status: 0,
      statusText: 'Loading...',
      time: 0,
      size: 0,
      headers: {},
      data: null,
      loading: true,
    });

    const startTime = performance.now();
    try {
      const activeEnv = getActiveEnvironment();

      // 0. Environment Map for Scripting
      const envMap: Record<string, string> = {};
      if (activeEnv) {
        activeEnv.variables.forEach((v) => {
          if (v.enabled) envMap[v.key] = v.value;
        });
      }

      // 1. Run Pre-request Script
      if (activeTab.request.preRequestScript && activeTab.request.preRequestScript.trim()) {
        const scriptResult = await runScript(activeTab.request.preRequestScript, {
          environment: envMap,
        });

        if (scriptResult.error) {
          console.error('Pre-request script error:', scriptResult.error);
        }

        // Apply Environment Updates
        if (activeEnv && Object.keys(scriptResult.environmentUpdates).length > 0) {
          const newVars = activeEnv.variables.map((v) =>
            scriptResult.environmentUpdates[v.key] !== undefined
              ? { ...v, value: scriptResult.environmentUpdates[v.key] }
              : v,
          );
          updateEnvironment(activeEnv.id, { variables: newVars });

          // Sync local map for substitution
          Object.entries(scriptResult.environmentUpdates).forEach(([k, v]) => (envMap[k] = v));
        }
      }

      // 2. Prepare for substitution
      let finalUrlStr = activeTab.request.url || '';
      let finalBody = activeTab.request.body || '';
      let finalHeaders = [...activeTab.request.headers];

      const substitute = (str: string) => {
        if (!str) return str;
        let result = str;
        // Use the envMap which contains current env + pre-request updates
        Object.entries(envMap).forEach(([key, val]) => {
          result = result.replace(new RegExp(`<<${key}>>`, 'g'), val);
        });
        return result;
      };

      finalUrlStr = substitute(finalUrlStr);
      finalBody = substitute(finalBody);
      finalHeaders = finalHeaders.map((h) => ({ ...h, value: substitute(h.value) }));

      // 4. Inject Resolved Auth Headers
      const auth = resolveAuth(activeTab.id);
      if (auth && auth.type !== 'none') {
        if (auth.type === 'bearer' && auth.bearerToken) {
          finalHeaders.push({
            id: 'auth-bearer',
            key: 'Authorization',
            value: `Bearer ${auth.bearerToken}`,
            enabled: true,
          });
        } else if (auth.type === 'basic' && auth.basicUsername) {
          const token = btoa(`${auth.basicUsername}:${auth.basicPassword || ''}`);
          finalHeaders.push({
            id: 'auth-basic',
            key: 'Authorization',
            value: `Basic ${token}`,
            enabled: true,
          });
        } else if (auth.type === 'apikey' && auth.apiKey && auth.apiValue) {
          if (auth.apiLocation !== 'query') {
            finalHeaders.push({
              id: 'auth-apikey',
              key: auth.apiKey,
              value: auth.apiValue,
              enabled: true,
            });
          }
        } else if (auth.type === 'oauth2' && auth.oauth2?.accessToken) {
          finalHeaders.push({
            id: 'auth-oauth2',
            key: 'Authorization',
            value: `Bearer ${auth.oauth2.accessToken}`,
            enabled: true,
          });
        }
      }

      // 4. Construct URL
      let finalUrlObj: URL;
      try {
        finalUrlObj = new URL(finalUrlStr);
      } catch (e) {
        if (!finalUrlStr.startsWith('http')) {
          finalUrlObj = new URL('https://' + finalUrlStr);
        } else {
          finalUrlObj = new URL(finalUrlStr);
        }
      }

      // Inject API Key (Query)
      if (
        auth &&
        auth.type === 'apikey' &&
        auth.apiLocation === 'query' &&
        auth.apiKey &&
        auth.apiValue
      ) {
        finalUrlObj.searchParams.append(auth.apiKey, auth.apiValue);
      }

      activeTab.request.params.forEach((p) => {
        if (p.key && p.enabled) {
          const key = substitute(p.key);
          const val = substitute(p.value);
          finalUrlObj.searchParams.append(key, val);
        }
      });

      const finalUrlToSend = finalUrlObj.toString();

      // 3. Inject Cookies (Move here to have finalUrlToSend)
      const { cookies, updateCookies } = useApiClientStore.getState();
      const urlForCookies = new URL(finalUrlToSend);
      const relevantCookies = cookies.filter(
        (c) =>
          urlForCookies.hostname.endsWith(c.domain) && urlForCookies.pathname.startsWith(c.path),
      );

      if (relevantCookies.length > 0) {
        const cookieStr = relevantCookies.map((c) => `${c.name}=${c.value}`).join('; ');
        finalHeaders.push({ id: 'cookie-auto', key: 'Cookie', value: cookieStr, enabled: true });
      }

      // 5. Build Headers
      const headersObject: Record<string, string> = {};
      finalHeaders.forEach((h) => {
        if (h.key && h.enabled) {
          headersObject[h.key] = h.value;
        }
      });

      // 6. Build Body
      let requestBodyPayload: any = finalBody;
      let multipartPayload: any[] | undefined = undefined;

      if ((activeTab.request.bodyType as string) === 'form-data') {
        multipartPayload = [];
        for (const p of activeTab.request.bodyFormData || []) {
          if (p.enabled && p.key) {
            if (p.type === 'file') {
              const file = fileMap.get(p.id);
              if (file) {
                const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve((reader.result as string).split(',')[1]);
                  reader.readAsDataURL(file);
                });
                multipartPayload.push({
                  key: p.key,
                  value: base64,
                  type: 'file',
                  fileName: file.name,
                });
              }
            } else {
              multipartPayload.push({ key: p.key, value: substitute(p.value), type: 'text' });
            }
          }
        }
        headersObject['Content-Type'] = undefined as any; // Proxy will set it
      } else if (activeTab.request.bodyType === 'x-www-form-urlencoded') {
        const params = new URLSearchParams();
        (activeTab.request.bodyFormUrlEncoded || []).forEach((p) => {
          if (p.enabled && p.key) params.append(p.key, substitute(p.value));
        });
        requestBodyPayload = params.toString();
        headersObject['Content-Type'] = 'application/x-www-form-urlencoded';
      } else if (activeTab.request.bodyType === 'json') {
        if (!headersObject['Content-Type']) headersObject['Content-Type'] = 'application/json';
      }

      // 7. Make direct request (no proxy)
      let requestBody: BodyInit | null = null;

      if (multipartPayload && multipartPayload.length > 0) {
        // Build FormData for multipart/form-data
        const formData = new FormData();
        for (const part of multipartPayload) {
          if (part.type === 'file' && part.fileName) {
            // Convert base64 back to blob for multipart
            const byteCharacters = atob(part.value);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray]);
            formData.append(part.key, blob, part.fileName);
          } else {
            formData.append(part.key, part.value);
          }
        }
        requestBody = formData;
        // Remove Content-Type header - browser will set it with boundary
        delete headersObject['Content-Type'];
      } else if (
        requestBodyPayload &&
        activeTab.request.method !== 'GET' &&
        activeTab.request.method !== 'HEAD'
      ) {
        requestBody = requestBodyPayload;
      }

      const fetchStartTime = performance.now();
      const res = await fetch(finalUrlToSend, {
        method: activeTab.request.method,
        headers: headersObject,
        body: requestBody,
        mode: 'cors',
        credentials: 'omit', // Don't send cookies by default (we handle via Cookie header)
      });

      const fetchEndTime = performance.now();

      // Parse response
      const contentType = res.headers.get('content-type') || '';
      let responseBody: any;
      let isBase64 = false;

      if (contentType.includes('application/json')) {
        responseBody = await res.json();
      } else if (contentType.startsWith('image/')) {
        // Handle images as base64
        const blob = await res.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });
        responseBody = base64;
        isBase64 = true;
      } else {
        responseBody = await res.text();
      }

      // Build response headers object
      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Extract Set-Cookie headers (note: browser may not expose these due to security)
      const setCookies: any[] = [];
      // Note: Set-Cookie headers are not accessible via fetch API in browsers for security reasons
      // This is intentional - we cannot access Set-Cookie headers in client-side fetch

      const responseData = {
        status: res.status,
        statusText: res.statusText,
        time: Math.round(fetchEndTime - fetchStartTime),
        size: responseBody ? new Blob([JSON.stringify(responseBody)]).size : 0,
        headers: responseHeaders,
        body: responseBody,
        isBase64,
        setCookies,
      };

      // Update Cookie Jar
      if (responseData.setCookies && responseData.setCookies.length > 0) {
        updateCookies(responseData.setCookies, new URL(finalUrlToSend).hostname);
      }

      const safeJsonParse = (str: string) => {
        try {
          return JSON.parse(str);
        } catch (e) {
          return str;
        }
      };

      // 8. Run Test Script
      let testResults: any[] = [];
      if (activeTab.request.testScript && activeTab.request.testScript.trim()) {
        const scriptResult = await runScript(activeTab.request.testScript, {
          environment: envMap,
          response: {
            status: responseData.status,
            statusText: responseData.statusText,
            headers: responseData.headers,
            body:
              typeof responseData.body === 'string'
                ? safeJsonParse(responseData.body)
                : responseData.body,
          },
        });

        testResults = scriptResult.testResults || [];

        if (activeEnv && Object.keys(scriptResult.environmentUpdates).length > 0) {
          const newVars = activeEnv.variables.map((v) =>
            scriptResult.environmentUpdates[v.key] !== undefined
              ? { ...v, value: scriptResult.environmentUpdates[v.key] }
              : v,
          );
          updateEnvironment(activeEnv.id, { variables: newVars });
        }
      }

      addToHistory(activeTab.request);
      updateTabResponse(activeTab.id, {
        status: responseData.status,
        statusText: responseData.statusText,
        time: responseData.time || Math.round(performance.now() - startTime),
        size: responseData.size,
        headers: responseData.headers,
        data: responseData.isBase64
          ? responseData.body
          : typeof responseData.body === 'string'
            ? safeJsonParse(responseData.body)
            : responseData.body,
        isBase64: responseData.isBase64,
        loading: false,
        testResults,
      });
    } catch (err: any) {
      console.error('Request Error', err);

      // Import CORS error detection (will add import at top)
      const isCorsError = (error: unknown): boolean => {
        if (!(error instanceof TypeError) && !(error instanceof Error)) {
          return false;
        }
        const message = error.message.toLowerCase();
        return (
          message.includes('failed to fetch') ||
          message.includes('networkerror') ||
          message.includes('load failed') ||
          message.includes('cors') ||
          message.includes('cross-origin')
        );
      };

      const errorType = isCorsError(err) ? 'CORS' : 'NETWORK';

      updateTabResponse(activeTab.id, {
        status: 0,
        statusText: 'Error',
        time: Math.round(performance.now() - startTime),
        size: 0,
        headers: {},
        data: null,
        loading: false,
        error: err.message,
        errorType,
        errorUrl: activeTab.request.url,
      });
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-card border-b">
      <div className="flex flex-1 items-center gap-0 rounded-md border border-input bg-background overflow-hidden focus-within:ring-1 focus-within:ring-ring">
        <Select
          value={activeTab.request.method}
          onValueChange={(v) => updateTabRequest(activeTab.id, { method: v as HttpMethod })}
        >
          <SelectTrigger className="w-[110px] sm:w-[130px] rounded-none border-0 bg-transparent focus:ring-0 px-3 font-bold">
            <span className={METHODS.find((m) => m.value === activeTab.request.method)?.color}>
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            {METHODS.map((m) => (
              <SelectItem key={m.value} value={m.value} className="font-semibold">
                <span className={m.color}>{m.value}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="h-6 w-[1px] bg-border" />

        <Input
          value={activeTab.request.url}
          onChange={(e) => updateTabRequest(activeTab.id, { url: e.target.value })}
          className="flex-1 rounded-none border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/50"
          placeholder="Enter request URL (e.g., https://api.com/get)"
        />
      </div>

      <Button
        onClick={handleSend}
        disabled={activeTab.response?.loading}
        className="h-10 px-6 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px]"
      >
        <Send className="mr-2 h-4 w-4" />
        Send
      </Button>

      <SaveRequestDialog request={activeTab.request} />
      <CodeGenerator request={activeTab.request} />
    </div>
  );
}
