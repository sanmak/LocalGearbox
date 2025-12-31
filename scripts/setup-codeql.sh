#!/bin/bash

# CodeQL Local Setup Script
# This script downloads and sets up CodeQL CLI for local security analysis

set -e

echo "🔍 Setting up CodeQL for local security analysis..."

# Configuration
CODEQL_VERSION="2.20.0"
CODEQL_DIR="/tmp/codeql"
CODEQL_BUNDLE="codeql-osx-arm64.tar.gz"

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

if [[ "$OS" == "darwin" ]]; then
    if [[ "$ARCH" == "arm64" ]]; then
        CODEQL_BUNDLE="codeql-osx-arm64.tar.gz"
    else
        CODEQL_BUNDLE="codeql-osx64.tar.gz"
    fi
elif [[ "$OS" == "linux" ]]; then
    if [[ "$ARCH" == "x86_64" ]]; then
        CODEQL_BUNDLE="codeql-linux64.tar.gz"
    else
        echo "❌ Unsupported Linux architecture: $ARCH"
        exit 1
    fi
else
    echo "❌ Unsupported OS: $OS"
    exit 1
fi

# Check if CodeQL is already installed
if [ -f "$CODEQL_DIR/codeql" ]; then
    echo "✅ CodeQL CLI already installed at $CODEQL_DIR"
    VERSION_CHECK=$($CODEQL_DIR/codeql version 2>/dev/null || echo "unknown")
    echo "   Current version: $VERSION_CHECK"
else
    echo "📦 Downloading CodeQL CLI v$CODEQL_VERSION for $OS ($ARCH)..."

    # Create temp directory
    mkdir -p /tmp/codeql-download
    cd /tmp/codeql-download

    # Download CodeQL CLI
    DOWNLOAD_URL="https://github.com/github/codeql-cli-binaries/releases/download/v${CODEQL_VERSION}/${CODEQL_BUNDLE}"
    echo "   URL: $DOWNLOAD_URL"

    if command -v curl &> /dev/null; then
        curl -L "$DOWNLOAD_URL" -o "$CODEQL_BUNDLE"
    elif command -v wget &> /dev/null; then
        wget "$DOWNLOAD_URL"
    else
        echo "❌ Neither curl nor wget found. Please install one of them."
        exit 1
    fi

    # Extract
    echo "📂 Extracting CodeQL CLI..."
    tar -xzf "$CODEQL_BUNDLE" -C /tmp/

    # Cleanup
    cd -
    rm -rf /tmp/codeql-download

    echo "✅ CodeQL CLI installed successfully!"
fi

# Clone or update CodeQL queries
QUERIES_DIR="/tmp/codeql-queries"
if [ -d "$QUERIES_DIR" ]; then
    echo "♻️  Updating CodeQL queries..."
    cd "$QUERIES_DIR"
    git pull -q
    cd -
else
    echo "📥 Cloning CodeQL queries repository..."
    git clone --depth=1 https://github.com/github/codeql.git "$QUERIES_DIR"
fi

# Display installation info
echo ""
echo "✅ CodeQL setup complete!"
echo ""
echo "📍 Installation locations:"
echo "   CodeQL CLI:    $CODEQL_DIR/codeql"
echo "   Query packs:   $QUERIES_DIR"
echo ""
echo "🚀 Next steps:"
echo "   1. Run: ./scripts/run-codeql-analysis.sh"
echo "   2. Or use: $CODEQL_DIR/codeql --help"
echo ""
