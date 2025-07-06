const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

/**
 * Database service for managing flows
 */
class DatabaseService {
  constructor() {
    this.dbPath = path.join(__dirname, 'flows.db');
    this.db = null;
  }

  /**
   * Initialize database and create tables
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
          return;
        }
        
        console.log('✅ Connected to SQLite database');
        this.createTables()
          .then(() => this.seedInitialData())
          .then(resolve)
          .catch(reject);
      });
    });
  }

  /**
   * Create necessary tables
   */
  async createTables() {
    return new Promise((resolve, reject) => {
      const createFlowsTable = `
        CREATE TABLE IF NOT EXISTS flows (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          lastModified TEXT NOT NULL,
          nodeCount INTEGER DEFAULT 0,
          edgeCount INTEGER DEFAULT 0,
          type TEXT DEFAULT 'saved',
          nodes TEXT NOT NULL,
          edges TEXT NOT NULL,
          metadata TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const createNodeTypesTable = `
        CREATE TABLE IF NOT EXISTS nodeTypes (
          nodeType TEXT PRIMARY KEY,
          defaultLabel TEXT NOT NULL,
          category TEXT NOT NULL,
          groupType TEXT NOT NULL,
          description TEXT,
          visual TEXT NOT NULL,
          handles TEXT NOT NULL,
          process TEXT NOT NULL,
          defaultDimensions TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `;

      this.db.run(createFlowsTable, (err) => {
        if (err) {
          console.error('Error creating flows table:', err);
          reject(err);
          return;
        }
        console.log('✅ Flows table created/verified');
        
        this.db.run(createNodeTypesTable, (err) => {
          if (err) {
            console.error('Error creating nodeTypes table:', err);
            reject(err);
            return;
          }
          console.log('✅ NodeTypes table created/verified');
          resolve();
        });
      });
    });
  }

  /**
   * Seed initial data from testFlows.json and testNodeTypes.json
   */
  async seedInitialData() {
    try {
      // Seed flows
      const testFlowsPath = path.join(__dirname, 'testFlows.json');
      if (fs.existsSync(testFlowsPath)) {
        const testFlowsData = JSON.parse(fs.readFileSync(testFlowsPath, 'utf8'));
        const flows = testFlowsData.testFlows || [];

        for (const flow of flows) {
          await this.insertFlow({
            id: flow.id,
            name: flow.name,
            description: flow.description,
            lastModified: flow.lastModified,
            nodeCount: flow.nodes?.length || 0,
            edgeCount: flow.edges?.length || 0,
            type: flow.type || 'template',
            nodes: JSON.stringify(flow.nodes || []),
            edges: JSON.stringify(flow.edges || []),
            metadata: JSON.stringify(flow.metadata || {})
          });
        }

        console.log(`✅ Seeded ${flows.length} flows from testFlows.json`);
      } else {
        console.log('⚠️  testFlows.json not found, skipping flows seed data');
      }

      // Seed node types
      const testNodeTypesPath = path.join(__dirname, 'testNodeTypes.json');
      if (fs.existsSync(testNodeTypesPath)) {
        const testNodeTypesData = JSON.parse(fs.readFileSync(testNodeTypesPath, 'utf8'));
        const nodeTypes = Array.isArray(testNodeTypesData) ? testNodeTypesData : [];

        for (const nodeType of nodeTypes) {
          await this.insertNodeType({
            nodeType: nodeType.nodeType,
            defaultLabel: nodeType.defaultLabel,
            category: nodeType.category,
            groupType: nodeType.group,
            description: nodeType.description,
            visual: JSON.stringify(nodeType.visual),
            handles: JSON.stringify(nodeType.handles),
            process: JSON.stringify(nodeType.process),
            defaultDimensions: JSON.stringify(nodeType.defaultDimensions)
          });
        }

        console.log(`✅ Seeded ${nodeTypes.length} node types from testNodeTypes.json`);
      } else {
        console.log('⚠️  testNodeTypes.json not found, skipping node types seed data');
      }
    } catch (error) {
      console.error('Error seeding initial data:', error);
    }
  }

  /**
   * Insert a new flow
   */
  async insertFlow(flow) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO flows 
        (id, name, description, lastModified, nodeCount, edgeCount, type, nodes, edges, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        flow.id,
        flow.name,
        flow.description,
        flow.lastModified,
        flow.nodeCount,
        flow.edgeCount,
        flow.type,
        flow.nodes,
        flow.edges,
        flow.metadata
      ];

      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Error inserting flow:', err);
          reject(err);
          return;
        }
        resolve(this.lastID);
      });
    });
  }

  /**
   * Get all flows
   */
  async getAllFlows() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM flows ORDER BY lastModified DESC';
      
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Error getting flows:', err);
          reject(err);
          return;
        }
        
        const flows = rows.map(row => ({
          id: row.id,
          name: row.name,
          description: row.description,
          lastModified: row.lastModified,
          nodeCount: row.nodeCount,
          edgeCount: row.edgeCount,
          type: row.type,
          nodes: JSON.parse(row.nodes),
          edges: JSON.parse(row.edges),
          metadata: row.metadata ? JSON.parse(row.metadata) : {},
          createdAt: row.createdAt
        }));
        
        resolve(flows);
      });
    });
  }

  /**
   * Get flow by ID
   */
  async getFlowById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM flows WHERE id = ?';
      
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          console.error('Error getting flow:', err);
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
          return;
        }
        
        const flow = {
          id: row.id,
          name: row.name,
          description: row.description,
          lastModified: row.lastModified,
          nodeCount: row.nodeCount,
          edgeCount: row.edgeCount,
          type: row.type,
          nodes: JSON.parse(row.nodes),
          edges: JSON.parse(row.edges),
          metadata: row.metadata ? JSON.parse(row.metadata) : {},
          createdAt: row.createdAt
        };
        
        resolve(flow);
      });
    });
  }

  /**
   * Update flow
   */
  async updateFlow(id, flow) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE flows 
        SET name = ?, description = ?, lastModified = ?, nodeCount = ?, 
            edgeCount = ?, type = ?, nodes = ?, edges = ?, metadata = ?
        WHERE id = ?
      `;
      
      const params = [
        flow.name,
        flow.description,
        flow.lastModified,
        flow.nodeCount,
        flow.edgeCount,
        flow.type,
        JSON.stringify(flow.nodes),
        JSON.stringify(flow.edges),
        JSON.stringify(flow.metadata || {}),
        id
      ];

      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Error updating flow:', err);
          reject(err);
          return;
        }
        resolve(this.changes > 0);
      });
    });
  }

  /**
   * Delete flow
   */
  async deleteFlow(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM flows WHERE id = ?';
      
      this.db.run(sql, [id], function(err) {
        if (err) {
          console.error('Error deleting flow:', err);
          reject(err);
          return;
        }
        resolve(this.changes > 0);
      });
    });
  }

  // Node Types CRUD operations

  /**
   * Insert a new node type
   */
  async insertNodeType(nodeType) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO nodeTypes 
        (nodeType, defaultLabel, category, groupType, description, visual, handles, process, defaultDimensions, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      const params = [
        nodeType.nodeType,
        nodeType.defaultLabel,
        nodeType.category,
        nodeType.groupType,
        nodeType.description,
        nodeType.visual,
        nodeType.handles,
        nodeType.process,
        nodeType.defaultDimensions
      ];

      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Error inserting node type:', err);
          reject(err);
          return;
        }
        resolve(this.lastID);
      });
    });
  }

  /**
   * Get all node types
   */
  async getAllNodeTypes() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM nodeTypes ORDER BY nodeType';
      
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Error getting node types:', err);
          reject(err);
          return;
        }
        
        const nodeTypes = rows.map(row => ({
          nodeType: row.nodeType,
          defaultLabel: row.defaultLabel,
          category: row.category,
          group: row.groupType,
          description: row.description,
          visual: JSON.parse(row.visual),
          handles: JSON.parse(row.handles),
          process: JSON.parse(row.process),
          defaultDimensions: row.defaultDimensions ? JSON.parse(row.defaultDimensions) : null,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        }));
        
        resolve(nodeTypes);
      });
    });
  }

  /**
   * Get node type by ID
   */
  async getNodeTypeById(nodeType) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM nodeTypes WHERE nodeType = ?';
      
      this.db.get(sql, [nodeType], (err, row) => {
        if (err) {
          console.error('Error getting node type:', err);
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
          return;
        }
        
        const nodeTypeData = {
          nodeType: row.nodeType,
          defaultLabel: row.defaultLabel,
          category: row.category,
          group: row.groupType,
          description: row.description,
          visual: JSON.parse(row.visual),
          handles: JSON.parse(row.handles),
          process: JSON.parse(row.process),
          defaultDimensions: row.defaultDimensions ? JSON.parse(row.defaultDimensions) : null,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        };
        
        resolve(nodeTypeData);
      });
    });
  }

  /**
   * Update node type
   */
  async updateNodeType(nodeType, nodeTypeData) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE nodeTypes 
        SET defaultLabel = ?, category = ?, groupType = ?, description = ?, 
            visual = ?, handles = ?, process = ?, defaultDimensions = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE nodeType = ?
      `;
      
      const params = [
        nodeTypeData.defaultLabel,
        nodeTypeData.category,
        nodeTypeData.group,
        nodeTypeData.description,
        JSON.stringify(nodeTypeData.visual),
        JSON.stringify(nodeTypeData.handles),
        JSON.stringify(nodeTypeData.process),
        JSON.stringify(nodeTypeData.defaultDimensions),
        nodeType
      ];

      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Error updating node type:', err);
          reject(err);
          return;
        }
        resolve(this.changes > 0);
      });
    });
  }

  /**
   * Delete node type
   */
  async deleteNodeType(nodeType) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM nodeTypes WHERE nodeType = ?';
      
      this.db.run(sql, [nodeType], function(err) {
        if (err) {
          console.error('Error deleting node type:', err);
          reject(err);
          return;
        }
        resolve(this.changes > 0);
      });
    });
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('✅ Database connection closed');
        }
      });
    }
  }
}

module.exports = DatabaseService; 