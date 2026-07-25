const { GoogleGenerativeAI } = require('@google/generative-ai');
const chatbotRepo = require('../repositories/chatbot.repo');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are the ProFolio Assistant, a friendly and encouraging AI helper embedded in ProFolio,
an AI-assisted web-based portfolio platform for students. Your job is to:

- Help students understand how to use ProFolio (assessments, portfolio builder, CV generation, recommendations).
- Answer questions about their skills, assessment results, and how scoring works, in general terms.
- Give short, practical career and skill-development tips (courses, certifications, practice ideas).
- Encourage students to complete their assessments honestly and to keep building their portfolio.
- Keep answers concise (2-5 sentences unless the student asks for a detailed explanation).
- If asked something outside ProFolio's scope (unrelated personal, medical, legal, or harmful requests), politely
  redirect back to portfolio/career/skill topics.

Speak in a warm, supportive, student-friendly tone. Do not use markdown formatting like headers or bullet lists
unless the student explicitly asks for a list.`;

const MAX_HISTORY_MESSAGES = 10;

const sendMessage = async (user_id, { message }) => {
  if (!message || !message.trim()) {
    throw { status: 400, message: 'message is required.' };
  }

  // Pull recent history for context
  const history = await chatbotRepo.getHistoryByUser(user_id, MAX_HISTORY_MESSAGES);

  // Gemini uses 'user' / 'model' roles (not 'assistant')
  const geminiHistory = history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT
  });

  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessage(message.trim());
  const reply = result.response.text().trim();

  // Persist both turns
  await chatbotRepo.saveMessages(user_id, [
    { role: 'user', content: message.trim() },
    { role: 'assistant', content: reply }
  ]);

  return { reply };
};

const getHistory = async (user_id) => {
  const history = await chatbotRepo.getHistoryByUser(user_id, 50);
  return history;
};

const clearHistory = async (user_id) => {
  await chatbotRepo.deleteByUser(user_id);
  return true;
};

module.exports = { sendMessage, getHistory, clearHistory };