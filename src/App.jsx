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
        dots.current.push({ x: e.clientX+(Math.random()-.5)*10, y: e.clientY+(Math.random()-.5)*10, r: Math.random()*2.2+.5, alpha:.5, vx:(Math.random()-.5)*.5, vy:(Math.random()-.5)*.5-.3 });
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
function ParticleGlobe({ size = 520 }) {
  const canvasRef = useRef(null);
  const s = useRef({ rotX:0.3, rotY:0, velX:0, velY:0.006, dragging:false, lastX:0, lastY:0 });
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pad=44, W=size+pad*2, H=size+pad*2, R=size*0.46;
    canvas.width=W; canvas.height=H;
    const pts=[], golden=Math.PI*(3-Math.sqrt(5));
    for(let i=0;i<340;i++){const y=1-(i/339)*2,r=Math.sqrt(1-y*y),th=golden*i;pts.push({ox:Math.cos(th)*r,oy:y,oz:Math.sin(th)*r});}
    for(let i=0;i<60;i++){const u=Math.random(),v=Math.random(),th=2*Math.PI*u,ph=Math.acos(2*v-1);pts.push({ox:Math.sin(ph)*Math.cos(th),oy:Math.cos(ph),oz:Math.sin(ph)*Math.sin(th)});}
    let raf;
    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      const cx=W/2,cy=H/2,st=s.current;
      if(!st.dragging){
        // gradually ease velY back toward base speed 0.006, velX back to 0
        st.velY += (0.006 - st.velY) * 0.012;
        st.velX *= 0.97;
        st.rotY += st.velY;
        st.rotX += st.velX;
      }
      const cX=Math.cos(st.rotX),sX=Math.sin(st.rotX),cY=Math.cos(st.rotY),sY=Math.sin(st.rotY);
      const proj=pts.map(p=>{
        const x=p.ox*cY-p.oz*sY,z=p.ox*sY+p.oz*cY,y=p.oy;
        const y2=y*cX-z*sX,z2=y*sX+z*cX,sc=(z2+2.4)/3.4;
        return{sx:cx+x*R*sc,sy:cy+y2*R*sc,z:z2,sc};
      }).sort((a,b)=>a.z-b.z);
      const palette=[[99,102,241],[139,92,246],[56,189,248],[52,211,153],[251,113,133],[251,191,36],[34,211,238]];
      const front=proj.filter(p=>p.z>0);
      for(let i=0;i<front.length;i++)for(let j=i+1;j<front.length;j++){
        const dx=front[i].sx-front[j].sx,dy=front[i].sy-front[j].sy,d=Math.sqrt(dx*dx+dy*dy);
        if(d<46){
          const colorIdx=Math.floor(((front[i].z+1)/2*3+front[i].sx/W*4))%palette.length;
          const [r,g,b]=palette[colorIdx];
          const alpha=(1-d/46)*.38*Math.min(front[i].sc,front[j].sc);
          ctx.beginPath();ctx.moveTo(front[i].sx,front[i].sy);ctx.lineTo(front[j].sx,front[j].sy);
          ctx.strokeStyle=`rgba(${r},${g},${b},${alpha})`;ctx.lineWidth=.8;ctx.stroke();
        }
      }
      for(const p of proj){
        const t=(p.z+1)/2;
        const ci=Math.floor((p.sx/W*4+p.sy/H*3))%palette.length;
        const [r,g,b]=palette[ci];
        ctx.beginPath();ctx.arc(p.sx,p.sy,Math.max(p.sc*1.1,.4),0,Math.PI*2);
        ctx.fillStyle=`rgba(${r},${g},${b},${(t*.85+.12)*p.sc})`;ctx.fill();
      }
      // Glow based on actual point positions — accumulate color per screen region
      // Only use edge points (close to globe surface) for glow
      const edgePts = proj.filter(p => {
        const dx=p.sx-cx, dy=p.sy-cy, dist=Math.sqrt(dx*dx+dy*dy);
        return dist > R*0.7; // only outer ring of points
      });
      for(const p of edgePts){
        const ci=Math.floor((p.sx/W*4+p.sy/H*3))%palette.length;
        const [gr,gg,gb]=palette[ci];
        const brightness = (p.z+1)/2; // front-facing points glow more
        const spot=ctx.createRadialGradient(p.sx,p.sy,0,p.sx,p.sy,R*0.22);
        spot.addColorStop(0,`rgba(${gr},${gg},${gb},${0.018*brightness})`);
        spot.addColorStop(0.35,`rgba(${gr},${gg},${gb},${0.006*brightness})`);
        spot.addColorStop(0.7,`rgba(${gr},${gg},${gb},${0.002*brightness})`);
        spot.addColorStop(1,`rgba(${gr},${gg},${gb},0)`);
        ctx.beginPath();ctx.arc(p.sx,p.sy,R*0.22,0,Math.PI*2);
        ctx.fillStyle=spot;ctx.fill();
      }
      raf=requestAnimationFrame(draw);
    };
    draw();
    const st=s.current;
    const dn=(e)=>{st.dragging=true;st.lastX=e.clientX??e.touches?.[0]?.clientX;st.lastY=e.clientY??e.touches?.[0]?.clientY;};
    const mv=(e)=>{if(!st.dragging)return;const x=e.clientX??e.touches?.[0]?.clientX,y=e.clientY??e.touches?.[0]?.clientY;st.velY=(x-st.lastX)*.01;st.velX=(y-st.lastY)*.01;st.rotY+=st.velY;st.rotX+=st.velX;st.lastX=x;st.lastY=y;};
    const up=()=>{st.dragging=false;};
    canvas.addEventListener("mousedown",dn);canvas.addEventListener("touchstart",dn,{passive:true});
    window.addEventListener("mousemove",mv);window.addEventListener("touchmove",mv,{passive:true});
    window.addEventListener("mouseup",up);window.addEventListener("touchend",up);
    return()=>{cancelAnimationFrame(raf);canvas.removeEventListener("mousedown",dn);canvas.removeEventListener("touchstart",dn);window.removeEventListener("mousemove",mv);window.removeEventListener("touchmove",mv);window.removeEventListener("mouseup",up);window.removeEventListener("touchend",up);};
  },[]);
  return <canvas ref={canvasRef} style={{cursor:"grab",display:"block"}}/>;
}

/* ─── REVEAL (intersection observer) ─── */
function Reveal({children,delay=0,style={},tag="div",from="bottom"}){
  const ref=useRef(null);
  const[v,setV]=useState(false);
  useEffect(()=>{
    const el=ref.current;
    if(!el)return;
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting){setTimeout(()=>setV(true),delay);obs.disconnect();}},{threshold:0.1});
    obs.observe(el);
    return()=>obs.disconnect();
  },[delay]);
  const Tag=tag;
  const init=from==="left"?"translateX(-24px)":from==="right"?"translateX(24px)":"translateY(20px)";
  return<Tag ref={ref} style={{opacity:v?1:0,transform:v?"translate(0)":init,transition:`opacity .85s cubic-bezier(.16,1,.3,1),transform .85s cubic-bezier(.16,1,.3,1)`,transitionDelay:`${delay}ms`,...style}}>{children}</Tag>;
}

/* ─── GRID BG ─── */
function GridBg(){
  return(
    <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)",backgroundSize:"44px 44px",maskImage:"radial-gradient(ellipse 90% 80% at 50% 40%, black 20%, transparent 100%)",WebkitMaskImage:"radial-gradient(ellipse 90% 80% at 50% 40%, black 20%, transparent 100%)"}}/>
    </div>
  );
}

/* ─── PROJECT ROW ─── */
function ProjectRow({p,delay}){
  const[open,setOpen]=useState(false);
  const[hovered,setHovered]=useState(false);
  return(
    <Reveal delay={delay}>
      <div style={{borderBottom:"1px solid rgba(255,255,255,.06)",overflow:"hidden"}}>
        {/* Header row */}
        <div
          onClick={()=>setOpen(o=>!o)}
          onMouseEnter={()=>setHovered(true)}
          onMouseLeave={()=>setHovered(false)}
          style={{
            display:"flex",alignItems:"center",
            padding:"20px 16px",
            cursor:"pointer",
            background:hovered?"rgba(255,255,255,.02)":"transparent",
            transform:hovered?"translateX(8px)":"translateX(0)",
            transition:"transform .4s cubic-bezier(.16,1,.3,1),background .25s",
          }}
        >
          <span style={{width:6,height:6,borderRadius:"50%",background:p.accent,display:"inline-block",marginRight:20,flexShrink:0,boxShadow:`0 0 8px ${p.accent}aa`,transition:"transform .3s",transform:hovered?"scale(1.5)":"scale(1)"}}/>
          <span style={{fontFamily:"'Instrument Serif',serif",fontSize:23,fontWeight:400,color:hovered?"#ede9e2":"rgba(237,233,226,.82)",letterSpacing:"-.025em",flex:1,transition:"color .25s"}}>{p.title}</span>
          {p.winner&&<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 9px",borderRadius:999,fontSize:9.5,fontWeight:700,letterSpacing:".08em",background:"rgba(251,191,36,.1)",border:"1px solid rgba(251,191,36,.28)",color:"#fbbf24",marginRight:12,whiteSpace:"nowrap"}}>🏆 WINNER</span>}
          <span style={{fontSize:10.5,fontWeight:500,padding:"2px 9px",borderRadius:999,background:p.tagBg,border:`1px solid ${p.tagBorder}`,color:p.accent,marginRight:14,letterSpacing:".04em"}}>{p.tag}</span>
          <span style={{fontSize:11,color:"rgba(255,255,255,.2)",marginRight:14,fontWeight:300}}>{p.year}</span>
          {/* Animated chevron */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="2" strokeLinecap="round" style={{transition:"transform .4s cubic-bezier(.16,1,.3,1)",transform:open?"rotate(180deg)":"rotate(0deg)",flexShrink:0}}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        {/* Expandable content — animates in with stagger */}
        <div style={{
          display:"grid",
          gridTemplateRows:open?"1fr":"0fr",
          transition:"grid-template-rows .5s cubic-bezier(.16,1,.3,1)",
        }}>
          <div style={{overflow:"hidden"}}>
            <div style={{
              padding:"0 16px 24px 42px",
              display:"grid",gridTemplateColumns:"1fr auto",gap:24,alignItems:"start",
              opacity:open?1:0,transform:open?"translateY(0)":"translateY(-8px)",
              transition:`opacity .4s ease ${open?.08:0}s, transform .4s cubic-bezier(.16,1,.3,1) ${open?.08:0}s`,
            }}>
              <div>
                <p style={{fontSize:13.5,lineHeight:1.85,color:"rgba(255,255,255,.5)",fontWeight:300,marginBottom:14}}>{p.about}</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {p.tech.split(",").map((t,i)=>(
                    <span key={i} style={{
                      padding:"3px 10px",borderRadius:999,fontSize:10.5,fontWeight:500,
                      background:p.tagBg,border:`1px solid ${p.tagBorder}`,color:p.accent,
                      opacity:open?1:0,transform:open?"translateY(0)":"translateY(4px)",
                      transition:`opacity .3s ease ${open?(.12+i*.03):.0}s, transform .3s ease ${open?(.12+i*.03):.0}s`,
                    }}>{t.trim()}</span>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:7,flexShrink:0,marginTop:2}}>
                <a href={p.link} target="_blank" rel="noopener noreferrer"
                  style={{display:"inline-flex",alignItems:"center",gap:5,padding:"8px 14px",borderRadius:9,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",color:"rgba(255,255,255,.65)",fontSize:12,fontWeight:500,textDecoration:"none",whiteSpace:"nowrap",transition:"background .2s,color .2s",opacity:open?1:0,transform:open?"translateX(0)":"translateX(8px)",transition2:`opacity .35s ease ${open?.18:0}s`}}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.1)";e.currentTarget.style.color="#fff";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.05)";e.currentTarget.style.color="rgba(255,255,255,.65)";}}
                >GitHub ↗</a>
                {p.devpost&&<a href={p.devpost} target="_blank" rel="noopener noreferrer"
                  style={{display:"inline-flex",alignItems:"center",gap:5,padding:"8px 14px",borderRadius:9,background:"rgba(236,72,153,.08)",border:"1px solid rgba(236,72,153,.22)",color:"#f472b6",fontSize:12,fontWeight:500,textDecoration:"none",whiteSpace:"nowrap",transition:"background .2s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(236,72,153,.16)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(236,72,153,.08)"}
                >Devpost ↗</a>}
              </div>
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
    <a href={href} target="_blank" rel="noopener noreferrer"
      onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}
      style={{position:"relative",display:"inline-flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:10,fontSize:13,fontWeight:500,textDecoration:"none",color,background:`${color}12`,border:`1px solid ${color}25`,transition:"transform .2s,background .2s"}}
    >
      {icon}{label}
      {show&&<span style={{position:"absolute",bottom:"calc(100% + 8px)",left:"50%",transform:"translateX(-50%)",background:"#1a1a24",border:"1px solid rgba(255,255,255,.1)",borderRadius:7,padding:"5px 11px",fontSize:11,color:"rgba(255,255,255,.6)",whiteSpace:"nowrap",pointerEvents:"none",boxShadow:"0 8px 24px rgba(0,0,0,.5)",animation:"tip .15s ease forwards",zIndex:100}}>{tooltip}</span>}
    </a>
  );
}

/* ─── APP ─── */
export default function App(){
  const[pos,setPos]=useState({x:-9999,y:-9999});
  useEffect(()=>{const fn=e=>setPos({x:e.clientX,y:e.clientY});window.addEventListener("mousemove",fn);return()=>window.removeEventListener("mousemove",fn);},[]);

  const works=[
    {title:"Zed.AI – Your AI Study Buddy",tag:"AI / Voice",year:"2025",winner:true,accent:"#818cf8",tagBg:"rgba(99,102,241,.12)",tagBorder:"rgba(99,102,241,.28)",about:"An autonomous AI study partner that connects to your student account, responds to your voice, and uses Gemini 2.5 to generate study plans, quizzes, and progress tracking. Authenticated via Auth0, built at EmberHacks.",tech:"React, Flask, Gemini 2.5, ElevenLabs, Auth0, Porcupine, Playwright",link:"https://github.com/alextgu/emberhacks",devpost:"https://devpost.com/software/zed-7z0wg4"},
    {title:"DFS – Depth First Social",tag:"Full-Stack",year:"2026",winner:true,accent:"#fbbf24",tagBg:"rgba(217,119,6,.12)",tagBorder:"rgba(217,119,6,.28)",about:"Matches people who think alike using your Gemini conversation history. Builds a 6-axis interest profile and uses Snowflake vector similarity to find compatible matches. Ephemeral chats expire after 10 minutes, built at DeerHacks.",tech:"Next.js, React, FastAPI, Snowflake, Supabase, Auth0, Solana",link:"https://github.com/alextgu/deerhacks",devpost:"https://devpost.com/software/deer-deer-deer"},
    {title:"Sign Language Interpreter",tag:"Computer Vision",year:"2024",accent:"#60a5fa",tagBg:"rgba(37,99,235,.12)",tagBorder:"rgba(37,99,235,.28)",about:"Real-time sign language detection using MediaPipe hand landmarks and a KNN classifier. Captures video input, extracts keypoints, and translates gestures into readable text output.",tech:"Python, OpenCV, MediaPipe, KNN",link:"https://github.com/sakets-dev/sign_language_detector"},
    {title:"Vision-Controlled Mouse",tag:"CV / ML",year:"2024",accent:"#34d399",tagBg:"rgba(5,150,105,.12)",tagBorder:"rgba(5,150,105,.28)",about:"Control your mouse cursor entirely through hand gestures using MediaPipe landmark detection and PyAutoGUI. No hardware required.",tech:"Python, OpenCV, MediaPipe, PyAutoGUI, NumPy",link:"https://github.com/sakets-dev/vision_controlled_mouse"},
    {title:"Textify — PDF & Image to Text",tag:"Full-Stack",year:"2024",accent:"#fb7185",tagBg:"rgba(225,29,72,.12)",tagBorder:"rgba(225,29,72,.28)",about:"Full-stack OCR web app that converts PDFs and images into editable text using Tesseract and PDFPlumber.",tech:"Python, Flask, PDFPlumber, pytesseract, HTML, CSS, JavaScript",link:"https://github.com/sakets-dev/textify"},
  ];

  const stack=["React","Next.js","Python","TypeScript","AWS","Snowflake","Databricks","PostgreSQL","Docker","Flask","OpenCV","Git"];
  const ghIcon=<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>;
  const liIcon=<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
  const emIcon=<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        body{background:#0f0f16;color:#ddd8d0;font-family:'DM Sans',sans-serif;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
        @keyframes tip{from{opacity:0;transform:translateX(-50%) translateY(4px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes pulseGreen{0%,100%{box-shadow:0 0 5px #4ade80}50%{box-shadow:0 0 14px #4ade80,0 0 24px rgba(74,222,128,.25)}}
        .dot-pulse{animation:pulseGreen 2.8s ease-in-out infinite;}
        .pill{display:inline-flex;align-items:center;padding:5px 13px;border-radius:999px;font-size:11.5px;font-weight:400;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.5);transition:background .2s,color .2s,transform .2s,border-color .2s;}
        .pill:hover{background:rgba(255,255,255,.08);color:rgba(255,255,255,.85);transform:translateY(-2px);border-color:rgba(255,255,255,.15);}
        .sl{font-size:10px;letter-spacing:.15em;color:rgba(255,255,255,.2);font-weight:500;text-transform:uppercase;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-track{background:#0f0f16;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.07);border-radius:999px;}
      `}</style>

      <CursorTrail/>
      <GridBg/>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1,background:`radial-gradient(200px circle at ${pos.x}px ${pos.y}px,rgba(120,140,255,.08),transparent 100%)`}}/>

      <div style={{position:"relative",zIndex:2}}>

        {/* ── NAV ── */}
        <Reveal delay={0}>
          <nav style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 64px"}}>
            <span style={{fontFamily:"'Instrument Serif',serif",fontSize:15,color:"rgba(255,255,255,.55)",letterSpacing:"-.01em"}}>saket.sharma</span>
            <div style={{display:"flex",alignItems:"center",gap:2,padding:"5px 6px",borderRadius:999,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)"}}>
              {[["About","#about"],["Work","#work"]].map(([label,href])=>(
                <a key={label} href={href} style={{padding:"6px 18px",borderRadius:999,fontSize:12.5,color:"rgba(255,255,255,.42)",textDecoration:"none",letterSpacing:".02em",fontWeight:400,transition:"background .2s,color .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.07)";e.currentTarget.style.color="rgba(255,255,255,.85)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,.42)";}}
                >{label}</a>
              ))}
            </div>
            <a href="mailto:saketshar04@gmail.com" style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:999,background:"rgba(74,222,128,.06)",border:"1px solid rgba(74,222,128,.15)",textDecoration:"none",transition:"border-color .2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(74,222,128,.4)"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(74,222,128,.15)"}
            >
              <div className="dot-pulse" style={{width:5,height:5,borderRadius:"50%",background:"#4ade80"}}/>
              <span style={{fontSize:11,color:"#4ade80",fontWeight:500,letterSpacing:".04em"}}>Available</span>
            </a>
          </nav>
        </Reveal>

        {/* ── HERO ── */}
        <div style={{display:"flex",alignItems:"center",minHeight:"92vh",padding:"0 52px",gap:0}}>
          <div style={{flex:"0 0 50%",paddingLeft:72,paddingRight:48,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"flex-start"}}>

            <Reveal delay={80}>
              <div style={{display:"flex",gap:8,marginBottom:22,flexWrap:"wrap"}}>
                {["CS + Statistics","University of Toronto","Class of 2026"].map((t,i)=>(
                  <span key={i} style={{padding:"4px 13px",borderRadius:999,fontSize:11,fontWeight:500,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",color:"rgba(255,255,255,.4)",letterSpacing:".03em"}}>{t}</span>
                ))}
              </div>
            </Reveal>

            <Reveal delay={160} tag="h1" style={{fontFamily:"'Instrument Serif',serif",fontSize:"clamp(72px,7.5vw,120px)",fontWeight:400,lineHeight:.92,letterSpacing:"-.04em",color:"#ede9e2",marginBottom:0}}>
              Saket<br/>
              <em style={{color:"rgba(237,233,226,.28)",fontStyle:"italic"}}>Sharma.</em>
            </Reveal>

            <Reveal delay={230} style={{marginTop:14}}>
              <div style={{width:200,height:2,background:"linear-gradient(90deg,#6366f1,#8b5cf6,transparent)",borderRadius:999}}/>
            </Reveal>

            <Reveal delay={290} style={{marginTop:20}}>
              <p style={{fontSize:16.5,fontWeight:300,lineHeight:1.85,color:"rgba(255,255,255,.48)",maxWidth:440}}>
                20 y/o who loves to code. Always exploring new frameworks,{" "}
                pushing limits, and shipping things that actually work.
              </p>
            </Reveal>

            <Reveal delay={370} style={{marginTop:26,display:"flex",gap:10,flexWrap:"wrap"}}>
              <TLink href="https://github.com/sakets-dev" icon={ghIcon} label="GitHub" tooltip="sakets-dev" color="#e2e8f0"/>
              <TLink href="https://www.linkedin.com/in/saket-sharma-3a37871a7/" icon={liIcon} label="LinkedIn" tooltip="Saket Sharma" color="#60a5fa"/>
              <TLink href="mailto:saketshar04@gmail.com" icon={emIcon} label="Email" tooltip="saketshar04@gmail.com" color="#f59e0b"/>
            </Reveal>
          </div>

          <Reveal delay={200} style={{flex:"0 0 50%",display:"flex",alignItems:"center",justifyContent:"center",userSelect:"none",paddingRight:24}}>
            <ParticleGlobe size={580}/>
          </Reveal>
        </div>

        {/* ── ABOUT ── */}
        <div id="about" style={{padding:"60px 64px 72px"}}>
          <Reveal style={{display:"flex",alignItems:"center",gap:18,marginBottom:44}}>
            <span className="sl">About</span>
            <div style={{flex:1,height:1,background:"linear-gradient(90deg,rgba(255,255,255,.07),transparent)"}}/>
          </Reveal>

          <Reveal delay={60}>
            <p style={{fontFamily:"'Instrument Serif',serif",fontSize:"clamp(26px,3vw,42px)",lineHeight:1.28,color:"rgba(237,233,226,.9)",fontWeight:400,letterSpacing:"-.025em",maxWidth:800,marginBottom:48}}>
              I build with the belief that great software should feel as good as it works.
            </p>
          </Reveal>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,marginBottom:48}}>
            {[
              {label:"Background",accent:"#818cf8",text:<>CS & Statistics at UofT. I love the intersection of math and product — always chasing that mix of elegant logic and real-world impact.</>},
              {label:"Experience",accent:"#34d399",text:<>Attended <strong style={{color:"rgba(255,255,255,.85)",fontWeight:500}}>YC Startup School</strong> and <strong style={{color:"rgba(255,255,255,.85)",fontWeight:500}}>QSYS</strong>. Multiple hackathon wins, building and shipping under pressure.</>},
              {label:"Right Now",accent:"#f59e0b",text:<>Working toward a startup. Exploring ideas, picking up new tools fast, and looking for the right problem to go all-in on.</>},
            ].map(({label,accent,text},i)=>(
              <Reveal key={label} delay={80+i*70} from={i===0?"left":i===2?"right":"bottom"}>
                <div style={{padding:"22px 24px",borderRadius:12,background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)"}}>
                  <div style={{width:24,height:2,background:accent,borderRadius:999,marginBottom:14}}/>
                  <p style={{fontSize:10,letterSpacing:".13em",color:"rgba(255,255,255,.28)",fontWeight:600,textTransform:"uppercase",marginBottom:10}}>{label}</p>
                  <p style={{fontSize:13.5,lineHeight:1.85,color:"rgba(255,255,255,.62)",fontWeight:300}}>{text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200}>
            <p className="sl" style={{marginBottom:14}}>Stack</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {stack.map(s=><span key={s} className="pill">{s}</span>)}
            </div>
          </Reveal>
        </div>

        <div style={{height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,.06) 20%,rgba(255,255,255,.06) 80%,transparent)",margin:"0 64px"}}/>

        {/* ── WORK ── */}
        <div id="work" style={{padding:"60px 64px 72px"}}>
          <Reveal style={{display:"flex",alignItems:"center",gap:18,marginBottom:6}}>
            <span className="sl">Selected Work</span>
            <div style={{flex:1,height:1,background:"linear-gradient(90deg,rgba(255,255,255,.07),transparent)"}}/>
            <span style={{fontSize:9.5,color:"rgba(255,255,255,.15)",letterSpacing:".08em"}}>CLICK TO EXPAND</span>
          </Reveal>
          <Reveal delay={60}>
            <p style={{fontSize:13,color:"rgba(255,255,255,.25)",fontWeight:300,marginBottom:24,marginTop:8,letterSpacing:".01em"}}>
              Hackathon winners, CV tools, and full-stack products — built fast, shipped real.
            </p>
          </Reveal>
          {works.map((w,i)=><ProjectRow key={w.title} p={w} delay={80+i*50}/>)}
        </div>

        <div style={{height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,.06) 20%,rgba(255,255,255,.06) 80%,transparent)",margin:"0 64px"}}/>

        {/* ── FOOTER ── */}
        <div style={{padding:"20px 64px 28px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:"'Instrument Serif',serif",fontSize:14,color:"rgba(255,255,255,.18)"}}>saket.sharma</span>
          <span style={{fontSize:11,color:"rgba(255,255,255,.12)",letterSpacing:".04em"}}>© 2026</span>
          <span style={{fontSize:11,color:"rgba(255,255,255,.12)"}}>Toronto, CA</span>
        </div>

      </div>
    </>
  );
}