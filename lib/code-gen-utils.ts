/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { ApiRequest } from './stores/api-client-store';

export type CodeLanguage =
  | 'curl'
  | 'c_libcurl'
  | 'clojure_clj_http'
  | 'csharp_httpclient'
  | 'csharp_restsharp'
  | 'go_native'
  | 'http_raw'
  | 'java_asynchttpclient'
  | 'java_net_http'
  | 'java_okhttp'
  | 'java_unirest'
  | 'javascript_fetch'
  | 'javascript_axios'
  | 'javascript_jquery'
  | 'javascript_xhr'
  | 'kotlin_okhttp'
  | 'nodejs_axios'
  | 'objectivec_nsurlsession'
  | 'ocaml_cohttp'
  | 'php_curl'
  | 'php_guzzle'
  | 'powershell_restmethod'
  | 'powershell_webrequest'
  | 'python_requests'
  | 'python_http_client'
  | 'r_httr'
  | 'ruby_net_http'
  | 'rust_reqwest'
  | 'shell_httpie'
  | 'shell_wget'
  | 'swift_nsurlsession';

export function generateCodeSnippet(language: CodeLanguage, request: ApiRequest): string {
  const { method, url, headers, auth, bodyType, body, bodyFormData, bodyFormUrlEncoded } = request;

  const safeParse = (str: string) => {
    try {
      return JSON.parse(str || '{}');
    } catch {
      return str;
    }
  };

  // Helper to get active headers
  const getActiveHeaders = () => {
    const h: Record<string, string> = {};
    headers.forEach((item) => {
      if (item.enabled && item.key) h[item.key] = item.value;
    });

    // Inject Auth
    if (auth.type === 'bearer' && auth.bearerToken)
      h['Authorization'] = `Bearer ${auth.bearerToken}`;
    if (auth.type === 'basic' && auth.basicUsername) {
      const str = `${auth.basicUsername}:${auth.basicPassword || ''}`;
      const token =
        typeof btoa !== 'undefined'
          ? btoa(unescape(encodeURIComponent(str)))
          : Buffer.from(str).toString('base64');
      h['Authorization'] = `Basic ${token}`;
    }
    if (auth.type === 'apikey' && auth.apiKey && auth.apiValue && auth.apiLocation === 'header') {
      h[auth.apiKey] = auth.apiValue;
    }

    // Set Content-Type
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (bodyType === 'json') h['Content-Type'] = 'application/json';
      if (bodyType === 'x-www-form-urlencoded')
        h['Content-Type'] = 'application/x-www-form-urlencoded';
      // multipart is handled specially by most libs
    }

    return h;
  };

  const activeHeaders = getActiveHeaders();

  switch (language) {
    case 'curl':
      let curl = `curl -X ${method} '${url}'`;
      Object.entries(activeHeaders).forEach(([k, v]) => {
        curl += ` \\\n  -H '${k}: ${v}'`;
      });

      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        if (bodyType === 'json' || bodyType === 'raw') {
          curl += ` \\\n  -d '${body}'`;
        } else if (bodyType === 'x-www-form-urlencoded') {
          bodyFormUrlEncoded.forEach((p) => {
            if (p.enabled && p.key) curl += ` \\\n  --data-urlencode '${p.key}=${p.value}'`;
          });
        } else if (bodyType === 'form-data') {
          bodyFormData.forEach((p) => {
            if (p.enabled && p.key) {
              if (p.type === 'file') {
                curl += ` \\\n  -F '${p.key}=@${p.fileName || 'file'}'`;
              } else {
                curl += ` \\\n  -F '${p.key}=${p.value}'`;
              }
            }
          });
        }
      }
      return curl;

    case 'shell_httpie':
      let httpie = `http ${method} ${url}`;
      Object.entries(activeHeaders).forEach(([k, v]) => {
        httpie += ` '${k}:${v}'`;
      });
      if (bodyType === 'json' && body) {
        httpie += ` <<< '${body}'`;
      }
      return httpie;

    case 'shell_wget':
      let wget = `wget --method=${method} --header='Host: ${new URL(url).host}'`;
      Object.entries(activeHeaders).forEach(([k, v]) => {
        wget += ` --header='${k}: ${v}'`;
      });
      if (body && bodyType !== 'none') {
        wget += ` --body-data='${body}'`;
      }
      wget += ` '${url}'`;
      return wget;

    case 'http_raw':
      const urlObj = new URL(url);
      let raw = `${method} ${urlObj.pathname}${urlObj.search} HTTP/1.1\nHost: ${urlObj.host}`;
      Object.entries(activeHeaders).forEach(([k, v]) => {
        raw += `\n${k}: ${v}`;
      });
      if (body && bodyType !== 'none') {
        raw += `\n\n${body}`;
      }
      return raw;

    case 'c_libcurl':
      return `#include <stdio.h>
#include <curl/curl.h>

int main(void) {
  CURL *curl;
  CURLcode res;

  curl = curl_easy_init();
  if(curl) {
    struct curl_slist *headers = NULL;
    ${Object.entries(activeHeaders)
      .map(([k, v]) => `headers = curl_slist_append(headers, "${k}: ${v}");`)
      .join('\n    ')}

    curl_easy_setopt(curl, CURLOPT_URL, "${url}");
    curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "${method}");
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

    ${body && bodyType !== 'none' ? `curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "${body.replace(/"/g, '\\"').replace(/\n/g, '\\n')}");` : ''}

    res = curl_easy_perform(curl);
    if(res != CURLE_OK)
      fprintf(stderr, "curl_easy_perform() failed: %s\\n", curl_easy_strerror(res));

    curl_easy_cleanup(curl);
    curl_slist_free_all(headers);
  }
  return 0;
}`;

    case 'javascript_jquery':
      return `$.ajax({
  url: '${url}',
  method: '${method}',
  headers: ${JSON.stringify(activeHeaders, null, 2)},
  data: ${bodyType === 'json' ? body : JSON.stringify(body)},
  success: function(data) {
    console.log(data);
  }
});`;

    case 'javascript_xhr':
      return `const data = ${bodyType === 'json' ? body : `'${body}'`};
const xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener('readystatechange', function() {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open('${method}', '${url}');
${Object.entries(activeHeaders)
  .map(([k, v]) => `xhr.setRequestHeader('${k}', '${v}');`)
  .join('\n')}

xhr.send(${bodyType === 'none' ? 'null' : 'data'});`;

    case 'csharp_httpclient':
      return `using var client = new HttpClient();
var request = new HttpRequestMessage(HttpMethod.${method}, "${url}");
${Object.entries(activeHeaders)
  .map(([k, v]) => `request.Headers.Add("${k}", "${v}");`)
  .join('\n')}
${body && bodyType !== 'none' ? `request.Content = new StringContent("${body.replace(/"/g, '\\"')}", null, "${activeHeaders['Content-Type'] || 'text/plain'}");` : ''}

var response = await client.SendAsync(request);
response.EnsureSuccessStatusCode();
Console.WriteLine(await response.Content.ReadAsStringAsync());`;

    case 'csharp_restsharp':
      return `var client = new RestClient("${url}");
var request = new RestRequest(Method.${method});
${Object.entries(activeHeaders)
  .map(([k, v]) => `request.AddHeader("${k}", "${v}");`)
  .join('\n')}
${body && bodyType !== 'none' ? `request.AddParameter("${activeHeaders['Content-Type'] || 'text/plain'}", "${body.replace(/"/g, '\\"')}", ParameterType.RequestBody);` : ''}

RestResponse response = await client.ExecuteAsync(request);
Console.WriteLine(response.Content);`;

    case 'java_asynchttpclient':
      return `AsyncHttpClient client = Dsl.asyncHttpClient();
client.prepare("${method}", "${url}")
  ${Object.entries(activeHeaders)
    .map(([k, v]) => `.setHeader("${k}", "${v}")`)
    .join('\n  ')}
  ${body && bodyType !== 'none' ? `.setBody("${body.replace(/"/g, '\\"')}")` : ''}
  .execute()
  .toCompletableFuture()
  .thenAccept(s -> System.out.println(s.getResponseBody()))
  .join();

client.close();`;

    case 'java_net_http':
      return `HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
  .uri(URI.create("${url}"))
  .method("${method}", ${body && bodyType !== 'none' ? `HttpRequest.BodyPublishers.ofString("${body.replace(/"/g, '\\"')}")` : 'HttpRequest.BodyPublishers.noBody()'})
  ${Object.entries(activeHeaders)
    .map(([k, v]) => `.setHeader("${k}", "${v}")`)
    .join('\n  ')}
  .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`;

    case 'java_unirest':
      return `HttpResponse<String> response = Unirest.${method.toLowerCase()}("${url}")
  ${Object.entries(activeHeaders)
    .map(([k, v]) => `.header("${k}", "${v}")`)
    .join('\n  ')}
  ${body && bodyType !== 'none' ? `.body("${body.replace(/"/g, '\\"')}")` : ''}
  .asString();

System.out.println(response.getBody());`;

    case 'kotlin_okhttp':
      return `val client = OkHttpClient()
val mediaType = "${activeHeaders['Content-Type'] || 'text/plain'}".toMediaType()
val body = ${body && bodyType !== 'none' ? `"${body.replace(/"/g, '\\"')}".toRequestBody(mediaType)` : '"".toRequestBody(null)'}
val request = Request.Builder()
  .url("${url}")
  .method("${method}", body)
  ${Object.entries(activeHeaders)
    .map(([k, v]) => `.addHeader("${k}", "${v}")`)
    .join('\n  ')}
  .build()

val response = client.newCall(request).execute()
println(response.body?.string())`;
    case 'javascript_fetch':
      const fetchHeaders = JSON.stringify(activeHeaders, null, 2);
      let fetchBody = '';
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        if (bodyType === 'json') fetchBody = `\n  body: JSON.stringify(${body || '{}'}),`;
        else if (bodyType === 'x-www-form-urlencoded') {
          const params = new URLSearchParams();
          bodyFormUrlEncoded.forEach((p) => {
            if (p.enabled && p.key) params.append(p.key, p.value);
          });
          fetchBody = `\n  body: new URLSearchParams('${params.toString()}'),`;
        } else if (bodyType === 'form-data') {
          fetchBody = `\n  body: formData, // Note: browser automatically sets boundary`;
        } else if (bodyType === 'raw') {
          fetchBody = `\n  body: '${body}',`;
        }
      }

      return `const response = await fetch('${url}', {
  method: '${method}',
  headers: ${fetchHeaders.split('\n').join('\n  ')},${fetchBody}
});
const data = await response.json();`;

    case 'nodejs_axios':
      const nodeAxiosConfig: any = {
        method: method.toLowerCase(),
        url: url,
        headers: activeHeaders,
      };
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        if (bodyType === 'json') nodeAxiosConfig.data = safeParse(body);
        else if (bodyType === 'x-www-form-urlencoded') {
          const params = new URLSearchParams();
          bodyFormUrlEncoded.forEach((p) => {
            if (p.enabled && p.key) params.append(p.key, p.value);
          });
          nodeAxiosConfig.data = params.toString();
        } else if (bodyType === 'raw') nodeAxiosConfig.data = body;
      }

      return `const axios = require('axios');

const response = await axios(${JSON.stringify(nodeAxiosConfig, null, 2)});
console.log(response.data);`;

    case 'javascript_axios':
      let axiosConfig: any = {
        method: method.toLowerCase(),
        url: url,
        headers: activeHeaders,
      };
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        if (bodyType === 'json') axiosConfig.data = safeParse(body);
        else if (bodyType === 'x-www-form-urlencoded') {
          const params = new URLSearchParams();
          bodyFormUrlEncoded.forEach((p) => {
            if (p.enabled && p.key) params.append(p.key, p.value);
          });
          axiosConfig.data = params.toString();
        } else if (bodyType === 'raw') axiosConfig.data = body;
      }

      return `import axios from 'axios';

const response = await axios(${JSON.stringify(axiosConfig, null, 2)});
console.log(response.data);`;

    case 'python_requests':
      let pyHeaders = JSON.stringify(activeHeaders, null, 4);
      let pyData = '';
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        if (bodyType === 'json') {
          const parsed = safeParse(body);
          pyData = `, json=${JSON.stringify(parsed, null, 4)}`;
        } else if (bodyType === 'x-www-form-urlencoded') {
          const data: Record<string, string> = {};
          bodyFormUrlEncoded.forEach((p) => {
            if (p.enabled && p.key) data[p.key] = p.value;
          });
          pyData = `, data=${JSON.stringify(data, null, 4)}`;
        } else if (bodyType === 'form-data') {
          const data: Record<string, string> = {};
          bodyFormData.forEach((p) => {
            if (p.enabled && p.key && p.type !== 'file') data[p.key] = p.value;
          });
          pyData = `, data=${JSON.stringify(data, null, 2)}`;
        } else if (bodyType === 'raw') {
          pyData = `, data="""${body.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"""`;
        }
      }

      return `import requests

url = "${url}"
headers = ${pyHeaders}

response = requests.request("${method}", url, headers=headers${pyData})
print(response.text)`;

    case 'go_native':
      return `package main

import (
    "fmt"
    "net/http"
    "io/ioutil"
    ${bodyType !== 'none' ? '"strings"' : ''}
)

func main() {
    url := "${url}"
    method := "${method}"

    ${bodyType !== 'none' ? `payload := strings.NewReader(\`${body.replace(/`/g, '` + "`" + `')}\`)` : 'var payload io.Reader'}

    client := &http.Client{}
    req, err := http.NewRequest(method, url, payload)
    if err != nil {
        fmt.Println(err)
        return
    }

    ${Object.entries(activeHeaders)
      .map(([k, v]) => `req.Header.Add("${k}", "${v}")`)
      .join('\n    ')}

    res, err := client.Do(req)
    if err != nil {
        fmt.Println(err)
        return
    }
    defer res.Body.Close()

    body, err := ioutil.ReadAll(res.Body)
    if err != nil {
        fmt.Println(err)
        return
    }
    fmt.Println(string(body))
}`;

    case 'php_guzzle':
      let phpHeaders = JSON.stringify(activeHeaders, null, 4)
        .replace(/\{/g, '[')
        .replace(/\}/g, ']')
        .replace(/:/g, ' =>');
      let phpOptions: string[] = [`'headers' => ${phpHeaders}`];

      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        if (bodyType === 'json') {
          phpOptions.push(
            `'json' => ${JSON.stringify(safeParse(body), null, 4).replace(/\{/g, '[').replace(/\}/g, ']').replace(/:/g, ' =>')}`,
          );
        } else if (bodyType === 'x-www-form-urlencoded') {
          const data: Record<string, string> = {};
          bodyFormUrlEncoded.forEach((p) => {
            if (p.enabled && p.key) data[p.key] = p.value;
          });
          phpOptions.push(
            `'form_params' => ${JSON.stringify(data, null, 4).replace(/\{/g, '[').replace(/\}/g, ']').replace(/:/g, ' =>')}`,
          );
        } else if (bodyType === 'raw') {
          phpOptions.push(`'body' => '${body.replace(/'/g, "\\'")}'`);
        }
      }

      return `<?php

require 'vendor/autoload.php';

$client = new \\GuzzleHttp\\Client();
$response = $client->request('${method}', '${url}', [
    ${phpOptions.join(',\n    ')}
]);

echo $response->getBody();`;

    case 'java_okhttp':
      let javaHeaders = Object.entries(activeHeaders)
        .map(([k, v]) => `.addHeader("${k}", "${v}")`)
        .join('\n      ');
      let javaBody = 'RequestBody.create(null, new byte[0])';
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        if (bodyType === 'json') {
          javaBody = `RequestBody.create(MediaType.parse("application/json"), "${body.replace(/"/g, '\\"')}")`;
        } else if (bodyType === 'x-www-form-urlencoded') {
          javaBody = `new FormBody.Builder()\n      ${bodyFormUrlEncoded
            .filter((p) => p.enabled && p.key)
            .map((p) => `.add("${p.key}", "${p.value}")`)
            .join('\n      ')}\n      .build()`;
        } else if (bodyType === 'raw') {
          javaBody = `RequestBody.create(null, "${body.replace(/"/g, '\\"')}")`;
        }
      }

      return `import okhttp3.*;
import java.io.IOException;

public class Main {
  public static void main(String[] args) throws IOException {
    OkHttpClient client = new OkHttpClient().newBuilder().build();
    ${bodyType === 'x-www-form-urlencoded' ? '' : 'MediaType mediaType = MediaType.parse("text/plain");'}
    RequestBody body = ${javaBody};
    Request request = new Request.Builder()
      .url("${url}")
      .method("${method}", body)
      ${javaHeaders}
      .build();
    Response response = client.newCall(request).execute();
    System.out.println(response.body().string());
  }
}`;

    case 'php_curl':
      return `<?php

$curl = curl_init();

curl_setopt_array($curl, [
  CURLOPT_URL => '${url}',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => '${method}',
  ${body && bodyType !== 'none' ? `CURLOPT_POSTFIELDS => '${body.replace(/'/g, "\\'")}',` : ''}
  CURLOPT_HTTPHEADER => [
    ${Object.entries(activeHeaders)
      .map(([k, v]) => `'${k}: ${v}'`)
      .join(',\n    ')}
  ],
]);

$response = curl_exec($curl);

curl_close($curl);
echo $response;`;

    case 'powershell_restmethod':
      return `$headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
${Object.entries(activeHeaders)
  .map(([k, v]) => `$headers.Add("${k}", "${v}")`)
  .join('\n')}

${body && bodyType !== 'none' ? `$body = "${body.replace(/"/g, '`"')}"` : ''}

$response = Invoke-RestMethod '${url}' -Method '${method}' -Headers $headers ${body && bodyType !== 'none' ? '-Body $body' : ''}
$response | ConvertTo-Json`;

    case 'powershell_webrequest':
      return `$headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
${Object.entries(activeHeaders)
  .map(([k, v]) => `$headers.Add("${k}", "${v}")`)
  .join('\n')}

${body && bodyType !== 'none' ? `$body = "${body.replace(/"/g, '`"')}"` : ''}

$response = Invoke-WebRequest -Uri '${url}' -Method '${method}' -Headers $headers ${body && bodyType !== 'none' ? '-Body $body' : ''}
$response.Content`;

    case 'python_http_client':
      const pyUrl = new URL(url);
      return `import http.client

conn = http.client.${pyUrl.protocol === 'https:' ? 'HTTPSConnection' : 'HTTPConnection'}("${pyUrl.host}")
payload = ${body && bodyType !== 'none' ? `'''${body}'''` : "''"}
headers = ${JSON.stringify(activeHeaders, null, 4)}
conn.request("${method}", "${pyUrl.pathname}${pyUrl.search}", payload, headers)
res = conn.getresponse()
data = res.read()
print(data.decode("utf-8"))`;

    case 'ruby_net_http':
      return `require 'uri'
require 'net/http'

url = URI("${url}")

http = Net::HTTP.new(url.host, url.port)
${url.startsWith('https') ? 'http.use_ssl = true' : ''}

request = Net::HTTP::${method.charAt(0) + method.slice(1).toLowerCase()}.new(url)
${Object.entries(activeHeaders)
  .map(([k, v]) => `request["${k}"] = "${v}"`)
  .join('\n')}
${body && bodyType !== 'none' ? `request.body = '${body.replace(/'/g, "\\'")}'` : ''}

response = http.request(request)
puts response.read_body`;

    case 'rust_reqwest':
      return `use reqwest::header::{HeaderMap, HeaderValue};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut headers = HeaderMap::new();
    ${Object.entries(activeHeaders)
      .map(([k, v]) => `headers.insert("${k.toLowerCase()}", HeaderValue::from_static("${v}"));`)
      .join('\n    ')}

    let client = reqwest::Client::builder()
        .build()?;

    let res = client.${method.toLowerCase()}("${url}")
        .headers(headers)
        ${body && bodyType !== 'none' ? `.body("${body.replace(/"/g, '\\"')}")` : ''}
        .send()
        .await?;

    println!("{}", res.text().await?);
    Ok(())
}`;

    case 'swift_nsurlsession':
      return `import Foundation

let headers = [
  ${Object.entries(activeHeaders)
    .map(([k, v]) => `"${k}": "${v}"`)
    .join(',\n  ')}
]

${body && bodyType !== 'none' ? `let postData = NSData(data: "${body.replace(/"/g, '\\"')}".data(using: String.Encoding.utf8)!)` : ''}

var request = URLRequest(url: URL(string: "${url}")!,timeoutInterval: Double.infinity)
request.httpMethod = "${method}"
request.allHTTPHeaderFields = headers
${body && bodyType !== 'none' ? 'request.httpBody = postData as Data' : ''}

let task = URLSession.shared.dataTask(with: request) { data, response, error in
  guard let data = data else {
    print(String(describing: error))
    return
  }
  print(String(data: data, encoding: .utf8)!)
}

task.resume()`;

    case 'objectivec_nsurlsession':
      return `#import <Foundation/Foundation.h>

NSDictionary *headers = @{
  ${Object.entries(activeHeaders)
    .map(([k, v]) => `@"${k}": @"${v}"`)
    .join(',\n  ')}
};

${body && bodyType !== 'none' ? `NSData *postData = [[NSData alloc] initWithData:[@"${body.replace(/"/g, '\\"')}" dataUsingEncoding:NSUTF8StringEncoding]];` : ''}

NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:@"${url}"]
                                                       cachePolicy:NSURLRequestUseProtocolCachePolicy
                                                   timeoutInterval:10.0];
[request setHTTPMethod:@"${method}"];
[request setAllHTTPHeaderFields:headers];
${body && bodyType !== 'none' ? '[request setHTTPBody:postData];' : ''}

NSURLSession *session = [NSURLSession sharedSession];
NSURLSessionDataTask *dataTask = [session dataTaskWithRequest:request
                                            completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
                                                if (error) {
                                                    NSLog(@"%@", error);
                                                } else {
                                                    NSString *responseString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
                                                    NSLog(@"%@", responseString);
                                                }
                                            }];
[dataTask resume];`;

    case 'clojure_clj_http':
      return `(require '[clj-http.client :as client])

(client/${method.toLowerCase()} "${url}"
  {:headers ${JSON.stringify(activeHeaders, null, 2)}
   ${body && bodyType !== 'none' ? `:body "${body.replace(/"/g, '\\"')}"` : ''}})`;

    case 'ocaml_cohttp':
      return `open Lwt
open Cohttp
open Cohttp_lwt_unix

let setup_log () =
  let () = Fmt_tty.setup_std_outputs () in
  Logs.set_level (Some Logs.Info);
  Logs.set_reporter (Logs_fmt.reporter ())

let main () =
  let uri = Uri.of_string "${url}" in
  let headers = Header.of_list [
    ${Object.entries(activeHeaders)
      .map(([k, v]) => `("${k}", "${v}")`)
      .join(';\n    ')}
  ] in
  ${body && bodyType !== 'none' ? `let body = Cohttp_lwt.Body.of_string "${body.replace(/"/g, '\\"')}" in` : 'let body = Cohttp_lwt.Body.empty in'}
  Client.call ~headers ~body \`${method} uri >>= fun (resp, body) ->
  let code = resp |> Response.status |> Code.code_of_status in
  Printf.printf "Response code: %d\\n" code;
  body |> Cohttp_lwt.Body.to_string >|= fun body ->
  Printf.printf "Body of length: %d\\n" (String.length body);
  body

let () =
  let body = Lwt_main.run (main ()) in
  print_endline body`;

    case 'r_httr':
      return `library(httr)

headers = c(
  ${Object.entries(activeHeaders)
    .map(([k, v]) => `"${k}" = "${v}"`)
    .join(',\n  ')}
)

${body && bodyType !== 'none' ? `body = "${body.replace(/"/g, '\\"')}"` : ''}

res <- VERB("${method}", url = "${url}", add_headers(headers) ${body && bodyType !== 'none' ? ', body = body' : ''})

cat(content(res, "text"))`;

    default:
      return `// Code generation for ${language} coming soon...`;
  }
}
