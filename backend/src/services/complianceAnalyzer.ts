import Anthropic from '@anthropic-ai/sdk';
import type { ComplianceAnalysis } from '../types/index.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const COMPLIANCE_PROMPT = `You are an expert HR compliance auditor. Analyze the following HR policy document for compliance issues, regulatory gaps, missing clauses, and jurisdiction-specific requirements.

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
`;

export async function analyzeCompliance(documentContent: string, documentTitle: string): Promise<ComplianceAnalysis> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${COMPLIANCE_PROMPT}\n\nDocument Title: ${documentTitle}\n\n${documentContent.substring(0, 100000)}`
        }
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const analysis: ComplianceAnalysis = JSON.parse(jsonMatch[0]);

    // Validate and ensure we have at least a basic structure
    if (!analysis.issues || !Array.isArray(analysis.issues)) {
      analysis.issues = [];
    }

    if (!analysis.summary) {
      analysis.summary = 'Compliance analysis completed.';
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing compliance:', error);
    throw error;
  }
}
