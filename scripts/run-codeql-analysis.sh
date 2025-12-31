#!/bin/bash

# CodeQL Analysis Runner
# This script creates a CodeQL database and runs security analysis

set -e

# Configuration
CODEQL_CLI="/tmp/codeql/codeql"
CODEQL_QUERIES="/tmp/codeql-queries"
DB_DIR="/tmp/codeql-db"
RESULTS_DIR="./codeql-results"
PROJECT_ROOT="$(pwd)"

echo "🔍 Running CodeQL Security Analysis..."

# Check if CodeQL is installed
if [ ! -f "$CODEQL_CLI" ]; then
    echo "❌ CodeQL CLI not found at $CODEQL_CLI"
    echo "   Please run: ./scripts/setup-codeql.sh"
    exit 1
fi

# Create results directory
mkdir -p "$RESULTS_DIR"

# Clean up old database
if [ -d "$DB_DIR" ]; then
    echo "🧹 Cleaning up old database..."
    rm -rf "$DB_DIR"
fi

# Step 1: Create CodeQL database
echo "📊 Creating CodeQL database for JavaScript/TypeScript..."
$CODEQL_CLI database create "$DB_DIR" \
    --language=javascript-typescript \
    --source-root="$PROJECT_ROOT" \
    --overwrite

echo "✅ Database created successfully!"

# Step 2: Run security analysis
echo "🔎 Running security analysis (this may take a few minutes)..."

# Run security-and-quality query suite
$CODEQL_CLI database analyze "$DB_DIR" \
    --format=sarif-latest \
    --output="$RESULTS_DIR/security-analysis.sarif" \
    --download \
    codeql/javascript-queries:codeql-suites/javascript-security-and-quality.qls

echo "✅ Analysis complete!"

# Step 3: Run specific query for remote property injection
echo "🎯 Running specific check for remote property injection..."
$CODEQL_CLI database analyze "$DB_DIR" \
    --format=csv \
    --output="$RESULTS_DIR/remote-property-injection.csv" \
    --download \
    codeql/javascript-queries:codeql-suites/javascript-security-extended.qls

# Step 4: Generate human-readable report
echo "📝 Generating human-readable report..."
$CODEQL_CLI database analyze "$DB_DIR" \
    --format=text \
    --output="$RESULTS_DIR/analysis-report.txt" \
    --download \
    codeql/javascript-queries:codeql-suites/javascript-security-and-quality.qls

echo ""
echo "✅ CodeQL analysis complete!"
echo ""
echo "📊 Results saved to:"
echo "   SARIF format:  $RESULTS_DIR/security-analysis.sarif"
echo "   CSV format:    $RESULTS_DIR/remote-property-injection.csv"
echo "   Text report:   $RESULTS_DIR/analysis-report.txt"
echo ""
echo "💡 Tips:"
echo "   - View SARIF in VS Code with the SARIF Viewer extension"
echo "   - Upload SARIF to GitHub Security tab for integrated viewing"
echo "   - Check the text report for a quick overview"
echo ""

# Optional: Display summary
if [ -f "$RESULTS_DIR/analysis-report.txt" ]; then
    echo "📋 Quick Summary:"
    echo "════════════════════════════════════════════════════════"
    head -n 50 "$RESULTS_DIR/analysis-report.txt"
    echo "════════════════════════════════════════════════════════"
    echo "   (See full report in $RESULTS_DIR/analysis-report.txt)"
fi
