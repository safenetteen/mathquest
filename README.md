# MathQuest
AI-powered math quiz (HTML + one Netlify Function calling Groq).

- `index.html` – the whole front end (2 quizzes x 10 questions, descriptors, answer key, AI quiz)
- `netlify/functions/feedback.js` – secure proxy to Groq
- Env vars on Netlify: `GROQ_API_KEY` (required), `GROQ_MODEL` (optional, default `openai/gpt-oss-120b`)
