import { LESSON, QUIZ } from './lesson.js';
import { drawing } from './drawings.js';
import { STAGE_IDS, STORAGE_KEY, newState, normalizeState, completeStage, canFinish } from './state.js';

const $=selector=>document.querySelector(selector);
let state=newState();
let storageAvailable=true;
try{state=normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)));}catch{storageAvailable=false;}
const initialHash=location.hash.slice(1);
if(STAGE_IDS.includes(initialHash)){state.stage=STAGE_IDS.indexOf(initialHash);state.replica=0;}
const route=$('#route-list');
LESSON.forEach((stage,i)=>{
  const li=document.createElement('li');li.className='route-item';
  li.innerHTML=`<button type="button" class="route-button" data-stage="${i}" aria-label="${i+1}. ${stage.nav}"><span class="route-number">${i+1}</span><span class="route-name">${stage.nav}</span></button>`;
  route.appendChild(li);
});
$('#brand-drawing').innerHTML=drawing('flag');
$('#small-compass').innerHTML=drawing('compass');

function save(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));storageAvailable=true;}catch{storageAvailable=false;}
  $('#save-note').textContent=storageAvailable?'Твой прогресс сохраняется':'Прогресс на время этой вкладки';
  $('#storage-note').hidden=storageAvailable;
  $('#storage-note').textContent='Браузер не разрешил сохранить прогресс. Можно продолжить урок в этой вкладке.';
}
function updateProgress(){
  [...route.querySelectorAll('button')].forEach((b,i)=>{
    b.classList.toggle('done',state.done.includes(i));
    b.querySelector('.route-number').textContent=state.done.includes(i)?'✓':i+1;
    if(i===state.stage)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');
  });
  $('#progress-caption').textContent=`${state.done.length} из 8`;
  $('#progress-fill').style.width=`${state.done.length/8*100}%`;
  $('.progress-track').setAttribute('aria-valuenow',state.done.length);
}
function goTo(index,{focus=true}={}){
  if(!Number.isInteger(index)||index<0||index>=LESSON.length)return;
  state.stage=index;state.replica=0;save();render();
  if(focus){$('#lesson').focus({preventScroll:true});$('#lesson').scrollIntoView({behavior:'smooth',block:'start'});}
}
function renderReplica(){
  const stage=LESSON[state.stage];
  state.replica=Math.min(state.replica,stage.lines.length-1);
  $('#replica').textContent=stage.lines[state.replica];
  $('#replica-dots').replaceChildren();
  stage.lines.forEach((_,i)=>{
    const b=document.createElement('button');b.type='button';b.className='replica-dot';b.setAttribute('aria-label',`Реплика ${i+1} из ${stage.lines.length}`);b.setAttribute('aria-pressed',String(i===state.replica));
    b.addEventListener('click',()=>{state.replica=i;renderReplica();save();});$('#replica-dots').appendChild(b);
  });
  $('#next-replica').innerHTML=state.replica<stage.lines.length-1?'Дальше <span aria-hidden="true">→</span>':'Сначала <span aria-hidden="true">↺</span>';
}
function tasksHTML(tasks){
  const make=t=>`<a class="task-link${state.opened.includes(t.id)?' opened':''}" data-task="${t.id}" href="${t.url}" target="_blank" rel="noopener noreferrer" aria-label="${t.title}. Откроется в новой вкладке"><span><strong>${t.title}</strong><small>${t.desc}</small></span><span class="task-right"><span class="task-tag">${state.opened.includes(t.id)?'Открывалось':(t.tag||'Ещё практика')}</span><span class="external-arrow" aria-hidden="true">↗</span></span></a>`;
  const main=tasks.filter(t=>!t.extra),extra=tasks.filter(t=>t.extra);
  return `<div class="task-list">${main.map(make).join('')}</div><p class="external-note">Откроется новая вкладка. После задания возвращайся в эту тетрадь.</p>${extra.length?`<details class="extra-tasks"><summary>Хочешь ещё? Дополнительные задания (${extra.length})</summary><div class="task-list">${extra.map(make).join('')}</div></details>`:''}`;
}
function renderActivity(){
  const stage=LESSON[state.stage],area=$('#activity');
  const tasks=stage.tasks?tasksHTML(stage.tasks):'';
  if(stage.kind==='welcome'){
    area.innerHTML='<div class="welcome-note"><span><strong>8</strong> остановок</span><span>Примерно <strong>45 минут</strong></span><span>В своём темпе</span></div>';
  }else if(stage.kind==='devices'){
    area.innerHTML=`<div class="device-grid" aria-label="Устройства компьютера"><button type="button" class="device-button" data-device="keyboard" aria-pressed="false">${drawing('keyboard')}<strong>Клавиатура</strong><span>Нажми и узнай</span></button><button type="button" class="device-button" data-device="monitor" aria-pressed="false">${drawing('monitor')}<strong>Монитор</strong><span>Нажми и узнай</span></button><button type="button" class="device-button" data-device="mouse" aria-pressed="false">${drawing('mouse')}<strong>Мышь</strong><span>Нажми и узнай</span></button></div><p class="device-explanation" role="status">У каждого устройства есть своя важная работа.</p>${tasks}`;
  }else if(stage.kind==='keyboard'){
    area.innerHTML=`${tasks}<form class="practice" id="typing-form"><h2 class="section-caption">А теперь — маленькая практика</h2><p class="practice-intro">Три слова из нашей экспедиции. Печатай спокойно, по одной букве.</p><label for="typing-input">Напечатай слово, которое видишь слева:</label><div class="typing-line"><span class="word-target" id="word-target"></span><input class="text-input" id="typing-input" autocomplete="off" spellcheck="false" autocapitalize="none" aria-describedby="typing-feedback"><button type="submit" class="secondary-button" id="check-word">Проверить</button></div><p class="feedback" id="typing-feedback" role="status"></p></form>`;
    updateWord();
  }else if(stage.kind==='components'){
    area.innerHTML=`<div class="component-scene"><div class="scene-art">${drawing('camp')}</div><div class="component-options" aria-label="Детали компьютера"><button class="component-button" type="button" data-component="cpu" aria-pressed="false">${drawing('cpu')}<span>Процессор</span></button><button class="component-button" type="button" data-component="ram" aria-pressed="false">${drawing('ram')}<span>Оперативная память</span></button><button class="component-button" type="button" data-component="drive" aria-pressed="false">${drawing('drive')}<span>Накопитель</span></button></div></div><p class="component-description" role="status">Выбери деталь и прочитай, для чего она нужна.</p>${tasks}`;
  }else if(stage.kind==='safety'){
    area.innerHTML=`<div class="rules-grid"><div class="rule">${drawing('shield')}<span>Бережём себя<br>и компьютер</span></div><div class="rule">${drawing('monitor')}<span>Сидим удобно<br>и внимательно</span></div><div class="rule">${drawing('tent')}<span>Делаем привалы<br>и отдыхаем</span></div></div><div class="break-note"><span class="handwritten">Маленький привал!</span><p>Встань, расправь плечи, посмотри вдаль. Возвращайся, когда отдохнёшь.</p></div>${tasks}`;
  }else if(stage.kind==='screenshot'){
    area.innerHTML=`<h2 class="section-caption">Какой у тебя компьютер?</h2>${osHTML(true)}<div id="screenshot-instructions"></div><div class="summit-postcard" id="summit-postcard"><h3>Моя победа — IT-Эверест!</h3>${drawing('summit')}<p class="postcard-caption">Большая вершина покоряется маленькими шагами.</p><p class="postcard-small">Моя экспедиция с Екатериной</p></div>`;
    renderScreenshot();
  }else if(stage.kind==='shortcuts'){
    if(state.os==='lightshot')state.os='windows';
    area.innerHTML=`${osHTML(false)}<div id="shortcut-cards"></div><div class="copy-practice"><label for="paste-input" class="practice-intro">Выдели слово, скопируй его и вставь в поле:</label><div class="typing-line"><span class="copy-word">вершина</span><input class="text-input" id="paste-input" placeholder="Вставь слово сюда" autocomplete="off" aria-describedby="paste-feedback"></div><p id="paste-feedback" class="feedback" role="status"></p></div>${tasks}`;
    renderShortcuts();
  }else if(stage.kind==='finish')renderFinish();
}
function osHTML(lightshot){
  return `<div class="os-selector" aria-label="Выбор компьютера"><button type="button" class="os-button" data-os="windows" aria-pressed="${state.os==='windows'}">Windows</button><button type="button" class="os-button" data-os="mac" aria-pressed="${state.os==='mac'}">Mac</button>${lightshot?`<button type="button" class="os-button" data-os="lightshot" aria-pressed="${state.os==='lightshot'}">Lightshot</button>`:''}</div>`;
}
function renderScreenshot(){
  const steps={
    windows:['Одновременно нажми <kbd>Win</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd>. Выбери прямоугольный снимок.','Зажми кнопку мыши и обведи открытку с горой внизу. Отпусти кнопку.','Нажми на уведомление о снимке. Если его не видно, открой приложение «Ножницы» через меню «Пуск».','В окне со снимком нажми «Сохранить» или <kbd>Ctrl</kbd> + <kbd>S</kbd>. Назови файл <strong>МояПобеда</strong> и выбери папку.'],
    mac:['Одновременно нажми <kbd>Shift</kbd> + <kbd>⌘ Command</kbd> + <kbd>4</kbd>. Курсор станет перекрестием.','Зажми кнопку мыши или трекпада и обведи открытку с горой внизу. Отпусти кнопку.','Снимок обычно появится на рабочем столе. Если место сохранения меняли, проверь выбранную папку.','Найди снимок, выдели файл и нажми <kbd>Return</kbd>. Назови его <strong>МояПобеда</strong>, сохранив расширение файла.'],
    lightshot:['Если Lightshot уже установлен, нажми его значок в браузере.','Выдели открытку с горой внизу, удерживая кнопку мыши.','Нажми значок сохранения, назови файл <strong>МояПобеда</strong> и выбери папку.','Если расширения ещё нет, выбери вкладку Windows или Mac — там есть способ без установки.']
  };
  $('#screenshot-instructions').innerHTML=`<ol class="screenshot-steps">${steps[state.os].map(t=>`<li>${t}</li>`).join('')}</ol>${state.os==='lightshot'?'<p class="external-note"><a href="https://chromewebstore.google.com/detail/lightshot-screenshot-tool/mbniclmhobmnbdlbpiphghaielnnpgdp?hl=ru" target="_blank" rel="noopener noreferrer">Открыть Lightshot в магазине Chrome ↗</a> · С установкой можно обратиться к взрослому.</p>':''}`;
}
function renderShortcuts(){
  const key=state.os==='mac'?'⌘ Cmd':'Ctrl';
  $('#shortcut-cards').innerHTML=`<div class="shortcut-grid">${[['C','Копировать'],['V','Вставить'],['Z','Отменить']].map(([k,label])=>`<div class="shortcut-card"><div class="keys"><kbd>${key}</kbd> + <kbd>${k}</kbd></div><span>${label}</span></div>`).join('')}</div><p class="external-note">В заданиях LearningApps из методички используются обозначения Windows (Ctrl).</p>`;
}
function updateWord(){
  const remaining=['гора','лагерь','вершина'].filter(w=>!state.words.includes(w));
  $('#word-target').textContent=remaining[0]||'Готово!';
  $('#typing-input').disabled=!remaining.length;$('#check-word').disabled=!remaining.length;
  if(!remaining.length)$('#typing-feedback').textContent='Все три слова получились! Можно двигаться дальше.';
}
function quizHTML(){return `<div class="quiz-list">${QUIZ.map((q,i)=>{
  const choice=state.quiz[i],answered=Number.isInteger(choice),correct=choice===q.correct;
  return `<div class="quiz-card"><fieldset><legend>${i+1}. ${q.question}</legend><div class="quiz-options">${q.options.map((o,j)=>`<button type="button" class="quiz-option${choice===j&&!correct?' wrong':''}" data-quiz="${i}" data-answer="${j}" aria-pressed="${choice===j}">${o}</button>`).join('')}</div><p class="quiz-message${answered&&!correct?' wrong':''}" role="status">${answered?(correct?q.yes:q.no):'Выбери один ответ.'}</p></fieldset></div>`;
}).join('')}</div>`;}
function moodHTML(){return `<section class="mood-section" aria-labelledby="mood-title"><h2 class="mood-title" id="mood-title">Как прошла твоя экспедиция?</h2><div class="mood-options">${[['happy','Всё получилось!'],['practice','Хочу ещё потренироваться'],['help','Мне нужна помощь']].map(([id,label])=>`<button type="button" class="mood-button" data-mood="${id}" aria-pressed="${state.mood===id}">${label}</button>`).join('')}</div><p id="mood-feedback" class="feedback" role="status">${moodMessage()}</p></section>`;}
function moodMessage(){return {happy:'Здорово! Вспомни своё любимое открытие.',practice:'Отличная идея. На карте можно вернуться к любой остановке.',help:'Попроси взрослого или Екатерину пройти трудный шаг вместе с тобой.'}[state.mood]||'';}
function renderFinish(){
  if(state.finished){
    $('#activity').innerHTML=`<div class="badge-card">${drawing('mountains')}<h3>Маршрут IT-Эверест пройден!</h3><p>Я познакомился с компьютером, потренировался и сделал новые открытия.</p><div class="handwritten">Моя экспедиция с Екатериной</div><p>За любопытство, внимательность и старание.</p><button type="button" class="secondary-button" id="download-badge">Сохранить карточку ↓</button></div>${moodHTML()}`;
  }else{
    $('#activity').innerHTML=quizHTML()+moodHTML()+'<p class="finish-status" id="finish-status"></p>';
  }
  updateFinishAction();
}
function updateFinishAction(){
  const b=$('#next-stage');
  if(state.finished){b.disabled=false;b.innerHTML='Вернуться к началу <span aria-hidden="true">↺</span>';return;}
  const pending=[0,1,2,3,4,5,6].filter(x=>!state.done.includes(x));
  if(pending.length){b.disabled=false;b.innerHTML='Продолжить маршрут <span aria-hidden="true">→</span>';if($('#finish-status'))$('#finish-status').textContent=`До карточки экспедиции осталось отметить остановки: ${pending.map(i=>LESSON[i].nav).join(', ')}.`;}
  else if(!canFinish(state)){b.disabled=true;b.textContent='Ответь на три вопроса';if($('#finish-status'))$('#finish-status').textContent='Попробуй ответить на все вопросы. К темам можно вернуться по карте.';}
  else{b.disabled=false;b.innerHTML='Завершить экспедицию <span aria-hidden="true">→</span>';if($('#finish-status'))$('#finish-status').textContent='Все остановки пройдены, ответы верные. Карточка экспедиции готова!';}
}
function render(){
  const stage=LESSON[state.stage];
  document.title=`${stage.nav} · IT-Эверест с Екатериной`;
  history.replaceState(null,'',`#${stage.id}`);
  $('#stage-meta').textContent=`ОСТАНОВКА ${String(state.stage+1).padStart(2,'0')} / 08`;
  $('#margin-note').textContent=stage.note;$('#stage-eyebrow').textContent=stage.eyebrow;$('#stage-title').textContent=stage.title;$('#stage-subtitle').textContent=stage.subtitle;
  $('#cover-art').hidden=state.stage!==0;
  $('#cover-art').innerHTML=state.stage===0?drawing('mountains')+'<span class="art-caption">Вперёд, к открытиям!</span>':'';
  $('#previous-stage').disabled=state.stage===0;
  $('#next-stage').disabled=false;
  $('#next-stage').innerHTML=state.stage===0?'Начать экспедицию <span aria-hidden="true">→</span>':'Я справился <span aria-hidden="true">→</span>';
  $('#page-number').textContent=`— ${String(state.stage+1).padStart(2,'0')} —`;
  $('#hint').hidden=true;$('#toggle-hint').setAttribute('aria-expanded','false');$('#toggle-hint').setAttribute('aria-controls','hint');$('#toggle-hint').textContent='Нужна подсказка?';
  updateProgress();renderReplica();renderActivity();save();
}
$('#next-replica').addEventListener('click',()=>{state.replica=(state.replica+1)%LESSON[state.stage].lines.length;renderReplica();save();});
route.addEventListener('click',e=>{const b=e.target.closest('[data-stage]');if(b)goTo(Number(b.dataset.stage));});
$('#previous-stage').addEventListener('click',()=>goTo(state.stage-1));
$('#next-stage').addEventListener('click',()=>{
  if(state.stage===7){
    if(state.finished){goTo(0);return;}
    const pending=[0,1,2,3,4,5,6].find(i=>!state.done.includes(i));
    if(pending!==undefined){goTo(pending);return;}
    if(!canFinish(state))return;
    state.done=[...new Set([...state.done,7])];state.finished=true;save();render();$('#announcer').textContent='Экспедиция завершена. Карточка готова к сохранению.';
  }else{state=completeStage(state);save();render();$('#lesson').scrollIntoView({behavior:'smooth',block:'start'});$('#lesson').focus({preventScroll:true});}
});
$('#toggle-hint').addEventListener('click',()=>{const h=$('#hint');h.hidden=!h.hidden;h.textContent=LESSON[state.stage].hint;$('#toggle-hint').setAttribute('aria-expanded',String(!h.hidden));$('#toggle-hint').textContent=h.hidden?'Нужна подсказка?':'Скрыть подсказку';});
$('#activity').addEventListener('click',e=>{
  const task=e.target.closest('[data-task]');if(task){if(!state.opened.includes(task.dataset.task))state.opened.push(task.dataset.task);task.classList.add('opened');const tag=task.querySelector('.task-tag');if(tag)tag.textContent='Открывалось';save();return;}
  const device=e.target.closest('[data-device]');if(device){document.querySelectorAll('[data-device]').forEach(b=>b.setAttribute('aria-pressed',String(b===device)));$('.device-explanation').textContent={keyboard:'Клавиатура — устройство ввода. С её помощью мы вводим буквы, числа и команды.',monitor:'Монитор — устройство вывода. Он показывает тексты, картинки и результат нашей работы.',mouse:'Мышь — устройство ввода. Она помогает выбирать, открывать и перемещать объекты на экране.'}[device.dataset.device];return;}
  const part=e.target.closest('[data-component]');if(part){document.querySelectorAll('[data-component]').forEach(b=>b.setAttribute('aria-pressed',String(b===part)));$('.component-description').textContent={cpu:'Процессор выполняет команды и обрабатывает данные. Он помогает компьютеру решать задачи.',ram:'Оперативная память хранит данные, нужные для текущей работы. После выключения её содержимое не сохраняется.',drive:'Накопитель хранит программы, фотографии и другие файлы, в том числе после выключения компьютера.'}[part.dataset.component];return;}
  const os=e.target.closest('[data-os]');if(os){state.os=os.dataset.os;document.querySelectorAll('[data-os]').forEach(b=>b.setAttribute('aria-pressed',String(b===os)));if(state.stage===5)renderScreenshot();if(state.stage===6)renderShortcuts();save();return;}
  const answer=e.target.closest('[data-quiz]');if(answer){state.quiz[Number(answer.dataset.quiz)]=Number(answer.dataset.answer);save();const q=Number(answer.dataset.quiz),card=answer.closest('.quiz-card');const correct=state.quiz[q]===QUIZ[q].correct;card.querySelectorAll('.quiz-option').forEach(b=>{const selected=Number(b.dataset.answer)===state.quiz[q];b.setAttribute('aria-pressed',String(selected));b.classList.toggle('wrong',selected&&!correct);});const message=card.querySelector('.quiz-message');message.textContent=correct?QUIZ[q].yes:QUIZ[q].no;message.classList.toggle('wrong',!correct);updateFinishAction();return;}
  const mood=e.target.closest('[data-mood]');if(mood){state.mood=mood.dataset.mood;document.querySelectorAll('[data-mood]').forEach(b=>b.setAttribute('aria-pressed',String(b===mood)));$('#mood-feedback').textContent=moodMessage();save();return;}
  if(e.target.closest('#download-badge'))downloadBadge();
});
$('#activity').addEventListener('submit',e=>{
  if(e.target.id!=='typing-form')return;e.preventDefault();
  const target=['гора','лагерь','вершина'].find(w=>!state.words.includes(w));if(!target)return;
  const value=$('#typing-input').value.trim().toLocaleLowerCase('ru');
  const msg=$('#typing-feedback');
  if(value===target){state.words.push(target);msg.classList.remove('try-again');msg.textContent=`Получилось! Слово «${target}» готово. Напечатай следующее.`;$('#typing-input').value='';updateWord();save();if(!$('#typing-input').disabled)$('#typing-input').focus();}
  else{msg.classList.add('try-again');msg.textContent=value?'Пока не совпало. Проверь буквы и русский язык ввода. Можно попробовать ещё раз.':'Сначала напечатай слово из образца.';}
});
$('#activity').addEventListener('input',e=>{if(e.target.id==='paste-input')$('#paste-feedback').textContent=e.target.value.trim().toLocaleLowerCase('ru')==='вершина'?'Слово на месте! Ты потренировался переносить текст.':'';});
window.addEventListener('hashchange',()=>{const i=STAGE_IDS.indexOf(location.hash.slice(1));if(i>=0&&i!==state.stage)goTo(i);});
$('#open-guide').addEventListener('click',()=>$('#guide-dialog').showModal());
$('#open-notes').addEventListener('click',()=>$('#notes-dialog').showModal());
$('#restart').addEventListener('click',()=>$('#restart-dialog').showModal());
document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelectorAll('.dialog-close,.dialog-done').forEach(b=>b.addEventListener('click',()=>dialog.close()));dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});});
$('#confirm-restart').addEventListener('click',()=>{state=newState();save();$('#restart-dialog').close();render();$('#lesson').scrollIntoView({behavior:'smooth'});});
function downloadBadge(){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="720" viewBox="0 0 1000 720"><defs><pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#d6e2ea" stroke-width="1"/></pattern></defs><rect width="1000" height="720" rx="18" fill="#fcfbf4"/><rect width="1000" height="720" fill="url(#grid)"/><path d="M70 0V720" stroke="#c4867c"/><g transform="translate(185 75) scale(1)">${drawing('mountains').replace('<svg ','<svg width="640" height="245" ')}</g><g font-family="Arial,sans-serif" text-anchor="middle" fill="#315988"><text x="500" y="390" font-size="42" font-weight="bold">Маршрут IT-Эверест пройден!</text><text x="500" y="450" font-size="23">За любопытство, внимательность и старание.</text><text x="500" y="500" font-size="23">Моя экспедиция с Екатериной</text><text x="500" y="575" font-size="18" fill="#547c66">Большая вершина покоряется маленькими шагами.</text></g><style>.pen-blue{stroke:#3f6196}.pen-red{stroke:#ba6456}.pen-green{stroke:#5e8065}.pen-gold{stroke:#b5893f}</style></svg>`;
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='МояПобеда-IT-Эверест.svg';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);$('#announcer').textContent='Карточка экспедиции сохранена в загрузки браузера.';
}
render();
