/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import { generateCodeSnippet } from './code-gen-utils';
import { ApiRequest } from './stores/api-client-store';

describe('generateCodeSnippet', () => {
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
    body: '{"foo": "bar"}',
  };

  describe('curl', () => {
    it('should generate basic GET request', () => {
      const result = generateCodeSnippet('curl', baseRequest);
      expect(result).toContain("curl -X GET 'https://api.example.com/data'");
      expect(result).toContain("-H 'Accept: application/json'");
    });

    it('should handle bearer auth', () => {
      const req = { ...baseRequest, auth: { type: 'bearer' as const, bearerToken: 'token123' } };
      const result = generateCodeSnippet('curl', req);
      expect(result).toContain("-H 'Authorization: Bearer token123'");
    });

    it('should handle POST with JSON body', () => {
      const result = generateCodeSnippet('curl', postRequest);
      expect(result).toContain("-H 'Content-Type: application/json'");
      expect(result).toContain('-d');
    });

    it('should handle form-urlencoded', () => {
      const req: ApiRequest = {
        ...baseRequest,
        method: 'POST',
        bodyType: 'x-www-form-urlencoded',
        bodyFormUrlEncoded: [
          { id: '1', key: 'username', value: 'john', enabled: true },
          { id: '2', key: 'password', value: 'secret', enabled: true },
        ],
      };
      const result = generateCodeSnippet('curl', req);
      expect(result).toContain('--data-urlencode');
    });

    it('should handle form-data', () => {
      const req: ApiRequest = {
        ...baseRequest,
        method: 'POST',
        bodyType: 'form-data',
        bodyFormData: [
          { id: '1', key: 'name', value: 'John', type: 'text', enabled: true },
          { id: '2', key: 'file', type: 'file', fileName: 'doc.pdf', enabled: true, value: '' },
        ],
      };
      const result = generateCodeSnippet('curl', req);
      expect(result).toContain("-F 'name=John'");
      expect(result).toContain("-F 'file=@doc.pdf'");
    });
  });

  describe('JavaScript variants', () => {
    it('should generate fetch snippet', () => {
      const result = generateCodeSnippet('javascript_fetch', baseRequest);
      expect(result).toContain("await fetch('https://api.example.com/data'");
      expect(result).toContain('"Accept": "application/json"');
    });

    it('should generate axios snippet', () => {
      const result = generateCodeSnippet('javascript_axios', postRequest);
      expect(result).toContain('import axios');
      expect(result).toContain('"method"');
      expect(result).toContain('"url"');
    });

    it('should generate jQuery snippet', () => {
      const result = generateCodeSnippet('javascript_jquery', baseRequest);
      expect(result).toContain('$.ajax');
      expect(result).toContain('method:');
    });

    it('should generate XHR snippet', () => {
      const result = generateCodeSnippet('javascript_xhr', baseRequest);
      expect(result).toContain('XMLHttpRequest');
      expect(result).toContain('xhr.open');
    });
  });

  describe('Node.js variants', () => {
    it('should generate nodejs axios', () => {
      const result = generateCodeSnippet('nodejs_axios', baseRequest);
      expect(result).toContain("const axios = require('axios')");
    });

    it('should handle basic auth in nodejs axios', () => {
      const req = {
        ...baseRequest,
        auth: { type: 'basic' as const, basicUsername: 'user', basicPassword: 'pass' },
      };
      const result = generateCodeSnippet('nodejs_axios', req);
      expect(result).toContain('"Authorization": "Basic dXNlcjpwYXNz"');
    });
  });

  describe('Python variants', () => {
    it('should generate python requests', () => {
      const result = generateCodeSnippet('python_requests', baseRequest);
      expect(result).toContain('import requests');
      expect(result).toContain('requests.request');
    });

    it('should generate python http.client', () => {
      const result = generateCodeSnippet('python_http_client', baseRequest);
      expect(result).toContain('import http.client');
      expect(result).toContain('HTTPSConnection');
    });

    it('should handle POST with JSON in python', () => {
      const result = generateCodeSnippet('python_requests', postRequest);
      expect(result).toContain('json=');
    });
  });

  describe('Java variants', () => {
    it('should generate java okhttp', () => {
      const result = generateCodeSnippet('java_okhttp', baseRequest);
      expect(result).toContain('import okhttp3');
      expect(result).toContain('OkHttpClient');
    });

    it('should generate java unirest', () => {
      const result = generateCodeSnippet('java_unirest', baseRequest);
      expect(result).toContain('Unirest');
    });

    it('should generate java net http', () => {
      const result = generateCodeSnippet('java_net_http', baseRequest);
      expect(result).toContain('HttpClient');
      expect(result).toContain('HttpRequest');
    });

    it('should generate java asynchttpclient', () => {
      const result = generateCodeSnippet('java_asynchttpclient', baseRequest);
      expect(result).toContain('AsyncHttpClient');
    });
  });

  describe('C# variants', () => {
    it('should generate csharp httpclient', () => {
      const result = generateCodeSnippet('csharp_httpclient', baseRequest);
      expect(result).toContain('HttpClient');
      expect(result).toContain('HttpRequestMessage');
    });

    it('should generate csharp restsharp', () => {
      const result = generateCodeSnippet('csharp_restsharp', baseRequest);
      expect(result).toContain('RestClient');
      expect(result).toContain('RestRequest');
    });
  });

  describe('Go', () => {
    it('should generate go native', () => {
      const result = generateCodeSnippet('go_native', baseRequest);
      expect(result).toContain('package main');
      expect(result).toContain('http.NewRequest');
    });

    it('should handle POST body in go', () => {
      const result = generateCodeSnippet('go_native', postRequest);
      expect(result).toContain('payload :=');
    });
  });

  describe('PHP variants', () => {
    it('should generate php curl', () => {
      const result = generateCodeSnippet('php_curl', baseRequest);
      expect(result).toContain('<?php');
      expect(result).toContain('curl_init');
    });

    it('should generate php guzzle', () => {
      const result = generateCodeSnippet('php_guzzle', baseRequest);
      expect(result).toContain('GuzzleHttp');
    });
  });

  describe('Ruby', () => {
    it('should generate ruby net http', () => {
      const result = generateCodeSnippet('ruby_net_http', baseRequest);
      expect(result).toContain("require 'net/http'");
      expect(result).toContain('Net::HTTP');
    });

    it('should handle HTTPS in ruby', () => {
      const req = { ...baseRequest, url: 'https://api.example.com/data' };
      const result = generateCodeSnippet('ruby_net_http', req);
      expect(result).toContain('use_ssl');
    });
  });

  describe('Rust', () => {
    it('should generate rust reqwest', () => {
      const result = generateCodeSnippet('rust_reqwest', baseRequest);
      expect(result).toContain('use reqwest');
      expect(result).toContain('async fn main');
    });
  });

  describe('Swift', () => {
    it('should generate swift nsurlsession', () => {
      const result = generateCodeSnippet('swift_nsurlsession', baseRequest);
      expect(result).toContain('import Foundation');
      expect(result).toContain('URLSession');
    });
  });

  describe('Objective-C', () => {
    it('should generate objectivec nsurlsession', () => {
      const result = generateCodeSnippet('objectivec_nsurlsession', baseRequest);
      expect(result).toContain('#import <Foundation/Foundation.h>');
      expect(result).toContain('NSURLSession');
    });
  });

  describe('Kotlin', () => {
    it('should generate kotlin okhttp', () => {
      const result = generateCodeSnippet('kotlin_okhttp', baseRequest);
      expect(result).toContain('OkHttpClient');
      expect(result).toContain('Request.Builder');
    });
  });

  describe('PowerShell variants', () => {
    it('should generate powershell restmethod', () => {
      const result = generateCodeSnippet('powershell_restmethod', baseRequest);
      expect(result).toContain('Invoke-RestMethod');
    });

    it('should generate powershell webrequest', () => {
      const result = generateCodeSnippet('powershell_webrequest', baseRequest);
      expect(result).toContain('Invoke-WebRequest');
    });
  });

  describe('Shell variants', () => {
    it('should generate shell httpie', () => {
      const result = generateCodeSnippet('shell_httpie', baseRequest);
      expect(result).toContain('http');
    });

    it('should generate shell wget', () => {
      const result = generateCodeSnippet('shell_wget', baseRequest);
      expect(result).toContain('wget');
      expect(result).toContain('--method=');
    });
  });

  describe('HTTP Raw', () => {
    it('should generate http raw', () => {
      const result = generateCodeSnippet('http_raw', baseRequest);
      expect(result).toContain('GET /data HTTP/1.1');
      expect(result).toContain('Host: api.example.com');
    });
  });

  describe('C', () => {
    it('should generate c libcurl', () => {
      const result = generateCodeSnippet('c_libcurl', baseRequest);
      expect(result).toContain('#include <curl/curl.h>');
      expect(result).toContain('curl_easy_init');
    });
  });

  describe('Clojure', () => {
    it('should generate clojure clj-http', () => {
      const result = generateCodeSnippet('clojure_clj_http', baseRequest);
      expect(result).toContain('clj-http.client');
    });
  });

  describe('OCaml', () => {
    it('should generate ocaml cohttp', () => {
      const result = generateCodeSnippet('ocaml_cohttp', baseRequest);
      expect(result).toContain('open Cohttp');
      expect(result).toContain('Client.call');
    });
  });

  describe('R', () => {
    it('should generate r httr', () => {
      const result = generateCodeSnippet('r_httr', baseRequest);
      expect(result).toContain('library(httr)');
      expect(result).toContain('VERB');
    });
  });

  describe('Auth handling', () => {
    it('should handle API key in header', () => {
      const req: ApiRequest = {
        ...baseRequest,
        auth: {
          type: 'apikey',
          apiKey: 'X-API-Key',
          apiValue: 'secret123',
          apiLocation: 'header',
        },
      };
      const result = generateCodeSnippet('curl', req);
      expect(result).toContain('X-API-Key: secret123');
    });

    it('should skip API key if location is not header', () => {
      const req: ApiRequest = {
        ...baseRequest,
        auth: {
          type: 'apikey',
          apiKey: 'api_key',
          apiValue: 'secret123',
          apiLocation: 'query',
        },
      };
      const result = generateCodeSnippet('curl', req);
      expect(result).not.toContain('api_key: secret123');
    });
  });

  describe('Header handling', () => {
    it('should only include enabled headers', () => {
      const req: ApiRequest = {
        ...baseRequest,
        headers: [
          { id: '1', key: 'Accept', value: 'application/json', enabled: true },
          { id: '2', key: 'X-Custom', value: 'disabled', enabled: false },
        ],
      };
      const result = generateCodeSnippet('curl', req);
      expect(result).toContain('Accept: application/json');
      expect(result).not.toContain('X-Custom');
    });

    it('should set Content-Type for POST/PUT/PATCH with JSON', () => {
      const req = { ...baseRequest, method: 'PUT' as const, bodyType: 'json' as const, body: '{}' };
      const result = generateCodeSnippet('curl', req);
      expect(result).toContain('Content-Type: application/json');
    });

    it('should set Content-Type for form-urlencoded', () => {
      const req: ApiRequest = {
        ...baseRequest,
        method: 'POST',
        bodyType: 'x-www-form-urlencoded',
        bodyFormUrlEncoded: [{ id: '1', key: 'test', value: 'value', enabled: true }],
      };
      const result = generateCodeSnippet('curl', req);
      expect(result).toContain('Content-Type: application/x-www-form-urlencoded');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty headers array', () => {
      const req = { ...baseRequest, headers: [] };
      const result = generateCodeSnippet('curl', req);
      expect(result).toBeTruthy();
    });

    it('should handle invalid JSON body gracefully', () => {
      const req = { ...postRequest, body: 'invalid json {' };
      const result = generateCodeSnippet('python_requests', req);
      expect(result).toBeTruthy();
    });

    it('should handle special characters in body', () => {
      const req = { ...postRequest, body: '{"quote": "He said \\"hello\\""}' };
      const result = generateCodeSnippet('curl', req);
      expect(result).toBeTruthy();
    });

    it('should handle disabled form fields', () => {
      const req: ApiRequest = {
        ...baseRequest,
        method: 'POST',
        bodyType: 'form-data',
        bodyFormData: [
          { id: '1', key: 'enabled', value: 'yes', type: 'text', enabled: true },
          { id: '2', key: 'disabled', value: 'no', type: 'text', enabled: false },
        ],
      };
      const result = generateCodeSnippet('curl', req);
      expect(result).toContain('enabled=yes');
      expect(result).not.toContain('disabled=no');
    });
  });

  describe('Method variations', () => {
    const methods: Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'> = [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
    ];

    methods.forEach((method) => {
      it(`should handle ${method} method`, () => {
        const req = { ...baseRequest, method };
        const result = generateCodeSnippet('curl', req);
        expect(result).toContain(method);
      });
    });
  });
});
