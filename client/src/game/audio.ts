export class AudioDirector {
  private ctx: AudioContext | null = null;
  private ambience: OscillatorNode | null = null;
  private ambienceGain: GainNode | null = null;
  private musicOsc: OscillatorNode[] = [];
  private musicGain: GainNode | null = null;
  private stageIndex = 1;
  private lastStep = 0;
  private lastBeat = 0;
  private muted = false;
  unlock() {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    if (!this.ambience && this.ctx) {
      this.ambience = this.ctx.createOscillator();
      this.ambienceGain = this.ctx.createGain();
      this.ambience.type = 'sine'; this.ambience.frequency.value = 58;
      this.ambienceGain.gain.value = 0.018;
      this.ambience.connect(this.ambienceGain).connect(this.ctx.destination); this.ambience.start();
    }
    this.ensureMusic();
  }
  setStage(stage:number) { this.stageIndex=Math.max(1,Math.min(9,Math.floor(stage)||1)); this.retuneMusic(); }
  private ensureMusic() {
    if (!this.ctx || this.musicOsc.length) return;
    this.musicGain=this.ctx.createGain(); this.musicGain.gain.value=this.muted?0:0.012; this.musicGain.connect(this.ctx.destination);
    for (const type of ['sine','triangle'] as OscillatorType[]) { const osc=this.ctx.createOscillator(); osc.type=type; osc.connect(this.musicGain); osc.start(); this.musicOsc.push(osc); }
    this.retuneMusic();
  }
  private retuneMusic() {
    if (!this.ctx || this.musicOsc.length<2) return;
    const roots=[46,52,58,64,49,55,44,62,41]; const root=roots[this.stageIndex-1]??58;
    this.musicOsc[0].frequency.setTargetAtTime(root,this.ctx.currentTime,.35); this.musicOsc[1].frequency.setTargetAtTime(root*(this.stageIndex%4===0?1.5:1.333),this.ctx.currentTime,.35);
  }
  setMuted(value:boolean) { this.muted=value; if(this.ambienceGain) this.ambienceGain.gain.value=value?0:0.018; if(this.musicGain) this.musicGain.gain.value=value?0:0.012; }
  private tone(freq:number,duration:number,gain:number,type:OscillatorType='sine',offset=0) {
    if(this.muted || !this.ctx) return;
    const now=this.ctx.currentTime+offset; const osc=this.ctx.createOscillator(); const amp=this.ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(freq,now);amp.gain.setValueAtTime(0.0001,now);amp.gain.exponentialRampToValueAtTime(gain,now+0.012);amp.gain.exponentialRampToValueAtTime(0.0001,now+duration);osc.connect(amp).connect(this.ctx.destination);osc.start(now);osc.stop(now+duration+0.03);
  }
  footstep(surface:'tile'|'desk'|'carpet'='tile',running=false){const now=performance.now();if(now-this.lastStep< (running?180:280))return;this.lastStep=now;const profile=surface==='desk'?[116,0.028]:surface==='carpet'?[58,0.016]:[72,0.024];const gain=(running?1.75:1)*profile[1];this.tone(profile[0],running?0.095:0.075,gain,'triangle');this.tone(surface==='desk'?230:surface==='carpet'?92:132,running?0.06:0.045,gain*.55,'square',0.01);if(running)this.tone(46,0.11,0.018,'sine',0.02);}
  pickup(){this.tone(660,0.12,0.035,'sine');this.tone(990,0.18,0.024,'sine',0.08);}
  alert(){this.tone(180,0.18,0.06,'sawtooth');this.tone(110,0.24,0.045,'square',0.12);}
  jammer(){this.tone(880,0.08,0.035,'square');this.tone(1760,0.2,0.025,'sawtooth',0.06);this.tone(120,0.32,0.04,'sine',0.12);}
  investigate(){this.tone(260,0.12,0.028,'triangle');this.tone(320,0.18,0.022,'triangle',0.12);}
  stage(){this.tone(330,0.18,0.025,'sine');this.tone(440,0.24,0.025,'sine',0.15);}
  servo(){this.tone(380,0.08,0.025,'square');this.tone(260,0.12,0.018,'square',0.07);}
  escape(){this.tone(440,0.12,0.03,'sine');this.tone(660,0.18,0.03,'sine',0.1);this.tone(880,0.24,0.03,'sine',0.22);}
  // Heartbeat quickens with suspicion: silent below 25%, ~55 bpm at 25%, ~170 bpm at 100%.
  heartbeat(suspicion:number){if(suspicion<25)return;const now=performance.now();const interval=1100-(Math.min(100,suspicion)-25)/75*750;if(now-this.lastBeat<interval)return;this.lastBeat=now;const g=0.02+suspicion/100*0.03;this.tone(62,0.11,g,'sine');this.tone(52,0.13,g*.8,'sine',0.14);}
  flatline(){this.tone(988,1.4,0.03,'sine');this.tone(110,0.6,0.04,'sawtooth');}
  dispose(){try{this.ambience?.stop();this.musicOsc.forEach(osc=>osc.stop());}catch{/* already stopped */}this.musicOsc=[];void this.ctx?.close();this.ctx=null;}
}
