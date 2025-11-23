import os
import json
from anthropic import Anthropic

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

COMPLIANCE_PROMPT = """You are an expert HR compliance auditor. Analyze the following HR policy document for compliance issues, regulatory gaps, missing clauses, and jurisdiction-specific requirements.

For each issue you identify, provide:
1. Severity: critical, high, medium, low, or info
2. Category: (e.g., "Equal Employment Opportunity", "Workplace Safety", "Data Privacy", "Leave Policies", "Wage & Hour", "Anti-Discrimination", "Harassment Prevention", etc.)
3. Title: A brief, clear title for the issue
4. Description: Detailed explanation of the compliance gap or issue
5. Location: Where in the document this issue appears (if applicable)
6. Recommendation: Specific action to resolve the issue
7. Jurisdiction: Relevant jurisdiction or regulation (e.g., "Federal - FLSA", "California - CCPA", "GDPR", "ADA")

Focus on:
- Missing legally required policies
- Outdated or non-compliant language
- Jurisdiction-specific requirements
- Industry best practices
- Regulatory compliance (EEOC, DOL, OSHA, ADA, FMLA, etc.)
- Data privacy and security requirements
- Anti-discrimination and harassment policies
- Wage and hour compliance

Return your analysis as a JSON object with this structure:
{
  "issues": [
    {
      "severity": "critical|high|medium|low|info",
      "category": "category name",
      "title": "issue title",
      "description": "detailed description",
      "location": "optional location in document",
      "recommendation": "specific recommendation",
      "jurisdiction": "relevant jurisdiction"
    }
  ],
  "summary": "Overall assessment summary with key findings and total issue counts"
}

Document to analyze:
"""

async def analyze_compliance(document_content: str, document_title: str) -> dict:
    """Analyze document for compliance issues using Claude"""
    try:
        message = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": f"{COMPLIANCE_PROMPT}\n\nDocument Title: {document_title}\n\n{document_content[:100000]}"
                }
            ]
        )

        response_text = message.content[0].text

        # Extract JSON from response
        json_start = response_text.find('{')
        json_end = response_text.rfind('}') + 1

        if json_start == -1 or json_end == 0:
            raise ValueError("No valid JSON found in response")

        analysis = json.loads(response_text[json_start:json_end])

        # Validate structure
        if "issues" not in analysis or not isinstance(analysis["issues"], list):
            analysis["issues"] = []

        if "summary" not in analysis:
            analysis["summary"] = "Compliance analysis completed."

        return analysis

    except Exception as e:
        print(f"Error analyzing compliance: {e}")
        raise
