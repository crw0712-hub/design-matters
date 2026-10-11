/* Design Matters interaction prototype.
 * Demo mode: browser-local data only. No email or account is created. */
(function(){
  'use strict';
  const STORAGE='dm_local_community_v2';
  const ACTIVE='dm_local_active_v2';
  const PENDING='dm_pending_topics';
  const TOPICS=[
    ['agentic-products-agent-ux','Agentic Products & Agent UX'],
    ['enterprise-ai','Enterprise AI'],
    ['vibe-coding-design-roles','Vibe Coding & Prototyping'],
    ['design-judgment-future-work','Design Roles, Judgment & Future of Work'],
    ['ai-native-startups-product-strategy','AI-native Startups & AI Product Strategy']
  ];
  const BADGES=[
    ['explorer','AI Explorer','发现与探索','正在探索 AI 的可能性'],
    ['power','AI Power User','日常应用','在日常工作中深度使用 AI'],
    ['cross','Cross-Disciplinary Thinker','跨界连接','连接设计、技术与商业'],
    ['builder','AI Builder','创造与构建','用 AI 创造产品和新工作流'],
    ['critical','Critical Thinker','思辨与审视','持续追问 AI 的价值和边界']
  ];
  const $=id=>document.getElementById(id);
  const read=()=>{try{return JSON.parse(localStorage.getItem(STORAGE)||'null')}catch(e){return null}};
  const write=p=>{localStorage.setItem(STORAGE,JSON.stringify(p));sessionStorage.setItem(ACTIVE,'1')};
  const pending=()=>{try{const a=JSON.parse(sessionStorage.getItem(PENDING)||'[]');return Array.isArray(a)?a.filter(x=>TOPICS.some(t=>t[0]===x)):[]}catch(e){return []}};
  const navigate=file=>{location.href='./'+file+'.html'};
  const status=(message,ok=false)=>{const e=$('status');if(e){e.textContent=message||'';e.style.color=ok?'#245a15':'#873126';}};
  const clear=()=>status('');
  const prettyName=id=>(TOPICS.find(t=>t[0]===id)||[])[1]||id;
  function orbit(id){
    const index=BADGES.findIndex(b=>b[0]===id);
    const i=Math.max(0,index);
    const positions=[
      [[73,17],[19,60],[80,77]],
      [[78,26],[28,20],[22,77]],
      [[18,30],[78,25],[71,78]],
      [[50,10],[18,65],[81,64]],
      [[18,24],[82,43],[40,85]]
    ][i];
    const nodes=positions.map(([x,y],j)=>'<circle cx="'+x+'" cy="'+y+'" r="'+(j===0?7:4)+'" class="'+(j===0?'orbit-accent':'orbit-node')+'"/>').join('');
    return '<svg viewBox="0 0 100 100" class="dm-orbit-svg" aria-hidden="true"><circle cx="50" cy="50" r="43" class="orbit-outer"/><circle cx="50" cy="50" r="29" class="orbit-inner"/><circle cx="50" cy="50" r="12" class="orbit-core"/>'+nodes+'</svg>';
  }
  function badgePicker(host,value,onChange){
    host.textContent='';
    BADGES.forEach(([id,name,subtitle,description])=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='badge-choice'+(id===value?' picked':'');
      b.setAttribute('aria-pressed',String(id===value));
      b.innerHTML='<span class="dm-orbit-disc">'+orbit(id)+'</span><span class="dm-badge-words"><strong>'+name+'</strong><small>'+subtitle+' · '+description+'</small></span>';
      b.addEventListener('click',()=>{onChange(id);badgePicker(host,id,onChange);});
      host.append(b);
    });
  }
  function topicPicker(host,chosen,onChange){
    host.textContent='';
    TOPICS.forEach(([id,name])=>{
      const b=document.createElement('button');b.type='button';
      const active=chosen.has(id);
      b.className='choice'+(active?' active':'');
      b.setAttribute('aria-pressed',String(active));
      b.textContent=name;
      b.addEventListener('click',()=>{
        active?chosen.delete(id):chosen.add(id);
        topicPicker(host,chosen,onChange);if(onChange)onChange();
      });
      host.append(b);
    });
  }
  function setupAccount(){
    const existing=read();
    let chosen=new Set([...((existing&&existing.topics)||[]),...pending()]);
    let chosenBadge=(existing&&existing.badge)||'explorer';
    const steps=['emailStep','detailsStep','badgeStep'];
    const show=(index)=>{
      steps.forEach((id,i)=>{if($(id))$(id).hidden=i!==index});
      const bar=$('progress');if(bar)bar.style.width=((index+1)/3*100)+'%';
      const label=$('stepNumber');if(label)label.textContent='0'+(index+1)+' / 03';
      clear();window.scrollTo({top:0,behavior:'instant'});
    };
    topicPicker($('topicChoices'),chosen,()=>{sessionStorage.setItem(PENDING,JSON.stringify([...chosen]));});
    badgePicker($('badgeChoices'),chosenBadge,id=>chosenBadge=id);
    if(existing){
      $('email').value=existing.email||'';
      $('displayName').value=existing.name||'';
      $('username').value=existing.username||'';
      if($('returning'))$('returning').hidden=false;
      if($('resume'))$('resume').onclick=()=>{
        const updated={...existing,topics:[...chosen]};
        write(updated);sessionStorage.removeItem(PENDING);navigate('profile');
      };
    }
    show(0);
    $('emailSend').addEventListener('click',()=>{
      // No email is sent in this browser-local walkthrough.
      const value=$('email').value.trim();
      if(value&&!$('email').checkValidity()){status('邮箱格式不正确；也可以留空继续体验。');return;}
      show(1);$('displayName').focus();
    });
    $('detailsNext').addEventListener('click',()=>{
      const name=$('displayName').value.trim();
      const username=$('username').value.trim().toLowerCase().replace(/^@/,'');
      if(!name||name.length>80){status('请填写你希望显示的名字（最多 80 字）。');return;}
      if(!/^[a-z0-9][a-z0-9._-]{2,23}$/.test(username)){status('Username 需要 3–24 位字母、数字或 ._-，且以字母或数字开头。');return;}
      $('username').value=username;
      show(2);
    });
    $('backDetails').addEventListener('click',()=>show(1));
    $('finish').addEventListener('click',()=>{
      const name=$('displayName').value.trim(),username=$('username').value.trim().toLowerCase();
      if(!name||!/^[a-z0-9][a-z0-9._-]{2,23}$/.test(username)){show(1);return;}
      const item={
        name,username,email:$('email').value.trim().toLowerCase(),
        bio:existing?.bio||'',badge:chosenBadge,topics:[...chosen],
        created_at:existing?.created_at||new Date().toISOString()
      };
      write(item);sessionStorage.removeItem(PENDING);navigate('profile');
    });
  }
  function setupProfile(){
    const p=read();if(!p){navigate('account');return;}
    const selectedTopics=new Set(p.topics||[]);
    let badge=p.badge||'explorer';
    $('displayName').value=p.name||'';
    $('username').value=p.username||'';
    $('bio').value=p.bio||'';
    $('headerName').textContent=p.name||'Designer';
    $('handle').textContent='@'+p.username;
    $('memberEmail').textContent=p.email||'尚未设置邮箱（本机体验无需邮箱）';
    $('avatar').innerHTML=orbit(badge);
    $('identity').textContent=(BADGES.find(b=>b[0]===badge)||BADGES[0])[1];
    if($('headBadge'))$('headBadge').innerHTML=orbit(badge);
    topicPicker($('topicChoices'),selectedTopics);
    badgePicker($('badgeChoices'),badge,id=>badge=id);
    const events=$('events');
    if(events)events.innerHTML='<div class="event-row"><strong>暂未报名任何活动</strong><span>活动正式开放时，这里会出现 Luma 的 Request a seat 链接；仅提交兴趣不等于报名。</span></div>';
    $('save').addEventListener('click',()=>{
      const name=$('displayName').value.trim(),bio=$('bio').value.trim();
      if(!name||name.length>80){status('请填写显示名称（最多 80 字）。');return;}
      if(bio.length>400){status('个人介绍不超过 400 字。');return;}
      const updated={...p,name,bio,badge,topics:[...selectedTopics]};
      write(updated);
      $('headerName').textContent=name;
      $('identity').textContent=(BADGES.find(b=>b[0]===badge)||BADGES[0])[1];
      $('avatar').innerHTML=orbit(badge);
      if($('headBadge'))$('headBadge').innerHTML=orbit(badge);
      status('已保存到当前浏览器 ✓',true);
    });
    $('logout').addEventListener('click',()=>{
      sessionStorage.removeItem(ACTIVE);
      navigate('account');
    });
  }
  window.DMCommunityDemo={setupAccount,setupProfile};
})();