const { GoogleGenerativeAI } = require('@google/generative-ai');
const supabase = require('../config/db');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const geminiResult = await model.generateContent(prompt);
  const cleanJson = geminiResult.response.text().replace(/```json|```/g, '').trim();
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

// Fix: previously had no ownership check at all - any logged-in student
// could view any other student's originality check by ID. Now only the
// owner (or an admin) can view a given check.
const getOriginalityById = async (check_id, requestingUser) => {
  const { data, error } = await supabase
    .from('originality_checks')
    .select('*')
    .eq('id', check_id)
    .single();

  if (error) throw { status: 404, message: 'Originality check not found.' };

  if (requestingUser.role !== 'admin' && data.user_id !== requestingUser.id) {
    throw { status: 403, message: 'You do not have permission to view this originality check.' };
  }

  return data;
};

module.exports = { checkOriginality, getOriginalityHistory, getOriginalityById };