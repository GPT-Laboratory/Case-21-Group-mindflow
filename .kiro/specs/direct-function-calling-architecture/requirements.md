# Requirements Document

## Introduction

This feature transforms the visual code generation platform to represent code files as flows where each function becomes a node. A single flow represents a single code file, with nodes representing functions and edges representing function calls within that file. External file dependencies are represented as child nodes. The system uses AST parsing (via Babel/standalone) to analyze JavaScript files and create visual representations, maintaining references to the original code while supporting pure functions by default.

## Requirements

### Requirement 1

**User Story:** As a developer, I want to extend the existing container node system so that any node can contain other nodes, enabling representation of nested functions and external function calls for all nodes. 

#### Acceptance Criteria

1. WHEN any node is created THEN the system SHALL extend the existing container functionality to allow that node to contain child nodes
2. WHEN a function contains nested functions THEN the system SHALL represent nested functions as child nodes within the parent function node
3. WHEN a function calls external functions (outside the current file) THEN the system SHALL represent those external calls as child nodes
4. WHEN child nodes represent nested functions THEN they SHALL be scoped to their parent node following normal code scoping rules
5. WHEN language-specific scoping violations occur THEN the system SHALL rely on the code language's own linting to catch errors and simply visualize any detected issues

### Requirement 2

**User Story:** As a developer, I want edges to be automatically created based on function calls in my code, so that the visual representation accurately reflects the actual code dependencies.

#### Acceptance Criteria

1. WHEN a node's function calls another node's function THEN the system SHALL automatically create an edge from the caller node to the called node
2. WHEN a function call is removed from a node's code THEN the system SHALL automatically remove the corresponding edge
3. WHEN multiple calls exist to the same target function THEN the system SHALL maintain only one edge between the nodes
4. WHEN a manual edge is drawn between nodes THEN the system SHALL add the target node's function call to the source node's code

### Requirement 3

**User Story:** As a developer, I want to execute flows through direct function calls, so that the code behaves like real executable code rather than artificial process flows.

#### Acceptance Criteria

1. WHEN a flow is executed THEN the system SHALL call node functions directly rather than traversing edges
2. WHEN a node function calls another node function THEN the system SHALL pause code execution to display the visual transition before proceeding with the function call
3. WHEN process visualization is enabled THEN the system SHALL temporarily halt code execution during function calls to show edge animations and data transfer visualization
4. WHEN the visualization animation completes THEN the system SHALL resume code execution with the actual function call
5. WHEN an error occurs during execution THEN the system SHALL provide proper error handling and stack traces

### Requirement 4

**User Story:** As a developer, I want to import existing code into visual flows, so that I can visualize and modify my existing codebase.

#### Acceptance Criteria

1. WHEN a user imports code files THEN the system SHALL analyze function calls and create corresponding nodes and edges
2. WHEN imported code contains nested functions or classes THEN the system SHALL create appropriate parent-child node relationships
3. WHEN imported code has external dependencies THEN the system SHALL identify and handle them appropriately
4. WHEN the analysis is complete THEN the system SHALL present a visual flow that accurately represents the code structure

### Requirement 5

**User Story:** As a developer, I want direct access to the underlying code file that flows represent, so that I can use the code immediately without any export or generation process.

#### Acceptance Criteria

1. WHEN a flow is modified THEN the system SHALL keep the underlying code file constantly updated and synchronized
2. WHEN a user wants to access the code THEN the system SHALL provide direct access to the current code file without any generation step
3. WHEN code changes are made through the visual interface THEN the system SHALL immediately reflect those changes in the actual code file
4. WHEN a user requests code access THEN the system SHALL optionally provide a copy button for convenience, but no export process is required
5. WHEN flows represent visual separation of concerns THEN the underlying code file SHALL remain as the single source of truth

### Requirement 6

**User Story:** As a developer, I want process visualization during execution with proper sequencing, so that I can see the visual flow before function calls execute while maintaining code integrity.

#### Acceptance Criteria

1. WHEN process visualization is enabled THEN the system SHALL intercept function calls and defer their execution until visualization completes
2. WHEN a node function calls another node function THEN the system SHALL first display the visual transition across the edge, then execute the called function
3. WHEN the visual transition completes THEN the system SHALL proceed with the actual function call execution
4. WHEN a function call completes THEN the system SHALL allow the calling function to continue with its remaining code
5. WHEN visualization is active THEN the system SHALL highlight active nodes and animate edge transitions before each function execution
6. WHEN execution involves nested function calls THEN the system SHALL maintain proper sequencing for each level of the call stack
7. WHEN errors occur during visualization THEN the system SHALL complete the visual sequence before propagating the error

### Requirement 7

**User Story:** As a developer, I want flows to represent single code files with AST-based parsing, so that each function becomes a visually manageable node with proper metadata extraction.

#### Acceptance Criteria

1. WHEN a JavaScript file is imported THEN the system SHALL use Babel/standalone to parse it into an AST with comments preserved
2. WHEN functions are detected in the AST THEN the system SHALL create nodes for each function using block comments above functions as descriptions
3. WHEN a flow represents a file THEN each node SHALL maintain references to the specific function name and file location
4. WHEN external file dependencies are detected THEN the system SHALL represent them as child nodes of the calling function within the current flow
5. WHEN function calls within the same file are detected THEN the system SHALL create edges between corresponding nodes

### Requirement 8

**User Story:** As a developer, I want flow-level variables and configuration, so that flows can be treated as nodes in other flows with configurable parameters.

#### Acceptance Criteria

1. WHEN a flow contains variables THEN the system SHALL make them configurable similar to node data configuration
2. WHEN a flow is used as a node in another flow THEN the system SHALL expose its variables as configurable parameters
3. WHEN flow variables are modified THEN the system SHALL update all dependent nodes and edges accordingly
4. WHEN a flow has a description THEN the system SHALL display it prominently similar to node descriptions
5. WHEN flows are nested THEN the system SHALL maintain proper variable scoping and access control

### Requirement 9

**User Story:** As a developer, I want simplified visual representation with essential information, so that flows remain clean and focused on core functionality.

#### Acceptance Criteria

1. WHEN displaying nodes THEN the system SHALL show only the function description and title by default
2. WHEN block comments exist above functions THEN the system SHALL use them as node descriptions and titles
3. WHEN detailed information is needed THEN the system SHALL provide expandable views or panels for full code access
4. WHEN flows become complex THEN the system SHALL provide filtering and grouping options to maintain clarity
5. WHEN nodes are selected THEN the system SHALL reveal additional details without cluttering the main view

### Requirement 10

**User Story:** As a developer, I want automatic code analysis and edge management, so that my visual representation stays synchronized with my code changes.

#### Acceptance Criteria

1. WHEN node code is modified THEN the system SHALL re-analyze function calls and update edges accordingly
2. WHEN new function calls are detected THEN the system SHALL create new edges automatically
3. WHEN function calls are removed THEN the system SHALL remove obsolete edges automatically
4. WHEN node names change THEN the system SHALL update all references and function calls accordingly
5. WHEN scope violations are detected THEN the system SHALL highlight the issues and suggest corrections

### Requirement 11

**User Story:** As a content creator, I want to control function execution on a per-node basis, so that I can create course structures and content flows without unwanted execution during design and visualization.

#### Acceptance Criteria

1. WHEN a node is marked as inactive THEN the system SHALL prevent its function from executing while maintaining visual flow representation
2. WHEN a user lacks permissions for a specific node THEN the system SHALL block execution of that node's function
3. WHEN execution mode is set to "visualization only" THEN the system SHALL show visual transitions without executing the actual function calls
4. WHEN course functions call subsequent courses (e.g., course1() → course2()) THEN the system SHALL allow visual sequence representation without automatic execution of subsequent courses
5. WHEN a node has execution guards enabled THEN the system SHALL check permissions and active status before allowing function execution
6. WHEN execution is blocked THEN the system SHALL provide clear feedback about why the function was not executed
7. WHEN switching between execution modes THEN the system SHALL maintain visual flow consistency while respecting execution controls

### Requirement 12

**User Story:** As a content creator, I want to build course structures and content generation systems using JavaScript functions, so that I can create educational content with proper sequencing and utility functions.

#### Acceptance Criteria

1. WHEN creating course structure files THEN the system SHALL support functions that represent courses, modules, and content utilities
2. WHEN course functions call other course functions THEN the system SHALL represent sequential relationships visually while allowing execution control
3. WHEN course functions call content utility functions (e.g., generateMCQQuestions, gradeAssignments) THEN the system SHALL represent these as functional dependencies with normal execution
4. WHEN building course sequences THEN the system SHALL distinguish between sequential relationships (course1 → course2) and functional calls (course1 → createModule)
5. WHEN content utility functions are called THEN the system SHALL execute them normally as they perform actual content generation work
6. WHEN visualizing course structures THEN the system SHALL provide clear visual distinction between course sequencing and content creation functions