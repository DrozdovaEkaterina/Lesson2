import {drawing} from './drawings.js?v=4';
const guides={
  welcome:[['compass','Прочитай мою реплику','.lesson-sheet > .teacher-row'],['flag','Начни экспедицию','#next-stage']],
  backpack:[['mouse','Нажми на рисунки','.device-grid'],['keyboard','Открой игру','.task-list'],['flag','Отметь «Всё сделано!»','#next-stage']],
  keyboard:[['keyboard','Открой игру','.task-list'],['compass','Вернись из игры','#keyboard-continue'],['flag','Напечатай 5 образцов','#keyboard-continue']],
  camp:[['cpu','Нажми на название','.component-options'],['ram','Найди деталь на схеме','.scene-art'],['flag','Прочитай, для чего она','.component-description']],
  safety:[['shield','Вспомни правила','.rules-grid'],['tent','Сделай привал','.break-exercises'],['keyboard','Открой игру','.task-list']],
  summit:[['monitor','Узнай свой компьютер','.os-explanation'],['camera','Следуй шагам','#screenshot-instructions'],['flag','Сохрани снимок','#summit-postcard']],
  shortcuts:[['keyboard','Посмотри сочетания','#shortcut-cards'],['mouse','Попробуй скопировать','.copy-practice'],['flag','Открой игру','.task-list']],
  finish:[['compass','Ответь на вопросы','.quiz-list'],['flag','Выбери впечатление','.mood-section'],['medal','Получи грамоту','#next-stage']]
};
export function guideHTML(id){return `<nav class="action-guide" aria-label="Что делать по порядку">${(guides[id]||[]).map(([icon,label,target],i)=>`<button type="button" class="guide-step${i===0?' is-current':''}" data-guide-target="${target}"><span class="guide-number">${i+1}</span><span class="guide-icon">${drawing(icon)}</span><span class="guide-copy"><small>${i===0?'Сначала':i===1?'Потом':'В конце'}</small><strong>${label}</strong></span></button>`).join('')}</nav>`;}
export function inlineTeacher(text,id=''){return `<aside class="inline-teacher"${id?` id="${id}"`:''} aria-label="Екатерина подсказывает"><div class="inline-portrait"><img src="assets/ekaterina.jpg?v=2" alt="Екатерина" width="900" height="944"></div><div><span>Екатерина</span><p>${text}</p></div></aside>`;}
export const BREAKS=[
  {id:'eyes',icon:'eyes',title:'Посмотри вдаль',text:'Найди предмет далеко от экрана: за окном или в другом конце комнаты. Посмотри на него около 20 секунд — дай глазам отдохнуть.'},
  {id:'blink',icon:'eyes',title:'Мягко поморгай',text:'Несколько раз медленно закрой и открой глаза. Не зажмуривайся. За экраном мы часто забываем моргать.'},
  {id:'shoulders',icon:'stretch',title:'Расслабь плечи',text:'Встань. Плавно подними плечи к ушам и опусти. Повтори 4 раза, затем спокойно расправь плечи.'},
  {id:'move',icon:'walk',title:'Разомни руки и ноги',text:'Раскрой ладони, расправь пальцы и мягко встряхни кисти. Немного походи по комнате.'}
];
