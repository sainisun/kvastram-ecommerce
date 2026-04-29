import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerProductTools } from './tools/products.js';
import { registerCategoryTools } from './tools/categories.js';
import { registerCollectionTools } from './tools/collections.js';
import { registerBannerTools } from './tools/banners.js';
import { registerOrderTools } from './tools/orders.js';
import { registerMarketingTools } from './tools/marketing.js';
import { registerTrustItemTools } from './tools/trust-items.js';

const server = new McpServer({
  name: 'kvastram-admin',
  version: '1.0.0',
});

// Register all tool groups
registerProductTools(server);
registerCategoryTools(server);
registerCollectionTools(server);
registerBannerTools(server);
registerOrderTools(server);
registerMarketingTools(server);
registerTrustItemTools(server);

// Start the MCP server on stdio (Claude communicates via stdin/stdout)
const transport = new StdioServerTransport();
await server.connect(transport);
