// Names in a conversation, with nicknames. A nickname is shown in Messages
// only; everywhere else (CV, results, professor views) uses the real name.
export const chatSides = (conversation, currentUserId) => {
  const mySide = conversation?.professor_id === currentUserId ? 'professor' : 'student'
  const otherSide = mySide === 'student' ? 'professor' : 'student'
  const person = (side, fallback) => {
    const real = conversation?.[side]?.full_name || fallback
    const nickname = conversation?.[`${side}_nickname`] || ''
    return { side, real, nickname, display: nickname || real }
  }
  return {
    me: person(mySide, 'You'),
    other: person(otherSide, otherSide === 'professor' ? 'Professor' : 'Student'),
  }
}