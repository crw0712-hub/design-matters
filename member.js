(function(){
'use strict';
const url='https://khhfxkrwgcckgqupncyw.supabase.co';
const key='sb_publishable_oXnMd_aF95wYTPcq6TwGVg_alaNdfTH';
const db=window.supabase.createClient(url,key);
const TOPICS=[['agentic-products-agent-ux','Agentic Products & Agent UX'],['enterprise-ai','Enterprise AI'],['vibe-coding-design-roles','Vibe Coding & Prototyping'],['design-judgment-future-work','Design Roles, Judgment & Future of Work'],['ai-native-startups-product-strategy','AI-native Startups & AI Product Strategy']];
const BADGES=[['explorer','AI Explorer','✳'],['power','AI Power User','⚡'],['cross','Cross-Disciplinary Thinker','↗'],['builder','AI Builder','▣'],['critical','Critical Thinker','◉']];
const $=id=>document.getElementById(id);
const go=path=>location.replace('./'+path+'.html');
const pending=()=>{try{return JSON.parse(localStorage.getItem('dm_pending_topics')||'[]').filter(id=>TOPICS.some(t=>t[0]===id))}catch(e){return []}};
const message=s=>{if($('status'))$('status').textContent=s||''};
async function user(){const {data,error}=await db.auth.getUser();if(error)return null;return data.user}
async function profile(uid){const {data,error}=await db.from('dm_member_profiles').select('*').eq('user_id',uid).maybeSingle();if(error)throw error;return data}
async function savePending(uid){
const chosen=pending();if(!chosen.length)return;
const {error}=await db.from('dm_member_topic_preferences').upsert(chosen.map(topic_id=>({user_id:uid,topic_id})),{onConflict:'user_id,topic_id'});
if(error)throw error;localStorage.removeItem('dm_pending_topics');
}
function step(id){document.querySelectorAll('.step').forEach(e=>e.hidden=e.id!==id);message('')}
async function setupAccount(){
let current=await user();
if(current){try{let p=await profile(current.id);if(p?.display_name){await savePending(current.id);go('profile');return;}step('nameStep');return;}catch(e){message(e.message);return}}
step('emailStep');
async function send(){
const email=$('email').value.trim().toLowerCase();
if(!$('email').checkValidity())return message('Please enter a valid email address.');
const b=$('send');b.disabled=true;message('Sending email…');
const {error}=await db.auth.signInWithOtp({email,options:{shouldCreateUser:true,emailRedirectTo:location.origin+location.pathname}});
b.disabled=false;if(error)return message(error.message);
$('sentAddress').textContent=email;step('sentStep');
}
$('emailForm').addEventListener('submit',e=>{e.preventDefault();send()});
$('resend').addEventListener('click',send);
$('changeEmail').addEventListener('click',()=>step('emailStep'));
$('nameForm').addEventListener('submit',async e=>{
e.preventDefault();const name=$('displayName').value.trim();
if(!name||name.length>80)return message('Please enter your display name.');
const u=await user();if(!u)return message('Please verify your email first.');
$('create').disabled=true;
const {error}=await db.from('dm_member_profiles').upsert({user_id:u.id,display_name:name},{onConflict:'user_id'});
if(error){message(error.message);$('create').disabled=false;return}
try{await savePending(u.id);go('profile')}catch(e){message(e.message);$('create').disabled=false}
});
db.auth.onAuthStateChange((ev,session)=>{if(ev==='SIGNED_IN'&&session){setTimeout(async()=>{const u=await user();if(!u)return;const p=await profile(u.id);if(p?.display_name){await savePending(u.id);go('profile')}else step('nameStep')},0)}});
}
function orbit(id){const i=Math.max(0,BADGES.findIndex(b=>b[0]===id));const angles=[10,105,205,300,50];const t=angles[i]*Math.PI/180;const x=50+35*Math.cos(t),y=50+35*Math.sin(t);
return '<svg class="dm-orbit-svg" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-dasharray="3 5"/><circle cx="50" cy="50" r="13" fill="#b8ff17" stroke="currentColor"/><circle cx="'+x+'" cy="'+y+'" r="6" fill="#b8ff17" stroke="currentColor"/></svg>'}
function choices(host,items,selected,onChange,kind){
host.innerHTML='';items.forEach(([id,title])=>{const b=document.createElement('button');b.type='button';const active=kind==='badge'?selected===id:selected.has(id);
b.className=kind==='badge'?'badge-choice'+(active?' picked':''):'choice'+(active?' active':'');b.setAttribute('aria-pressed',String(active));
if(kind==='badge'){b.innerHTML='<span class="dm-orbit-disc">'+orbit(id)+'</span><strong>'+title+'</strong>';}else b.textContent=title;
b.onclick=()=>{onChange(id);};host.append(b);});
}
async function setupProfile(){
const u=await user();if(!u){go('account');return}
let p=await profile(u.id);if(!p?.display_name){go('account');return}
await savePending(u.id);
const list=await db.from('dm_member_topic_preferences').select('topic_id').eq('user_id',u.id);
let selected=new Set((list.data||[]).map(v=>v.topic_id));let badge=p.badge_id||null;
const avatar=$('avatarImage'),fallback=$('avatarText');
function draw(){
$('headerName').textContent=p.display_name;$('memberEmail').textContent=u.email||'';$('bioText').textContent=p.bio||'Add a little about yourself.';fallback.textContent=(p.display_name||'?').charAt(0).toUpperCase();
$('badgeHeader').innerHTML=badge?orbit(badge)+' <span>'+BADGES.find(b=>b[0]===badge)?.[1]+'</span>':'';
if(p.avatar_url){db.storage.from('dm-avatars').createSignedUrl(p.avatar_url,3600).then(({data})=>{if(data?.signedUrl){avatar.src=data.signedUrl;avatar.hidden=false;fallback.hidden=true}})}
$('topicTags').textContent='';
for(const id of selected){const t=TOPICS.find(x=>x[0]===id);if(t){const x=document.createElement('span');x.className='choice active';x.textContent=t[1];$('topicTags').append(x)}}
$('emptyTopics').hidden=selected.size>0;
}
draw();$('profileContent').hidden=false;$('profileLoading').hidden=true;
const editor=$('editor');
function close(){editor.hidden=true;document.body.style.overflow=''}
function open(){ $('displayName').value=p.display_name;$('bio').value=p.bio||''; editor.hidden=false;document.body.style.overflow='hidden';paint(); }
function paint(){choices($('topicChoices'),TOPICS,selected,id=>{selected.has(id)?selected.delete(id):selected.add(id);paint()},'topic');choices($('badgeChoices'),BADGES,badge,id=>{badge=id;paint()},'badge')}
$('editProfile').onclick=open;$('editTopics').onclick=open;$('closeEditor').onclick=close;$('clearBadge').onclick=()=>{badge=null;paint()};
$('save').onclick=async()=>{
const name=$('displayName').value.trim(),bio=$('bio').value.trim();
if(!name||name.length>80||bio.length>400)return message('Check the display name and bio length.');
$('save').disabled=true;message('Saving…');
try{
const {error}=await db.from('dm_member_profiles').update({display_name:name,bio,badge_id:badge}).eq('user_id',u.id);if(error)throw error;
const old=await db.from('dm_member_topic_preferences').select('topic_id').eq('user_id',u.id);if(old.error)throw old.error;
const oldIds=new Set((old.data||[]).map(t=>t.topic_id));
const remove=[...oldIds].filter(x=>!selected.has(x));const add=[...selected].filter(x=>!oldIds.has(x));
if(remove.length){const r=await db.from('dm_member_topic_preferences').delete().eq('user_id',u.id).in('topic_id',remove);if(r.error)throw r.error}
if(add.length){const r=await db.from('dm_member_topic_preferences').insert(add.map(topic_id=>({user_id:u.id,topic_id})));if(r.error)throw r.error}
p={...p,display_name:name,bio,badge_id:badge};draw();close();
}catch(e){message(e.message)}finally{$('save').disabled=false}
};
$('avatarButton').onclick=()=>$('avatarFile').click();
$('avatarFile').onchange=async()=>{
const f=$('avatarFile').files?.[0];if(!f)return;if(f.size>2097152||!['image/png','image/jpeg','image/webp'].includes(f.type)){alert('Use PNG, JPG or WebP under 2 MB.');return}
const ext=f.type==='image/png'?'png':f.type==='image/webp'?'webp':'jpg',path=u.id+'/'+Date.now()+'.'+ext;
const res=await db.storage.from('dm-avatars').upload(path,f,{contentType:f.type,upsert:false});if(res.error){alert(res.error.message);return}
const saved=await db.from('dm_member_profiles').update({avatar_url:path}).eq('user_id',u.id);if(saved.error){alert(saved.error.message);return}
p.avatar_url=path;draw();
};
const ev=await db.from('dm_community_event_catalog').select('event_id,title,status,luma_url,start_at,topic_ids').eq('visible',true);
const rec=await db.from('dm_member_event_records').select('event_id,status').eq('user_id',u.id);
const records=new Map((rec.data||[]).map(e=>[e.event_id,e.status]));$('events').innerHTML='';
(ev.data||[]).filter(e=>records.has(e.event_id)||(e.topic_ids||[]).some(x=>selected.has(x))).forEach(e=>{
const row=document.createElement('div');row.className='event-row';const title=document.createElement('strong');title.textContent=e.title;row.append(title);
const meta=document.createElement('span');meta.textContent=records.get(e.event_id)|| (e.status==='open'?'Applications open':e.status);row.append(meta);
if(e.status==='open'&&e.luma_url){const a=document.createElement('a');a.href=e.luma_url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Request a seat ↗';row.append(a)}
$('events').append(row);
});if(!$('events').children.length)$('events').textContent='New roundtables related to your interests will appear here.';
}
window.DMMember={db,setupAccount,setupProfile,user};
})();