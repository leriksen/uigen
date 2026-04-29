#!/bin/bash
# Claude Code v2.1.116+ hardcodes `npm exec @playwright/mcp@latest` and ignores
# MCP config browser flags. This wrapper intercepts the .bin entry to force Firefox.
BIN="node_modules/.bin/playwright-mcp"
CLI="node_modules/@playwright/mcp/cli.js"

if [ ! -f "$CLI" ]; then
  echo "patch-playwright-mcp: @playwright/mcp not installed, skipping"
  exit 0
fi

cat > "$BIN" << 'EOF'
#!/bin/bash
exec node "$(dirname "$0")/../@playwright/mcp/cli.js" --browser firefox "$@"
EOF
chmod +x "$BIN"
echo "patch-playwright-mcp: patched $BIN to force Firefox"
