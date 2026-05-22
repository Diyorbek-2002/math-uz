import { useState, useEffect, useCallback } from "react";

// ── Config ────────────────────────────────────────────────────────────────
const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:8000/api";

const TOPIC_META = {
  "1.1.1": { icon: "123", color: "#6366f1" },
  "1.1.2": { icon: "÷",   color: "#8b5cf6" },
  "1.1.3": { icon: "∩",   color: "#a855f7" },
  "1.2.1": { icon: "½",   color: "#ec4899" },
  "1.2.4": { icon: "%",   color: "#f43f5e" },
  "1.3.1": { icon: "a²",  color: "#f97316" },
  "1.3.3": { icon: "√",   color: "#fb923c" },
  "1.4.1": { icon: "x",   color: "#eab308" },
  "1.4.2": { icon: "x²",  color: "#84cc16" },
  "1.4.3": { icon: "∛",   color: "#22c55e" },
  "1.4.4": { icon: "xy",  color: "#14b8a6" },
  "1.5.1": { icon: "≤",   color: "#3b82f6" },
  "1.5.2": { icon: "≥",   color: "#6366f1" },
  "1.5.3": { icon: "|x|", color: "#8b5cf6" },
  "1.6":   { icon: "f(x)",color: "#a855f7" },
  "1.7":   { icon: "sin", color: "#ec4899" },
  "1.8.1": { icon: "eˣ",  color: "#f43f5e" },
  "1.9.1": { icon: "aₙ",  color: "#f97316" },
  "1.10":  { icon: "Cₙ",  color: "#eab308" },
  "1.11":  { icon: "📝",  color: "#22c55e" },
  "1.12":  { icon: "△",   color: "#14b8a6" },
};

const C = {
  bg: "#0f0f13", surface: "#1a1a22", card: "#22222e",
  border: "#2e2e3e", accent: "#6366f1", accentL: "#818cf8",
  text: "#e8e8f0", muted: "#7070a0",
  ok: "#22c55e", err: "#f43f5e", warn: "#f59e0b",
};

// ── API ────────────────────────────────────────────────────────────────────
async function apiFetch(path) {
  const res = await fetch(API_BASE + path);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(API_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// ── Styles ─────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${C.bg};color:${C.text};font-family:'DM Sans',sans-serif;min-height:100vh}

  .hdr{padding:16px 24px;border-bottom:1px solid ${C.border};display:flex;align-items:center;gap:14px;background:${C.surface};position:sticky;top:0;z-index:10}
  .logo{font-family:'Space Mono',monospace;font-size:18px;font-weight:700;color:${C.accentL};letter-spacing:-0.5px}
  .logo span{color:${C.muted};font-weight:400}
  .hdr-right{margin-left:auto;display:flex;align-items:center;gap:10px}
  .pill{background:${C.accent}22;color:${C.accentL};border:1px solid ${C.accent}44;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500}

  .page{max-width:880px;margin:0 auto;padding:32px 24px}
  .page-title{font-family:'Space Mono',monospace;font-size:28px;font-weight:700;line-height:1.2;margin-bottom:6px}
  .page-title em{color:${C.accentL};font-style:normal}
  .page-sub{color:${C.muted};font-size:14px;margin-bottom:28px}

  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(195px,1fr));gap:12px}
  .topic-card{background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:20px;cursor:pointer;transition:all .18s;position:relative;overflow:hidden}
  .topic-card:hover{border-color:var(--tc);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.4)}
  .topic-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--tc);opacity:0;transition:opacity .18s}
  .topic-card:hover::before{opacity:1}
  .t-icon{font-family:'Space Mono',monospace;font-size:22px;font-weight:700;color:var(--tc);margin-bottom:10px}
  .t-name{font-size:14px;font-weight:500;margin-bottom:5px;line-height:1.3}
  .t-count{font-size:12px;color:${C.muted}}

  .skeleton{background:${C.card};border-radius:12px;animation:pulse 1.4s ease infinite}
  @keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}

  .quiz-wrap{max-width:680px;margin:0 auto;padding:24px}
  .qhdr{display:flex;align-items:center;gap:12px;margin-bottom:24px}
  .back{background:${C.card};border:1px solid ${C.border};color:${C.text};padding:8px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-family:'DM Sans',sans-serif;transition:all .15s}
  .back:hover{border-color:${C.accent};color:${C.accentL}}
  .qtopic{font-size:15px;font-weight:500}
  .qprog-bar{height:3px;background:${C.border};border-radius:2px;margin-bottom:24px;overflow:hidden}
  .qprog-fill{height:100%;background:${C.accent};border-radius:2px;transition:width .4s ease}

  .qcard{background:${C.card};border:1px solid ${C.border};border-radius:16px;padding:28px;margin-bottom:16px;animation:fadeUp .25s ease}
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .qmeta{display:flex;align-items:center;gap:8px;margin-bottom:16px}
  .qcode{font-family:'Space Mono',monospace;font-size:11px;color:${C.muted}}
  .dbadge{font-size:11px;padding:2px 8px;border-radius:10px;font-weight:500}
  .d-oson{background:#22c55e22;color:#22c55e}
  .d-otm{background:#f59e0b22;color:#f59e0b}
  .d-qiyin{background:#f43f5e22;color:#f43f5e}
  .timer{margin-left:auto;font-family:'Space Mono',monospace;font-size:13px;color:${C.muted}}
  .timer.warn{color:${C.warn}}
  .qnum{font-size:12px;color:${C.muted}}
  .qtext{font-size:17px;line-height:1.65;white-space:pre-line;margin-bottom:24px}

  .answers{display:flex;flex-direction:column;gap:10px}
  .abtn{display:flex;align-items:center;gap:14px;background:${C.surface};border:1px solid ${C.border};border-radius:10px;padding:14px 18px;cursor:pointer;transition:all .15s;text-align:left;font-size:15px;font-family:'DM Sans',sans-serif;color:${C.text};width:100%}
  .abtn:hover:not(:disabled){border-color:${C.accent};background:${C.accent}11}
  .abtn.selected{border-color:${C.accent};background:${C.accent}22}
  .abtn.correct{border-color:${C.ok};background:${C.ok}22}
  .abtn.wrong{border-color:${C.err};background:${C.err}22}
  .abtn:disabled{cursor:default}
  .akey{font-family:'Space Mono',monospace;font-size:13px;font-weight:700;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:${C.border};flex-shrink:0;transition:all .15s}
  .selected .akey{background:${C.accent};color:#fff}
  .correct .akey{background:${C.ok};color:#fff}
  .wrong .akey{background:${C.err};color:#fff}

  .feedback{margin-top:14px;padding:14px 18px;border-radius:10px;font-size:14px;line-height:1.6;animation:fadeUp .2s ease}
  .feedback.ok{background:${C.ok}15;border:1px solid ${C.ok}44;color:#86efac}
  .feedback.err{background:${C.err}15;border:1px solid ${C.err}44;color:#fca5a5}
  .expl{margin-top:8px;font-size:13px;opacity:.85;font-style:italic}

  .nxt{width:100%;padding:14px;background:${C.accent};color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:500;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .15s;margin-top:12px}
  .nxt:hover{background:${C.accentL};transform:translateY(-1px)}
  .nxt:disabled{opacity:.5;cursor:default;transform:none}

  .rcard{background:${C.card};border:1px solid ${C.border};border-radius:16px;padding:36px;text-align:center;animation:fadeUp .3s ease}
  .rscore{font-family:'Space Mono',monospace;font-size:56px;font-weight:700;color:${C.accentL};margin-bottom:6px}
  .rlabel{color:${C.muted};font-size:14px;margin-bottom:24px}
  .stats{display:flex;gap:12px;justify-content:center;margin-bottom:24px}
  .sbox{background:${C.surface};border:1px solid ${C.border};border-radius:10px;padding:14px 20px;text-align:center}
  .sval{font-family:'Space Mono',monospace;font-size:20px;font-weight:700}
  .slbl{font-size:11px;color:${C.muted};margin-top:2px}
  .sbox.g .sval{color:${C.ok}} .sbox.b .sval{color:${C.err}} .sbox.t .sval{color:${C.accentL}}
  .analysis{background:${C.surface};border:1px solid ${C.border};border-radius:10px;padding:16px 20px;text-align:left;margin-bottom:20px}
  .atitle{font-size:12px;color:${C.muted};margin-bottom:6px;font-weight:500;text-transform:uppercase;letter-spacing:.5px}
  .atext{font-size:14px;line-height:1.6}
  .ai-badge{font-size:10px;background:${C.accent}33;color:${C.accentL};padding:2px 6px;border-radius:4px;margin-left:6px}
  .rbtn{background:transparent;border:1px solid ${C.accent};color:${C.accentL};padding:12px 24px;border-radius:10px;font-size:14px;font-weight:500;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .15s;margin-right:10px}
  .rbtn:hover{background:${C.accent}22}

  .loading-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;gap:12px;color:${C.muted};font-size:14px}
  .spinner{width:32px;height:32px;border:2px solid ${C.border};border-top-color:${C.accent};border-radius:50%;animation:spin .8s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .err-box{background:#f43f5e15;border:1px solid #f43f5e44;border-radius:10px;padding:16px 20px;color:#fca5a5;font-size:14px;margin:20px 0}
  .retry{background:transparent;border:1px solid ${C.err};color:${C.err};padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;margin-top:10px;font-family:'DM Sans',sans-serif}
`;

// ── Timer hook ──────────────────────────────────────────────────────────────
function useTimer(running) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    setSecs(0);
    if (!running) return;
    const id = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return { secs, fmt: fmt(secs) };
}

// ── Components ──────────────────────────────────────────────────────────────
function TopicCard({ topic, onClick }) {
  const meta = TOPIC_META[topic.topic_code] || { icon: "∑", color: "#6366f1" };
  return (
    <div className="topic-card" style={{ "--tc": meta.color }} onClick={() => onClick(topic)}>
      <div className="t-icon">{meta.icon}</div>
      <div className="t-name">{topic.topic}</div>
      <div className="t-count">{topic.total} ta savol</div>
    </div>
  );
}

function SkeletonCard() {
  return <div className="skeleton" style={{ height: 110 }} />;
}

// ── Home page ───────────────────────────────────────────────────────────────
function HomePage({ onSelect }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiFetch("/questions/topics");
      setTopics(data);
    } catch (e) {
      setError("Server bilan bog'lanib bo'lmadi. Backend ishlaydimi?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="page">
      <h1 className="page-title">Matematikani <em>o'yin</em> kabi o'rgan</h1>
      <p className="page-sub">1996–2003 olimpiada savollari · Vaqt tahlili · AI tushuntirish</p>
      {error && (
        <div className="err-box">
          {error}
          <br />
          <button className="retry" onClick={load}>Qayta urinish</button>
        </div>
      )}
      <div className="grid">
        {loading
          ? Array(12).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : topics.map(t => <TopicCard key={t.topic_code} topic={t} onClick={onSelect} />)
        }
      </div>
    </div>
  );
}

// ── Quiz page ───────────────────────────────────────────────────────────────
function QuizPage({ topic, onBack }) {
  const [questions, setQuestions]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [idx, setIdx]               = useState(0);
  const [chosen, setChosen]         = useState(null);
  const [result, setResult]         = useState(null);   // AttemptResult dan API
  const [submitting, setSubmitting] = useState(false);
  const [sessionLog, setSessionLog] = useState([]);
  const [done, setDone]             = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const { secs, fmt } = useTimer(!result && !loading && questions.length > 0);

  // Savollarni yukla
  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const data = await apiFetch(`/questions/${topic.topic_code}?limit=10`);
        setQuestions(data);
      } catch {
        setError("Savollarni yuklab bo'lmadi.");
      } finally {
        setLoading(false);
      }
    })();
  }, [topic]);

  // Mavzu tugaganda AI tavsiya olish
  useEffect(() => {
    if (!done || sessionLog.length === 0) return;
    (async () => {
      setFeedbackLoading(true);
      try {
        const data = await apiFetch("/analytics/ai-feedback");
        setAiFeedback(data.feedback);
      } catch {
        setAiFeedback(null);
      } finally {
        setFeedbackLoading(false);
      }
    })();
  }, [done]);

  async function choose(letter) {
    if (result || submitting) return;
    setChosen(letter);
    setSubmitting(true);
    const q = questions[idx];
    try {
      const res = await apiPost(`/questions/${q.id}/submit`, {
        question_id: q.id,
        chosen_answer: letter,
        time_spent: secs,
      });
      setResult(res);
      setSessionLog(l => [...l, {
        q, chosen: letter,
        is_correct: res.is_correct,
        time: secs,
        correct_answer: res.correct_answer,
      }]);
    } catch {
      // Offline fallback - faqat local tekshirish
      const is_correct = q.correct_answer
        ? letter === q.correct_answer
        : false;
      setResult({ is_correct, correct_answer: q.correct_answer || "?", solution: null, explanation: null, time_spent: secs });
      setSessionLog(l => [...l, { q, chosen: letter, is_correct, time: secs, correct_answer: q.correct_answer }]);
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    if (idx + 1 >= questions.length) { setDone(true); return; }
    setIdx(i => i + 1);
    setChosen(null);
    setResult(null);
  }

  function restart() {
    setIdx(0); setChosen(null); setResult(null);
    setSessionLog([]); setDone(false); setAiFeedback(null);
  }

  if (loading) return (
    <div className="quiz-wrap">
      <div className="qhdr">
        <button className="back" onClick={onBack}>← Orqaga</button>
        <span className="qtopic">{topic.topic}</span>
      </div>
      <div className="loading-screen"><div className="spinner"/><span>Savollar yuklanmoqda...</span></div>
    </div>
  );

  if (error) return (
    <div className="quiz-wrap">
      <div className="qhdr"><button className="back" onClick={onBack}>← Orqaga</button></div>
      <div className="err-box">{error}<br/><button className="retry" onClick={onBack}>Orqaga qaytish</button></div>
    </div>
  );

  // Natija ekrani
  if (done) {
    const correct = sessionLog.filter(l => l.is_correct).length;
    const pct = Math.round((correct / sessionLog.length) * 100);
    const avgTime = Math.round(sessionLog.reduce((a, b) => a + b.time, 0) / sessionLog.length);
    return (
      <div className="quiz-wrap">
        <div className="qhdr">
          <button className="back" onClick={onBack}>← Bosh sahifa</button>
          <span className="qtopic">{topic.topic} — natija</span>
        </div>
        <div className="rcard">
          <div className="rscore">{pct}%</div>
          <div className="rlabel">{correct}/{sessionLog.length} to'g'ri javob</div>
          <div className="stats">
            <div className="sbox g"><div className="sval">{correct}</div><div className="slbl">To'g'ri</div></div>
            <div className="sbox b"><div className="sval">{sessionLog.length - correct}</div><div className="slbl">Xato</div></div>
            <div className="sbox t"><div className="sval">{avgTime}s</div><div className="slbl">O'rtacha vaqt</div></div>
          </div>
          <div className="analysis">
            <div className="atitle">
              Tahlil
              {feedbackLoading && <span className="ai-badge">AI tahlil qilmoqda...</span>}
              {aiFeedback && !feedbackLoading && <span className="ai-badge">AI</span>}
            </div>
            <div className="atext">
              {aiFeedback
                ? aiFeedback
                : feedbackLoading
                  ? "Claude tahlil qilmoqda..."
                  : pct >= 85
                    ? "Zo'r natija! Mavzuni yaxshi o'zlashtirdingiz."
                    : pct >= 60
                      ? "Yaxshi! Bir oz mashq qilsangiz yanada yaxshilanadi."
                      : "Asosiy qoidalarni qaytadan ko'rib chiqing."
              }
            </div>
          </div>
          <button className="rbtn" onClick={restart}>Qaytadan</button>
          <button className="nxt" style={{ width: "auto", padding: "12px 24px" }} onClick={onBack}>
            Boshqa mavzu →
          </button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const diffClass = q.difficulty === "oson" ? "d-oson" : q.difficulty === "qiyin" ? "d-qiyin" : "d-otm";

  return (
    <div className="quiz-wrap">
      <div className="qhdr">
        <button className="back" onClick={onBack}>← Orqaga</button>
        <span className="qtopic">{topic.topic}</span>
      </div>
      <div className="qprog-bar">
        <div className="qprog-fill" style={{ width: `${(idx / questions.length) * 100}%` }} />
      </div>

      <div className="qcard" key={idx}>
        <div className="qmeta">
          <span className="qcode">#{q.code}</span>
          <span className={`dbadge ${diffClass}`}>{q.difficulty}</span>
          <span className="qnum">{idx + 1} / {questions.length}</span>
          <span className={`timer${secs > 60 ? " warn" : ""}`}>{fmt}</span>
        </div>
        <div className="qtext">{q.question_text}</div>

        <div className="answers">
          {Object.entries(q.answers).map(([letter, text]) => {
            let cls = "abtn";
            if (result) {
              if (letter === result.correct_answer) cls += " correct";
              else if (letter === chosen) cls += " wrong";
            } else if (letter === chosen) cls += " selected";
            return (
              <button key={letter} className={cls} onClick={() => choose(letter)} disabled={!!result || submitting}>
                <span className="akey">{letter}</span>
                {text}
              </button>
            );
          })}
        </div>

        {result && (
          <div className={`feedback ${result.is_correct ? "ok" : "err"}`}>
            {result.is_correct
              ? `To'g'ri! ${secs} soniyada yechdingiz.`
              : `Noto'g'ri. To'g'ri javob: ${result.correct_answer}) ${q.answers[result.correct_answer] || ""}`
            }
            {result.explanation && (
              <div className="expl">{result.explanation}</div>
            )}
          </div>
        )}

        {result && (
          <button className="nxt" onClick={next}>
            {idx + 1 >= questions.length ? "Natijani ko'rish →" : "Keyingi savol →"}
          </button>
        )}
        {submitting && !result && (
          <button className="nxt" disabled>Tekshirilmoqda...</button>
        )}
      </div>
    </div>
  );
}

// ── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]   = useState("home");
  const [topic, setTopic] = useState(null);

  function selectTopic(t) { setTopic(t); setPage("quiz"); }
  function goHome()        { setPage("home"); setTopic(null); }

  return (
    <>
      <style>{css}</style>
      <header className="hdr">
        <div className="logo" onClick={goHome} style={{ cursor: "pointer" }}>
          Math<span>.uz</span>
        </div>
        {topic && page === "quiz" && (
          <span style={{ fontSize: 13, color: C.muted }}>{topic.topic}</span>
        )}
        <div className="hdr-right">
          <span className="pill">1996–2003</span>
        </div>
      </header>

      {page === "home" && <HomePage onSelect={selectTopic} />}
      {page === "quiz" && topic && <QuizPage topic={topic} onBack={goHome} />}
    </>
  );
}
