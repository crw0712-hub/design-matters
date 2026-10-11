const DM_URL='https://khhfxkrwgcckgqupncyw.supabase.co';
const DM_KEY='sb_publishable_oXnMd_aF95wYTPcq6TwGVg_alaNdfTH';
const dm=window.supabase.createClient(DM_URL,DM_KEY);
const TOPICS=[
['agentic-products-agent-ux','Agentic Products & Agent UX'],
['enterprise-ai','Enterprise AI'],
['vibe-coding-design-roles','Vibe Coding & Prototyping'],
['design-judgment-future-work','Design Roles, Judgment & Future of Work'],
['ai-native-startups-product-strategy','AI-native Startups & AI Product Strategy']];
const BADGES=[
['explorer','AI Explorer','✳','Curious about what comes next'],
['power','AI Power User','⚡','AI is part of everyday work'],
['cross','Cross-Disciplinary Thinker','↗','Connecting disciplines and ideas'],
['builder','AI Builder','▣','Building with AI'],
['critical','Critical Thinker','◉','Questioning assumptions and impacts']];
const $=id=>document.getElementById(id);
const selected=(k)=>{try{return JSON.parse(sessionStorage.getItem(k)||'[]')}catch(e){return []}};
const clearStatus=()=>{const el=$('status');if(el)el.textContent=''};
const status=(v)=>{const el=$('status');if(el)el.textContent=v};
function nav(to){location.href='./'+to+'.html'}
function progress(i){const el=$('progress');if(el)el.style.width=(i/3*100)+'%'}
function topicButtons(host,chosen,onChange){
host.innerHTML='';
TOPICS.forEach(([id,title])=>{
 const b=document.createElement('button');b.type='button';b.textContent=title;
 b.className='choice'+(chosen.has(id)?' active':'');b.setAttribute('aria-pressed',chosen.has(id));
 b.onclick=()=>{chosen.has(id)?chosen.delete(id):chosen.add(id);topicButtons(host,chosen,onChange);onChange&&onChange()};
 host.append(b);
});
}
function badgeButtons(host,picked,onChange){
host.innerHTML='';
BADGES.forEach(([id,title,glyph,desc])=>{
const btn=document.createElement('button');btn.type='button';btn.className='badge-choice '+(id===picked?'picked':'');
btn.innerHTML='<span class="badge-glyph">'+glyph+'</span><strong>'+title+'</strong><small>'+desc+'</small>';
btn.onclick=()=>{onChange(id);badgeButtons(host,id,onChange)};
host.append(btn);
});
}
async function getUser(){const {data,error}=await dm.auth.getUser();return error?null:data.user}
async function loadProfile(user){const {data}=await dm.from('dm_member_profiles').select('*').eq('user_id',user.id).maybeSingle();return data}
async function saveTopics(uid,ids){
 const {error:e}=await dm.from('dm_member_topic_preferences').delete().eq('user_id',uid);
 if(e)throw e;
 if(ids.length){const {error}=await dm.from('dm_member_topic_preferences').insert(ids.map(topic_id=>({topic_id,user_id:uid})));if(error)throw error;}
}
async function setupAccount(){
const user=await getUser();
if(user){const profile=await loadProfile(user);nav(profile&&profile.username?'profile':'account');if(profile&&profile.username)return;}
let email='';
const show=(id)=>{document.querySelectorAll('.step').forEach(x=>x.hidden=x.id!==id);progress(id==='emailStep'?1:id==='codeStep'?2:3);clearStatus()};
show(user?'detailsStep':'emailStep');
$('emailSend').onclick=async()=>{
email=$('email').value.trim().toLowerCase();if(!$('email').checkValidity())return status('请输入有效邮箱');
$('emailSend').disabled=true;status('发送中…');
const {error}=await dm.auth.signInWithOtp({email,options:{shouldCreateUser:true}});
$('emailSend').disabled=false;if(error)return status(error.message);show('codeStep');$('code').focus();
};
$('verify').onclick=async()=>{
const token=$('code').value.trim();if(!/^\d{6,8}$/.test(token))return status('请输入邮件里的验证码');
$('verify').disabled=true;const {error}=await dm.auth.verifyOtp({email,token,type:'email'});
$('verify').disabled=false;if(error)return status(error.message);show('detailsStep');
};
$('backEmail').onclick=()=>show('emailStep');
const pending=new Set(selected('dm_pending_topics'));
topicButtons($('topicChoices'),pending,()=>sessionStorage.setItem('dm_pending_topics',JSON.stringify([...pending])));
let picked='explorer';badgeButtons($('badgeChoices'),picked,v=>picked=v);
$('finish').onclick=async()=>{
const u=await getUser();if(!u)return status('邮箱尚未验证，请重新登录');
const display_name=$('displayName').value.trim(),username=$('username').value.trim().toLowerCase().replace(/^@/,'');
if(!display_name||display_name.length>80)return status('请填写姓名');
if(!/^[a-z0-9][a-z0-9._-]{2,23}$/.test(username))return status('昵称需为 3–24 位英文字母、数字或 ._-');
$('finish').disabled=true;status('保存中…');
try{
 const {error}=await dm.from('dm_member_profiles').upsert({user_id:u.id,display_name,username,badge_id:picked},{onConflict:'user_id'});
 if(error)throw error;
 await saveTopics(u.id,[...pending]);
 sessionStorage.removeItem('dm_pending_topics');nav('profile');
}catch(e){status(e.code==='23505'?'这个 username 已被使用，请换一个。':e.message);}finally{$('finish').disabled=false;}
};
}
async function setupProfile(){
const u=await getUser();if(!u)return nav('account');
const p=await loadProfile(u);if(!p||!p.username)return nav('account');
const topicsResp=await dm.from('dm_member_topic_preferences').select('topic_id').eq('user_id',u.id);
let chosen=new Set((topicsResp.data||[]).map(x=>x.topic_id));
let picked=p.badge_id||'explorer';
$('displayName').value=p.display_name||'';$('username').value=p.username||'';$('bio').value=p.bio||'';
$('avatar').textContent=(p.display_name||'D').charAt(0).toUpperCase();
$('headerName').textContent=p.display_name||p.username;
$('handle').textContent='@'+p.username;
$('memberEmail').textContent=u.email||'';
$('identity').textContent=BADGES.find(x=>x[0]===picked)?.[1]||'AI Explorer';
topicButtons($('topicChoices'),chosen);
badgeButtons($('badgeChoices'),picked,v=>picked=v);
$('save').onclick=async()=>{
const name=$('displayName').value.trim(),bio=$('bio').value.trim();
if(!name||bio.length>400)return status('检查姓名和介绍（最多 400 字）');
$('save').disabled=true;status('保存中…');
try{
const {error}=await dm.from('dm_member_profiles').update({display_name:name,bio,badge_id:picked}).eq('user_id',u.id);
if(error)throw error;
await saveTopics(u.id,[...chosen]);status('已保存 ✓');$('headerName').textContent=name;$('identity').textContent=BADGES.find(x=>x[0]===picked)?.[1];$('avatar').textContent=name.charAt(0).toUpperCase();
}catch(e){status(e.message)}finally{$('save').disabled=false;}
};
$('logout').onclick=async()=>{await dm.auth.signOut();nav('account')};
const {data:events}=await dm.from('dm_community_event_catalog').select('event_id,title,status,luma_url,start_at,topic_ids').eq('visible',true);
const {data:records}=await dm.from('dm_member_event_records').select('event_id,status').eq('user_id',u.id);
const holder=$('events');
const matched=(events||[]).filter(e=>(e.topic_ids||[]).some(t=>chosen.has(t)));
holder.innerHTML='';
matched.forEach(ev=>{
const row=document.createElement('div');row.className='event-row';const record=(records||[]).find(x=>x.event_id===ev.event_id);
const title=document.createElement('strong');title.textContent=ev.title;row.append(title);
const sub=document.createElement('span');sub.textContent=record?record.status:(ev.status==='open'?'Registration open':ev.status);row.append(sub);
if(ev.luma_url&&ev.status==='open'){const a=document.createElement('a');a.href=ev.luma_url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Request a seat ↗';row.append(a)}
holder.append(row);
});
if(!matched.length)holder.textContent='关注的话题暂未开放新的圆桌。相关 Luma 报名链接会在活动正式开放后出现在这里。';
}
