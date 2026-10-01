import {createClient} from "@supabase/supabase-js";
import {ITEMS} from "../src/data";
import {defaultPlayer} from "../src/store";

const MAX_PITY={epic:100,legendary:250,mythic:500} as const;
const ADMIN_PASSWORD=String(process.env.MDP||"").trim().toLowerCase();

function cloneDefault(username:string){
 return JSON.parse(JSON.stringify({...defaultPlayer,username,equippedItems:[],equipped:undefined}));
}

async function getAdminUser(req:any,password:string){
 const url=process.env.URL;
 const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!serviceKey) throw new Error("Admin non configuré : URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
 const token=String(req.headers?.authorization||"").replace(/^Bearer\s+/i,"").trim();
 if(!token) throw new Error("Session requise.");
 const client=createClient(url,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data,error}=await client.auth.getUser(token);
 if(error||!data.user) throw new Error("Session invalide.");
 if(!ADMIN_PASSWORD) throw new Error("Variable MDP manquante sur le serveur.");
 if(String(password||"").trim().toLowerCase()!==ADMIN_PASSWORD) throw new Error("Mot de passe admin incorrect.");
 return {client,user:data.user};
}

async function findUser(client:any,username:string){
 const wanted=username.trim().toLowerCase();
 const {data,error}=await client.auth.admin.listUsers({page:1,perPage:1000});
 if(error) throw error;
 return data.users.find((u:any)=>{
   const name=String(u.user_metadata?.username||u.email?.split("@")[0]||"").toLowerCase();
   return name===wanted;
 });
}

function mergeSave(raw:any,username:string){
 const saved=raw&&typeof raw==="object"?raw:{};
 const base=raw?{...cloneDefault(username),...saved}:cloneDefault(username);
 const equippedItems=Array.isArray(saved.equippedItems)
   ? saved.equippedItems.filter(Boolean)
   : (saved.equipped?[saved.equipped]:[]);
 return {
   ...base,
   username,
   equippedItems,
   equipped:equippedItems[0],
   inventory:Array.isArray(saved.inventory)?saved.inventory:base.inventory,
   pity:{
     epic:Math.min(MAX_PITY.epic,Math.max(0,Number(saved.pity?.epic??base.pity.epic))),
     legendary:Math.min(MAX_PITY.legendary,Math.max(0,Number(saved.pity?.legendary??base.pity.legendary))),
     mythic:Math.min(MAX_PITY.mythic,Math.max(0,Number(saved.pity?.mythic??base.pity.mythic)))
   }
 };
}

export default async function handler(req:any,res:any){
 if(req.method!=="POST") return res.status(405).json({error:"Méthode non autorisée."});
 try{
   const body=typeof req.body==="string"?JSON.parse(req.body):req.body||{};
   const {client}=await getAdminUser(req,String(body.adminPassword||""));
   if(body.action==="check") return res.status(200).json({isAdmin:true});

   if(body.action!=="grant") return res.status(400).json({error:"Action inconnue."});
   const targetUsername=String(body.targetUsername||"").trim();
   if(!targetUsername) return res.status(400).json({error:"Pseudo cible requis."});
   const target=await findUser(client,targetUsername);
   if(!target) return res.status(404).json({error:"Joueur introuvable."});

   const username=String(target.user_metadata?.username||target.email?.split("@")[0]||targetUsername);
   const save=mergeSave(target.user_metadata?.anime_rng_save,username);

   const coins=Math.max(0,Number(body.coins||0));
   const gems=Math.max(0,Number(body.gems||0));
   const tickets=Math.max(0,Number(body.tickets||0));
   const xp=Math.max(0,Number(body.xp||0));
   save.coins+=coins;
   save.gems+=gems;
   save.tickets+=tickets;
   save.xp+=xp;

   const auraId=String(body.auraId||"").trim();
   const auraQuantity=Math.min(100,Math.max(0,Math.floor(Number(body.auraQuantity||0))));
   if(auraQuantity>0){
     const aura=ITEMS.find(i=>i.id===auraId);
     if(!aura) return res.status(400).json({error:"Aura invalide."});
     for(let i=0;i<auraQuantity;i++){
       save.inventory.push({id:"admin-"+Date.now()+"-"+Math.random().toString(36).slice(2),itemId:aura.id,locked:false,favorite:false,obtainedAt:Date.now()});
     }
     save.inventoryCapacity=Math.max(Number(save.inventoryCapacity)||50,save.inventory.length);
   }

   for(const key of ["epic","legendary","mythic"] as const){
     const value=Number(body["pity_"+key]);
     if(Number.isFinite(value)&&value>=0) save.pity[key]=Math.min(MAX_PITY[key],Math.floor(value));
   }

   const currentZones=Array.isArray(save.zones)?save.zones:[];
   if(body.unlockAllZones===true){
     const {ZONES}=await import("../src/data");
     save.zones=[...new Set(["Hidden Village",...ZONES.map((z:any)=>z.name),...currentZones])];
   }

   const {data,error}=await client.auth.admin.updateUserById(target.id,{user_metadata:{...target.user_metadata,username,anime_rng_save:save}});
   if(error) throw error;

   return res.status(200).json({
     ok:true,
     target:{id:target.id,username},
     save,
     message:"Récompense appliquée."
   });
 }catch(error:any){
   const message=error?.message||"Erreur serveur.";
   const code=message==="Accès admin refusé."?403:(message==="Joueur introuvable."?404:400);
   return res.status(code).json({error:message});
 }
}