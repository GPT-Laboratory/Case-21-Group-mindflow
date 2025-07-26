# Implementation Plan

- [x] 1. Set up AST parsing foundation with Babel/standalone
  - Install and configure Babel/standalone for client-side JavaScript parsing
  - Create AST parser service with function extraction capabilities
  - Implement comment preservation for node descriptions
  - Write unit tests for basic parsing functionality
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 2. Implement enhanced container node system
  - [x] 2.1 Extend existing container functionality for all nodes
    - Modify existing container node system to allow any node to contain child nodes
    - Add canContainChildren property and child node management methods
    - Create interfaces for parent-child node relationships
    - Write tests for container functionality extension
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 Implement nested function representation
    - Create logic to detect nested functions in AST
    - Implement parent-child node creation for nested functions
    - Add proper scoping context for nested function nodes
    - Write tests for nested function visualization
    - _Requirements: 1.2, 1.4_

  - [x] 2.3 Implement external dependency visualization as child nodes
    - Detect external function calls in AST parsing
    - Create child nodes for external function calls within calling function nodes
    - Implement external dependency tracking and display
    - Write tests for external dependency child node creation
    - _Requirements: 1.3, 7.4_

- [x] 3. Create automatic edge management system
  - [x] 3.1 Implement function call detection and edge creation
    - Parse function calls from AST and create corresponding edges
    - Implement automatic edge creation when function calls are detected
    - Handle multiple calls to same function (single edge rule)
    - Write tests for automatic edge creation
    - _Requirements: 2.1, 2.3_

  - [x] 3.2 Implement edge removal on code changes
    - Detect when function calls are removed from code
    - Automatically remove corresponding edges
    - Implement edge cleanup for orphaned connections
    - Write tests for automatic edge removal
    - _Requirements: 2.2, 10.3_

  - [x] 3.3 Implement manual edge to code synchronization
    - Add function calls to source code when manual edges are drawn
    - Validate manual edge creation against existing code structure
    - Implement bidirectional sync between visual edges and code calls
    - Write tests for manual edge to code conversion
    - _Requirements: 2.4_

- [x] 4. Implement handle validation and connection constraints
  - [x] 4.1 Create handle type validation system
    - Implement handle type compatibility checking
    - Create validation rules for different handle type combinations
    - Add visual feedback for valid/invalid connection attempts
    - Write tests for handle validation logic
    - _Requirements: Design requirement for handle validation_

  - [x] 4.2 Enforce horizontal/vertical connection constraints
    - Implement either/or constraint for horizontal vs vertical connections per node
    - Track active connection type for each node
    - Prevent invalid connection attempts based on existing connections
    - Write tests for connection constraint enforcement
    - _Requirements: Design requirement for connection constraints_

- [x] 5. Create flow-code synchronization engine
  - [x] 5.1 Implement code-to-flow synchronization
    - Parse JavaScript files and create corresponding flow structures
    - Map functions to nodes and function calls to edges
    - Preserve metadata and comments in flow representation
    - Write tests for code-to-flow conversion
    - _Requirements: 4.1, 4.2, 5.1_

  - [x] 5.2 Implement flow-to-code synchronization
    - Generate JavaScript code from flow modifications
    - Maintain code file as single source of truth
    - Implement real-time code updates from visual changes
    - Write tests for flow-to-code conversion
    - _Requirements: 5.2, 5.3_

  - [x] 5.3 Implement automatic code analysis and re-synchronization
    - Monitor node code changes and re-analyze function calls
    - Update edges automatically when code is modified
    - Handle node name changes and reference updates
    - Write tests for automatic re-synchronization
    - _Requirements: 10.1, 10.2, 10.4_

- [x] 6. Implement direct execution engine
  - [x] 6.1 Create function call interception system
    - Implement function call interception for visualization
    - Create execution context tracking for call stack management
    - Add error handling that preserves stack traces
    - Write tests for function call interception
    - _Requirements: 3.1, 3.5_

  - [x] 6.2 Implement node execution control and permissions
    - Create node execution state management (active/inactive status)
    - Implement permission-based execution control per node/function
    - Add execution mode controls (normal/visualization/blocked)
    - Create execution guards that prevent unwanted function calls
    - Handle course sequencing without unwanted execution (course1 → course2 visual flow)
    - Write tests for execution control and permission systems
    - _Requirements: User-defined execution control for course structures_

  - [x] 6.3 Implement process visualization with execution sequencing
    - Create visual transition system that pauses execution
    - Implement edge animation and node highlighting during calls
    - Add execution sequencing for nested function calls
    - Write tests for visualization timing and sequencing
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_

  - [x] 6.4 Implement visualization completion and execution resumption
    - Resume function execution after visual transitions complete
    - Maintain proper call stack and execution context
    - Handle error propagation after visualization sequences
    - Write tests for execution resumption and error handling
    - _Requirements: 6.4, 6.7_

- [ ] 7. Implement configurable variables within functions and flow wrapper functions
  - [x] 7.1 Create variable detection and configuration system
    - Extend AST parsing to detect variable declarations within functions
    - Create interfaces for making function variables configurable through visual interface
    - Implement variable value modification that updates underlying code
    - Add support for detecting and discouraging global variables
    - Write tests for variable detection and configuration functionality
    - _Requirements: 8.1, 8.3, 8.4, 8.5_

  - [x] 7.2 Implement flow wrapper function support
    - Detect wrapper functions that contain all other functions in a code file
    - Treat wrapper functions as "flow nodes" with flow-level variable configuration
    - Expose wrapper function variables as configurable parameters when flow is used as node
    - Implement proper variable scoping following JavaScript scoping rules
    - Write tests for flow wrapper function functionality
    - _Requirements: 8.2, 8.6, 8.7_

- [-] 8. Create simplified visual representation system
  - [x] 8.1 Implement clean node display with essential information
    - Display only function description and title by default
    - Use block comments as node descriptions and titles
    - Create expandable views for detailed information
    - Write tests for node display functionality
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 8.2 Implement filtering and complexity management
    - Add filtering options for complex flows
    - Implement grouping and organization features
    - Create detail panels for selected nodes
    - Write tests for complexity management features
    - _Requirements: 9.4, 9.5_

- [ ] 9. Implement code import and analysis system
  - [ ] 9.1 Create JavaScript file import functionality
    - Implement file upload and parsing for JavaScript files
    - Create flow generation from imported code
    - Handle nested functions and class structures
    - Write tests for code import functionality
    - _Requirements: 4.1, 4.2_

  - [ ] 9.2 Implement external dependency handling
    - Detect and categorize external dependencies
    - Create appropriate visual representations for dependencies
    - Handle different types of external calls and imports
    - Write tests for dependency handling
    - _Requirements: 4.3_

- [ ] 10. Implement error handling and validation
  - [ ] 10.1 Create AST parsing error handling
    - Implement graceful degradation for syntax errors
    - Provide detailed error locations and suggestions
    - Continue parsing valid functions when errors occur
    - Write tests for error handling scenarios
    - _Requirements: Design requirement for error handling_

  - [ ] 10.2 Implement scope violation detection and visualization
    - Detect scoping violations and highlight them visually
    - Integrate with existing linting tools
    - Provide suggestions for scope corrections
    - Write tests for scope violation detection
    - _Requirements: 1.5, 10.5_

- [ ] 11. Integration and end-to-end testing
  - [ ] 11.1 Create comprehensive integration tests
    - Test complete import → visualize → modify → execute workflow
    - Validate performance with real JavaScript projects
    - Test error scenarios across all components
    - Create end-to-end test suite
    - _Requirements: All requirements integration_

  - [ ] 11.2 Implement visual testing and user interaction validation
    - Test visual editing and immediate code updates
    - Validate animation timing and sequencing
    - Test user interactions with container nodes and edges
    - Create visual regression test suite
    - _Requirements: All visual and interaction requirements_