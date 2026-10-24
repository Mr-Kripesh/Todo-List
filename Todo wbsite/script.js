const $ = id => document.getElementById(id);
const columns = {todo:'To do',progress:'In progress',done:'Done'};
const key = 'dayboard-v1';
let cards = [], view = 'all', editing = null, dragged = null, deleted = null;
try {
  const saved = localStorage.getItem(key);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw Error('Invalid board');
    cards = parsed.filter(c => c && typeof c.id === 'string' && typeof c.title === 'string' && columns[c.status]).map(c => ({...c, details:typeof c.details === 'string' ? c.details : '',type:c.type === 'note' ? 'note':'task',color:['cream','sage','lavender','peach'].includes(c.color)?c.color:'cream'}));
  } else {
    const old = new DOMParser().parseFromString(localStorage.getItem('data') || '', 'text/html');
    cards = [...old.querySelectorAll('li')].map(li => {const done=li.classList.contains('checked');li.querySelectorAll('span').forEach(s=>s.remove());return {id:crypto.randomUUID(),title:li.textContent.trim(),details:'',type:'task',status:done?'done':'todo',color:'cream'};});
  }
} catch { $('save-status').textContent = 'Could not load saved cards. Browser data was kept.'; }
function save() {try {localStorage.setItem(key,JSON.stringify(cards));$('save-status').textContent='Saved on this device';}catch {$('save-status').textContent='Saving unavailable — keep this tab open.';}}
function element(tag, cls, text) {const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
function action(text,label,fn){const b=element('button','',text);b.type='button';b.setAttribute('aria-label',label);b.onclick=fn;return b;}
function render(){
  $('board').replaceChildren();
  const query=$('search').value.trim().toLowerCase();
  const visible=cards.filter(c=>(view==='all'||c.type===view)&&`${c.title} ${c.details}`.toLowerCase().includes(query));
  $('count').textContent=`${visible.length} cards · ${cards.filter(c=>c.status==='done').length} completed`;
  for(const [status,name] of Object.entries(columns)){
    const section=element('section','column');section.setAttribute('aria-label',name);
    const items=visible.filter(c=>c.status===status);
    const heading=element('h2','',`${name} · ${items.length}`);heading.append(action('+',`Add card to ${name}`,()=>openEditor(null,status)));section.append(heading);
    const list=element('div','cards');
    section.ondragover=e=>{e.preventDefault();e.dataTransfer.dropEffect='move';};
    section.ondrop=e=>{e.preventDefault();if(!dragged)return;const card=cards.find(c=>c.id===dragged);if(!card)return;const target=e.target.closest('.card');cards=cards.filter(c=>c!==card);card.status=status;let index=target?cards.findIndex(c=>c.id===target.dataset.id):-1;if(index<0)index=cards.length;cards.splice(index,0,card);dragged=null;save();render();};
    for(const c of items){
      const card=element('article',`card ${c.color}`);card.dataset.id=c.id;card.draggable=true;
      card.ondragstart=e=>{dragged=c.id;e.dataTransfer.setData('text/plain',c.id);e.dataTransfer.effectAllowed='move';card.classList.add('dragging');};card.ondragend=()=>{dragged=null;card.classList.remove('dragging');};
      card.append(element('span','tag',c.type==='note'?'▤ Note':'✓ Task'),element('h3','',c.title));if(c.details)card.append(element('p','',c.details));
      const actions=element('div','actions');
      actions.append(action('Edit',`Edit ${c.title}`,()=>openEditor(c)),action('Delete',`Delete ${c.title}`,()=>{deleted={card:{...c},index:cards.indexOf(c)};cards=cards.filter(x=>x.id!==c.id);$('toast').hidden=false;save();render();}));
      const select=element('select');select.setAttribute('aria-label',`Status of ${c.title}`);for(const [value,label]of Object.entries(columns)){const option=element('option','',label);option.value=value;select.append(option);}select.value=c.status;select.onchange=()=>{c.status=select.value;save();render();};actions.append(select);
      for(const [text,delta]of [['↑',-1],['↓',1]]){const button=action(text,`Move ${c.title} ${delta<0?'up':'down'}`,()=>{const neighbor=items[items.indexOf(c)+delta];if(!neighbor)return;const a=cards.indexOf(c),b=cards.indexOf(neighbor);[cards[a],cards[b]]=[cards[b],cards[a]];save();render();});button.disabled=!items[items.indexOf(c)+delta];actions.append(button);}
      card.append(actions);list.append(card);
    }
    if(!items.length)list.append(element('p','empty',query?'No matching cards':'A little room for your next idea.'));
    section.append(list);$('board').append(section);
  }
}
function openEditor(card=null,status='todo'){editing=card?.id||null;$('form').reset();$('dialog-title').textContent=card?'Edit your card':'A fresh start';$('type').value=card?.type||(view==='note'?'note':'task');$('title').value=card?.title||'';$('details').value=card?.details||'';$('status').value=card?.status||status;$('color').value=card?.color||'cream';$('editor').showModal();$('title').focus();}
$('add').onclick=()=>openEditor();$('close').onclick=()=>$('editor').close();
$('form').onsubmit=e=>{e.preventDefault();const title=$('title').value.trim();if(!title){$('title').setCustomValidity('Enter a title.');$('title').reportValidity();return;}const card={id:editing||crypto.randomUUID(),title,details:$('details').value.trim(),type:$('type').value,status:$('status').value,color:$('color').value};const index=cards.findIndex(c=>c.id===editing);if(index<0)cards.push(card);else cards[index]=card;save();render();$('editor').close();};
$('title').oninput=()=>$('title').setCustomValidity('');$('search').oninput=render;
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});render();});
$('undo').onclick=()=>{if(deleted){cards.splice(Math.min(deleted.index,cards.length),0,deleted.card);deleted=null;save();render();}$('toast').hidden=true;};
render();
