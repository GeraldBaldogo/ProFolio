const { rubricPrompt, scoreFromCriteria, normalizeCriteria } = require('../utils/rubrics');
const { getModel } = require('../utils/gemini');
const assessmentRepo = require('../repositories/assessment.repo');
const testRepo = require('../repositories/test.repo');
const { assertNotOverdue } = require('./test.service');
const progress = require('./progress.service');
const { findTopic } = require('../utils/curriculum');
const { verifiedTitle } = require('../utils/titles');

// ─── PROMPTS ──────────────────────────────────────────────────────────────────
// Used for free practice only. When a professor assigns a communication test,
// their own prompt is sent from the page instead.

// The prompts now live in utils/curriculum.js — three per level, one per
// topic — so a passed prompt counts toward unlocking the next level.

// ─── GET PROMPT ──────────────────────────────────────────────────────────────

const getCommunicationPrompt = async (user_id, { difficulty = 'easy', topic: requestedTopic = null } = {}) => {
  const { difficulty: level, topic } = await progress.beginPractice(user_id, 'communication', difficulty, requestedTopic);
  return {
    id: topic.key,
    title: topic.title,
    prompt: topic.prompt,
    criteria: topic.criteria,
    difficulty: level,
    topic: { key: topic.key, label: topic.label },
    time_limit_minutes: level === 'easy' ? 5 : level === 'medium' ? 8 : 12,
  };
};

// ─── SUBMIT ──────────────────────────────────────────────────────────────────

const submitCommunicationResult = async (
  user_id,
  {
    difficulty = 'easy', prompt_id, prompt_title, prompt_text, response_text, time_taken_seconds,
    violation_count = 0, camera_violation_count = 0, session_id = null,
    test_id = null, rubric = [],
    unproctored = false, unproctored_reason = null
  }
) => {
  if (!response_text || response_text.trim().length < 10)
    throw { status: 400, message: 'response_text is required and must be meaningful.' };

  // A student may only submit against a test that was actually assigned to
  // them, and only once. Without this, anyone could post a test_id and attach
  // a result to a test they were never given.
  if (test_id) {
    const assignment = await testRepo.findAssignment(test_id, user_id);
    if (!assignment) {
      throw { status: 403, message: 'This test was not assigned to you.' };
    }
    if (assignment.status === 'submitted') {
      throw { status: 400, message: 'You have already submitted this test.' };
    }
    assertNotOverdue(assignment);
  }

  // The prompt being answered comes from the server, never from the page.
  // Otherwise a student could submit an answer to an easier question under a
  // harder prompt's id — or rewrite a professor's prompt before submitting.
  let topicKey = null;
  let criteria;

  if (test_id) {
    const test = await testRepo.findById(test_id);
    const cfg = test?.config || {};
    prompt_text = cfg.prompt || prompt_text;
    const testRubric = Array.isArray(cfg.rubric) && cfg.rubric.length ? cfg.rubric : rubric;
    criteria = Array.isArray(testRubric) && testRubric.length
      ? testRubric.join(', ')
      : 'clarity, professionalism, completeness';
  } else {
    const topic = findTopic('communication', prompt_id);
    if (!topic) throw { status: 400, message: 'Unknown prompt.' };

    // A prompt from a level that hasn't been opened yet doesn't count — and
    // isn't marked, since marking it would spend a request for nothing.
    const p = await progress.getProgress(user_id, 'communication');
    progress.assertUnlocked(p, topic.level);

    topicKey = topic.key;
    difficulty = topic.level;
    prompt_title = topic.title;
    prompt_text = topic.prompt;
    criteria = topic.criteria;
  }

  const prompt = `You are evaluating a student's written communication skill for a portfolio assessment platform.

Prompt given to student: "${prompt_text}"
Evaluation criteria: ${criteria}
Difficulty: ${difficulty}
Student response:
"""
${response_text}
"""

${rubricPrompt('communication')}
Report those four as clarity_score, structure_score, professionalism_score and grammar_score.

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

  const model = getModel({
    model: 'gemini-3.6-flash',
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
  // Weighted by utils/rubrics.js from the four criterion scores
  const criterionScores = {
    clarity: aiResult.clarity_score,
    structure: aiResult.structure_score,
    professionalism: aiResult.professionalism_score,
    grammar: aiResult.grammar_score,
  };
  const rubricScore = scoreFromCriteria('communication', criterionScores, aiResult.skill_score);
  const finalScore = Math.max(0, rubricScore - penalty);

  const result = await assessmentRepo.saveResult({
    user_id,
    type: 'communication',
    score: finalScore,
    session_id,
    test_id,
    metadata: {
      criteria: normalizeCriteria('communication', criterionScores),
      difficulty,
      topic: topicKey,
      prompt_id,
      prompt_title,
      prompt_text,
      response_text,
      time_taken_seconds,
      violation_count,
      camera_violation_count,
      penalty_applied: penalty,
      ai_score: rubricScore,
      clarity_score: aiResult.clarity_score,
      professionalism_score: aiResult.professionalism_score,
      structure_score: aiResult.structure_score,
      grammar_score: aiResult.grammar_score,
      strengths: aiResult.strengths,
      improvements: aiResult.improvements,
      overall_feedback: aiResult.overall_feedback,
      rubric,
      unproctored,
      unproctored_reason,
    },
  });

  // Closed only after the result is saved, so a failed submission doesn't lock
  // the student out of retrying.
  if (test_id) {
    await testRepo.updateAssignmentStatus(test_id, user_id, 'submitted');
  }

  let title_awarded = null;
  let practice_rank = null;
  if (test_id) {
    const test = await testRepo.findById(test_id);
    const award = verifiedTitle('communication', test?.config?.level, finalScore);
    title_awarded = award && { label: award.label, level: award.level, test_level: test?.config?.level || 'easy' };
  } else {
    practice_rank = (await progress.getProgress(user_id, 'communication')).rank;
  }

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
    title_awarded,
    practice_rank,
  };
};

module.exports = { getCommunicationPrompt, submitCommunicationResult };