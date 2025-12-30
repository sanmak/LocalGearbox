/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

// Code snippet generators for various languages and libraries

export interface RequestConfig {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export interface CodeLanguage {
  id: string;
  name: string;
  variants: CodeVariant[];
}

export interface CodeVariant {
  id: string;
  name: string;
  language: string; // For syntax highlighting
  generate: (config: RequestConfig) => string;
}

// Helper to escape strings for different languages
const escapeString = (
  str: string,
  lang:
    | 'js'
    | 'python'
    | 'php'
    | 'ruby'
    | 'shell'
    | 'c'
    | 'java'
    | 'go'
    | 'rust'
    | 'swift'
    | 'kotlin'
    | 'csharp'
    | 'ocaml'
    | 'r'
    | 'powershell',
) => {
  switch (lang) {
    case 'shell':
      return str.replace(/'/g, "'\\''");
    case 'python':
    case 'ruby':
    case 'php':
      return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    case 'c':
    case 'java':
    case 'go':
    case 'rust':
    case 'swift':
    case 'kotlin':
    case 'csharp':
      return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    default:
      return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }
};

// Generate header entries for different formats
const formatHeaders = (
  headers: Record<string, string>,
  format: 'object' | 'array' | 'calls' | 'dict',
) => {
  const entries = Object.entries(headers);
  if (entries.length === 0) return '';

  switch (format) {
    case 'object':
      return entries.map(([k, v]) => `  "${k}": "${escapeString(v, 'js')}"`).join(',\n');
    case 'array':
      return entries.map(([k, v]) => `"${k}: ${escapeString(v, 'js')}"`).join(', ');
    case 'calls':
      return entries
        .map(([k, v]) => `.header("${k}", "${escapeString(v, 'java')}")`)
        .join('\n    ');
    case 'dict':
      return entries.map(([k, v]) => `"${k}": "${escapeString(v, 'python')}"`).join(', ');
    default:
      return '';
  }
};

// ============ CURL ============
const generateCurl = (config: RequestConfig): string => {
  const parts = [`curl -X ${config.method}`];
  parts.push(`  '${config.url}'`);

  Object.entries(config.headers).forEach(([key, value]) => {
    parts.push(`  -H '${key}: ${escapeString(value, 'shell')}'`);
  });

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    parts.push(`  -d '${escapeString(config.body, 'shell')}'`);
  }

  return parts.join(' \\\n');
};

// ============ HTTP RAW ============
const generateHttpRaw = (config: RequestConfig): string => {
  const url = new URL(config.url);
  let raw = `${config.method} ${url.pathname}${url.search} HTTP/1.1\n`;
  raw += `Host: ${url.host}\n`;

  Object.entries(config.headers).forEach(([key, value]) => {
    raw += `${key}: ${value}\n`;
  });

  if (config.body) {
    raw += `\n${config.body}`;
  }

  return raw;
};

// ============ JavaScript Fetch ============
const generateJsFetch = (config: RequestConfig): string => {
  const options: string[] = [];
  options.push(`  method: "${config.method}"`);

  if (Object.keys(config.headers).length > 0) {
    options.push(`  headers: {\n${formatHeaders(config.headers, 'object')}\n  }`);
  }

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    options.push(`  body: JSON.stringify(${config.body})`);
  }

  return `fetch("${config.url}", {
${options.join(',\n')}
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error("Error:", error));`;
};

// ============ JavaScript jQuery ============
const generateJsJquery = (config: RequestConfig): string => {
  const settings: string[] = [];
  settings.push(`  url: "${config.url}"`);
  settings.push(`  method: "${config.method}"`);

  if (Object.keys(config.headers).length > 0) {
    settings.push(`  headers: {\n${formatHeaders(config.headers, 'object')}\n  }`);
  }

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    settings.push(`  data: JSON.stringify(${config.body})`);
    settings.push(`  contentType: "application/json"`);
  }

  return `$.ajax({
${settings.join(',\n')},
  success: function(response) {
    console.log(response);
  },
  error: function(xhr, status, error) {
    console.error(error);
  }
});`;
};

// ============ JavaScript XHR ============
const generateJsXhr = (config: RequestConfig): string => {
  let code = `const xhr = new XMLHttpRequest();
xhr.open("${config.method}", "${config.url}");

`;

  Object.entries(config.headers).forEach(([key, value]) => {
    code += `xhr.setRequestHeader("${key}", "${escapeString(value, 'js')}");\n`;
  });

  code += `
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4) {
    console.log(xhr.status);
    console.log(xhr.responseText);
  }
};

`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `xhr.send(JSON.stringify(${config.body}));`;
  } else {
    code += `xhr.send();`;
  }

  return code;
};

// ============ Node.js Axios ============
const generateNodeAxios = (config: RequestConfig): string => {
  const options: string[] = [];
  options.push(`  method: "${config.method.toLowerCase()}"`);
  options.push(`  url: "${config.url}"`);

  if (Object.keys(config.headers).length > 0) {
    options.push(`  headers: {\n${formatHeaders(config.headers, 'object')}\n  }`);
  }

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    options.push(`  data: ${config.body}`);
  }

  return `const axios = require("axios");

axios({
${options.join(',\n')}
})
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });`;
};

// ============ Node.js Native ============
const generateNodeNative = (config: RequestConfig): string => {
  const url = new URL(config.url);
  const isHttps = url.protocol === 'https:';

  let code = `const ${isHttps ? 'https' : 'http'} = require("${isHttps ? 'https' : 'http'}");

const options = {
  hostname: "${url.hostname}",
  port: ${url.port || (isHttps ? 443 : 80)},
  path: "${url.pathname}${url.search}",
  method: "${config.method}",
  headers: {
${formatHeaders(config.headers, 'object')}
  }
};

const req = ${isHttps ? 'https' : 'http'}.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => data += chunk);
  res.on("end", () => console.log(data));
});

req.on("error", (error) => console.error(error));
`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `req.write(JSON.stringify(${config.body}));\n`;
  }

  code += `req.end();`;

  return code;
};

// ============ Node.js Request ============
const generateNodeRequest = (config: RequestConfig): string => {
  const options: string[] = [];
  options.push(`  url: "${config.url}"`);
  options.push(`  method: "${config.method}"`);

  if (Object.keys(config.headers).length > 0) {
    options.push(`  headers: {\n${formatHeaders(config.headers, 'object')}\n  }`);
  }

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    options.push(`  body: JSON.stringify(${config.body})`);
  }

  return `const request = require("request");

request({
${options.join(',\n')}
}, (error, response, body) => {
  if (error) {
    console.error(error);
    return;
  }
  console.log(body);
});`;
};

// ============ Node.js Unirest ============
const generateNodeUnirest = (config: RequestConfig): string => {
  let code = `const unirest = require("unirest");

unirest.${config.method.toLowerCase()}("${config.url}")
  .headers({
${formatHeaders(config.headers, 'object')}
  })`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `
  .send(${config.body})`;
  }

  code += `
  .then((response) => {
    console.log(response.body);
  });`;

  return code;
};

// ============ Python Requests ============
const generatePythonRequests = (config: RequestConfig): string => {
  let code = `import requests

url = "${config.url}"
headers = {${formatHeaders(config.headers, 'dict')}}
`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `payload = ${config.body}

response = requests.${config.method.toLowerCase()}(url, headers=headers, json=payload)`;
  } else {
    code += `
response = requests.${config.method.toLowerCase()}(url, headers=headers)`;
  }

  code += `

print(response.status_code)
print(response.json())`;

  return code;
};

// ============ Python http.client ============
const generatePythonHttpClient = (config: RequestConfig): string => {
  const url = new URL(config.url);
  const isHttps = url.protocol === 'https:';

  let code = `import http.client
import json

conn = http.client.${isHttps ? 'HTTPSConnection' : 'HTTPConnection'}("${url.host}")

headers = {
${Object.entries(config.headers)
  .map(([k, v]) => `    "${k}": "${escapeString(v, 'python')}"`)
  .join(',\n')}
}
`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `payload = json.dumps(${config.body})

conn.request("${config.method}", "${url.pathname}${url.search}", payload, headers)`;
  } else {
    code += `
conn.request("${config.method}", "${url.pathname}${url.search}", headers=headers)`;
  }

  code += `

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))`;

  return code;
};

// ============ Java OkHttp ============
const generateJavaOkhttp = (config: RequestConfig): string => {
  let code = `import okhttp3.*;

OkHttpClient client = new OkHttpClient();
`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `
MediaType mediaType = MediaType.parse("application/json");
RequestBody body = RequestBody.create(mediaType, ${JSON.stringify(config.body)});
`;
  }

  code += `
Request request = new Request.Builder()
    .url("${config.url}")
    .method("${config.method}", ${
      config.body && ['POST', 'PUT', 'PATCH'].includes(config.method) ? 'body' : 'null'
    })
    ${formatHeaders(config.headers, 'calls')}
    .build();

Response response = client.newCall(request).execute();
System.out.println(response.body().string());`;

  return code;
};

// ============ Java Unirest ============
const generateJavaUnirest = (config: RequestConfig): string => {
  let code = `import kong.unirest.Unirest;
import kong.unirest.HttpResponse;

HttpResponse<String> response = Unirest.${config.method.toLowerCase()}("${config.url}")
`;

  Object.entries(config.headers).forEach(([key, value]) => {
    code += `    .header("${key}", "${escapeString(value, 'java')}")\n`;
  });

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `    .body(${JSON.stringify(config.body)})\n`;
  }

  code += `    .asString();

System.out.println(response.getBody());`;

  return code;
};

// ============ C# HttpClient ============
const generateCsharpHttpClient = (config: RequestConfig): string => {
  let code = `using System;
using System.Net.Http;
using System.Threading.Tasks;

var client = new HttpClient();
`;

  Object.entries(config.headers).forEach(([key, value]) => {
    code += `client.DefaultRequestHeaders.Add("${key}", "${escapeString(value, 'csharp')}");\n`;
  });

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `
var content = new StringContent(${JSON.stringify(
      config.body,
    )}, System.Text.Encoding.UTF8, "application/json");
var response = await client.${
      config.method.charAt(0) + config.method.slice(1).toLowerCase()
    }Async("${config.url}", content);`;
  } else {
    code += `
var response = await client.${
      config.method.charAt(0) + config.method.slice(1).toLowerCase()
    }Async("${config.url}");`;
  }

  code += `

var responseBody = await response.Content.ReadAsStringAsync();
Console.WriteLine(responseBody);`;

  return code;
};

// ============ C# RestSharp ============
const generateCsharpRestsharp = (config: RequestConfig): string => {
  let code = `using RestSharp;

var client = new RestClient("${config.url}");
var request = new RestRequest(Method.${config.method});
`;

  Object.entries(config.headers).forEach(([key, value]) => {
    code += `request.AddHeader("${key}", "${escapeString(value, 'csharp')}");\n`;
  });

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `request.AddJsonBody(${config.body});\n`;
  }

  code += `
IRestResponse response = client.Execute(request);
Console.WriteLine(response.Content);`;

  return code;
};

// ============ Go Native ============
const generateGoNative = (config: RequestConfig): string => {
  let code = `package main

import (
    "fmt"
    "io/ioutil"
    "net/http"
`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `    "strings"
`;
  }

  code += `)

func main() {
    url := "${config.url}"
`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `    payload := strings.NewReader(\`${config.body}\`)
    req, _ := http.NewRequest("${config.method}", url, payload)
`;
  } else {
    code += `    req, _ := http.NewRequest("${config.method}", url, nil)
`;
  }

  Object.entries(config.headers).forEach(([key, value]) => {
    code += `    req.Header.Add("${key}", "${escapeString(value, 'go')}")\n`;
  });

  code += `
    res, _ := http.DefaultClient.Do(req)
    defer res.Body.Close()
    body, _ := ioutil.ReadAll(res.Body)

    fmt.Println(string(body))
}`;

  return code;
};

// ============ Kotlin OkHttp ============
const generateKotlinOkhttp = (config: RequestConfig): string => {
  let code = `import okhttp3.OkHttpClient
import okhttp3.Request
`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
`;
  }

  code += `
val client = OkHttpClient()
`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `
val mediaType = "application/json".toMediaType()
val body = """${config.body}""".toRequestBody(mediaType)
`;
  }

  code += `
val request = Request.Builder()
    .url("${config.url}")
    .method("${config.method}", ${
      config.body && ['POST', 'PUT', 'PATCH'].includes(config.method) ? 'body' : 'null'
    })
`;

  Object.entries(config.headers).forEach(([key, value]) => {
    code += `    .addHeader("${key}", "${escapeString(value, 'kotlin')}")\n`;
  });

  code += `    .build()

val response = client.newCall(request).execute()
println(response.body?.string())`;

  return code;
};

// ============ Swift URLSession ============
const generateSwiftUrlSession = (config: RequestConfig): string => {
  let code = `import Foundation

let url = URL(string: "${config.url}")!
var request = URLRequest(url: url)
request.httpMethod = "${config.method}"
`;

  Object.entries(config.headers).forEach(([key, value]) => {
    code += `request.setValue("${escapeString(value, 'swift')}", forHTTPHeaderField: "${key}")\n`;
  });

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `
let body = """
${config.body}
"""
request.httpBody = body.data(using: .utf8)
`;
  }

  code += `
let task = URLSession.shared.dataTask(with: request) { data, response, error in
    if let data = data {
        print(String(data: data, encoding: .utf8) ?? "")
    }
}
task.resume()`;

  return code;
};

// ============ Ruby Net::HTTP ============
const generateRubyNetHttp = (config: RequestConfig): string => {
  const url = new URL(config.url);

  let code = `require 'net/http'
require 'uri'
require 'json'

uri = URI.parse("${config.url}")
http = Net::HTTP.new(uri.host, uri.port)
`;

  if (url.protocol === 'https:') {
    code += `http.use_ssl = true\n`;
  }

  code += `
request = Net::HTTP::${
    config.method.charAt(0) + config.method.slice(1).toLowerCase()
  }.new(uri.request_uri)
`;

  Object.entries(config.headers).forEach(([key, value]) => {
    code += `request["${key}"] = "${escapeString(value, 'ruby')}"\n`;
  });

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `request.body = '${escapeString(config.body, 'ruby')}'\n`;
  }

  code += `
response = http.request(request)
puts response.body`;

  return code;
};

// ============ PHP cURL ============
const generatePhpCurl = (config: RequestConfig): string => {
  let code = `<?php

$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => "${config.url}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => "${config.method}",
    CURLOPT_HTTPHEADER => [
${Object.entries(config.headers)
  .map(([k, v]) => `        "${k}: ${escapeString(v, 'php')}"`)
  .join(',\n')}
    ],
`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `    CURLOPT_POSTFIELDS => '${escapeString(config.body, 'php')}',\n`;
  }

  code += `]);

$response = curl_exec($curl);
curl_close($curl);

echo $response;`;

  return code;
};

// ============ PHP Guzzle ============
const generatePhpGuzzle = (config: RequestConfig): string => {
  let code = `<?php

require 'vendor/autoload.php';

use GuzzleHttp\\Client;

$client = new Client();

$response = $client->request('${config.method}', '${config.url}', [
    'headers' => [
${Object.entries(config.headers)
  .map(([k, v]) => `        '${k}' => '${escapeString(v, 'php')}'`)
  .join(',\n')}
    ]`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `,
    'body' => '${escapeString(config.body, 'php')}'`;
  }

  code += `
]);

echo $response->getBody();`;

  return code;
};

// ============ PHP HTTP_Request2 ============
const generatePhpHttpRequest2 = (config: RequestConfig): string => {
  let code = `<?php

require_once 'HTTP/Request2.php';

$request = new HTTP_Request2();
$request->setUrl('${config.url}');
$request->setMethod(HTTP_Request2::METHOD_${config.method});

$request->setHeader([
${Object.entries(config.headers)
  .map(([k, v]) => `    '${k}' => '${escapeString(v, 'php')}'`)
  .join(',\n')}
]);
`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `$request->setBody('${escapeString(config.body, 'php')}');\n`;
  }

  code += `
try {
    $response = $request->send();
    echo $response->getBody();
} catch (HTTP_Request2_Exception $e) {
    echo 'Error: ' . $e->getMessage();
}`;

  return code;
};

// ============ PHP pecl_http ============
const generatePhpPeclHttp = (config: RequestConfig): string => {
  let code = `<?php

$client = new http\\Client;
$request = new http\\Client\\Request;

$request->setRequestUrl('${config.url}');
$request->setRequestMethod('${config.method}');

$request->setHeaders([
${Object.entries(config.headers)
  .map(([k, v]) => `    '${k}' => '${escapeString(v, 'php')}'`)
  .join(',\n')}
]);
`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `$request->getBody()->append('${escapeString(config.body, 'php')}');\n`;
  }

  code += `
$client->enqueue($request)->send();
$response = $client->getResponse();

echo $response->getBody();`;

  return code;
};

// ============ Rust reqwest ============
const generateRustReqwest = (config: RequestConfig): string => {
  let code = `use reqwest::header::{HeaderMap, HeaderValue};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();

    let mut headers = HeaderMap::new();
`;

  Object.entries(config.headers).forEach(([key, value]) => {
    code += `    headers.insert("${key}", HeaderValue::from_static("${escapeString(
      value,
      'rust',
    )}"));\n`;
  });

  code += `
    let response = client
        .${config.method.toLowerCase()}("${config.url}")
        .headers(headers)
`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `        .body(r#"${config.body}"#)\n`;
  }

  code += `        .send()
        .await?;

    println!("{}", response.text().await?);
    Ok(())
}`;

  return code;
};

// ============ Dart http ============
const generateDartHttp = (config: RequestConfig): string => {
  let code = `import 'package:http/http.dart' as http;

void main() async {
  var url = Uri.parse('${config.url}');
  var headers = {
${Object.entries(config.headers)
  .map(([k, v]) => `    '${k}': '${escapeString(v, 'js')}'`)
  .join(',\n')}
  };
`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `  var body = '''${config.body}''';

  var response = await http.${config.method.toLowerCase()}(url, headers: headers, body: body);`;
  } else {
    code += `
  var response = await http.${config.method.toLowerCase()}(url, headers: headers);`;
  }

  code += `

  print(response.statusCode);
  print(response.body);
}`;

  return code;
};

// ============ Dart Dio ============
const generateDartDio = (config: RequestConfig): string => {
  let code = `import 'package:dio/dio.dart';

void main() async {
  var dio = Dio();

  var options = Options(
    headers: {
${Object.entries(config.headers)
  .map(([k, v]) => `      '${k}': '${escapeString(v, 'js')}'`)
  .join(',\n')}
    },
  );
`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `  var data = ${config.body};

  var response = await dio.${config.method.toLowerCase()}(
    '${config.url}',
    data: data,
    options: options,
  );`;
  } else {
    code += `
  var response = await dio.${config.method.toLowerCase()}(
    '${config.url}',
    options: options,
  );`;
  }

  code += `

  print(response.data);
}`;

  return code;
};

// ============ C libcurl ============
const generateCLibcurl = (config: RequestConfig): string => {
  let code = `#include <stdio.h>
#include <curl/curl.h>

int main(void) {
    CURL *curl;
    CURLcode res;

    curl = curl_easy_init();
    if(curl) {
        struct curl_slist *headers = NULL;
`;

  Object.entries(config.headers).forEach(([key, value]) => {
    code += `        headers = curl_slist_append(headers, "${key}: ${escapeString(
      value,
      'c',
    )}");\n`;
  });

  code += `
        curl_easy_setopt(curl, CURLOPT_URL, "${config.url}");
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "${config.method}");
`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "${escapeString(
      config.body,
      'c',
    )}");\n`;
  }

  code += `
        res = curl_easy_perform(curl);

        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }
    return 0;
}`;

  return code;
};

// ============ Objective-C NSURLSession ============
const generateObjectiveCNsurl = (config: RequestConfig): string => {
  let code = `#import <Foundation/Foundation.h>

NSURL *url = [NSURL URLWithString:@"${config.url}"];
NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
[request setHTTPMethod:@"${config.method}"];

`;

  Object.entries(config.headers).forEach(([key, value]) => {
    code += `[request setValue:@"${escapeString(value, 'c')}" forHTTPHeaderField:@"${key}"];\n`;
  });

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `
NSData *postData = [@"${escapeString(config.body, 'c')}" dataUsingEncoding:NSUTF8StringEncoding];
[request setHTTPBody:postData];
`;
  }

  code += `
NSURLSession *session = [NSURLSession sharedSession];
NSURLSessionDataTask *task = [session dataTaskWithRequest:request
    completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        if (data) {
            NSString *result = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
            NSLog(@"%@", result);
        }
    }];
[task resume];`;

  return code;
};

// ============ OCaml Cohttp ============
const generateOcamlCohttp = (config: RequestConfig): string => {
  let code = `open Lwt
open Cohttp
open Cohttp_lwt_unix

let body =
  let uri = Uri.of_string "${config.url}" in
  let headers = Header.init ()
`;

  Object.entries(config.headers).forEach(([key, value]) => {
    code += `    |> fun h -> Header.add h "${key}" "${escapeString(value, 'ocaml')}"
`;
  });

  code += `  in
  Client.call ~headers \`${config.method} uri >>= fun (resp, body) ->
  body |> Cohttp_lwt.Body.to_string >|= fun body ->
  print_endline body

let () = Lwt_main.run body`;

  return code;
};

// ============ R httr ============
const generateRHttr = (config: RequestConfig): string => {
  let code = `library(httr)

url <- "${config.url}"

response <- ${config.method}(
  url,
  add_headers(
${Object.entries(config.headers)
  .map(([k, v]) => `    \`${k}\` = "${escapeString(v, 'r')}"`)
  .join(',\n')}
  )`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `,
  body = '${escapeString(config.body, 'r')}',
  encode = "json"`;
  }

  code += `
)

content(response, "text")`;

  return code;
};

// ============ R RCurl ============
const generateRRcurl = (config: RequestConfig): string => {
  let code = `library(RCurl)

url <- "${config.url}"

headers <- c(
${Object.entries(config.headers)
  .map(([k, v]) => `  "${k}" = "${escapeString(v, 'r')}"`)
  .join(',\n')}
)
`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `
response <- postForm(
  url,
  .opts = list(
    httpheader = headers,
    customrequest = "${config.method}",
    postfields = '${escapeString(config.body, 'r')}'
  )
)`;
  } else {
    code += `
response <- getURL(
  url,
  httpheader = headers,
  customrequest = "${config.method}"
)`;
  }

  code += `

print(response)`;

  return code;
};

// ============ Shell wget ============
const generateShellWget = (config: RequestConfig): string => {
  let parts = [`wget --quiet`];
  parts.push(`  --method ${config.method}`);

  Object.entries(config.headers).forEach(([key, value]) => {
    parts.push(`  --header '${key}: ${escapeString(value, 'shell')}'`);
  });

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    parts.push(`  --body-data '${escapeString(config.body, 'shell')}'`);
  }

  parts.push(`  --output-document -`);
  parts.push(`  '${config.url}'`);

  return parts.join(' \\\n');
};

// ============ Shell HTTPie ============
const generateShellHttpie = (config: RequestConfig): string => {
  let parts = [`http ${config.method}`];
  parts.push(`  '${config.url}'`);

  Object.entries(config.headers).forEach(([key, value]) => {
    parts.push(`  '${key}:${escapeString(value, 'shell')}'`);
  });

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    // HTTPie uses different syntax for JSON
    try {
      const parsed = JSON.parse(config.body);
      Object.entries(parsed).forEach(([key, value]) => {
        if (typeof value === 'string') {
          parts.push(`  ${key}='${value}'`);
        } else {
          parts.push(`  ${key}:=${JSON.stringify(value)}`);
        }
      });
    } catch {
      parts.push(`  --raw '${escapeString(config.body, 'shell')}'`);
    }
  }

  return parts.join(' \\\n');
};

// ============ PowerShell RestMethod ============
const generatePowershellRestmethod = (config: RequestConfig): string => {
  let code = `$headers = @{
${Object.entries(config.headers)
  .map(([k, v]) => `    "${k}" = "${escapeString(v, 'powershell')}"`)
  .join('\n')}
}

`;

  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    code += `$body = @'
${config.body}
'@

$response = Invoke-RestMethod -Uri '${config.url}' -Method ${config.method} -Headers $headers -Body $body -ContentType 'application/json'`;
  } else {
    code += `$response = Invoke-RestMethod -Uri '${config.url}' -Method ${config.method} -Headers $headers`;
  }

  code += `

$response`;

  return code;
};

// ============ Postman CLI ============
const generatePostmanCli = (config: RequestConfig): string => {
  return `// Postman Collection v2.1
{
  "info": {
    "name": "API Request",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Request",
      "request": {
        "method": "${config.method}",
        "header": [
${Object.entries(config.headers)
  .map(([k, v]) => `          {"key": "${k}", "value": "${escapeString(v, 'js')}"}`)
  .join(',\n')}
        ],
        "url": {
          "raw": "${config.url}"
        }${
          config.body
            ? `,
        "body": {
          "mode": "raw",
          "raw": ${JSON.stringify(config.body)}
        }`
            : ''
        }
      }
    }
  ]
}

// Run with: newman run collection.json`;
};

// Build the complete language list
export const CODE_LANGUAGES: CodeLanguage[] = [
  {
    id: 'c',
    name: 'C',
    variants: [
      {
        id: 'libcurl',
        name: 'libcurl',
        language: 'c',
        generate: generateCLibcurl,
      },
    ],
  },
  {
    id: 'csharp',
    name: 'C#',
    variants: [
      {
        id: 'httpclient',
        name: 'HttpClient',
        language: 'csharp',
        generate: generateCsharpHttpClient,
      },
      {
        id: 'restsharp',
        name: 'RestSharp',
        language: 'csharp',
        generate: generateCsharpRestsharp,
      },
    ],
  },
  {
    id: 'curl',
    name: 'cURL',
    variants: [{ id: 'curl', name: 'cURL', language: 'bash', generate: generateCurl }],
  },
  {
    id: 'dart',
    name: 'Dart',
    variants: [
      {
        id: 'http',
        name: 'http',
        language: 'dart',
        generate: generateDartHttp,
      },
      { id: 'dio', name: 'Dio', language: 'dart', generate: generateDartDio },
    ],
  },
  {
    id: 'go',
    name: 'Go',
    variants: [
      {
        id: 'native',
        name: 'Native',
        language: 'go',
        generate: generateGoNative,
      },
    ],
  },
  {
    id: 'http',
    name: 'HTTP',
    variants: [{ id: 'raw', name: 'Raw', language: 'http', generate: generateHttpRaw }],
  },
  {
    id: 'java',
    name: 'Java',
    variants: [
      {
        id: 'okhttp',
        name: 'OkHttp',
        language: 'java',
        generate: generateJavaOkhttp,
      },
      {
        id: 'unirest',
        name: 'Unirest',
        language: 'java',
        generate: generateJavaUnirest,
      },
    ],
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    variants: [
      {
        id: 'fetch',
        name: 'Fetch',
        language: 'javascript',
        generate: generateJsFetch,
      },
      {
        id: 'jquery',
        name: 'jQuery',
        language: 'javascript',
        generate: generateJsJquery,
      },
      {
        id: 'xhr',
        name: 'XHR',
        language: 'javascript',
        generate: generateJsXhr,
      },
    ],
  },
  {
    id: 'kotlin',
    name: 'Kotlin',
    variants: [
      {
        id: 'okhttp',
        name: 'OkHttp',
        language: 'kotlin',
        generate: generateKotlinOkhttp,
      },
    ],
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    variants: [
      {
        id: 'axios',
        name: 'Axios',
        language: 'javascript',
        generate: generateNodeAxios,
      },
      {
        id: 'native',
        name: 'Native',
        language: 'javascript',
        generate: generateNodeNative,
      },
      {
        id: 'request',
        name: 'Request',
        language: 'javascript',
        generate: generateNodeRequest,
      },
      {
        id: 'unirest',
        name: 'Unirest',
        language: 'javascript',
        generate: generateNodeUnirest,
      },
    ],
  },
  {
    id: 'objectivec',
    name: 'Objective-C',
    variants: [
      {
        id: 'nsurlsession',
        name: 'NSURLSession',
        language: 'objectivec',
        generate: generateObjectiveCNsurl,
      },
    ],
  },
  {
    id: 'ocaml',
    name: 'OCaml',
    variants: [
      {
        id: 'cohttp',
        name: 'Cohttp',
        language: 'ocaml',
        generate: generateOcamlCohttp,
      },
    ],
  },
  {
    id: 'php',
    name: 'PHP',
    variants: [
      { id: 'curl', name: 'cURL', language: 'php', generate: generatePhpCurl },
      {
        id: 'guzzle',
        name: 'Guzzle',
        language: 'php',
        generate: generatePhpGuzzle,
      },
      {
        id: 'http_request2',
        name: 'HTTP_Request2',
        language: 'php',
        generate: generatePhpHttpRequest2,
      },
      {
        id: 'pecl_http',
        name: 'pecl_http',
        language: 'php',
        generate: generatePhpPeclHttp,
      },
    ],
  },
  {
    id: 'postman',
    name: 'Postman CLI',
    variants: [
      {
        id: 'newman',
        name: 'Newman',
        language: 'json',
        generate: generatePostmanCli,
      },
    ],
  },
  {
    id: 'powershell',
    name: 'PowerShell',
    variants: [
      {
        id: 'restmethod',
        name: 'RestMethod',
        language: 'powershell',
        generate: generatePowershellRestmethod,
      },
    ],
  },
  {
    id: 'python',
    name: 'Python',
    variants: [
      {
        id: 'requests',
        name: 'Requests',
        language: 'python',
        generate: generatePythonRequests,
      },
      {
        id: 'http.client',
        name: 'http.client',
        language: 'python',
        generate: generatePythonHttpClient,
      },
    ],
  },
  {
    id: 'r',
    name: 'R',
    variants: [
      { id: 'httr', name: 'httr', language: 'r', generate: generateRHttr },
      { id: 'rcurl', name: 'RCurl', language: 'r', generate: generateRRcurl },
    ],
  },
  {
    id: 'ruby',
    name: 'Ruby',
    variants: [
      {
        id: 'net_http',
        name: 'Net::HTTP',
        language: 'ruby',
        generate: generateRubyNetHttp,
      },
    ],
  },
  {
    id: 'rust',
    name: 'Rust',
    variants: [
      {
        id: 'reqwest',
        name: 'reqwest',
        language: 'rust',
        generate: generateRustReqwest,
      },
    ],
  },
  {
    id: 'shell',
    name: 'Shell',
    variants: [
      {
        id: 'httpie',
        name: 'HTTPie',
        language: 'bash',
        generate: generateShellHttpie,
      },
      {
        id: 'wget',
        name: 'wget',
        language: 'bash',
        generate: generateShellWget,
      },
    ],
  },
  {
    id: 'swift',
    name: 'Swift',
    variants: [
      {
        id: 'urlsession',
        name: 'URLSession',
        language: 'swift',
        generate: generateSwiftUrlSession,
      },
    ],
  },
];

// Helper to find a variant
export const findVariant = (languageId: string, variantId: string): CodeVariant | undefined => {
  const language = CODE_LANGUAGES.find((l) => l.id === languageId);
  return language?.variants.find((v) => v.id === variantId);
};

// Generate code for a specific language/variant
export const generateCode = (
  languageId: string,
  variantId: string,
  config: RequestConfig,
): string => {
  const variant = findVariant(languageId, variantId);
  if (!variant) {
    return '// Language/variant not found';
  }
  return variant.generate(config);
};
