const { GoogleGenerativeAI } = require('@google/generative-ai');
const portfolioRepo = require('../repositories/portfolio.repo');
const portfolioService = require('./portfolio.service');
const projectRepo = require('../repositories/project.repo');
const skillRepo = require('../repositories/skill.repo');
const certificationRepo = require('../repositories/certification.repo');
const experienceRepo = require('../repositories/experience.repo');
const achievementRepo = require('../repositories/achievement.repo');
const supabase = require('../config/db');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const evaluatePortfolio = async (portfolio_id) => {
  const portfolio = await portfolioRepo.findById(portfolio_id);
  if (!portfolio) throw { status: 404, message: 'Portfolio not found.' };

  const [projects, skills, certifications, experiences, achievements] = await Promise.all([
    projectRepo.findByPortfolioId(portfolio_id),
    skillRepo.findByPortfolioId(portfolio_id),
    certificationRepo.findByPortfolioId(portfolio_id),
    experienceRepo.findByPortfolioId(portfolio_id),
    achievementRepo.findByPortfolioId(portfolio_id),
  ]);

  const prompt = `
You are an expert evaluator for student portfolios in computer-related fields.
Evaluate the following student portfolio and provide structured feedback.

PORTFOLIO DATA:
Projects: ${JSON.stringify(projects, null, 2)}
Skills: ${JSON.stringify(skills, null, 2)}
Certifications: ${JSON.stringify(certifications, null, 2)}
Experiences: ${JSON.stringify(experiences, null, 2)}
Achievements: ${JSON.stringify(achievements, null, 2)}

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

  const model = genAI.getGenerativeModel({
    model: 'gemini-3.6-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const geminiResult = await model.generateContent(prompt);
  const cleanJson = geminiResult.response.text().replace(/```json|```/g, '').trim();
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

  await supabase
    .from('portfolios')
    .update({ status: 'ai_reviewed' })
    .eq('id', portfolio_id);

  return data;
};

// Fix: previously had no ownership check at all - any authenticated user
// could view any portfolio's AI evaluation just by knowing the portfolio_id.
const getEvaluation = async (portfolio_id, requestingUser) => {
  const portfolio = await portfolioRepo.findById(portfolio_id);
  if (!portfolio) throw { status: 404, message: 'Portfolio not found.' };
  await portfolioService.assertCanAccessPortfolio(portfolio, requestingUser);

  const { data, error } = await supabase
    .from('ai_evaluations')
    .select('*')
    .eq('portfolio_id', portfolio_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw { status: 404, message: 'No AI evaluation found for this portfolio.' };
  return data;
};

module.exports = { evaluatePortfolio, getEvaluation };