/**
 * LMS Course Structure Example
 * This JavaScript file represents a Learning Management System flow
 * where functions represent courses, modules, and content utilities.
 */

/**
 * Course 0: Main course container
 * Advanced level education course
 */
function course0() {
  console.log("Starting Course 0: Main course container");
  
  // Course setup and content initialization
  const courseContent = getCourseContent();
  const stats = getCourse0Stats();
  
  // Create course instances
  instance0();
  instance1();
  
  // Sequential progression to dependent courses
  course1(); // ← This shows sequence but execution can be controlled
  course2(); // ← Optional dependent course
  
  return {
    title: "Course 0",
    level: "advanced",
    subject: "education",
    content: courseContent,
    stats: stats
  };
}

/**
 * Course 1: Dependent course
 * Follows after Course 0 completion
 */
function course1() {
  console.log("Starting Course 1: Dependent course");
  
  return {
    title: "Course 1",
    level: "advanced",
    subject: "education",
    prerequisites: ["course0"]
  };
}

/**
 * Course 2: Optional dependent course
 * Alternative path after Course 0
 */
function course2() {
  console.log("Starting Course 2: Optional dependent course");
  
  return {
    title: "Course 2",
    level: "advanced", 
    subject: "education",
    prerequisites: ["course0"]
  };
}

/**
 * Instance 0: First course instance
 * Contains modules and learning paths
 */
function instance0() {
  console.log("Initializing Instance 0");
  
  // Sequential module progression
  module1Instance0();
  module2Instance0();
  
  return {
    title: "Instance 0",
    level: "intermediate",
    subject: "education"
  };
}

/**
 * Instance 1: Second course instance
 * Alternative learning path with conditional progression
 */
function instance1() {
  console.log("Initializing Instance 1");
  
  // Parallel module access
  module1Instance1();
  module2Instance1();
  
  // Conditional progression based on performance
  if (checkPointsThreshold()) {
    module3Instance1();
  }
  
  return {
    title: "Instance 1",
    level: "intermediate",
    subject: "education"
  };
}

/**
 * Module 1 - Instance 0
 * First module with data and content
 */
function module1Instance0() {
  console.log("Loading Module 1 - Instance 0");
  
  // Content generation with data
  const data = getDataModule1();
  const article = createArticle1(data);
  
  return {
    title: "Module 1",
    level: "basic",
    subject: "education",
    content: article
  };
}

/**
 * Module 2 - Instance 0  
 * Second module with multiple data sources and MCQ
 */
function module2Instance0() {
  console.log("Loading Module 2 - Instance 0");
  
  // Multiple data sources
  const data1 = getDataModule2Source1();
  const data2 = getDataModule2Source2();
  
  // Generate MCQ exercise
  const mcqExercise = createMCQExercise(data1, data2);
  
  return {
    title: "Module 2",
    level: "basic",
    subject: "education",
    exercise: mcqExercise
  };
}

/**
 * Module 1 - Instance 1
 * First module of alternative instance
 */
function module1Instance1() {
  console.log("Loading Module 1 - Instance 1");
  
  return {
    title: "Module 1",
    level: "basic",
    subject: "education",
    instance: 1
  };
}

/**
 * Module 2 - Instance 1
 * Second module of alternative instance
 */
function module2Instance1() {
  console.log("Loading Module 2 - Instance 1");
  
  return {
    title: "Module 2", 
    level: "basic",
    subject: "education",
    instance: 1
  };
}

/**
 * Module 3 - Instance 1
 * Third module unlocked by performance check
 */
function module3Instance1() {
  console.log("Loading Module 3 - Instance 1 (Performance Unlocked)");
  
  return {
    title: "Module 3",
    level: "basic",
    subject: "education",
    instance: 1,
    unlocked: true
  };
}

// =============================================================================
// UTILITY FUNCTIONS - Content Generation and Data Management
// =============================================================================

/**
 * Utility: Get course content data
 */
function getCourseContent() {
  return {
    type: "course-content",
    level: "advanced",
    subject: "data",
    description: "Course content data"
  };
}

/**
 * Utility: Get Course 0 statistics
 */
function getCourse0Stats() {
  return {
    type: "statistics",
    level: "advanced", 
    subject: "data",
    description: "Course 0 analytics data"
  };
}

/**
 * Utility: Get Module 1 data
 */
function getDataModule1() {
  return {
    type: "data",
    level: "basic",
    subject: "data",
    description: "Module 1 database connection"
  };
}

/**
 * Utility: Create Article 1 content
 */
function createArticle1(data) {
  return {
    type: "article",
    title: "Article 1",
    level: "basic",
    subject: "visualization", 
    description: "This is the first article in Module 1",
    data: data
  };
}

/**
 * Utility: Get Module 2 data source 1
 */
function getDataModule2Source1() {
  return {
    type: "data",
    level: "basic",
    subject: "data",
    description: "Module 2 data source 1"
  };
}

/**
 * Utility: Get Module 2 data source 2
 */
function getDataModule2Source2() {
  return {
    type: "data",
    level: "basic", 
    subject: "data",
    description: "Module 2 data source 2"
  };
}

/**
 * Utility: Create MCQ Exercise
 */
function createMCQExercise(data1, data2) {
  const questions = generateMCQQuestions(5, data1, data2);
  
  return {
    type: "mcq-exercise",
    title: "Exercise: MCQ",
    level: "basic",
    subject: "visualization",
    description: "MCQ exercise in Module 2",
    questions: questions
  };
}

/**
 * Utility: Generate MCQ Questions
 */
function generateMCQQuestions(count, ...dataSources) {
  console.log(`Generating ${count} MCQ questions from ${dataSources.length} data sources`);
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    question: `Question ${i + 1} based on course data`,
    options: ["A", "B", "C", "D"],
    correctAnswer: "A",
    dataSources: dataSources.map(ds => ds.description)
  }));
}

/**
 * Utility: Check points threshold for progression
 * Conditional logic for unlocking Module 3
 */
function checkPointsThreshold() {
  // Simulate student performance check
  const studentPoints = Math.random() * 100;
  const threshold = 50;
  
  console.log(`Student points: ${studentPoints.toFixed(1)}%, Threshold: ${threshold}%`);
  
  return studentPoints > threshold;
}

/**
 * Utility: Grade assignments
 */
function gradeAssignments(submissions) {
  console.log("Grading assignments...");
  
  return submissions.map(submission => ({
    ...submission,
    grade: Math.floor(Math.random() * 100),
    feedback: "Good work! Keep it up."
  }));
}

/**
 * Utility: Setup grading rubric
 */
function setupGradingRubric() {
  return {
    criteria: [
      { name: "Understanding", weight: 0.4 },
      { name: "Application", weight: 0.3 },
      { name: "Analysis", weight: 0.3 }
    ],
    scale: "0-100"
  };
}

// =============================================================================
// MAIN EXECUTION - Course Flow Entry Point
// =============================================================================

/**
 * Main LMS Flow Entry Point
 * This function starts the entire course structure
 */
function startLMSFlow() {
  console.log("🎓 Starting LMS Course Flow");
  
  try {
    // Initialize main course
    const mainCourse = course0();
    
    console.log("✅ LMS Flow completed successfully");
    return mainCourse;
    
  } catch (error) {
    console.error("❌ LMS Flow failed:", error);
    throw error;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    startLMSFlow,
    course0,
    course1, 
    course2,
    generateMCQQuestions,
    gradeAssignments,
    setupGradingRubric
  };
}