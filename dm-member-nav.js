import {supabase,currentMember,registerMember,requestEmailLogin,logoutMember,EXPECTATIONS,optionLabels,getExpectations,emailHint,cleanEmail} from "./dm-member-client.js?v=20261015-full-zip";
const nav=document.querySelector(".navlinks");
if(nav){
 const style=document.createElement("style");
 style.textContent=`
 .dm-user-controls{display:flex;align-items:center;margin-left:12px;flex-shrink:0}
 .dm-profile-top{border:1px solid #111;border-radius:999px;padding:10px 17px;background:#b8ff17;color:#111;font:inherit;font-size:12px;font-weight:900;cursor:pointer;white-space:nowrap}
 .dm-profile-top:hover{background:#111;color:#fff}
 .dm-user-menu{position:absolute;right:20px;top:65px;min-width:195px;background:#fbfaf6;border:1px solid #111;border-radius:14px;box-shadow:0 14px 40px #0002;padding:6px;z-index:200}
 .dm-user-menu[hidden]{display:none!important}
 .dm-user-menu a,.dm-user-menu button{display:block;width:100%;border:0;background:transparent;text-align:left;font:inherit;font-size:13px;padding:12px;border-radius:8px;cursor:pointer;color:#111;text-decoration:none}
 .dm-user-menu a:hover,.dm-user-menu button:hover{background:#b8ff17}
 .dm-member-backdrop[hidden],.dm-member-dialog[hidden]{display:none!important}
 .dm-member-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.37);z-index:600}
 .dm-member-dialog{position:fixed;z-index:601;top:50%;left:50%;transform:translate(-50%,-50%);width:min(530px,calc(100vw - 24px));max-height:min(88vh,850px);overflow:auto;background:#fbfaf6;border:1.5px solid #0a0a0a;border-radius:24px;padding:32px;color:#0a0a0a;box-shadow:0 30px 100px #0003}
 .dm-member-dialog .dm-dialog-head{display:flex;align-items:start;justify-content:space-between;gap:12px}
 .dm-member-dialog h2{font-size:clamp(30px,4vw,43px);line-height:1.02;letter-spacing:-.06em;margin:16px 0}
 .dm-member-dialog .dm-eyebrow{font-size:11px;font-weight:900;letter-spacing:.1em}
 .dm-member-dialog p{font-size:14px;color:#625d55;line-height:1.65;margin:0 0 21px}
 .dm-member-dialog .dm-dismiss{border:1px solid #0a0a0a;border-radius:50%;height:35px;width:35px;flex:0 0 35px;background:transparent;font-size:18px;cursor:pointer}
 .dm-member-dialog .dm-entry-label{display:block;font-size:11px;font-weight:900;letter-spacing:.075em;margin:19px 0 8px}
 .dm-member-dialog input[type=email],.dm-member-dialog input[type=text]{width:100%;padding:14px;border:1px solid #b8b3a9;border-radius:9px;font:inherit;font-size:15px;background:#fff}
 .dm-member-dialog .dm-options{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
 .dm-member-dialog .dm-option-pill{position:relative}
 .dm-member-dialog .dm-option-pill input{position:absolute;opacity:0;width:1px;height:1px}
 .dm-member-dialog .dm-option-pill span{display:inline-block;border:1px solid #b3aea4;border-radius:30px;padding:10px 13px;font-size:13px;cursor:pointer}
 .dm-member-dialog .dm-option-pill input:checked+span{background:#b8ff17;border-color:#111}
 .dm-member-dialog .dm-option-pill input:focus-visible+span{outline:2px solid #111;outline-offset:2px}
 .dm-member-dialog .dm-dialog-submit{width:100%;background:#111;color:white;border:1px solid #111;border-radius:99px;padding:16px;font:inherit;font-weight:900;cursor:pointer;margin-top:22px}
 .dm-member-dialog .dm-dialog-submit:disabled{opacity:.6;cursor:wait}
 .dm-member-dialog .dm-note{font-size:12px;color:#666;margin-top:9px;line-height:1.5}
 .dm-member-dialog .dm-error{color:#942b24;font-size:12px;min-height:18px;margin:8px 0}
 .dm-member-dialog .dm-switch{font:inherit;font-size:13px;background:transparent;border:0;text-decoration:underline;padding:13px 0;cursor:pointer}
 .dm-member-dialog .dm-consent{font-size:12px;display:flex;align-items:start;gap:10px;margin-top:17px}
 .dm-member-dialog .dm-consent input{margin-top:3px}
 @media(max-width:760px){.dm-user-controls{margin-left:4px}.dm-profile-top{padding:9px 12px}.dm-member-dialog{padding:24px 20px}.dm-user-menu{right:10px;top:58px}}
 `;
 document.head.append(style);
 // Replace all legacy localStorage-based member navigation.
 nav.querySelectorAll(".dm-user-controls,.dm-user-menu").forEach(x=>x.remove());
 const controls=document.createElement("div");controls.className="dm-user-controls";
 const trigger=document.createElement("button");trigger.type="button";trigger.className="dm-profile-top";trigger.textContent="Profile ↗";trigger.setAttribute("aria-haspopup","menu");trigger.setAttribute("aria-expanded","false");
 controls.append(trigger);nav.append(controls);
 const menu=document.createElement("div");menu.className="dm-user-menu";menu.hidden=true;menu.setAttribute("role","menu");nav.append(menu);
 const backdrop=document.createElement("div");backdrop.className="dm-member-backdrop";backdrop.hidden=true;
 const dialog=document.createElement("section");dialog.className="dm-member-dialog";dialog.hidden=true;dialog.setAttribute("role","dialog");dialog.setAttribute("aria-modal","true");dialog.setAttribute("aria-label","Design Matters account");
 document.body.append(backdrop,dialog);
 let signedIn=false,mode="login";
 const esc=s=>{const el=document.createElement("span");el.textContent=s;return el.innerHTML};
 function closeMenu(){menu.hidden=true;trigger.setAttribute("aria-expanded","false")}
 function renderMenu(){
  menu.replaceChildren();
  const links=signedIn?[["My Profile","profile"],["Log Out","logout"]]:[["Log In / 邮箱登录","login"],["Sign Up / 注册","signup"]];
  for(const [label,action] of links){
   const btn=document.createElement("button");btn.type="button";btn.setAttribute("role","menuitem");btn.textContent=label;
   btn.addEventListener("click",async()=>{
    closeMenu();
    if(action==="login"||action==="signup"){openDialog(action);return}
    if(action==="profile"){location.assign("./profile-live.html");return}
    try{const {data:{session}}=await supabase.auth.getSession();if(session&&!session.user?.email&&!confirm("此账号注册时未验证邮箱。登出后需要通过注册邮箱接收登录邮件；如果邮件服务尚未配置，可能暂时无法找回 Profile。确定登出吗？"))return;await logoutMember();signedIn=false;renderMenu();trigger.textContent="Profile ↗";}catch(e){alert(e.message||"登出失败");}
   });menu.append(btn);
  }
 }
 function closeDialog(){dialog.hidden=true;backdrop.hidden=true;document.body.style.overflow="";trigger.focus()}
 function openDialog(nextMode){
  mode=nextMode;closeMenu();backdrop.hidden=false;dialog.hidden=false;document.body.style.overflow="hidden";renderDialog();
 }
 function renderDialog(){
  const signup=mode==="signup";
  dialog.innerHTML=`<div class="dm-dialog-head"><span class="dm-eyebrow">DESIGN MATTERS / ${signup?"JOIN OUR COMMUNITY":"WELCOME BACK"}</span><button class="dm-dismiss" type="button" aria-label="关闭">×</button></div>
  <h2>${signup?"加入持续思考的圈子。":"欢迎回来。"} </h2>
  <p>${signup?"选择你更想在 Design Matters 获得的内容，留下邮箱，就可以进入自己的 Profile。":"输入注册邮箱，我们会发送一封安全登录邮件。点击邮件中的链接即可重新进入 Profile。"}</p>
  <form id="dm-dialog-form">
  ${signup?'<label class="dm-entry-label">你更想在这里得到什么？</label><div id="dm-dialog-expects" class="dm-options"></div><label class="dm-entry-label" for="dm-dialog-other">其他期待（选填）</label><input type="text" id="dm-dialog-other" maxlength="180" placeholder="还有什么你想获得的？">':""}
  <label class="dm-entry-label" for="dm-dialog-email">EMAIL / 邮箱</label>
  <input type="email" id="dm-dialog-email" required autocomplete="email" placeholder="name@example.com">
  <div id="dm-email-hint" class="dm-note" role="status"></div>
  ${signup?'<label class="dm-consent"><input id="dm-dialog-consent" type="checkbox" required><span>我愿意收到相关圆桌报名提醒与讨论总结，可随时退订。</span></label>':""}
  <div id="dm-dialog-message" class="dm-error" role="status" aria-live="polite"></div>
  <button type="submit" id="dm-dialog-submit" class="dm-dialog-submit">${signup?"创建我的 Profile →":"发送登录邮件 →"}</button>
  </form>
  <button type="button" id="dm-dialog-switch" class="dm-switch">${signup?"已有账号？通过邮箱登录 →":"第一次加入？创建 Profile →"}</button>
  <div class="dm-note">${signup?"首次创建无需邮件验证。登出后重新登录时，需要验证邮箱所有权。":"邮件登录会验证邮箱所有权；首次注册无需验证。"}</div>`;
  dialog.querySelector(".dm-dismiss").addEventListener("click",closeDialog);
  dialog.querySelector("#dm-dialog-switch").addEventListener("click",()=>{mode=signup?"login":"signup";renderDialog()});
  if(signup)optionLabels(dialog.querySelector("#dm-dialog-expects"),EXPECTATIONS,"dm-expect",[]);
  const email=dialog.querySelector("#dm-dialog-email"),msg=dialog.querySelector("#dm-dialog-message");
  email.addEventListener("blur",()=>{const error=emailHint(email.value);dialog.querySelector("#dm-email-hint").textContent=error||"格式检查通过，账号是否重复将在提交时检查。";});
  dialog.querySelector("#dm-dialog-form").addEventListener("submit",async e=>{
   e.preventDefault();const btn=dialog.querySelector("#dm-dialog-submit");
   const problem=emailHint(email.value);if(problem){msg.textContent=problem;email.focus();return}
   const value=cleanEmail(email.value);
   const expects=signup?getExpectations(dialog):[];
   if(signup&&!expects.length){msg.textContent="请至少选择一个你希望获得的内容。";return}
   btn.disabled=true;msg.textContent=signup?"正在创建你的 Profile…":"正在请求登录邮件…";
   try{
    if(signup){
     await registerMember({email:value,expectations:expects,custom_expectation:dialog.querySelector("#dm-dialog-other").value,consent:dialog.querySelector("#dm-dialog-consent").checked});
     location.assign("./profile-live.html");
    }else{
     await requestEmailLogin(value);
     dialog.querySelector("form").hidden=true;
     msg.className="dm-note";msg.textContent="登录邮件请求已提交。如果邮箱可以收件，请按邮件中的链接返回 Profile。";
    }
   }catch(err){msg.textContent=err.message||"暂时无法完成操作，请稍后再试";btn.disabled=false}
  });
  setTimeout(()=>email.focus(),0);
 }
 trigger.addEventListener("click",()=>{menu.hidden=!menu.hidden;trigger.setAttribute("aria-expanded",String(!menu.hidden))});
 backdrop.addEventListener("click",closeDialog);
 document.addEventListener("click",event=>{if(!controls.contains(event.target)&&!menu.contains(event.target))closeMenu()});
 document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!dialog.hidden)closeDialog()});
 renderMenu();
 try{const {member}=await currentMember();signedIn=!!member;renderMenu();if(member)trigger.textContent="Profile ▾";}
 catch(error){console.warn("Member nav not ready:",error);}
 if(new URLSearchParams(location.search).get("member")==="login")openDialog("login");
}