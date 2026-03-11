import { useEffect, useRef, useState } from "react";

/* ─── CURSOR TRAIL ─── */
function CursorTrail() {
  const canvasRef = useRef(null);
  const dots = useRef([]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const onMove = (e) => {
      for (let i = 0; i < 3; i++) {
        dots.current.push({ x: e.clientX+(Math.random()-.5)*10, y: e.clientY+(Math.random()-.5)*10, r: Math.random()*2.2+.5, alpha:.55, vx:(Math.random()-.5)*.5, vy:(Math.random()-.5)*.5-.3 });
      }
    };
    window.addEventListener("mousemove", onMove);
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      dots.current = dots.current.filter(d=>d.alpha>.01);
      for(const d of dots.current){ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,Math.PI*2);ctx.fillStyle=`rgba(160,190,255,${d.alpha})`;ctx.fill();d.x+=d.vx;d.y+=d.vy;d.alpha*=.87;d.r*=.97;}
      raf=requestAnimationFrame(draw);
    };
    draw();
    return()=>{window.removeEventListener("resize",resize);window.removeEventListener("mousemove",onMove);cancelAnimationFrame(raf);};
  },[]);
  return <canvas ref={canvasRef} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9998}}/>;
}

/* ─── INTERACTIVE 3D PARTICLE GLOBE ─── */
function ParticleGlobe() {
  const canvasRef = useRef(null);
  const stateRef = useRef({ rotX:0.35, rotY:0, velX:0, velY:0.003, dragging:false, lastX:0, lastY:0, hovered:false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W=420, H=420, R=148;
    canvas.width=W; canvas.height=H;

    // fibonacci sphere points
    const COUNT=300;
    const pts=[];
    const golden=Math.PI*(3-Math.sqrt(5));
    for(let i=0;i<COUNT;i++){
      const y=1-(i/(COUNT-1))*2;
      const r=Math.sqrt(1-y*y);
      const th=golden*i;
      pts.push({ox:Math.cos(th)*r, oy:y, oz:Math.sin(th)*r});
    }
    // scatter layer
    for(let i=0;i<50;i++){
      const u=Math.random(),v=Math.random();
      const th=2*Math.PI*u, ph=Math.acos(2*v-1);
      pts.push({ox:Math.sin(ph)*Math.cos(th), oy:Math.cos(ph), oz:Math.sin(ph)*Math.sin(th)});
    }

    let raf;
    const s=stateRef.current;

    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      const cx=W/2, cy=H/2;

      if(!s.dragging){
        s.rotY+=s.velY;
        s.velX*=0.96;
        s.rotX+=s.velX;
      }

      const cosX=Math.cos(s.rotX),sinX=Math.sin(s.rotX);
      const cosY=Math.cos(s.rotY),sinY=Math.sin(s.rotY);

      const proj=pts.map(p=>{
        let x=p.ox*cosY-p.oz*sinY;
        let z=p.ox*sinY+p.oz*cosY;
        let y=p.oy;
        let y2=y*cosX-z*sinX;
        let z2=y*sinX+z*cosX;
        const scale=(z2+2.4)/3.4;
        return{sx:cx+x*R*scale, sy:cy+y2*R*scale, z:z2, scale};
      });

      proj.sort((a,b)=>a.z-b.z);

      // connections — front-facing only
      const front=proj.filter(p=>p.z>0);
      for(let i=0;i<front.length;i++){
        for(let j=i+1;j<front.length;j++){
          const dx=front[i].sx-front[j].sx;
          const dy=front[i].sy-front[j].sy;
          const d=Math.sqrt(dx*dx+dy*dy);
          if(d<40){
            const a=(1-d/40)*0.15*Math.min(front[i].scale,front[j].scale);
            ctx.beginPath();
            ctx.moveTo(front[i].sx,front[i].sy);
            ctx.lineTo(front[j].sx,front[j].sy);
            ctx.strokeStyle=`rgba(160,180,255,${a})`;
            ctx.lineWidth=0.55;
            ctx.stroke();
          }
        }
      }

      // dots
      for(const p of proj){
        const facing=(p.z+1)/2;
        const a=facing*0.8+0.08;
        const sz=p.scale*2.0;
        // color by depth
        const t=(p.z+1)/2;
        const r=Math.round(120+t*40);
        const g=Math.round(150+t*30);
        const b=255;
        ctx.beginPath();
        ctx.arc(p.sx,p.sy,Math.max(sz*0.42,0.4),0,Math.PI*2);
        ctx.fillStyle=`rgba(${r},${g},${b},${a*p.scale})`;
        ctx.fill();
      }

      // outer soft glow
      const grd=ctx.createRadialGradient(cx,cy,R*0.8,cx,cy,R*1.2);
      grd.addColorStop(0,"rgba(100,120,255,0.0)");
      grd.addColorStop(0.5,"rgba(100,120,255,0.055)");
      grd.addColorStop(1,"rgba(100,120,255,0.0)");
      ctx.beginPath(); ctx.arc(cx,cy,R*1.15,0,Math.PI*2);
      ctx.fillStyle=grd; ctx.fill();

      raf=requestAnimationFrame(draw);
    };
    draw();

    const onDown=(e)=>{ s.dragging=true; s.lastX=e.clientX??e.touches?.[0]?.clientX; s.lastY=e.clientY??e.touches?.[0]?.clientY; };
    const onMove2=(e)=>{
      if(!s.dragging)return;
      const x=e.clientX??e.touches?.[0]?.clientX;
      const y=e.clientY??e.touches?.[0]?.clientY;
      s.velY=(x-s.lastX)*0.011;
      s.velX=(y-s.lastY)*0.011;
      s.rotY+=s.velY; s.rotX+=s.velX;
      s.lastX=x; s.lastY=y;
    };
    const onUp=()=>{s.dragging=false;};

    canvas.addEventListener("mousedown",onDown);
    canvas.addEventListener("touchstart",onDown,{passive:true});
    window.addEventListener("mousemove",onMove2);
    window.addEventListener("touchmove",onMove2,{passive:true});
    window.addEventListener("mouseup",onUp);
    window.addEventListener("touchend",onUp);

    return()=>{
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousedown",onDown);
      canvas.removeEventListener("touchstart",onDown);
      window.removeEventListener("mousemove",onMove2);
      window.removeEventListener("touchmove",onMove2);
      window.removeEventListener("mouseup",onUp);
      window.removeEventListener("touchend",onUp);
    };
  },[]);

  return(
    <div style={{position:"absolute",right:"3%",top:"50%",transform:"translateY(-52%)",width:420,height:420,pointerEvents:"all",userSelect:"none"}}>
      <canvas ref={canvasRef} style={{cursor:"grab",display:"block"}}/>
      <div style={{position:"absolute",bottom:-26,left:"50%",transform:"translateX(-50%)",fontSize:10,color:"rgba(255,255,255,0.18)",letterSpacing:"0.1em",whiteSpace:"nowrap",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>
        DRAG TO ROTATE
      </div>
    </div>
  );
}

/* ─── REVEAL ─── */
function Reveal({children,delay=0,style={},tag="div"}){
  const[show,setShow]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setShow(true),delay);return()=>clearTimeout(t);},[delay]);
  const Tag=tag;
  return<Tag style={{opacity:show?1:0,transform:show?"translateY(0)":"translateY(20px)",transition:`opacity 0.8s cubic-bezier(0.16,1,0.3,1),transform 0.8s cubic-bezier(0.16,1,0.3,1)`,transitionDelay:`${delay}ms`,...style}}>{children}</Tag>;
}

/* ─── GRID BG ─── */
function GridBg(){
  return(
    <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",backgroundSize:"42px 42px",maskImage:"radial-gradient(ellipse 85% 75% at 50% 35%, black 20%, transparent 100%)",WebkitMaskImage:"radial-gradient(ellipse 85% 75% at 50% 35%, black 20%, transparent 100%)"}}/>
      <div style={{position:"absolute",top:"-15%",left:"-5%",width:"45%",height:"55%",borderRadius:"50%",background:"radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 70%)",animation:"blobA 20s ease-in-out infinite alternate"}}/>
      <div style={{position:"absolute",bottom:"5%",right:"-5%",width:"40%",height:"50%",borderRadius:"50%",background:"radial-gradient(ellipse, rgba(59,130,246,0.05) 0%, transparent 70%)",animation:"blobB 25s ease-in-out infinite alternate"}}/>
    </div>
  );
}

/* ─── EXPANDABLE PROJECT ROW ─── */
function ProjectRow({p,delay}){
  const[open,setOpen]=useState(false);
  return(
    <Reveal delay={delay}>
      <div onClick={()=>setOpen(o=>!o)} style={{borderBottom:"1px solid rgba(255,255,255,0.07)",cursor:"none",background:open?"rgba(255,255,255,0.025)":"transparent",borderRadius:open?12:0,overflow:"hidden",transition:"background 0.25s ease"}}>
        <div
          style={{display:"flex",alignItems:"center",padding:"18px 16px",transition:"padding-left 0.3s cubic-bezier(0.16,1,0.3,1)"}}
          onMouseEnter={e=>e.currentTarget.style.paddingLeft="26px"}
          onMouseLeave={e=>e.currentTarget.style.paddingLeft="16px"}
        >
          <span style={{width:8,height:8,borderRadius:"50%",background:p.accent,display:"inline-block",marginRight:20,flexShrink:0,boxShadow:`0 0 10px ${p.accent}99`}}/>
          <span style={{fontFamily:"'Instrument Serif', serif",fontSize:24,fontWeight:400,color:"#ede9e2",letterSpacing:"-0.02em",flex:1}}>{p.title}</span>

          {p.winner&&(
            <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:999,fontSize:10,fontWeight:700,letterSpacing:"0.08em",background:"linear-gradient(90deg,rgba(251,191,36,0.18),rgba(245,158,11,0.12))",border:"1px solid rgba(251,191,36,0.32)",color:"#fbbf24",marginRight:14,whiteSpace:"nowrap"}}>
              🏆 HACKATHON WINNER
            </span>
          )}

          <span style={{fontSize:11,fontWeight:500,padding:"3px 10px",borderRadius:999,background:p.tagBg,border:`1px solid ${p.tagBorder}`,color:p.accent,marginRight:20,letterSpacing:"0.04em"}}>{p.tag}</span>
          <span style={{fontSize:12,color:"rgba(255,255,255,0.22)",marginRight:18,fontWeight:300}}>{p.year}</span>
          <span style={{fontSize:17,color:"rgba(255,255,255,0.3)",transition:"transform 0.3s ease",transform:open?"rotate(45deg)":"rotate(0deg)",display:"inline-block",lineHeight:1}}>+</span>
        </div>

        <div style={{maxHeight:open?300:0,overflow:"hidden",transition:"max-height 0.45s cubic-bezier(0.16,1,0.3,1)"}}>
          <div style={{padding:"0 16px 24px 48px",display:"grid",gridTemplateColumns:"1fr auto",gap:24,alignItems:"start"}}>
            <div>
              <p style={{fontSize:13.5,lineHeight:1.85,color:"rgba(255,255,255,0.42)",fontWeight:300,marginBottom:14}}>{p.about}</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {p.tech.split(",").map((t,i)=>(
                  <span key={i} style={{padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:500,background:p.tagBg,border:`1px solid ${p.tagBorder}`,color:p.accent}}>{t.trim()}</span>
                ))}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,flexShrink:0}}>
              <a href={p.link} target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:10,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.68)",fontSize:12.5,fontWeight:500,textDecoration:"none",cursor:"none",whiteSpace:"nowrap",transition:"background 0.2s"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}
                onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"}
              >GitHub ↗</a>
              {p.devpost&&(
                <a href={p.devpost} target="_blank" rel="noopener noreferrer"
                  style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:10,background:"rgba(236,72,153,0.1)",border:"1px solid rgba(236,72,153,0.25)",color:"#f472b6",fontSize:12.5,fontWeight:500,textDecoration:"none",cursor:"none",whiteSpace:"nowrap",transition:"background 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(236,72,153,0.18)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(236,72,153,0.1)"}
                >Devpost ↗</a>
              )}
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ─── TOOLTIP LINK ─── */
function TooltipLink({href,icon,label,tooltip,color}){
  const[show,setShow]=useState(false);
  return(
    <a href={href} target="_blank" rel="noopener noreferrer"
      onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}
      style={{position:"relative",display:"inline-flex",alignItems:"center",gap:8,padding:"10px 20px",borderRadius:12,fontSize:13,fontWeight:500,textDecoration:"none",cursor:"none",color,background:`${color}15`,border:`1px solid ${color}28`,transition:"transform 0.2s ease,box-shadow 0.2s ease"}}
    >
      {icon}{label}
      {show&&(
        <span style={{position:"absolute",bottom:"calc(100% + 10px)",left:"50%",transform:"translateX(-50%)",background:"#1c1c26",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"6px 12px",fontSize:11.5,fontWeight:400,color:"rgba(255,255,255,0.6)",whiteSpace:"nowrap",pointerEvents:"none",boxShadow:"0 8px 24px rgba(0,0,0,0.4)",animation:"tooltipIn 0.15s ease forwards",zIndex:100}}>
          {tooltip}
        </span>
      )}
    </a>
  );
}

/* ─── MAIN ─── */
export default function App(){
  const[coords,setCoords]=useState({x:0,y:0});
  useEffect(()=>{
    const fn=(e)=>setCoords({x:e.clientX,y:e.clientY});
    window.addEventListener("mousemove",fn);
    return()=>window.removeEventListener("mousemove",fn);
  },[]);

  const works=[
    {title:"Zed.AI – Your AI Study Buddy",tag:"AI / Voice",year:"2025",winner:true,accent:"#818cf8",tagBg:"rgba(99,102,241,0.12)",tagBorder:"rgba(99,102,241,0.28)",about:"An autonomous AI study partner that connects to your student account, responds to your voice, and uses Gemini 2.5 to generate study plans, quizzes, and progress tracking. Authenticated via Auth0, built at EmberHacks.",tech:"React, Flask, Gemini 2.5, ElevenLabs, Auth0, Porcupine, Playwright",link:"https://github.com/alextgu/emberhacks",devpost:"https://devpost.com/software/zed-7z0wg4"},
    {title:"DFS – Depth First Social",tag:"Full-Stack",year:"2026",winner:true,accent:"#fbbf24",tagBg:"rgba(217,119,6,0.12)",tagBorder:"rgba(217,119,6,0.28)",about:"Matches people who think alike using your Gemini conversation history. Builds a 6-axis interest profile and uses Snowflake vector similarity to find compatible matches. Ephemeral chats expire after 10 minutes, built at DeerHacks.",tech:"Next.js, React, FastAPI, Snowflake, Supabase, Auth0, Solana",link:"https://github.com/alextgu/deerhacks",devpost:"https://devpost.com/software/deer-deer-deer"},
    {title:"Sign Language Interpreter",tag:"Computer Vision",year:"2024",accent:"#60a5fa",tagBg:"rgba(37,99,235,0.12)",tagBorder:"rgba(37,99,235,0.28)",about:"Real-time sign language detection using MediaPipe hand landmarks and a KNN classifier. Captures video input, extracts keypoints, and translates gestures into readable text output.",tech:"Python, OpenCV, MediaPipe, KNN",link:"https://github.com/sakets-dev/sign_language_detector"},
    {title:"Vision-Controlled Mouse",tag:"CV / ML",year:"2024",accent:"#34d399",tagBg:"rgba(5,150,105,0.12)",tagBorder:"rgba(5,150,105,0.28)",about:"Control your mouse cursor entirely through hand gestures using MediaPipe landmark detection and PyAutoGUI for precise cursor movement. No hardware required.",tech:"Python, OpenCV, MediaPipe, PyAutoGUI, NumPy",link:"https://github.com/sakets-dev/vision_controlled_mouse"},
    {title:"Textify — PDF & Image to Text",tag:"Full-Stack",year:"2024",accent:"#fb7185",tagBg:"rgba(225,29,72,0.12)",tagBorder:"rgba(225,29,72,0.28)",about:"Full-stack OCR web app that converts PDFs and images into editable text. Flask backend with Tesseract and PDFPlumber for accurate multi-format text extraction.",tech:"Python, Flask, PDFPlumber, pytesseract, HTML, CSS, JavaScript",link:"https://github.com/sakets-dev/textify"},
  ];

  const stack=["Python","React","TypeScript","Next.js","Flask","OpenCV","MediaPipe","Docker","MongoDB","Firebase","Tailwind","Git"];

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        body{background:#111118;color:#ddd8d0;font-family:'DM Sans',sans-serif;overflow-x:hidden;cursor:none;-webkit-font-smoothing:antialiased;}
        @keyframes blobA{from{transform:translate(0,0)}to{transform:translate(4%,7%) scale(1.08)}}
        @keyframes blobB{from{transform:translate(0,0)}to{transform:translate(-5%,-4%) scale(1.06)}}
        @keyframes tooltipIn{from{opacity:0;transform:translateX(-50%) translateY(4px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .cursor{position:fixed;width:9px;height:9px;border-radius:50%;background:#fff;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);mix-blend-mode:difference;}
        .nav-link{font-size:13px;color:rgba(255,255,255,0.32);text-decoration:none;letter-spacing:0.04em;transition:color 0.2s;cursor:none;}
        .nav-link:hover{color:rgba(255,255,255,0.78);}
        .tech-pill{display:inline-flex;align-items:center;padding:5px 13px;border-radius:999px;font-size:11.5px;font-weight:500;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);color:rgba(255,255,255,0.42);cursor:none;transition:background 0.18s,color 0.18s,transform 0.18s;}
        .tech-pill:hover{background:rgba(255,255,255,0.09);color:rgba(255,255,255,0.75);transform:translateY(-2px);}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-track{background:#111118;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:999px;}
        .section-label{font-size:10.5px;letter-spacing:0.15em;color:rgba(255,255,255,0.24);font-weight:500;text-transform:uppercase;}
      `}</style>

      <div className="cursor" style={{left:coords.x,top:coords.y}}/>
      <CursorTrail/>
      <GridBg/>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1,background:`radial-gradient(650px circle at ${coords.x}px ${coords.y}px, rgba(99,120,255,0.04), transparent 55%)`}}/>

      <div style={{position:"relative",zIndex:2}}>

        {/* NAV */}
        <Reveal delay={0} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"28px 56px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontFamily:"'Instrument Serif'",fontSize:14,color:"#fff"}}>S</span>
            </div>
            <span style={{fontFamily:"'Instrument Serif', serif",fontSize:17,color:"rgba(255,255,255,0.75)",letterSpacing:"-0.01em"}}>saket.sharma</span>
          </div>
          <div style={{display:"flex",gap:36}}>
            {["work","about","contact"].map(n=><a key={n} href={`#${n}`} className="nav-link">{n}</a>)}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:7,padding:"6px 14px",borderRadius:999,background:"rgba(74,222,128,0.07)",border:"1px solid rgba(74,222,128,0.18)"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#4ade80"}}/>
            <span style={{fontSize:11.5,color:"#4ade80",fontWeight:500,letterSpacing:"0.02em"}}>Available</span>
          </div>
        </Reveal>

        {/* HERO */}
        <div style={{position:"relative",padding:"50px 56px 64px",minHeight:"86vh",display:"flex",flexDirection:"column",justifyContent:"center"}}>
          <ParticleGlobe/>

          <Reveal delay={80}>
            <div style={{display:"flex",gap:9,marginBottom:26}}>
              {["CS + Statistics","University of Toronto","2026"].map((t,i)=>(
                <span key={i} style={{padding:"4px 12px",borderRadius:999,fontSize:11,fontWeight:500,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",color:"rgba(255,255,255,0.38)",letterSpacing:"0.03em"}}>{t}</span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={180} tag="h1" style={{fontFamily:"'Instrument Serif', serif",fontSize:"clamp(56px,8vw,112px)",fontWeight:400,lineHeight:0.95,letterSpacing:"-0.03em",color:"#ede9e2",maxWidth:"55%",marginBottom:0}}>
            Saket<br/><em style={{color:"rgba(237,233,226,0.35)",fontStyle:"italic"}}>Sharma.</em>
          </Reveal>

          <Reveal delay={280} style={{marginTop:18,maxWidth:"32%",height:2,background:"linear-gradient(90deg,#6366f1,#8b5cf6,transparent)",borderRadius:999}}/>

          <Reveal delay={340} style={{marginTop:26,maxWidth:420}}>
            <p style={{fontSize:15.5,fontWeight:300,lineHeight:1.85,color:"rgba(255,255,255,0.4)",letterSpacing:"0.005em"}}>
              Developer & builder who cares about the craft.<br/>
              From <span style={{color:"#818cf8",fontWeight:400}}>AI and computer vision</span> to{" "}
              <span style={{color:"#60a5fa",fontWeight:400}}>full-stack products</span> —<br/>
              I ship things that actually work.
            </p>
          </Reveal>

          <Reveal delay={440} style={{marginTop:38,display:"flex",gap:12,flexWrap:"wrap"}}>
            <TooltipLink href="https://github.com/sakets-dev"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>}
              label="GitHub" tooltip="saket-dev" color="#e2e8f0"
            />
            <TooltipLink href="https://www.linkedin.com/in/saket-sharma-3a37871a7/"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>}
              label="LinkedIn" tooltip="Saket Sharma" color="#60a5fa"
            />
            <TooltipLink href="mailto:saketshar04@gmail.com"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>}
              label="Email" tooltip="saketshar04@gmail.com" color="#f59e0b"
            />
          </Reveal>
        </div>

        {/* ABOUT */}
        <div id="about" style={{padding:"0 56px 80px"}}>
          <Reveal delay={60} style={{display:"flex",alignItems:"center",gap:20,marginBottom:44}}>
            <span className="section-label">About</span>
            <div style={{flex:1,height:1,background:"linear-gradient(90deg,rgba(255,255,255,0.08),transparent)"}}/>
          </Reveal>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:52,alignItems:"start"}}>
            <Reveal delay={80}>
              <p style={{fontFamily:"'Instrument Serif', serif",fontSize:23,lineHeight:1.6,color:"rgba(237,233,226,0.8)",fontWeight:400,letterSpacing:"-0.01em",marginBottom:20}}>
                I build with the belief that great software should feel as good as it works.
              </p>
              <p style={{fontSize:14,lineHeight:1.9,color:"rgba(255,255,255,0.37)",fontWeight:300,marginBottom:16}}>
                CS & Statistics student at the University of Toronto. I've shipped products across AI, computer vision, and full-stack web — winning hackathons along the way.
              </p>
              <p style={{fontSize:14,lineHeight:1.9,color:"rgba(255,255,255,0.3)",fontWeight:300}}>
                Off-screen I'm deep in thriller novels or lost in music while I code. Always learning something new.
              </p>
            </Reveal>
            <Reveal delay={140}>
              <p className="section-label" style={{marginBottom:20}}>Stack</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {stack.map(s=><span key={s} className="tech-pill">{s}</span>)}
              </div>
            </Reveal>
          </div>
        </div>

        {/* WORK */}
        <div id="work" style={{padding:"0 56px 80px"}}>
          <Reveal delay={60} style={{display:"flex",alignItems:"center",gap:20,marginBottom:8}}>
            <span className="section-label">Work</span>
            <div style={{flex:1,height:1,background:"linear-gradient(90deg,rgba(255,255,255,0.08),transparent)"}}/>
            <span style={{fontSize:11.5,color:"rgba(255,255,255,0.2)"}}>click to expand</span>
          </Reveal>
          {works.map((w,i)=><ProjectRow key={w.title} p={w} delay={80+i*50}/>)}
        </div>

        {/* CONTACT */}
        <div id="contact" style={{padding:"0 56px 100px"}}>
          <Reveal delay={60}>
            <div style={{maxWidth:520,padding:"36px 40px",borderRadius:20,background:"rgba(99,102,241,0.07)",border:"1px solid rgba(99,102,241,0.16)"}}>
              <p style={{fontFamily:"'Instrument Serif', serif",fontSize:26,fontWeight:400,color:"rgba(237,233,226,0.85)",letterSpacing:"-0.01em",marginBottom:10}}>Let's build something together.</p>
              <p style={{fontSize:13.5,color:"rgba(255,255,255,0.32)",fontWeight:300,lineHeight:1.7,marginBottom:24}}>Open to internships, hackathons, and interesting side projects. Always happy to chat.</p>
              <a href="mailto:saketshar04@gmail.com"
                style={{display:"inline-flex",alignItems:"center",gap:8,padding:"11px 22px",borderRadius:12,background:"rgba(99,102,241,0.2)",border:"1px solid rgba(99,102,241,0.35)",color:"#818cf8",fontSize:13.5,fontWeight:500,textDecoration:"none",cursor:"none",transition:"transform 0.2s,box-shadow 0.2s"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(99,102,241,0.25)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}
              >Say hello →</a>
            </div>
          </Reveal>
        </div>

        {/* FOOTER */}
        <div style={{padding:"24px 56px 36px",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:"'Instrument Serif', serif",fontSize:15,color:"rgba(255,255,255,0.22)"}}>saket.sharma</span>
          <span style={{fontSize:12,color:"rgba(255,255,255,0.15)",letterSpacing:"0.04em"}}>© 2026 · React + Vite</span>
          <span style={{fontSize:12,color:"rgba(255,255,255,0.15)"}}>Toronto, CA</span>
        </div>

      </div>
    </>
  );
}