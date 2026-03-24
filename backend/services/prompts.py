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
{json.dumps(flow_topics, indent=2)}

==============================
EXPECTED TOPICS FOUND IN USER FLOW
==============================
{json.dumps(matching_topics, indent=2)}

==============================
EXPECTED TOPICS MISSING FROM USER FLOW
==============================
{json.dumps(missing_topics, indent=2)}

==============================
FLOW GRAPH JSON
==============================
{flow_json}

==============================
SCORING FACTS (PRECOMPUTED)
==============================
Total expected topics: {total_db}
Missing MAIN topics: {missing_main_count}
Missing DETAILS across matched topics: {missing_detail_count}

IMPORTANT RULES:
- DO NOT recompute missing topics.
- DO NOT add or remove topics from the missing list.
- The missing counts above are authoritative.

==============================
SCORING GUIDELINES
==============================

The completeness score must follow this logic:

Base score = 1.0

Penalties:
- Missing MAIN topic penalty = up to 0.70 total
- Missing DETAIL penalty = up to 0.30 total

Main topic penalty calculation:
missing_main_penalty = min(0.70, missing_main_count * (0.70 / total_expected_topics))

Detail penalty calculation:
detail_penalty = min(0.30, missing_detail_count * 0.06)

Final score formula:
score = max(0.0, 1.0 - missing_main_penalty - detail_penalty)

Round the score to two decimals.

==============================
VALIDATION TASK
==============================

Evaluate the student's flow graph based on:

1. Whether the included topics are relevant to the course material.
2. Whether the connections between topics are logically correct.
3. Which important topics are missing (based ONLY on the provided missing list).
4. Whether the graph structure reflects the conceptual relationships in the context.

==============================
OUTPUT FORMAT
==============================

Return ONLY valid JSON with this structure:

{{
  "feedback": "<clear explanation of strengths, missing topics, and structural issues>",
  "points": <score between 0.0 and 1.0 rounded to two decimals>
}}

DO NOT include markdown.
DO NOT include extra text.
DO NOT recompute missing topics.
"""
