import json

def get_extract_topics_prompt(text: str) -> str:
    return f"""
    You are an AI assistant designed to extract key educational topics and their supporting details from text.
    Extract the most important core concepts (topics) and for each topic, provide a list of relevant details or sub-topics.
    
    Format each topic and its details exactly like this:
    Topic: <name of topic 1>
    Details: [<detail 1>, <detail 2>, <detail 3>]
    
    Topic: <name of topic 2>
    Details: [<detail 1>, <detail 2>]
    
    Do not return any other text, JSON, or explanations. Only the topics and details in the format above.
    
    Text:
    {text}
    """

def _fmt_topic_list(topics: list) -> str:
    """Format a list of topic dicts (with 'topic' and 'details' keys) for prompt display."""
    if not topics:
        return "(none)"
    lines = []
    for t in topics:
        name = t.get("topic", "")
        details = t.get("details", [])
        if details:
            lines.append(f"  - {name}: [{', '.join(str(d) for d in details)}]")
        else:
            lines.append(f"  - {name}")
    return "\n".join(lines)


def get_validation_prompt(
    flow_json,
    matching_topics,
    missing_topics,
    flow_topics,
    context,
    total_db,
    missing_main_count,
    missing_detail_count
):

    return f"""
You are an AI assistant that evaluates a student's concept flow graph for an educational exercise.

IMPORTANT: The backend has already computed which topics are matched and missing.
You MUST use these counts exactly and MUST NOT invent additional missing topics.

==============================
COURSE CONTEXT
==============================
{context}

==============================
USER FLOW TOPICS (extracted)
==============================
{json.dumps(flow_topics)}

==============================
EXPECTED TOPICS FOUND IN USER FLOW
==============================
{json.dumps(matching_topics)}

==============================
EXPECTED TOPICS MISSING FROM USER FLOW
==============================
{json.dumps(missing_topics) }

==============================
FLOW GRAPH JSON
==============================
{flow_json}

==============================
SCORING FACTS (PRECOMPUTED)
==============================
Total expected topics: {total_db}
Missing MAIN topics: {missing_main_count}

==============================
SCORING GUIDELINES
==============================

Base score = 1.0
- Missing MAIN topic penalty = up to 1.0 total
missing_main_penalty = min(1.0, missing_main_count * (1.0 / total_expected_topics))
score = max(0.0, 1.0 - missing_main_penalty)
Round the score to two decimals.

EXAMPLE SCORES:
- If missing_main_count = 0 → score = 1.0 (perfect)
- If missing_main_count = 1 and total_expected_topics = 12 → penalty = 0.08 → score = 0.92
- If missing_main_count = 2 and total_expected_topics = 12 → penalty = 0.17 → score = 0.83
- If missing_main_count = 12 and total_expected_topics = 12 → penalty = 1.0 → score = 0.0

==============================
VALIDATION TASK
==============================

Evaluate the student's flow graph based on the following checks:

1. Topic Relevance
   - Determine whether the topics included in the student's graph are relevant to the course context.
   - Check whether the topic descriptions reflect the core meaning of the concepts from the course material.

2. Graph Connection Validation
   Examine the edges in FLOW GRAPH JSON. Each connection is represented as:

   {{
     "source": "Topic A",
     "target": "Topic B"
   }}

   Example edges:

   {{
     "source": "Deep Learning",
     "target": "Neural Networks"
   }}
   {{
     "source": "Machine Learning",
     "target": "Supervised Learning"
   }}
   {{
     "source": "Machine Learning",
     "target": "Unsupervised Learning"
   }}
   {{
     "source": "Machine Learning",
     "target": "Reinforcement Learning"
   }}
   {{
     "source": "Deep Learning",
     "target": "Computer Vision"
   }}
   {{
     "source": "Deep Learning",
     "target": "Natural Language Processing"
   }}

   2.1 Logical Relationships
   - Verify whether the source and target topics have a valid conceptual relationship based on the course context.

   2.2 Direction of Relationships
   - Confirm the edge direction is logical: broader concepts as source, specific concepts as target.

   2.3 Hierarchical Structure
   - Ensure edges respect the conceptual hierarchy.

   2.4 Cross-Domain Relationships
   - Check whether edges between different domains are meaningful.

   2.5 Incorrect or Illogical Connections
   - Identify edges not supported by the course context.

3. Missing Topic Identification
   - Identify missing topics using ONLY the "EXPECTED TOPICS MISSING FROM USER FLOW" list.

4. Structural Quality of the Graph
   - Evaluate whether the overall graph structure reflects the conceptual relationships in the course context.

   IMPORTANT SCORING NOTE:
   - First, calculate the base score from missing topics only
   - Then, you may adjust the score DOWN by up to 0.15 based on structural quality issues
   - Do NOT adjust the score up - only down if there are issues
   - The final score must still be between 0.0 and 1.0

Provide a clear explanation in the feedback field.

==============================
OUTPUT FORMAT
==============================

Return ONLY valid JSON:

{{
  "feedback": "<clear explanation of strengths, missing topics, and structural issues>",
  "points": <score between 0.0 and 1.0 rounded to two decimals>
}}

DO NOT include markdown.
DO NOT include extra text.
DO NOT recompute missing topics.
"""
