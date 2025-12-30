/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { getTool, TOOL_IDS } from '@/lib/tool-registry';
import { notFound } from 'next/navigation';

import { Metadata } from 'next';
import dynamic from 'next/dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool: toolId } = await params;
  const tool = getTool(toolId);

  if (!tool) {
    return {
      title: 'Tool Not Found',
    };
  }

  return {
    title: tool.name,
    description: tool.description,
  };
}

export const generateStaticParams = () => {
  return TOOL_IDS.map((toolId) => ({
    tool: toolId,
  }));
};

const toolComponents = {
  'rate-limit-backoff': dynamic(() =>
    import('@/app/tools/rate-limit-backoff').then((mod) => mod.default),
  ),
  'sql-formatter': dynamic(() => import('@/app/tools/sql-formatter').then((mod) => mod.default)),
  'sql-linter': dynamic(() => import('@/app/tools/sql-linter').then((mod) => mod.default)),
  'sql-explain': dynamic(() => import('@/app/tools/sql-explain').then((mod) => mod.default)),
  'json-formatter': dynamic(() => import('@/app/tools/json-formatter').then((mod) => mod.default)),
  'json-validator': dynamic(() => import('@/app/tools/json-validator').then((mod) => mod.default)),
  'xml-formatter': dynamic(() => import('@/app/tools/xml-formatter').then((mod) => mod.default)),
  'xml-validator': dynamic(() => import('@/app/tools/xml-validator').then((mod) => mod.default)),
  'url-encoder-decoder': dynamic(() =>
    import('@/app/tools/url-encoder-decoder').then((mod) => mod.default),
  ),
  'base64-encoder': dynamic(() => import('@/app/tools/base64-encoder').then((mod) => mod.default)),
  'base64-decoder': dynamic(() => import('@/app/tools/base64-decoder').then((mod) => mod.default)),
  'html-formatter': dynamic(() => import('@/app/tools/html-formatter').then((mod) => mod.default)),
  'html-escape': dynamic(() => import('@/app/tools/html-escape').then((mod) => mod.default)),
  'html-unescape': dynamic(() => import('@/app/tools/html-unescape').then((mod) => mod.default)),
  'xml-escape': dynamic(() => import('@/app/tools/xml-escape').then((mod) => mod.default)),
  'xml-unescape': dynamic(() => import('@/app/tools/xml-unescape').then((mod) => mod.default)),
  'json-escape': dynamic(() => import('@/app/tools/json-escape').then((mod) => mod.default)),
  'csv-escape': dynamic(() => import('@/app/tools/csv-escape').then((mod) => mod.default)),
  'md5-hash': dynamic(() => import('@/app/tools/md5-hash').then((mod) => mod.default)),
  'sha256-hash': dynamic(() => import('@/app/tools/sha256-hash').then((mod) => mod.default)),
  'sha512-hash': dynamic(() => import('@/app/tools/sha512-hash').then((mod) => mod.default)),
  'uuid-generator': dynamic(() => import('@/app/tools/uuid-generator').then((mod) => mod.default)),
  'jwt-decoder': dynamic(() => import('@/app/tools/jwt-decoder').then((mod) => mod.default)),
  'epoch-to-date': dynamic(() => import('@/app/tools/epoch-to-date').then((mod) => mod.default)),
  'date-to-epoch': dynamic(() => import('@/app/tools/date-to-epoch').then((mod) => mod.default)),
  'reverse-string': dynamic(() => import('@/app/tools/reverse-string').then((mod) => mod.default)),
  'string-to-lines': dynamic(() =>
    import('@/app/tools/string-to-lines').then((mod) => mod.default),
  ),
  'remove-whitespace': dynamic(() =>
    import('@/app/tools/remove-whitespace').then((mod) => mod.default),
  ),
  'text-uppercase': dynamic(() => import('@/app/tools/text-uppercase').then((mod) => mod.default)),
  'text-lowercase': dynamic(() => import('@/app/tools/text-lowercase').then((mod) => mod.default)),
  'title-case': dynamic(() => import('@/app/tools/title-case').then((mod) => mod.default)),
  'minify-json': dynamic(() => import('@/app/tools/minify-json').then((mod) => mod.default)),
  'minify-css': dynamic(() => import('@/app/tools/minify-css').then((mod) => mod.default)),
  'beautify-css': dynamic(() => import('@/app/tools/beautify-css').then((mod) => mod.default)),
  'minify-js': dynamic(() => import('@/app/tools/minify-js').then((mod) => mod.default)),
  'json-to-csv': dynamic(() => import('@/app/tools/json-to-csv').then((mod) => mod.default)),
  'api-client': dynamic(() => import('@/app/tools/api-client/page').then((mod) => mod.default)),
  'json-studio': dynamic(() => import('@/app/tools/json-studio').then((mod) => mod.default)),
  'json-sorter': dynamic(() => import('@/app/tools/json-sorter').then((mod) => mod.default)),
  'json-fixer': dynamic(() => import('@/app/tools/json-fixer').then((mod) => mod.default)),
  'json-schema': dynamic(() => import('@/app/tools/json-schema').then((mod) => mod.default)),
  'json-query': dynamic(() => import('@/app/tools/json-query').then((mod) => mod.default)),
  'dns-analysis': dynamic(() => import('@/app/tools/dns-analysis').then((mod) => mod.default)),
  'mx-lookup': dynamic(() => import('@/app/tools/mx-lookup').then((mod) => mod.default)),
  'soa-lookup': dynamic(() => import('@/app/tools/soa-lookup').then((mod) => mod.default)),
  'reverse-dns-lookup': dynamic(() =>
    import('@/app/tools/reverse-dns-lookup').then((mod) => mod.default),
  ),
  'name-server-lookup': dynamic(() =>
    import('@/app/tools/name-server-lookup').then((mod) => mod.default),
  ),
  'dns-traversal': dynamic(() => import('@/app/tools/dns-traversal').then((mod) => mod.default)),
  'namespace-server-delegation': dynamic(() =>
    import('@/app/tools/namespace-server-delegation').then((mod) => mod.default),
  ),
  'responsive-tester': dynamic(() =>
    import('@/app/tools/responsive-tester').then((mod) => mod.default),
  ),
  // Transformation Tools
  'yaml-to-json': dynamic(() => import('@/app/tools/yaml-to-json').then((mod) => mod.default)),
  'json-to-yaml': dynamic(() => import('@/app/tools/json-to-yaml').then((mod) => mod.default)),
  'json-to-typescript': dynamic(() =>
    import('@/app/tools/json-to-typescript').then((mod) => mod.default),
  ),
  'json-to-go': dynamic(() => import('@/app/tools/json-to-go').then((mod) => mod.default)),
  'json-to-zod': dynamic(() => import('@/app/tools/json-to-zod').then((mod) => mod.default)),
  'xml-to-json': dynamic(() => import('@/app/tools/xml-to-json').then((mod) => mod.default)),
  'toml-to-json': dynamic(() => import('@/app/tools/toml-to-json').then((mod) => mod.default)),
  'json-to-toml': dynamic(() => import('@/app/tools/json-to-toml').then((mod) => mod.default)),
  'markdown-to-html': dynamic(() =>
    import('@/app/tools/markdown-to-html').then((mod) => mod.default),
  ),
  'html-to-jsx': dynamic(() => import('@/app/tools/html-to-jsx').then((mod) => mod.default)),
  // Phase 1: Quick Wins
  'csv-to-json': dynamic(() => import('@/app/tools/csv-to-json').then((mod) => mod.default)),
  'json-to-java': dynamic(() => import('@/app/tools/json-to-java').then((mod) => mod.default)),
  'json-to-csharp': dynamic(() => import('@/app/tools/json-to-csharp').then((mod) => mod.default)),
  'json-to-sql': dynamic(() => import('@/app/tools/json-to-sql').then((mod) => mod.default)),
  'formdata-to-json': dynamic(() =>
    import('@/app/tools/formdata-to-json').then((mod) => mod.default),
  ),
  // Phase 2: Schema Tools
  'json-to-json-schema': dynamic(() =>
    import('@/app/tools/json-to-json-schema').then((mod) => mod.default),
  ),
  'typescript-to-zod': dynamic(() =>
    import('@/app/tools/typescript-to-zod').then((mod) => mod.default),
  ),
  'json-to-valibot': dynamic(() =>
    import('@/app/tools/json-to-valibot').then((mod) => mod.default),
  ),
  'json-to-yup': dynamic(() => import('@/app/tools/json-to-yup').then((mod) => mod.default)),
  'json-to-typebox': dynamic(() =>
    import('@/app/tools/json-to-typebox').then((mod) => mod.default),
  ),
  // Phase 3: Language Converters
  'json-to-kotlin': dynamic(() => import('@/app/tools/json-to-kotlin').then((mod) => mod.default)),
  'json-to-dart': dynamic(() => import('@/app/tools/json-to-dart').then((mod) => mod.default)),
  'json-to-rust': dynamic(() => import('@/app/tools/json-to-rust').then((mod) => mod.default)),
  'jsx-to-tsx': dynamic(() => import('@/app/tools/jsx-to-tsx').then((mod) => mod.default)),
  'json-to-swift': dynamic(() => import('@/app/tools/json-to-swift').then((mod) => mod.default)),
  // Phase 4: Advanced Tools
  'typescript-to-graphql': dynamic(() =>
    import('@/app/tools/typescript-to-graphql').then((mod) => mod.default),
  ),
  'css-to-tailwind': dynamic(() =>
    import('@/app/tools/css-to-tailwind').then((mod) => mod.default),
  ),
  'json5-to-json': dynamic(() => import('@/app/tools/json5-to-json').then((mod) => mod.default)),
  'json-to-graphql': dynamic(() =>
    import('@/app/tools/json-to-graphql').then((mod) => mod.default),
  ),
  'openapi-grpc-workbench': dynamic(() =>
    import('@/app/tools/openapi-grpc-workbench').then((mod) => mod.default),
  ),
  'log-parser-playground': dynamic(() =>
    import('@/app/tools/log-parser-playground').then((mod) => mod.default),
  ),
  'test-api': dynamic(() => import('@/app/tools/test-api').then((mod) => mod.default)),
  'architecture-diagram': dynamic(() =>
    import('@/app/tools/architecture-diagram/page').then((mod) => mod.default),
  ),
};

export default async function ToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool: toolId } = await params;
  const tool = getTool(toolId);

  if (!tool) {
    notFound();
  }

  const Component = toolComponents[toolId as keyof typeof toolComponents];

  if (!Component) {
    notFound();
  }

  return <Component />;
}
