/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSX to TSX Converter
 * Convert React JSX to TypeScript TSX with type annotations
 */

import { ToolLayout } from '@/components/ToolLayout';

const SAMPLE_JSX = `import { useState, useEffect } from 'react';

function UserCard({ user, onUpdate, isAdmin }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);

  useEffect(() => {
    setName(user.name);
  }, [user.name]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({ ...user, name });
    setIsEditing(false);
  };

  const handleChange = (e) => {
    setName(e.target.value);
  };

  return (
    <div className="user-card">
      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <input
            value={name}
            onChange={handleChange}
            placeholder="Enter name"
          />
          <button type="submit">Save</button>
        </form>
      ) : (
        <>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          {isAdmin && <span className="badge">Admin</span>}
          <button onClick={() => setIsEditing(true)}>Edit</button>
        </>
      )}
    </div>
  );
}

export default UserCard;`;

interface PropInfo {
  name: string;
  type: string;
  optional: boolean;
}

function inferPropType(propName: string): string {
  if (propName.startsWith('on') || propName.startsWith('handle')) return '() => void';
  if (
    propName.startsWith('is') ||
    propName.startsWith('has') ||
    propName.startsWith('show') ||
    propName.startsWith('can')
  )
    return 'boolean';
  if (propName === 'children') return 'React.ReactNode';
  if (propName === 'className') return 'string';
  if (propName === 'style') return 'React.CSSProperties';
  if (propName === 'id' || propName.endsWith('Id')) return 'string | number';
  if (propName.endsWith('s') && !propName.endsWith('ss')) return 'unknown[]';
  return 'unknown';
}

function extractProps(code: string): PropInfo[] {
  const props: PropInfo[] = [];

  const propsMatch = code.match(/function\s+\w+\s*\(\s*\{([^}]+)\}/);
  if (propsMatch) {
    const propsStr = propsMatch[1];
    const propMatches = propsStr.matchAll(/(\w+)(?:\s*=\s*[^,}]+)?/g);

    for (const match of propMatches) {
      const propName = match[1];
      const hasDefault = match[0].includes('=');
      props.push({
        name: propName,
        type: inferPropType(propName),
        optional: hasDefault,
      });
    }
  }

  const arrowPropsMatch = code.match(/(?:const|let)\s+\w+\s*=\s*\(\s*\{([^}]+)\}/);
  if (arrowPropsMatch && props.length === 0) {
    const propsStr = arrowPropsMatch[1];
    const propMatches = propsStr.matchAll(/(\w+)(?:\s*=\s*[^,}]+)?/g);

    for (const match of propMatches) {
      const propName = match[1];
      const hasDefault = match[0].includes('=');
      props.push({
        name: propName,
        type: inferPropType(propName),
        optional: hasDefault,
      });
    }
  }

  return props;
}

function generatePropsInterface(componentName: string, props: PropInfo[]): string {
  if (props.length === 0) return '';

  const lines: string[] = [];
  lines.push(`interface ${componentName}Props {`);
  for (const prop of props) {
    const optional = prop.optional ? '?' : '';
    lines.push(`  ${prop.name}${optional}: ${prop.type};`);
  }
  lines.push('}');
  return lines.join('\n');
}

async function convertJsxToTsx(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  let result = input;

  const componentMatch = input.match(/(?:function|const|let)\s+(\w+)/);
  const componentName = componentMatch ? componentMatch[1] : 'Component';

  const props = extractProps(input);

  if (props.length > 0) {
    const propsInterface = generatePropsInterface(componentName, props);

    const importEndMatch = input.match(/^(import[^;]+;[\s\n]*)+/m);
    if (importEndMatch) {
      const importEnd = importEndMatch[0].length;
      result = input.slice(0, importEnd) + '\n' + propsInterface + '\n' + input.slice(importEnd);
    } else {
      result = propsInterface + '\n\n' + input;
    }

    result = result.replace(
      /function\s+(\w+)\s*\(\s*\{([^}]+)\}\s*\)/,
      `function $1({ $2 }: ${componentName}Props)`,
    );

    result = result.replace(
      /(const|let)\s+(\w+)\s*=\s*\(\s*\{([^}]+)\}\s*\)\s*=>/,
      `$1 $2 = ({ $3 }: ${componentName}Props) =>`,
    );
  }

  result = result.replace(
    /const\s+(\w+)\s*=\s*\((e)\)\s*=>/g,
    'const $1 = (e: React.FormEvent) =>',
  );
  result = result.replace(
    /onChange=\{?\((e)\)\s*=>/g,
    'onChange={(e: React.ChangeEvent<HTMLInputElement>) =>',
  );
  result = result.replace(
    /onSubmit=\{?\((e)\)\s*=>/g,
    'onSubmit={(e: React.FormEvent<HTMLFormElement>) =>',
  );
  result = result.replace(/onClick=\{?\((e)\)\s*=>/g, 'onClick={(e: React.MouseEvent) =>');

  result = result.replace(/useState\(false\)/g, 'useState<boolean>(false)');
  result = result.replace(/useState\(true\)/g, 'useState<boolean>(true)');
  result = result.replace(/useState\(0\)/g, 'useState<number>(0)');
  result = result.replace(/useState\(""\)/g, 'useState<string>("")');
  result = result.replace(/useState\(\[\]\)/g, 'useState<unknown[]>([])');
  result = result.replace(/useState\(\{\}\)/g, 'useState<Record<string, unknown>>({})');

  return result;
}

export default function JSXToTSXPage() {
  return (
    <ToolLayout
      toolName="JSX to TSX"
      toolDescription="Convert React JSX to TypeScript TSX with inferred type annotations and props interface."
      onProcess={convertJsxToTsx}
      placeholder="Paste your JSX code here..."
      sampleData={SAMPLE_JSX}
      showJsonButtons={false}
    />
  );
}
