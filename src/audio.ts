let context:AudioContext|undefined;
const getContext=()=>{if(!context){const Ctx=window.AudioContext||(window as typeof window & {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(Ctx)context=new Ctx();}return context;};
export function playRngTone(kind:"roll"|"rare"|"click"="click"){
 try{
  const ctx=getContext();if(!ctx)return;
  const osc=ctx.createOscillator();const gain=ctx.createGain();
  const now=ctx.currentTime;const base=kind==="rare"?440:kind==="roll"?180:260;
  osc.type=kind==="rare"?"triangle":"sine";osc.frequency.setValueAtTime(base,now);
  osc.frequency.exponentialRampToValueAtTime(base*(kind==="rare"?2.2:1.45),now+.12);
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(kind==="rare"?.12:.045,now+.015);
  gain.gain.exponentialRampToValueAtTime(.0001,now+.17);
  osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+.18);
 }catch{}
}