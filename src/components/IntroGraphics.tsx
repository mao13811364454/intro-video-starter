import {Video} from '@remotion/media';
import {AbsoluteFill,CanvasImage,Easing,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import type {CSSProperties,ReactNode} from 'react';
// Layout v1: measured and tested at 1920×1080. URLs are supplied by each project.
const useLayout1080=()=>{
 const config=useVideoConfig();
 if(config.width!==1920||config.height!==1080)throw new Error('IntroGraphics v1 layout requires 1920x1080; adapt and verify a new layout version first');
 return config;
};
export const ink='#112832';
export const accent='#b5e1e4';
export const full:CSSProperties={position:'absolute',inset:0,width:'100%',height:'100%'};
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const ease={...clamp,easing:Easing.bezier(.16,1,.3,1)};
export type Rect=[number,number,number,number];
// Rect coordinates are measured on the actual source, never guessed from labels.
export const Photo=({src,sourceSize=[1920,1080],crop,box=[0,0,1920,1080]}:{src:string;sourceSize?:[number,number];crop?:Rect;box?:Rect})=>{
 useLayout1080();
 const [x,y,w,h]=box;const [sw,sh]=sourceSize;
 if(!crop)return <div style={{position:'absolute',left:x,top:y,width:w,height:h,overflow:'hidden'}}><CanvasImage src={src} style={{...full,objectFit:'contain'}}/></div>;
 const [cx,cy,cw,ch]=crop;const scale=Math.min(w/cw,h/ch);
 return <div style={{position:'absolute',left:x+(w-cw*scale)/2,top:y+(h-ch*scale)/2,width:cw*scale,height:ch*scale,overflow:'hidden'}}><CanvasImage src={src} style={{position:'absolute',width:sw*scale,height:sh*scale,left:-cx*scale,top:-cy*scale}}/></div>;
};
export const Dissolve=({children}:{children:ReactNode})=>{
 const f=useCurrentFrame();const{fps}=useLayout1080();
 return <AbsoluteFill style={{opacity:interpolate(f,[0,.5*fps],[0,1],{...clamp,easing:Easing.bezier(.33,0,.67,1)})}}>{children}</AbsoluteFill>;
};
// Scene-local seconds; fractional 80 ms phases stay fractional until sampled.
export const Cue=({text,start,end,x=100,y=82,kind='Q',hold=false,size,staticIn=false}:{text:string;start:number;end:number;x?:number;y?:number;kind?:'T'|'Q'|'A';hold?:boolean;size?:number;staticIn?:boolean})=>{
 const f=useCurrentFrame();const{fps}=useLayout1080();const t=f/fps;
 if(t<start||t>=end)return null;
 const aux=kind==='A';
 return <div style={{position:'absolute',left:x,top:y,maxWidth:1640,color:aux?accent:'#fff',background:'rgba(17,40,50,.88)',padding:aux?'8px 14px':'14px 24px',borderRadius:8,fontSize:size??(aux?32:kind==='T'?54:48),fontWeight:500,lineHeight:1.3,
 opacity:(staticIn?1:interpolate(t,[start,start+(aux?.16:.32)],[0,1],aux?clamp:ease))*(hold?1:interpolate(t,[end-.16,end],[1,0],clamp)),
 translate:`0px ${aux?0:interpolate(t,[start,start+.32],[kind==='T'?16:12,0],ease)}px`}}>{text}</div>;
};
export const Guide=({start,end,path,rect,hold=false}:{start:number;end:number;path?:string;rect?:Rect;hold?:boolean})=>{
 const f=useCurrentFrame();const{fps}=useLayout1080();const t=f/fps;if(t<start||t>=end)return null;
 return <svg width={1920} height={1080} style={{...full,opacity:interpolate(t,[start,start+.16],[0,1],clamp)*(hold?1:interpolate(t,[end-.16,end],[1,0],clamp))}}>
 {path?<path d={path} fill="none" stroke={accent} strokeWidth={3}/>:null}
 {rect?<rect x={rect[0]} y={rect[1]} width={rect[2]} height={rect[3]} rx={9} fill="none" stroke={accent} strokeWidth={3}/>:null}
 </svg>;
};
export type Caption={text:string;startMs:number;endMs:number;timestampMs:number|null;confidence:number|null};
export const Captions=({captions}:{captions:Caption[]})=>{
 const f=useCurrentFrame();const {fps}=useLayout1080();const ms=f/fps*1000;
 const c=captions.find(c=>ms>=c.startMs&&ms<c.endMs);if(!c)return null;
 return <div style={{position:'absolute',bottom:82,left:100,right:100,textAlign:'center',opacity:interpolate(ms-c.startMs,[0,100],[0,1],clamp)}}>
  <span style={{display:'inline-block',padding:'12px 28px 15px',background:'rgba(12,22,33,.84)',borderRadius:12,color:'#fff',fontSize:56,fontWeight:600,lineHeight:1.35,letterSpacing:1}}>{c.text}</span>
 </div>;
};
// Parent Sequence owns source trim and voice/caption clocks. This offset affects
// geometry only; never also trim Video here. Keyframes use scene-local FRAMES.
// Pass the SAME sourceStart variable to parent trimBefore and geometryOffsetFrames.
// Its sign is positive for positive trimBefore. Keep caption times in SOURCE ms.
export const Presenter=({src,geometryOffsetFrames,changes,symmetric=false,sourceSize=[1920,1080],circle=[1480,625,360],cropCenter=[960,520],cropHeight=780}:{src:string;geometryOffsetFrames:number;changes:[number,number][];symmetric?:boolean;sourceSize?:[number,number];circle?:[number,number,number];cropCenter?:[number,number];cropHeight?:number})=>{
 useLayout1080();
 if(!Number.isFinite(geometryOffsetFrames)||geometryOffsetFrames<0)throw new Error('geometryOffsetFrames must equal the non-negative parent trimBefore');
 const f=useCurrentFrame()-geometryOffsetFrames;
 if(changes.length<2||changes.some(([frame,p],i)=>!Number.isFinite(frame)||!Number.isFinite(p)||p<0||p>1||(i>0&&frame<=changes[i-1][0])))throw new Error('Presenter keyframes: >=2 ascending frames, values 0..1');
 const p=interpolate(f,changes.map(k=>k[0]),changes.map(k=>k[1]),symmetric?{...clamp,easing:Easing.bezier(.65,0,.35,1)}:ease);
 const [sw,sh]=sourceSize;const[cx,cy,size]=circle;
 const width=1920*Math.pow(size/1920,p),height=1080*Math.pow(size/1080,p);
 const scale=height/interpolate(p,[0,1],[sh,cropHeight]);
 const centerX=interpolate(p,[0,1],[sw/2,cropCenter[0]]);
 const centerY=interpolate(p,[0,1],[sh/2,cropCenter[1]]);
 return <div style={{position:'absolute',left:cx*p,top:cy*p,width,height,overflow:'hidden',borderRadius:Math.min(width,height)/2*p,boxShadow:`0 0 0 ${3*p}px rgba(214,239,240,.95),0 ${6*p}px ${20*p}px rgba(0,0,0,${.22*p})`}}>
 <Video name="Presenter — shared source clock" src={src} muted objectFit="contain" style={{position:'absolute',width:sw*scale,height:sh*scale,left:width/2-centerX*scale,top:height/2-centerY*scale}}/>
 </div>;
};
// Crop rectangles are measured source pixels; the layout is 1080p only.
export const WholeDetailComparison = ({overallSrc,detailSrc,overallCrop,detailCrop,sourceSize,labels=['整体','细节'],durationSeconds}:{overallSrc:string;detailSrc:string;overallCrop:Rect;detailCrop:Rect;sourceSize:[number,number];labels?:[string,string];durationSeconds:number}) => {
  const [sw,sh]=sourceSize;
  if(sw!==1920||sh!==1080)throw new Error('Comparison v1 requires 1920x1080 source images; prepare matching derived images and remeasure crops');
  const [ox,oy,ow,oh]=overallCrop;const [dx,dy,dw,dh]=detailCrop;
  if(ow<=0||oh<=0||dw<=0||dh<=0||Math.abs(ow/oh-16/9)>.01||Math.abs(dw/dh-16/9)>.01)throw new Error('Comparison crops must be positive 16:9 rectangles');
  const f = useCurrentFrame();
  const { fps } = useLayout1080();
  const p = interpolate(f, [0, 0.65 * fps], [0, 1], {...clamp,easing:Easing.bezier(.65,0,.35,1)});
  const leftIn = interpolate(f, [0.18 * fps, 0.75 * fps], [0, 1], ease);
  const s = interpolate(p, [0, 1], [1, 800 / dw]);
  return <AbsoluteFill style={{ background: ink }}>
    <div style={{ position: "absolute", left: 100, top: 170, width: 800, height: 450,
      overflow: "hidden", borderRadius: 12, opacity: leftIn,
      translate: `${interpolate(f, [0.18 * fps, 0.75 * fps], [-30, 0], ease)}px 0px` }}>
      <CanvasImage src={overallSrc} style={{ position: "absolute",
        width: sw * 800 / ow, height: sh * 800 / ow,
        left: -ox * 800 / ow, top: -oy * 800 / ow }} />
    </div>
    <div style={{ position: "absolute", left: 960 * p, top: 170 * p,
      width: interpolate(p, [0, 1], [1920, 800]),
      height: interpolate(p, [0, 1], [1080, 450]),
      overflow: "hidden", borderRadius: 12 * p }}>
      <CanvasImage src={detailSrc} style={{ position: "absolute",
        width: sw * s, height: sh * s, left: -dx * s * p, top: -dy * s * p }} />
    </div>
    <Cue text={labels[0]} start={.6} end={durationSeconds} kind="Q" x={100} y={82} hold/>
    <Cue text={labels[1]} start={.68} end={durationSeconds} kind="Q" x={960} y={82} hold/>
    <svg width={1920} height={1080} style={{...full,opacity:interpolate(f,[.76*fps,.92*fps],[0,.75],clamp)}}>
      <path d="M100 640 H900 M960 640 H1440" stroke={accent} strokeWidth={3}/>
    </svg>
  </AbsoluteFill>;
};

export const ImageCard=({src,fit='contain'}:{src:string;fit?:'contain'|'cover'})=><AbsoluteFill><CanvasImage src={src} style={{...full,objectFit:fit}}/></AbsoluteFill>;
