# Consul MCP Server

A Model Context Protocol (MCP) server for interacting with HashiCorp Consul. This server provides read-only access to Consul's key-value store, service catalog, health checks, and cluster status.

## MCP Server Setup

Use the `CONSUL_HOST` environment variable to specify the Consul server URL. 
The MCP server will use this URL to interact with the Conusl API.

You can start up the stio MCP server using `npx -y -p @wkronmiller/consul-mcp-server consul-mcp-server` command.

### Opencode Configuration

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "consul": {
      "type": "local",
      "command": ["npx", "-y", "-p", "@wkronmiller/consul-mcp-server", "consul-mcp-server"],
      "environment": {
        "CONSUL_HOST": "192.168.6.2"
      }
    }
  }
}
```

## Features

### Key-Value Store
- `consul_kv_get` - Get a key-value pair from Consul KV store
- `consul_kv_keys` - List keys in Consul KV store with given prefix

### Cluster Status
- `consul_status_leader` - Get the current Raft leader
- `consul_status_peers` - Get the current Raft peer set

### Agent Information
- `consul_agent_members` - Get cluster members as seen by the agent
- `consul_agent_self` - Get agent configuration and member information

### Service Catalog
- `consul_catalog_datacenters` - List known datacenters
- `consul_catalog_nodes` - List nodes in datacenter
- `consul_catalog_node_services` - List services provided by a node
- `consul_catalog_services` - List services in datacenter
- `consul_catalog_service_nodes` - List nodes providing a service

### Health Checks
- `consul_health_node` - Get health information for a node
- `consul_health_checks` - Get health checks for a service
- `consul_health_service` - Get nodes and health info for a service
- `consul_health_state` - Get checks in a given state


## License

MIT
