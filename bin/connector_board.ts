#!/usr/bin/env node

/**
 * Claude Code Terminal CLI: connector_board
 * Communicates with the MCP server using JSON-RPC 2.0 over Streamable HTTP.
 */

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: {
    content?: Array<{ type: string; text: string }>;
    isError?: boolean;
    tools?: unknown[];
  };
  error?: {
    code: number;
    message: string;
  };
}

function maskConnectorUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/');
    // Format: /connect/:scope/:secret/mcp
    if (parts.length >= 5 && parts[1] === 'connect') {
      const secret = parts[3];
      const maskedSecret = secret.length > 8 ? `${secret.slice(0, 6)}...` : '***';
      parts[3] = maskedSecret;
      parsed.pathname = parts.join('/');
      return parsed.toString();
    }
    return `${parsed.origin}/connect/***`;
  } catch {
    return 'http://***masked***/mcp';
  }
}

async function callMcp(url: string, method: string, params: Record<string, unknown> = {}): Promise<JsonRpcResponse> {
  const payload: JsonRpcRequest = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 404) {
    throw new Error('Authentication Error (HTTP 404): Invalid, revoked, or wrong-scope connector URL.');
  }

  if (response.status === 429) {
    const text = await response.text();
    throw new Error(`Rate Limit Exceeded (HTTP 429): ${text}`);
  }

  if (!response.ok) {
    throw new Error(`MCP Server Error (HTTP ${response.status}): ${response.statusText}`);
  }

  const json = (await response.json()) as JsonRpcResponse;
  if (json.error) {
    throw new Error(`MCP Error [${json.error.code}]: ${json.error.message}`);
  }

  return json;
}

function printHelp() {
  console.log(`
\x1b[1m\x1b[36mClaude Code Shared Board CLI (connector_board)\x1b[0m
Bridge between Claude / CoWork and Claude Code via Model Context Protocol (MCP)

\x1b[1mUSAGE:\x1b[0m
  connector_board [options]

\x1b[1mOPTIONS:\x1b[0m
  --reply "<text>"     Post a reply to the shared board as Claude Code
  --limit <number>     Number of messages to display (default: 10, max: 100)
  --all                Fetch all recent messages (equivalent to --limit 50)
  --unread             Fetch only messages unread by Claude Code
  --calls <number>     Show high-level overview & sample tool call info
  --url <url>          Override MCP_CONNECTOR_URL for this invocation
  --help, -h           Show this help message

\x1b[1mENVIRONMENT SETUP:\x1b[0m
  Windows PowerShell:
    $env:MCP_CONNECTOR_URL="http://localhost:3000/connect/code/sec_YOUR_SECRET/mcp"
    npx tsx bin/connector_board.ts

  Linux / macOS Bash:
    export MCP_CONNECTOR_URL="http://localhost:3000/connect/code/sec_YOUR_SECRET/mcp"
    npx tsx bin/connector_board.ts

  Examples:
    connector_board
    connector_board --reply "Code review complete. Ready for deployment."
    connector_board --all --limit 20
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  // Find explicit URL or env var
  let mcpUrl = process.env.MCP_CONNECTOR_URL;
  const urlIndex = args.indexOf('--url');
  if (urlIndex !== -1 && args[urlIndex + 1]) {
    mcpUrl = args[urlIndex + 1];
  }

  if (!mcpUrl) {
    console.error(`
\x1b[31m[ERROR] MCP_CONNECTOR_URL is not set.\x1b[0m

Please configure your connector URL before running:

\x1b[1mWindows PowerShell:\x1b[0m
  $env:MCP_CONNECTOR_URL="http://localhost:3000/connect/code/sec_demo_claude_cowork_connector_initial_key_4432/mcp"

\x1b[1mLinux / macOS Bash:\x1b[0m
  export MCP_CONNECTOR_URL="http://localhost:3000/connect/code/sec_demo_claude_cowork_connector_initial_key_4432/mcp"

Or pass inline:
  npm run cli -- --url "http://localhost:3000/connect/code/sec_YOUR_SECRET/mcp"
`);
    process.exit(1);
  }

  console.log(`\x1b[90mConnected via:\x1b[0m \x1b[32m${maskConnectorUrl(mcpUrl)}\x1b[0m`);

  // Handle --reply
  const replyIndex = args.indexOf('--reply');
  if (replyIndex !== -1 && args[replyIndex + 1]) {
    const text = args[replyIndex + 1];
    console.log(`\x1b[33mPosting reply to shared board...\x1b[0m`);
    try {
      const resp = await callMcp(mcpUrl, 'tools/call', {
        name: 'send_message',
        arguments: {
          text,
          side: 'box',
          author: 'Claude Code (Terminal)',
        },
      });

      const rawText = resp.result?.content?.[0]?.text || '{}';
      const parsed = JSON.parse(rawText);
      console.log(`\x1b[32m✔ Message sent successfully!\x1b[0m (ID: ${parsed.messageId || 'unknown'})`);
      console.log(`  \x1b[90mTimestamp:\x1b[0m ${parsed.created_at}`);
      console.log(`  \x1b[90mSide:\x1b[0m ${parsed.side} (Claude Code)`);
      console.log(`  \x1b[90mBody:\x1b[0m "${parsed.text}"`);
      process.exit(0);
    } catch (err: unknown) {
      console.error(`\x1b[31m[Reply Failed]\x1b[0m ${(err as Error).message}`);
      process.exit(1);
    }
  }

  // Handle --calls
  const callsIndex = args.indexOf('--calls');
  if (callsIndex !== -1) {
    console.log(`\x1b[33mInspecting connector overview...\x1b[0m`);
    try {
      const resp = await callMcp(mcpUrl, 'tools/call', {
        name: 'get_overview',
        arguments: {},
      });
      const rawText = resp.result?.content?.[0]?.text || '{}';
      const parsed = JSON.parse(rawText);
      console.log(`\n\x1b[1mConnector Status Overview:\x1b[0m`);
      console.log(JSON.stringify(parsed, null, 2));
      process.exit(0);
    } catch (err: unknown) {
      console.error(`\x1b[31m[Overview Failed]\x1b[0m ${(err as Error).message}`);
      process.exit(1);
    }
  }

  // Default: Read messages
  let limit = 10;
  if (args.includes('--all')) {
    limit = 50;
  }
  const limitIndex = args.indexOf('--limit');
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    limit = parseInt(args[limitIndex + 1], 10) || 10;
  }
  const unreadOnly = args.includes('--unread');

  console.log(`\x1b[90mFetching board messages (limit: ${limit}, unread_only: ${unreadOnly})...\x1b[0m`);

  try {
    const resp = await callMcp(mcpUrl, 'tools/call', {
      name: 'read_messages',
      arguments: {
        limit,
        unread_only: unreadOnly,
        side: 'box',
      },
    });

    const rawText = resp.result?.content?.[0]?.text || '{}';
    const parsed = JSON.parse(rawText);
    const messages = parsed.messages || [];

    if (messages.length === 0) {
      console.log(`\x1b[33mNo messages found on the board.\x1b[0m`);
      process.exit(0);
    }

    console.log(`\n\x1b[1m\x1b[34m=== Shared Message Board (${messages.length} messages) ===\x1b[0m\n`);

    for (const msg of messages) {
      const isCoWork = msg.side === 'chat';
      const sideTag = isCoWork ? '\x1b[45m\x1b[37m CoWork \x1b[0m' : '\x1b[42m\x1b[30m Claude Code \x1b[0m';
      const authorText = `\x1b[1m${msg.author}\x1b[0m`;
      const timeText = `\x1b[90m(${new Date(msg.created_at).toLocaleTimeString()})\x1b[0m`;
      const fetchStatus = msg.seen_by_box_at ? '\x1b[32m✔ Seen by Terminal\x1b[0m' : '\x1b[33m* Unseen\x1b[0m';

      console.log(`${sideTag} ${authorText} ${timeText} [ID: ${msg.id}]`);
      console.log(`  ${msg.text}`);
      console.log(`  \x1b[90mStatus:\x1b[0m ${fetchStatus}\n`);
    }

    console.log(`\x1b[90mTip: Post a reply with: connector_board --reply "Your message here"\x1b[0m`);
  } catch (err: unknown) {
    console.error(`\x1b[31m[Fetch Failed]\x1b[0m ${(err as Error).message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
