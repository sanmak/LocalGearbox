# CodeQL Local Analysis Guide

This guide explains how to run CodeQL security analysis locally to detect vulnerabilities like the remote property injection issue we fixed.

## Quick Start

### 1. Setup CodeQL (One-time)

```bash
chmod +x scripts/setup-codeql.sh
./scripts/setup-codeql.sh
```

This will:

- Download CodeQL CLI for your platform (macOS ARM64/Intel, Linux)
- Install CodeQL query packs
- Set everything up in `/tmp/codeql`

### 2. Run Analysis

```bash
chmod +x scripts/run-codeql-analysis.sh
./scripts/run-codeql-analysis.sh
```

This will:

- Create a CodeQL database from your codebase
- Run security and quality checks
- Generate reports in multiple formats

### 3. View Results

Results are saved in `./codeql-results/`:

- `security-analysis.sarif` - Full SARIF format (upload to GitHub or view in VS Code)
- `remote-property-injection.csv` - CSV format for spreadsheet analysis
- `analysis-report.txt` - Human-readable text report

## Understanding the Remote Property Injection Issue

### What is it?

Remote property injection (also known as prototype pollution) occurs when:

1. User-controlled data is used as property names
2. Properties are assigned without validation
3. Attackers can inject special properties like `__proto__`, `constructor`, or `prototype`

### The Vulnerability (Before Fix)

```typescript
// VULNERABLE CODE
for (const [key, value] of Object.entries(payload.envUpdates)) {
  environmentUpdates[key] = String(value); // ❌ Dangerous!
}
```

An attacker could send:

```json
{
  "envUpdates": {
    "__proto__": "malicious",
    "constructor": { "polluted": true }
  }
}
```

### The Fix (After)

```typescript
// SECURE CODE
for (const [key, value] of Object.entries(payload.envUpdates)) {
  // Validate property names
  if (
    key === '__proto__' ||
    key === 'constructor' ||
    key === 'prototype' ||
    !Object.prototype.hasOwnProperty.call(payload.envUpdates, key)
  ) {
    safeLog(`Warning: Skipping dangerous property name: ${key}`);
    continue;
  }

  // Use safe assignment
  Object.defineProperty(environmentUpdates, key, {
    value: String(value),
    writable: true,
    enumerable: true,
    configurable: true,
  });
}
```

## Manual CodeQL Commands

If you prefer to run commands manually:

### Create Database

```bash
/tmp/codeql/codeql database create /tmp/codeql-db \
  --language=javascript-typescript \
  --source-root=.
```

### Run Analysis

```bash
# Security and quality analysis
/tmp/codeql/codeql database analyze /tmp/codeql-db \
  --format=sarif-latest \
  --output=results.sarif \
  --download \
  javascript-typescript-security-and-quality.qls
```

### Query Specific Issues

```bash
# Check for remote property injection specifically
/tmp/codeql/codeql database analyze /tmp/codeql-db \
  --format=text \
  --download \
  javascript-typescript-security-extended.qls \
  | grep -A 10 "remote-property-injection"
```

## VS Code Integration

### Install SARIF Viewer Extension

1. Install the [SARIF Viewer extension](https://marketplace.visualstudio.com/items?itemName=MS-SarifVSCode.sarif-viewer)
2. Open `codeql-results/security-analysis.sarif`
3. View results with inline code highlighting

### Install CodeQL Extension

For advanced analysis:

1. Install [CodeQL extension](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-codeql)
2. Open CodeQL databases directly
3. Write custom queries

## GitHub Integration

### Upload SARIF to GitHub Security

```bash
# Using GitHub CLI
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/OWNER/REPO/code-scanning/sarifs \
  -f sarif=@codeql-results/security-analysis.sarif \
  -f ref=refs/heads/main \
  -f commit_sha=$(git rev-parse HEAD)
```

### Automated CI/CD

The existing workflow at `.github/workflows/codeql.yml` runs automatically on:

- Every push to `main`
- Every pull request
- Weekly (Sundays at midnight UTC)

## Common Issues

### Issue: "CodeQL CLI not found"

**Solution:** Run `./scripts/setup-codeql.sh` first

### Issue: "Database creation failed"

**Solution:** Ensure you're in the project root and have write access to `/tmp`

### Issue: "No results found"

**Solution:** This is good! It means no vulnerabilities were detected.

### Issue: Analysis takes too long

**Solution:** CodeQL analysis can be slow on large codebases. Consider:

- Running only security queries (not quality)
- Analyzing specific directories
- Using `--threads` flag to parallelize

## Query Suites

CodeQL provides different query suites:

- `security-and-quality` - Comprehensive (recommended)
- `security-extended` - All security queries
- `security-experimental` - Experimental security checks
- `code-scanning` - GitHub Code Scanning default queries

## Custom Queries

You can write custom CodeQL queries in `.ql` files:

```ql
/**
 * @name Custom property injection check
 * @kind problem
 * @id js/custom-property-injection
 */

import javascript

from PropertyWriteNode write, DataFlow::Node source
where
  // Your custom logic here
  source.flowsTo(write.getPropertyNameExpr().flow())
select write, "Potential property injection from $@.", source, "user input"
```

## Additional Resources

- [CodeQL Documentation](https://codeql.github.com/docs/)
- [CodeQL Query Reference](https://codeql.github.com/codeql-query-help/javascript/)
- [OWASP Prototype Pollution](https://owasp.org/www-community/vulnerabilities/Prototype_Pollution)
- [GitHub Code Scanning](https://docs.github.com/en/code-security/code-scanning)

## Clean Up

To remove CodeQL installation:

```bash
rm -rf /tmp/codeql /tmp/codeql-queries /tmp/codeql-db
rm -rf ./codeql-results
```

## Support

For issues with:

- **CodeQL setup:** Check [CodeQL CLI releases](https://github.com/github/codeql-cli-binaries/releases)
- **False positives:** Review the query logic and consider suppression
- **Custom queries:** Consult [CodeQL query cookbook](https://codeql.github.com/docs/codeql-language-guides/codeql-library-for-javascript/)
