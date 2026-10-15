import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@^9";

// Never accept a recipient address from the browser: send only to the
// already-saved member record belonging to a valid Supabase Auth session.
const origin = "https://crw0712-hub.github.io";
const cors = {
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const sender = "designmatters26@gmail.com";
const table = "dm_welcome_email_deliveries";
const reply = (status, payload) => new Response(JSON.stringify(payload), {
  status, headers: {...cors, "Content-Type":"application/json; charset=utf-8"}
});
const htmlPromise = Deno.readTextFile(new URL("./welcome.html", import.meta.url));
const textPromise = Deno.readTextFile(new URL("./welcome.txt", import.meta.url));

Deno.serve(async req => {
  if(req.method === "OPTIONS")return new Response(null,{status:204,headers:cors});
  if(req.method !== "POST")return reply(405,{error:"Method not allowed"});
  if(req.headers.get("origin") !== origin)return reply(403,{error:"Origin not allowed"});

  const endpoint = Deno.env.get("SUPABASE_URL");
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY");
  const adminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const smtpPassword = Deno.env.get("DM_SMTP_APP_PASSWORD");
  if(!endpoint || !publicKey || !adminKey)return reply(503,{error:"Backend is not configured"});
  if(!smtpPassword)return reply(503,{error:"Welcome email delivery is pending SMTP setup"});

  const jwt=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  if(!jwt || !jwt.includes("."))return reply(401,{error:"Unauthorized"});
  const memberClient=createClient(endpoint,publicKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const verified=await memberClient.auth.getUser(jwt);
  if(verified.error || !verified.data?.user)return reply(401,{error:"Unauthorized"});
  const user=verified.data.user;
  const admin=createClient(endpoint,adminKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const lookup=await admin.from("dm_member_intake").select("user_id,email").eq("user_id",user.id).maybeSingle();
  if(lookup.error)return reply(500,{error:"Member lookup failed"});
  if(!lookup.data?.email)return reply(404,{error:"No profile is linked to this session"});
  const email=String(lookup.data.email).trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))return reply(400,{error:"Invalid recipient"});

  // Unique primary key is the lock. A second request cannot send again.
  const claim=await admin.from(table).insert({user_id:user.id,email,status:"sending",attempts:1}).select("status").maybeSingle();
  if(claim.error){
    if(claim.error.code !== "23505")return reply(500,{error:"Unable to claim welcome delivery"});
    const previous=await admin.from(table).select("status,attempts").eq("user_id",user.id).maybeSingle();
    if(previous.error)return reply(500,{error:"Unable to read delivery status"});
    if(previous.data?.status==="sent")return reply(200,{status:"already_sent"});
    if(previous.data?.status!=="failed")return reply(200,{status:"in_progress"});
    if(previous.data.attempts>=3)return reply(429,{error:"Delivery retry limit reached"});
    const retry=await admin.from(table).update({
      status:"sending", attempts:previous.data.attempts+1,
      last_error:null,updated_at:new Date().toISOString()
    }).eq("user_id",user.id).eq("status","failed").select("status").maybeSingle();
    if(retry.error)return reply(500,{error:"Unable to retry welcome delivery"});
    if(!retry.data)return reply(200,{status:"in_progress"});
  }

  try{
    const [html,text]=await Promise.all([htmlPromise,textPromise]);
    const mailer=nodemailer.createTransport({
      host:"smtp.gmail.com",port:465,secure:true,
      auth:{user:sender,pass:smtpPassword.replace(/\s/g,"")},
      connectionTimeout:12000,greetingTimeout:12000,socketTimeout:20000
    });
    await mailer.sendMail({
      from:'"Design Matters" <'+sender+'>',to:email,
      subject:"欢迎加入 Design Matters｜好的讨论，从这里继续",
      html,text
    });
    const marked=await admin.from(table).update({
      status:"sent",sent_at:new Date().toISOString(),
      last_error:null,updated_at:new Date().toISOString()
    }).eq("user_id",user.id).eq("status","sending");
    if(marked.error)console.error("Delivery sent but idempotency update failed:",marked.error.message);
    return reply(200,{status:"sent"});
  }catch(error){
    await admin.from(table).update({
      status:"failed",last_error:String(error?.message||"SMTP delivery error").slice(0,250),
      updated_at:new Date().toISOString()
    }).eq("user_id",user.id).eq("status","sending");
    console.error("Welcome delivery error:",String(error?.message||error));
    return reply(502,{error:"Welcome delivery failed; registration remains saved"});
  }
});
