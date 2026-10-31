import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,normalizeState,completeStage,canFinish} from '../dist/state.js';
import {LESSON,QUIZ} from '../dist/lesson.js';
test('the lesson can be completed and restored without losing progress',()=>{
  let s=newState();for(let i=0;i<7;i++)s=completeStage(s);
  assert.equal(s.stage,7);assert.deepEqual(s.done,[0,1,2,3,4,5,6]);assert.equal(canFinish(s),false);
  s.quiz={0:1,1:0,2:2};assert.equal(canFinish(s),true);
  s.done.push(7);s.finished=true;s.words=['гора','лагерь','вершина'];s.os='mac';
  assert.deepEqual(normalizeState(JSON.parse(JSON.stringify(s))),s);
});
test('jumping to the end never grants completion',()=>{
  let s=newState();s.stage=7;s.quiz={0:1,1:0,2:2};assert.equal(canFinish(s),false);
  assert.equal(normalizeState({...s,finished:true}).finished,false);
});
test('old or malformed saved data cannot break navigation',()=>{
  for(const raw of [null,[],{version:99},{version:1,stage:999,done:'broken',quiz:null}])assert.equal(normalizeState(raw).stage,0);
  const s=normalizeState({version:1,stage:3,done:[0,0,2,-1,9,'3'],words:['гора','<script>'],os:'unknown',opened:['task-1','task-1','bad'],quiz:{0:8,1:0,2:-1},finished:true});
  assert.deepEqual(s.done,[0,2]);assert.deepEqual(s.words,['гора']);assert.equal(s.os,'windows');assert.deepEqual(s.quiz,{1:0});assert.equal(s.finished,false);assert.deepEqual(s.opened,['task-1']);
});
test('revisiting an already completed stage keeps counts correct',()=>{
  let s=completeStage(newState());s.stage=0;s=completeStage(s);assert.deepEqual(s.done,[0]);assert.equal(s.stage,1);
});
test('all exercises retain the source URLs and open distinct tasks',()=>{
  const tasks=LESSON.flatMap(x=>x.tasks||[]);assert.equal(tasks.length,9);assert.equal(new Set(tasks.map(x=>x.id)).size,9);assert(tasks.every(x=>x.url.startsWith('https://')));assert.equal(QUIZ.length,3);
});
