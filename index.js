export default {
  async fetch(request, env) {
    const url = new URL(request.url), path = url.pathname;
    try {
      if (path === "/api/auth" && request.method === "POST") return await auth(request, env);
      if (path === "/api/auth" && request.method === "GET") return json({ok: await validSession(request, env)});
      if (path === "/api/products" && request.method === "GET") return json(await listProducts(env));
      if (path === "/api/products" && request.method === "POST") return requireAdmin(request, env, () => createProduct(request, env));
      const pm = path.match(/^\/api\/products\/([^/]+)$/);
      if (pm && request.method === "PUT") return requireAdmin(request, env, () => updateProduct(request, env, pm[1]));
      if (pm && request.method === "DELETE") return requireAdmin(request, env, () => deleteProduct(env, pm[1]));
      if (path === "/api/categories" && request.method === "GET") return json(await listCategories(env));
      if (path === "/api/categories" && request.method === "POST") return requireAdmin(request, env, () => createCategory(request, env));
      const cm = path.match(/^\/api\/categories\/([^/]+)$/);
      if (cm && request.method === "DELETE") return requireAdmin(request, env, () => deleteCategory(env, cm[1]));
      return env.ASSETS.fetch(request);
    } catch (e) { return json({error:e?.message || "Server error"},500); }
  }
};

const COOKIE="sq_session";
function json(x,status=200){return new Response(JSON.stringify(x),{status,headers:{"content-type":"application/json; charset=utf-8"}})}
async function auth(req,env){
  const b=await req.json().catch(()=>({}));
  if(!b.password || b.password!==env.ADMIN_PASSWORD) return json({ok:false,error:"رمز عبور اشتباه است"},401);
  const token=await sign(String(Date.now()+86400000),env.SESSION_SECRET||env.ADMIN_PASSWORD);
  return new Response(JSON.stringify({ok:true}),{headers:{"content-type":"application/json; charset=utf-8","set-cookie":`${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`}});
}
async function requireAdmin(req,env,fn){return await validSession(req,env)?fn():json({error:"Unauthorized"},401)}
async function validSession(req,env){
  const m=(req.headers.get("cookie")||"").match(new RegExp(COOKIE+"=([^;]+)")); if(!m)return false;
  try{return Number(await verify(m[1],env.SESSION_SECRET||env.ADMIN_PASSWORD))>Date.now()}catch{return false}
}
async function sign(v,s){
  const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(s),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const sig=await crypto.subtle.sign("HMAC",k,new TextEncoder().encode(v));
  let x=""; for(const b of new Uint8Array(sig))x+=String.fromCharCode(b);
  return v+"."+btoa(x).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
async function verify(t,s){const i=t.lastIndexOf(".");if(i<1)throw Error("bad token");const v=t.slice(0,i),e=await sign(v,s);if(e!==t)throw Error("bad signature");return v}
async function listProducts(env){const r=await env.DB.prepare("SELECT p.*,c.name category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id ORDER BY p.created_at DESC").all();return r.results||[]}
async function createProduct(req,env){const b=await req.json(),id=crypto.randomUUID();await env.DB.prepare("INSERT INTO products(id,name,category_id,price,old_price,discount,image,description,active,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)").bind(id,b.name||"",b.category_id||null,+b.price||0,+b.old_price||0,+b.discount||0,b.image||"",b.description||"",b.active===false?0:1,Date.now()).run();return json({ok:true,id})}
async function updateProduct(req,env,id){const b=await req.json();await env.DB.prepare("UPDATE products SET name=?,category_id=?,price=?,old_price=?,discount=?,image=?,description=?,active=? WHERE id=?").bind(b.name||"",b.category_id||null,+b.price||0,+b.old_price||0,+b.discount||0,b.image||"",b.description||"",b.active===false?0:1,id).run();return json({ok:true})}
async function deleteProduct(env,id){await env.DB.prepare("DELETE FROM products WHERE id=?").bind(id).run();return json({ok:true})}
async function listCategories(env){const r=await env.DB.prepare("SELECT * FROM categories ORDER BY name").all();return r.results||[]}
async function createCategory(req,env){const b=await req.json(),id=crypto.randomUUID();await env.DB.prepare("INSERT INTO categories(id,name,slug) VALUES(?,?,?)").bind(id,b.name||"",b.slug||b.name||"").run();return json({ok:true,id})}
async function deleteCategory(env,id){await env.DB.prepare("DELETE FROM categories WHERE id=?").bind(id).run();return json({ok:true})}
