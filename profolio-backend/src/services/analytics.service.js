const supabase = require('../config/db');

/*
 * Admin analytics.
 *
 * Everything is computed from raw rows in one pass, so the numbers on the
 * page always agree with each other. Supabase returns at most 1,000 rows per
 * request, so every table is read in pages — without that, totals quietly
 * stop at 1,000 once the system has real use.
 *
 * Scores appear here (averages by assessment type) because this page is for
 * the school. They never reach a CV.
 */

const PAGE = 1000;
const DAY = 24 * 60 * 60 * 1000;

const ASSESSMENT_LABELS = {
  typing: 'Typing',
  programming: 'Programming',
  flowchart: 'Flowchart',
  sql: 'SQL',
  bugfix: 'Debugging',
  communication: 'Communication',
};

// Reads a whole table in pages. A missing table or column returns [] and is
// logged, so one broken source can't take the whole dashboard down.
const fetchAll = async (table, columns) => {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + PAGE - 1);
    if (error) {
      console.warn(`analytics: could not read ${table}: ${error.message}`);
      return rows;
    }
    rows.push(...(data || []));
    if (!data || data.length < PAGE) return rows;
  }
};

// Monday 00:00 UTC of the week a date falls in.
const weekStart = (value) => {
  const d = new Date(value);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day);
};

const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);

// Empty buckets for the last `weeks` weeks, oldest first, so a quiet week
// shows as a zero rather than disappearing from the chart.
const weekBuckets = (weeks, now, fields) => {
  const current = weekStart(now);
  return Array.from({ length: weeks }, (_, i) => {
    const start = current - (weeks - 1 - i) * 7 * DAY;
    return { week: isoDay(start), ...Object.fromEntries(fields.map((f) => [f, 0])) };
  });
};

const addToWeek = (buckets, date, field) => {
  if (!date) return;
  const key = isoDay(weekStart(date));
  const bucket = buckets.find((b) => b.week === key);
  if (bucket) bucket[field] += 1;
};

// Current period vs the one before it, as a whole-number percentage.
// null when there's nothing to compare against.
const change = (current, previous) => {
  if (!previous) return current ? null : 0;
  return Math.round(((current - previous) / previous) * 100);
};

const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

const countBy = (rows, keyFn) => {
  const out = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (k === null || k === undefined || k === '') continue;
    out.set(k, (out.get(k) || 0) + 1);
  }
  return out;
};

const topN = (map, n) => [...map.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, n)
  .map(([label, value]) => ({ label, value }));

const getAnalytics = async ({ weeks: weeksInput } = {}) => {
  const weeks = Math.min(52, Math.max(4, parseInt(weeksInput, 10) || 12));
  const now = Date.now();
  const rangeStart = weekStart(now) - (weeks - 1) * 7 * DAY;
  const prevStart = rangeStart - weeks * 7 * DAY;
  const inRange = (d) => d && new Date(d).getTime() >= rangeStart;
  const inPrev = (d) => d && new Date(d).getTime() >= prevStart && new Date(d).getTime() < rangeStart;

  const [
    users, profiles, portfolios,
    projects, skills, certifications, experiences, achievements,
    cvs, results, tests, assignments, proctoring, originality,
  ] = await Promise.all([
    fetchAll('users', 'id, role, is_active, is_approved, created_at'),
    fetchAll('student_profiles', 'id, user_id, course, school, year_level'),
    fetchAll('portfolios', 'id, student_id'),
    fetchAll('projects', 'portfolio_id'),
    fetchAll('skills', 'portfolio_id, skill_name'),
    fetchAll('certifications', 'portfolio_id'),
    fetchAll('experiences', 'portfolio_id'),
    fetchAll('achievements', 'portfolio_id'),
    fetchAll('cvs', 'student_id, generated_at'),
    fetchAll('assessment_results', 'user_id, type, score, test_id, created_at'),
    fetchAll('tests', 'id, is_published'),
    fetchAll('test_assignments', 'student_id, status, due_date'),
    fetchAll('proctoring_events', 'event_type, created_at'),
    fetchAll('originality_checks', 'verdict, created_at'),
  ]);

  // ── Users ────────────────────────────────────────────────────────────────
  const students = users.filter((u) => u.role === 'student');
  const professors = users.filter((u) => u.role === 'evaluator');
  const signups = weekBuckets(weeks, now, ['students', 'professors']);
  for (const u of users) {
    if (u.role === 'student') addToWeek(signups, u.created_at, 'students');
    if (u.role === 'evaluator') addToWeek(signups, u.created_at, 'professors');
  }
  const newStudents = students.filter((u) => inRange(u.created_at)).length;
  const newStudentsPrev = students.filter((u) => inPrev(u.created_at)).length;

  // ── Who has done what (keyed by student_profiles.id) ─────────────────────
  const studentUserIds = new Set(students.map((u) => u.id));
  const studentProfiles = profiles.filter((p) => studentUserIds.has(p.user_id));

  const portfolioOwner = new Map(portfolios.map((p) => [p.id, p.student_id]));
  const ownersOf = (rows) => new Set(rows.map((r) => portfolioOwner.get(r.portfolio_id)).filter(Boolean));
  const withProjects = ownersOf(projects);
  const withSkills = ownersOf(skills);
  const withCerts = ownersOf(certifications);
  const withExperience = ownersOf(experiences);
  const withAchievements = ownersOf(achievements);
  const withAnyItem = new Set([...withProjects, ...withSkills, ...withCerts, ...withExperience, ...withAchievements]);

  const itemsPerStudent = new Map();
  for (const rows of [projects, skills, certifications, experiences, achievements]) {
    for (const r of rows) {
      const owner = portfolioOwner.get(r.portfolio_id);
      if (owner) itemsPerStudent.set(owner, (itemsPerStudent.get(owner) || 0) + 1);
    }
  }

  const gradedUsers = new Set(results.filter((r) => r.test_id).map((r) => r.user_id));
  const withCv = new Set(cvs.map((c) => c.student_id));
  const profileComplete = studentProfiles.filter((p) => p.course && p.school);

  // The path a student takes to a finished CV. Each step counts students who
  // reached it, whether or not they did the steps before in order.
  const totalStudents = studentProfiles.length;
  const funnel = [
    { key: 'registered', label: 'Registered', value: totalStudents },
    { key: 'profile', label: 'Completed profile', value: profileComplete.length },
    { key: 'portfolio', label: 'Added to portfolio', value: studentProfiles.filter((p) => withAnyItem.has(p.id)).length },
    { key: 'graded', label: 'Took an assigned test', value: studentProfiles.filter((p) => gradedUsers.has(p.user_id)).length },
    { key: 'cv', label: 'Generated a CV', value: studentProfiles.filter((p) => withCv.has(p.id)).length },
  ].map((s) => ({ ...s, percent: pct(s.value, totalStudents) }));

  // ── CVs ──────────────────────────────────────────────────────────────────
  const cvWeeks = weekBuckets(weeks, now, ['cvs']);
  for (const c of cvs) addToWeek(cvWeeks, c.generated_at, 'cvs');
  const cvsInRange = cvs.filter((c) => inRange(c.generated_at)).length;
  const cvsPrev = cvs.filter((c) => inPrev(c.generated_at)).length;

  // ── Portfolio content ────────────────────────────────────────────────────
  const coverage = [
    { label: 'Projects', value: withProjects.size },
    { label: 'Skills', value: withSkills.size },
    { label: 'Certifications', value: withCerts.size },
    { label: 'Experience', value: withExperience.size },
    { label: 'Achievements', value: withAchievements.size },
  ].map((c) => ({ ...c, percent: pct(c.value, totalStudents) }));

  // "react", "React " and "REACT" are one skill. Shown the way it's normally
  // written: a spelling with some capitals (but not shouting in all caps)
  // wins over all-lowercase, then the most common one wins. Short names
  // like "SQL" or "PHP" are allowed to be all caps.
  const looksProper = (form) => /[A-Z]/.test(form) && (form.length <= 4 || form !== form.toUpperCase());
  const spellingRank = ([form, n]) => (looksProper(form) ? 1e6 : 0) + n;
  const skillCounts = new Map();
  const spellings = new Map();
  for (const s of skills) {
    const raw = (s.skill_name || '').trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    skillCounts.set(key, (skillCounts.get(key) || 0) + 1);
    const forms = spellings.get(key) || new Map();
    forms.set(raw, (forms.get(raw) || 0) + 1);
    spellings.set(key, forms);
  }
  const topSkills = topN(skillCounts, 10).map(({ label, value }) => ({
    label: [...spellings.get(label).entries()].sort((a, b) => spellingRank(b) - spellingRank(a))[0][0],
    value,
  }));

  const itemCounts = [...itemsPerStudent.values()];
  const avgItems = itemCounts.length
    ? Math.round((itemCounts.reduce((a, b) => a + b, 0) / itemCounts.length) * 10) / 10
    : 0;

  // ── Assessments ──────────────────────────────────────────────────────────
  const resultsInRange = results.filter((r) => inRange(r.created_at));
  const resultsPrev = results.filter((r) => inPrev(r.created_at)).length;
  const activity = weekBuckets(weeks, now, ['graded', 'practice']);
  for (const r of results) addToWeek(activity, r.created_at, r.test_id ? 'graded' : 'practice');

  const byType = Object.entries(ASSESSMENT_LABELS).map(([type, label]) => {
    const rows = resultsInRange.filter((r) => r.type === type);
    const graded = rows.filter((r) => r.test_id);
    const scores = graded.map((r) => Number(r.score)).filter((n) => Number.isFinite(n));
    return {
      type,
      label,
      graded: graded.length,
      practice: rows.length - graded.length,
      avg_score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    };
  });

  // ── Assigned tests ───────────────────────────────────────────────────────
  const submitted = assignments.filter((a) => a.status === 'submitted').length;
  const overdue = assignments.filter((a) => a.status !== 'submitted' && a.due_date && new Date(a.due_date).getTime() < now).length;

  // ── Who the students are ─────────────────────────────────────────────────
  const courses = topN(countBy(studentProfiles, (p) => (p.course || '').trim() || null), 6);
  const yearLevels = topN(countBy(studentProfiles, (p) => p.year_level || null), 6)
    .sort((a, b) => String(a.label).localeCompare(String(b.label), undefined, { numeric: true }));

  // ── Integrity ────────────────────────────────────────────────────────────
  const proctoringInRange = proctoring.filter((e) => inRange(e.created_at));
  const originalityInRange = originality.filter((o) => inRange(o.created_at));

  return {
    generated_at: new Date(now).toISOString(),
    range: { weeks, from: isoDay(rangeStart) },

    users: {
      total: users.length,
      students: students.length,
      evaluators: professors.length,
      admins: users.filter((u) => u.role === 'admin').length,
      active: users.filter((u) => u.is_active !== false).length,
      pending_professors: professors.filter((u) => !u.is_approved && u.is_active !== false).length,
      new_students: newStudents,
      new_students_change: change(newStudents, newStudentsPrev),
      signups_by_week: signups,
    },

    funnel,

    cv: {
      students_with_cv: withCv.size,
      percent_of_students: pct(withCv.size, totalStudents),
      total_generated: cvs.length,
      in_range: cvsInRange,
      in_range_change: change(cvsInRange, cvsPrev),
      by_week: cvWeeks,
    },

    portfolio: {
      students_with_items: withAnyItem.size,
      percent_of_students: pct(withAnyItem.size, totalStudents),
      avg_items: avgItems,
      coverage,
      top_skills: topSkills,
    },

    assessments: {
      total: results.length,
      in_range: resultsInRange.length,
      in_range_change: change(resultsInRange.length, resultsPrev),
      graded_in_range: resultsInRange.filter((r) => r.test_id).length,
      by_week: activity,
      by_type: byType,
    },

    tests: {
      published: tests.filter((t) => t.is_published).length,
      assignments: assignments.length,
      submitted,
      overdue,
      pending: assignments.length - submitted - overdue,
      completion_rate: pct(submitted, assignments.length),
    },

    students: { courses, year_levels: yearLevels },

    integrity: {
      proctoring_events: proctoringInRange.length,
      proctoring_by_type: topN(countBy(proctoringInRange, (e) => e.event_type), 5),
      originality_checks: originalityInRange.length,
      originality_by_verdict: topN(countBy(originalityInRange, (o) => o.verdict), 5),
    },
  };
};

module.exports = { getAnalytics };