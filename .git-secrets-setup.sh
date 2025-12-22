#!/bin/bash
# Git Secrets Setup Script for Write Pretend
# This script installs and configures git-secrets to prevent accidental commits of sensitive data

set -e

echo "🔒 Setting up git-secrets for Write Pretend..."
echo ""

# Check if git-secrets is installed
if ! command -v git-secrets &> /dev/null; then
    echo "📦 git-secrets not found. Installing..."
    if command -v brew &> /dev/null; then
        brew install git-secrets
    else
        echo "❌ Homebrew not found. Please install git-secrets manually:"
        echo "   https://github.com/awslabs/git-secrets"
        exit 1
    fi
fi

echo "✓ git-secrets is installed"
echo ""

# Install git-secrets hooks
echo "📌 Installing git-secrets hooks..."
git secrets --install
echo "✓ Hooks installed"
echo ""

# Register AWS patterns
echo "🔧 Configuring patterns..."
git secrets --register-aws

# Add custom patterns for our secrets
git secrets --add 'DATABASE_URL.*'
git secrets --add 'SESSION_SECRET.*'
git secrets --add 'DISCORD.*TOKEN.*'
git secrets --add 'PLAYFAB.*SECRET.*'
git secrets --add 'ENCRYPTION_KEY.*'
git secrets --add 'postgresql://[^/]+:[^@]+@'

echo "✓ Patterns configured"
echo ""

# Scan the repository
echo "🔍 Scanning repository for secrets..."
if git secrets --scan; then
    echo "✅ Repository is clean! No secrets detected."
else
    echo "⚠️  Secrets detected. Please review and fix before committing."
    exit 1
fi

echo ""
echo "🎉 git-secrets setup complete!"
echo ""
echo "📝 Note: The .gitallowed file contains patterns for approved"
echo "   example/template values in documentation."
echo ""
echo "To scan before committing: git secrets --scan"
echo "To add allowed patterns: Add to .gitallowed file"
