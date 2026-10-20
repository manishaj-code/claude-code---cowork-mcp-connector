import { McpToolDefinition } from './protocol.js';

export const MCP_TOOLS: McpToolDefinition[] = [
  // 1. get_overview
  {
    name: 'get_overview',
    description: 'Get high-level overview of the mock project, current demo environment, git branch, and status.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  // 2. list_files
  {
    name: 'list_files',
    description: 'List allowlisted file paths from the predefined sample repository.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  // 3. read_file
  {
    name: 'read_file',
    description: 'Read the contents of an allowlisted file in the sample repository. Denies path traversal and sensitive files.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The relative file path to read (e.g., "README.md", "src/index.ts").',
        },
      },
      required: ['path'],
    },
  },
  // 4. search_code
  {
    name: 'search_code',
    description: 'Search sample repository source code for a text query, returning matching lines and snippets.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Text string or symbol to search for across sample files.',
        },
      },
      required: ['query'],
    },
  },
  // 5. recent_changes
  {
    name: 'recent_changes',
    description: 'Get mock Git commit logs and change summaries for recent development work.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  // 6. describe_data_model
  {
    name: 'describe_data_model',
    description: 'Describe the mock database schema and tables. Does not expose real database records or credentials.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  // 7. list_reports
  {
    name: 'list_reports',
    description: 'List available predefined sample analytics reports and their descriptions.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  // 8. get_report
  {
    name: 'get_report',
    description: 'Fetch predefined, non-sensitive demo report data by report ID.',
    inputSchema: {
      type: 'object',
      properties: {
        report_id: {
          type: 'string',
          description: 'The ID of the report to retrieve (e.g., "rep_throughput_q3", "rep_battery_health").',
        },
      },
      required: ['report_id'],
    },
  },
  // 9. list_services
  {
    name: 'list_services',
    description: 'List mock application microservices and their architectural tier.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  // 10. service_status
  {
    name: 'service_status',
    description: 'Get simulated service health status. Clearly labelled as simulated demo data.',
    inputSchema: {
      type: 'object',
      properties: {
        service_id: {
          type: 'string',
          description: 'Optional service ID to inspect. If omitted, returns all services.',
        },
      },
      required: [],
    },
  },
  // 11. find_people
  {
    name: 'find_people',
    description: 'Search fictional demo team members by name, role, email, or team owner. Contains no real personal data.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search string to filter fictional demo people.',
        },
      },
      required: [],
    },
  },
  // 12. send_message (Shared Board)
  {
    name: 'send_message',
    description: 'Post a new message to the shared communication board between Claude/CoWork and Claude Code. Append-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The message body (max 2000 characters).',
        },
        side: {
          type: 'string',
          enum: ['chat', 'box'],
          description: 'Originating side: "chat" for Claude/CoWork, "box" for Claude Code CLI.',
        },
        author: {
          type: 'string',
          description: 'Optional display author label.',
        },
      },
      required: ['text', 'side'],
    },
  },
  // 13. read_messages (Shared Board)
  {
    name: 'read_messages',
    description: 'Read messages from the shared board in chronological order. Updates fetch/seen timestamps for the calling side.',
    inputSchema: {
      type: 'object',
      properties: {
        after_id: {
          type: 'string',
          description: 'Optional message ID cursor to read messages posted after this ID.',
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of messages to return (default 20, max 100).',
        },
        unread_only: {
          type: 'boolean',
          description: 'If true, returns only messages not yet fetched or seen by the calling side.',
        },
        side: {
          type: 'string',
          enum: ['chat', 'box'],
          description: 'The side making the read request ("chat" or "box") to record fetch status.',
        },
      },
      required: [],
    },
  },
];
