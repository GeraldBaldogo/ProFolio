const { GoogleGenerativeAI } = require('@google/generative-ai');
const supabase = require('../config/db');
const portfolioRepo = require('../repositories/portfolio.repo');
const projectRepo = require('../repositories/project.repo');
const skillRepo = require('../repositories/skill.repo');
const certificationRepo = require('../repositories/certification.repo');
const experienceRepo = require('../repositories/experience.repo');
const achievementRepo = require('../repositories/achievement.repo');
const assessmentRepo = require('../repositories/assessment.repo');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateCV = async (user_id) => {
  // Bug fix: 'profiles' table doesn't exist. User data actually lives across
  // 'users' (full_name, email) and 'student_profiles' (course, school,
  // year_level, phone, location, linkedin, github).
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

  // Bug fix: 'portfolios' has no 'user_id' column - it's linked via
  // student_profiles.id (student_id), not users.id directly.
  const portfolios = await portfolioRepo.findByStudentId(studentProfile.id);
  const portfolio = portfolios?.[0]; // most recent, findByStudentId already orders desc
  if (!portfolio) throw { status: 404, message: 'No portfolio found. Please create a portfolio first.' };

  // Bug fix: portfolioRepo.findById never returns nested projects/skills/etc -
  // fetch each via its own repo, same fix as ai.service.js.
  const [projects, skills, certifications, experiences, achievements] = await Promise.all([
    projectRepo.findByPortfolioId(portfolio.id),
    skillRepo.findByPortfolioId(portfolio.id),
    certificationRepo.findByPortfolioId(portfolio.id),
    experienceRepo.findByPortfolioId(portfolio.id),
    achievementRepo.findByPortfolioId(portfolio.id),
  ]);

  const assessments = await assessmentRepo.getResultsByUser(user_id);

  const { data: aiEval } = await supabase
    .from('ai_evaluations')
    .select('*')
    .eq('portfolio_id', portfolio.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Bug fix: column is 'type', not 'assessment_type'. And the coding
  // assessment's type is 'programming', not 'coding' (matches
  // assessment.service.js's actual saved value).
  const typingResult = assessments?.find(a => a.type === 'typing');
  const programmingResult = assessments?.find(a => a.type === 'programming');
  const otherAssessments = assessments?.filter(a => !['typing', 'programming'].includes(a.type));

  const profileForPrompt = {
    full_name: user.full_name,
    email: user.email,
    course: studentProfile.course,
    school: studentProfile.school,
    year_level: studentProfile.year_level,
    phone: studentProfile.phone,
    location: studentProfile.location,
    linkedin: studentProfile.linkedin,
    github: studentProfile.github,
  };

  const prompt = `
You are a professional CV writer specializing in tech students and fresh graduates in computer-related fields.

Generate a comprehensive, professional CV based on the student's portfolio data, assessment scores, and AI evaluation.

STUDENT PROFILE:
${JSON.stringify(profileForPrompt, null, 2)}

PORTFOLIO DATA:
Projects: ${JSON.stringify(projects, null, 2)}
Skills: ${JSON.stringify(skills, null, 2)}
Certifications: ${JSON.stringify(certifications, null, 2)}
Experiences: ${JSON.stringify(experiences, null, 2)}
Achievements: ${JSON.stringify(achievements, null, 2)}

ASSESSMENT RESULTS:
- Typing Speed: ${typingResult?.score ?? 'Not yet taken'} WPM
- Programming Assessment: ${programmingResult?.score ?? 'Not yet taken'}%
- Other Assessments: ${JSON.stringify(otherAssessments, null, 2)}

AI PORTFOLIO EVALUATION:
${JSON.stringify(aiEval, null, 2)}

Generate a structured CV in the following JSON format only, no other text:
{
  "personal_info": {
    "full_name": "<from profile>",
    "email": "<from profile>",
    "phone": "<from profile or null>",
    "location": "<from profile or null>",
    "linkedin": "<from profile or null>",
    "github": "<from profile or null>"
  },
  "professional_summary": "<2-3 sentence compelling summary tailored to their actual skills and experience>",
  "performance_indicators": {
    "typing_speed": "<X WPM or Not assessed>",
    "programming_proficiency": "<percentage or Not assessed>",
    "overall_portfolio_score": "<score from AI evaluation or Not assessed>",
    "communication_score": "<score or Not assessed>"
  },
  "validated_skills": [
    {
      "skill": "<skill name>",
      "level": "<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'>",
      "validated_by": "<'Assessment' | 'AI Evaluation' | 'Portfolio' | 'Certification'>"
    }
  ],
  "projects": [
    {
      "title": "<project title>",
      "description": "<brief impactful description>",
      "technologies": ["<tech1>", "<tech2>"],
      "role": "<role in the project>",
      "highlights": "<key achievement or impact of this project>"
    }
  ],
  "certifications": [
    {
      "name": "<cert name>",
      "issuer": "<issuer>",
      "date": "<date or null>"
    }
  ],
  "experiences": [
    {
      "title": "<job/internship title>",
      "company": "<company name>",
      "duration": "<e.g. Jun 2024 - Aug 2024>",
      "description": "<key responsibilities and achievements>"
    }
  ],
  "achievements": ["<achievement 1>", "<achievement 2>"],
  "education": {
    "degree": "<from profile>",
    "school": "<from profile>",
    "year": "<from profile or null>"
  }
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
    .from('generated_cvs')
    .insert([{
      user_id,
      cv_data: result,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const getLatestCV = async (user_id) => {
  const { data, error } = await supabase
    .from('generated_cvs')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw { status: 404, message: 'No generated CV found for this user.' };
  return data;
};

const getCVHistory = async (user_id) => {
  const { data, error } = await supabase
    .from('generated_cvs')
    .select('id, created_at, cv_data->personal_info')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

module.exports = { generateCV, getLatestCV, getCVHistory };