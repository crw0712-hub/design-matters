import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const SUPABASE_URL="https://khhfxkrwgcckgqupncyw.supabase.co";
const KEY="sb_publishable_oXnMd_aF95wYTPcq6TwGVg_alaNdfTH";
// Early access: keep the anonymous Auth session on this browser until the user signs out or clears site storage.
export const supabase=createClient(SUPABASE_URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
export const TOPICS=[
 ["agentic-products-agent-ux","Agent Experience & Human Control"],
 ["enterprise-ai","Enterprise AI & Workflow Redesign"],
 ["vibe-coding-design-roles","AI-assisted Building & Prototyping"],
 ["design-judgment-future-work","Design Judgment & Agency"],
 ["ai-native-startups-product-strategy","AI-native Products & Teams"]
];
export const EXPECTATIONS=[
 ["insights","有价值的讨论总结"],
 ["cases","真实案例与实践经验"],
 ["invites","相关圆桌报名提醒"],
 ["peers","认识全球设计师同行"],
 ["deepdives","小规模深度交流"],
 ["other","其他期待"]
];
const topicIDs=new Set(TOPICS.map(x=>x[0]));
const expectIDs=new Set(EXPECTATIONS.map(x=>x[0]));
const availableTimeIDs=new Set(['weekday_evening','weekend_morning','weekend_afternoon','weekend_evening','flexible']);
export const EMAIL_PATTERN=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export function cleanEmail(v){return String(v||"").trim().toLowerCase()}
export function emailHint(v){
 const email=cleanEmail(v);if(!email)return "请输入邮箱";
 if(!EMAIL_PATTERN.test(email)||email.length>254)return "邮箱格式不完整，请检查";
 const domain=email.split("@")[1];
 if(["gmail.con","gamil.com","gmial.com"].includes(domain))return "是否想输入 gmail.com？";
 if(["outlook.con","hotmial.com"].includes(domain))return "请检查邮箱域名拼写";
 if(domain.endsWith(".invalid")||domain.endsWith(".test")||domain.endsWith(".local")||domain.endsWith(".example"))return "该邮箱域名不能用于正式收件";
 return "";
}
export function selectedValues(root,name,allowed){return [...root.querySelectorAll('input[name="'+name+'"]:checked')].map(x=>x.value).filter(x=>allowed.has(x))}
export function getTopics(root){return selectedValues(root,"dm-topic",topicIDs)}
export function getExpectations(root){return selectedValues(root,"dm-expect",expectIDs)}
export function safeString(v,max=180){return String(v||"").trim().slice(0,max)}
function sanitizeAvailability(timeZone,preferredTimes){
 const time_zone=safeString(timeZone,80)||null;
 if(time_zone){
  try{new Intl.DateTimeFormat('en-US',{timeZone:time_zone}).format(new Date())}
  catch{throw Error("请选择有效的时区。")}
 }
 const times=[...new Set((Array.isArray(preferredTimes)?preferredTimes:[]).filter(x=>availableTimeIDs.has(x)))];
 return {time_zone,preferred_times:times.includes('flexible')?['flexible']:times};
}
export async function currentMember(){
 const {data:{session},error}=await supabase.auth.getSession();
 if(error)throw error;
 if(!session)return {session:null,member:null};
 const fields="user_id,email,display_name,topics,expectations,custom_topic,custom_expectation,current_ai_work,next_ai_goal,time_zone,preferred_times,consent,created_at";
 // A returned email login has a new Auth user ID if the original signup was
 // anonymous. Prefer the verified email's existing intake row; access is
 // permitted only by the database's verified-email RLS policy.
 const email=session.user?.email_confirmed_at?cleanEmail(session.user.email):"";
 if(email){
  const byEmail=await supabase.from("dm_member_intake").select(fields).eq("email",email).maybeSingle();
  if(byEmail.error)throw byEmail.error;
  if(byEmail.data)return {session,member:byEmail.data};
 }
 const own=await supabase.from("dm_member_intake").select(fields).eq("user_id",session.user.id).maybeSingle();
 if(own.error)throw own.error;
 return {session,member:own.data||null};
}
export async function registerMember({email,topics=[],expectations=[],custom_topic="",custom_expectation="",current_ai_work="",next_ai_goal="",time_zone,preferred_times,consent=false}){
 email=cleanEmail(email);
 const problem=emailHint(email);
 if(problem)throw Error(problem);
 if(!consent)throw Error("请同意接收相关社区邮件后继续。");
 const availability=sanitizeAvailability(time_zone,preferred_times);
 const {session,member}=await currentMember();
 if(member){
  if(member.email!==email)throw Error("当前浏览器已有 designdran Profile。请使用右上角 Profile 查看和修改；邮箱找回尚未开放，请勿登出。");
  // Existing browser sessions must update their interests, not merely show a
  // misleading 'saved' success while silently returning the old profile.
  const selected=[...new Set(topics.filter(x=>topicIDs.has(x)))];
  const interests=[...new Set(expectations.filter(x=>expectIDs.has(x)))];
  const change={
   topics:selected.length?selected:member.topics,
   expectations:interests.length?interests:member.expectations,
   custom_topic:safeString(custom_topic),
   custom_expectation:safeString(custom_expectation),
   current_ai_work:safeString(current_ai_work)||member.current_ai_work,
   next_ai_goal:safeString(next_ai_goal)||member.next_ai_goal,
   updated_at:new Date().toISOString()
  };
  if(time_zone!==undefined)change.time_zone=availability.time_zone;
  if(preferred_times!==undefined)change.preferred_times=availability.preferred_times;
  const {data,error}=await supabase.from("dm_member_intake").update(change).eq("user_id",member.user_id).select().single();
  if(error)throw Error("暂时无法更新关注话题："+error.message);
  return data;
 }
 let user=session?.user,startedAnonymous=false;
 if(!user){
  const {data,error}=await supabase.auth.signInAnonymously();
  if(error)throw Error("当前项目未开放免邮箱确认注册："+error.message);
  user=data.user;startedAnonymous=true;
 }
 const selected=[...new Set(topics.filter(x=>topicIDs.has(x)))];
 const interests=[...new Set(expectations.filter(x=>expectIDs.has(x)))];
 const row={user_id:user.id,email,display_name:"我的 designdran",topics:selected,
  expectations:interests,custom_topic:safeString(custom_topic),
  custom_expectation:safeString(custom_expectation),current_ai_work:safeString(current_ai_work),
  next_ai_goal:safeString(next_ai_goal),time_zone:availability.time_zone,preferred_times:availability.preferred_times,consent:true,locale:"zh"};
 const {data,error}=await supabase.from("dm_member_intake").insert(row).select().single();
 if(error){
  if(startedAnonymous)await supabase.auth.signOut();
  if(error.code==="23505")throw Error("此邮箱已经注册 designdran。邮箱找回暂未开放，请使用创建 Profile 时的原浏览器继续访问。");
  throw Error("暂时无法保存账号："+error.message);
 }
 try{localStorage.removeItem("dm_pending_topics")}catch{}
 return data;
}
export async function requestEmailLogin(rawEmail){
 const email=cleanEmail(rawEmail);
 const problem=emailHint(email);if(problem)throw Error(problem);
 // It is not safe to expose registered addresses before verifying mailbox ownership.
 const redirect=new URL("./profile-live.html",location.href).href;
 const {error}=await supabase.auth.signInWithOtp({
  email,options:{emailRedirectTo:redirect,shouldCreateUser:true}
 });
 if(error)throw Error("无法发送登录邮件："+error.message);
 return true;
}
// Supports both an emailed magic link and a six-digit email OTP, depending
// on the Supabase Auth email template configured for this project.
export async function verifyEmailLogin(rawEmail,rawCode){
 const email=cleanEmail(rawEmail);
 const token=String(rawCode||"").replace(/\s/g,"").trim();
 const problem=emailHint(email);if(problem)throw Error(problem);
 if(!/^\d{6,8}$/.test(token))throw Error("请输入邮件中的 6–8 位验证码。");
 const {data,error}=await supabase.auth.verifyOtp({email,token,type:"email"});
 if(error)throw Error("验证码未通过，请检查是否过期或输入有误："+error.message);
 if(!data.session)throw Error("验证未完成，请尝试邮件中的登录链接。");
 return data.session;
}
export async function logoutMember(){const {error}=await supabase.auth.signOut();if(error)throw error;}
export function optionLabels(host,entries,name,preselected=[]){
 host.replaceChildren();
 const preset=new Set(preselected);
 for(const [id,label] of entries){
  const wrapper=document.createElement("label");wrapper.className="dm-option-pill";
  const input=document.createElement("input");input.type="checkbox";input.name=name;input.value=id;input.checked=preset.has(id);
  const text=document.createElement("span");text.textContent=label;
  wrapper.append(input,text);host.append(wrapper);
 }
}