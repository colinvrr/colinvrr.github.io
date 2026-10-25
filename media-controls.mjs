// Platform controls remain independent of WebGL and its animation loop.
export function createMediaControls({getAudio,play,pause,stop,nav=globalThis.navigator,Metadata=globalThis.MediaMetadata}) {
  const session=nav?.mediaSession;
  let current=null,disposed=false;
  const safely=fn=>{try{return fn();}catch{}};
  function preparePlayback(){safely(()=>{if(nav?.audioSession)nav.audioSession.type='playback';});}
  function position(){
    if(!session?.setPositionState)return;
    const audio=getAudio();
    safely(()=>{
      if(!audio||!Number.isFinite(audio.duration)||audio.duration<=0){session.setPositionState();return;}
      session.setPositionState({duration:audio.duration,playbackRate:audio.playbackRate||1,position:Math.max(0,Math.min(audio.duration,audio.currentTime||0))});
    });
  }
  function seek(time){
    const audio=getAudio();if(!audio||!Number.isFinite(time))return;
    const end=Number.isFinite(audio.duration)?audio.duration:Infinity;
    safely(()=>{audio.currentTime=Math.max(0,Math.min(end,time));});position();
  }
  const actions={
    play:()=>{preparePlayback();Promise.resolve().then(play).catch(()=>{});},
    pause:()=>pause(),stop:()=>stop(),
    seekto:details=>seek(details.seekTime),
    seekbackward:details=>{const audio=getAudio();if(audio)seek(audio.currentTime-(details.seekOffset??10));},
    seekforward:details=>{const audio=getAudio();if(audio)seek(audio.currentTime+(details.seekOffset??10));}
  };
  if(session)for(const [action,handler]of Object.entries(actions))safely(()=>session.setActionHandler(action,handler));
  return {
    preparePlayback,position,
    update(audio,playing,title='MIX'){
      if(!session||disposed)return;
      if(current!==audio){
        current=audio;
        safely(()=>{session.metadata=audio&&Metadata?new Metadata({title,artist:'colinvrr',album:'colinvrr'}):null;});
      }
      safely(()=>{session.playbackState=audio?(playing?'playing':'paused'):'none';});
      position();
    },
    dispose(){disposed=true;if(session){for(const action of Object.keys(actions))safely(()=>session.setActionHandler(action,null));safely(()=>{session.metadata=null;session.playbackState='none';session.setPositionState?.();});}}
  };
}
