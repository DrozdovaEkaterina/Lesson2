import { LESSON, QUIZ, DEVICE_EXPLANATIONS } from './lesson.js?v=6';
import { drawing } from './drawings.js?v=6';
import { STAGE_IDS, STORAGE_KEY, TYPING_TASKS, matchesTyping, newState, normalizeState, completeStage, canFinish } from './state.js?v=6';
import { inlineTeacher, flowArrow, marginDoodles, BREAKS } from './guidance.js?v=6';
import { CERTIFICATE_TEXT, ACHIEVEMENT_TEXT, certificateSVG } from './certificate.js?v=6';

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
  const lines=stage.kind==='keyboard'?stage.lines.slice(0,1):stage.lines;
  state.replica=Math.min(state.replica,lines.length-1);
  $('#replica').textContent=stage.lines[state.replica];
  $('#replica-dots').replaceChildren();
  lines.forEach((_,i)=>{
    const b=document.createElement('button');b.type='button';b.className='replica-dot';b.setAttribute('aria-label',`Реплика ${i+1} из ${stage.lines.length}`);b.setAttribute('aria-pressed',String(i===state.replica));
    b.addEventListener('click',()=>{state.replica=i;renderReplica();save();});$('#replica-dots').appendChild(b);
  });
  $('#next-replica').innerHTML=state.replica<stage.lines.length-1?'Дальше <span aria-hidden="true">→</span>':'Сначала <span aria-hidden="true">↺</span>';
  $('#next-replica').hidden=stage.kind==='keyboard';
  $('#replica-dots').hidden=stage.kind==='keyboard';
}
function afterGameSpeech(){return `<section class="teacher-row after-game-teacher" aria-label="Екатерина: после игры"><figure class="teacher-photo"><div class="photo-window"><img src="assets/ekaterina.jpg?v=2" alt="Екатерина, твой преподаватель" width="900" height="944"></div><figcaption>Екатерина</figcaption></figure><div class="speech"><div class="speech-label">ЕКАТЕРИНА · ПОСЛЕ ИГРЫ</div><p>${LESSON[2].lines[1]}</p></div></section>`;}
function typingHelp(){return `<div class="key-helper"><p>Нужна помощь с клавишей? Нажми:</p><div class="key-helper-buttons"><button type="button" data-key-help="backspace"><kbd>⌫ Backspace</kbd></button><button type="button" data-key-help="shift"><kbd>↑ Shift</kbd></button><button type="button" data-key-help="space"><kbd>Пробел</kbd></button><button type="button" data-key-help="signs"><kbd>! ?</kbd></button></div><p id="key-help-text" class="key-help-text" role="status"></p></div><details class="typing-help"><summary>Где Backspace и как печатать буквы, пробелы и знаки?</summary><ul><li><strong>Backspace:</strong> справа вверху, обычно над Enter. На клавише написано Backspace или нарисована стрелка <kbd>⌫</kbd>. На Mac она часто называется Delete. Нажми её, чтобы стереть символ слева от курсора.</li><li><strong>Большая буква:</strong> удерживай <kbd>Shift</kbd> и нажми нужную букву. Отпусти Shift, чтобы снова печатать маленькие буквы.</li><li><strong>Пробел:</strong> самая длинная клавиша в нижнем ряду. Между словами нажми её один раз.</li><li><strong>Знаки ! и ?:</strong> выбери английский язык через значок языка на панели компьютера. Для <strong>!</strong> держи <kbd>Shift</kbd> и нажми <kbd>1</kbd>. Для <strong>?</strong> держи <kbd>Shift</kbd> и нажми клавишу <kbd>/</kbd> — обычно она справа от клавиши с точкой, рядом с правым Shift. Затем верни русский язык для букв.</li></ul><p>Проверка различает большие и маленькие буквы. Повтори образец точно.</p></details>`;}
function tasksHTML(tasks){
  const make=t=>`<a class="task-link${state.opened.includes(t.id)?' opened':''}" data-task="${t.id}" href="${t.url}" target="_blank" rel="noopener noreferrer" aria-label="${t.title}. Откроется в новой вкладке"><span><strong>${t.title}</strong><small>${t.desc}</small></span><span class="task-right"><span class="task-tag">${state.opened.includes(t.id)?'Открывалось':(t.tag||'Ещё практика')}</span><span class="external-arrow" aria-hidden="true">↗</span></span></a>`;
  const main=tasks.filter(t=>!t.extra),extra=tasks.filter(t=>t.extra);
  return `<div class="task-list">${main.map(make).join('')}</div><p class="external-note">Откроется новая вкладка. После задания возвращайся в эту тетрадь.</p>${extra.length?`<details class="extra-tasks"><summary>Хочешь ещё? Дополнительные задания (${extra.length})</summary><div class="task-list">${extra.map(make).join('')}</div></details>`:''}`;
}
function alternateTeacherSides(){
  const comments=[...document.querySelectorAll('.lesson-sheet .teacher-row,.lesson-sheet .inline-teacher')].filter(el=>!el.closest('[hidden]'));
  comments.forEach((comment,i)=>comment.classList.toggle('teacher-right',i%2===1));
}
function renderActivity(){
  const stage=LESSON[state.stage],area=$('#activity');
  const tasks=stage.tasks?tasksHTML(stage.tasks):'';
  if(stage.kind==='welcome'){
    area.innerHTML=flowArrow(true);
  }else if(stage.kind==='devices'){
    area.innerHTML=`<div class="device-grid" aria-label="Устройства компьютера"><button type="button" class="device-button" data-device="keyboard" aria-pressed="false">${drawing('keyboard')}<strong>Клавиатура</strong><span>Нажми и узнай</span></button><button type="button" class="device-button" data-device="monitor" aria-pressed="false">${drawing('monitor')}<strong>Монитор</strong><span>Нажми и узнай</span></button><button type="button" class="device-button" data-device="mouse" aria-pressed="false">${drawing('mouse')}<strong>Мышь</strong><span>Нажми и узнай</span></button></div><p class="device-explanation" role="status">У каждого устройства есть своя важная работа.</p><p class="explore-progress" id="device-progress">Посмотрено: ${state.devicesSeen.length} из 3. Нажми на каждый рисунок.</p>${inlineTeacher('Нажми ниже кнопку с надписью «Узнай устройства», чтобы лучше узнать устройства компьютера. После игры вернись на вкладку с тетрадью.')}${flowArrow()}${tasks}`;
  }else if(stage.kind==='keyboard'){
    area.innerHTML=`${tasks}${flowArrow()}<button type="button" class="secondary-button after-game-button" id="keyboard-continue" aria-controls="keyboard-practice" aria-expanded="${state.keyboardGameDone}">${state.keyboardGameDone?'Вернуться к практике':'Я прошёл игру! Что дальше?'}</button><section id="keyboard-practice" ${state.keyboardGameDone?'':'hidden'}>${afterGameSpeech()}${flowArrow()}<form class="practice" id="typing-form"><h2 class="section-caption">Пять шагов уверенной печати</h2><p class="practice-intro">Большие и маленькие буквы, пробелы и знаки. Печатай спокойно, как в образце.</p><p class="typing-progress" id="typing-progress"></p><label for="typing-input">Повтори образец точно:</label><p id="space-note" class="practice-space-note" hidden>␣ означает пробел. Нажми длинную клавишу внизу один раз.</p><div class="typing-line"><span class="word-target" id="word-target"></span><input class="text-input" id="typing-input" autocomplete="off" spellcheck="false" autocapitalize="none" aria-describedby="typing-feedback"><button type="submit" class="secondary-button" id="check-word">Проверить</button></div><p class="feedback" id="typing-feedback" role="status"></p></form>${typingHelp()}</section>`;
    updateWord();
  }else if(stage.kind==='components'){
    area.innerHTML=`<div class="component-scene"><div class="scene-art">${drawing('camp')}</div><div class="component-controls"><div class="component-options" aria-label="Детали компьютера"><button class="component-button" type="button" data-component="cpu" aria-pressed="false">${drawing('cpu')}<span>Процессор</span></button><button class="component-button" type="button" data-component="ram" aria-pressed="false">${drawing('ram')}<span>Оперативная память</span></button><button class="component-button" type="button" data-component="drive" aria-pressed="false">${drawing('drive')}<span>Накопитель</span></button></div><p class="component-description" role="status">Выбери название: деталь подсветится на схеме, а здесь появится её назначение.</p></div></div><p class="explore-progress" id="part-progress">Найдено: ${state.partsSeen.length} из 3</p>${inlineTeacher('Нажми ниже кнопку с надписью «Значки файлов и программ», чтобы узнать, какие значки встречаются на экране компьютера.')}${flowArrow()}${tasks}`;
  }else if(stage.kind==='safety'){
    area.innerHTML=`<div class="rules-grid"><div class="rule">${drawing('shield')}<span>Бережём себя<br>и компьютер</span></div><div class="rule">${drawing('monitor')}<span>Сидим удобно<br>и внимательно</span></div><div class="rule">${drawing('tent')}<span>Делаем привалы<br>и отдыхаем</span></div></div><section class="break-exercises" aria-labelledby="break-title"><h2 class="section-caption" id="break-title">Привал для глаз и тела</h2><p class="practice-intro">Сделай упражнение и нажми «Готово».</p><div class="break-grid">${BREAKS.map((item,i)=>`<article class="break-card${state.breakDone.includes(item.id)?' is-done':''}"><div class="break-picture">${drawing(item.icon)}</div><div><h3>${i+1}. ${item.title}</h3><p>${item.text}</p><button type="button" class="secondary-button break-done" data-break="${item.id}" aria-pressed="${state.breakDone.includes(item.id)}">${state.breakDone.includes(item.id)?'✓ Сделано':'Готово'}</button></div></article>`).join('')}</div><p class="external-note">Двигайся плавно и без боли. Если движение неприятно, остановись.</p></section>${inlineTeacher('Готов двигаться дальше? Нажми ниже кнопку с надписью «Можно или нельзя?», чтобы лучше узнать правила работы за компьютером. В игре выбери безопасные действия за компьютером.')}${flowArrow()}${tasks}`;
  }else if(stage.kind==='screenshot'){
    area.innerHTML=`<h2 class="section-caption">Какой у тебя компьютер?</h2><div class="os-notes"><article class="os-note os-note-windows"><h3>Windows</h3><div class="os-note-art">${drawing('windows-note')}</div><p>Посмотри в самый низ экрана: там есть полоска — панель задач. Найди на ней значок окошка из четырёх частей. Это кнопка <strong>«Пуск»</strong>: она открывает меню программ. Значок может быть слева или ближе к середине. Если видишь его, выбери <strong>«Windows»</strong> ниже.</p></article><article class="os-note os-note-mac"><h3>Mac</h3><div class="os-note-art">${drawing('mac-note')}</div><p>Посмотри в левый верхний угол экрана: там находится меню с яблоком <strong>Apple</strong>. На клавиатуре Mac есть клавиша <kbd>⌘ Command</kbd>. Если видишь эти подсказки, выбери <strong>«Mac»</strong> ниже.</p></article></div><p class="os-choice-note">Если пока не можешь определить, выбери «Если не знаешь».</p>${osHTML(true)}<div id="screenshot-instructions"></div>${inlineTeacher('Вот открытка для снимка. Следуй шагам сверху и обведи её мышью, а потом сохрани получившийся скриншот на рабочем столе.')}${flowArrow()}<div class="summit-postcard" id="summit-postcard"><h3>Моя победа — IT-Эверест!</h3>${drawing('summit')}<p class="postcard-caption">Большая вершина покоряется маленькими шагами.</p><p class="postcard-small">Мой снимок на вершине</p></div>`;
    renderScreenshot();
  }else if(stage.kind==='shortcuts'){
    if(state.os==='unknown')state.os='windows';
    area.innerHTML=`${osHTML(false)}<div id="shortcut-cards"></div>${inlineTeacher('Дважды быстро щёлкни по слову «вершина», чтобы выделить его. Затем скопируй слово с помощью клавиш и вставь в поле ниже.')}<div class="copy-practice"><label for="paste-input" class="practice-intro">Дважды быстро щёлкни по слову, затем скопируй его и вставь в поле:</label><div class="typing-line copy-transfer"><span class="copy-word">вершина</span><span class="copy-direction" aria-hidden="true">${drawing('flow-arrow')}</span><input class="text-input" id="paste-input" placeholder="Вставь слово сюда" autocomplete="off" aria-describedby="paste-feedback"></div><p id="paste-feedback" class="feedback" role="status"></p></div>${inlineTeacher('Теперь нажми ниже кнопку с надписью «Знакомимся с сочетаниями», чтобы лучше запомнить горячие клавиши.')}${flowArrow()}${tasks}`;
    renderShortcuts();
  }else if(stage.kind==='finish')renderFinish();
  if(stage.kind==='devices')document.querySelectorAll('[data-device]').forEach(b=>{if(state.devicesSeen.includes(b.dataset.device)){b.classList.add('is-seen');b.querySelector('span').textContent='✓ Посмотрел';}});
  alternateTeacherSides();
}
function osHTML(includeUnknown){
  return `<div class="os-selector" aria-label="Выбор компьютера"><button type="button" class="os-button" data-os="windows" aria-pressed="${state.os==='windows'}">Windows</button><button type="button" class="os-button" data-os="mac" aria-pressed="${state.os==='mac'}">Mac</button>${includeUnknown?`<button type="button" class="os-button" data-os="unknown" aria-pressed="${state.os==='unknown'}">Если не знаешь</button>`:''}</div>`;
}
function renderScreenshot(){
  const steps={
    windows:['Одновременно нажми <kbd>Win</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd>. Выбери прямоугольный снимок.','Зажми кнопку мыши и обведи открытку с горой внизу. Отпусти кнопку.','Нажми на уведомление о снимке. Если его не видно, открой приложение «Ножницы» через меню «Пуск».','В окне со снимком нажми «Сохранить» или <kbd>Ctrl</kbd> + <kbd>S</kbd>. В окне сохранения выбери <strong>«Рабочий стол»</strong>, назови файл <strong>МояПобеда</strong> и нажми «Сохранить».'],
    mac:['Одновременно нажми <kbd>Shift</kbd> + <kbd>⌘ Command</kbd> + <kbd>4</kbd>. Курсор станет перекрестием.','Зажми кнопку мыши или трекпада и обведи открытку с горой внизу. Отпусти кнопку.','Найди снимок на рабочем столе. Если он сохранился в другой папке, перенеси его на рабочий стол.','Найди снимок, выдели файл и нажми <kbd>Return</kbd>. Назови его <strong>МояПобеда</strong>, сохранив расширение файла.'],
    unknown:['Для этого способа открой урок в браузере <strong>Google Chrome</strong>. Расширение Lightshot работает в нём и на Windows, и на Mac, поэтому выбирать систему не нужно.','Нажми <a href="https://chromewebstore.google.com/detail/lightshot-screenshot-tool/mbniclmhobmnbdlbpiphghaielnnpgdp?hl=ru" target="_blank" rel="noopener noreferrer">«Открыть Lightshot в магазине Chrome» ↗</a>. Проверь название <strong>Lightshot (screenshot tool)</strong>.','На странице расширения нажми <strong>«Установить»</strong> или <strong>«Добавить в Chrome»</strong>, затем подтверди <strong>«Установить расширение»</strong>. Chrome сам скачает и установит его. Если установка на этом компьютере запрещена, обратись к его владельцу.','Вернись в тетрадь. Нажми значок пазла справа от адресной строки и выбери <strong>Lightshot</strong>. Можно закрепить значок пера кнопкой рядом с названием.','Нажми значок Lightshot и, удерживая кнопку мыши, выдели открытку с горой внизу. Отпусти кнопку.','На панели Lightshot нажми значок дискеты <strong>«Сохранить»</strong>. Выбери <strong>«Рабочий стол»</strong>, назови файл <strong>МояПобеда</strong> и нажми «Сохранить». Для этого задания нужна кнопка сохранения файла.']
  };
  const items=steps[state.os];
  state.screenshotStep=Math.min(state.screenshotStep,items.length-1);
  const last=state.screenshotStep===items.length-1;
  $('#screenshot-instructions').innerHTML=`${state.os==='unknown'?'<h3 class="lightshot-title">Снимок с помощью Lightshot</h3>':''}<section class="shot-wizard" aria-label="Инструкция по одному шагу"><div class="shot-step-count">Шаг ${state.screenshotStep+1} из ${items.length}</div><div class="shot-current" aria-live="polite">${items[state.screenshotStep]}</div><div class="shot-controls"><button type="button" id="shot-prev" class="secondary-button" ${state.screenshotStep===0?'disabled':''}>← Назад</button><button type="button" id="shot-next" class="primary-button" ${last&&state.screenshotDone?'disabled':''}>${last&&state.screenshotDone?'✓ Снимок готов!':'Сделал'}</button></div></section><details class="all-shot-steps"><summary>Показать все шаги</summary><ol class="screenshot-steps">${items.map(t=>`<li>${t}</li>`).join('')}</ol></details>${state.os==='unknown'?'<p class="external-note">Версии для других браузеров и отдельное приложение: <a href="https://app.prntscr.com/ru/" target="_blank" rel="noopener noreferrer">официальный сайт Lightshot ↗</a>.</p>':''}`;
}
function renderShortcuts(){
  const key=state.os==='mac'?'⌘ Cmd':'Ctrl';
  $('#shortcut-cards').innerHTML=`<div class="shortcut-grid">${[['C','Копировать'],['V','Вставить'],['Z','Отменить']].map(([k,label])=>`<div class="shortcut-card"><div class="keys"><kbd>${key}</kbd> + <kbd>${k}</kbd></div><span>${label}</span></div>`).join('')}</div><p class="external-note">В заданиях LearningApps из методички используются обозначения Windows (Ctrl).</p>`;
}
function updateWord(){
  const remaining=TYPING_TASKS.filter(w=>!state.words.includes(w));
  const target=remaining[0]||'Готово!';
  $('#word-target').innerHTML=target.split(' ').map(word=>`<span class="sample-word">${word}</span>`).join('<span class="space-marker" aria-hidden="true">␣</span>');
  $('#word-target').setAttribute('aria-label',target);
  $('#space-note').hidden=!target.includes(' ');
  $('#typing-input').disabled=!remaining.length;$('#check-word').disabled=!remaining.length;
  $('#typing-progress').innerHTML=`<span>${remaining.length?`Задание ${TYPING_TASKS.length-remaining.length+1} из ${TYPING_TASKS.length}`:`Выполнено ${TYPING_TASKS.length} из ${TYPING_TASKS.length}`}</span><span class="typing-stamps" aria-hidden="true">${TYPING_TASKS.map((_,i)=>`<span class="typing-stamp${i<state.words.length?' is-done':''}">${i<state.words.length?'✓':i+1}</span>`).join('')}</span>`;
  if(!remaining.length)$('#typing-feedback').textContent='Все пять заданий получились! Ты справился с буквами, пробелами и знаками.';
}
function quizHTML(){return `<div class="quiz-list">${QUIZ.map((q,i)=>{
  const choice=state.quiz[i],answered=Number.isInteger(choice),correct=choice===q.correct;
  return `<div class="quiz-card"><fieldset><legend>${i+1}. ${q.question}</legend><div class="quiz-options">${q.options.map((o,j)=>`<button type="button" class="quiz-option${choice===j&&!correct?' wrong':''}" data-quiz="${i}" data-answer="${j}" aria-pressed="${choice===j}">${o}</button>`).join('')}</div><p class="quiz-message${answered&&!correct?' wrong':''}" role="status">${answered?(correct?q.yes:q.no):'Выбери один ответ.'}</p></fieldset></div>`;
}).join('')}</div>`;}
function moodHTML(){return `<section class="mood-section" aria-labelledby="mood-title"><h2 class="mood-title" id="mood-title">Как прошла твоя экспедиция?</h2><div class="mood-options">${[['happy','Всё получилось!'],['practice','Хочу ещё потренироваться'],['help','Мне нужна помощь']].map(([id,label])=>`<button type="button" class="mood-button" data-mood="${id}" aria-pressed="${state.mood===id}">${label}</button>`).join('')}</div><p id="mood-feedback" class="feedback" role="status">${moodMessage()}</p></section>`;}
function moodMessage(){return {happy:'Здорово! Вспомни своё любимое открытие.',practice:'Отличная идея. На карте можно вернуться к любой остановке.',help:'Попроси взрослого или Екатерину пройти трудный шаг вместе с тобой.'}[state.mood]||'';}
function renderFinish(){
  if(state.finished){
    $('#activity').innerHTML=`<div class="badge-card">${drawing('mountains')}<h3>Маршрут IT-Эверест пройден!</h3><p class="certificate-text">${CERTIFICATE_TEXT}</p><div class="achievement-medal">${drawing('medal')}<span class="handwritten">Юный исследователь</span></div><details class="achievement-details"><summary>${ACHIEVEMENT_TEXT}</summary><p>«Юный исследователь» — ты прошёл маршрут, потренировался и ответил на вопросы о компьютере.</p></details><button type="button" class="secondary-button" id="download-badge">Сохранить грамоту ↓</button></div>`;
  }else{
    $('#activity').innerHTML=quizHTML()+moodHTML()+'<p class="finish-status" id="finish-status"></p>';
  }
  updateFinishAction();
}
function updateFinishAction(){
  const b=$('#next-stage');
  if(state.finished){b.disabled=false;b.innerHTML='Вернуться к началу <span aria-hidden="true">↺</span>';return;}
  const pending=[0,1,2,3,4,5,6].filter(x=>!state.done.includes(x));
  if(pending.length){b.disabled=false;b.innerHTML='Продолжить маршрут <span aria-hidden="true">→</span>';if($('#finish-status'))$('#finish-status').textContent=`До грамоты осталось отметить остановки: ${pending.map(i=>LESSON[i].nav).join(', ')}.`;}
  else if(!canFinish(state)){b.disabled=true;b.textContent='Ответь на три вопроса';if($('#finish-status'))$('#finish-status').textContent='Попробуй ответить на все вопросы. К темам можно вернуться по карте.';}
  else{b.disabled=false;b.innerHTML='Завершить экспедицию <span aria-hidden="true">→</span>';if($('#finish-status'))$('#finish-status').textContent='Все остановки пройдены, ответы верные. Грамота готова!';}
}
function render(){
  const stage=LESSON[state.stage];
  $('#margin-decoration').innerHTML=marginDoodles();
  document.title=`${stage.nav} · IT-Эверест с Екатериной`;
  history.replaceState(null,'',`#${stage.id}`);
  $('#stage-meta').textContent=`ОСТАНОВКА ${String(state.stage+1).padStart(2,'0')} / 08`;
  $('#margin-note').textContent=stage.note;$('#stage-eyebrow').textContent=stage.eyebrow;$('#stage-title').textContent=stage.title;$('#stage-subtitle').textContent=stage.subtitle;
  $('#cover-art').hidden=state.stage!==0;
  $('#cover-art').innerHTML=state.stage===0?drawing('mountains')+'<span class="art-caption">Вперёд, к открытиям!</span>':'';
  $('.lesson-sheet > .teacher-row').hidden=state.stage===7&&state.finished;
  $('#previous-stage').disabled=state.stage===0;
  $('#next-stage').disabled=false;
  $('#next-stage').innerHTML=state.stage===0?'Начать экспедицию <span aria-hidden="true">→</span>':'Всё сделано! <span aria-hidden="true">→</span>';
  $('#page-number').textContent=`— ${String(state.stage+1).padStart(2,'0')} —`;
  $('#hint').hidden=true;$('#toggle-hint').setAttribute('aria-expanded','false');$('#toggle-hint').setAttribute('aria-controls','hint');$('#toggle-hint').textContent='Нужна подсказка?';
  $('#toggle-hint').hidden=state.stage===7&&state.finished;
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
    state.done=[...new Set([...state.done,7])];state.finished=true;save();render();$('#announcer').textContent='Экспедиция завершена. Грамота готова к сохранению.';
  }else{state=completeStage(state);save();render();$('#lesson').scrollIntoView({behavior:'smooth',block:'start'});$('#lesson').focus({preventScroll:true});}
});
$('#toggle-hint').addEventListener('click',()=>{const h=$('#hint');h.hidden=!h.hidden;h.textContent=LESSON[state.stage].hint;$('#toggle-hint').setAttribute('aria-expanded',String(!h.hidden));$('#toggle-hint').textContent=h.hidden?'Нужна подсказка?':'Скрыть подсказку';});
$('#activity').addEventListener('click',e=>{
  if(e.target.closest('#keyboard-continue')){state.keyboardGameDone=true;save();renderActivity();$('#keyboard-practice').scrollIntoView({behavior:'smooth',block:'start'});return;}
  const keyHelp=e.target.closest('[data-key-help]');if(keyHelp){document.querySelectorAll('[data-key-help]').forEach(b=>b.setAttribute('aria-pressed',String(b===keyHelp)));$('#key-help-text').textContent={backspace:'Найди Backspace справа вверху, над Enter. Она стирает символ слева от курсора. На Mac: Delete или ⌫.',shift:'Shift находится по краям ряда с буквами, обычно со стрелкой ↑. Держи Shift и нажми букву — получится большая.',space:'Пробел — самая длинная клавиша внизу клавиатуры. Нажми её между словами один раз.',signs:'Для ! выбери английскую раскладку и нажми Shift + 1. Для ? на английской раскладке: Shift + / (рядом с правым Shift). Для букв верни русский.'}[keyHelp.dataset.keyHelp];return;}
  const exercise=e.target.closest('[data-break]');if(exercise){const id=exercise.dataset.break;state.breakDone=state.breakDone.includes(id)?state.breakDone.filter(x=>x!==id):[...state.breakDone,id];const done=state.breakDone.includes(id);exercise.setAttribute('aria-pressed',String(done));exercise.textContent=done?'✓ Сделано':'Готово';exercise.closest('.break-card').classList.toggle('is-done',done);save();return;}
  if(e.target.closest('#shot-next')){const total=state.os==='unknown'?6:4;if(state.screenshotStep<total-1)state.screenshotStep++;else state.screenshotDone=true;save();renderScreenshot();return;}
  if(e.target.closest('#shot-prev')){state.screenshotStep=Math.max(0,state.screenshotStep-1);save();renderScreenshot();return;}
  const task=e.target.closest('[data-task]');if(task){if(!state.opened.includes(task.dataset.task))state.opened.push(task.dataset.task);task.classList.add('opened');const tag=task.querySelector('.task-tag');if(tag)tag.textContent='Открывалось';save();return;}
  const device=e.target.closest('[data-device]');if(device){document.querySelectorAll('[data-device]').forEach(b=>b.setAttribute('aria-pressed',String(b===device)));if(!state.devicesSeen.includes(device.dataset.device))state.devicesSeen.push(device.dataset.device);device.classList.add('is-seen');device.querySelector('span').textContent='✓ Посмотрел';$('#device-progress').textContent=`Посмотрено: ${state.devicesSeen.length} из 3`;save();$('.device-explanation').textContent=DEVICE_EXPLANATIONS[device.dataset.device];return;}
  const part=e.target.closest('[data-component]');if(part){document.querySelectorAll('[data-component]').forEach(b=>b.setAttribute('aria-pressed',String(b===part)));document.querySelectorAll('[data-diagram-part]').forEach(g=>g.classList.toggle('is-selected',g.dataset.diagramPart===part.dataset.component));if(!state.partsSeen.includes(part.dataset.component))state.partsSeen.push(part.dataset.component);$('#part-progress').textContent=`Найдено: ${state.partsSeen.length} из 3`;save();$('.component-description').textContent={cpu:'Процессор (CPU) выполняет команды и обрабатывает данные. Он помогает компьютеру решать задачи.',ram:'Оперативная память (RAM) хранит данные, нужные для текущей работы. После выключения её содержимое не сохраняется.',drive:'Накопитель (здесь SSD) хранит программы, фотографии и другие файлы, в том числе после выключения компьютера.'}[part.dataset.component];return;}
  const os=e.target.closest('[data-os]');if(os){state.os=os.dataset.os;state.screenshotStep=0;state.screenshotDone=false;document.querySelectorAll('[data-os]').forEach(b=>b.setAttribute('aria-pressed',String(b===os)));if(state.stage===5)renderScreenshot();if(state.stage===6)renderShortcuts();save();return;}
  const answer=e.target.closest('[data-quiz]');if(answer){state.quiz[Number(answer.dataset.quiz)]=Number(answer.dataset.answer);save();const q=Number(answer.dataset.quiz),card=answer.closest('.quiz-card');const correct=state.quiz[q]===QUIZ[q].correct;card.querySelectorAll('.quiz-option').forEach(b=>{const selected=Number(b.dataset.answer)===state.quiz[q];b.setAttribute('aria-pressed',String(selected));b.classList.toggle('wrong',selected&&!correct);});const message=card.querySelector('.quiz-message');message.textContent=correct?QUIZ[q].yes:QUIZ[q].no;message.classList.toggle('wrong',!correct);updateFinishAction();return;}
  const mood=e.target.closest('[data-mood]');if(mood){state.mood=mood.dataset.mood;document.querySelectorAll('[data-mood]').forEach(b=>b.setAttribute('aria-pressed',String(b===mood)));$('#mood-feedback').textContent=moodMessage();save();return;}
  if(e.target.closest('#download-badge'))downloadBadge();
});
$('#activity').addEventListener('submit',e=>{
  if(e.target.id!=='typing-form')return;e.preventDefault();
  const target=TYPING_TASKS.find(w=>!state.words.includes(w));if(!target)return;
  const value=$('#typing-input').value;
  const msg=$('#typing-feedback');
  if(matchesTyping(value,target)){state.words.push(target);msg.classList.remove('try-again');msg.textContent=`Получилось! «${target}» готово. Повтори следующий образец.`;$('#typing-input').value='';updateWord();save();if(!$('#typing-input').disabled)$('#typing-input').focus();}
  else{msg.classList.add('try-again');msg.textContent=value?'Пока не совпало. Проверь большие и маленькие буквы, пробелы и знак в конце. Можно попробовать ещё раз.':'Сначала напечатай образец.';}
});
$('#activity').addEventListener('dblclick',e=>{if(e.target.closest('.copy-word'))$('#paste-feedback').textContent='Теперь нажми сочетание «Копировать», затем нажми на поле ниже и используй «Вставить».';});
$('#activity').addEventListener('input',e=>{if(e.target.id==='paste-input')$('#paste-feedback').textContent=e.target.value.trim().toLocaleLowerCase('ru')==='вершина'?'Слово на месте! Ты потренировался переносить текст.':'';});
window.addEventListener('hashchange',()=>{const i=STAGE_IDS.indexOf(location.hash.slice(1));if(i>=0&&i!==state.stage)goTo(i);});
$('#open-guide').addEventListener('click',()=>$('#guide-dialog').showModal());
$('#open-notes').addEventListener('click',()=>$('#notes-dialog').showModal());
$('#restart').addEventListener('click',()=>$('#restart-dialog').showModal());
document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelectorAll('.dialog-close,.dialog-done').forEach(b=>b.addEventListener('click',()=>dialog.close()));dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});});
$('#confirm-restart').addEventListener('click',()=>{state=newState();save();$('#restart-dialog').close();render();$('#lesson').scrollIntoView({behavior:'smooth'});});
function downloadBadge(){
  const url=URL.createObjectURL(new Blob([certificateSVG()],{type:'image/svg+xml;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='Грамота-Юный-исследователь.svg';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);$('#announcer').textContent='Грамота сохранена в загрузки браузера.';
}

render();
