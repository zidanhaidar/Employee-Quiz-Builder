# AI Usage — Key Prompts & Descriptions

This document describes how AI is used in the Employee Quiz Builder: the prompt that originated the project, the model and SDK powering quiz generation, the exact prompts the app sends at runtime, and the structured-output contract that keeps responses clean and parseable.

---

## 1. Originating project prompt

The project was initialized from the following brief:

> **Build an Automated Quiz Generation System for The Parentinc**
>
> **Goal** — Create a web app that automatically generates a multiple-choice quiz on parenting and child-development knowledge for The Parentinc employees. The admin/user types in any topic, and the system produces a complete, ready-to-take quiz.
>
> **Input** — A single free-text topic field. Examples:
> 1. "Child development milestones from 0–3 years"
> 2. "Essential infant nutrition & MPASI facts every parent should know"
>
> Optional controls:
> 1. Number of questions (default 10)
> 2. Difficulty (Easy / Medium / Hard / Mixed)
> 3. Language (English / Bahasa Indonesia)
>
> **Quiz generation requirements**
> 1. Generate clear multiple-choice questions (4 options each, exactly one correct answer).
> 2. Each question must include a short explanation shown after answering, so it doubles as a learning tool.
> 3. Content must be factually accurate and aligned with mainstream pediatric / child-development guidance (e.g. WHO, AAP, IDAI). Avoid medical claims presented as absolute; frame guidance as "general recommendation."
> 4. Questions should be relevant to the topic, non-repetitive, and varied in angle (facts, scenarios, "what would you do," myth-busting).
>
> **Quiz-taking experience (UX)**
> 1. Clean, mobile-friendly interface (employees may take it on a phone).
> 2. One question at a time or a single scrollable page, your choice, but keep it simple.
> 3. Immediate or end-of-quiz feedback, with the correct answer + explanation.
> 4. Final score screen showing: score out of total, % correct, and a short performance message.
> 5. Option to retake or generate a new quiz on a different topic.
>
> **Admin / output features**
> 1. Allow the generated quiz to be exported or copied (e.g. as text/JSON) for reuse in internal training.
> 2. (Nice to have) Save a history of generated quizzes.
>
> **Tech** — If an LLM API is used for question generation, structure the prompt so it returns clean, parseable JSON (question, options, correctAnswer, explanation).
>
> **Tone of generated content** — Professional but warm and accessible; these are parenting-company employees, so content should feel knowledgeable and supportive, not clinical or condescending.
>
> **Deliverable** — A working, deployable web app with the topic input, quiz generation, quiz-taking flow, and scoring, ready to demo.

---

## 2. Where & how AI is used

AI is used in exactly **one place**: generating quiz questions from a topic. Everything else (auth, sharing codes, scoring, history, import/export) is deterministic application logic with no AI involved.

| Aspect | Detail |
| --- | --- |
| **Provider** | Google AI Studio (Gemini) |
| **Model** | `gemini-2.5-flash` |
| **SDK** | [Vercel AI SDK](https://sdk.vercel.ai/) (`ai` + `@ai-sdk/google`) |
| **Call site** | `generateQuiz()` in [`app/actions/quiz.ts`](./app/actions/quiz.ts) (a server action) |
| **Output mode** | Structured output via `Output.object({ schema })` with a Zod schema — guarantees clean, parseable JSON |
| **API key** | `GOOGLE_GENERATIVE_AI_API_KEY` env var (never hard-coded) |

The model is invoked with a **system prompt** (role, rules, tone, difficulty, language) and a short **user prompt** (the actual request with the topic and count). Output is constrained to a schema so the response is always valid JSON we can render directly — no fragile string parsing.

---

## 3. The prompts

### 3a. System prompt (the "expert persona" + rules)

Built dynamically per request; `${input.difficulty}` and `${input.language}` are interpolated from the user's controls.

```
You are a careful pediatric and child-development content expert writing quizzes for employees of The Parentinc, a parenting company.

Your job is to produce accurate, engaging multiple-choice questions.

Rules:
- Each question has exactly 4 options and exactly ONE correct answer.
- Content must be factually accurate and aligned with mainstream pediatric / child-development guidance (WHO, AAP, IDAI).
- Frame guidance as a "general recommendation" — never present medical advice as absolute or as a diagnosis.
- Vary the angle across questions: factual recall, real-life scenarios, "what would you do", and myth-busting.
- Questions must be non-repetitive and clearly relevant to the topic.
- Tone: professional but warm, accessible, and supportive — knowledgeable without being clinical or condescending.
- Each explanation should be 1-3 sentences and teach the "why", so the quiz doubles as a learning tool.
- Difficulty "<Difficulty>": <include a spread of easy, medium, and hard questions. | target <difficulty> difficulty.>
- Write ALL content (questions, options, explanations) in <Language>.
```

The difficulty line resolves to either *"include a spread of easy, medium, and hard questions."* (when **Mixed**) or *"target <easy/medium/hard> difficulty."*.

### 3b. User prompt (the request)

```
Create a quiz of exactly <count> multiple-choice questions on the topic: "<topic>".
```

Where `<count>` is the chosen number of questions (clamped to 1–20) and `<topic>` is the free-text topic the user typed.

---

## 4. Structured output schema

Instead of asking for "JSON" in prose and parsing it, the app passes a Zod schema to the AI SDK's `Output.object`. The model is forced to return data matching this shape, and each field carries a `.describe()` hint the model sees:

```ts
const questionSchema = z.object({
  question:      z.string().describe("The full multiple-choice question text."),
  options:       z.array(z.string()).length(4).describe("Exactly four answer options."),
  correctAnswer: z.number().int().min(0).max(3).describe("Zero-based index of the single correct option."),
  explanation:   z.string().describe("A short, warm explanation of why the answer is correct, shown after answering."),
})

const quizSchema = z.object({
  questions: z.array(questionSchema),
})
```

Example of a single returned item:

```json
{
  "question": "What is the WHO general recommendation for exclusive breastfeeding duration?",
  "options": ["Until 2 months", "Until 4 months", "Until 6 months", "Until 12 months"],
  "correctAnswer": 2,
  "explanation": "WHO generally recommends exclusive breastfeeding for about the first 6 months, with complementary foods introduced afterward while breastfeeding continues."
}
```

### Post-generation safety net

Even with structured output, every generated quiz is passed through `sanitizeQuestions()` before use, which drops any item that isn't a well-formed question with exactly 4 options and a `correctAnswer` in range `0–3`. This guards the UI and scoring against malformed model output.

---

## 5. How the prompt satisfies each requirement

| Requirement from the brief | How it's addressed in the AI layer |
| --- | --- |
| 4 options, exactly one correct | System rule + schema (`options` length 4, `correctAnswer` 0–3) + `sanitizeQuestions` |
| Short explanation, doubles as learning tool | System rule (1–3 sentences, teach the "why") + `explanation` field |
| Factual, aligned with WHO / AAP / IDAI | System rule naming those bodies |
| No absolute medical claims | System rule: frame as "general recommendation," never a diagnosis |
| Relevant, non-repetitive, varied angles | System rule on varying angle + non-repetition; topic passed in user prompt |
| Number of questions (default 10) | User prompt `exactly <count>`; default 10 in the UI, clamped 1–20 server-side |
| Difficulty (Easy/Medium/Hard/Mixed) | Difficulty line interpolated into the system prompt |
| Language (English / Bahasa Indonesia) | "Write ALL content in `<Language>`" rule |
| Clean, parseable JSON | `Output.object` + Zod schema (no manual JSON parsing) |
| Professional, warm, accessible tone | Explicit tone rule in the system prompt |

---

## 6. Notes & possible improvements

- **Model choice:** `gemini-2.5-flash` is fast and inexpensive, well-suited to short structured generations. For higher-stakes accuracy you could switch to a larger Gemini model by changing the single `google("gemini-2.5-flash")` call.
- **No AI in scoring:** quiz grading is computed deterministically on the server from `correctAnswer`, so model variability never affects a recorded score.
- **Determinism:** generation is non-deterministic by design (variety across runs). If reproducible quizzes are ever needed, a fixed seed/temperature could be set on the model call.
- **Content disclaimer:** the UI states content is AI-generated and reflects general guidance, not medical advice — reinforcing the "general recommendation" framing baked into the prompt.
