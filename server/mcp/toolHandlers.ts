import { McpToolCallResult } from './protocol.js';
import { ConnectorKey, ConnectorMessage } from '../storage/types.js';
import { storage } from '../storage/fileStorageAdapter.js';
import { sanitizeArguments, redactSensitiveText } from '../security/redact.js';
import { generateId } from '../security/crypto.js';
import {
  readSampleFile,
  listSampleFiles,
  searchSampleCode,
  getRecentChanges,
  getMockDataModel,
  getSampleReportsList,
  getSampleReportData,
  getSampleServicesList,
  getSampleServiceStatus,
  searchMockPeople,
} from '../sampleRepo/mockData.js';

export async function executeTool(
  toolName: string,
  args: Record<string, unknown> = {},
  connectorKey: ConnectorKey
): Promise<McpToolCallResult> {
  const callId = generateId();
  const safeArgs = sanitizeArguments(args);
  let ok = true;
  let errorMessage: string | undefined;
  let resultData: unknown = null;

  try {
    switch (toolName) {
      // 1. get_overview
      case 'get_overview': {
        resultData = {
          projectName: 'Nexus Fleet Manager Prototype',
          description: 'Demonstration microservices and telemetry platform for Claude Code and CoWork.',
          environment: 'demo-sandbox',
          branch: 'main',
          status: 'active',
          connectorScope: connectorKey.scope,
          connectedAt: new Date().toISOString(),
          is_mock_environment: true,
        };
        break;
      }

      // 2. list_files
      case 'list_files': {
        const files = listSampleFiles();
        resultData = {
          repository: 'nexus-fleet-sample',
          files,
          total: files.length,
          note: 'Only allowlisted sample files are visible.',
        };
        break;
      }

      // 3. read_file
      case 'read_file': {
        const filePath = typeof args.path === 'string' ? args.path : '';
        if (!filePath) {
          throw new Error("Missing required argument 'path'");
        }
        const fileResult = readSampleFile(filePath);
        if (!fileResult.ok) {
          throw new Error(fileResult.error || 'Failed to read file');
        }
        resultData = {
          path: filePath,
          content: fileResult.content,
        };
        break;
      }

      // 4. search_code
      case 'search_code': {
        const query = typeof args.query === 'string' ? args.query : '';
        if (!query) {
          throw new Error("Missing required argument 'query'");
        }
        const matches = searchSampleCode(query);
        resultData = {
          query,
          matchCount: matches.length,
          matches,
        };
        break;
      }

      // 5. recent_changes
      case 'recent_changes': {
        const changes = getRecentChanges();
        resultData = {
          branch: 'main',
          totalCommits: changes.length,
          commits: changes,
        };
        break;
      }

      // 6. describe_data_model
      case 'describe_data_model': {
        resultData = getMockDataModel();
        break;
      }

      // 7. list_reports
      case 'list_reports': {
        const reports = getSampleReportsList();
        resultData = {
          reports,
          count: reports.length,
        };
        break;
      }

      // 8. get_report
      case 'get_report': {
        const reportId = typeof args.report_id === 'string' ? args.report_id : '';
        if (!reportId) {
          throw new Error("Missing required argument 'report_id'");
        }
        const reportRes = getSampleReportData(reportId);
        if (!reportRes.ok) {
          throw new Error(reportRes.error || 'Report not found');
        }
        resultData = reportRes.report;
        break;
      }

      // 9. list_services
      case 'list_services': {
        const services = getSampleServicesList();
        resultData = {
          services,
          count: services.length,
          environment: 'demo-sandbox',
        };
        break;
      }

      // 10. service_status
      case 'service_status': {
        const serviceId = typeof args.service_id === 'string' ? args.service_id : undefined;
        resultData = getSampleServiceStatus(serviceId);
        break;
      }

      // 11. find_people
      case 'find_people': {
        const query = typeof args.query === 'string' ? args.query : undefined;
        const people = searchMockPeople(query);
        resultData = {
          query: query || null,
          results: people,
          count: people.length,
          disclaimer: 'Fictional demo profiles. No real personal records.',
        };
        break;
      }

      // 12. send_message (Shared Board)
      case 'send_message': {
        const text = typeof args.text === 'string' ? args.text.trim() : '';
        const side = args.side === 'box' ? 'box' : args.side === 'chat' ? 'chat' : null;
        let author = typeof args.author === 'string' ? args.author.trim() : '';

        if (!text) {
          throw new Error("Missing required argument 'text'");
        }
        if (text.length > 2000) {
          throw new Error('Message text exceeds maximum length of 2000 characters');
        }
        if (!side) {
          throw new Error("Invalid or missing 'side'. Must be either 'chat' or 'box'");
        }

        // Derive author safely if not specified or set identity attribution
        if (!author) {
          author = side === 'box' ? 'Claude Code' : 'Claude / CoWork';
        }
        // Author label capped at 60 chars
        author = author.slice(0, 60);

        const newMsg: ConnectorMessage = {
          id: `msg_${generateId().slice(0, 8)}`,
          side,
          connector_key_id: connectorKey.id,
          author,
          text: redactSensitiveText(text),
          created_at: new Date().toISOString(),
          seen_by_box_at: side === 'box' ? new Date().toISOString() : null,
          fetched_by_chat_at: side === 'chat' ? new Date().toISOString() : null,
        };

        const saved = await storage.createMessage(newMsg);
        resultData = {
          success: true,
          messageId: saved.id,
          created_at: saved.created_at,
          side: saved.side,
          author: saved.author,
          text: saved.text,
        };
        break;
      }

      // 13. read_messages (Shared Board)
      case 'read_messages': {
        const afterId = typeof args.after_id === 'string' ? args.after_id : undefined;
        const limit = typeof args.limit === 'number' ? Math.min(Math.max(1, args.limit), 100) : 20;
        const unreadOnly = Boolean(args.unread_only);
        const callingSide = args.side === 'box' || args.side === 'chat' ? args.side : undefined;

        const messages = await storage.getMessages(afterId, limit, unreadOnly, callingSide);
        resultData = {
          count: messages.length,
          messages,
        };
        break;
      }

      default: {
        throw new Error(`Tool not found: '${toolName}'`);
      }
    }
  } catch (err: unknown) {
    ok = false;
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  // Audit log record
  await storage.recordCall({
    id: callId,
    connector_key_id: connectorKey.id,
    connector_label: connectorKey.label,
    tool: toolName,
    safe_arguments: safeArgs,
    ok,
    error_message: errorMessage,
    created_at: new Date().toISOString(),
  });

  // Increment usage count and update last_used_at
  await storage.incrementKeyUsage(connectorKey.id);

  if (!ok) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(resultData, null, 2),
      },
    ],
    isError: false,
  };
}
