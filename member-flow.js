/* Design Matters: browser-only UX walkthrough. Not authentication. */
(function () {
  'use strict';
  const STORAGE='dm_flow_profiles_v1';
  const ACTIVE='dm_flow_active_email';
  const PENDING='dm_pending_topics';
  const TOPICS=[
    ['agentic-products-agent-ux','Agentic Products & Agent UX'],
    ['enterprise-ai','Enterprise AI'],
    ['vibe-coding-design-roles','Vibe Coding & Prototyping'],
    ['design-judgment-future-work','Design Roles, Judgment & Future of Work'],
    ['ai-native-startups-product-strategy','AI-native Startups & AI Product Strategy']
  ];
  const BADGES=[
    ['explorer','AI Explorer'],
    ['power','AI Power User'],
    ['cross','Cross-Disciplinary Thinker'],
    ['builder','AI Builder'],
    ['critical','Critical Thinker']
  ];
  const $=id=>document.getElementById(id);
  function readProfiles(){try {const v=JSON.parse(localStorage.getItem(STORAGE)||'{}');return v&&typeof v==='object'?v:{};}catch{return {};}}
  function writeProfiles(v){localStorage.setItem(STORAGE,JSON.stringify(v));}
  function getCurrent(){const email=localStorage.getItem(ACTIVE);return email ? (readProfiles()[email]||null) : null;}
  function pendingTopics(){try{const v=JSON.parse(localStorage.getItem(PENDING)||'[]');return Array.isArray(v)?v.filter(id=>TOPICS.some(t=>t[0]===id)):[];}catch{return [];}}
  function saveProfile(p){const all=readProfiles();all[p.email]=p;writeProfiles(all);localStorage.setItem(ACTIVE,p.email);return p;}
  function route(path){window.location.assign('./'+path+'.html');}
  function note(message){const el=$('status');if(el)el.textContent=message||'';}
  function orbit(id){
    const idx=BADGES.findIndex(x=>x[0]===id);
    const a=((idx<0?0:idx)*72+10)*Math.PI/180;
    const x=50+34*Math.cos(a),y=50+34*Math.sin(a);
    return '<svg class="dm-orbit-svg" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="50" cy="50" r="29" fill="none" stroke="currentColor" stroke-dasharray="3 5"/><circle cx="50" cy="50" r="13" fill="#b8ff17" stroke="currentColor"/><circle cx="'+x.toFixed(2)+'" cy="'+y.toFixed(2)+'" r="6" fill="#b8ff17" stroke="currentColor"/></svg>';
  }
  function choiceButtons(host,options,current,kind,onChange){
    host.replaceChildren();
    for(const [id,label] of options){
      const button=document.createElement('button');
      button.type='button';
      const selected=kind==='badge'?current===id:current.has(id);
      button.className=(kind==='badge'?'badge-choice':'choice')+(selected?(kind==='badge'?' picked':' active'):'');
      button.setAttribute('aria-pressed',String(selected));
      if(kind==='badge'){
        const icon=document.createElement('span');icon.className='dm-orbit-disc';icon.innerHTML=orbit(id);
        const name=document.createElement('strong');name.textContent=label;button.append(icon,name);
      }else button.textContent=label;
      button.addEventListener('click',()=>onChange(id));
      host.append(button);
    }
  }
  function setupAccount(){
    let enteredEmail='';
    const email=$('email'),name=$('displayName');
    function show(id){
      document.querySelectorAll('.step').forEach(el=>el.hidden=el.id!==id);
      note('');
    }
    show('emailStep');
    // An email is accepted for walkthrough purposes; it is never sent to a server.
    $('emailForm').addEventListener('submit',event=>{
      event.preventDefault();
      if(!email.checkValidity())return;
      enteredEmail=email.value.trim().toLowerCase();
      const profiles=readProfiles();
      const existing=profiles[enteredEmail];
      if(existing){
        const p=new Set([...(existing.topics||[]),...pendingTopics()]);
        existing.topics=[...p];
        saveProfile(existing);
        localStorage.removeItem(PENDING);
        route('profile');
        return;
      }
      show('nameStep');name.focus();
    });
    $('nameForm').addEventListener('submit',event=>{
      event.preventDefault();
      const display_name=name.value.trim();
      if(!enteredEmail){show('emailStep');return;}
      if(!display_name||display_name.length>80){note('请填写 Display Name（最多 80 个字符）。');return;}
      const p={email:enteredEmail,display_name,bio:'',badge_id:null,topics:pendingTopics(),avatar_data:null,events:[]};
      try{
        saveProfile(p);localStorage.removeItem(PENDING);route('profile');
      }catch(error){note('当前浏览器无法保存资料，请确认没有禁止本地存储。');}
    });
  }
  function setupProfile(){
    let p=getCurrent();
    if(!p){route('account');return;}
    let draftTopics=new Set(p.topics||[]);
    let draftBadge=p.badge_id||null;
    const overlay=$('editor');
    function showAvatar(){
      const img=$('avatarImage'),fallback=$('avatarText');
      if(p.avatar_data){
        img.src=p.avatar_data;img.hidden=false;fallback.hidden=true;
      }else{
        img.hidden=true;img.removeAttribute('src');
        fallback.hidden=false;fallback.textContent=(p.display_name||'?').charAt(0).toUpperCase();
      }
    }
    function render(){
      $('headerName').textContent=p.display_name;
      $('memberEmail').textContent=p.email;
      $('bioText').textContent=p.bio||'Add a little about yourself.';
      $('badgeHeader').replaceChildren();
      if(p.badge_id){
        const badge=BADGES.find(b=>b[0]===p.badge_id);
        const icon=document.createElement('span');icon.innerHTML=orbit(p.badge_id);
        const label=document.createElement('span');label.textContent=badge?badge[1]:'';
        $('badgeHeader').append(icon,label);
      }
      showAvatar();
      const tags=$('topicTags');tags.replaceChildren();
      for(const [id,label] of TOPICS){
        if((p.topics||[]).includes(id)){
          const tag=document.createElement('span');tag.className='choice active';tag.textContent=label;tags.append(tag);
        }
      }
      $('emptyTopics').hidden=(p.topics||[]).length>0;
      const events=$('events');events.replaceChildren();
      const row=document.createElement('div');row.className='event-row';
      const title=document.createElement('strong');title.textContent='No registered events yet';
      const message=document.createElement('span');message.textContent='未来活动开放报名后，这里会显示 Luma 链接。选择兴趣并不代表已报名。';
      row.append(title,message);events.append(row);
    }
    function choices(){
      choiceButtons($('topicChoices'),TOPICS,draftTopics,'topic',id=>{
        draftTopics.has(id)?draftTopics.delete(id):draftTopics.add(id);choices();
      });
      choiceButtons($('badgeChoices'),BADGES,draftBadge,'badge',id=>{draftBadge=id;choices();});
    }
    function openEdit(){
      $('displayName').value=p.display_name;
      $('bio').value=p.bio||'';
      draftTopics=new Set(p.topics||[]);
      draftBadge=p.badge_id||null;
      choices();note('');overlay.hidden=false;document.body.style.overflow='hidden';
    }
    function closeEdit(){overlay.hidden=true;document.body.style.overflow='';}
    $('editProfile').addEventListener('click',openEdit);
    $('editTopics').addEventListener('click',openEdit);
    $('closeEditor').addEventListener('click',closeEdit);
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeEdit();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)closeEdit();});
    $('clearBadge').addEventListener('click',()=>{draftBadge=null;choices();});
    $('save').addEventListener('click',()=>{
      const display_name=$('displayName').value.trim();
      const bio=$('bio').value.trim();
      if(!display_name||display_name.length>80||bio.length>400){
        note('请检查 Display Name 和 About（介绍最多 400 字）。');return;
      }
      const updated={...p,display_name,bio,badge_id:draftBadge,topics:[...draftTopics]};
      try{saveProfile(updated);p=updated;render();closeEdit();}
      catch(e){note('保存失败：浏览器存储空间可能不足。');}
    });
    $('avatarButton').addEventListener('click',()=>$('avatarFile').click());
    $('avatarFile').addEventListener('change',()=>{
      const file=$('avatarFile').files?.[0];
      if(!file)return;
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024){
        alert('请选择不超过 5 MB 的 PNG、JPG 或 WebP 图片。');return;
      }
      const image=new Image();
      const source=URL.createObjectURL(file);
      image.onload=()=>{
        try{
          const side=Math.min(image.width,image.height);
          const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
          const ctx=canvas.getContext('2d');
          ctx.drawImage(image,(image.width-side)/2,(image.height-side)/2,side,side,0,0,256,256);
          const avatar_data=canvas.toDataURL('image/jpeg',.8);
          const updated={...p,avatar_data};saveProfile(updated);p=updated;render();
        }catch(e){alert('头像无法保存，请尝试更小的图片。');}
        finally{URL.revokeObjectURL(source);}
      };
      image.onerror=()=>{URL.revokeObjectURL(source);alert('无法读取图片。');};
      image.src=source;
      $('avatarFile').value='';
    });
    render();$('profileContent').hidden=false;$('profileLoading').hidden=true;
  }
  function setupHome(){
    const nav=document.querySelector('.navlinks');
    if(!nav)return;
    const old=nav.querySelector('.dm-user-controls');if(old)old.remove();
    const oldMenu=nav.querySelector('.dm-user-menu');if(oldMenu)oldMenu.remove();
    const controls=document.createElement('div');controls.className='dm-user-controls';
    const menu=document.createElement('div');menu.className='dm-user-menu';menu.hidden=true;
    nav.append(controls,menu);
    function draw(){
      const p=getCurrent();controls.replaceChildren();menu.replaceChildren();menu.hidden=true;
      if(!p){
        for(const [label,cls] of [['Log In','dm-login-link'],['Sign Up','dm-login-link primary']]){
          const a=document.createElement('a');a.href='./account.html';a.className=cls;a.textContent=label;controls.append(a);
        }
      }else{
        const button=document.createElement('button');button.className='dm-avatar-trigger';
        button.type='button';button.setAttribute('aria-label','Account menu');
        if(p.avatar_data){const img=document.createElement('img');img.src=p.avatar_data;img.alt='My profile';button.append(img);}
        else button.textContent=(p.display_name||'D').charAt(0).toUpperCase();
        button.addEventListener('click',()=>menu.hidden=!menu.hidden);controls.append(button);
        const profile=document.createElement('a');profile.href='./profile.html';profile.textContent='My Profile';
        const logout=document.createElement('button');logout.type='button';logout.textContent='Log Out';
        logout.addEventListener('click',()=>{localStorage.removeItem(ACTIVE);draw();});
        menu.append(profile,logout);
      }
    }
    draw();
    document.addEventListener('click',e=>{if(!controls.contains(e.target)&&!menu.contains(e.target))menu.hidden=true;});
  }
  window.DMFlow={setupAccount,setupProfile,setupHome};
})();