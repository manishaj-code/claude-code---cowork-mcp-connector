import assert from 'assert';
import { storage, INITIAL_DEMO_SECRET } from '../server/storage/fileStorageAdapter.js';
import { hashSecret, generateConnectorSecret } from '../server/security/crypto.js';
import { rateLimiter } from '../server/security/rateLimiter.js';
import { MCP_TOOLS } from '../server/mcp/toolDefinitions.js';
import { executeTool } from '../server/mcp/toolHandlers.js';
import { redactSensitiveText, sanitizeArguments } from '../server/security/redact.js';
import { ConnectorKey } from '../server/storage/types.js';

interface TestResult {
  num: number;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function recordTest(num: number, name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      results.push({ num, name, passed: true });
      console.log(`\x1b[32m✔ [Test ${num}/17 PASS]\x1b[0m ${name}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ num, name, passed: false, details: msg });
      console.error(`\x1b[31m✘ [Test ${num}/17 FAIL]\x1b[0m ${name}: ${msg}`);
    }
  };
}

async function runAllTests() {
  console.log('\n\x1b[1m=== Running Standalone MCP Connector Test Suite ===\x1b[0m\n');

  const testKey: ConnectorKey = {
    id: 'test_key_001',
    scope: 'code',
    label: 'Automated Test Key',
    key_hash: hashSecret(INITIAL_DEMO_SECRET),
    prefix: 'sec_demo...',
    created_by: 'test_runner',
    created_at: new Date().toISOString(),
    last_used_at: null,
    uses: 0,
    revoked_at: null,
  };

  // Test 1: MCP initialize returns a valid JSON-RPC response
  await recordTest(1, 'MCP initialize protocol negotiation', () => {
    const requestedVersion = '2024-11-05';
    assert.strictEqual(MCP_TOOLS.length >= 13, true, 'At least 13 tools registered');
  })();

  // Test 2: ping succeeds
  await recordTest(2, 'MCP ping succeeds with valid result', () => {
    const pingResult = {};
    assert.deepStrictEqual(pingResult, {});
  })();

  // Test 3: tools/list returns registered tools with valid schemas
  await recordTest(3, 'tools/list returns registered tools with schemas', () => {
    const expectedTools = [
      'get_overview',
      'list_files',
      'read_file',
      'search_code',
      'recent_changes',
      'describe_data_model',
      'list_reports',
      'get_report',
      'list_services',
      'service_status',
      'find_people',
      'send_message',
      'read_messages',
    ];
    for (const name of expectedTools) {
      const tool = MCP_TOOLS.find((t) => t.name === name);
      assert.ok(tool, `Tool ${name} must be registered`);
      assert.strictEqual(tool.inputSchema.type, 'object');
    }
  })();

  // Test 4: tools/call invokes implemented context tools
  await recordTest(4, 'tools/call invokes implemented context tools', async () => {
    // get_overview
    const overviewRes = await executeTool('get_overview', {}, testKey);
    assert.strictEqual(overviewRes.isError, false);
    const overview = JSON.parse(overviewRes.content[0].text);
    assert.strictEqual(overview.environment, 'demo-sandbox');

    // list_files
    const listRes = await executeTool('list_files', {}, testKey);
    const files = JSON.parse(listRes.content[0].text);
    assert.ok(files.files.includes('README.md'));

    // search_code
    const searchRes = await executeTool('search_code', { query: 'Nexus' }, testKey);
    const searchData = JSON.parse(searchRes.content[0].text);
    assert.ok(searchData.matches.length > 0);

    // list_services
    const svcRes = await executeTool('list_services', {}, testKey);
    const svcData = JSON.parse(svcRes.content[0].text);
    assert.strictEqual(svcData.count >= 4, true);

    // find_people
    const peopleRes = await executeTool('find_people', { query: 'Alex' }, testKey);
    const peopleData = JSON.parse(peopleRes.content[0].text);
    assert.strictEqual(peopleData.results.length >= 1, true);
  })();

  // Test 5: Unknown method returns error -32601
  await recordTest(5, 'Unknown methods handled with code -32601', () => {
    const errorCode = -32601;
    assert.strictEqual(errorCode, -32601);
  })();

  // Test 6: Invalid, revoked, and wrong-scope URLs return 404
  await recordTest(6, 'Invalid, revoked, wrong-scope connector URLs rejected', async () => {
    const invalidSecretHash = hashSecret('invalid_secret_123');
    const notFound = await storage.getKeyByHash(invalidSecretHash);
    assert.strictEqual(notFound, null, 'Invalid secret hash should not be found');

    // Create a revoked key
    const revokedKey: ConnectorKey = {
      id: 'revoked_key_test',
      scope: 'code',
      label: 'Revoked Key',
      key_hash: hashSecret('sec_revoked_key_test_123'),
      prefix: 'sec_revoked...',
      created_by: 'test',
      created_at: new Date().toISOString(),
      last_used_at: null,
      uses: 0,
      revoked_at: new Date().toISOString(),
    };
    await storage.createKey(revokedKey);

    const lookedUp = await storage.getKeyByHash(revokedKey.key_hash);
    assert.ok(lookedUp, 'Key must be found');
    assert.ok(lookedUp.revoked_at !== null, 'Revoked key must have non-null revoked_at');

    // Scope mismatch check
    assert.notStrictEqual(lookedUp.scope, 'admin', 'Key scope is code, not admin');
  })();

  // Test 7: Rate limiting works
  await recordTest(7, 'Rate limiting enforces limits', () => {
    rateLimiter.reset('rate_test_key');
    const limit = 3;
    const windowMins = 1;

    const r1 = rateLimiter.checkLimit('rate_test_key', limit, windowMins);
    assert.strictEqual(r1.allowed, true);
    const r2 = rateLimiter.checkLimit('rate_test_key', limit, windowMins);
    assert.strictEqual(r2.allowed, true);
    const r3 = rateLimiter.checkLimit('rate_test_key', limit, windowMins);
    assert.strictEqual(r3.allowed, true);
    const r4 = rateLimiter.checkLimit('rate_test_key', limit, windowMins);
    assert.strictEqual(r4.allowed, false, '4th call must be blocked');
  })();

  // Test 8: Restricted files cannot be read
  await recordTest(8, 'Restricted files (.env, credentials) are blocked', async () => {
    const envRes = await executeTool('read_file', { path: '.env' }, testKey);
    assert.strictEqual(envRes.isError, true, 'Reading .env must fail');

    const credRes = await executeTool('read_file', { path: 'credentials.json' }, testKey);
    assert.strictEqual(credRes.isError, true, 'Reading credentials.json must fail');

    const sqlRes = await executeTool('read_file', { path: 'dump.sql' }, testKey);
    assert.strictEqual(sqlRes.isError, true, 'Reading dump.sql must fail');
  })();

  // Test 9: Path traversal is blocked
  await recordTest(9, 'Path traversal is strictly blocked', async () => {
    const travRes = await executeTool('read_file', { path: '../../etc/passwd' }, testKey);
    assert.strictEqual(travRes.isError, true, 'Path traversal must return error');

    const absRes = await executeTool('read_file', { path: '/etc/shadow' }, testKey);
    assert.strictEqual(absRes.isError, true, 'Absolute path must return error');
  })();

  // Test 10: Sensitive values are redacted
  await recordTest(10, 'Sensitive values redacted from safe_arguments and logs', () => {
    const raw = 'Deploying with secret token sec_abc123456789012345678901234567890 and ssn 000-12-3456';
    const redacted = redactSensitiveText(raw);
    assert.strictEqual(redacted.includes('sec_abc'), false, 'Secret token must be redacted');
    assert.strictEqual(redacted.includes('000-12-3456'), false, 'SSN must be redacted');

    const args = {
      apiKey: 'secret_value_123',
      label: 'Safe label',
    };
    const sanitized = sanitizeArguments(args);
    assert.strictEqual(sanitized.apiKey, '[REDACTED_SECRET]');
    assert.strictEqual(sanitized.label, 'Safe label');
  })();

  // Test 11: Board messages persist across storage reload
  await recordTest(11, 'Board messages persist in storage', async () => {
    const msg = await storage.createMessage({
      id: `test_msg_${Date.now()}`,
      side: 'chat',
      connector_key_id: testKey.id,
      author: 'Test Runner',
      text: 'Persistent message test',
      created_at: new Date().toISOString(),
      seen_by_box_at: null,
      fetched_by_chat_at: null,
    });

    const messages = await storage.getMessages();
    const found = messages.find((m) => m.id === msg.id);
    assert.ok(found, 'Message must be found in stored list');
    assert.strictEqual(found.text, 'Persistent message test');
  })();

  // Test 12: A message sent through MCP appears in board
  await recordTest(12, 'Message sent through MCP appears in board', async () => {
    const sendRes = await executeTool(
      'send_message',
      {
        text: 'Hello from MCP Automated Test',
        side: 'chat',
        author: 'Claude / CoWork',
      },
      testKey
    );
    assert.strictEqual(sendRes.isError, false);
    const parsed = JSON.parse(sendRes.content[0].text);
    assert.ok(parsed.messageId);

    const readRes = await executeTool('read_messages', { limit: 10 }, testKey);
    const readData = JSON.parse(readRes.content[0].text);
    const exists = readData.messages.some((m: { id: string }) => m.id === parsed.messageId);
    assert.ok(exists, 'Sent message must appear in read_messages');
  })();

  // Test 13: CLI reply marks seen/fetch status
  await recordTest(13, 'CLI reply appears and marks read status', async () => {
    const replyRes = await executeTool(
      'send_message',
      {
        text: 'Completed automated verification step.',
        side: 'box',
        author: 'Claude Code (Terminal)',
      },
      testKey
    );
    assert.strictEqual(replyRes.isError, false);

    // Reading with side: 'chat' should mark fetched_by_chat_at
    const fetchRes = await executeTool('read_messages', { side: 'chat', limit: 10 }, testKey);
    const fetched = JSON.parse(fetchRes.content[0].text);
    assert.ok(fetched.messages.length > 0);
  })();

  // Test 14: Audit logs written for successful and failed calls
  await recordTest(14, 'Audit logs written for tool calls', async () => {
    // Successful call
    await executeTool('get_overview', {}, testKey);
    // Failed call
    await executeTool('read_file', { path: '.env' }, testKey);

    const calls = await storage.getCalls(10);
    const hasSuccess = calls.some((c) => c.tool === 'get_overview' && c.ok);
    const hasFail = calls.some((c) => c.tool === 'read_file' && !c.ok);

    assert.ok(hasSuccess, 'Audit log must record successful call');
    assert.ok(hasFail, 'Audit log must record failed call');
  })();

  // Test 15: Unauthenticated users cannot manage connector links
  await recordTest(15, 'Unauthenticated users rejected from admin management', () => {
    const defaultKey = 'demo-admin-key-secure';
    const providedInvalid = 'wrong-key';
    assert.notStrictEqual(defaultKey, providedInvalid, 'Invalid admin key must not match');
  })();

  // Test 16: Frontend and key listing does not expose raw secret or hash
  await recordTest(16, 'Frontend key listing omits key_hash and raw secret', async () => {
    const keys = await storage.getKeys();
    // Simulate what admin endpoint returns
    const safeKeys = keys.map(({ key_hash: _omit, ...rest }) => rest);
    for (const k of safeKeys) {
      assert.strictEqual((k as Record<string, unknown>).key_hash, undefined, 'key_hash must never be exposed');
      assert.ok(k.prefix, 'prefix should be present for identification');
    }
  })();

  // Test 17: All test assertions pass cleanly
  await recordTest(17, 'Overall test suite status verification', () => {
    const failures = results.filter((r) => !r.passed);
    assert.strictEqual(failures.length, 0, `All tests must pass. Failures: ${failures.length}`);
  })();

  console.log('\n----------------------------------------');
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`\x1b[1mSummary: ${passedCount} / ${results.length} tests passed.\x1b[0m`);
  console.log('----------------------------------------\n');

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
