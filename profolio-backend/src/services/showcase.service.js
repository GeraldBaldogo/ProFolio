const crypto = require('crypto');
const supabase = require('../config/db');
const cvService = require('./cv.service');

/*
 * Showcase: a public page of a student's portfolio at /p/<slug>, for sending
 * to employers. Off until the student turns it on.
 *
 * What's public is decided here, field by field, and nowhere else. The page
 * gets a copy built from an explicit list — never a database row — so a new
 * column added to student_profiles later can't leak onto the internet by
 * accident. Never included: phone number, raw scores, growth areas, internal
 * ids, and the email unless the student ticks "show my email".
 */

const bad = (message) => ({ status: 400, message });
const notFound = () => ({ status: 404, message: 'This showcase doesn\u2019t exist or has been turned off.' });

const SLUG_PATTERN = /^[a-z0-9-]{3,80}$/;

// "Gerald Baldogo" → "gerald-baldogo-4f9a1c2e". The random part means links
// can't be guessed by trying classmates' names.
const makeSlug = (name) => {
  const base = String(name || 'student')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'student';
  return `${base}-${crypto.randomBytes(4).toString('hex')}`;
};

// Links students type are shown to strangers, so only real web addresses
// get through: "github.com/x" becomes https://github.com/x, while anything
// like "javascript:..." is dropped rather than rendered as a link.
const safeUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
};

const SETTINGS_COLUMNS = 'id, showcase_enabled, showcase_slug, showcase_show_email';

const toSettings = (row) => ({
  enabled: !!row.showcase_enabled,
  slug: row.showcase_slug || null,
  show_email: !!row.showcase_show_email,
});

const ownProfile = async (user_id, columns = SETTINGS_COLUMNS) => {
  const { data, error } = await supabase
    .from('student_profiles')
    .select(columns)
    .eq('user_id', user_id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw { status: 404, message: 'Student profile not found.' };
  return data;
};

// A fresh slug that isn't taken. Collisions are near impossible with 32
// random bits, but checking costs one query.
const freshSlug = async (name) => {
  for (let i = 0; i < 5; i++) {
    const slug = makeSlug(name);
    const { data } = await supabase.from('student_profiles').select('id').eq('showcase_slug', slug).maybeSingle();
    if (!data) return slug;
  }
  throw { status: 500, message: 'Couldn\u2019t create a link. Please try again.' };
};

const getSettings = async (user_id) => toSettings(await ownProfile(user_id));

const updateSettings = async (user, { enabled, show_email } = {}) => {
  const changes = {};
  if (enabled !== undefined) {
    if (typeof enabled !== 'boolean') throw bad('enabled must be true or false.');
    changes.showcase_enabled = enabled;
  }
  if (show_email !== undefined) {
    if (typeof show_email !== 'boolean') throw bad('show_email must be true or false.');
    changes.showcase_show_email = show_email;
  }

  const current = await ownProfile(user.id);
  // First time it's turned on, the student gets a link
  if (changes.showcase_enabled && !current.showcase_slug) {
    changes.showcase_slug = await freshSlug(user.full_name);
  }
  if (!Object.keys(changes).length) return toSettings(current);

  const { data, error } = await supabase
    .from('student_profiles')
    .update(changes)
    .eq('user_id', user.id)
    .select(SETTINGS_COLUMNS)
    .single();
  if (error) throw error;
  return toSettings(data);
};

// A new address; the old one stops working at once. For when a link has
// gone somewhere it shouldn't have.
const resetLink = async (user) => {
  await ownProfile(user.id);
  const { data, error } = await supabase
    .from('student_profiles')
    .update({ showcase_slug: await freshSlug(user.full_name) })
    .eq('user_id', user.id)
    .select(SETTINGS_COLUMNS)
    .single();
  if (error) throw error;
  return toSettings(data);
};

const getPublic = async (slug) => {
  // A malformed slug and a switched-off page look the same from outside
  if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug)) throw notFound();

  const { data: owner } = await supabase
    .from('student_profiles')
    .select('user_id, showcase_enabled, showcase_show_email')
    .eq('showcase_slug', slug)
    .maybeSingle();
  if (!owner || !owner.showcase_enabled) throw notFound();

  const src = await cvService.loadSources(owner.user_id);
  const p = src.profile;

  let cv = null;
  try { cv = await cvService.getLatestCV(owner.user_id); } catch { cv = null; }
  const content = cv?.cv_content || {};

  // Items the student left off their latest CV stay off the public page too
  const ex = content.excluded || {};
  const keep = (list, key, idOf) => list.filter((item) => !(ex[key] || []).map(String).includes(String(idOf(item))));

  return {
    name: p.users?.full_name || 'Student',
    title: p.professional_title || null,
    location: p.location || null,
    photo: p.profile_photo || null,
    email: owner.showcase_show_email ? (p.users?.email || null) : null,
    links: {
      github: safeUrl(p.github_url),
      linkedin: safeUrl(p.linkedin_url),
      website: safeUrl(p.portfolio_url),
    },
    about: content.about_me || p.bio || null,
    education: (p.course || p.school) ? {
      course: p.course || null,
      specialization: p.specialization || null,
      school: p.school || null,
      year_level: p.year_level || null,
      expected_graduation: p.expected_graduation || null,
      honors: p.academic_honors || null,
    } : null,
    verified_performance: (content.verified_performance || []).map(({ area, detail, proficiency }) => ({ area, detail, proficiency })),
    verified_titles: (content.verified_titles || []).map(({ label, area }) => ({ label, area })),
    projects: keep(src.projects, 'projects', (x) => x.id).map((x) => ({
      title: x.title,
      description: x.description || null,
      tech_stack: x.tech_stack || null,
      github_url: safeUrl(x.github_url),
      live_url: safeUrl(x.live_url),
    })),
    skills: keep(src.skills, 'skills', (x) => x.id).map((x) => ({ name: x.skill_name, category: x.category || null })),
    certifications: keep(src.certifications, 'certifications', (x) => x.id).map((x) => ({
      title: x.title,
      issuer: x.issuer || null,
      issued_date: x.issued_date || null,
      credential_url: safeUrl(x.credential_url),
    })),
    experience: keep(src.workExperience, 'experiences', (x) => x.key).map(({ role, organisation, period, summary }) => ({
      role: role || null, organisation: organisation || null, period: period || null, summary: summary || null,
    })),
    achievements: keep(src.achievements, 'achievements', (x) => x.id).map((x) => ({
      title: x.title,
      category: x.category || null,
      description: x.description || null,
      achieved_date: x.achieved_date || null,
    })),
    updated_at: cv?.generated_at || null,
  };
};

module.exports = { getSettings, updateSettings, resetLink, getPublic, safeUrl, makeSlug };