# Claude Code & CoWork Standalone MCP Connector

A secure, standalone **Model Context Protocol (MCP)** HTTP connector prototype enabling seamless, auditable communication between **Claude / CoWork** and terminal-based **Claude Code** through an append-only shared message board and read-only sample application context tools.

---

## 1. System Architecture

```
┌─────────────────────────────────┐           ┌───────────────────────────────────┐
│         Claude / CoWork         │           │        Claude Code (CLI)          │
│       (Browser / Desktop)       │           │       (Developer Terminal)        │
└────────────────┬────────────────┘           └─────────────────┬─────────────────┘
                 │                                              │
                 │ JSON-RPC 2.0                                 │ JSON-RPC 2.0
                 │ POST /connect/code/:secret/mcp               │ POST /connect/code/:secret/mcp
                 ▼                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     MCP Gateway & Protocol Engine                               │
│  - URL-based Secret Authentication (SHA-256 Hash Matching)                      │
│  - Sliding Window Rate Limiting (120 calls / 10 min)                            │
│  - JSON-RPC 2.0 & Protocol Version Negotiation ("2024-11-05")                   │
│  - Input Sanitization & Secret Redaction Engine                                 │
└───────────────┬─────────────────────────────┬───────────────────────────┬───────┘
                │                             │                           │
                ▼                             ▼                           ▼
┌───────────────────────────────┐ ┌───────────────────────┐ ┌─────────────────────┐
│    Context Tools (11 Tools)   │ │  Append-Only Board    │ │  Audit Log Engine   │
│ - get_overview, list_files    │ │  - send_message       │ │  - Safe Arguments   │
│ - read_file (Strict sandbox)  │ │  - read_messages      │ │  - Redacted Tokens  │
│ - search_code, recent_changes │ │  - Seen / Read State  │ │  - No Response Body │
│ - data_model, reports, people │ │                       │ │    Storage          │
└───────────────┬───────────────┘ └───────────┬───────────┘ └─────────────┬───────┘
                │                             │                           │
                └───────────────────────┬─────┴───────────────────────────┘
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         Pluggable Storage Layer                                 │
│      FileStorageAdapter (.data/mcp_store.json) / Firebase Firestore Adapter      │
│      - Atomic rename write-queue                                                │
│      - Append-only durability across restarts                                   │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         Admin Management Dashboard                              │
│      - Provision & Revoke URL-Safe 32-Byte Secret Links                         │
│      - Live Interactive Shared Message Board                                    │
│      - Real-Time Tool-Call Audit Log                                            │
│      - Live MCP Protocol Inspector & Automated 17-Point Verification Suite      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. MCP Endpoint & Authentication Pattern

### URL Format
```
POST https://YOUR-HOST/connect/:scope/:secret/mcp
```

- `:scope`: The permission boundary. In this demo, `code` provides read-only sample context and access to the shared board.
- `:secret`: A cryptographically secure, URL-safe random token (at least 32 bytes of entropy).
- **Zero Plaintext Storage**: The server stores only the SHA-256 hash of the secret and a non-secret prefix (e.g., `sec_demo_cl...`).
- **Instant Revocation**: Revoking a link marks `revoked_at` in persistent storage. Any subsequent request immediately receives an uninformative `HTTP 404 Not Found`.

### Supported JSON-RPC 2.0 Methods
1. `initialize`: Protocol version negotiation (`2024-11-05`), server capability advertisement.
2. `ping`: Health verification (`{}`).
3. `tools/list`: Returns JSON schemas for all 13 registered tools.
4. `tools/call`: Executes the requested tool, returns `content: [{ type: "text", text: "..." }]`, and writes an audit record.
5. Notifications (e.g. `notifications/initialized`): Returns `HTTP 202 Accepted` with an empty body.
6. Unknown methods: Returns JSON-RPC error code `-32601`.
7. `GET` and `DELETE` requests to the endpoint return `HTTP 405 Method Not Allowed`.

---

## 3. Registered MCP Tools

### Sample Application Context (Read-Only)
| Tool | Description |
|---|---|
| `get_overview` | High-level summary of mock project, sandbox environment, and git branch. |
| `list_files` | Lists allowlisted files from sample repository. |
| `read_file` | Reads allowlisted file. Strictly blocks `.env`, credentials, private keys, database dumps, and path traversal (`..`). |
| `search_code` | Searches sample repository files and returns line numbers and snippets. |
| `recent_changes` | Returns mock git commits and change summaries. |
| `describe_data_model` | Describes mock database schema without exposing real records or credentials. |
| `list_reports` | Lists predefined demo report names and descriptions. |
| `get_report` | Fetches predefined, non-sensitive demo report metrics. |
| `list_services` | Lists mock application services and architectural tiers. |
| `service_status` | Returns simulated service health (clearly labelled with `is_mock_data: true`). |
| `find_people` | Searches fictional demo profiles (name, email, role, team owner). |

### Shared Message Board
| Tool | Description |
|---|---|
| `send_message` | Appends a message to persistent storage. Takes `text`, `side` (`chat` or `box`), and optional `author`. Never deletes or overwrites existing messages. |
| `read_messages` | Returns chronological messages with pagination cursor `after_id`, `limit`, and records fetch status (`seen_by_box_at` or `fetched_by_chat_at`). |

---

## 4. Claude Code Terminal CLI (`connector_board`)

The demo includes a Node.js CLI tool that communicates with the MCP server exclusively via the MCP HTTP protocol:

### Windows PowerShell Setup
```powershell
# Set your connector URL
$env:MCP_CONNECTOR_URL="http://localhost:3000/connect/code/sec_demo_claude_cowork_connector_initial_key_4432/mcp"

# Read board messages
npx tsx bin/connector_board.ts

# Post a reply
npx tsx bin/connector_board.ts --reply "Feature implemented and verified in sandbox."

# Read all recent messages with limit
npx tsx bin/connector_board.ts --all --limit 20

# View connector overview
npx tsx bin/connector_board.ts --calls 10
```

### Linux / macOS Bash Setup
```bash
# Set your connector URL
export MCP_CONNECTOR_URL="http://localhost:3000/connect/code/sec_demo_claude_cowork_connector_initial_key_4432/mcp"

# Read board messages
npm run cli

# Post a reply
npm run cli -- --reply "Feature implemented and verified in sandbox."
```

---

## 5. Connecting Claude / CoWork (Client Setup)

To connect Claude Desktop or custom MCP clients to this connector:

### Claude Desktop Configuration
In your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "cowork-connector": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://YOUR-APP-URL/connect/code/YOUR_SECRET/mcp"
      ]
    }
  }
}
```

Or when using an MCP client with direct Streamable HTTP support:
- **Server URL**: `https://YOUR-APP-URL/connect/code/YOUR_SECRET/mcp`
- **Transport**: HTTP POST / Streamable HTTP
- **Authentication**: Pre-authenticated in URL path

---

## 6. Automated 17-Point Test Verification

Run the automated test suite verifying all acceptance criteria:

```bash
npm test
```

### Verified Acceptance Criteria:
1. `MCP initialize`: Returns a valid JSON-RPC 2.0 response with negotiated protocol version.
2. `ping`: Succeeds with `{}` result.
3. `tools/list`: Returns all 13 registered tools with valid JSON input schemas.
4. `tools/call`: Successfully invokes every sample context tool.
5. Unknown methods: Return standard error code `-32601`.
6. Invalid, revoked, and wrong-scope URLs: Return HTTP 404.
7. Rate limiting: Enforces 429 when threshold exceeded.
8. Restricted files: Blocks `.env`, `credentials.json`, `dump.sql`.
9. Path traversal: Blocks `../`, `/etc/passwd`.
10. Sensitive values: Tokens and SSN patterns redacted in logs and message bodies.
11. Durability: Board messages persist across storage reloads.
12. Shared Board: Messages sent via MCP appear immediately in board queries.
13. Read/Fetch tracking: Records `seen_by_box_at` and `fetched_by_chat_at`.
14. Audit logs: Recorded for both successful and failed calls.
15. Admin access: Requires valid `x-admin-key`.
16. Frontend privacy: Raw secrets and hashes are never exposed.
17. Overall verification: 17/17 tests pass cleanly.

---

## 7. Storage Adapter & Firebase Migration

The project utilizes a modular `StorageAdapter` pattern defined in `server/storage/storageAdapter.ts`:
- **Current Production-Ready Adapter**: `FileStorageAdapter` writes to `.data/mcp_store.json` using atomic temporary file renames and an asynchronous write-queue.
- **Firebase Firestore Integration**: The interface matches 1-to-1 with Firestore collections (`connector_keys`, `connector_calls`, `connector_messages`, `settings`). To migrate to Firestore, implement `FirestoreStorageAdapter` implementing `StorageAdapter` without altering any MCP business logic.

---

## 8. Known Limitations & Production Transition Steps

This is a standalone demonstration prototype. When integrating into a client's production environment:
1. **Network Ingress**: Ensure the public URL path `/connect/*` is routed through the client's API gateway or load balancer.
2. **Database Engine**: Replace the local file adapter with Cloud SQL (PostgreSQL) or Firestore for multi-instance distributed deployments.
3. **Session Authentication**: Bind Admin Dashboard routes to corporate SSO (e.g., Google Workspace OAuth or Okta) instead of static admin tokens.
4. **Real Repository Adapters**: Replace `mockData.ts` with real read-only GitHub or GitLab repository API integrations.
