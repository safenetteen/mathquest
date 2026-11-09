// Serverless proxy: keeps the Groq API key on the server (never in the browser or GitHub).
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "POST only" };
  const key = process.env.GROQ_API_KEY;
  if (!key) return { statusCode: 500, body: "GROQ_API_KEY is not set" };
  let b;
  try { b = JSON.parse(event.body || "{}"); } catch { return { statusCode: 400, body: "Bad JSON" }; }

  const gen = b.mode === "generate";
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const cut = (s) => String(s ?? "").slice(0, 400);

  const system = gen
    ? `You write multiple-choice maths quizzes. Reply with JSON only: {"questions":[{"topic":"","level":"Easy|Medium|Hard","descriptor":"verb phrase finishing 'the learner can ...'","question":"","correct":"","wrong":["","",""],"solution":"2-3 sentences"}]}. Exactly 10 questions (3 Easy, 4 Medium, 3 Hard), all on different topics, high-school level, plain-text maths (use ², √, π). Check every answer twice. Wrong options must be common mistakes and must differ from the correct answer. Random seed: ${Math.random()}`
    : "You are a kind maths tutor. In under 120 words: name the exact mistake behind the student's chosen answer, then show the correct method step by step. Plain text, no LaTeX, no markdown.";
  const user = gen
    ? "Write the quiz now."
    : `Question: ${cut(b.question)}\nOptions: ${(b.options || []).map(cut).join(" | ")}\nStudent chose: ${cut(b.chosen)}\nCorrect answer: ${cut(b.correct)}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: gen ? 0.8 : 0.3,
      max_completion_tokens: gen ? 4000 : 900,
      ...(/gpt-oss/.test(model) ? { reasoning_effort: "low" } : {}),
      ...(gen ? { response_format: { type: "json_object" } } : {}),
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });
  const d = await res.json();
  if (!res.ok) return { statusCode: 502, body: JSON.stringify(d) };
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: d.choices?.[0]?.message?.content || "" }),
  };
};
