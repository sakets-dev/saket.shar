import { useEffect, useRef, useState } from "react";

/* ─── DESK LAMP ─── */
function DeskLamp({ dark, onToggle }) {
  const [pulling, setPulling] = useState(false);
  const [swingAngle, setSwingAngle] = useState(0);
  const swingRef = useRef({ angle: 0, vel: 0 });
  const rafRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      if (!pulling) {
        swingRef.current.vel += -0.014 * Math.sin(swingRef.current.angle);
        swingRef.current.vel *= 0.95;
        swingRef.current.angle += swingRef.current.vel;
        setSwingAngle(swingRef.current.angle);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [pulling]);

  const handleClick = () => {
    setPulling(true);
    swingRef.current.vel = 0.22;
    setTimeout(() => { setPulling(false); onToggle(); }, 200);
  };

  const base = dark ? "#1c2a20" : "#2d4a35";
  const arm = dark ? "#243028" : "#2d4a35";
  const shade1 = dark ? "#1a2e22" : "#2a4432";
  const shade2 = dark ? "#243028" : "#355440";
  const bulb = dark ? "#2a3830" : "#d4f87a";
  const stringCol = dark ? "#2e4436" : "#4a7a54";

  return (
    <div onClick={handleClick} title={dark ? "Turn on" : "Turn off"}
      style={{ width: 220, height: 380, position: "relative", cursor: "pointer", userSelect: "none", flexShrink: 0 }}>
      {!dark && <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 300, height: 55, background: "radial-gradient(ellipse,rgba(180,240,80,.22) 0%,transparent 80%)", borderRadius: "50%", pointerEvents: "none" }} />}
      <div style={{ position: "absolute", bottom: 0, left: "50%", transform: `translateX(-50%) rotate(${swingAngle * 5}deg)`, transformOrigin: "50% 100%", transition: pulling ? "none" : "transform .04s", width: 200 }}>
        <svg width="200" height="380" viewBox="0 0 200 380" style={{ display: "block" }}>
          <ellipse cx="100" cy="365" rx="60" ry="13" fill={shade1} />
          <rect x="82" y="340" width="36" height="28" rx="6" fill={base} />
          <rect x="95" y="220" width="10" height="124" rx="5" fill={arm} />
          <path d="M100,220 C100,170 65,152 42,122" stroke={arm} strokeWidth="9" strokeLinecap="round" fill="none" />
          <circle cx="42" cy="122" r="8" fill={shade2} />
          <polygon points="8,88 76,106 76,152 8,134" fill={shade1} />
          <polygon points="11,91 72,108 72,148 11,130" fill={shade2} opacity="0.6" />
          <circle cx="44" cy="121" r="11" fill={bulb} style={{ filter: dark ? "none" : "drop-shadow(0 0 14px rgba(180,240,80,.9))" }} />
        </svg>
        {!dark && <div style={{ position: "absolute", top: 95, left: -80, width: 0, height: 0, borderTop: "65px solid transparent", borderBottom: "65px solid transparent", borderRight: "140px solid rgba(190,250,90,.06)", pointerEvents: "none" }} />}
        <svg width="30" height={pulling ? 85 : 70} viewBox={`0 0 30 ${pulling ? 85 : 70}`} style={{ position: "absolute", top: 148, left: 44, transition: "height .15s" }}>
          <line x1="15" y1="0" x2={15 + swingAngle * 5} y2={pulling ? 76 : 60} stroke={stringCol} strokeWidth="2" strokeDasharray="4,4" />
          <circle cx={15 + swingAngle * 5} cy={pulling ? 76 : 60} r="5" fill={shade2} />
        </svg>
      </div>
    </div>
  );
}

/* ─── LOGO — green S matching site accent ─── */
function Logo({ dark }) {
  const fg = dark ? "#7ec87a" : "#3a7a40";
  const bg = dark ? "rgba(60,160,60,0.15)" : "rgba(40,120,40,0.1)";
  const bd = dark ? "rgba(100,200,100,0.28)" : "rgba(60,140,60,0.22)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, border: `1.5px solid ${bd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 700, color: fg, letterSpacing: "-.03em", lineHeight: 1, userSelect: "none" }}>S</span>
      </div>
      <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, color: fg, letterSpacing: "-.01em" }}>saket.shar</span>
    </div>
  );
}

/* ─── REVEAL ─── */
function Reveal({ children, delay = 0, style = {}, as: Tag = "div" }) {
  const [v, setV] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setV(true), delay); obs.disconnect(); }
    }, { threshold: 0.05 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [delay]);
  return (
    <Tag ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(18px)", transition: `opacity .8s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .8s cubic-bezier(.16,1,.3,1) ${delay}ms`, ...style }}>
      {children}
    </Tag>
  );
}

/* ─── SOCIAL LINK ─── */
function SocialLink({ href, icon, dark }) {
  const [hov, setHov] = useState(false);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", border: `1px solid ${dark ? (hov ? "rgba(100,200,100,.4)" : "rgba(80,160,80,.2)") : (hov ? "#90c890" : "#c0d8c0")}`, color: dark ? (hov ? "#90d890" : "#6a9a70") : (hov ? "#3a7a40" : "#5a7a60"), background: hov ? (dark ? "rgba(80,180,80,.12)" : "rgba(60,140,60,.08)") : "transparent", transition: "all .22s", textDecoration: "none", fontSize: 14 }}>
      {icon}
    </a>
  );
}

/* ─── PROJECT CARD ─── */
function ProjectCard({ p, dark }) {
  const [flipped, setFlipped] = useState(false);
  const icons = { "AI / Voice": "AI", "Full-Stack": "FS", "Computer Vision": "CV", "CV / ML": "ML" };
  const iconLabel = icons[p.tag] || "//";
  const cardBg = dark ? "#111c14" : "#ffffff";
  const cardBd = dark ? "rgba(80,160,80,.18)" : "#d8eed8";
  const cardShadow = dark ? "0 8px 32px rgba(0,0,0,.4)" : "0 8px 32px rgba(60,140,60,.07)";
  const titleCol = dark ? "#e8f5e8" : "#1e3e24";
  const subCol = dark ? "#8ab090" : "#3a5a40";
  const techCol = dark ? "#7ec87a" : "#3a6a40";
  const backBg = dark ? "linear-gradient(135deg,#0e1a10,#162418)" : "linear-gradient(135deg,#2a4a30,#3a6a40)";
  return (
    <div style={{ perspective: 1000, cursor: "pointer", height: 260 }} onClick={() => setFlipped(f => !f)}>
      <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)", transition: "transform .55s cubic-bezier(.16,1,.3,1)" }}>
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", background: cardBg, border: `1px solid ${cardBd}`, borderRadius: 14, boxShadow: cardShadow, padding: "22px 20px", display: "flex", flexDirection: "column" }}>
          {p.winner && <div style={{ position: "absolute", top: 0, left: 20, right: 20, height: 2, background: "linear-gradient(90deg,#c9a96e,#e8c87a)", borderRadius: "0 0 2px 2px" }} />}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: dark ? "rgba(80,160,80,.14)" : "#eef8ee", border: `1px solid ${cardBd}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 500, color: techCol, letterSpacing: ".05em" }}>{iconLabel}</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              {p.winner && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, letterSpacing: ".12em", color: "#c9a96e", background: dark ? "rgba(201,169,110,.1)" : "#fffbf0", border: "1px solid rgba(201,169,110,.28)", padding: "2px 8px" }}>WINNER</span>}
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, letterSpacing: ".1em", color: subCol, background: dark ? "rgba(80,160,80,.08)" : "#eef8ee", border: `1px solid ${cardBd}`, padding: "2px 8px" }}>{p.tag}</span>
            </div>
          </div>
          <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 600, color: titleCol, lineHeight: 1.3, marginBottom: 10, letterSpacing: "-.01em" }}>{p.title}</h3>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12.5, lineHeight: 1.75, color: subCol, fontWeight: 300, flex: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>{p.about}</p>
          <div style={{ marginTop: 10, fontFamily: "'DM Mono',monospace", fontSize: 8, color: dark ? "rgba(126,200,122,.35)" : "#80a880", letterSpacing: ".1em" }}>TAP TO SEE MORE</div>
        </div>
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", background: backBg, borderRadius: 14, boxShadow: cardShadow, padding: "22px 20px", transform: "rotateY(180deg)", display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, color: "#c8f0c8", marginBottom: 8 }}>{p.title}</div>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11.5, lineHeight: 1.75, color: "rgba(220,255,220,.75)", fontWeight: 300, flex: 1, overflow: "hidden" }}>{p.about}</p>
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
              {p.tech.split(",").slice(0, 5).map((t, i) => (
                <span key={i} style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "rgba(200,240,200,.8)", background: "rgba(255,255,255,.08)", border: "1px solid rgba(200,240,200,.15)", padding: "3px 8px", borderRadius: 3 }}>{t.trim()}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <a href={p.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: ".1em", color: "#c8f0c8", background: "rgba(255,255,255,.1)", border: "1px solid rgba(200,240,200,.2)", padding: "7px 14px", borderRadius: 6, textDecoration: "none", transition: "background .2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.18)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.1)"}>GITHUB</a>
              {p.devpost && (
                <a href={p.devpost} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: ".1em", color: "#c9a96e", background: "rgba(201,169,110,.12)", border: "1px solid rgba(201,169,110,.28)", padding: "7px 14px", borderRadius: 6, textDecoration: "none", transition: "background .2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(201,169,110,.22)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(201,169,110,.12)"}>DEVPOST</a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── EXPERIENCE TIMELINE ─── */
function ExperienceTimeline({ dark }) {
  const [active, setActive] = useState(null);
  const experiences = [
    { role: "Incomfing Software Development Engineer Intern", company: "Amazon", period: "Jun 2026 – Sep 2026", location: "Vancouver / Remote", color: "#ff9900", points: ["Contributing to development and optimization of internal AI tools and scalable cloud infrastructure using AWS services.", "Collaborating with engineering teams to implement efficient backend solutions and enhance data processing pipelines."] },
    { role: "Software Engineer", company: "COBWEB", period: "Sep 2023 – May 2025", location: "Waterloo, Ontario", color: "#7ec87a", points: ["Migrated core codebase from Java to Python, increasing AI/ML model flexibility and supporting implementation of sophisticated agent behaviors and collaborative development protocols.", "Established CI/CD pipelines to enhance model scalability and reliability through testing and agile deployment strategies."] },
    { role: "Camp Counsellor", company: "Heartland Church", period: "Jun 2022 – Aug 2022", location: "Mississauga, Ontario", color: "#60a5fa", points: ["Led a team of 3 counselors to design and implement age-appropriate activities fostering personal growth, skill development, and team building for 100+ campers — resulting in a 15% increase in positive feedback.", "Pioneered a new 'Leadership Academy' program consisting of 10 age-appropriate activities teaching math, science, and leadership skills to 60 campers."] },
  ];
  const titleCol = dark ? "#e8f5e8" : "#1a3020";
  const subCol = dark ? "#8ab090" : "#3a5a40";
  const lineBg = dark ? "rgba(80,160,80,.2)" : "#c8e0c8";
  const cardBg = dark ? "#0f1a11" : "#ffffff";
  const cardBd = dark ? "rgba(80,160,80,.2)" : "#d8eed8";
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", left: 18, top: 12, bottom: 12, width: 1.5, background: lineBg }} />
      {experiences.map((exp, i) => {
        const isOpen = active === i;
        return (
          <div key={i} style={{ position: "relative", paddingLeft: 52 }}>
            <div onClick={() => setActive(isOpen ? null : i)} style={{ position: "absolute", left: 10, top: 22, width: 18, height: 18, borderRadius: "50%", background: isOpen ? exp.color : (dark ? "#0b1410" : "#f4fbf4"), border: `2px solid ${isOpen ? exp.color : lineBg}`, cursor: "pointer", transition: "all .25s", transform: isOpen ? "scale(1.25)" : "scale(1)", zIndex: 2, boxShadow: isOpen ? `0 0 0 4px ${exp.color}28` : "none" }} />
            <div onClick={() => setActive(isOpen ? null : i)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0", cursor: "pointer", borderBottom: `1px solid ${isOpen ? "transparent" : lineBg}` }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 17, fontWeight: 600, color: titleCol, letterSpacing: "-.02em" }}>{exp.role}</span>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 500, color: exp.color, opacity: .9 }}>{exp.company}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 18, flexShrink: 0, marginLeft: 20 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: ".1em", color: dark ? "#6a8a70" : "#5a7a60" }}>{exp.period}</span>
                <span style={{ fontSize: 18, color: dark ? "#5a8060" : "#6a9070", transition: "transform .3s", display: "inline-block", transform: isOpen ? "rotate(45deg)" : "rotate(0deg)", lineHeight: 1 }}>+</span>
              </div>
            </div>
            <div style={{ overflow: "hidden", maxHeight: isOpen ? 320 : 0, opacity: isOpen ? 1 : 0, transition: "max-height .45s cubic-bezier(.16,1,.3,1), opacity .3s ease" }}>
              <div style={{ background: cardBg, border: `1px solid ${cardBd}`, borderLeft: `3px solid ${exp.color}`, borderRadius: 10, padding: "18px 20px", marginBottom: 10 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: ".1em", color: dark ? "#567060" : "#7a9a80", marginBottom: 14, textTransform: "uppercase" }}>{exp.location}</div>
                <ul style={{ paddingLeft: 0, margin: 0, listStyle: "none" }}>
                  {exp.points.map((pt, pi) => (
                    <li key={pi} style={{ display: "flex", gap: 10, fontFamily: "'Outfit',sans-serif", fontSize: 14, lineHeight: 1.78, color: subCol, fontWeight: 300, marginBottom: pi < exp.points.length - 1 ? 12 : 0 }}>
                      <span style={{ color: exp.color, flexShrink: 0, marginTop: 4, fontSize: 10 }}>▸</span>{pt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── SECTION LABEL — no hints, no "extra" ─── */
function SectionLabel({ num, label, dark }) {
  const col = dark ? "rgba(80,160,80,.18)" : "#c8e0c8";
  const textCol = dark ? "rgba(160,220,160,.75)" : "#4a7a50";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 52 }}>
      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: ".22em", color: textCol, textTransform: "uppercase", whiteSpace: "nowrap" }}>{num} / {label}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${col},transparent)` }} />
    </div>
  );
}

/* ─── MAIN APP ─── */
export default function App() {
  const [dark, setDark] = useState(true);
  const bg = dark ? "#0b1410" : "#f4fbf4";
  const fg = dark ? "#d8f0d8" : "#1a3020";
  const sub = dark ? "#7a9a80" : "#4a6a50";
  const border = dark ? "rgba(80,160,80,.15)" : "#d0e8d0";
  const navBg = dark ? "rgba(11,20,16,.92)" : "rgba(244,251,244,.94)";
  const accent = dark ? "#7ec87a" : "#3a7a40";

  const works = [
    { title: "Zed.AI — Your AI Study Buddy", tag: "AI / Voice", winner: true, about: "An autonomous AI study partner that connects to your student account, responds to your voice, and uses Gemini 2.5 to generate study plans, quizzes, and progress tracking. Authenticated via Auth0, built at EmberHacks.", tech: "React, Flask, Gemini 2.5, ElevenLabs, Auth0, Porcupine, Playwright", link: "https://github.com/alextgu/emberhacks", devpost: "https://devpost.com/software/zed-7z0wg4" },
    { title: "DFS — Depth First Social", tag: "Full-Stack", winner: true, about: "Matches people who think alike using your Gemini conversation history. Builds a 6-axis interest profile and uses Snowflake vector similarity to find compatible matches. Ephemeral chats expire after 10 minutes, built at DeerHacks.", tech: "Next.js, React, FastAPI, Snowflake, Supabase, Auth0, Solana", link: "https://github.com/alextgu/deerhacks", devpost: "https://devpost.com/software/deer-deer-deer" },
    { title: "Sign Language Interpreter", tag: "Computer Vision", about: "Real-time sign language detection using MediaPipe hand landmarks and a KNN classifier. Captures video input, extracts keypoints, and translates gestures into readable text.", tech: "Python, OpenCV, MediaPipe, KNN", link: "https://github.com/sakets-dev/sign_language_detector" },
    { title: "Vision-Controlled Mouse", tag: "CV / ML", about: "Control your mouse cursor entirely through hand gestures using MediaPipe landmark detection and PyAutoGUI. No hardware required.", tech: "Python, OpenCV, MediaPipe, PyAutoGUI, NumPy", link: "https://github.com/sakets-dev/vision_controlled_mouse" },
    { title: "Textify — PDF & Image to Text", tag: "Full-Stack", about: "Full-stack OCR web app that converts PDFs and images into editable text using Tesseract and PDFPlumber.", tech: "Python, Flask, PDFPlumber, pytesseract, HTML, CSS, JavaScript", link: "https://github.com/sakets-dev/textify" },
  ];

  const stack = ["React", "Next.js", "Python", "TypeScript", "AWS", "Snowflake", "Databricks", "PostgreSQL", "Docker", "Flask", "OpenCV", "Git"];
  const GH = <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>;
  const LI = <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>;
  const EM = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700&family=DM+Mono:wght@300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        body{overflow-x:hidden;-webkit-font-smoothing:antialiased;}
        ::selection{background:#4a9a50;color:#fff;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:rgba(80,160,80,.25);border-radius:99px;}
        a{text-decoration:none;color:inherit;}
      `}</style>
      <div style={{ background: bg, color: fg, minHeight: "100vh", transition: "background .5s, color .4s" }}>

        {/* NAV */}
        <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 52px", height: 58, background: navBg, borderBottom: `1px solid ${border}`, backdropFilter: "blur(16px)", transition: "background .5s, border-color .4s" }}>
          <Logo dark={dark} />
          <div style={{ display: "flex", gap: 2 }}>
            {[["About", "#about"], ["Experience", "#experience"], ["Work", "#work"]].map(([l, h]) => (
              <a key={l} href={h} style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 400, color: sub, padding: "6px 14px", borderRadius: 6, transition: "color .2s, background .2s" }}
                onMouseEnter={e => { e.currentTarget.style.color = accent; e.currentTarget.style.background = dark ? "rgba(80,160,80,.1)" : "#e8f8e8"; }}
                onMouseLeave={e => { e.currentTarget.style.color = sub; e.currentTarget.style.background = "transparent"; }}>{l}</a>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SocialLink href="https://github.com/sakets-dev" icon={GH} dark={dark} />
            <SocialLink href="https://www.linkedin.com/in/saket-sharma-3a37871a7/" icon={LI} dark={dark} />
            <SocialLink href="mailto:saketshar04@gmail.com" icon={EM} dark={dark} />
          </div>
        </nav>

        {/* HERO */}
        <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "56px 52px 0", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ flex: 1, paddingRight: 56 }}>
            <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 15, letterSpacing: ".2em", color: accent, textTransform: "uppercase", marginBottom: 18, fontWeight: 400 }}>Hello, I'm</p>
            <h1 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: "clamp(68px,9vw,114px)", lineHeight: .91, color: dark ? "#eaf5ea" : "#1a3020", letterSpacing: "-.04em", marginBottom: 26 }}>
              Saket<span style={{ color: accent }}>.</span>
            </h1>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: dark ? "rgba(255,153,0,.08)" : "rgba(255,153,0,.08)", border: `1px solid ${dark ? "rgba(255,153,0,.25)" : "rgba(255,153,0,.38)"}`, borderRadius: 6, padding: "8px 16px", marginBottom: 28 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff9900" }} />
              <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13.5, fontWeight: 500, color: dark ? "#ffba50" : "#a06010" }}>Incoming SDE @ Amazon, 2026</span>
            </div>
            <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 300, lineHeight: 1.8, color: dark ? "#9abaa0" : "#2a4a30", maxWidth: 420, marginBottom: 32, transition: "color .4s" }}>
              CS & Statistics at the University of Toronto. I build software that's elegant, fast, and actually ships.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 36 }}>
              {["CS + Statistics", "University of Toronto"].map(t => (
                <span key={t} style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: ".1em", color: dark ? "#6a9a70" : "#4a7a50", background: dark ? "rgba(80,160,80,.1)" : "#e8f8e8", border: `1px solid ${border}`, padding: "5px 12px", borderRadius: 3 }}>{t}</span>
              ))}
            </div>
            <a href="#work" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 500, color: "#fff", background: dark ? "linear-gradient(135deg,#2a5a30,#3a7a40)" : "linear-gradient(135deg,#2a5a30,#4a9a50)", padding: "13px 30px", borderRadius: 10, boxShadow: dark ? "0 6px 20px rgba(40,120,50,.3)" : "0 6px 20px rgba(60,160,60,.25)", transition: "transform .2s, box-shadow .2s", letterSpacing: ".01em" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = dark ? "0 10px 28px rgba(40,120,50,.5)" : "0 10px 28px rgba(60,160,60,.38)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = dark ? "0 6px 20px rgba(40,120,50,.3)" : "0 6px 20px rgba(60,160,60,.25)"; }}>
              View My Work
            </a>
          </div>
          <div style={{ flexShrink: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", height: 520, paddingBottom: 60, position: "relative" }}>
            {!dark && <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(180,250,80,.14) 0%,transparent 70%)", pointerEvents: "none" }} />}
            {dark && <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(80,160,80,.07) 0%,transparent 70%)", pointerEvents: "none" }} />}
            <DeskLamp dark={dark} onToggle={() => setDark(d => !d)} />
            <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: ".16em", color: dark ? "rgba(126,200,122,.28)" : "rgba(60,120,60,.38)", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              {dark ? "pull to turn on" : "pull to turn off"}
            </div>
          </div>
        </section>

        <div style={{ height: 1, background: dark ? "rgba(80,160,80,.1)" : "#d8eed8", maxWidth: 1100, margin: "0 auto" }} />

        {/* ABOUT */}
        <section id="about" style={{ maxWidth: 1200, margin: "0 auto", padding: "88px 52px" }}>
          <Reveal><SectionLabel num="02" label="About" dark={dark} /></Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: "0 64px", alignItems: "start" }}>
            <Reveal delay={60}>
              <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(24px,2.8vw,38px)", fontWeight: 600, lineHeight: 1.25, color: dark ? "#d8ecd8" : "#1a3020", letterSpacing: "-.02em", marginBottom: 20 }}>
                CS & Statistics at UofT.<br />
                <span style={{ fontWeight: 300, color: dark ? "#8aaa90" : "#4a6a50" }}>I love the intersection of math and product.</span>
              </h2>
              <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, lineHeight: 1.85, color: dark ? "#9abaa0" : "#2a4a30", fontWeight: 300, marginBottom: 16 }}>
                I build with the belief that great software should feel as good as it works. Attended <strong style={{ color: accent, fontWeight: 500 }}>YC Startup School</strong> and <strong style={{ color: accent, fontWeight: 500 }}>QSYS</strong> — multiple hackathon wins, building and shipping under pressure.
              </p>
              <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, lineHeight: 1.85, color: dark ? "#6a8a70" : "#5a7a60", fontWeight: 300 }}>
                Now heading into my first SDE role at Amazon. Always looking for the next interesting problem to solve.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <div style={{ background: dark ? "rgba(80,160,80,.05)" : "#eef8ee", border: `1px solid ${border}`, borderRadius: 14, padding: "26px 22px" }}>
                <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: ".2em", color: dark ? "rgba(160,220,160,.55)" : "#5a8a60", textTransform: "uppercase", marginBottom: 16 }}>Stack</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {stack.map(s => (
                    <span key={s} style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: dark ? "#6a9a70" : "#4a7a50", background: dark ? "rgba(80,160,80,.1)" : "#fff", border: `1px solid ${dark ? "rgba(80,160,80,.2)" : "#c8e0c8"}`, padding: "5px 11px", borderRadius: 5, transition: "background .2s, color .2s, transform .2s", cursor: "default" }}
                      onMouseEnter={e => { e.currentTarget.style.background = dark ? "rgba(80,160,80,.22)" : "#d8f0d8"; e.currentTarget.style.color = dark ? "#b0e8b0" : "#2a5a30"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = dark ? "rgba(80,160,80,.1)" : "#fff"; e.currentTarget.style.color = dark ? "#6a9a70" : "#4a7a50"; e.currentTarget.style.transform = "none"; }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <div style={{ height: 1, background: dark ? "rgba(80,160,80,.1)" : "#d8eed8", maxWidth: 1100, margin: "0 auto" }} />

        {/* EXPERIENCE */}
        <section id="experience" style={{ maxWidth: 1200, margin: "0 auto", padding: "88px 52px" }}>
          <Reveal><SectionLabel num="03" label="Experience" dark={dark} /></Reveal>
          <Reveal delay={60}><ExperienceTimeline dark={dark} /></Reveal>
        </section>

        <div style={{ height: 1, background: dark ? "rgba(80,160,80,.1)" : "#d8eed8", maxWidth: 1100, margin: "0 auto" }} />

        {/* WORK */}
        <section id="work" style={{ maxWidth: 1200, margin: "0 auto", padding: "88px 52px 120px" }}>
          <Reveal><SectionLabel num="04" label="Selected Work" dark={dark} /></Reveal>
          <Reveal delay={60}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
              {works.map((w) => <ProjectCard key={w.title} p={w} dark={dark} />)}
            </div>
          </Reveal>
        </section>

      </div>
    </>
  );
}