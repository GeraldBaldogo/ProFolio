const Anthropic = require('@anthropic-ai/sdk');
const supabase = require('../config/db');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const checkOriginality = async (user_id, content, content_type = 'text') => {
  const prompt = `
You are an expert in detecting AI-generated content and assessing the originality of student work in computer-related fields.

Analyze the following student-submitted content and determine how much of it reflects genuine human authorship versus AI-generated text.

CONTENT TYPE: ${content_type}
SUBMITTED CONTENT:
${content}

Evaluate based on:
- Writing style consistency and natural human quirks
- Depth of personal insight and domain-specific reasoning
- Presence of AI-typical patterns (overly structured, generic phrasing, no personal voice)
- Technical accuracy suggesting real hands-on experience

Provide your analysis in the following JSON format only, no other text:
{
  "originality_score": <number from 0-100, where 100 is fully original human work>,
  "ai_detected_percentage": <number from 0-100>,
  "human_signals": "<specific phrases or patterns that suggest genuine human authorship>",
  "ai_signals": "<specific phrases or patterns that suggest AI generation>",
  "verdict": "<'original' | 'likely_original' | 'mixed' | 'likely_ai' | 'ai_generated'>",
  "explanation": "<clear explanation of the analysis result>",
  "recommendations": "<advice for the student on how to make their work more authentically their own>"
}
`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content[0].text;
  const cleanJson = responseText.replace(/```json|```/g, '').trim();
  const result = JSON.parse(cleanJson);

  const { data, error } = await supabase
    .from('originality_checks')
    .insert([{
      user_id,
      content_type,
      submitted_content: content,
      originality_score: result.originality_score,
      ai_detected_percentage: result.ai_detected_percentage,
      human_signals: result.human_signals,
      ai_signals: result.ai_signals,
      verdict: result.verdict,
      explanation: result.explanation,
      recommendations: result.recommendations,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const getOriginalityHistory = async (user_id) => {
  const { data, error } = await supabase
    .from('originality_checks')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

const getOriginalityById = async (check_id) => {
  const { data, error } = await supabase
    .from('originality_checks')
    .select('*')
    .eq('id', check_id)
    .single();

  if (error) throw { status: 404, message: 'Originality check not found.' };
  return data;
};

module.exports = { checkOriginality, getOriginalityHistory, getOriginalityById };