#!/usr/bin/env bash
# =============================================================================
# AI Dev Environment Setup for WSL (Ubuntu/Debian)
# Installs: Claude Code, Gemini CLI, ShellGPT
# =============================================================================
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ---------------------------------------------------------------------------
# 1. Check prerequisites
# ---------------------------------------------------------------------------
info "Checking prerequisites..."

check_cmd() {
    if ! command -v "$1" &>/dev/null; then
        error "$1 is not installed."
        return 1
    fi
}

MISSING=0

if ! check_cmd node; then
    warn "Node.js not found. Installing via NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

if ! check_cmd python3; then
    warn "Python3 not found. Installing..."
    sudo apt-get update && sudo apt-get install -y python3 python3-pip
fi

if ! check_cmd git; then
    warn "Git not found. Installing..."
    sudo apt-get update && sudo apt-get install -y git
fi

info "Prerequisites satisfied:"
echo "  Node.js : $(node --version)"
echo "  Python  : $(python3 --version)"
echo "  Git     : $(git --version)"
echo "  npm     : $(npm --version)"

# ---------------------------------------------------------------------------
# 2. Install AI CLI tools
# ---------------------------------------------------------------------------

# --- Claude Code ---
if command -v claude &>/dev/null; then
    info "Claude Code already installed ($(claude --version))"
else
    info "Installing Claude Code..."
    npm install -g @anthropic-ai/claude-code
fi

# --- Gemini CLI ---
if command -v gemini &>/dev/null; then
    info "Gemini CLI already installed ($(gemini --version))"
else
    info "Installing Gemini CLI..."
    npm install -g @google/gemini-cli
fi

# --- ShellGPT ---
if command -v sgpt &>/dev/null; then
    info "ShellGPT already installed"
else
    info "Installing ShellGPT..."
    pip3 install shell-gpt
fi

# ---------------------------------------------------------------------------
# 3. Set up API key placeholders in shell profile
# ---------------------------------------------------------------------------
PROFILE="$HOME/.bashrc"
if [ -n "${ZSH_VERSION:-}" ] || [ -f "$HOME/.zshrc" ]; then
    PROFILE="$HOME/.zshrc"
fi

MARKER="# >>> AI Dev Environment API Keys <<<"

if ! grep -q "$MARKER" "$PROFILE" 2>/dev/null; then
    info "Adding API key placeholders to $PROFILE"
    cat >> "$PROFILE" << 'KEYS'

# >>> AI Dev Environment API Keys <<<
# Replace "your-key-here" with your actual API keys
# Get keys from:
#   Anthropic : https://console.anthropic.com
#   Google    : https://aistudio.google.com/apikey
#   OpenAI    : https://platform.openai.com/api-keys
export ANTHROPIC_API_KEY="your-key-here"
export GEMINI_API_KEY="your-key-here"
export OPENAI_API_KEY="your-key-here"
# <<< AI Dev Environment API Keys >>>
KEYS
    warn "API key placeholders added to $PROFILE"
    warn "Edit $PROFILE and replace 'your-key-here' with real keys, then run: source $PROFILE"
else
    info "API key block already present in $PROFILE"
fi

# ---------------------------------------------------------------------------
# 4. Configure ShellGPT (prevent interactive first-run prompt)
# ---------------------------------------------------------------------------
SGPT_CONFIG_DIR="$HOME/.config/shell_gpt"
SGPT_CONFIG="$SGPT_CONFIG_DIR/.sgptrc"

if [ ! -f "$SGPT_CONFIG" ]; then
    info "Creating ShellGPT config at $SGPT_CONFIG"
    mkdir -p "$SGPT_CONFIG_DIR"
    cat > "$SGPT_CONFIG" << 'SGPTCONF'
OPENAI_API_KEY=your-openai-api-key-here
DEFAULT_MODEL=gpt-4o
OPENAI_API_HOST=https://api.openai.com
REQUEST_TIMEOUT=60
DEFAULT_COLOR=blue
DEFAULT_EXECUTE_SHELL_CMD=false
DISABLE_STREAMING=false
CODE_THEME=dracula
SHELL_INTERACTION=true
PRETTIFY_MARKDOWN=true
OS_NAME=auto
SHELL_NAME=auto
SGPTCONF
    warn "Update $SGPT_CONFIG with your real OpenAI API key"
else
    info "ShellGPT config already exists"
fi

# ---------------------------------------------------------------------------
# 5. Verify installation
# ---------------------------------------------------------------------------
echo ""
info "=== Installation Summary ==="
echo ""
printf "  %-15s %-20s %s\n" "Tool" "Version" "Command"
printf "  %-15s %-20s %s\n" "----------" "----------" "----------"
printf "  %-15s %-20s %s\n" "Claude Code" "$(claude --version 2>/dev/null || echo 'N/A')" "claude"
printf "  %-15s %-20s %s\n" "Gemini CLI" "$(gemini --version 2>/dev/null || echo 'N/A')" "gemini"
printf "  %-15s %-20s %s\n" "ShellGPT" "$(sgpt --version 2>/dev/null || echo 'N/A')" "sgpt \"prompt\""
echo ""
info "Setup complete!"
echo ""
warn "Next steps:"
echo "  1. Add your API keys to $PROFILE"
echo "  2. Run: source $PROFILE"
echo "  3. Update ShellGPT key in $SGPT_CONFIG"
echo "  4. Test: claude --version && gemini --version && sgpt --version"
