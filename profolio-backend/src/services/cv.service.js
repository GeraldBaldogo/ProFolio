const { getModel } = require('../utils/gemini');
const supabase = require('../config/db');
const assessmentRepo = require('../repositories/assessment.repo');
const titlesService = require('./titles.service');


const ASSESSMENT_TYPES = ['typing', 'programming', 'flowchart', 'sql', 'bugfix', 'communication'];

const TYPE_LABELS = {
  typing: 'Typing speed and accuracy',
  programming: 'Programming',
  flowchart: 'Process and flowchart design',
  sql: 'SQL and data querying',
  bugfix: 'Debugging',
  communication: 'Written communication',
};

// ── Verified performance ────────────────────────────────────────────────────
// The panel asked for the CV to show performance indicators — typing speed,
// programming proficiency — not only prose. Each professor-set test becomes
// one line: the measurable facts (speed, accuracy, language, level) and a
// proficiency on one scale shared by every assessment type, so "Proficient"
// means the same thing in Typing as it does in SQL.
const PROFICIENCY = [
  { min: 85, label: 'Advanced' },
  { min: 70, label: 'Proficient' },
  { min: 55, label: 'Developing' },
  { min: 0, label: 'Beginning' },
];
const proficiencyFor = (score) => {
  const n = Number(score);
  if (!Number.isFinite(n)) return null;
  return PROFICIENCY.find((p) => n >= p.min).label;
};

const PERFORMANCE_LABELS = {
  typing: 'Typing',
  programming: 'Programming',
  flowchart: 'Flowcharting',
  sql: 'SQL',
  bugfix: 'Debugging',
  communication: 'Communication',
};

const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : s);

// One line of facts per type, from what that assessment actually records.
const performanceDetail = (type, m = {}, level) => {
  const parts = [];
  if (type === 'typing') {
    if (m.wpm != null) parts.push(`${Math.round(m.wpm)} WPM`);
    if (m.accuracy != null) parts.push(`${Math.round(m.accuracy)}% accuracy`);
  }
  if ((type === 'programming' || type === 'bugfix') && m.language) parts.push(m.language);
  if (type === 'communication' && m.topic) parts.push(cap(m.topic));
  if (level) parts.push(`${cap(level)} test`);
  if (type === 'bugfix' && m.bugs_fixed) parts.push(`bugs fixed: ${m.bugs_fixed}`);
  if (type === 'sql' && (m.verified === true || m.matches === true)) parts.push('output verified');
  if (m.unproctored) parts.push('taken without camera');
  // The professor confirmed or adjusted the AI's score (tests/:id review)
  if (m.review) parts.push('reviewed by faculty');
  return parts.join(' · ');
};

// A score is a number the school understands. An employer reads prose. These
// bands are what the AI is given instead of the raw number, so it can describe
// a level of competence without ever printing a mark.
const bandFor = (score) => {
  if (score === null || score === undefined) return null;
  if (score >= 85) return 'strong';
  if (score >= 70) return 'solid';
  if (score >= 55) return 'developing';
  return 'early';
};

/**
 * Generate a narrative CV for a student.
 *
 * Two rules drive everything here:
 *
 * 1. Only professor-set tests count. A practice run can be repeated until it
 *    looks good, so it proves far less than one attempt under a deadline the
 *    professor set. Practice is used only as a fallback when a student has
 *    never been given a graded test of that type.
 *
 * 2. No numbers reach the CV. Employers don't read "SQL: 76". They read what
 *    someone can do. The scores stay inside the system for the professor; the
 *    CV gets the meaning of them.
 */
// "2026-06-01" → "Jun 2026". Anything that isn't a date is shown as typed.
const monthYear = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
};

const periodOf = (e) => {
  const start = monthYear(e.start_date);
  const end = e.is_current ? 'Present' : monthYear(e.end_date);
  if (start && end) return `${start} \u2013 ${end}`;
  return start || end || null;
};

// Each entry gets a key the CV page can use to include or leave it out:
// "profile-<index>" for Profile entries, "exp-<id>" for Portfolio ones.
const mergeExperience = (fromProfile, fromPortfolio) => {
  const own = fromProfile.map((e, i) => ({ ...e, key: `profile-${i}` }));
  const converted = fromPortfolio.map((e) => ({
    key: `exp-${e.id}`,
    role: e.role || null,
    organisation: e.company || null,
    period: periodOf(e),
    summary: e.description || null,
  }));
  const seen = new Set();
  return [...own, ...converted].filter((e) => {
    if (!e || !(e.role || e.organisation)) return false;
    const key = `${(e.role || '').trim().toLowerCase()}|${(e.organisation || '').trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Everything the CV can be built from: the profile, the latest portfolio and
// its items. Shared by generateCV and getCVSources so the list the student
// picks from is exactly what the generator will see.
const loadSources = async (user_id) => {
  // 1. Student profile
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('*, users(full_name, email)')
    .eq('user_id', user_id)
    .single();

  if (!profile) throw { status: 404, message: 'Student profile not found.' };

  // 2. Latest portfolio
  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('*')
    .eq('student_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1);

  const portfolio = portfolios?.[0] || null;

  // 3. Portfolio items
  let projects = [];
  let skills = [];
  let certifications = [];
  let achievements = [];
  let experiences = [];

  if (portfolio) {
    const [projRes, skillRes, certRes, achRes, expRes] = await Promise.all([
      supabase.from('projects').select('*').eq('portfolio_id', portfolio.id),
      supabase.from('skills').select('*').eq('portfolio_id', portfolio.id),
      supabase.from('certifications').select('*').eq('portfolio_id', portfolio.id),
      supabase.from('achievements').select('*').eq('portfolio_id', portfolio.id),
      supabase.from('experiences').select('*').eq('portfolio_id', portfolio.id),
    ]);
    projects = projRes.data || [];
    skills = skillRes.data || [];
    certifications = certRes.data || [];
    achievements = achRes.data || [];
    experiences = expRes.data || [];
  }

  // Work history can be entered in two places: the Profile page (a list on
  // student_profiles.work_experience) and the Portfolio Builder's Experiences
  // tab (the experiences table). Only the first used to reach the CV, so
  // anything added in the Portfolio Builder silently went missing. Both are
  // merged here into the profile's shape, with duplicates dropped.
  const workExperience = mergeExperience(
    Array.isArray(profile.work_experience) ? profile.work_experience : [],
    experiences,
  );

  return { profile, portfolio, projects, skills, certifications, achievements, workExperience };
};

// What the "choose what goes on your CV" step shows: every item, with a short
// label and detail line, keyed by the id generateCV's `exclude` refers to.
const getCVSources = async (user_id) => {
  const s = await loadSources(user_id);
  const detail = (...parts) => parts.filter(Boolean).join(' \u00b7 ') || null;
  return {
    has_portfolio: !!s.portfolio,
    projects: s.projects.map((p) => ({ id: String(p.id), label: p.title, detail: detail(p.tech_stack) })),
    skills: s.skills.map((k) => ({ id: String(k.id), label: k.skill_name, detail: detail(k.category) })),
    certifications: s.certifications.map((c) => ({ id: String(c.id), label: c.title, detail: detail(c.issuer) })),
    experiences: s.workExperience.map((e) => ({ id: e.key, label: e.role || e.organisation, detail: detail(e.role && e.organisation, e.period) })),
    achievements: s.achievements.map((a) => ({ id: String(a.id), label: a.title, detail: detail(a.category) })),
  };
};

// Normalises { projects: [...ids], ... } from the request. Anything that isn't
// an array of ids is ignored, so a missing or malformed body means "include
// everything" rather than an error.
const SOURCE_KEYS = ['projects', 'skills', 'certifications', 'experiences', 'achievements'];
const readExclude = (exclude) => Object.fromEntries(SOURCE_KEYS.map((k) => [
  k,
  Array.isArray(exclude?.[k]) ? exclude[k].map(String) : [],
]));

const generateCV = async (user_id, excludeInput) => {
  const exclude = readExclude(excludeInput);
  const src = await loadSources(user_id);
  const { profile } = src;
  // Items the student chose to leave out never reach the AI or the page.
  const projects = src.projects.filter((p) => !exclude.projects.includes(String(p.id)));
  const skills = src.skills.filter((k) => !exclude.skills.includes(String(k.id)));
  const certifications = src.certifications.filter((c) => !exclude.certifications.includes(String(c.id)));
  const achievements = src.achievements.filter((a) => !exclude.achievements.includes(String(a.id)));
  const workExperience = src.workExperience.filter((e) => !exclude.experiences.includes(e.key));

  // 4. Assessment evidence — professor-set tests only.
  //
  // Practice is rehearsal: unlimited attempts, no deadline, nobody watching.
  // Letting it into the CV would mean a student could claim competence in five
  // areas after five quiet retries, which is exactly what this system exists to
  // stop being possible.
  const assessments = {};
  for (const type of ASSESSMENT_TYPES) {
    const result = await assessmentRepo.getLatestGradedByType(user_id, type);
    assessments[type] = result?.is_graded ? result : null;
  }

  const gradedCount = ASSESSMENT_TYPES.filter((t) => assessments[t]).length;

  // Nothing to write a CV from. Refusing here is kinder than generating a
  // document full of invented competence and letting a student send it out.
  if (gradedCount === 0) {
    throw {
      status: 400,
      message: 'Your CV is built from tests your professor set. Complete at least one assigned test first — practice attempts don\u2019t count.',
    };
  }

  // 5. Human evaluation
  let humanEval = null;
  if (src.portfolio) {
    const { data: evalData } = await supabase
      .from('human_evaluations')
      .select('*, users:evaluator_id(full_name)')
      .eq('portfolio_id', src.portfolio.id)
      .order('created_at', { ascending: false })
      .limit(1);
    humanEval = evalData?.[0] || null;
  }

  // ── Verified titles ──
  // Computed from the level of the professor's test and the score, exactly as
  // shown in the app. The AI is told about them so the opening paragraph can
  // read honestly, but the lines themselves are placed by this code.
  const allTitles = await titlesService.getTitles(user_id);
  const verifiedTitles = Object.entries(allTitles)
    .filter(([, t]) => t.verified)
    .map(([type, t]) => ({
      type,
      area: TYPE_LABELS[type] || type,
      label: t.verified.title,
      level: t.verified.test_level,
      test_title: t.verified.test_title,
      professor_name: t.verified.professor_name,
      awarded_at: t.verified.awarded_at,
    }));

  // ── Evidence for the AI, described rather than scored ──
  const evidenceLines = ASSESSMENT_TYPES
    .map((type) => {
      const r = assessments[type];
      if (!r) return null;

      const band = bandFor(r.score);
      const m = r.metadata || {};
      const source = 'set and timed by their professor';

      const detail = [];
      if (type === 'typing' && m.wpm) detail.push(`sustained around ${m.wpm} words per minute`);
      if (m.correctness) detail.push(`solution judged ${m.correctness}`);
      if (m.bugs_fixed) detail.push(`fixed ${m.bugs_fixed} of the planted defects`);
      if (m.logical_flow) detail.push(`logical flow judged ${m.logical_flow}`);
      if (m.clarity) detail.push(`clarity judged ${m.clarity}`);
      if (m.strengths) detail.push(`noted strength: ${m.strengths}`);

      return `- ${TYPE_LABELS[type]}: ${band} level, from an assessment ${source}.${detail.length ? ' ' + detail.join('; ') + '.' : ''}`;
    })
    .filter(Boolean);

  const prompt = `You are writing the narrative sections of a CV for a Computer Science student.

VERIFIED TITLES ALREADY AWARDED
${verifiedTitles.length
  ? verifiedTitles.map(t => `- ${t.label} (${t.area}), awarded on a ${t.level} level assessment set by ${t.professor_name || 'their professor'}`).join('\n')
  : '- None yet'}
These appear on the CV as written above. Do not restate them, invent others, or
describe the student with a seniority they were not awarded.

TODAY: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

STUDENT
Name: ${profile.users?.full_name}
Title they use: ${profile.professional_title || profile.career_goal || 'Not stated'}
Course: ${profile.course || 'BS Computer Science'}${profile.specialization ? ` (${profile.specialization})` : ''}
Year: ${profile.year_level || 'Not specified'}
School: ${profile.school || 'Tomas Claudio Colleges'}
Expected graduation: ${profile.expected_graduation || 'Not stated'}
Academic honours: ${profile.academic_honors || 'None stated'}
Bio in their own words: ${profile.bio || 'None provided'}

WORK EXPERIENCE
${workExperience
  .map(e => `- ${e.role || 'Role not stated'} at ${e.organisation || 'unnamed organisation'}${e.period ? ` (${e.period})` : ''}${e.summary ? `: ${e.summary}` : ''}`)
  .join('\n') || '- None'}

SELF-REPORTED SKILLS
${skills.map((s) => `- ${s.skill_name} (${s.category || 'general'})`).join('\n') || '- None listed'}

PROJECTS
${projects.map((p) => `- ${p.title}: ${p.description || 'no description'} [${p.tech_stack || 'stack not stated'}]`).join('\n') || '- None listed'}

CERTIFICATIONS
${certifications.map((c) => `- ${c.title} (${c.issuer || 'issuer not stated'})`).join('\n') || '- None listed'}

ACHIEVEMENTS
${achievements.map((a) => `- ${a.title}${a.category ? ` (${a.category})` : ''}`).join('\n') || '- None listed'}

ASSESSED EVIDENCE — all of this was set and timed by a professor
${evidenceLines.join('\n')}

The student may also have practised on their own. That is deliberately not
included here and must not be written about — only supervised work counts.

${humanEval ? `FACULTY REVIEW
Career readiness: ${humanEval.career_readiness}
Comments: ${humanEval.comments || 'None'}
Recommendations: ${humanEval.recommendations || 'None'}` : 'FACULTY REVIEW\nNot yet reviewed by faculty.'}

WRITING RULES — these matter more than anything else:

1. NEVER write a number that came from an assessment. No scores, no marks, no
   percentages, no "out of 100", no letter grades, no rankings. If the evidence
   says "solid level", write about what that person can do — do not translate it
   back into a figure. Typing words-per-minute is the single exception, and only
   if it is genuinely impressive.

2. The about_me paragraph is prose — flowing sentences, not a list of
   attributes. Everything else on the page is a bullet, so keep those short
   enough to scan: a phrase, not a sentence.

3. Be specific and grounded. "Writes correct SQL against unfamiliar schemas
   under time pressure" is useful. "Excellent problem-solving skills" is not.

4. Do not invent anything. If there is no evidence for a claim, leave it out.
   A short honest CV is worth more than a padded one.

5. Where something is weak, frame it as a direction of growth, never as a
   failing, and never quantify it.

6. Write about_me as a Career Objective the way it appears on a Philippine CV:
   implied first person. Never use the student's name, "I", "he", "she",
   "they", "the candidate" or "the student". Open with who they are, e.g.
   "Fourth-year BS Computer Science student and consistent Dean's Lister
   seeking an entry-level frontend developer role..." — then what they bring.
   Compare every date with TODAY: if expected graduation is already past, do
   not describe them as preparing or about to graduate.

7. This CV must fit on one printed page. Be brief. A short honest paragraph
   beats a long one that repeats itself.

Respond with JSON only, no markdown:
{
  "about_me": "A Career Objective: ONE paragraph, 3-4 sentences, implied first person (see rule 6). Who this person is as a developer, what they are oriented toward, and what stage they are at. This is the only prose on the page — everything else is a bullet list — so it has to carry the whole introduction. Written for a hiring manager skimming for ten seconds.",
  "verified_competencies": ["4-6 short phrases naming what has been demonstrated under supervision, e.g. 'Debugging unfamiliar code under time pressure'. Each one under 10 words. No numbers."],
  "growth_areas": ["2-3 short phrases naming honest next steps, framed forward. No numbers."],
  "suggested_roles": ["2-4 job titles this person could realistically apply for now"]
}`;

  const model = getModel({
    model: 'gemini-3.6-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });

  const geminiResult = await model.generateContent(prompt);
  const raw = geminiResult.response.text().replace(/```json|```/g, '').trim();
  const aiContent = JSON.parse(raw);

  // A last line of defence. The model is told not to print scores, but a CV
  // that leaks "SQL: 76" to an employer is worse than one that reads slightly
  // oddly, so anything score-shaped is stripped before it is stored.
  const stripScores = (text) =>
    typeof text === 'string'
      ? text
        .replace(/\b\d{1,3}\s*\/\s*100\b/g, 'a strong level')
        .replace(/\bscored?\s+\d{1,3}\b/gi, 'performed well')
        .replace(/\b\d{1,3}\s*(?:%|percent)\b/g, 'a high proportion')
        .replace(/\s{2,}/g, ' ')
        .trim()
      : text;

  // Level of each professor's test, for "Medium test" etc. Falls back to the
  // difficulty the result itself recorded.
  const testIds = ASSESSMENT_TYPES.map((t) => assessments[t]?.test_id).filter(Boolean);
  const testLevels = {};
  if (testIds.length) {
    const { data: tests } = await supabase.from('tests').select('id, level').in('id', testIds);
    for (const t of tests || []) testLevels[t.id] = t.level;
  }
  const verifiedPerformance = ASSESSMENT_TYPES
    .filter((type) => assessments[type])
    .map((type) => {
      const r = assessments[type];
      const m = r.metadata || {};
      const level = testLevels[r.test_id] || m.difficulty || null;
      return {
        type,
        area: PERFORMANCE_LABELS[type] || type,
        detail: performanceDetail(type, m, level),
        proficiency: proficiencyFor(r.score),
        taken_at: r.created_at,
      };
    });

  const cv_content = {
    header: {
      full_name: profile.users?.full_name,
      // The title sits under the name and is the first thing a reader takes in,
      // so it falls back to the career goal rather than showing nothing.
      professional_title: profile.professional_title || profile.career_goal || null,
      email: profile.users?.email,
      phone: profile.phone || null,
      location: profile.location || null,
      github_url: profile.github_url,
      linkedin_url: profile.linkedin_url,
      portfolio_url: profile.portfolio_url || null,
    },
    // Placed here rather than generated: a title is a fact about what a
    // professor's test awarded, not a phrase for the model to improve on.
    verified_titles: verifiedTitles,

    // Measured, not written: numbers straight from the professor-set tests.
    verified_performance: verifiedPerformance,

    about_me: stripScores(aiContent.about_me),
    verified_competencies: (aiContent.verified_competencies || []).map(stripScores),
    growth_areas: (aiContent.growth_areas || []).map(stripScores),
    suggested_roles: aiContent.suggested_roles || [],

    // Skills the student listed themselves — kept separate from the assessed
    // narrative above, because a self-rating and a supervised result are not
    // the same kind of claim and shouldn't be presented as if they were.
    education: {
      course: profile.course || null,
      year_level: profile.year_level || null,
      school: profile.school || null,
      specialization: profile.specialization || null,
      expected_graduation: profile.expected_graduation || null,
      academic_honors: profile.academic_honors || null,
    },

    // Profile work history and Portfolio Builder experiences, merged above.
    work_experience: workExperience.map(({ key, ...e }) => e),

    self_reported_skills: skills.map((s) => ({
      name: s.skill_name,
      category: s.category,
    })),

    // Descriptions are dropped on purpose: two sentences per project is most
    // of a page once a student has four of them. Title and stack is what a
    // reader actually scans for.
    projects: projects.map((p) => ({
      title: p.title,
      tech_stack: p.tech_stack,
      github_url: p.github_url,
    })),
    certifications: certifications.map((c) => ({
      title: c.title,
      issuer: c.issuer,
      // The column is issued_date; the CV page reads date_earned.
      date_earned: c.issued_date || null,
    })),
    achievements: achievements.map((a) => ({
      title: a.title,
      category: a.category,
      date_achieved: a.achieved_date || null,
    })),

    // What the student left out this time, so the next "choose what goes on
    // your CV" step starts from the same choices. New items aren't in here,
    // so they start ticked.
    excluded: exclude,

    // Kept for the professor's and the student's own view — deliberately not
    // rendered on the employer-facing CV.
    internal_evidence: {
      graded_assessments: gradedCount,
      faculty_reviewed: !!humanEval,
      career_readiness: humanEval?.career_readiness || null,
      reviewed_by: humanEval?.users?.full_name || null,
    },
  };

  // Save
  const { data: saved, error } = await supabase
    .from('cvs')
    .insert([{ student_id: profile.id, cv_content, generated_at: new Date().toISOString() }])
    .select()
    .single();

  if (error) throw { status: 500, message: error.message };
  return saved;
};

const getLatestCV = async (user_id) => {
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user_id)
    .single();

  if (!profile) throw { status: 404, message: 'Student profile not found.' };

  const { data } = await supabase
    .from('cvs')
    .select('*')
    .eq('student_id', profile.id)
    .order('generated_at', { ascending: false })
    .limit(1);

  return data?.[0] || null;
};

const getCVHistory = async (user_id) => {
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user_id)
    .single();

  if (!profile) throw { status: 404, message: 'Student profile not found.' };

  const { data } = await supabase
    .from('cvs')
    .select('*')
    .eq('student_id', profile.id)
    .order('generated_at', { ascending: false });

  return data || [];
};

module.exports = { generateCV, getCVSources, getLatestCV, getCVHistory, loadSources };