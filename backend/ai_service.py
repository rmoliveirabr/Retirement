import os
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def build_system_context(profile: Dict[str, Any], results: List[Dict[str, Any]]) -> str:
    """
    Builds the system context using the profile data and calculation results.
    """
    profile_summary = "\n".join([f"- {k}: {v}" for k, v in profile.items()])
    
    # Smart sampling of results to avoid token overflow while keeping context
    total_rows = len(results)
    if total_rows <= 20:
        sample_results = results
    else:
        # Take first 5, last 5, and some in between
        first_5 = results[:5]
        last_5 = results[-5:]
        
        # Pick 10 evenly spaced items from the middle
        middle_count = 10
        middle_start = 5
        middle_end = total_rows - 5
        step = max(1, (middle_end - middle_start) // middle_count)
        middle_indices = range(middle_start, middle_end, step)
        middle_rows = [results[i] for i in middle_indices][:middle_count]
        
        sample_results = first_5 + middle_rows + last_5
    results_summary = "\n".join([str(r) for r in sample_results])

    return f"""
You are a financial planning assistant specialized in retirement advice.
Use the following profile data and projections to answer the user's question clearly.

Profile Information:
{profile_summary}

Retirement Projection Summary (partial):
{results_summary}

Provide a concise answer.
Avoid generic explanations or repeating the question.
Focus only on actionable, realistic advice related to this scenario.
If appropriate, use Markdown for light formatting (e.g., **bold**, bullet lists).
Answer in the same language as the question.

IMPORTANT: If the user asks for a specific number of items (e.g., "1 tip", "3 recommendations"), YOU MUST STRICTLY ADHERE TO THAT NUMBER. Do not provide more than requested.
""".strip()

def generate_ai_response(profile: Dict[str, Any], results: List[Dict[str, Any]], question: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, str]:
    """
    Sends a request to OpenAI API using the built prompt and history.
    Returns the AI-generated text as a dictionary.
    """
    system_context = build_system_context(profile, results)
    
    messages = [{"role": "system", "content": system_context}]
    
    if history:
        for msg in history:
            if msg.get("role") in ["user", "assistant"] and msg.get("content"):
                messages.append({"role": msg["role"], "content": msg["content"]})
    
    messages.append({"role": "user", "content": question})

    response = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4-turbo"),
        messages=messages,
        temperature=0.7,
        max_tokens=1000,
    )

    answer = response.choices[0].message.content.strip()
    return {"answer": answer}
