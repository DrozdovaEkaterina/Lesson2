export const STAGE_IDS = ['welcome','backpack','keyboard','camp','safety','summit','shortcuts','finish'];
export const STORAGE_KEY = 'ekaterina-it-everest-v1';
export const TYPING_TASKS = ['Гора','Лагерь','Ура!','Я на вершине!','Где лагерь?'];
export function matchesTyping(input,target){return typeof input==='string'&&input.trim().normalize('NFC')===target.normalize('NFC');}
export function newState(){return {version:1,stage:0,replica:0,done:[],opened:[],os:'windows',words:[],keyboardGameDone:false,devicesSeen:[],partsSeen:[],breakDone:[],screenshotStep:0,screenshotDone:false,quiz:{},mood:'',finished:false};}
export function normalizeState(raw){
  const s=newState();
  if(!raw || raw.version!==1)return s;
  if(Number.isInteger(raw.stage)&&raw.stage>=0&&raw.stage<8)s.stage=raw.stage;
  if(Number.isInteger(raw.replica)&&raw.replica>=0&&raw.replica<8)s.replica=raw.replica;
  s.done=[...new Set((Array.isArray(raw.done)?raw.done:[]).filter(x=>Number.isInteger(x)&&x>=0&&x<8))];
  s.opened=[...new Set((Array.isArray(raw.opened)?raw.opened:[]).filter(x=>typeof x==='string'&&/^task-\d+$/.test(x)))];
  if(['windows','mac','unknown'].includes(raw.os))s.os=raw.os;
  if(raw.os==='lightshot')s.os='unknown';
  s.words=[...new Set((Array.isArray(raw.words)?raw.words:[]).filter(x=>TYPING_TASKS.includes(x)))];
  s.keyboardGameDone=Boolean(raw.keyboardGameDone||s.words.length);
  for(const [key,allowed] of [['devicesSeen',['keyboard','monitor','mouse']],['partsSeen',['cpu','ram','drive']],['breakDone',['eyes','blink','shoulders','move']]])s[key]=[...new Set((Array.isArray(raw[key])?raw[key]:[]).filter(x=>allowed.includes(x)))];
  if(Number.isInteger(raw.screenshotStep)&&raw.screenshotStep>=0&&raw.screenshotStep<=5)s.screenshotStep=raw.screenshotStep;
  s.screenshotDone=Boolean(raw.screenshotDone);
  if(raw.quiz&&typeof raw.quiz==='object')for(let i=0;i<3;i++)if(Number.isInteger(raw.quiz[i])&&raw.quiz[i]>=0&&raw.quiz[i]<3)s.quiz[i]=raw.quiz[i];
  if(['happy','practice','help'].includes(raw.mood))s.mood=raw.mood;
  s.finished=Boolean(raw.finished&&s.done.length===8&&[1,0,2].every((answer,i)=>s.quiz[i]===answer));
  return s;
}
export function completeStage(state){const next={...state,done:[...new Set([...state.done,state.stage])]};if(state.stage<7){next.stage++;next.replica=0;}return next;}
export function canFinish(state){return [0,1,2,3,4,5,6].every(x=>state.done.includes(x))&&[1,0,2].every((a,i)=>state.quiz[i]===a);}
