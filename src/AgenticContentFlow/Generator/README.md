# Unified Generator System

## Overview

The Generator system unifies the previously separate Flow generation and Process generation systems into a cohesive architecture that eliminates duplication and provides consistent generation capabilities across the application.

## Architecture

### 📁 Unified Directory Structure

```
src/AgenticContentFlow/Generator/
├── types.ts                     # Unified type definitions
├── index.ts                     # Public API exports
├── core/
│   ├── GeneratorOrchestrator.ts # Main orchestration service
│   ├── PromptBuilder.ts         # Intelligent prompt construction
│   ├── AIService.ts            # LLM communication & fallbacks
│   └── ValidationService.ts    # Code and flow validation
├── providers/
│   ├── LLMProviders.ts         # Multi-provider LLM support
│   ├── APIKeyManager.ts        # Secure credential management
│   └── types.ts                # Provider-specific types
├── templates/
│   ├── TemplateRegistry.ts     # Unified template management
│   ├── process/                # Process generation templates
│   │   ├── UniversalTemplate.ts
│   │   └── NodeSpecificTemplates.ts
│   └── flow/                   # Flow generation templates
│       ├── UserManagementTemplate.ts
│       └── FlowTemplateRegistry.ts
├── validation/
│   ├── ProcessValidator.ts     # Process code validation
│   ├── FlowValidator.ts        # Flow structure validation
│   └── SecurityValidator.ts    # Security pattern detection
├── services/
│   ├── ProcessGenerator.ts     # Process function generation
│   ├── FlowGenerator.ts        # Complete flow generation
│   └── HybridGenerator.ts      # Combined generation strategies
├── ui/
│   ├── components/
│   │   ├── APISetupDialog.tsx
│   │   ├── ProcessPanel.tsx
│   │   ├── FlowPanel.tsx
│   │   └── shared/
│   ├── hooks/
│   │   ├── useProcessGeneration.ts
│   │   ├── useFlowGeneration.ts
│   │   └── usePromptHistory.ts
│   └── controls/
│       ├── ProcessControl.tsx
│       └── FlowControl.tsx
└── utils/
    ├── NodeContextUtils.ts
    ├── PromptUtils.ts
    └── ValidationUtils.ts
```

## Key Benefits of Unification

### 🎯 **Eliminated Duplication**
- Single LLM provider system shared by both process and flow generation
- Unified API key management and configuration
- Shared validation framework with specialized validators
- Common prompt building infrastructure

### 🔧 **Better Architecture**
- Clear separation between core services, UI, and utilities
- Shared orchestrator that can handle both generation types
- Unified template system with specialized sub-registries
- Common error handling and progress tracking

### 🚀 **Enhanced Capabilities**
- Hybrid generation strategies that combine process and flow generation
- Cross-system learning and optimization
- Unified analytics and usage tracking
- Shared configuration and preferences

### 🎨 **Improved Developer Experience**
- Single import point for all generation capabilities
- Consistent APIs across process and flow generation
- Shared hooks and utilities
- Unified documentation and examples

## Migration Strategy

### Phase 1: Core Infrastructure ✅
- [x] Create unified directory structure
- [x] Consolidate type definitions
- [x] Merge LLM provider systems
- [x] Unify API key management

### Phase 2: Service Integration
- [ ] Create unified GeneratorOrchestrator
- [ ] Merge prompt building systems
- [ ] Consolidate validation frameworks
- [ ] Create hybrid generation strategies

### Phase 3: UI Consolidation
- [ ] Merge configuration dialogs
- [ ] Unify generation panels
- [ ] Consolidate hooks and utilities
- [ ] Update control registrations

### Phase 4: Template Unification
- [ ] Merge template registries
- [ ] Organize templates by domain
- [ ] Create cross-domain templates
- [ ] Implement template inheritance

## Shared Components

### Core Services
- **GeneratorOrchestrator**: Coordinates all generation activities
- **AIService**: Handles LLM communication with fallbacks
- **PromptBuilder**: Builds intelligent prompts for any generation type
- **ValidationService**: Validates generated code and flows

### Provider System
- **LLMProviders**: Multi-provider support (OpenAI, Gemini, Claude, Custom)
- **APIKeyManager**: Secure credential storage and management
- **ProviderFactory**: Dynamic provider instantiation

### Template System
- **TemplateRegistry**: Unified registry for all template types
- **ProcessTemplates**: Node-specific process function templates
- **FlowTemplates**: Complete flow generation templates
- **HybridTemplates**: Templates that generate both processes and flows

## Generation Types

### Process Generation
- Generates JavaScript functions for individual nodes
- Uses node configuration and instance data
- Validates for syntax and security
- Integrates with existing node panels

### Flow Generation
- Generates complete flow structures with nodes and edges
- Uses natural language descriptions
- Validates flow structure and connections
- Provides intelligent fallbacks via templates

### Hybrid Generation
- Combines process and flow generation
- Can generate flows with custom process functions
- Provides end-to-end generation capabilities
- Optimizes for specific use cases

## Usage Examples

### Unified API
```typescript
import { Generator } from '@/AgenticContentFlow/Generator';

// Process generation
const processResult = await Generator.generateProcess({
  type: 'process',
  nodeType: 'restnode',
  context: nodeContext
});

// Flow generation
const flowResult = await Generator.generateFlow({
  type: 'flow', 
  description: 'Build a user management system',
  complexity: 'intermediate'
});

// Hybrid generation
const hybridResult = await Generator.generateHybrid({
  type: 'hybrid',
  flowDescription: 'API processing pipeline',
  customProcesses: ['data-transformer', 'error-handler']
});
```

### Shared Configuration
```typescript
// Single configuration for all generation types
Generator.configure({
  defaultProvider: 'openai',
  fallbackToTemplates: true,
  enableHybridGeneration: true,
  validationLevel: 'strict'
});
```

## Next Steps

1. **Implement Core Unification**: Start with the shared infrastructure
2. **Migrate Existing Systems**: Gradually move existing code to unified structure
3. **Add Hybrid Capabilities**: Implement cross-system generation features
4. **Update Documentation**: Comprehensive docs for the unified system
5. **Performance Optimization**: Leverage shared components for better performance

The unified Generator system will provide a much cleaner, more maintainable, and more powerful generation infrastructure while eliminating the current duplication between systems.