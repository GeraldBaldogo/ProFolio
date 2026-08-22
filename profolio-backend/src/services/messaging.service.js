const messagingRepo = require('../repositories/messaging.repo');

// This file was at some point overwritten with the contents of sockets/socket.js,
// which is why every messaging endpoint was throwing "is not a function".
// Socket setup lives in src/sockets/socket.js — this is the REST side only.

// A conversation is always one student and one professor. Working out which is
// which from the two users' roles means the caller doesn't have to care about
// argument order, and a student can't accidentally be stored as the professor.
const startConversation = async (user, other_user_id) => {
  if (!other_user_id) {
    throw { status: 400, message: 'other_user_id is required.' };
  }
  if (other_user_id === user.id) {
    throw { status: 400, message: 'You cannot start a conversation with yourself.' };
  }

  // messaging.repo has no user lookup, so resolve the pairing from the caller's
  // own role instead. A student always opens a chat with a professor, and the
  // other way round.
  let student_id;
  let professor_id;

  if (user.role === 'student') {
    student_id = user.id;
    professor_id = other_user_id;
  } else if (user.role === 'evaluator') {
    student_id = other_user_id;
    professor_id = user.id;
  } else {
    throw { status: 403, message: 'Only students and professors can start conversations.' };
  }

  return messagingRepo.findOrCreateConversation(student_id, professor_id);
};

const listConversations = async (user) => {
  if (user.role !== 'student' && user.role !== 'evaluator') {
    throw { status: 403, message: 'Only students and professors have conversations.' };
  }
  return messagingRepo.getConversationsForUser(user.id, user.role);
};

// Both readers of a conversation are checked here rather than in the
// controller, so the socket layer gets the same protection for free.
const assertParticipant = (conversation, user) => {
  if (!conversation) {
    throw { status: 404, message: 'Conversation not found.' };
  }
  const isParticipant =
    conversation.student_id === user.id || conversation.professor_id === user.id;

  if (!isParticipant) {
    throw { status: 403, message: 'This conversation is not yours.' };
  }
};

const getConversationMessages = async (conversation_id, user) => {
  const conversation = await messagingRepo.getConversationById(conversation_id);
  assertParticipant(conversation, user);

  const messages = await messagingRepo.getMessages(conversation_id);

  // Opening a conversation marks the other side's messages as read. Failing
  // here shouldn't stop the messages being delivered.
  try {
    await messagingRepo.markMessagesRead(conversation_id, user.id);
  } catch {
    // read receipts are not worth failing the request over
  }

  return messages;
};

const sendMessage = async (conversation_id, user, content) => {
  if (!content || !content.trim()) {
    throw { status: 400, message: 'Message content is required.' };
  }

  const conversation = await messagingRepo.getConversationById(conversation_id);
  assertParticipant(conversation, user);

  return messagingRepo.createMessage(conversation_id, user.id, content.trim());
};

module.exports = {
  startConversation,
  listConversations,
  getConversationMessages,
  sendMessage,
};