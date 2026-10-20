# MCP Connector: how it works and how to test it

This project has two parts that work together:

1. **MCP endpoint** — receives JSON-RPC requests from an MCP client or the Inspector, checks the connector URL secret, runs a tool, and returns JSON.
2. **Web dashboard** — lets an administrator inspect status, create connector links, see tool-call logs and board messages, change settings, and send MCP requests using the Inspector.

The sample project and service data returned by tools are mock/demo data. The shared board is persisted in the local store under `.data`.

## One request, end to end

```text
MCP client (or Inspector)
  | HTTP POST with JSON-RPC 2.0 body
  v
/connect/{scope}/{secret}/mcp
  | check secret hash, scope, revoked status, connector enabled, rate limit
  | dispatch method (initialize, tools/list, tools/call, ...)
  v
Tool handler -> sample data or shared board -> audit record + usage update
  |
  v
HTTP JSON response -> client displays/uses result
```

The usual MCP conversation is:

1. `initialize` — agree on protocol version and discover server capabilities.
2. `notifications/initialized` — client signals it is ready. This notification has no `id`; this implementation acknowledges it with HTTP `202` and an empty body.
3. `tools/list` — get available tool names and input schemas.
4. `tools/call` — invoke one tool. The returned data is placed in `result.content[0].text` as a JSON string.

This endpoint is stateless: every request is a separate HTTP `POST`; there is no persistent HTTP session to keep open. `GET` and `DELETE` are not supported on the MCP URL.

## Start the app

From the project directory, in PowerShell:

```powershell
npm run dev
```

Open `http://localhost:3000`. The server hosts the dashboard and the MCP endpoint on the same port. A quick server check is:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

Expected result includes `status: "ok"` and `service: "mcp-connector"`.

## What the dashboard screens do

The left sidebar has these sections:

- **Overview** — summary counts and connector status.
- **Shared Board** — shows messages from both sides; the form posts a message through the admin API. The board refreshes with the dashboard data poll (every 15 seconds) or when refreshed.
- **Connector Links** — lists links and lets you create or revoke one. A new link shows its full URL once; copy/save it then. It contains the bearer secret in its path.
- **Tool Audit Log** — shows recorded MCP tool calls, their safe arguments, outcome, and time.
- **MCP Inspector** — builds a JSON-RPC request, sends it as HTTP `POST` to the live MCP endpoint, and shows the HTTP status, duration, and JSON response.
- **Demo Environment** — describes the simulated environment.
- **Settings & Health** — connector enabled state, rate limit, process health, and storage adapter.

The dashboard calls `/api/admin/...` endpoints and authenticates using the `x-admin-key` header. In this demo the frontend has a built-in default admin key; if the app reports an admin authentication error, use **Configure Admin Key** to enter the value configured for the server. MCP clients do not use this admin key: they authenticate with the secret embedded in their connector URL.

## Fastest hands-on test: the Inspector

1. Start the app and open `http://localhost:3000`.
2. In the sidebar, open **MCP Inspector**.
3. The initial demo link is prefilled (`scope` is `code`). For a separate link, use **Connector Links** to create one, then copy its URL and put its scope and secret into the Inspector.
4. Select **tool: get_overview**, then click **Send MCP Request**.
5. A successful call should show HTTP `200`; in the response find `result.content[0].text`. It contains JSON with `projectName`, `environment: "demo-sandbox"`, and `is_mock_environment: true`.
6. Select **tools/list** and send it to inspect all registered tools and their schemas.
7. Select **tool: read_file (Blocked .env)** to confirm a protected file read is rejected as a tool result with `isError: true`.

Every successful or failed tool execution is recorded in **Tool Audit Log** (authentication failures happen before tool execution and do not create a tool-call record). After a tool call, the Inspector refreshes dashboard data.

## Direct HTTP example: POST a query and read the response

The MCP URL has this form:

```text
http://localhost:3000/connect/{scope}/{secret}/mcp
```

Use the full URL shown by **Connector Links**. The repository also seeds an initial local demo link, and the README displays that URL. Treat any real connector secret as a password: do not publish it or commit it to source control. In the examples below, replace the placeholder with your own URL.

### 1. Ask the server for its overview

PowerShell:

```powershell
$mcpUrl = "http://localhost:3000/connect/code/YOUR_SECRET/mcp"
$body = @{
  jsonrpc = "2.0"
  id = 1
  method = "tools/call"
  params = @{
    name = "get_overview"
    arguments = @{}
  }
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Method Post -Uri $mcpUrl `
  -ContentType "application/json" -Body $body
$response | ConvertTo-Json -Depth 10
```

The response shape is approximately:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"projectName\": \"Nexus Fleet Manager Prototype\", ... }"
      }
    ],
    "isError": false
  }
}
```

`text` is a string containing serialized JSON. To view that inner JSON as an object:

```powershell
$overview = $response.result.content[0].text | ConvertFrom-Json
$overview
```

### 2. Discover tools

Send a `POST` with this body to the same URL:

```json
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
```

The result has `result.tools`, containing tool names, descriptions, and schemas. There are 13 tools, including `get_overview`, `list_files`, `read_file`, `search_code`, `list_reports`, `send_message`, and `read_messages`.

### 3. Query sample data

For example, call `search_code` with:

```json
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_code","arguments":{"query":"Nexus"}}}
```

Read `result.content[0].text` in the response to see the match count and snippets. For a tool requiring a field, pass it under `params.arguments`; for example, `read_file` needs `{"path":"README.md"}`. File access is restricted to allowlisted sample files.

## Shared-board round-trip example

The board demonstrates how CoWork/chat and Claude Code can pass messages through the connector.

### Post a message as chat

Send this JSON-RPC body to the MCP URL:

```json
{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"send_message","arguments":{"text":"Please check the demo service status.","side":"chat","author":"CoWork test"}}}
```

The result text reports `success`, a generated `messageId`, the timestamp, side, author, and message. The handler trims the text, limits it to 2,000 characters, and redacts recognized sensitive values before saving.

### Read it as Claude Code

Call `read_messages`:

```json
{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"read_messages","arguments":{"limit":10,"side":"box"}}}
```

The message appears in `result.content[0].text` under `messages`. Reading with `side: "box"` updates the board's fetch/seen tracking for that side. Alternatively, from **Shared Board**, submit a message and refresh the page to see it.

You can also exercise the CLI from PowerShell by setting `MCP_CONNECTOR_URL` to the connector URL:

```powershell
$env:MCP_CONNECTOR_URL = "http://localhost:3000/connect/code/YOUR_SECRET/mcp"
npm run cli
npm run cli -- --reply "I checked the demo service status."
npm run cli -- --calls 10
```

The CLI reads board messages by default, posts with `--reply`, and `--calls` asks for the overview. Its source calls the same MCP URL with JSON-RPC `tools/call` requests.

## Test with remote CoWork when `localhost` is unreachable

`localhost` always means “this computer.” If CoWork is running in a hosted environment, its `localhost` is a different computer, so it cannot reach your PC at `http://localhost:3000`. For a development test, expose the running app through a temporary HTTPS tunnel, then use that public address in the MCP client configuration.

One option is Cloudflare Quick Tunnel. Keep the app running in the first terminal:

```powershell
npm run dev
```

In a second terminal, start a tunnel to port 3000 (install `cloudflared` first):

```powershell
cloudflared tunnel --url http://localhost:3000
```

The command prints a temporary public address such as `https://some-words.trycloudflare.com`. Keep this terminal open while testing. The MCP URL to configure in CoWork is the printed address plus the connector path, for example:

```text
https://some-words.trycloudflare.com/connect/code/YOUR_SECRET/mcp
```

Use the actual URL from **Connector Links** (or the seeded local demo URL with its host replaced by the tunnel host). Keep the `/connect/.../mcp` path intact. The dashboard can be opened remotely at the tunnel's base address too, but for this test you can leave it open locally.

### Verify messages travel in both directions

1. Configure CoWork with the public MCP URL above. Ask it to call `send_message` with `side: "chat"`, for example text `Message from hosted CoWork test`.
2. Check the local dashboard's **Shared Board**. The CoWork message should appear there. Or, in PowerShell, point the CLI at the tunnel URL and read it:

   ```powershell
   $env:MCP_CONNECTOR_URL = "https://some-words.trycloudflare.com/connect/code/YOUR_SECRET/mcp"
   npm run cli
   ```

3. Post a reply from Claude Code:

   ```powershell
   npm run cli -- --reply "Reply from Claude Code test"
   ```

4. Ask CoWork to call `read_messages` with `side: "chat"`. It should see the Claude Code reply. The UI board should also show it after refresh (or its next 15-second poll).

The tunnel URL changes when the Quick Tunnel is restarted, so update CoWork's MCP URL if that happens. Anyone who has the URL and connector secret can reach the exposed demo app; use this only for testing with demo data, and revoke a test connector link when finished. Quick Tunnels are intended for development and have no uptime guarantee. [Cloudflare Quick Tunnel documentation](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/)

If CoWork cannot connect even with the public URL, first confirm the local `/api/health` works, the tunnel process is still running, the connector scope and secret match the URL, and **Settings & Health** shows the connector enabled. A `404` from the MCP endpoint usually means the key is invalid/revoked, the scope is wrong, or the connector is disabled.

## Common responses when testing

| Result | Meaning |
|---|---|
| HTTP `200` with `result` | Request reached the server. A tool failure may still have `result.isError: true`; inspect the text inside `content[0].text`. |
| HTTP `404` plain text | Secret is invalid/revoked, scope does not match the URL, or connector is disabled. |
| HTTP `405` | Wrong HTTP method; use `POST` for MCP. |
| HTTP `429` | That key exceeded the configured request rate; response includes retry information. |
| JSON-RPC error `-32601` | Unsupported method name. |
| JSON-RPC error `-32602` | Invalid tool parameters or unknown tool. |

The endpoint rate-limits requests per connector key. The Inspector shows HTTP status and response body, while the dashboard Settings and Health page shows the configured limit and window.

## Useful source files

- `server.ts` — starts Express, mounts MCP/admin APIs, and serves the UI.
- `server/mcp/mcpRouter.ts` — URL authentication, rate checks, JSON-RPC dispatch, response construction.
- `server/mcp/toolDefinitions.ts` — names, descriptions, and input schemas for the tools.
- `server/mcp/toolHandlers.ts` — tool behavior, board persistence, audit logging, and key usage updates.
- `src/views/McpInspectorView.tsx` — Inspector presets and request/response UI.
- `src/App.tsx` and `src/api.ts` — dashboard navigation, periodic refresh, and admin API calls.
- `bin/connector_board.ts` — command-line shared-board client.
- `test/mcp_suite.test.ts` — automated protocol and functionality checks (`npm test`).
