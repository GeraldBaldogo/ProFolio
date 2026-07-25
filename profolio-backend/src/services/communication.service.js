const { GoogleGenerativeAI } = require('@google/generative-ai');
const assessmentRepo = require('../repositories/assessment.repo');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── PROMPTS ──────────────────────────────────────────────────────────────────

const COMMUNICATION_PROMPTS = {
  easy: [
    {
      id: 'intro_self',
      title: 'Introduce Yourself',
      prompt: 'Write a brief professional self-introduction (3–5 sentences) as if you are meeting a potential employer for the first time. Include your name, your field of study, and one skill or achievement you are proud of.',
      criteria: 'clarity, professional tone, completeness',
    },
    {
      id: 'explain_project',
      title: 'Explain a Project',
      prompt: 'Describe a school project or personal project you worked on. Explain what it does, what technologies you used, and what you learned from building it. Write 3–5 sentences.',
      criteria: 'clarity, technical accuracy, structure',
    },
  ],
  medium: [
    {
      id: 'explain_concept',
      title: 'Explain a Technical Concept',
      prompt: 'Explain what an API is and why it is important in software development. Write your explanation as if you are teaching a non-technical friend. Use an analogy if it helps. Write 4–6 sentences.',
      criteria: 'accuracy, use of analogy, audience awareness, clarity',
    },
    {
      id: 'handle_conflict',
      title: 'Team Communication Scenario',
      prompt: 'Your teammate is not completing their assigned tasks and your group project deadline is in 3 days. Write a short message (4–6 sentences) you would send to them that is professional, direct, and solution-focused.',
      criteria: 'professionalism, empathy, clarity, actionability',
    },
  ],
  hard: [
    {
      id: 'technical_email',
      title: 'Write a Technical Proposal Email',
      prompt: 'Write a professional email to your professor proposing to add a new feature to your thesis system. Explain the feature, why it adds value, and how long it will take to implement. Write a proper email with subject, greeting, body, and closing. Aim for 6–10 sentences.',
      criteria: 'structure, persuasiveness, professionalism, technical clarity, conciseness',
    },
    {
      id: 'documentation',
      title: 'Write a Feature Documentation',
      prompt: 'Write a short documentation section (6–10 sentences) explaining how a user should use a login and registration feature in a web application. Include steps, expected behavior, and what happens if the user enters wrong credentials.',
      criteria: 'structure, completeness, clarity, technical accuracy, user-focus',
    },
  ],
};

// ─── GET PROMPT ──────────────────────────────────────────────────────────────

const getCommunicationPrompt = ({ difficulty = 'easy' } = {}) => {
  const prompts = COMMUNICATION_PROMPTS[difficulty] || COMMUNICATION_PROMPTS.easy;
  const selected = prompts[Math.floor(Math.random() * prompts.length)];
  return {
    ...selected,
    difficulty,
    time_limit_minutes: difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : 12,
  };
};

// ─── SUBMIT ──────────────────────────────────────────────────────────────────

const submitCommunicationResult = async (
  user_id,
  {
    difficulty = 'easy', prompt_id, prompt_title, prompt_text, response_text, time_taken_seconds,
    violation_count = 0, camera_violation_count = 0, session_id = null
  }
) => {
  if (!response_text || response_text.trim().length < 10)
    throw { status: 400, message: 'response_text is required and must be meaningful.' };

  const criteria = COMMUNICATION_PROMPTS[difficulty]?.find((p) => p.id === prompt_id)?.criteria || 'clarity, professionalism, completeness';

  const prompt = `You are evaluating a student's written communication skill for a portfolio assessment platform.

Prompt given to student: "${prompt_text}"
Evaluation criteria: ${criteria}
Difficulty: ${difficulty}
Student response:
"""
${response_text}
"""

Score the student strictly and fairly. Respond with JSON only, no markdown:
{
  "skill_score": number from 0-100,
  "clarity_score": number from 0-10,
  "professionalism_score": number from 0-10,
  "structure_score": number from 0-10,
  "grammar_score": number from 0-10,
  "strengths": "1-2 specific things the student did well",
  "improvements": "1-2 specific areas to improve",
  "overall_feedback": "2-3 sentence holistic evaluation"
}`;

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const geminiResult = await model.generateContent(prompt);
  const raw = geminiResult.response.text().replace(/```json|```/g, '').trim();
  const aiResult = JSON.parse(raw);

  // Anti-cheat penalty — this was previously the only assessment type
  // with zero proctoring integration, despite text-paste being one of
  // the easiest ways to cheat on a written-response test.
  const totalViolations = violation_count + camera_violation_count;
  const penalty = Math.min(totalViolations * 5, 25);
  const finalScore = Math.max(0, aiResult.skill_score - penalty);

  const result = await assessmentRepo.saveResult({
    user_id,
    type: 'communication',
    score: finalScore,
    session_id,
    metadata: {
      difficulty,
      prompt_id,
      prompt_title,
      prompt_text,
      response_text,
      time_taken_seconds,
      violation_count,
      camera_violation_count,
      penalty_applied: penalty,
      ai_score: aiResult.skill_score,
      clarity_score: aiResult.clarity_score,
      professionalism_score: aiResult.professionalism_score,
      structure_score: aiResult.structure_score,
      grammar_score: aiResult.grammar_score,
      strengths: aiResult.strengths,
      improvements: aiResult.improvements,
      overall_feedback: aiResult.overall_feedback,
    },
  });

  return {
    ...result,
    feedback: aiResult.overall_feedback,
    strengths: aiResult.strengths,
    improvements: aiResult.improvements,
    sub_scores: {
      clarity: aiResult.clarity_score,
      professionalism: aiResult.professionalism_score,
      structure: aiResult.structure_score,
      grammar: aiResult.grammar_score,
    },
  };
};

module.exports = { getCommunicationPrompt, submitCommunicationResult };