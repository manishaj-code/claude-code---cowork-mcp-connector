import { Router, Request, Response } from 'express';
import { hashSecret } from '../security/crypto.js';
import { rateLimiter } from '../security/rateLimiter.js';
import { storage } from '../storage/fileStorageAdapter.js';
import { MCP_TOOLS } from './toolDefinitions.js';
import { executeTool } from './toolHandlers.js';
import {
  JsonRpcRequest,
  JsonRpcResponse,
  JSON_RPC_ERRORS,
  LATEST_MCP_PROTOCOL_VERSION,
  SUPPORTED_MCP_PROTOCOL_VERSIONS,
} from './protocol.js';

export const mcpRouter = Router();

// Handle Method Not Allowed for GET and DELETE on the MCP endpoint
mcpRouter.all('/connect/:scope/:secret/mcp', (req: Request, res: Response, next) => {
  if (req.method === 'GET' || req.method === 'DELETE') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({
      error: 'Method Not Allowed. MCP endpoint accepts only POST requests.',
    });
    return;
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({
      error: 'Method Not Allowed.',
    });
    return;
  }
  next();
});

// Primary MCP HTTP endpoint
mcpRouter.post('/connect/:scope/:secret/mcp', async (req: Request, res: Response) => {
  const { scope, secret } = req.params;

  // 1. Authenticate URL secret
  if (!secret || typeof secret !== 'string' || !scope) {
    res.status(404).send('Not Found');
    return;
  }

  const secretHash = hashSecret(secret);
  const key = await storage.getKeyByHash(secretHash);

  // Return plain 404 for invalid, revoked, or wrong-scope secret
  if (!key || key.revoked_at !== null || key.scope !== scope) {
    res.status(404).send('Not Found');
    return;
  }

  // 2. Check global connector status
  const settings = await storage.getSettings();
  if (!settings.connector_enabled) {
    res.status(404).send('Not Found');
    return;
  }

  // 3. Rate limiting check
  const rateCheck = rateLimiter.checkLimit(
    key.id,
    settings.rate_limit_per_window,
    settings.rate_window_minutes
  );

  res.setHeader('X-RateLimit-Limit', settings.rate_limit_per_window.toString());
  res.setHeader('X-RateLimit-Remaining', rateCheck.remaining.toString());

  if (!rateCheck.allowed) {
    res.setHeader('Retry-After', rateCheck.resetInSeconds.toString());
    res.status(429).json({
      error: `Rate limit exceeded. Maximum ${settings.rate_limit_per_window} calls per ${settings.rate_window_minutes} minutes. Please retry in ${rateCheck.resetInSeconds}s.`,
    });
    return;
  }

  // 4. Validate JSON-RPC format
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    const errorResponse: JsonRpcResponse = {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: JSON_RPC_ERRORS.PARSE_ERROR,
        message: 'Parse error: Request body must be a valid JSON object',
      },
    };
    res.status(400).json(errorResponse);
    return;
  }

  const rpcReq = body as JsonRpcRequest;

  // JSON-RPC specification checks
  if (rpcReq.jsonrpc !== '2.0' || typeof rpcReq.method !== 'string') {
    const errorResponse: JsonRpcResponse = {
      jsonrpc: '2.0',
      id: rpcReq.id ?? null,
      error: {
        code: JSON_RPC_ERRORS.INVALID_REQUEST,
        message: 'Invalid Request: jsonrpc must be "2.0" and method must be a string',
      },
    };
    res.status(400).json(errorResponse);
    return;
  }

  const id = rpcReq.id;

  // 5. Notification handling (Request without an id is a notification)
  const isNotification = id === undefined;
  if (isNotification) {
    // If notification is notifications/initialized, acknowledge silently
    res.status(202).send();
    return;
  }

  // 6. Handle supported MCP methods
  switch (rpcReq.method) {
    case 'initialize': {
      const clientVersion = (rpcReq.params?.protocolVersion as string) || '';
      const negotiatedVersion = SUPPORTED_MCP_PROTOCOL_VERSIONS.includes(clientVersion)
        ? clientVersion
        : LATEST_MCP_PROTOCOL_VERSION;

      const response: JsonRpcResponse = {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: negotiatedVersion,
          capabilities: {
            tools: {
              listChanged: false,
            },
          },
          serverInfo: {
            name: 'claude-code-cowork-connector',
            version: '1.0.0',
          },
          instructions:
            'You are connected to the Nexus Fleet Manager Demo MCP Connector. You have access to sample context tools and a shared message board for communicating with Claude Code.',
        },
      };
      res.json(response);
      return;
    }

    case 'ping': {
      const response: JsonRpcResponse = {
        jsonrpc: '2.0',
        id,
        result: {},
      };
      res.json(response);
      return;
    }

    case 'tools/list': {
      const response: JsonRpcResponse = {
        jsonrpc: '2.0',
        id,
        result: {
          tools: MCP_TOOLS,
        },
      };
      res.json(response);
      return;
    }

    case 'tools/call': {
      const params = rpcReq.params;
      const toolName = params?.name as string;
      const toolArgs = (params?.arguments as Record<string, unknown>) || {};

      if (!toolName || typeof toolName !== 'string') {
        const errorResponse: JsonRpcResponse = {
          jsonrpc: '2.0',
          id,
          error: {
            code: JSON_RPC_ERRORS.INVALID_PARAMS,
            message: "Invalid params: 'name' is required for tools/call",
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const toolDef = MCP_TOOLS.find((t) => t.name === toolName);
      if (!toolDef) {
        const errorResponse: JsonRpcResponse = {
          jsonrpc: '2.0',
          id,
          error: {
            code: JSON_RPC_ERRORS.INVALID_PARAMS,
            message: `Tool '${toolName}' not found in registered tools`,
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      try {
        const toolResult = await executeTool(toolName, toolArgs, key);
        const response: JsonRpcResponse = {
          jsonrpc: '2.0',
          id,
          result: toolResult,
        };
        res.json(response);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const errorResponse: JsonRpcResponse = {
          jsonrpc: '2.0',
          id,
          error: {
            code: JSON_RPC_ERRORS.INTERNAL_ERROR,
            message: `Internal tool execution error: ${errMsg}`,
          },
        };
        res.status(500).json(errorResponse);
      }
      return;
    }

    default: {
      // Return -32601 for unsupported methods
      const errorResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id,
        error: {
          code: JSON_RPC_ERRORS.METHOD_NOT_FOUND,
          message: `Method '${rpcReq.method}' not found or not supported.`,
        },
      };
      res.status(200).json(errorResponse);
      return;
    }
  }
});
