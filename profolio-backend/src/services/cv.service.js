const Anthropic = require('@anthropic-ai/sdk');
const supabase = require('../config/db');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const generateCV = async (user_id) => {
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

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select(`
      *,
      projects (*),
      skills (*),
      certifications (*),
      experiences (*),
      achievements (*)
    `)
    .eq('user_id', user_id)
    .single();

  const { data: aiEval } = await supabase
    .from('ai_evaluations')
    .select('*')
    .eq('portfolio_id', portfolio?.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const typingResult = assessments?.find(a => a.assessment_type === 'typing');
  const codingResult = assessments?.find(a => a.assessment_type === 'coding');

  const prompt = `
You are a professional CV writer specializing in tech students and fresh graduates in computer-related fields.

Generate a comprehensive, professional CV based on the student's portfolio data, assessment scores, and AI evaluation.

STUDENT PROFILE:
${JSON.stringify(profile, null, 2)}

PORTFOLIO DATA:
${JSON.stringify(portfolio, null, 2)}

ASSESSMENT RESULTS:
- Typing Speed: ${typingResult?.score ?? 'Not yet taken'} WPM
- Coding Assessment: ${codingResult?.score ?? 'Not yet taken'}%
- Other Assessments: ${JSON.stringify(assessments?.filter(a => !['typing','coding'].includes(a.assessment_type)), null, 2)}

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

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content[0].text;
  const cleanJson = responseText.replace(/```json|```/g, '').trim();
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