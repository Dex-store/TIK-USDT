// ====== CONFIG ======
const SUPABASE_URL = "PASTE_SUPABASE_URL_HERE";
const SUPABASE_ANON_KEY = "PASTE_SUPABASE_ANON_KEY_HERE";

const RECEIVER_WALLET = "0xb56a89f790060cbb0f08d02234921e5fefff11a6";
const SUPPORT_URL = "https://t.me/TIK_USDT";
const CHANNEL_URL = "PASTE_CHANNEL_LINK_HERE"; // ضع رابط قناتك هنا

const PLANS = [10,20,50,100,200];

// ====== INIT ======
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const qs = new URLSearchParams(location.search);
const ref = qs.get("ref");
document.getElementById("refInfo").textContent = ref ? `Referral: ${ref}` : "";

// Buttons
document.getElementById("supportBtn").href = SUPPORT_URL;
document.getElementById("channelBtn").href = CHANNEL_URL;

document.getElementById("receiver").textContent = RECEIVER_WALLET;

const planSelect = document.getElementById("planSelect");
PLANS.forEach(p=>{
  const opt=document.createElement("option");
  opt.value=p; opt.textContent=`${p} USDT`;
  planSelect.appendChild(opt);
});
const plansDiv = document.getElementById("plans");
PLANS.forEach(p=>{
  const el=document.createElement("span");
  el.className="btn";
  el.textContent=`${p} USDT`;
  el.onclick=()=> planSelect.value=String(p);
  plansDiv.appendChild(el);
});

// ====== AUTH ======
document.getElementById("signupBtn").onclick = async () => {
  const email = document.getElementById("suEmail").value.trim();
  const password = document.getElementById("suPass").value.trim();
  if(!email||!password) return setMsg("authMsg","أدخل البريد وكلمة المرور");

  const { error } = await supabase.auth.signUp({
    email, password,
    options: {
      data: { ref_code: ref || null } // سنقرأها في Trigger على السيرفر
    }
  });
  if(error) return setMsg("authMsg", error.message);
  setMsg("authMsg","تم إنشاء الحساب. افحص بريدك لتأكيد البريد ثم سجل الدخول.");
};

document.getElementById("signinBtn").onclick = async () => {
  const email = document.getElementById("siEmail").value.trim();
  const password = document.getElementById("siPass").value.trim();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if(error) return setMsg("authMsg", error.message);
  setMsg("authMsg","تم تسجيل الدخول ✅");
  await refreshDashboard();
};

document.getElementById("googleBtn").onclick = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
  if(error) setMsg("authMsg", error.message);
};

document.getElementById("signoutBtn").onclick = async () => {
  await supabase.auth.signOut();
  setMsg("authMsg","تم تسجيل الخروج");
  hideDash();
};

supabase.auth.onAuthStateChange(async (_event, session) => {
  if(session) await refreshDashboard();
  else hideDash();
});

// ====== DASHBOARD ACTIONS ======
document.getElementById("verifyBtn").onclick = async () => {
  const txHash = document.getElementById("txHash").value.trim();
  const plan = Number(planSelect.value);
  if(!txHash.startsWith("0x")) return setMsg("payMsg","TxHash غير صحيح");

  const { data, error } = await supabase.functions.invoke("verify_usdt", {
    body: { txHash, plan }
  });

  if(error) return setMsg("payMsg", error.message);
  if(!data?.ok) return setMsg("payMsg", data?.error || "فشل التحقق");
  setMsg("payMsg","تم التحقق وتفعيل الاشتراك ✅");
  await refreshDashboard();
};

document.getElementById("subWithBalBtn").onclick = async () => {
  const plan = Number(planSelect.value);
  const { data, error } = await supabase.functions.invoke("subscribe_with_balance", {
    body: { plan }
  });
  if(error) return setMsg("subMsg", error.message);
  if(!data?.ok) return setMsg("subMsg", data?.error || "فشل");
  setMsg("subMsg","تم الاشتراك من الرصيد ✅");
  await refreshDashboard();
};

document.getElementById("wdBtn").onclick = async () => {
  const wallet_address = document.getElementById("wdAddress").value.trim();
  const amount = Number(document.getElementById("wdAmount").value.trim());
  if(!wallet_address.startsWith("0x")) return setMsg("wdMsg","عنوان محفظة غير صحيح");
  if(!(amount>0)) return setMsg("wdMsg","أدخل مبلغ صحيح");

  const { data, error } = await supabase.functions.invoke("request_withdraw", {
    body: { wallet_address, amount }
  });
  if(error) return setMsg("wdMsg", error.message);
  if(!data?.ok) return setMsg("wdMsg", data?.error || "فشل");
  setMsg("wdMsg","تم إرسال طلب السحب ✅");
  await refreshDashboard();
};

// ====== UI HELPERS ======
function setMsg(id, txt){ document.getElementById(id).textContent = txt; }

function hideDash(){
  document.getElementById("dash").style.display="none";
  document.getElementById("signoutBtn").style.display="none";
}

async function refreshDashboard(){
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) return hideDash();

  document.getElementById("dash").style.display="block";
  document.getElementById("signoutBtn").style.display="inline-block";

  // اقرأ profile من Supabase
  const { data, error } = await supabase
    .from("profiles")
    .select("ref_code,plan_usdt,access_until,available_balance,locked_balance")
    .eq("id", user.id)
    .single();

  if(error) return setMsg("authMsg", error.message);

  document.getElementById("myPlan").textContent = data.plan_usdt ? `${data.plan_usdt} USDT` : "غير مشترك";
  document.getElementById("myUntil").textContent = data.access_until ? new Date(data.access_until).toLocaleString() : "-";
  document.getElementById("availBal").textContent = Number(data.available_balance||0).toFixed(2);
  document.getElementById("lockedBal").textContent = Number(data.locked_balance||0).toFixed(2);

  // رابط إحالة
  const base = window.location.origin + window.location.pathname;
  document.getElementById("refLink").textContent = `${base}?ref=${encodeURIComponent(data.ref_code)}`;
  }
