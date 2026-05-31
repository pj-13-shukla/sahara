import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
// 1. API — Groq (Free, No Credit Card, Works in India)
// ─────────────────────────────────────────────────────────────
async function askSahara(messages, hinglish = false, userName = "") {
  const context = userName && userName !== "friend"
    ? (hinglish ? `User ka naam ${userName} hai.` : `User's name is ${userName}.`)
    : "";

  const systemPrompt = hinglish
    ? `Tu SAHARA hai — ek calm, samajhdar saathi jo tab hoti hai jab cheezein zyada feel hone lagti hain.
Tu therapist nahi hai. Motivational coach bhi nahi. Tu ek quiet, warm presence hai.

Kaise respond karna hai:
- BAHUT chhote responses de — 1-2 lines max jab tak user vent kar raha ho
- Pehle emotional validation do, advice nahi
- Jaise: "Yaar that sounds really exhausting." ya "Samajh sakti hoon kyun hurt hua."
- Kabhi long paragraphs mat likho
- Kabhi advice lists mat do
- Sirf tab question pucho jab genuinely zaroorat ho
- Tone: soft, warm, real — jaise best friend baat kar rahi ho
- Judge mat kar. Kabhi nahi.
- Agar lagey koi bohat distress mein hai toh gently iCall ka number do: 9152987821
${context}`
    : `You are SAHARA — a calm, understanding companion present when things feel too much.
You are NOT a therapist. NOT a motivational coach. A quiet, warm presence.

How to respond:
- Keep responses SHORT — 1-2 lines max while someone is venting
- Lead with emotional validation, not advice
- Examples: "That sounds exhausting." / "I understand why that hurt." / "You've been carrying a lot."
- NEVER write long paragraphs
- NEVER give advice lists
- Only ask a question when genuinely needed
- Tone: soft, warm, real — like a close friend
- Never judge. Never minimize. Never rush.
- If someone seems in serious distress, gently mention iCall: 9152987821
${context}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_GROQ_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 150,
        temperature: 0.8,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ]
      })
    });

    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim()
      || (hinglish ? "Main hoon yahan. Thoda waqt lo." : "I'm here. Take your time.");
  } catch {
    return hinglish
      ? "Kuch technical issue aa gaya. Par main hoon yahan."
      : "Something went quiet for a moment. I'm still here.";
  }
}

// ─────────────────────────────────────────────────────────────
// 2. Storage helpers
// ─────────────────────────────────────────────────────────────
const save = (key, val) => { try { localStorage.setItem("sahara_" + key, JSON.stringify(val)); } catch {} };
const load = (key, fallback = null) => { try { const v = localStorage.getItem("sahara_" + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };

// ─────────────────────────────────────────────────────────────
// 3. Time helpers
// ─────────────────────────────────────────────────────────────
const hour = () => new Date().getHours();
const isNight = () => { const h = hour(); return h >= 0 && h < 5; };
const greeting = (hi) => {
  const h = hour();
  if (h >= 0 && h < 5) return hi ? "Raat ka waqt hai" : "It's late";
  if (h < 12) return hi ? "Subah ho gayi" : "Good morning";
  if (h < 17) return hi ? "Dopahar hai" : "Good afternoon";
  return hi ? "Shaam ho gayi" : "Good evening";
};

// ─────────────────────────────────────────────────────────────
// 4. Constants — Gauri's updated mood options
// ─────────────────────────────────────────────────────────────
const MOOD_OPTIONS = [
  { val: "numb",         emoji: "😶‍🌫️", en: "Emotionally numb",         hi: "Kuch feel nahi ho raha" },
  { val: "exhausted",    emoji: "🪫",   en: "Mentally exhausted",        hi: "Dimag thak gaya hai" },
  { val: "overstimulated",emoji: "😵",  en: "Overstimulated",            hi: "Bahut zyada ho gaya" },
  { val: "lonely",       emoji: "🫂",   en: "Lonely in a crowd",         hi: "Sab mein bhi akela" },
  { val: "reassurance",  emoji: "🤍",   en: "Need reassurance",          hi: "Koi bata do sab theek hai" },
  { val: "unseen",       emoji: "👻",   en: "Feeling unseen",            hi: "Koi samajh nahi raha" },
  { val: "guilty",       emoji: "😔",   en: "Guilty for no reason",      hi: "Bina wajah guilt" },
  { val: "avoiding",     emoji: "🚪",   en: "Avoiding everyone",         hi: "Sab se door rehna hai" },
  { val: "overthinking", emoji: "🌀",   en: "Can't stop overthinking",   hi: "Dimag band nahi ho raha" },
  { val: "disconnected", emoji: "🌫️",  en: "Feeling disconnected",      hi: "Sab se cut off feel ho raha hai" },
  { val: "overwhelmed",  emoji: "🌊",   en: "Emotionally overwhelmed",   hi: "Sab kuch zyada hai" },
  { val: "distraction",  emoji: "✨",   en: "Want distraction",          hi: "Kuch aur sochna hai" },
  { val: "silence",      emoji: "🌿",   en: "Want silence",              hi: "Bas chup rehna hai" },
  { val: "okay",         emoji: "🙂",   en: "Actually okay",             hi: "Theek hoon" },
];

const STRESS_OPTIONS = [
  { val: "low",    emoji: "🟢", en: "Low",    hi: "Kam" },
  { val: "medium", emoji: "🟡", en: "Medium", hi: "Thoda" },
  { val: "high",   emoji: "🔴", en: "High",   hi: "Zyada" },
];

const PEER_SEEDS = [
  "Ek cup chai ne aaj bahut help ki. 🍵",
  "I told myself it's okay to not be okay. That helped.",
  "Walked for 10 minutes. Didn't fix everything. But helped.",
  "Rone diya khud ko. Felt lighter after. 💙",
  "Wrote down what was bothering me. It looked smaller on paper.",
  "Called an old friend. Didn't even talk about the hard stuff. Just talked.",
  "Listened to one song on repeat until I felt something.",
  "Reminded myself: this moment will pass. It always does.",
  "Thoda paani piya aur 5 min ke liye bahar gayi. Kaam aaya.",
  "Took one small step. Just one. That was enough for today.",
];

// ─────────────────────────────────────────────────────────────
// 5. Shared styles
// ─────────────────────────────────────────────────────────────
const btn = (accent = true) => ({
  background: accent ? "var(--accent)" : "transparent",
  color: accent ? "#fff" : "var(--muted)",
  border: accent ? "none" : "1px solid var(--border)",
  borderRadius: 28, padding: "13px 28px",
  fontSize: 15, cursor: "pointer",
  fontFamily: "var(--body)", fontWeight: 500,
  transition: "opacity .2s",
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
});
const card = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 20, padding: "20px",
};
const input = {
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: 16, padding: "13px 18px",
  color: "var(--text)", fontSize: 15,
  fontFamily: "var(--body)", outline: "none", width: "100%",
};
const textarea = { ...input, minHeight: 160, resize: "vertical", lineHeight: 1.8 };

// ─────────────────────────────────────────────────────────────
// 6. Sub-components
// ─────────────────────────────────────────────────────────────

function Breathing({ mode, onDone }) {
  const patterns = {
    panic: { inhale: 4, hold: 7, exhale: 8, name: "4-7-8 Breathing" },
    box:   { inhale: 4, hold: 4, exhale: 4, name: "Box Breathing"   },
  };
  const p = patterns[mode];
  const [phase, setPhase] = useState("inhale");
  const [count, setCount] = useState(p.inhale);
  const [cycle, setCycle] = useState(0);
  const MAX = 4;

  useEffect(() => {
    const seq = ["inhale", "hold", "exhale"];
    const dur = { inhale: p.inhale, hold: p.hold, exhale: p.exhale };
    let timer;
    let cur = 0, c = dur[seq[0]];
    setPhase(seq[0]); setCount(c);
    const tick = () => {
      c--;
      if (c <= 0) {
        cur = (cur + 1) % 3;
        if (cur === 0) {
          setCycle(prev => { if (prev + 1 >= MAX) { onDone(); return prev; } return prev + 1; });
        }
        c = dur[seq[cur]];
        setPhase(seq[cur]); setCount(c);
      } else setCount(c);
      timer = setTimeout(tick, 1000);
    };
    timer = setTimeout(tick, 1000);
    return () => clearTimeout(timer);
  }, []);

  const big = phase !== "exhale";
  const labels = { inhale: "Breathe in", hold: "Hold", exhale: "Breathe out" };

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:24, padding:"32px 0" }}>
      <span style={{ fontSize:13, color:"var(--muted)", letterSpacing:2, textTransform:"uppercase" }}>{p.name}</span>
      <div style={{
        width: big?180:100, height: big?180:100,
        borderRadius:"50%",
        background:"radial-gradient(circle, var(--accent-light) 0%, var(--accent) 100%)",
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"all 1s ease",
        boxShadow:"0 0 48px var(--accent-glow)",
      }}>
        <span style={{ fontSize:36, color:"#fff", fontFamily:"var(--display)" }}>{count}</span>
      </div>
      <span style={{ fontSize:22, color:"var(--text)", fontFamily:"var(--display)" }}>{labels[phase]}</span>
      <span style={{ fontSize:13, color:"var(--muted)" }}>Cycle {cycle+1} of {MAX}</span>
      <button onClick={onDone} style={btn(false)}>Stop</button>
    </div>
  );
}

function Bubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      alignSelf: isUser ? "flex-end" : "flex-start",
      maxWidth: "82%",
      background: isUser ? "var(--accent)" : "var(--surface)",
      border: isUser ? "none" : "1px solid var(--border)",
      borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
      padding: "12px 18px",
      color: isUser ? "#fff" : "var(--text)",
      fontSize: 15, lineHeight: 1.75,
    }}>
      {msg.content}
    </div>
  );
}

function Typing() {
  return (
    <div style={{
      alignSelf:"flex-start",
      background:"var(--surface)", border:"1px solid var(--border)",
      borderRadius:"20px 20px 20px 4px", padding:"14px 20px",
      display:"flex", gap:6, alignItems:"center",
    }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width:7, height:7, borderRadius:"50%",
          background:"var(--muted)",
          animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`,
        }}/>
      ))}
    </div>
  );
}

function LetterWriter({ onBack, hi }) {
  const T = (en, h) => hi ? h : en;
  const [text, setText] = useState("");
  const [days, setDays] = useState(30);
  const [done, setDone] = useState(false);

  const save_ = () => {
    if (!text.trim()) return;
    const letters = load("letters", []);
    const open = new Date(); open.setDate(open.getDate() + days);
    letters.push({ text, written: new Date().toISOString(), openOn: open.toISOString() });
    save("letters", letters);
    setDone(true);
  };

  if (done) return (
    <div style={{ textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:20, padding:"24px 0" }}>
      <span style={{ fontSize:52 }}>🌱</span>
      <span style={{ fontFamily:"var(--display)", fontSize:22, color:"var(--text)" }}>{T("Letter saved.", "Letter save ho gaya.")}</span>
      <span style={{ color:"var(--muted)", fontSize:15, lineHeight:1.8 }}>
        {T(`In ${days} days, SAHARA will show it to you.`, `${days} din mein SAHARA tujhe dikhayega.`)}<br/>
        {T("You from today is taking care of you from then.", "Aaj ka tu, kal ke tu ka khayal rakh raha hai.")}
      </span>
      <button onClick={onBack} style={btn()}>← {T("Go back", "Wapas")}</button>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <p style={{ color:"var(--muted)", fontSize:14, lineHeight:1.8 }}>
        {T("Write to your future self. They will need to hear this.", "Apne future self ko likho. Unhe zaroorat hogi yeh sunne ki.")}
      </p>
      <textarea value={text} onChange={e=>setText(e.target.value)}
        placeholder={T("Hey future me...", "Aye mere aane wale self...")}
        style={textarea}
      />
      <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <span style={{ color:"var(--muted)", fontSize:14 }}>{T("Open in:", "Kab kholo:")}</span>
        {[7,30,90].map(d=>(
          <button key={d} onClick={()=>setDays(d)} style={{
            background: days===d?"var(--accent)":"var(--surface2)",
            border:"1px solid "+(days===d?"var(--accent)":"var(--border)"),
            color: days===d?"#fff":"var(--muted)",
            padding:"6px 16px", borderRadius:20, cursor:"pointer", fontSize:13,
          }}>{d} {T("days","din")}</button>
        ))}
      </div>
      <button onClick={save_} disabled={!text.trim()} style={{ ...btn(), opacity: text.trim()?1:0.4 }}>
        🌿 {T("Seal this letter", "Letter seal karo")}
      </button>
      <button onClick={onBack} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:14 }}>
        ← {T("Back", "Wapas")}
      </button>
    </div>
  );
}

function LettersInbox({ onBack, hi }) {
  const T = (en, h) => hi ? h : en;
  const letters = load("letters", []);
  const now = new Date();
  const ready   = letters.filter(l => new Date(l.openOn) <= now);
  const waiting = letters.filter(l => new Date(l.openOn) > now);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {ready.length===0 && waiting.length===0 && (
        <p style={{ color:"var(--muted)", textAlign:"center", padding:32, fontSize:15, lineHeight:1.8 }}>
          {T("No letters yet. Write one to your future self. 🌱", "Abhi koi letter nahi hai. Apne future self ko likho. 🌱")}
        </p>
      )}
      {ready.map((l,i)=>(
        <div key={i} style={{ ...card, borderColor:"var(--accent)" }}>
          <p style={{ fontSize:12, color:"var(--accent)", marginBottom:12, textTransform:"uppercase", letterSpacing:1 }}>
            {T("A letter from","Ek letter")} {new Date(l.written).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}
          </p>
          <p style={{ color:"var(--text)", lineHeight:1.8, fontSize:15, whiteSpace:"pre-wrap" }}>{l.text}</p>
        </div>
      ))}
      {waiting.map((l,i)=>(
        <div key={i} style={{ ...card, opacity:.55 }}>
          <p style={{ fontSize:12, color:"var(--muted)", marginBottom:8 }}>
            🔒 {T("Opens on","Khulega")} {new Date(l.openOn).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}
          </p>
          <p style={{ color:"var(--muted)", fontSize:14 }}>{T("This letter is waiting for you.","Yeh letter tumhara intezaar kar raha hai.")}</p>
        </div>
      ))}
      <button onClick={onBack} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:14 }}>
        ← {T("Back","Wapas")}
      </button>
    </div>
  );
}

function PeerNotes({ onBack, hi }) {
  const T = (en, h) => hi ? h : en;
  const [notes, setNotes] = useState(() => {
    const saved = load("peer_notes",[]);
    return [...PEER_SEEDS.map(t=>({text:t,mine:false})), ...saved.map(t=>({text:t,mine:true}))];
  });
  const [val, setVal]   = useState("");
  const [done, setDone] = useState(false);

  const post = () => {
    if (!val.trim()) return;
    const saved = load("peer_notes",[]);
    save("peer_notes",[val.trim(),...saved]);
    setNotes(prev=>[{text:val.trim(),mine:true},...prev]);
    setVal(""); setDone(true);
    setTimeout(()=>setDone(false),3000);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <p style={{ color:"var(--muted)", fontSize:14, lineHeight:1.8 }}>
        {T("What helped you today when you felt low? Share anonymously. No names. No likes. Just quiet solidarity.",
           "Aaj jab tum theek nahi they, kya kaam aaya? Anonymously share karo. Koi naam nahi. Koi likes nahi. Bas ek doosre ke liye.")}
      </p>
      <div style={{ display:"flex", gap:10 }}>
        <input value={val} onChange={e=>setVal(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&post()}
          placeholder={T("What helped you today...","Aaj kya kaam aaya...")}
          style={{ ...input, borderRadius:24 }}
        />
        <button onClick={post} style={{ ...btn(), padding:"13px 20px", flexShrink:0 }}>↑</button>
      </div>
      {done && <p style={{ color:"var(--accent)", fontSize:13 }}>✓ {T("Shared quietly. Thank you.","Share ho gaya. Shukriya.")}</p>}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {notes.map((n,i)=>(
          <div key={i} style={{ ...card, padding:"14px 18px" }}>
            <p style={{ color:"var(--text2)", fontSize:14, lineHeight:1.75 }}>{n.text}</p>
          </div>
        ))}
      </div>
      <button onClick={onBack} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:14 }}>
        ← {T("Back","Wapas")}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. Main App
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [screen,   setScreen]   = useState("home");
  const [hi,       setHi]       = useState(()=>load("hi",false));
  // Skip onboarding — go straight in
  const [name,     setName]     = useState(()=>load("name","friend"));
  const [checkins, setCheckins] = useState(()=>load("checkins",[]));
  const [mood,     setMood]     = useState(null);
  const [stress,   setStress]   = useState(null);
  const [ciDone,   setCiDone]   = useState(false);
  const [msgs,     setMsgs]     = useState([]);
  const [txt,      setTxt]      = useState("");
  const [loading,  setLoading]  = useState(false);
  const [breath,   setBreath]   = useState(null);
  const [journal,  setJournal]  = useState("");
  const [jEntries, setJEntries] = useState(()=>load("journal",[]));
  const [jSaved,   setJSaved]   = useState(false);
  const chatEnd = useRef(null);
  const night = isNight();

  useEffect(()=>{ chatEnd.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);
  useEffect(()=>{ save("hi",hi); },[hi]);

  const T = (en,h) => hi ? h : en;

  const css = {
    "--accent":      night?"#7b9e87":"#2e7a50",
    "--accent-light":night?"#5a7a66":"#4a9a6a",
    "--accent-glow": night?"rgba(123,158,135,.35)":"rgba(46,122,80,.25)",
    "--bg":          night?"#0c0e0d":"#f5f8f5",
    "--surface":     night?"#131714":"#ffffff",
    "--surface2":    night?"#191e1b":"#eef2ee",
    "--border":      night?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)",
    "--text":        night?"#e4ebe5":"#1a2e22",
    "--text2":       night?"#adbfb3":"#3a5244",
    "--muted":       night?"#667870":"#7a9585",
    "--display":     "'Playfair Display', Georgia, serif",
    "--body":        "'DM Sans', system-ui, sans-serif",
  };

  const insight = (() => {
    if (checkins.length < 3) return null;
    const r = checkins.slice(-7);
    const hs = r.filter(c=>c.stress==="high").length;
    const lm = r.filter(c=>["numb","exhausted","overwhelmed","lonely","unseen"].includes(c.mood)).length;
    if (hs>=3) return T("I've noticed stress coming up often. You don't have to carry that alone.","Maine notice kiya — stress kaafi baar aa raha hai. Akele mat uthao ise.");
    if (lm>=3) return T("You've been having some heavy days. That takes real strength.","Kaafi bhaari din rhe hain. Yeh himmat hai.");
    return null;
  })();

  const saveCheckin = () => {
    const entry = { mood, stress, time: new Date().toISOString() };
    const updated = [...checkins, entry];
    setCheckins(updated); save("checkins", updated); setCiDone(true);
  };

  const goTo = (s) => {
    setScreen(s); setCiDone(false); setMood(null); setStress(null);
    setMsgs([]); setBreath(null);
  };

  const sendMsg = async (override = null) => {
    const content = override ?? txt;
    if (!content.trim() || loading) return;
    const userMsg = { role:"user", content };
    const updated = [...msgs, userMsg];
    setMsgs(updated); setTxt(""); setLoading(true);
    const reply = await askSahara(updated, hi, name);
    setMsgs(prev=>[...prev,{ role:"assistant", content:reply }]);
    setLoading(false);
  };

  const saveJournal = () => {
    if (!journal.trim()) return;
    const entry = { text:journal, time:new Date().toISOString() };
    const updated = [entry,...jEntries];
    setJEntries(updated); save("journal",updated); setJournal(""); setJSaved(true);
    setTimeout(()=>setJSaved(false),3000);
  };

  const titles = {
    home:null, checkin:T("Check in","Check in"), panic:T("Breathe with me","Mere saath saans lo"),
    talk:T("I'm listening","Sun rahi hoon"), overthinking:T("Quiet the noise","Shor band karo"),
    journal:T("Quiet journal","Quiet journal"),
    letter:T("Letter to future me","Future me ko letter"), inbox:T("Your letters","Tumhare letters"),
    peers:T("What helped others","Doosron ne kya kiya"),
  };

  const renderScreen = () => {
    switch(screen) {

      case "home": return (
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          {night && (
            <div style={{ ...card, borderColor:"var(--accent)", background:"rgba(46,122,80,.06)" }}>
              <p style={{ color:"var(--text2)", fontSize:14, lineHeight:1.8 }}>
                🌙 {T("It's late. You don't have to figure anything out right now. I'm just here.",
                       "Raat ka waqt hai. Abhi kuch bhi solve karne ki zaroorat nahi. Main bas hoon yahan.")}
              </p>
            </div>
          )}
          {insight && (
            <div style={{ ...card, borderColor:"var(--accent)" }}>
              <p style={{ color:"var(--text2)", fontSize:14, lineHeight:1.8 }}>🌿 {insight}</p>
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[
              { s:"checkin",      emoji:"🌱", en:"Check in",            hi:"Check in karo",        sub_en:"How are you feeling?",     sub_hi:"Kaisa feel ho raha hai?" },
              { s:"panic",        emoji:"🌊", en:"I'm overwhelmed",     hi:"Bahut zyada ho gaya",  sub_en:"Let's slow down",          sub_hi:"Dheere chalte hain" },
              { s:"talk",         emoji:"🌙", en:"Just talk",           hi:"Bas baat karni hai",   sub_en:"I'm listening",            sub_hi:"Main sun rahi hoon" },
              { s:"overthinking", emoji:"🧠", en:"Overthinking",        hi:"Zyada soch raha hoon", sub_en:"Quiet the noise",          sub_hi:"Shor band karte hain" },
              { s:"journal",      emoji:"📓", en:"Quiet journal",       hi:"Quiet journal",        sub_en:"Write it out",             sub_hi:"Likh do" },
              { s:"letter",       emoji:"✉️", en:"Letter to future me", hi:"Future me ko letter",  sub_en:"Write. Wait. Read.",       sub_hi:"Likho. Ruko. Padho." },
              { s:"peers",        emoji:"🤝", en:"What helped others",  hi:"Doosron ne kya kiya",  sub_en:"Anonymous notes",          sub_hi:"Anonymous notes" },
            ].map(item=>(
              <button key={item.s} onClick={()=>goTo(item.s)} style={{
                ...card, cursor:"pointer", display:"flex", flexDirection:"column",
                alignItems:"flex-start", gap:8, textAlign:"left", transition:"border-color .2s",
              }}
              onMouseEnter={e=>e.currentTarget.style.borderColor="var(--accent)"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}
              >
                <span style={{ fontSize:28 }}>{item.emoji}</span>
                <span style={{ fontSize:14, fontWeight:500, color:"var(--text)", lineHeight:1.3 }}>{hi?item.hi:item.en}</span>
                <span style={{ fontSize:12, color:"var(--muted)" }}>{hi?item.sub_hi:item.sub_en}</span>
              </button>
            ))}
          </div>
          {checkins.length>0 && (
            <div style={card}>
              <p style={{ fontSize:12, color:"var(--muted)", marginBottom:14, letterSpacing:1.5, textTransform:"uppercase" }}>
                {T("Your recent days","Haale ke din")}
              </p>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
                {checkins.slice(-10).map((c,i)=>{
                  const m = MOOD_OPTIONS.find(x=>x.val===c.mood);
                  return (
                    <div key={i} style={{
                      background:"var(--surface2)", borderRadius:10, padding:"6px 12px", fontSize:13,
                    }}>
                      {m?.emoji||"😐"}{c.stress==="high"?" ⚡":""}
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize:12, color:"var(--muted)" }}>
                {checkins.length} {T("check-ins. That's","check-ins. Yeh hai")} {checkins.length} {T("times you chose yourself.","baar khud ko choose kiya.")}
              </p>
            </div>
          )}
        </div>
      );

      case "checkin": return (
        <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
          {!ciDone ? (<>
            <p style={{ color:"var(--muted)", fontSize:15 }}>{T("How are you feeling right now?","Abhi kaisa feel ho raha hai?")}</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {MOOD_OPTIONS.map(m=>(
                <button key={m.val} onClick={()=>setMood(m.val)} style={{
                  background:mood===m.val?"var(--accent)":"var(--surface2)",
                  border:"1px solid "+(mood===m.val?"var(--accent)":"var(--border)"),
                  borderRadius:14, padding:"12px 10px", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:10, textAlign:"left",
                }}>
                  <span style={{ fontSize:20 }}>{m.emoji}</span>
                  <span style={{ fontSize:13, color:mood===m.val?"#fff":"var(--text2)", lineHeight:1.3 }}>{hi?m.hi:m.en}</span>
                </button>
              ))}
            </div>
            <p style={{ color:"var(--muted)", fontSize:15 }}>{T("Stress level?","Stress kitna hai?")}</p>
            <div style={{ display:"flex", gap:12 }}>
              {STRESS_OPTIONS.map(s=>(
                <button key={s.val} onClick={()=>setStress(s.val)} style={{
                  flex:1, background:stress===s.val?"var(--accent)":"var(--surface2)",
                  border:"1px solid "+(stress===s.val?"var(--accent)":"var(--border)"),
                  borderRadius:16, padding:"16px 8px", cursor:"pointer",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                }}>
                  <span style={{ fontSize:24 }}>{s.emoji}</span>
                  <span style={{ fontSize:13, color:stress===s.val?"#fff":"var(--text2)" }}>{hi?s.hi:s.en}</span>
                </button>
              ))}
            </div>
            <button onClick={saveCheckin} disabled={!mood||!stress} style={{ ...btn(), opacity:(mood&&stress)?1:0.4 }}>
              {T("Save check-in ✓","Save karo ✓")}
            </button>
          </>) : (
            <div style={{ textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:20, padding:"20px 0" }}>
              <span style={{ fontSize:52 }}>🤍</span>
              <h2 style={{ fontFamily:"var(--display)", fontSize:22, color:"var(--text)" }}>
                {T("Thank you for checking in.","Check in karne ke liye shukriya.")}
              </h2>
              <p style={{ color:"var(--muted)", fontSize:15, lineHeight:1.8 }}>
                {mood==="okay" || mood==="distraction"
                  ? T("Hold onto that. It counts.","Ise pakde raho. Yeh matter karta hai.")
                  : T("You showed up for yourself today. That matters.","Aaj khud ke liye aaye. Yeh matter karta hai.")}
              </p>
              {insight && <div style={{ ...card, borderColor:"var(--accent)", maxWidth:320 }}><p style={{ color:"var(--text2)", fontSize:14, lineHeight:1.8 }}>🌿 {insight}</p></div>}
              <button onClick={()=>goTo("home")} style={btn()}>{T("← Back","← Wapas")}</button>
            </div>
          )}
        </div>
      );

      case "panic": return (
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          {!breath ? (<>
            <h2 style={{ fontFamily:"var(--display)", fontSize:24, color:"var(--text)" }}>{T("Pause.","Ruko.")}</h2>
            <p style={{ color:"var(--muted)", fontSize:15, lineHeight:1.8 }}>
              {T("You don't have to figure everything out right now. Just breathe with me.",
                 "Abhi sab kuch solve karne ki zaroorat nahi. Bas mere saath saans lo.")}
            </p>
            {[
              { mode:"panic", emoji:"🌊", en:"I'm panicking",  hi:"Panic ho rahi hai",  sub:"4-7-8 breathing — slows everything down" },
              { mode:"box",   emoji:"🌙", en:"I can't sleep",  hi:"Neend nahi aa rahi", sub:"Box breathing — calms the nervous system" },
            ].map(item=>(
              <button key={item.mode} onClick={()=>setBreath(item.mode)} style={{ ...card, cursor:"pointer", textAlign:"left" }}>
                <p style={{ fontSize:18, marginBottom:6 }}>{item.emoji} {hi?item.hi:item.en}</p>
                <p style={{ fontSize:13, color:"var(--muted)" }}>{item.sub}</p>
              </button>
            ))}
            <div style={{ ...card, background:"var(--surface2)" }}>
              <p style={{ color:"var(--muted)", fontSize:13, marginBottom:12 }}>{T("When ready, also try:","Jab ready ho, yeh bhi try karo:")}</p>
              {[
                T("Drink some water. Slowly.","Thoda paani piyo. Dheere se."),
                T("Put your feet flat on the floor.","Apne pair zameen par rakh do."),
                T("Name 3 things you can see right now.","3 cheezein bolo jo abhi dikhai de rahi hain."),
              ].map((s,i)=>(
                <p key={i} style={{ color:"var(--text2)", fontSize:14, marginBottom:8 }}>→ {s}</p>
              ))}
            </div>
          </>) : (
            <Breathing mode={breath} onDone={()=>setBreath(null)}/>
          )}
        </div>
      );

      case "talk":
      case "overthinking": return (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {screen==="overthinking" && msgs.length===0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <h2 style={{ fontFamily:"var(--display)", fontSize:20, color:"var(--text)", lineHeight:1.5 }}>
                {T("Your mind is tired. We can go slowly.","Dimag thak gaya hai. Dheere chalte hain.")}
              </h2>
              {[
                T("You don't have to solve everything right now.","Abhi sab kuch solve karne ki zaroorat nahi."),
                T("Thoughts can be loud, but they aren't commands.","Khayalat shor macha sakte hain, par hukm nahi hain."),
                T("It's okay to pause. You're allowed to rest.","Rukna theek hai. Aaram karne ka haq hai."),
                T("This feeling doesn't define you.","Yeh feeling tumhari definition nahi hai."),
              ].map((line,i)=>(
                <div key={i} style={card}><p style={{ color:"var(--text2)", fontSize:15, lineHeight:1.7 }}>{line}</p></div>
              ))}
              <p style={{ color:"var(--muted)", fontSize:14, marginTop:4 }}>
                {T("What feels heaviest right now?","Abhi sabse bhaari kya lag raha hai?")}
              </p>
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:14, minHeight:msgs.length>0?200:0 }}>
            {msgs.length===0 && screen==="talk" && (
              <p style={{ color:"var(--muted)", fontSize:15, lineHeight:1.9 }}>
                🌙 {T("I'm here. You don't have to explain anything. Just say whatever's on your mind.",
                       "Main hoon yahan. Kuch explain karne ki zaroorat nahi. Jo dil mein hai, bol do.")}
              </p>
            )}
            {msgs.map((m,i)=><Bubble key={i} msg={m}/>)}
            {loading && <Typing/>}
            <div ref={chatEnd}/>
          </div>
          <div style={{ display:"flex", gap:10, paddingTop:12, borderTop:"1px solid var(--border)" }}>
            <input value={txt} onChange={e=>setTxt(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&sendMsg()}
              placeholder={T("Say anything...","Kuch bhi bolo...")}
              style={{ ...input, borderRadius:28, flex:1 }}
            />
            <button onClick={()=>sendMsg()} disabled={loading||!txt.trim()}
              style={{ ...btn(), padding:"13px 20px", opacity:(!loading&&txt.trim())?1:0.4, flexShrink:0 }}>
              ↑
            </button>
          </div>
        </div>
      );

      case "journal": return (
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          <p style={{ color:"var(--muted)", fontSize:15 }}>
            {T("Write whatever's on your mind. This is just for you.","Jo dil mein hai likh do. Yeh sirf tumhara hai.")}
          </p>
          <textarea value={journal} onChange={e=>setJournal(e.target.value)}
            placeholder={T("Today I feel...","Aaj main feel kar raha hoon...")}
            style={textarea}
          />
          <button onClick={saveJournal} disabled={!journal.trim()} style={{ ...btn(), opacity:journal.trim()?1:0.4 }}>
            {T("Save quietly 🤍","Quietly save karo 🤍")}
          </button>
          {jSaved && <p style={{ color:"var(--accent)", fontSize:14 }}>✓ {T("Saved. This moment is yours.","Save ho gaya. Yeh pal tumhara hai.")}</p>}
          {jEntries.length>0 && (<>
            <p style={{ fontSize:12, color:"var(--muted)", marginTop:8, letterSpacing:1.5, textTransform:"uppercase" }}>
              {T("Past entries","Purani entries")}
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {jEntries.slice(0,5).map((e,i)=>(
                <div key={i} style={card}>
                  <p style={{ fontSize:11, color:"var(--muted)", marginBottom:8 }}>
                    {new Date(e.time).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
                  </p>
                  <p style={{ color:"var(--text2)", fontSize:14, lineHeight:1.75 }}>
                    {e.text.slice(0,220)}{e.text.length>220?"...":""}
                  </p>
                </div>
              ))}
            </div>
          </>)}
        </div>
      );

      case "letter": return <LetterWriter onBack={()=>goTo("home")} hi={hi}/>;
      case "inbox":  return <LettersInbox onBack={()=>goTo("home")} hi={hi}/>;
      case "peers":  return <PeerNotes    onBack={()=>goTo("home")} hi={hi}/>;
      default: return null;
    }
  };

  return (
    <div style={{ ...css, minHeight:"100vh", background:"var(--bg)", fontFamily:"var(--body)", color:"var(--text)" }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
        button:focus{outline:2px solid var(--accent);outline-offset:2px}
        input:focus,textarea:focus{border-color:var(--accent)!important}
      `}</style>
      <header style={{
        position:"sticky", top:0, zIndex:100,
        background:"var(--bg)", borderBottom:"1px solid var(--border)",
        padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {screen!=="home" && (
            <button onClick={()=>goTo("home")}
              style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:22, lineHeight:1, padding:0 }}>
              ←
            </button>
          )}
          {screen==="home" ? (
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:22 }}>🌱</span>
              <div>
                <p style={{ fontFamily:"var(--display)", fontSize:20, color:"var(--text)", lineHeight:1.2 }}>SAHARA</p>
                <p style={{ fontSize:11, color:"var(--muted)" }}>{greeting(hi)}</p>
              </div>
            </div>
          ) : (
            <p style={{ fontFamily:"var(--display)", fontSize:18, color:"var(--text)" }}>{titles[screen]}</p>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {screen==="home" && (
            <button onClick={()=>goTo("inbox")}
              style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:20 }}
              title={T("Your letters","Tumhare letters")}>
              ✉️
            </button>
          )}
          <button onClick={()=>setHi(h=>!h)} style={{
            background:"var(--surface2)", border:"1px solid var(--border)",
            borderRadius:20, padding:"6px 14px", cursor:"pointer",
            fontSize:13, color:"var(--muted)", fontFamily:"var(--body)",
          }}>
            {hi?"EN":"हि"}
          </button>
        </div>
      </header>
      <main style={{ maxWidth:480, margin:"0 auto", padding:"24px 18px 100px" }}>
        {renderScreen()}
      </main>
      <footer style={{
        position:"fixed", bottom:0, left:0, right:0,
        background:"var(--bg)", borderTop:"1px solid var(--border)",
        padding:"10px 20px", textAlign:"center",
      }}>
        <p style={{ fontSize:11, color:"var(--muted)" }}>
          SAHARA v1.0 &nbsp;·&nbsp;
          {T("In crisis? Call iCall: 9152987821","Crisis mein ho? iCall pe call karo: 9152987821")}
        </p>
      </footer>
    </div>
  );
}