import React from "react";
import { AlertSummary } from "@/lib/sheets";

const ALERT_TYPES = [
  { key:"distractedDriving", short:"Distracted",  color:"#f87171" },
  { key:"seatBeltAbsent",    short:"Seat Belt",   color:"#fb923c" },
  { key:"smoking",           short:"Smoking",     color:"#94a3b8" },
  { key:"fatigueDriving",    short:"Fatigue",     color:"#60a5fa" },
  { key:"phoneCall",         short:"Phone",       color:"#f472b6" },
  { key:"overSpeed",         short:"Overspeed",   color:"#fde047" },
];

interface Props {
  alerts: AlertSummary;
  title?: string;
  titleCenter?: boolean;
  compact?: boolean;
  card?: boolean;
}

function fmt(n: number): string {
  if (n>=1_000_000) return (n/1_000_000).toFixed(1)+"M";
  if (n>=1000) return (n/1000).toFixed(1)+"k";
  return String(n);
}

function polar(cx:number,cy:number,r:number,deg:number){
  const rad=((deg-90)*Math.PI)/180;
  return {x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)};
}

function arc(cx:number,cy:number,OR:number,IR:number,sa:number,ea:number):string{
  const gap=1.5,sA=sa+gap/2,eA=ea-gap/2;
  if(eA<=sA) return "";
  const o1=polar(cx,cy,OR,sA),o2=polar(cx,cy,OR,eA);
  const i1=polar(cx,cy,IR,sA),i2=polar(cx,cy,IR,eA);
  const lg=eA-sA>180?1:0;
  return [`M ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,`A ${OR} ${OR} 0 ${lg} 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,`L ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`,`A ${IR} ${IR} 0 ${lg} 0 ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,"Z"].join(" ");
}

function buildSegs(alerts:AlertSummary){
  const total=alerts.totalAlerts||0; let angle=0;
  return ALERT_TYPES.map(t=>{
    const val=alerts[t.key as keyof AlertSummary] as number;
    const pct=total>0?val/total:0;
    const sweep=pct*360; const start=angle; angle+=sweep;
    return {...t,val,pct,startAngle:start,endAngle:angle,midAngle:start+sweep/2};
  }).filter(s=>s.val>0);
}

function spreadLabels(segs:ReturnType<typeof buildSegs>,CX:number,CY:number,OR:number,lineReach:number,horizLen:number){
  const MIN_GAP=18;
  const process=(group:typeof segs,isRight:boolean)=>{
    const items=group.map(seg=>{const kink=polar(CX,CY,OR+lineReach,seg.midAngle);return{seg,naturalY:kink.y,finalY:kink.y,kink};}).sort((a,b)=>a.naturalY-b.naturalY);
    for(let i=1;i<items.length;i++) if(items[i].finalY-items[i-1].finalY<MIN_GAP) items[i].finalY=items[i-1].finalY+MIN_GAP;
    for(let i=items.length-2;i>=0;i--) if(items[i+1].finalY-items[i].finalY<MIN_GAP) items[i].finalY=items[i+1].finalY-MIN_GAP;
    return items.map(item=>({seg:item.seg,dotPt:polar(CX,CY,OR+5,item.seg.midAngle),kinkPt:item.kink,endX:isRight?CX+OR+lineReach+horizLen:CX-OR-lineReach-horizLen,endY:item.finalY,isRight}));
  };
  return [...process(segs.filter(s=>s.midAngle>=0&&s.midAngle<180),true),...process(segs.filter(s=>s.midAngle>=180),false)];
}

function CardDonut({alerts}:{alerts:AlertSummary}){
  const total=alerts.totalAlerts||0;
  const segs=buildSegs(alerts);
  const active=ALERT_TYPES.map(t=>({...t,val:alerts[t.key as keyof AlertSummary] as number})).filter(t=>t.val>0);
  const W=200,H=200,CX=100,CY=100,OR=80,IR=51;
  if(total===0) return <div style={{padding:"12px 0",color:"rgba(255,255,255,0.2)",fontFamily:"'Inter',sans-serif",fontSize:"11px",textAlign:"center"}}>No alert data</div>;
  return(
    <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
      <div style={{flexShrink:0,width:`${W}px`}}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{display:"block"}}>
          <defs><radialGradient id="cg_card" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(74,222,128,0.1)"/><stop offset="100%" stopColor="transparent"/></radialGradient></defs>
          <circle cx={CX} cy={CY} r={OR+14} fill="url(#cg_card)"/>
          <circle cx={CX} cy={CY} r={(OR+IR)/2} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={OR-IR}/>
          {segs.map(s=><path key={s.key} d={arc(CX,CY,OR,IR,s.startAngle,s.endAngle)} fill={s.color} fillOpacity={0.9} stroke="rgba(10,15,10,0.9)" strokeWidth="1"/>)}
          <circle cx={CX} cy={CY} r={IR-1} fill="#111811"/>
          <text x={CX} y={CY-9} textAnchor="middle" dominantBaseline="middle" style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:800,fontSize:"20px",fill:"#f0f7f0"}}>{fmt(total)}</text>
          <text x={CX} y={CY+10} textAnchor="middle" dominantBaseline="middle" style={{fontFamily:"'Inter',sans-serif",fontSize:"7px",fill:"rgba(255,255,255,0.35)",letterSpacing:"0.1em"}}>TOTAL ALARMS</text>
        </svg>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:"5px"}}>
        {active.map(item=>{
          const pct=total>0?(item.val/total)*100:0;
          return(
            <div key={item.key} style={{display:"flex",alignItems:"center",background:`${item.color}0e`,border:`1px solid ${item.color}28`,borderRadius:"6px",padding:"4px 8px",gap:"6px"}}>
              <div style={{width:"7px",height:"7px",borderRadius:"2px",background:item.color,flexShrink:0}}/>
              <span style={{fontFamily:"'Inter',sans-serif",fontSize:"9.5px",color:"rgba(255,255,255,0.5)",fontWeight:500,flex:1,whiteSpace:"nowrap"}}>{item.short}</span>
              <span style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:700,fontSize:"11px",color:item.color,flexShrink:0}}>{fmt(item.val)}</span>
              <span style={{fontFamily:"'Inter',sans-serif",fontSize:"8.5px",color:"rgba(255,255,255,0.28)",flexShrink:0}}>{pct.toFixed(pct<1?1:0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FullDonut({alerts,compact}:{alerts:AlertSummary;compact?:boolean}){
  const segs=buildSegs(alerts);
  const total=alerts.totalAlerts||0;
  // ViewBox 900×500 — same scaling strategy as line chart
  // width="100%" + no height + meet → proportional zoom, no distortion
  const VW=900,VH=compact?380:500;
  const CX=VW/2,CY=compact?178:230;
  const OR=compact?120:160,IR=compact?76:102;
  const lineReach=compact?30:38,horizLen=compact?80:100;
  const fs=compact?12:14,ps=compact?11:12.5;
  const dotR=compact?3:3.5,cfs=compact?34:44,sfs=compact?10:12;
  const labeled=spreadLabels(segs,CX,CY,OR,lineReach,horizLen);
  const legendY=VH-22;
  const iw=VW/Math.min(segs.length||1,6);
  return(
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{display:"block"}}>
      <defs>
        <radialGradient id="cg_full" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(74,222,128,0.13)"/><stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      <circle cx={CX} cy={CY} r={OR+24} fill="url(#cg_full)"/>
      <circle cx={CX} cy={CY} r={(OR+IR)/2} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={OR-IR}/>
      {segs.map(s=><path key={s.key} d={arc(CX,CY,OR,IR,s.startAngle,s.endAngle)} fill={s.color} fillOpacity={0.88} stroke="rgba(10,15,10,0.7)" strokeWidth="0.8"/>)}
      <circle cx={CX} cy={CY} r={IR-1} fill="#0a0f0a"/>
      <text x={CX} y={CY-sfs*1.3} textAnchor="middle" dominantBaseline="middle" style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:800,fontSize:`${cfs}px`,fill:"#f0f7f0"}}>{fmt(total)}</text>
      <text x={CX} y={CY+sfs*1.7} textAnchor="middle" dominantBaseline="middle" style={{fontFamily:"'Inter',sans-serif",fontSize:`${sfs}px`,fill:"rgba(255,255,255,0.38)",letterSpacing:"0.1em"}}>TOTAL ALARMS</text>
      {labeled.map(({seg,dotPt,kinkPt,endX,endY,isRight})=>{
        const pctStr=`(${(seg.pct*100).toFixed(seg.pct<0.01?2:seg.pct<0.1?1:0)}%)`;
        return(
          <g key={`lbl-${seg.key}`}>
            <circle cx={dotPt.x} cy={dotPt.y} r={dotR} fill={seg.color}/>
            <polyline points={`${dotPt.x.toFixed(1)},${dotPt.y.toFixed(1)} ${kinkPt.x.toFixed(1)},${kinkPt.y.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`} fill="none" stroke={seg.color} strokeWidth="0.9" strokeOpacity="0.65"/>
            <text x={isRight?endX+6:endX-6} y={endY} textAnchor={isRight?"start":"end"} dominantBaseline="middle" style={{fontFamily:"'Inter',sans-serif",fontSize:`${fs}px`,fill:"rgba(240,247,240,0.85)",fontWeight:500}}>
              {seg.short}{" "}<tspan fill={seg.color} fontWeight="700" fontSize={`${ps}px`}>{pctStr}</tspan>
            </text>
          </g>
        );
      })}
      <g>
        {segs.map((seg,i)=>{
          const lx=(i+0.5)*iw;
          return(
            <g key={`leg-${seg.key}`}>
              <rect x={lx-22} y={legendY-6} width={12} height={12} rx={2} fill={seg.color} fillOpacity={0.85}/>
              <text x={lx-7} y={legendY+1} dominantBaseline="middle" style={{fontFamily:"'Inter',sans-serif",fontSize:"10px",fill:"rgba(255,255,255,0.4)"}}>{seg.short}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export default function DonutAlertChart({alerts,title,titleCenter=false,compact=false,card=false}:Props){
  const total=alerts.totalAlerts||0;
  const titleEl=title&&(
    <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:700,fontSize:card?"11px":compact?"13px":"16px",color:"#f0f7f0",marginBottom:card?"10px":"18px",letterSpacing:"-0.01em",textAlign:titleCenter?"center":"left"}}>{title}</div>
  );
  const emptyEl=(<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:card?"80px":"140px",color:"rgba(255,255,255,0.2)",fontFamily:"'Inter',sans-serif",fontSize:"12px",background:"rgba(255,255,255,0.02)",borderRadius:"12px",border:"1px solid rgba(255,255,255,0.05)"}}>No alert data</div>);
  if(card) return <div>{titleEl}{total===0?emptyEl:<CardDonut alerts={alerts}/>}</div>;
  return(<div style={{width:"100%"}}>{titleEl}{total===0?emptyEl:<FullDonut alerts={alerts} compact={compact}/>}</div>);
}
