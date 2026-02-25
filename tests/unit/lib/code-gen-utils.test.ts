/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import { generateCodeSnippet, CodeLanguage } from '@/lib/code-gen-utils';
import { ApiRequest } from '@/lib/stores/api-client-store';

describe('generateCodeSnippet - new languages', () => {
  // Base mock request
  const baseRequest: ApiRequest = {
    id: '1',
    name: 'Test Request',
    method: 'GET',
    url: 'https://api.example.com/data',
    headers: [{ id: 'h1', key: 'Accept', value: 'application/json', enabled: true }],
    auth: { type: 'none' },
    bodyType: 'none',
    body: '',
    bodyFormData: [],
    bodyFormUrlEncoded: [],
    params: [],
    settings: {
      followRedirects: true,
      sslVerification: true,
      timeout: 0,
    },
  };

  const postRequest: ApiRequest = {
    ...baseRequest,
    method: 'POST',
    bodyType: 'json',
    body: '{"name": "test", "value": 42}',
  };

  const postWithSpecialChars: ApiRequest = {
    ...baseRequest,
    method: 'POST',
    bodyType: 'json',
    body: '{"message": "He said \\"hello\\"", "path": "C:\\\\Users"}',
  };

  const putRequest: ApiRequest = {
    ...baseRequest,
    method: 'PUT',
    bodyType: 'json',
    body: '{"updated": true}',
  };

  const patchRequest: ApiRequest = {
    ...baseRequest,
    method: 'PATCH',
    bodyType: 'json',
    body: '{"partial": "update"}',
  };

  const requestWithMultipleHeaders: ApiRequest = {
    ...baseRequest,
    headers: [
      { id: 'h1', key: 'Accept', value: 'application/json', enabled: true },
      { id: 'h2', key: 'X-Custom-Header', value: 'custom-value', enabled: true },
      { id: 'h3', key: 'X-Disabled', value: 'should-not-appear', enabled: false },
    ],
  };

  const requestWithAuth: ApiRequest = {
    ...baseRequest,
    auth: { type: 'bearer', bearerToken: 'my-secret-token' },
  };

  // ─── Dart ─────────────────────────────────────────────────────────────────

  describe('Dart (dart_http)', () => {
    it('should generate basic GET request', () => {
      const result = generateCodeSnippet('dart_http', baseRequest);
      expect(result).toContain("import 'package:http/http.dart' as http");
      expect(result).toContain("Uri.parse('https://api.example.com/data')");
      expect(result).toContain('http.get');
      expect(result).toContain("'Accept': 'application/json'");
    });

    it('should generate POST request with body', () => {
      const result = generateCodeSnippet('dart_http', postRequest);
      expect(result).toContain('http.post');
      expect(result).toContain('body:');
      expect(result).toContain("'Content-Type': 'application/json'");
    });

    it('should generate PUT request', () => {
      const result = generateCodeSnippet('dart_http', putRequest);
      expect(result).toContain('http.put');
    });

    it('should include bearer auth header', () => {
      const result = generateCodeSnippet('dart_http', requestWithAuth);
      expect(result).toContain('Authorization');
      expect(result).toContain('Bearer my-secret-token');
    });

    it('should only include enabled headers', () => {
      const result = generateCodeSnippet('dart_http', requestWithMultipleHeaders);
      expect(result).toContain('Accept');
      expect(result).toContain('X-Custom-Header');
      expect(result).not.toContain('X-Disabled');
    });
  });

  // ─── Elixir ───────────────────────────────────────────────────────────────

  describe('Elixir (elixir_httpoison)', () => {
    it('should generate basic GET request', () => {
      const result = generateCodeSnippet('elixir_httpoison', baseRequest);
      expect(result).toContain('HTTPoison');
      expect(result).toContain('httpoison');
      expect(result).toContain('"https://api.example.com/data"');
      expect(result).toContain('"Accept"');
    });

    it('should generate POST request with body', () => {
      const result = generateCodeSnippet('elixir_httpoison', postRequest);
      expect(result).toContain('HTTPoison.post');
      expect(result).toContain('body');
    });

    it('should handle PUT method', () => {
      const result = generateCodeSnippet('elixir_httpoison', putRequest);
      expect(result).toContain('HTTPoison.put');
    });

    it('should include IO.puts for output', () => {
      const result = generateCodeSnippet('elixir_httpoison', baseRequest);
      expect(result).toContain('IO.puts');
    });
  });

  // ─── Haskell ──────────────────────────────────────────────────────────────

  describe('Haskell (haskell_http_conduit)', () => {
    it('should generate basic GET request', () => {
      const result = generateCodeSnippet('haskell_http_conduit', baseRequest);
      expect(result).toContain('OverloadedStrings');
      expect(result).toContain('Network.HTTP.Simple');
      expect(result).toContain('setRequestMethod "GET"');
      expect(result).toContain('parseRequest_');
      expect(result).toContain('"https://api.example.com/data"');
    });

    it('should generate POST request with body', () => {
      const result = generateCodeSnippet('haskell_http_conduit', postRequest);
      expect(result).toContain('setRequestMethod "POST"');
      expect(result).toContain('setRequestBodyLBS');
    });

    it('should set secure flag for HTTPS', () => {
      const result = generateCodeSnippet('haskell_http_conduit', baseRequest);
      expect(result).toContain('setRequestSecure True');
    });

    it('should include headers', () => {
      const result = generateCodeSnippet('haskell_http_conduit', baseRequest);
      expect(result).toContain('addRequestHeader');
      expect(result).toContain('"Accept"');
    });

    it('should include httpLBS call', () => {
      const result = generateCodeSnippet('haskell_http_conduit', baseRequest);
      expect(result).toContain('httpLBS request');
      expect(result).toContain('getResponseBody');
    });
  });

  // ─── Julia ────────────────────────────────────────────────────────────────

  describe('Julia (julia_http)', () => {
    it('should generate basic GET request', () => {
      const result = generateCodeSnippet('julia_http', baseRequest);
      expect(result).toContain('using HTTP');
      expect(result).toContain('"https://api.example.com/data"');
      expect(result).toContain('HTTP.request("GET"');
      expect(result).toContain('"Accept"');
    });

    it('should generate POST request with body', () => {
      const result = generateCodeSnippet('julia_http', postRequest);
      expect(result).toContain('HTTP.request("POST"');
      expect(result).toContain('body');
    });

    it('should print status and body', () => {
      const result = generateCodeSnippet('julia_http', baseRequest);
      expect(result).toContain('println');
      expect(result).toContain('response.status');
      expect(result).toContain('response.body');
    });

    it('should handle PATCH method', () => {
      const result = generateCodeSnippet('julia_http', patchRequest);
      expect(result).toContain('HTTP.request("PATCH"');
    });
  });

  // ─── Lua ──────────────────────────────────────────────────────────────────

  describe('Lua (lua_socket_http)', () => {
    it('should generate basic GET request with HTTPS', () => {
      const result = generateCodeSnippet('lua_socket_http', baseRequest);
      expect(result).toContain('require("ssl.https")');
      expect(result).toContain('ltn12');
      expect(result).toContain('"https://api.example.com/data"');
      expect(result).toContain('method = "GET"');
    });

    it('should generate POST request with body', () => {
      const result = generateCodeSnippet('lua_socket_http', postRequest);
      expect(result).toContain('method = "POST"');
      expect(result).toContain('request_body');
      expect(result).toContain('source = ltn12.source.string(request_body)');
      expect(result).toContain('Content-Length');
    });

    it('should use socket.http for HTTP URLs', () => {
      const httpRequest: ApiRequest = {
        ...baseRequest,
        url: 'http://api.example.com/data',
      };
      const result = generateCodeSnippet('lua_socket_http', httpRequest);
      expect(result).toContain('require("socket.http")');
    });

    it('should include sink for response', () => {
      const result = generateCodeSnippet('lua_socket_http', baseRequest);
      expect(result).toContain('sink = ltn12.sink.table(response_body)');
      expect(result).toContain('table.concat(response_body)');
    });

    it('should include headers', () => {
      const result = generateCodeSnippet('lua_socket_http', baseRequest);
      expect(result).toContain('["Accept"] = "application/json"');
    });
  });

  // ─── Perl ─────────────────────────────────────────────────────────────────

  describe('Perl (perl_lwp)', () => {
    it('should generate basic GET request', () => {
      const result = generateCodeSnippet('perl_lwp', baseRequest);
      expect(result).toContain('use strict;');
      expect(result).toContain('use warnings;');
      expect(result).toContain('LWP::UserAgent');
      expect(result).toContain('HTTP::Request');
      expect(result).toContain("'GET'");
      expect(result).toContain('https://api.example.com/data');
    });

    it('should generate POST request with body', () => {
      const result = generateCodeSnippet('perl_lwp', postRequest);
      expect(result).toContain("'POST'");
      expect(result).toContain('->content(');
    });

    it('should include headers', () => {
      const result = generateCodeSnippet('perl_lwp', baseRequest);
      expect(result).toContain("->header('Accept'");
    });

    it('should include error handling', () => {
      const result = generateCodeSnippet('perl_lwp', baseRequest);
      expect(result).toContain('is_success');
      expect(result).toContain('decoded_content');
      expect(result).toContain('status_line');
    });

    it('should handle bearer auth header', () => {
      const result = generateCodeSnippet('perl_lwp', requestWithAuth);
      expect(result).toContain('Authorization');
      expect(result).toContain('Bearer my-secret-token');
    });
  });

  // ─── Scala ────────────────────────────────────────────────────────────────

  describe('Scala (scala_sttp)', () => {
    it('should generate basic GET request', () => {
      const result = generateCodeSnippet('scala_sttp', baseRequest);
      expect(result).toContain('sttp.client4');
      expect(result).toContain('basicRequest');
      expect(result).toContain('.method(Method("GET")');
      expect(result).toContain('uri"https://api.example.com/data"');
    });

    it('should generate POST request with body', () => {
      const result = generateCodeSnippet('scala_sttp', postRequest);
      expect(result).toContain('.method(Method("POST")');
      expect(result).toContain('.body(');
    });

    it('should include headers', () => {
      const result = generateCodeSnippet('scala_sttp', baseRequest);
      expect(result).toContain('.header("Accept", "application/json")');
    });

    it('should include backend and send', () => {
      const result = generateCodeSnippet('scala_sttp', baseRequest);
      expect(result).toContain('DefaultSyncBackend');
      expect(result).toContain('.send(backend)');
    });

    it('should print status and body', () => {
      const result = generateCodeSnippet('scala_sttp', baseRequest);
      expect(result).toContain('response.code');
      expect(result).toContain('response.body');
    });

    it('should handle DELETE method', () => {
      const deleteReq: ApiRequest = { ...baseRequest, method: 'DELETE' };
      const result = generateCodeSnippet('scala_sttp', deleteReq);
      expect(result).toContain('.method(Method("DELETE")');
    });
  });

  // ─── Cross-Language Checks ────────────────────────────────────────────────

  describe('cross-language checks', () => {
    const newLanguages: CodeLanguage[] = [
      'dart_http',
      'elixir_httpoison',
      'haskell_http_conduit',
      'julia_http',
      'lua_socket_http',
      'perl_lwp',
      'scala_sttp',
    ];

    newLanguages.forEach((lang) => {
      it(`${lang}: should produce non-empty output for GET request`, () => {
        const result = generateCodeSnippet(lang, baseRequest);
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(50);
      });

      it(`${lang}: should include the URL in the output`, () => {
        const result = generateCodeSnippet(lang, baseRequest);
        expect(result).toContain('https://api.example.com/data');
      });

      it(`${lang}: should include the HTTP method for POST`, () => {
        const result = generateCodeSnippet(lang, postRequest);
        expect(result.toUpperCase()).toContain('POST');
      });
    });
  });

  // ─── Special Characters & Edge Cases ──────────────────────────────────────

  describe('special characters and edge cases', () => {
    it('should handle special characters in body for Dart', () => {
      const result = generateCodeSnippet('dart_http', postWithSpecialChars);
      expect(result).toBeTruthy();
      expect(result).toContain('body:');
    });

    it('should handle special characters in body for Perl', () => {
      const result = generateCodeSnippet('perl_lwp', postWithSpecialChars);
      expect(result).toBeTruthy();
      expect(result).toContain('content');
    });

    it('should handle special characters in body for Scala', () => {
      const result = generateCodeSnippet('scala_sttp', postWithSpecialChars);
      expect(result).toBeTruthy();
      expect(result).toContain('.body(');
    });

    it('should handle empty headers for new languages', () => {
      const req: ApiRequest = { ...baseRequest, headers: [] };
      const result = generateCodeSnippet('dart_http', req);
      expect(result).toBeTruthy();
    });

    it('should handle content-type header for JSON POST in Elixir', () => {
      const result = generateCodeSnippet('elixir_httpoison', postRequest);
      expect(result).toContain('Content-Type');
      expect(result).toContain('application/json');
    });
  });
});
