#!/usr/bin/env node

import { z } from "zod";
import 'dotenv/config'
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import Consul from "@wkronmiller/consul";

const CommonOptionsSchema = z.object({
  dc: z.string().optional(),
  token: z.string().optional(),
  consistent: z.boolean().optional(),
  stale: z.boolean().optional(),
});

const KvGetSchema = z.object({
  key: z.string(),
  recurse: z.boolean().optional(),
  raw: z.boolean().optional(),
  buffer: z.boolean().optional(),
}).merge(CommonOptionsSchema);

const KvKeysSchema = z.object({
  key: z.string(),
  separator: z.string().optional(),
}).merge(CommonOptionsSchema);

const KvSetSchema = z.object({
  key: z.string(),
  value: z.string(),
  flags: z.number().optional(),
  cas: z.number().optional(),
  acquire: z.string().optional(),
  release: z.string().optional(),
}).merge(CommonOptionsSchema);

const NodeSchema = z.object({
  node: z.string(),
}).merge(CommonOptionsSchema);

const ServiceSchema = z.object({
  service: z.string(),
  tag: z.string().optional(),
}).merge(CommonOptionsSchema);

const HealthServiceSchema = z.object({
  service: z.string(),
  tag: z.string().optional(),
  passing: z.boolean().optional(),
}).merge(CommonOptionsSchema);

const HealthStateSchema = z.object({
  state: z.enum(['any', 'passing', 'warning', 'critical']),
}).merge(CommonOptionsSchema);

export function createServer(consulClient?: any) {
  const server = new Server({ 
    name: "consul-mcp-server", 
    version: "0.0.1" 
  }, {
    capabilities: {
      tools: {}
    }
  });

  const consul = consulClient || new Consul({
    host: process.env.CONSUL_HOST || '127.0.0.1',
    port: process.env.CONSUL_PORT ? parseInt(process.env.CONSUL_PORT) : 8500,
    secure: process.env.CONSUL_SECURE === 'true',
    defaults: {
      token: process.env.CONSUL_TOKEN,
    }
  });

  // Test connection only if not in test environment
  if (!consulClient && process.env.NODE_ENV !== 'test') {
    consul.status.leader().then((status: any) => {
      console.log("Consul leader:", status);
    }).catch((error: any) => {
      console.error("Error connecting to Consul:", error);
    });
  }

  // KV Store Operations
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        // KV Store Operations
        case "consul_kv_get": {
          const params = KvGetSchema.parse(args);
          const result = await consul.kv.get(params);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        case "consul_kv_keys": {
          const params = KvKeysSchema.parse(args);
          const result = await consul.kv.keys(params);
          return {
            content: [
              {
                type: "text", 
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        case "consul_kv_set": {
          const params = KvSetSchema.parse(args);
          const result = await consul.kv.set(params);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        // Status Operations
        case "consul_status_leader": {
          const result = await consul.status.leader();
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        case "consul_status_peers": {
          const result = await consul.status.peers();
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        // Agent Operations
        case "consul_agent_members": {
          const params = CommonOptionsSchema.parse(args || {});
          const result = await consul.agent.members(params);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        case "consul_agent_self": {
          const result = await consul.agent.self();
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        // Catalog Operations
        case "consul_catalog_datacenters": {
          const result = await consul.catalog.datacenters();
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        case "consul_catalog_nodes": {
          const params = CommonOptionsSchema.parse(args || {});
          const result = await consul.catalog.node.list(params);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        case "consul_catalog_node_services": {
          const params = NodeSchema.parse(args);
          const result = await consul.catalog.node.services(params);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        case "consul_catalog_services": {
          const params = CommonOptionsSchema.parse(args || {});
          const result = await consul.catalog.service.list(params);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        case "consul_catalog_service_nodes": {
          const params = ServiceSchema.parse(args);
          const result = await consul.catalog.service.nodes(params);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        // Health Operations
        case "consul_health_node": {
          const params = NodeSchema.parse(args);
          const result = await consul.health.node({ name: params.node, dc: params.dc, token: params.token });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        case "consul_health_checks": {
          const params = ServiceSchema.parse(args);
          const result = await consul.health.checks(params);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        case "consul_health_service": {
          const params = HealthServiceSchema.parse(args);
          const result = await consul.health.service(params);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        case "consul_health_state": {
          const params = HealthStateSchema.parse(args);
          const result = await consul.health.state(params);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  });

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        // KV Store Tools
        {
          name: "consul_kv_get",
          description: "Get a key-value pair from Consul KV store",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Key to retrieve" },
              recurse: { type: "boolean", description: "Return all keys with given prefix" },
              raw: { type: "boolean", description: "Return raw value" },
              buffer: { type: "boolean", description: "Decode value into Buffer" },
              dc: { type: "string", description: "Datacenter" },
              token: { type: "string", description: "ACL token" },
              consistent: { type: "boolean", description: "Require strong consistency" },
              stale: { type: "boolean", description: "Use stale data" }
            },
            required: ["key"]
          }
        },
        {
          name: "consul_kv_keys",
          description: "List keys in Consul KV store with given prefix",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Key prefix" },
              separator: { type: "string", description: "List keys up to separator" },
              dc: { type: "string", description: "Datacenter" },
              token: { type: "string", description: "ACL token" }
            },
            required: ["key"]
          }
        },

        // Status Tools
        {
          name: "consul_status_leader",
          description: "Get the current Raft leader",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "consul_status_peers",
          description: "Get the current Raft peer set",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },

        // Agent Tools
        {
          name: "consul_agent_members",
          description: "Get cluster members as seen by the agent",
          inputSchema: {
            type: "object",
            properties: {
              wan: { type: "boolean", description: "Return WAN members instead of LAN" },
              dc: { type: "string", description: "Datacenter" },
              token: { type: "string", description: "ACL token" }
            }
          }
        },
        {
          name: "consul_agent_self",
          description: "Get agent configuration and member information",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },

        // Catalog Tools
        {
          name: "consul_catalog_datacenters",
          description: "List known datacenters",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "consul_catalog_nodes",
          description: "List nodes in datacenter",
          inputSchema: {
            type: "object",
            properties: {
              dc: { type: "string", description: "Datacenter" },
              token: { type: "string", description: "ACL token" }
            }
          }
        },
        {
          name: "consul_catalog_node_services",
          description: "List services provided by a node",
          inputSchema: {
            type: "object",
            properties: {
              node: { type: "string", description: "Node name" },
              dc: { type: "string", description: "Datacenter" },
              token: { type: "string", description: "ACL token" }
            },
            required: ["node"]
          }
        },
        {
          name: "consul_catalog_services",
          description: "List services in datacenter",
          inputSchema: {
            type: "object",
            properties: {
              dc: { type: "string", description: "Datacenter" },
              token: { type: "string", description: "ACL token" }
            }
          }
        },
        {
          name: "consul_catalog_service_nodes",
          description: "List nodes providing a service",
          inputSchema: {
            type: "object",
            properties: {
              service: { type: "string", description: "Service name" },
              tag: { type: "string", description: "Filter by tag" },
              dc: { type: "string", description: "Datacenter" },
              token: { type: "string", description: "ACL token" }
            },
            required: ["service"]
          }
        },

        // Health Tools
        {
          name: "consul_health_node",
          description: "Get health information for a node",
          inputSchema: {
            type: "object",
            properties: {
              node: { type: "string", description: "Node name" },
              dc: { type: "string", description: "Datacenter" },
              token: { type: "string", description: "ACL token" }
            },
            required: ["node"]
          }
        },
        {
          name: "consul_health_checks",
          description: "Get health checks for a service",
          inputSchema: {
            type: "object",
            properties: {
              service: { type: "string", description: "Service name" },
              dc: { type: "string", description: "Datacenter" },
              token: { type: "string", description: "ACL token" }
            },
            required: ["service"]
          }
        },
        {
          name: "consul_health_service",
          description: "Get nodes and health info for a service",
          inputSchema: {
            type: "object",
            properties: {
              service: { type: "string", description: "Service name" },
              tag: { type: "string", description: "Filter by tag" },
              passing: { type: "boolean", description: "Only passing checks" },
              dc: { type: "string", description: "Datacenter" },
              token: { type: "string", description: "ACL token" }
            },
            required: ["service"]
          }
        },
        {
          name: "consul_health_state",
          description: "Get checks in a given state",
          inputSchema: {
            type: "object",
            properties: {
              state: { 
                type: "string", 
                enum: ["any", "passing", "warning", "critical"],
                description: "Health check state" 
              },
              dc: { type: "string", description: "Datacenter" },
              token: { type: "string", description: "ACL token" }
            },
            required: ["state"]
          }
        }
      ]
    };
  });

  return server;
}

const server = createServer();
const transport = new StdioServerTransport();
await server.connect(transport);

