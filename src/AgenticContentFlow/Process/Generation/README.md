# LLM-Powered Process Generation System

This module provides AI-powered code generation for Agentic Content Flow nodes using Large Language Models (LLMs). It enables users to generate node-specific process functions by leveraging OpenAI GPT, Google Gemini, Anthropic Claude, or custom LLM providers.

## Features

- **Multi-Provider Support**: OpenAI, Google Gemini, Anthropic Claude, and custom APIs
- **Intelligent Prompts**: Context-aware prompts built from node templates, instance data, and schemas
- **Real-time Progress**: Live progress notifications during generation
- **Code Validation**: Automatic validation of generated code for syntax and security
- **Secure Storage**: Encrypted API key storage in localStorage
- **Easy Setup**: User-friendly configuration dialogs with connection testing

## Architecture

### Core Components

#### `types.ts`
Type definitions for LLM providers, generation requests, and results.

#### `APIKeyManager.ts`
Secure storage and management of LLM API credentials:
- Encrypted API key storage
- Multi-provider configuration
- Automatic preference management
- Connection validation

#### `LLMProviders.ts`
Implementation of different LLM provider APIs:
- `OpenAIProvider`: GPT-4 and GPT-3.5 models
- `GeminiProvider`: Google's Gemini Pro models
- `ClaudeProvider`: Anthropic's Claude 3 family
- `CustomProvider`: Self-hosted or other compatible APIs

#### `PromptBuilder.ts`
Constructs intelligent prompts from node context:
- Template descriptions and configurations
- Instance-specific data and requirements
- Input/output schemas from connected nodes
- Node-type specific examples and constraints

#### `GenerationOrchestrator.ts`
Main coordinator for the generation process:
- Provider selection and configuration
- Progress tracking and error handling
- Code validation and post-processing
- Node updates and result management

#### `components/APISetupDialog.tsx`
React component for provider configuration:
- Quick setup for popular providers
- API key validation and testing
- Advanced settings (model, temperature, tokens)
- Connection testing and error handling

## Usage

### Basic Integration

The system is automatically integrated into the NodePanel. When users click the "Generate" button:

1. **Configuration Check**: Verifies LLM provider setup
2. **API Setup**: Shows configuration dialog if needed
3. **Context Building**: Extracts node data, schemas, and flow context
4. **Prompt Generation**: Creates intelligent prompts for the LLM
5. **API Call**: Sends request to configured provider with progress tracking
6. **Validation**: Validates generated code for syntax and security
7. **Node Update**: Updates the node with generated code and metadata

### Setting Up LLM Providers

#### OpenAI
```typescript
{
  provider: 'openai',
  apiKey: 'sk-...',
  model: 'gpt-4',
  temperature: 0.3,
  maxTokens: 2048
}
```

#### Google Gemini
```typescript
{
  provider: 'gemini',
  apiKey: 'AI...',
  model: 'gemini-pro',
  temperature: 0.3,
  maxTokens: 2048
}
```

#### Anthropic Claude
```typescript
{
  provider: 'claude',
  apiKey: 'sk-ant-...',
  model: 'claude-3-sonnet-20240229',
  temperature: 0.3,
  maxTokens: 2048
}
```

#### Custom Provider
```typescript
{
  provider: 'custom',
  apiKey: 'your-key',
  baseUrl: 'https://your-api.com/v1',
  model: 'your-model',
  temperature: 0.3,
  maxTokens: 2048
}
```

### Programmatic Usage

```typescript
import { GenerationOrchestrator } from './GenerationOrchestrator';
import { GenerationContext } from './types';

const orchestrator = new GenerationOrchestrator();

const context: GenerationContext = {
  nodeId: 'node-123',
  nodeType: 'restnode',
  formData: nodeData,
  inputSchema: inputSchema,
  onFieldChange: (field, value) => updateNode(field, value),
  onGenerationComplete: (result) => console.log('Generated!', result),
  onGenerationError: (error) => console.error('Failed:', error)
};

const result = await orchestrator.generateCode(context, (progress) => {
  console.log(`${progress.stage}: ${progress.progress}%`);
});
```

## Generated Code Structure

All generated functions follow this signature:

```javascript
async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 Processing:', { incomingData, nodeData });
  
  try {
    // Node-specific implementation
    const result = {
      data: processedData,
      metadata: {
        processedAt: new Date().toISOString(),
        nodeType: 'restnode'
      }
    };
    
    console.log('✅ Completed:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed:', error);
    throw error;
  }
}
```

## Node Type Support

### REST Node
Generates HTTP client code with:
- Configurable methods (GET, POST, PUT, DELETE)
- Authentication handling
- Error handling and retries
- Response processing

### Logical Node
Generates data processing code with:
- Filtering and transformation logic
- Conditional routing
- Data aggregation
- Business rule application

### Conditional Node
Generates conditional routing code with:
- Boolean condition evaluation
- Multi-path routing
- Dynamic target selection
- State preservation

### Content Node
Generates display formatting code with:
- Data formatting for UI
- List and grid configurations
- Responsive layouts
- Error state handling

## Security Considerations

- **API Key Encryption**: Keys are base64 encoded in localStorage
- **Code Validation**: Generated code is validated for security patterns
- **Sandbox Execution**: Generated code runs in controlled environments
- **No Credential Logging**: API keys never appear in console or error messages

## Error Handling

The system provides comprehensive error handling:

- **Network Errors**: Automatic retry with exponential backoff
- **API Errors**: Clear error messages with troubleshooting hints
- **Validation Errors**: Code syntax and security issue reporting
- **Configuration Errors**: Guided setup and validation

## Performance

- **Efficient Prompts**: Optimized prompt structure to minimize token usage
- **Caching**: Results cached to avoid redundant API calls
- **Streaming**: Real-time progress updates during generation
- **Debouncing**: Prevents rapid-fire generation requests

## Extensibility

### Adding New Providers

1. Implement the `LLMProviderInterface`:

```typescript
export class MyProvider implements LLMProviderInterface {
  async generateCode(request: LLMGenerationRequest): Promise<LLMGenerationResult> {
    // Implementation
  }
  
  async testConnection(config: LLMAPIConfig): Promise<{ success: boolean; error?: string }> {
    // Implementation
  }
  
  getProviderInfo() {
    return {
      name: 'My Provider',
      models: ['my-model'],
      defaultModel: 'my-model'
    };
  }
}
```

2. Add to `LLMProviderFactory`:

```typescript
case 'myprovider':
  return new MyProvider();
```

3. Update types and UI as needed.

### Custom Prompt Templates

Extend `PromptBuilder` to customize prompts for specific node types:

```typescript
private buildCustomNodeRequirements(templateData: Record<string, any>): string {
  // Custom prompt logic
}
```

## Testing

### Unit Tests
- Provider API implementations
- Prompt generation logic
- Validation algorithms
- Error handling scenarios

### Integration Tests
- End-to-end generation flow
- Multi-provider scenarios
- Schema integration
- UI component behavior

### Manual Testing
Use the notification demo to test various scenarios:

```typescript
import { useNotifications } from '../Notifications/hooks/useNotifications';

const { showSuccessToast, showErrorToast, showBlockingNotification } = useNotifications();
```

## Troubleshooting

### Common Issues

**"No LLM provider configured"**
- Solution: Click Generate button to open API setup dialog
- Configure at least one provider with valid API key

**"API error: 401 Unauthorized"**
- Solution: Check API key validity in provider console
- Re-enter API key in setup dialog

**"Generation failed: Network error"**
- Solution: Check internet connection and provider status
- Verify API endpoint URLs for custom providers

**"Validation failed"**
- Generated code may have syntax errors
- Review LLM temperature settings (lower = more consistent)
- Check prompt quality and node configuration

### Debug Mode

Enable verbose logging:

```typescript
// In browser console
localStorage.setItem('debug_llm_generation', 'true');
```

## Future Enhancements

- **Streaming Responses**: Real-time code generation display
- **Learning System**: Improve prompts based on user feedback
- **Version Control**: Track code generation history
- **Batch Generation**: Generate code for multiple nodes
- **Custom Templates**: User-defined prompt templates
- **Cost Tracking**: Monitor API usage and costs

## API Reference

See individual component files for detailed API documentation:
- [Types](./types.ts)
- [API Key Manager](./APIKeyManager.ts)
- [LLM Providers](./LLMProviders.ts)
- [Prompt Builder](./PromptBuilder.ts)
- [Generation Orchestrator](./GenerationOrchestrator.ts)