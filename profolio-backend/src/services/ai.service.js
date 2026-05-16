const Anthropic = require('@anthropic-ai/sdk');
const portfolioRepo = require('../repositories/portfolio.repo');
const supabase = require('../config/db');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const evaluatePortfolio = async (portfolio_id) => {
  const portfolio = await portfolioRepo.findById(portfolio_id);
  if (!portfolio) throw { status: 404, message: 'Portfolio not found.' };

  const prompt = `
You are an expert evaluator for student portfolios in computer-related fields.
Evaluate the following student portfolio and provide structured feedback.

PORTFOLIO DATA:
Projects: ${JSON.stringify(portfolio.projects, null, 2)}
Skills: ${JSON.stringify(portfolio.skills, null, 2)}
Certifications: ${JSON.stringify(portfolio.certifications, null, 2)}
Experiences: ${JSON.stringify(portfolio.experiences, null, 2)}
Achievements: ${JSON.stringify(portfolio.achievements, null, 2)}

Provide your evaluation in the following JSON format only, no other text:
{
  "overall_score": <number from 1-100>,
  "strengths": "<what the student is doing well>",
  "weaknesses": "<areas that need improvement>",
  "suggestions": "<specific actionable suggestions to improve the portfolio>",
  "skill_scores": {
    "<skill_name>": <score from 1-10>
  },
  "project_scores": {
    "<project_title>": <score from 1-10>
  }
}
`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content[0].text;
  const cleanJson = responseText.replace(/```json|```/g, '').trim();
  const evaluation = JSON.parse(cleanJson);

  const { data, error } = await supabase
    .from('ai_evaluations')
    .insert([{
      portfolio_id,
      overall_score: evaluation.overall_score,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      suggestions: evaluation.suggestions,
      skill_scores: evaluation.skill_scores,
      project_scores: evaluation.project_scores,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const getEvaluation = async (portfolio_id) => {
  const { data, error } = await supabase
    .from('ai_evaluations')
    .select('*')
    .eq('portfolio_id', portfolio_id)
    .single();
  if (error) throw { status: 404, message: 'No AI evaluation found for this portfolio.' };
  return data;
};

module.exports = { evaluatePortfolio, getEvaluation };