import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const URL="https://khhfxkrwgcckgqupncyw.supabase.co";
const KEY="sb_publishable_oXnMd_aF95wYTPcq6TwGVg_alaNdfTH";
export const supabase=createClient(URL,KEY);
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
export async function currentMember(){
 const {data:{session},error}=await supabase.auth.getSession();
 if(error)throw error;
 if(!session)return {session:null,member:null};
 const {data,error:dbError}=await supabase.from("dm_member_intake").select("user_id,email,display_name,topics,expectations,custom_topic,custom_expectation,current_ai_work,next_ai_goal,consent,created_at").limit(1).maybeSingle();
 if(dbError)throw dbError;
 return {session,member:data||null};
}
export async function registerMember({email,topics=[],expectations=[],custom_topic="",custom_expectation="",current_ai_work="",next_ai_goal="",consent=false}){
 email=cleanEmail(email);
 const problem=emailHint(email);
 if(problem)throw Error(problem);
 if(!consent)throw Error("请同意接收相关社区邮件后继续。");
 const {session,member}=await currentMember();
 if(member){if(member.email===email)return member;throw Error("当前浏览器已有登录账号，请先登出再注册。")}
 let user=session?.user,startedAnonymous=false;
 if(!user){
  const {data,error}=await supabase.auth.signInAnonymously();
  if(error)throw Error("当前项目未开放免邮箱确认注册："+error.message);
  user=data.user;startedAnonymous=true;
 }
 const selected=[...new Set(topics.filter(x=>topicIDs.has(x)))];
 const interests=[...new Set(expectations.filter(x=>expectIDs.has(x)))];
 const row={user_id:user.id,email,display_name:"我的 Design Matters",topics:selected,
  expectations:interests,custom_topic:safeString(custom_topic),
  custom_expectation:safeString(custom_expectation),current_ai_work:safeString(current_ai_work),
  next_ai_goal:safeString(next_ai_goal),consent:true,locale:"zh"};
 const {data,error}=await supabase.from("dm_member_intake").insert(row).select().single();
 if(error){
  if(startedAnonymous)await supabase.auth.signOut();
  if(error.code==="23505")throw Error("此邮箱已经注册 Design Matters，请使用右上角 Profile → 登录，通过邮件验证找回账号。");
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