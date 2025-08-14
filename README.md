# Consul MCP Server

A Model Context Protocol (MCP) server for interacting with HashiCorp Consul. This server provides read-only access to Consul's key-value store, service catalog, health checks, and cluster status.

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

## Configuration

The server can be configured using environment variables:

- `CONSUL_HOST` - Consul agent host (default: 127.0.0.1)
- `CONSUL_PORT` - Consul agent port (default: 8500)
- `CONSUL_SECURE` - Use HTTPS (default: false)
- `CONSUL_TOKEN` - ACL token for authentication

## Installation

```bash
npm install -g @wkronmiller/consul-mcp-server
```

## Usage

### With MCP Client

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "consul": {
      "command": "consul-mcp-server",
      "env": {
        "CONSUL_HOST": "localhost",
        "CONSUL_PORT": "8500",
        "CONSUL_TOKEN": "your-acl-token"
      }
    }
  }
}
```

### Direct Usage

```bash
# Set environment variables
export CONSUL_HOST=localhost
export CONSUL_PORT=8500
export CONSUL_TOKEN=your-acl-token

# Run the server
consul-mcp-server
```

## Examples

### Get a key from KV store
```json
{
  "name": "consul_kv_get",
  "arguments": {
    "key": "config/app/database"
  }
}
```

### List all services
```json
{
  "name": "consul_catalog_services",
  "arguments": {}
}
```

### Get health status of a service
```json
{
  "name": "consul_health_service",
  "arguments": {
    "service": "web",
    "passing": true
  }
}
```

### Get cluster leader
```json
{
  "name": "consul_status_leader",
  "arguments": {}
}
```

## Security

This server provides **read-only** access to Consul. It does not support any write operations like:
- Setting KV pairs
- Registering/deregistering services
- Creating/destroying sessions
- Modifying health checks

All operations respect Consul's ACL system when a token is provided.

## License

MIT