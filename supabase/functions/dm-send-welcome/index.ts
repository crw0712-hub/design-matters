import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@^9";

// Never accept a recipient address from the browser: send only to the
// already-saved member record belonging to a valid Supabase Auth session.
const allowedOrigins = new Set(["https://designdran.com","https://www.designdran.com","https://crw0712-hub.github.io"]);
const corsFor = (req) => ({
  "Access-Control-Allow-Origin": allowedOrigins.has(req.headers.get("origin")) ? req.headers.get("origin") : "https://designdran.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});
const sender = "designmatters26@gmail.com";
const table = "dm_welcome_email_deliveries";
const reply = (req, status, payload) => new Response(JSON.stringify(payload), {
  status, headers: {...corsFor(req), "Content-Type":"application/json; charset=utf-8"}
});
// Embed templates at build time: hosted Edge Functions cannot reliably read
// uploaded sibling files through Deno.readTextFile on worker boot.
const welcomeHtml = "<!doctype html>\n<html lang=\"zh-CN\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<meta name=\"color-scheme\" content=\"light\">\n<title>欢迎加入 designdran</title>\n<style>\n@media only screen and (max-width:620px){\n.outer{padding:12px!important}.shell{width:100%!important}\n.header-cell{padding:22px 24px!important}.content-cell{padding:44px 26px 36px!important}\n.heading{font-size:37px!important;line-height:1.24!important;letter-spacing:-1.5px!important}\n.intro{font-size:15px!important;line-height:1.9!important}\n.benefits-cell{padding:0 26px 38px!important}.button-cell{padding:0 26px 45px!important}\n.footer-cell{padding:25px 26px!important}.wordmark{font-size:13px!important}\n}\n</style>\n</head>\n<body style=\"margin:0;padding:0;background-color:#f5f3ec;color:#0a0a0a;font-family:Arial,'Helvetica Neue','PingFang SC','Microsoft YaHei',sans-serif;-webkit-text-size-adjust:100%\">\n<div style=\"display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all\">你的关注话题已收到。未来，我们会与你分享相关圆桌动态及值得留下的讨论总结。</div>\n<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"width:100%;border-collapse:collapse;background:#f5f3ec\">\n<tr><td class=\"outer\" align=\"center\" style=\"padding:42px 20px 44px\">\n<table role=\"presentation\" class=\"shell\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"620\" style=\"max-width:620px;width:620px;border-collapse:separate;border:1.5px solid #0a0a0a;border-radius:21px;overflow:hidden;background:#fbfaf6\">\n<tr><td class=\"header-cell\" style=\"padding:27px 38px;border-bottom:1px solid #0a0a0a\">\n<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"width:100%;border-collapse:collapse\"><tr>\n<td width=\"44\" valign=\"middle\"><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"39\" height=\"39\" style=\"width:39px;height:39px;background:#b8ff17;border:1.5px solid #0a0a0a;border-radius:10px\"><tr><td align=\"center\" valign=\"middle\" style=\"font-size:23px;font-weight:900;line-height:39px;color:#0a0a0a\">D</td></tr></table></td>\n<td valign=\"middle\" class=\"wordmark\" style=\"padding-left:10px;font-size:15px;font-weight:900;letter-spacing:.7px;color:#0a0a0a\">designdran</td>\n<td align=\"right\" valign=\"middle\" style=\"font-size:9px;font-weight:700;letter-spacing:1.2px;white-space:nowrap;color:#716c64\">AI × DESIGN</td>\n</tr></table></td></tr>\n<tr><td class=\"content-cell\" style=\"padding:54px 48px 40px\">\n<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"width:100%;border-collapse:collapse\">\n<tr><td style=\"padding:0 0 28px;font-size:10px;line-height:1.3;font-weight:800;letter-spacing:2px;color:#706a62\">01 / WELCOME TO THE CONVERSATION</td></tr>\n<tr><td class=\"heading\" style=\"padding:0 0 28px;font-size:49px;line-height:1.2;letter-spacing:-2px;font-weight:900;color:#0a0a0a\">好的讨论，<br>从这里继续<span style=\"color:#699c00\">。</span></td></tr>\n<tr><td style=\"padding:0 0 26px\"><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr><td style=\"padding:8px 13px 8px 11px;background:#b8ff17;border:1px solid #0a0a0a;border-radius:30px;font-size:11px;font-weight:800;color:#0a0a0a\">✓ &nbsp; 欢迎加入 designdran</td></tr></table></td></tr>\n<tr><td class=\"intro\" style=\"font-size:16px;line-height:1.94;color:#35322d\">感谢你加入 designdran。<br>我们已记录你关注的 AI × Design 话题。这里不是另一个信息流，而是一个让真实实践、不同判断和有价值的同行持续相遇的地方。</td></tr>\n</table></td></tr>\n<tr><td style=\"padding:0 48px\"><div style=\"height:1px;background:#0a0a0a;font-size:0;line-height:0\">&nbsp;</div></td></tr>\n<tr><td class=\"benefits-cell\" style=\"padding:36px 48px 44px\"><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"border-collapse:collapse;width:100%\">\n<tr><td colspan=\"2\" style=\"padding:0 0 23px;font-size:10px;font-weight:800;letter-spacing:1.6px;color:#706a62\">02 / WHAT COMES NEXT</td></tr>\n<tr><td valign=\"top\" width=\"62\" style=\"width:62px;padding:0 0 23px;font-size:12px;line-height:1.7;font-weight:800;color:#7e796e\">01</td><td valign=\"top\" style=\"padding:0 0 23px\"><div style=\"font-size:15px;line-height:1.5;font-weight:800;color:#0a0a0a\">与你相关的圆桌动态</div><div style=\"padding-top:6px;font-size:13px;line-height:1.85;color:#6b665e\">有与你关注方向相关的新讨论时，我们会与你分享活动和参与方式。</div></td></tr><tr><td colspan=\"2\" style=\"border-top:1px solid #dad6cf;height:21px;font-size:0\">&nbsp;</td></tr>\n<tr><td valign=\"top\" width=\"62\" style=\"width:62px;padding:0 0 23px;font-size:12px;line-height:1.7;font-weight:800;color:#7e796e\">02</td><td valign=\"top\" style=\"padding:0 0 23px\"><div style=\"font-size:15px;line-height:1.5;font-weight:800;color:#0a0a0a\">值得留下的讨论总结</div><div style=\"padding-top:6px;font-size:13px;line-height:1.85;color:#6b665e\">不止记录结论，也保留讨论中重要的分歧、判断与尚未解决的问题。</div></td></tr><tr><td colspan=\"2\" style=\"border-top:1px solid #dad6cf;height:21px;font-size:0\">&nbsp;</td></tr>\n<tr><td valign=\"top\" width=\"62\" style=\"width:62px;padding:0;font-size:12px;line-height:1.7;font-weight:800;color:#7e796e\">03</td><td valign=\"top\" style=\"padding:0\"><div style=\"font-size:15px;line-height:1.5;font-weight:800;color:#0a0a0a\">持续连接的同行网络</div><div style=\"padding-top:6px;font-size:13px;line-height:1.85;color:#6b665e\">和来自不同产品、团队与组织的设计实践者保持连接，交换真正有用的经验。</div></td></tr>\n</table></td></tr>\n<tr><td class=\"button-cell\" style=\"padding:0 48px 52px\">\n<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"width:100%;border-collapse:separate\"><tr><td align=\"center\" style=\"border-radius:999px;background:#0a0a0a\">\n<a href=\"https://designdran.com/profile-live.html\" style=\"display:block;padding:17px 20px;text-decoration:none;font-size:13px;font-weight:900;line-height:1.5;letter-spacing:.3px;color:#ffffff\">查看我的 Profile &nbsp; ↗</a>\n</td></tr></table>\n<div style=\"padding-top:16px;text-align:center;font-size:11px;line-height:1.7;color:#79746b\">未来有值得继续的讨论，我们会再见。</div>\n</td></tr>\n<tr><td class=\"footer-cell\" style=\"padding:31px 48px 34px;background:#edeae2;border-top:1px solid #d2cec5\">\n<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"width:100%;border-collapse:collapse\"><tr>\n<td valign=\"top\" style=\"font-size:11px;line-height:1.8;color:#767168\">designdran<br><span style=\"font-size:10px;letter-spacing:.35px\">SHARED CHANGE. DIFFERENT SYSTEMS.</span></td>\n<td align=\"right\" valign=\"top\" style=\"font-size:10px;line-height:1.9;color:#767168\">这是一封注册感谢邮件。<br><a href=\"https://designdran.com/\" style=\"color:#34312c;text-decoration:underline\">访问 designdran</a></td>\n</tr></table>\n</td></tr>\n</table>\n<div style=\"max-width:620px;margin:17px auto 0;font-size:10px;line-height:1.7;text-align:center;color:#8d887f\">© designdran · Curated conversations on AI × Design</div>\n</td></tr></table>\n</body></html>";
const welcomeText = "主题：欢迎加入 designdran｜好的讨论，从这里继续\n发件人：designdran <designmatters26@gmail.com>\n\ndesigndran / AI × DESIGN\n\n好的讨论，从这里继续。\n\n感谢你加入 designdran。\n\n我们已记录你关注的 AI × Design 话题。这里不是另一个信息流，而是一个让真实实践、不同判断和有价值的同行持续相遇的地方。\n\n01 / 与你相关的圆桌动态\n有与你关注方向相关的新讨论时，我们会与你分享活动和参与方式。\n\n02 / 值得留下的讨论总结\n不止记录结论，也保留讨论中重要的分歧、判断与尚未解决的问题。\n\n03 / 持续连接的同行网络\n和来自不同产品、团队与组织的设计实践者保持连接，交换真正有用的经验。\n\n查看我的 Profile：\nhttps://designdran.com/profile-live.html\n\n未来有值得继续的讨论，我们会再见。\n\ndesigndran\nSHARED CHANGE. DIFFERENT SYSTEMS.\n\n这是一封注册感谢邮件。";

Deno.serve(async req => {
  if(!allowedOrigins.has(req.headers.get("origin")))return reply(req,403,{error:"Origin not allowed"});
  if(req.method === "OPTIONS")return new Response(null,{status:204,headers:corsFor(req)});
  if(req.method !== "POST")return reply(req,405,{error:"Method not allowed"});

  const endpoint = Deno.env.get("SUPABASE_URL");
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY");
  const adminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const smtpPassword = Deno.env.get("DM_SMTP_APP_PASSWORD");
  if(!endpoint || !publicKey || !adminKey)return reply(req,503,{error:"Backend is not configured"});
  if(!smtpPassword)return reply(req,503,{error:"Welcome email delivery is pending SMTP setup"});

  const jwt=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  if(!jwt || !jwt.includes("."))return reply(req,401,{error:"Unauthorized"});
  const memberClient=createClient(endpoint,publicKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const verified=await memberClient.auth.getUser(jwt);
  if(verified.error || !verified.data?.user)return reply(req,401,{error:"Unauthorized"});
  const user=verified.data.user;
  const admin=createClient(endpoint,adminKey,{auth:{persistSession:false,autoRefreshToken:false}});
  let lookup=await admin.from("dm_member_intake").select("user_id,email,created_at").eq("user_id",user.id).maybeSingle();
  if(lookup.error)return reply(req,500,{error:"Member lookup failed"});
  // Supabase OTP users may have a different Auth UID from an early-access
  // anonymous signup. A verified email is safe to use for recovery.
  if(!lookup.data && user.email_confirmed_at && user.email){
    lookup=await admin.from("dm_member_intake")
      .select("user_id,email,created_at").eq("email",String(user.email).trim().toLowerCase()).maybeSingle();
    if(lookup.error)return reply(req,500,{error:"Verified email member lookup failed"});
  }
  if(!lookup.data?.email)return reply(req,404,{error:"No profile is linked to this session"});
  const ownerId=lookup.data.user_id;
  // Old members changing interests must not unexpectedly receive a new welcome.
  // Only members registered in the last day can request a first welcome or retry.
  const joinedAt=Date.parse(lookup.data.created_at||"");
  if(!Number.isFinite(joinedAt)||joinedAt>Date.now()+120000||Date.now()-joinedAt>24*60*60*1000){
    return reply(req,200,{status:"not_a_new_registration"});
  }
  const email=String(lookup.data.email).trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))return reply(req,400,{error:"Invalid recipient"});

  // Unique primary key is the lock. A second request cannot send again.
  const claim=await admin.from(table).insert({user_id:ownerId,email,status:"sending",attempts:1}).select("status").maybeSingle();
  if(claim.error){
    if(claim.error.code !== "23505")return reply(req,500,{error:"Unable to claim welcome delivery"});
    const previous=await admin.from(table).select("status,attempts").eq("user_id",ownerId).maybeSingle();
    if(previous.error)return reply(req,500,{error:"Unable to read delivery status"});
    if(previous.data?.status==="sent")return reply(req,200,{status:"already_sent"});
    if(previous.data?.status!=="failed")return reply(req,200,{status:"in_progress"});
    if(previous.data.attempts>=3)return reply(req,429,{error:"Delivery retry limit reached"});
    const retry=await admin.from(table).update({
      status:"sending", attempts:previous.data.attempts+1,
      last_error:null,updated_at:new Date().toISOString()
    }).eq("user_id",ownerId).eq("status","failed").select("status").maybeSingle();
    if(retry.error)return reply(req,500,{error:"Unable to retry welcome delivery"});
    if(!retry.data)return reply(req,200,{status:"in_progress"});
  }

  try{
    const html=welcomeHtml, text=welcomeText;
    const mailer=nodemailer.createTransport({
      host:"smtp.gmail.com",port:465,secure:true,
      auth:{user:sender,pass:smtpPassword.replace(/\s/g,"")},
      connectionTimeout:12000,greetingTimeout:12000,socketTimeout:20000
    });
    await mailer.sendMail({
      from:'"designdran" <'+sender+'>',to:email,
      subject:"欢迎加入 designdran｜好的讨论，从这里继续",
      html,text
    });
    const marked=await admin.from(table).update({
      status:"sent",sent_at:new Date().toISOString(),
      last_error:null,updated_at:new Date().toISOString()
    }).eq("user_id",ownerId).eq("status","sending");
    if(marked.error)console.error("Delivery sent but idempotency update failed:",marked.error.message);
    return reply(req,200,{status:"sent"});
  }catch(error){
    await admin.from(table).update({
      status:"failed",last_error:String(error?.message||"SMTP delivery error").slice(0,250),
      updated_at:new Date().toISOString()
    }).eq("user_id",ownerId).eq("status","sending");
    console.error("Welcome delivery error:",String(error?.message||error));
    return reply(req,502,{error:"Welcome delivery failed; registration remains saved"});
  }
});
