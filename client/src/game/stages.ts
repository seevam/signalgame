import {GameWorld} from './world';
import {CorridorWorld} from './corridor';
import {ArchivesWorld} from './archives';
import {VaultWorld} from './vault';
import {CampaignWorld} from './campaign';

export const TOTAL_STAGES=9;
export type StageMeta={build:string;title:string;objective:string};
export const STAGE_META:Record<number,StageMeta>={
  1:{build:'BUILD 01 / RECEPTION',title:'THE FIRST STEP',objective:'Find the keycard and reach the east wing.'},
  2:{build:'BUILD 02 / EAST CORRIDOR',title:'SOMETHING IS WRONG HERE',objective:'Reach the east wing through the corridor.'},
  3:{build:'BUILD 03 / THE ARCHIVES',title:'THE TERMINAL REMEMBERS',objective:'Find the terminal and recover the archive index.'},
  4:{build:'BUILD 04 / THE VAULT',title:'THE LOCK KNOWS YOUR PULSE',objective:'Hack the camera, cross the lasers, and open the vault.'},
  5:{build:'BUILD 05 / DOCTOR’S OFFICE',title:'THE NAME',objective:'Disable the laser tripwires and find the authorization.'},
  6:{build:'BUILD 06 / LABORATORY',title:'EXPERIMENT SEVEN',objective:'Recover what the laboratory left behind.'},
  7:{build:'BUILD 07 / BASEMENT STORAGE',title:'WHAT THEY’RE HIDING',objective:'Turn on the lights, find the patient, and get out.'},
  8:{build:'BUILD 08 / SERVER ROOM',title:'UPLOAD',objective:'Hold the terminal long enough to send the truth outside.'},
  9:{build:'BUILD 09 / DIRECTOR’S OFFICE',title:'THE TRUTH WILL OUT',objective:'Take the signed authorization and run for the roof.'},
};

export function clampStage(value:number){return Number.isFinite(value)?Math.max(1,Math.min(TOTAL_STAGES,Math.floor(value))):1;}
export function stageMeta(stage:number){return STAGE_META[clampStage(stage)];}
export function createWorldForStage(stage:number):any{
  switch(clampStage(stage)){
    case 1:return new GameWorld();
    case 2:return new CorridorWorld();
    case 3:return new ArchivesWorld();
    case 4:return new VaultWorld();
    default:return new CampaignWorld(clampStage(stage));
  }
}

const STORAGE_KEY='signal.unlocked.v1';
export function loadUnlocked(){
  try{const raw=window.localStorage.getItem(STORAGE_KEY);return raw?clampStage(Number(raw)):1;}catch{return 1;}
}
export function unlockStage(stage:number){
  const next=clampStage(stage);
  try{if(next>loadUnlocked())window.localStorage.setItem(STORAGE_KEY,String(next));}catch{/* storage unavailable */}
  return Math.max(next,loadUnlocked());
}
