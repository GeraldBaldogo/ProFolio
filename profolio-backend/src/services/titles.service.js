// ─────────────────────────────────────────────────────────────────────────────
// src/services/titles.service.js
//
// A student's practice ranks and verified titles, per assessment type, with
// the full history of every professor test and what it awarded.
//
// Worked out from saved results each time — no titles table to fall out of
// step with the scores.
// ─────────────────────────────────────────────────────────────────────────────

const assessmentRepo = require('../repositories/assessment.repo');
const progress = require('./progress.service');
const { VERIFIED_TITLES, practiceRank, verifiedTitle, ladder } = require('../utils/titles');

const TITLE_TYPES = Object.keys(VERIFIED_TITLES);

const getTitles = async (user_id) => {
  const [allProgress, graded] = await Promise.all([
    progress.getAllProgress(user_id),
    assessmentRepo.getGradedResults(user_id),
  ]);

  const out = {};
  for (const type of TITLE_TYPES) {
    const history = graded
      .filter((r) => r.type === type)
      .map((r) => {
        const award = verifiedTitle(type, r.test?.level, r.score);
        return {
          result_id: r.id,
          test_id: r.test_id,
          test_title: r.test?.title || 'Assigned test',
          test_level: r.test?.level || 'easy',
          professor_name: r.test?.professor_name || null,
          score: r.score,
          awarded_at: r.created_at,
          title: award?.label || null,
          tier: award ? award.tier : -1,
        };
      })
      .sort((a, b) => new Date(b.awarded_at) - new Date(a.awarded_at));

    // Highest title earned, like a certification: a later, lower result
    // doesn't take it away. Ties go to the most recent.
    const best = history
      .filter((h) => h.title)
      .sort((a, b) => b.tier - a.tier || new Date(b.awarded_at) - new Date(a.awarded_at))[0] || null;

    out[type] = {
      practice_rank: practiceRank(type, allProgress[type]),
      verified: best,
      ladder: ladder(type),
      history,
    };
  }
  return out;
};

module.exports = { getTitles, TITLE_TYPES };