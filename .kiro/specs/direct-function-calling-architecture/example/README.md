# LMS Course Structure Example

This directory contains examples of JavaScript files that represent course structures and content flows, demonstrating how the Direct Function Calling Architecture can be used for educational content management.

## Files

### `lms-course-structure.js`
A comprehensive Learning Management System flow that demonstrates:

- **Course Sequencing**: `course0() → course1() → course2()`
- **Instance Management**: Multiple learning paths within courses
- **Module Progression**: Sequential and conditional module access
- **Content Generation**: Utility functions for creating educational content
- **Data Integration**: Functions that connect to data sources
- **Assessment Tools**: MCQ generation and grading utilities

## Visual Flow Mapping

The JavaScript file maps to visual flow elements as follows:

### **Course Level (Vertical Connections - Sequential)**
```javascript
course0() → course1() → course2()  // Course sequence
```

### **Instance Level (Nested within Courses)**
```javascript
course0() {
  instance0();  // ← Horizontal connection (functional call)
  instance1();  // ← Horizontal connection (functional call)
}
```

### **Module Level (Nested within Instances)**
```javascript
instance0() {
  module1Instance0();  // ← Sequential progression
  module2Instance0();  // ← Sequential progression
}

instance1() {
  module1Instance1();  // ← Parallel access
  module2Instance1();  // ← Parallel access
  if (checkPointsThreshold()) {
    module3Instance1();  // ← Conditional progression
  }
}
```

### **Content Generation (Horizontal Connections - Functional)**
```javascript
module1Instance0() {
  const data = getDataModule1();        // ← Data utility
  const article = createArticle1(data); // ← Content utility
}

module2Instance0() {
  const data1 = getDataModule2Source1();     // ← Data utility
  const data2 = getDataModule2Source2();     // ← Data utility
  const mcq = createMCQExercise(data1, data2); // ← Content utility
}
```

## Function Types and Connection Rules

### **Course Functions** (Sequential Connections)
- Pattern: `course[0-9]+()` or `[courseName]Course()`
- Connections: Vertical edges for course progression
- Execution Control: Can be set to "visualization only" to show sequence without auto-execution

### **Module Functions** (Mixed Connections)
- Pattern: `module[0-9]+[InstanceName]()` or `create[ModuleName]()`
- Connections: 
  - Vertical edges for module sequence within instances
  - Horizontal edges for calling utility functions

### **Utility Functions** (Functional Connections)
- Patterns: `get*()`, `create*()`, `generate*()`, `grade*()`, `setup*()`
- Connections: Horizontal edges from modules/courses
- Execution: Normal function execution (not blocked)

## Execution Control Examples

### **Course Sequencing (Controlled Execution)**
```javascript
function course0() {
  // ... course content ...
  
  course1(); // ← This call can be intercepted and blocked
             //   Shows visual sequence without executing course1
}
```

### **Content Generation (Normal Execution)**
```javascript
function module1Instance0() {
  const data = getDataModule1();        // ← Executes normally
  const article = createArticle1(data); // ← Executes normally
}
```

### **Conditional Progression**
```javascript
function instance1() {
  module1Instance1();
  module2Instance1();
  
  // Conditional execution based on performance
  if (checkPointsThreshold()) {  // ← Executes normally
    module3Instance1();          // ← Can be controlled separately
  }
}
```

## Usage Examples

### **Run Complete Course Flow**
```javascript
// Execute the entire LMS flow
const result = startLMSFlow();
```

### **Run Individual Components**
```javascript
// Execute specific course
const course = course0();

// Generate content utilities
const questions = generateMCQQuestions(10);
const rubric = setupGradingRubric();
```

### **Visualization Mode**
```javascript
// Set course functions to visualization-only mode
// This shows the course sequence visually without executing subsequent courses
setExecutionMode('course1', 'visualization');
setExecutionMode('course2', 'visualization');

// Now course0() will show the flow but won't auto-execute course1 and course2
course0();
```

## Benefits of This Approach

1. **Real JavaScript**: The file is executable JavaScript that can be run directly
2. **Visual Representation**: Each function becomes a node in the visual flow
3. **Execution Control**: Course progression can be controlled without breaking the code
4. **Content Generation**: Utility functions work normally for creating educational content
5. **Flexible Structure**: Supports complex course hierarchies and conditional logic
6. **Single Source of Truth**: The JavaScript file is both the visual flow and the executable code

This example demonstrates how the Direct Function Calling Architecture can serve both traditional code visualization and educational content management use cases within a single, coherent system.