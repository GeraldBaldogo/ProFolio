const { GoogleGenerativeAI } = require('@google/generative-ai');
const supabase = require('../config/db');
const portfolioRepo = require('../repositories/portfolio.repo');
const assessmentRepo = require('../repositories/assessment.repo');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateRecommendations = async (user_id) => {
  // Bug fix: 'profiles' table doesn't exist - same mismatch as cv.service.js
  // had. Real data lives in 'users' + 'student_profiles'.
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('id', user_id)
    .single();
  if (userError || !user) throw { status: 404, message: 'User not found.' };

  const { data: studentProfile, error: profileError } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', user_id)
    .single();
  if (profileError || !studentProfile) {
    throw { status: 404, message: 'Student profile not found. Please complete your profile first.' };
  }

  // Bug fix: student_profiles has no 'portfolio_id' column. A portfolio is
  // linked via portfolios.student_id -> student_profiles.id.
  const portfolios = await portfolioRepo.findByStudentId(studentProfile.id);
  const portfolio = portfolios?.[0]; // most recent

  let aiEval = null;
  if (portfolio) {
    const { data } = await supabase
      .from('ai_evaluations')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    aiEval = data || null;
  }

  const assessments = await assessmentRepo.getResultsByUser(user_id);

  const profileForPrompt = {
    full_name: user.full_name,
    email: user.email,
    course: studentProfile.course,
    school: studentProfile.school,
    year_level: studentProfile.year_level,
  };

  const prompt = `
You are a personalized learning advisor for students in computer-related fields.

Based on the student's profile, assessment results, and AI portfolio evaluation, generate specific and actionable learning recommendations to close their skill gaps.

STUDENT PROFILE:
${JSON.stringify(profileForPrompt, null, 2)}

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

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const geminiResult = await model.generateContent(prompt);
  const cleanJson = geminiResult.response.text().replace(/```json|```/g, '').trim();
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