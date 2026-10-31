import {drawing} from './drawings.js?v=7';
export function inlineTeacher(text,id=''){return `<aside class="inline-teacher"${id?` id="${id}"`:''} aria-label="Екатерина подсказывает"><div class="inline-portrait"><img src="assets/ekaterina.jpg?v=2" alt="Екатерина" width="900" height="944"></div><div class="inline-speech"><span>Екатерина</span><p>${text}</p></div></aside>`;}
export function flowArrow(end=false){return `<div class="flow-arrow${end?' flow-arrow-end':''}" aria-hidden="true">${drawing('flow-arrow')}</div>`;}
export function marginDoodles(stage=''){return `<div class="margin-doodles" aria-hidden="true"><span class="margin-doodle doodle-flag">${drawing('flag')}</span>${stage==='camp'?'':`<span class="margin-doodle doodle-keyboard">${drawing('keyboard')}</span>`}<span class="margin-doodle doodle-compass">${drawing('compass')}</span></div>`;}
export const BREAKS=[
  {id:'eyes',icon:'eyes',title:'Посмотри вдаль',text:'Найди предмет далеко от экрана: за окном или в другом конце комнаты. Посмотри на него около 20 секунд — дай глазам отдохнуть.'},
  {id:'shoulders',icon:'stretch',title:'Расслабь плечи',text:'Встань. Плавно подними плечи к ушам и опусти. Повтори 4 раза, затем спокойно расправь плечи.'},
  {id:'blink',icon:'eyes',title:'Мягко поморгай',text:'Несколько раз медленно закрой и открой глаза. Не зажмуривайся. За экраном мы часто забываем моргать.'},
  {id:'move',icon:'walk',title:'Разомни руки и ноги',text:'Раскрой ладони, расправь пальцы и мягко встряхни кисти. Немного походи по комнате.'}
];
