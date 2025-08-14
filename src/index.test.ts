import { describe, it, expect, beforeAll } from 'vitest';
import { createServer } from './index.js';

// Mock Consul client for integration tests
class MockConsulClient {
  kv = {
    get: async (params: any) => ({ key: params.key, value: 'test-value' }),
    keys: async (params: any) => [`${params.key}/subkey1`, `${params.key}/subkey2`]
  };
  
  status = {
    leader: async () => '127.0.0.1:8300',
    peers: async () => ['127.0.0.1:8300', '127.0.0.1:8301']
  };
  
  agent = {
    members: async () => [{ Name: 'test-node', Status: 1 }],
    self: async () => ({ Config: { NodeName: 'test-node' } })
  };
  
  catalog = {
    datacenters: async () => ['dc1'],
    node: {
      list: async () => [{ Node: 'test-node', Address: '127.0.0.1' }],
      services: async (params: any) => ({ Node: params.node, Services: {} })
    },
    service: {
      list: async () => ({ 'test-service': ['tag1'] }),
      nodes: async (params: any) => [{ Node: 'test-node', Service: params.service }]
    }
  };
  
  health = {
    node: async (params: any) => [{ Node: params.name, Status: 'passing' }],
    checks: async (params: any) => [{ ServiceName: params.service, Status: 'passing' }],
    service: async (params: any) => [{ Node: 'test-node', Service: { Service: params.service } }],
    state: async (params: any) => [{ Status: params.state }]
  };
}

describe('Consul MCP Server Integration Tests', () => {
  let server: any;
  let mockConsul: MockConsulClient;

  beforeAll(() => {
    mockConsul = new MockConsulClient();
    server = createServer(mockConsul);
  });

  describe('KV Store Operations', () => {
    it('should get a key-value pair', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'consul_kv_get',
          arguments: { key: 'test/key' }
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      expect(response.content[0].text).toContain('test-value');
    });

    it('should list keys with prefix', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'consul_kv_keys',
          arguments: { key: 'test/' }
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      expect(response.content[0].text).toContain('subkey1');
      expect(response.content[0].text).toContain('subkey2');
    });
  });

  describe('Status Operations', () => {
    it('should get current leader', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'consul_status_leader',
          arguments: {}
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      expect(response.content[0].text).toContain('127.0.0.1:8300');
    });

    it('should get peer set', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'consul_status_peers',
          arguments: {}
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      expect(response.content[0].text).toContain('127.0.0.1:8300');
      expect(response.content[0].text).toContain('127.0.0.1:8301');
    });
  });

  describe('Agent Operations', () => {
    it('should get cluster members', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'consul_agent_members',
          arguments: {}
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      expect(response.content[0].text).toContain('test-node');
    });

    it('should get agent self info', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'consul_agent_self',
          arguments: {}
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      expect(response.content[0].text).toContain('test-node');
    });
  });

  describe('Catalog Operations', () => {
    it('should list datacenters', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'consul_catalog_datacenters',
          arguments: {}
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      expect(response.content[0].text).toContain('dc1');
    });

    it('should list nodes', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'consul_catalog_nodes',
          arguments: {}
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      expect(response.content[0].text).toContain('test-node');
    });

    it('should get node services', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'consul_catalog_node_services',
          arguments: { node: 'test-node' }
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      expect(response.content[0].text).toContain('test-node');
    });

    it('should list services', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'consul_catalog_services',
          arguments: {}
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      expect(response.content[0].text).toContain('test-service');
    });

    it('should get service nodes', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'consul_catalog_service_nodes',
          arguments: { service: 'test-service' }
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      expect(response.content[0].text).toContain('test-node');
    });
  });

  describe('Health Operations', () => {
    it('should get node health', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'consul_health_node',
          arguments: { node: 'test-node' }
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      expect(response.content[0].text).toContain('test-node');
    });

    it('should get service health checks', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'consul_health_checks',
          arguments: { service: 'test-service' }
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      expect(response.content[0].text).toContain('test-service');
    });

    it('should get service health info', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'consul_health_service',
          arguments: { service: 'test-service' }
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      expect(response.content[0].text).toContain('test-service');
    });

    it('should get checks by state', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'consul_health_state',
          arguments: { state: 'passing' }
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      expect(response.content[0].text).toContain('passing');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown tool', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'unknown_tool',
          arguments: {}
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Unknown tool');
    });

    it('should handle invalid arguments', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'consul_kv_get',
          arguments: {} // missing required 'key' parameter
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      expect(response.isError).toBe(true);
    });
  });

  describe('Tool Listing', () => {
    it('should list all available tools', async () => {
      const request = {
        method: 'tools/list',
        params: {}
      };

      const response = await server._requestHandlers.get('tools/list')?.(request);
      expect(response.tools).toHaveLength(15);
      
      const toolNames = response.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('consul_kv_get');
      expect(toolNames).toContain('consul_kv_keys');
      expect(toolNames).toContain('consul_status_leader');
      expect(toolNames).toContain('consul_health_service');
    });
  });
});
