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
      for (let i = 0; i < 3; i++)
        dots.current.push({ x: e.clientX+(Math.random()-.5)*10, y: e.clientY+(Math.random()-.5)*10, r: Math.random()*2.2+.5, alpha:.55, vx:(Math.random()-.5)*.5, vy:(Math.random()-.5)*.5-.3 });
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

/* ─── 3D GLOBE ─── */
function ParticleGlobe() {
  const canvasRef = useRef(null);
  const s = useRef({ rotX:0.35, rotY:0, velX:0, velY:0.003, dragging:false, lastX:0, lastY:0 });
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W=380, H=380, R=135;
    canvas.width=W; canvas.height=H;
    const pts=[], golden=Math.PI*(3-Math.sqrt(5));
    for(let i=0;i<300;i++){const y=1-(i/299)*2,r=Math.sqrt(1-y*y),th=golden*i;pts.push({ox:Math.cos(th)*r,oy:y,oz:Math.sin(th)*r});}
    for(let i=0;i<50;i++){const u=Math.random(),v=Math.random(),th=2*Math.PI*u,ph=Math.acos(2*v-1);pts.push({ox:Math.sin(ph)*Math.cos(th),oy:Math.cos(ph),oz:Math.sin(ph)*Math.sin(th)});}
    let raf;
    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      const cx=W/2,cy=H/2,st=s.current;
      if(!st.dragging){st.rotY+=st.velY;st.velX*=.96;st.rotX+=st.velX;}
      const cX=Math.cos(st.rotX),sX=Math.sin(st.rotX),cY=Math.cos(st.rotY),sY=Math.sin(st.rotY);
      const proj=pts.map(p=>{
        const x=p.ox*cY-p.oz*sY,z=p.ox*sY+p.oz*cY,y=p.oy;
        const y2=y*cX-z*sX,z2=y*sX+z*cX,sc=(z2+2.4)/3.4;
        return{sx:cx+x*R*sc,sy:cy+y2*R*sc,z:z2,sc};
      }).sort((a,b)=>a.z-b.z);
      const front=proj.filter(p=>p.z>0);
      for(let i=0;i<front.length;i++)for(let j=i+1;j<front.length;j++){
        const dx=front[i].sx-front[j].sx,dy=front[i].sy-front[j].sy,d=Math.sqrt(dx*dx+dy*dy);
        if(d<40){ctx.beginPath();ctx.moveTo(front[i].sx,front[i].sy);ctx.lineTo(front[j].sx,front[j].sy);ctx.strokeStyle=`rgba(160,180,255,${(1-d/40)*.15*Math.min(front[i].sc,front[j].sc)})`;ctx.lineWidth=.55;ctx.stroke();}
      }
      for(const p of proj){
        const t=(p.z+1)/2;
        ctx.beginPath();ctx.arc(p.sx,p.sy,Math.max(p.sc*.84,.4),0,Math.PI*2);
        ctx.fillStyle=`rgba(${Math.round(120+t*40)},${Math.round(150+t*30)},255,${((p.z+1)/2*.8+.08)*p.sc})`;ctx.fill();
      }
      const grd=ctx.createRadialGradient(cx,cy,R*.8,cx,cy,R*1.2);
      grd.addColorStop(0,"rgba(100,120,255,0)");grd.addColorStop(.5,"rgba(100,120,255,.055)");grd.addColorStop(1,"rgba(100,120,255,0)");
      ctx.beginPath();ctx.arc(cx,cy,R*1.15,0,Math.PI*2);ctx.fillStyle=grd;ctx.fill();
      raf=requestAnimationFrame(draw);
    };
    draw();
    const st=s.current;
    const dn=(e)=>{st.dragging=true;st.lastX=e.clientX??e.touches?.[0]?.clientX;st.lastY=e.clientY??e.touches?.[0]?.clientY;};
    const mv=(e)=>{if(!st.dragging)return;const x=e.clientX??e.touches?.[0]?.clientX,y=e.clientY??e.touches?.[0]?.clientY;st.velY=(x-st.lastX)*.011;st.velX=(y-st.lastY)*.011;st.rotY+=st.velY;st.rotX+=st.velX;st.lastX=x;st.lastY=y;};
    const up=()=>{st.dragging=false;};
    canvas.addEventListener("mousedown",dn);canvas.addEventListener("touchstart",dn,{passive:true});
    window.addEventListener("mousemove",mv);window.addEventListener("touchmove",mv,{passive:true});
    window.addEventListener("mouseup",up);window.addEventListener("touchend",up);
    return()=>{cancelAnimationFrame(raf);canvas.removeEventListener("mousedown",dn);canvas.removeEventListener("touchstart",dn);window.removeEventListener("mousemove",mv);window.removeEventListener("touchmove",mv);window.removeEventListener("mouseup",up);window.removeEventListener("touchend",up);};
  },[]);
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",userSelect:"none",flexShrink:0}}>
      <canvas ref={canvasRef} style={{cursor:"grab",display:"block"}}/>
      <span style={{fontSize:9,color:"rgba(255,255,255,0.16)",letterSpacing:"0.12em",marginTop:6,fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>DRAG TO ROTATE</span>
    </div>
  );
}

/* ─── REVEAL ─── */
function Reveal({children,delay=0,style={},tag="div"}){
  const[v,setV]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setV(true),delay);return()=>clearTimeout(t);},[delay]);
  const Tag=tag;
  return<Tag style={{opacity:v?1:0,transform:v?"translateY(0)":"translateY(16px)",transition:`opacity .75s cubic-bezier(.16,1,.3,1),transform .75s cubic-bezier(.16,1,.3,1)`,transitionDelay:`${delay}ms`,...style}}>{children}</Tag>;
}

/* ─── GRID BG ─── */
function GridBg(){
  return(
    <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",backgroundSize:"42px 42px",maskImage:"radial-gradient(ellipse 85% 75% at 50% 35%, black 20%, transparent 100%)",WebkitMaskImage:"radial-gradient(ellipse 85% 75% at 50% 35%, black 20%, transparent 100%)"}}/>
      <div style={{position:"absolute",top:"-15%",left:"-5%",width:"45%",height:"55%",borderRadius:"50%",background:"radial-gradient(ellipse,rgba(99,102,241,.07) 0%,transparent 70%)",animation:"blobA 20s ease-in-out infinite alternate"}}/>
      <div style={{position:"absolute",bottom:"5%",right:"-5%",width:"40%",height:"50%",borderRadius:"50%",background:"radial-gradient(ellipse,rgba(59,130,246,.05) 0%,transparent 70%)",animation:"blobB 25s ease-in-out infinite alternate"}}/>
    </div>
  );
}

/* ─── PROJECT ROW ─── */
function ProjectRow({p,delay}){
  const[open,setOpen]=useState(false);
  return(
    <Reveal delay={delay}>
      <div onClick={()=>setOpen(o=>!o)} style={{borderBottom:"1px solid rgba(255,255,255,0.07)",background:open?"rgba(255,255,255,0.025)":"transparent",borderRadius:open?10:0,overflow:"hidden",transition:"background .25s",cursor:"pointer"}}>
        <div style={{display:"flex",alignItems:"center",padding:"15px 12px",transition:"padding-left .3s cubic-bezier(.16,1,.3,1)"}}
          onMouseEnter={e=>e.currentTarget.style.paddingLeft="22px"}
          onMouseLeave={e=>e.currentTarget.style.paddingLeft="12px"}
        >
          <span style={{width:7,height:7,borderRadius:"50%",background:p.accent,display:"inline-block",marginRight:16,flexShrink:0,boxShadow:`0 0 8px ${p.accent}99`}}/>
          <span style={{fontFamily:"'Instrument Serif',serif",fontSize:21,fontWeight:400,color:"#ede9e2",letterSpacing:"-0.02em",flex:1}}>{p.title}</span>
          {p.winner&&<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 9px",borderRadius:999,fontSize:9.5,fontWeight:700,letterSpacing:".08em",background:"linear-gradient(90deg,rgba(251,191,36,.18),rgba(245,158,11,.12))",border:"1px solid rgba(251,191,36,.32)",color:"#fbbf24",marginRight:12,whiteSpace:"nowrap"}}>🏆 WINNER</span>}
          <span style={{fontSize:10.5,fontWeight:500,padding:"2px 9px",borderRadius:999,background:p.tagBg,border:`1px solid ${p.tagBorder}`,color:p.accent,marginRight:14,letterSpacing:".04em"}}>{p.tag}</span>
          <span style={{fontSize:11,color:"rgba(255,255,255,.22)",marginRight:12,fontWeight:300}}>{p.year}</span>
          <span style={{fontSize:16,color:"rgba(255,255,255,.3)",transition:"transform .3s",transform:open?"rotate(45deg)":"rotate(0deg)",display:"inline-block",lineHeight:1}}>+</span>
        </div>
        <div style={{maxHeight:open?280:0,overflow:"hidden",transition:"max-height .45s cubic-bezier(.16,1,.3,1)"}}>
          <div style={{padding:"0 12px 18px 39px",display:"grid",gridTemplateColumns:"1fr auto",gap:18,alignItems:"start"}}>
            <div>
              <p style={{fontSize:13,lineHeight:1.8,color:"rgba(255,255,255,.42)",fontWeight:300,marginBottom:11}}>{p.about}</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {p.tech.split(",").map((t,i)=><span key={i} style={{padding:"2px 9px",borderRadius:999,fontSize:10.5,fontWeight:500,background:p.tagBg,border:`1px solid ${p.tagBorder}`,color:p.accent}}>{t.trim()}</span>)}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
              <a href={p.link} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:9,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",color:"rgba(255,255,255,.68)",fontSize:12,fontWeight:500,textDecoration:"none",whiteSpace:"nowrap",transition:"background .2s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.1)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.06)"}>GitHub ↗</a>
              {p.devpost&&<a href={p.devpost} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:9,background:"rgba(236,72,153,.1)",border:"1px solid rgba(236,72,153,.25)",color:"#f472b6",fontSize:12,fontWeight:500,textDecoration:"none",whiteSpace:"nowrap",transition:"background .2s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(236,72,153,.18)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(236,72,153,.1)"}>Devpost ↗</a>}
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ─── TOOLTIP LINK ─── */
function TLink({href,icon,label,tooltip,color}){
  const[show,setShow]=useState(false);
  return(
    <a href={href} target="_blank" rel="noopener noreferrer" onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}
      style={{position:"relative",display:"inline-flex",alignItems:"center",gap:7,padding:"9px 17px",borderRadius:10,fontSize:13,fontWeight:500,textDecoration:"none",color,background:`${color}15`,border:`1px solid ${color}28`,transition:"transform .2s,box-shadow .2s"}}
    >
      {icon}{label}
      {show&&<span style={{position:"absolute",bottom:"calc(100% + 8px)",left:"50%",transform:"translateX(-50%)",background:"#1c1c26",border:"1px solid rgba(255,255,255,.1)",borderRadius:7,padding:"5px 10px",fontSize:11,color:"rgba(255,255,255,.6)",whiteSpace:"nowrap",pointerEvents:"none",boxShadow:"0 8px 24px rgba(0,0,0,.4)",animation:"tip .15s ease forwards",zIndex:100}}>{tooltip}</span>}
    </a>
  );
}

/* ─── MAIN ─── */
export default function App(){
  const[pos,setPos]=useState({x:0,y:0});
  useEffect(()=>{const fn=e=>setPos({x:e.clientX,y:e.clientY});window.addEventListener("mousemove",fn);return()=>window.removeEventListener("mousemove",fn);},[]);

  const works=[
    {title:"Zed.AI – Your AI Study Buddy",tag:"AI / Voice",year:"2025",winner:true,accent:"#818cf8",tagBg:"rgba(99,102,241,.12)",tagBorder:"rgba(99,102,241,.28)",about:"An autonomous AI study partner that connects to your student account, responds to your voice, and uses Gemini 2.5 to generate study plans, quizzes, and progress tracking. Authenticated via Auth0, built at EmberHacks.",tech:"React, Flask, Gemini 2.5, ElevenLabs, Auth0, Porcupine, Playwright",link:"https://github.com/alextgu/emberhacks",devpost:"https://devpost.com/software/zed-7z0wg4"},
    {title:"DFS – Depth First Social",tag:"Full-Stack",year:"2026",winner:true,accent:"#fbbf24",tagBg:"rgba(217,119,6,.12)",tagBorder:"rgba(217,119,6,.28)",about:"Matches people who think alike using your Gemini conversation history. Builds a 6-axis interest profile and uses Snowflake vector similarity to find compatible matches. Ephemeral chats expire after 10 minutes, built at DeerHacks.",tech:"Next.js, React, FastAPI, Snowflake, Supabase, Auth0, Solana",link:"https://github.com/alextgu/deerhacks",devpost:"https://devpost.com/software/deer-deer-deer"},
    {title:"Sign Language Interpreter",tag:"Computer Vision",year:"2024",accent:"#60a5fa",tagBg:"rgba(37,99,235,.12)",tagBorder:"rgba(37,99,235,.28)",about:"Real-time sign language detection using MediaPipe hand landmarks and a KNN classifier. Captures video input, extracts keypoints, and translates gestures into readable text output.",tech:"Python, OpenCV, MediaPipe, KNN",link:"https://github.com/sakets-dev/sign_language_detector"},
    {title:"Vision-Controlled Mouse",tag:"CV / ML",year:"2024",accent:"#34d399",tagBg:"rgba(5,150,105,.12)",tagBorder:"rgba(5,150,105,.28)",about:"Control your mouse cursor entirely through hand gestures using MediaPipe landmark detection and PyAutoGUI. No hardware required.",tech:"Python, OpenCV, MediaPipe, PyAutoGUI, NumPy",link:"https://github.com/sakets-dev/vision_controlled_mouse"},
    {title:"Textify — PDF & Image to Text",tag:"Full-Stack",year:"2024",accent:"#fb7185",tagBg:"rgba(225,29,72,.12)",tagBorder:"rgba(225,29,72,.28)",about:"Full-stack OCR web app that converts PDFs and images into editable text using Tesseract and PDFPlumber.",tech:"Python, Flask, PDFPlumber, pytesseract, HTML, CSS, JavaScript",link:"https://github.com/sakets-dev/textify"},
  ];

  const stack=["Python","React","TypeScript","Next.js","Flask","OpenCV","MediaPipe","Docker","MongoDB","Firebase","Tailwind","Git"];
  const ghIcon=<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>;
  const liIcon=<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
  const emIcon=<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        body{background:#111118;color:#ddd8d0;font-family:'DM Sans',sans-serif;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
        @keyframes blobA{from{transform:translate(0,0)}to{transform:translate(4%,7%) scale(1.08)}}
        @keyframes blobB{from{transform:translate(0,0)}to{transform:translate(-5%,-4%) scale(1.06)}}
        @keyframes tip{from{opacity:0;transform:translateX(-50%) translateY(4px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .nl{font-size:13px;color:rgba(255,255,255,.32);text-decoration:none;letter-spacing:.04em;transition:color .2s;}
        .nl:hover{color:rgba(255,255,255,.78);}
        .pill{display:inline-flex;align-items:center;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:500;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);color:rgba(255,255,255,.42);transition:background .18s,color .18s,transform .18s;}
        .pill:hover{background:rgba(255,255,255,.09);color:rgba(255,255,255,.75);transform:translateY(-2px);}
        .sl{font-size:10px;letter-spacing:.15em;color:rgba(255,255,255,.24);font-weight:500;text-transform:uppercase;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-track{background:#111118;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:999px;}
      `}</style>

      <CursorTrail/>
      <GridBg/>
      {/* mouse glow */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1,background:`radial-gradient(650px circle at ${pos.x}px ${pos.y}px,rgba(99,120,255,.05),transparent 55%)`}}/>

      <div style={{position:"relative",zIndex:2}}>

        {/* NAV */}
        <Reveal delay={0} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 48px"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:26,height:26,borderRadius:7,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontFamily:"'Instrument Serif'",fontSize:13,color:"#fff"}}>S</span>
            </div>
            <span style={{fontFamily:"'Instrument Serif',serif",fontSize:16,color:"rgba(255,255,255,.75)",letterSpacing:"-.01em"}}>saket.sharma</span>
          </div>
          <div style={{display:"flex",gap:32}}>{["work","about","contact"].map(n=><a key={n} href={`#${n}`} className="nl">{n}</a>)}</div>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:999,background:"rgba(74,222,128,.07)",border:"1px solid rgba(74,222,128,.18)"}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:"#4ade80"}}/>
            <span style={{fontSize:11,color:"#4ade80",fontWeight:500,letterSpacing:".02em"}}>Available</span>
          </div>
        </Reveal>

        {/* HERO — two column, no min-height */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"flex-start",padding:"36px 48px 52px",minHeight:"82vh"}}>

          {/* LEFT: text */}
          <div style={{flex:"1 1 auto",maxWidth:560}}>
            <Reveal delay={80}>
              <div style={{display:"flex",gap:8,marginBottom:18}}>
                {["CS + Statistics","University of Toronto","2026"].map((t,i)=>(
                  <span key={i} style={{padding:"3px 10px",borderRadius:999,fontSize:10.5,fontWeight:500,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.09)",color:"rgba(255,255,255,.38)",letterSpacing:".03em"}}>{t}</span>
                ))}
              </div>
            </Reveal>

            <Reveal delay={160} tag="h1" style={{fontFamily:"'Instrument Serif',serif",fontSize:"clamp(60px,7.5vw,108px)",fontWeight:400,lineHeight:.93,letterSpacing:"-.035em",color:"#ede9e2",marginBottom:0}}>
              Saket<br/><em style={{color:"rgba(237,233,226,.3)",fontStyle:"italic"}}>Sharma.</em>
            </Reveal>

            <Reveal delay={240} style={{marginTop:12,width:"70%",height:2,background:"linear-gradient(90deg,#6366f1,#8b5cf6,transparent)",borderRadius:999}}/>

            <Reveal delay={300} style={{marginTop:18}}>
              <p style={{fontSize:15,fontWeight:300,lineHeight:1.78,color:"rgba(255,255,255,.42)"}}>
                Developer & builder who cares about the craft.<br/>
                From <span style={{color:"#818cf8",fontWeight:400}}>AI and computer vision</span> to{" "}
                <span style={{color:"#60a5fa",fontWeight:400}}>full-stack products</span> —<br/>
                I ship things that actually work.
              </p>
            </Reveal>

            <Reveal delay={380} style={{marginTop:24,display:"flex",gap:10,flexWrap:"wrap"}}>
              <TLink href="https://github.com/sakets-dev" icon={ghIcon} label="GitHub" tooltip="saket-dev" color="#e2e8f0"/>
              <TLink href="https://www.linkedin.com/in/saket-sharma-3a37871a7/" icon={liIcon} label="LinkedIn" tooltip="Saket Sharma" color="#60a5fa"/>
              <TLink href="mailto:saketshar04@gmail.com" icon={emIcon} label="Email" tooltip="saketshar04@gmail.com" color="#f59e0b"/>
            </Reveal>
          </div>

          {/* RIGHT: globe — pulled close */}
          <Reveal delay={200} style={{flex:"0 0 380px",marginLeft:"-60px"}}>
            <ParticleGlobe/>
          </Reveal>
        </div>

        {/* divider */}
        <div style={{height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,.06) 30%,rgba(255,255,255,.06) 70%,transparent)",margin:"0 48px"}}/>

        {/* ABOUT */}
        <div id="about" style={{padding:"48px 48px 48px"}}>
          <Reveal delay={60} style={{display:"flex",alignItems:"center",gap:18,marginBottom:28}}>
            <span className="sl">About</span>
            <div style={{flex:1,height:1,background:"linear-gradient(90deg,rgba(255,255,255,.08),transparent)"}}/>
          </Reveal>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:40,alignItems:"start"}}>
            <Reveal delay={80}>
              <p style={{fontFamily:"'Instrument Serif',serif",fontSize:21,lineHeight:1.55,color:"rgba(237,233,226,.82)",fontWeight:400,letterSpacing:"-.01em",marginBottom:14}}>
                I build with the belief that great software should feel as good as it works.
              </p>
              <p style={{fontSize:13.5,lineHeight:1.85,color:"rgba(255,255,255,.38)",fontWeight:300,marginBottom:10}}>
                CS & Statistics student at the University of Toronto. I've shipped products across AI, computer vision, and full-stack web — winning hackathons along the way.
              </p>
              <p style={{fontSize:13.5,lineHeight:1.85,color:"rgba(255,255,255,.3)",fontWeight:300}}>
                Off-screen I'm deep in thriller novels or lost in music while I code.
              </p>
            </Reveal>
            <Reveal delay={130}>
              <p className="sl" style={{marginBottom:14}}>Stack</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {stack.map(s=><span key={s} className="pill">{s}</span>)}
              </div>
            </Reveal>
          </div>
        </div>

        {/* divider */}
        <div style={{height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,.06) 30%,rgba(255,255,255,.06) 70%,transparent)",margin:"0 48px"}}/>

        {/* WORK */}
        <div id="work" style={{padding:"48px 48px 48px"}}>
          <Reveal delay={60} style={{display:"flex",alignItems:"center",gap:18,marginBottom:6}}>
            <span className="sl">Work</span>
            <div style={{flex:1,height:1,background:"linear-gradient(90deg,rgba(255,255,255,.08),transparent)"}}/>
            <span style={{fontSize:10.5,color:"rgba(255,255,255,.18)"}}>click to expand</span>
          </Reveal>
          {works.map((w,i)=><ProjectRow key={w.title} p={w} delay={70+i*40}/>)}
        </div>

        {/* divider */}
        <div style={{height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,.06) 30%,rgba(255,255,255,.06) 70%,transparent)",margin:"0 48px"}}/>

        {/* CONTACT */}
        <div id="contact" style={{padding:"48px 48px 72px"}}>
          <Reveal delay={60}>
            <div style={{maxWidth:480,padding:"28px 32px",borderRadius:16,background:"rgba(99,102,241,.07)",border:"1px solid rgba(99,102,241,.16)"}}>
              <p style={{fontFamily:"'Instrument Serif',serif",fontSize:23,fontWeight:400,color:"rgba(237,233,226,.85)",letterSpacing:"-.01em",marginBottom:7}}>Let's build something together.</p>
              <p style={{fontSize:13,color:"rgba(255,255,255,.32)",fontWeight:300,lineHeight:1.7,marginBottom:18}}>Open to internships, hackathons, and interesting side projects. Always happy to chat.</p>
              <a href="mailto:saketshar04@gmail.com"
                style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 19px",borderRadius:10,background:"rgba(99,102,241,.2)",border:"1px solid rgba(99,102,241,.35)",color:"#818cf8",fontSize:13,fontWeight:500,textDecoration:"none",transition:"transform .2s,box-shadow .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(99,102,241,.25)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}
              >Say hello →</a>
            </div>
          </Reveal>
        </div>

        {/* FOOTER */}
        <div style={{padding:"18px 48px 28px",borderTop:"1px solid rgba(255,255,255,.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:"'Instrument Serif',serif",fontSize:14,color:"rgba(255,255,255,.22)"}}>saket.sharma</span>
          <span style={{fontSize:11,color:"rgba(255,255,255,.15)",letterSpacing:".04em"}}>© 2026 · React + Vite</span>
          <span style={{fontSize:11,color:"rgba(255,255,255,.15)"}}>Toronto, CA</span>
        </div>

      </div>
    </>
  );
}