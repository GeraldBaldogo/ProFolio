// Display names for the three difficulty stages.
//
// The internal values stay 'easy' / 'medium' / 'hard' everywhere that matters
// — the database, the API, config.level, every comparison and lookup. ONLY the
// text shown to people changes, so renaming here is safe and can't break logic.
export const LEVEL_LABELS = {
  easy: 'Foundational',
  medium: 'Intermediate',
  hard: 'Advanced',
};

// 'easy' -> 'Foundational'. Unknown values fall back to a capitalised form of
// whatever was passed, so nothing ever renders blank.
export const levelLabel = (value) => {
  const key = String(value || '').toLowerCase();
  if (LEVEL_LABELS[key]) return LEVEL_LABELS[key];
  return value ? String(value).charAt(0).toUpperCase() + String(value).slice(1) : value;
};
