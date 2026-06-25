const Anthropic = require('@anthropic-ai/sdk');
const supabase = require('../config/db');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const generateRecommendations = async (user_id) => {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user_id)
    .single();

  if (profileError) throw { status: 404, message: 'User profile not found.' };

  const { data: assessments } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  const { data: aiEval } = await supabase
    .from('ai_evaluations')
    .select('*')
    .eq('portfolio_id', profile.portfolio_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const prompt = `
You are a personalized learning advisor for students in computer-related fields.

Based on the student's profile, assessment results, and AI portfolio evaluation, generate specific and actionable learning recommendations to close their skill gaps.

STUDENT PROFILE:
${JSON.stringify(profile, null, 2)}

ASSESSMENT RESULTS:
${JSON.stringify(assessments, null, 2)}

LATEST AI PORTFOLIO EVALUATION:
${JSON.stringify(aiEval, null, 2)}

Generate personalized recommendations in the following JSON format only, no other text:
{
  "overall_summary": "<brief summary of the student's current standing and main areas for improvement>",
  "skill_gaps": ["<skill 1>", "<skill 2>", "<skill 3>"],
  "courses": [
    {
      "title": "<course title>",
      "provider": "<e.g. Coursera, Udemy, freeCodeCamp>",
      "url": "<course URL if known, else null>",
      "duration": "<estimated duration>",
      "addresses_gap": "<which skill gap this closes>",
      "priority": "<'high' | 'medium' | 'low'>"
    }
  ],
  "training_modules": [
    {
      "title": "<module title>",
      "description": "<what the student will practice>",
      "addresses_gap": "<which skill gap this closes>",
      "estimated_hours": <number>
    }
  ],
  "certifications": [
    {
      "title": "<certification name>",
      "provider": "<e.g. AWS, Google, CompTIA>",
      "url": "<certification URL if known, else null>",
      "relevance": "<why this certification matters for their profile>",
      "priority": "<'high' | 'medium' | 'low'>"
    }
  ],
  "next_steps": "<top 3 immediate actions the student should take this week>"
}
`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content[0].text;
  const cleanJson = responseText.replace(/```json|```/g, '').trim();
  const result = JSON.parse(cleanJson);

  const { data, error } = await supabase
    .from('recommendations')
    .insert([{
      user_id,
      overall_summary: result.overall_summary,
      skill_gaps: result.skill_gaps,
      courses: result.courses,
      training_modules: result.training_modules,
      certifications: result.certifications,
      next_steps: result.next_steps,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const getLatestRecommendations = async (user_id) => {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw { status: 404, message: 'No recommendations found for this user.' };
  return data;
};

const getAllRecommendations = async (user_id) => {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

module.exports = { generateRecommendations, getLatestRecommendations, getAllRecommendations };