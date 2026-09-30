import {useEffect,useState,type CSSProperties,type Dispatch,type ReactNode,type SetStateAction} from "react";
import type {Achievement,PlayerState,Rarity,RngItem,View} from "./types";
import {ACHIEVEMENTS,CODES,DAILY_REWARD_CARDS,EVENTS,ITEMS,RARITIES,SHOP_PRODUCTS,SKILLS,TITLES,UPGRADES,ZONES} from "./data";
import {formatNumber,gainXp,isRarer,nextXp,rollRng} from "./logic/rng";
import {usePlayer,usePlayerTicker,xpPercent} from "./store";

const NAV:{id:View;label:string;icon:string}[]=[
 {id:"home",label:"Accueil",icon:"⌂"},{id:"roll",label:"Roll",icon:"✦"},{id:"collection",label:"Collection",icon:"◈"},{id:"inventory",label:"Inventaire",icon:"▦"},{id:"shop",label:"Shop",icon:"◒"},
 {id:"skills",label:"Compétences",icon:"⌘"},{id:"upgrades",label:"Améliorations",icon:"↗"},{id:"quests",label:"Quêtes",icon:"☑"},{id:"rewards",label:"Rewards",icon:"◇"},{id:"profile",label:"Profil",icon:"◎"},
 {id:"leaderboard",label:"Classement",icon:"♛"},{id:"achievements",label:"Succès",icon:"✹"},{id:"stats",label:"Stats",icon:"▥"},{id:"settings",label:"Settings",icon:"⚙"}
];
const RARITY_LIST:Rarity[]=["COMMON","UNCOMMON","RARE","EPIC","LEGENDARY","MYTHIC","DIVINE","CELESTIAL","TRANSCENDENT","SECRET"];

function App(){
 const [player,setPlayer]=usePlayer();
 usePlayerTicker(setPlayer);
 const [view,setView]=useState<View>("home");
 const [lastRoll,setLastRoll]=useState<RngItem|undefined>(()=>ITEMS.find(x=>x.id===player.equipped)||ITEMS[0]);
 const [resultOpen,setResultOpen]=useState(false);
 const [rolling,setRolling]=useState(false);
 const [autoRoll,setAutoRoll]=useState(false);
 const [banner,setBanner]=useState<RngItem["banner"]>("NORMAL");
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState<Rarity|"ALL">("ALL");
 const [notes,setNotes]=useState<{id:number;text:string;rare:boolean}[]>([]);
 const [codeOpen,setCodeOpen]=useState(false);
 const [codeInput,setCodeInput]=useState("");
 const [zoneOpen,setZoneOpen]=useState(false);
 const [tutorial,setTutorial]=useState(()=>localStorage.getItem("anime-rng-tutorial")==="done"?false:true);
 const [tutorialStep,setTutorialStep]=useState(0);
 const [selected,setSelected]=useState<string[]>([]);
 const [sellConfirm,setSellConfirm]=useState(false);

 const notify=(text:string,rare=false)=>{
   const id=Date.now()+Math.floor(Math.random()*1000);
   setNotes(n=>[...n.slice(-3),{id,text,rare}]);
   window.setTimeout(()=>setNotes(n=>n.filter(x=>x.id!==id)),3400);
 };

 const doRoll=()=>{
   if(rolling)return;
   setRolling(true);
   const result=rollRng(player,banner);
   const high=["LEGENDARY","MYTHIC","DIVINE","CELESTIAL","TRANSCENDENT","SECRET"].includes(result.rarity);
   const delay=player.settings.animations&&!player.settings.reducedMotion?(high?1250:520):90;
   window.setTimeout(()=>{
     setLastRoll(result);
     setResultOpen(true);
     const entry={id:String(Date.now())+"-"+Math.random(),itemId:result.id,locked:false,favorite:false,obtainedAt:Date.now()};
     setPlayer(p=>{
       const isNew=!p.inventory.some(e=>e.itemId===result.id);
       const inv=[...p.inventory,entry].slice(-p.inventoryCapacity);
       const epicDone=["EPIC","LEGENDARY","MYTHIC","DIVINE","CELESTIAL","TRANSCENDENT","SECRET"].includes(result.rarity);
       const legendaryDone=["LEGENDARY","MYTHIC","DIVINE","CELESTIAL","TRANSCENDENT","SECRET"].includes(result.rarity);
       const mythicDone=["MYTHIC","DIVINE","CELESTIAL","TRANSCENDENT","SECRET"].includes(result.rarity);
       let next:PlayerState={...p,
         inventory:inv,
         coins:p.coins+result.value,
         pity:{epic:epicDone?0:Math.min(100,p.pity.epic+1),legendary:legendaryDone?0:Math.min(100,p.pity.legendary+1),mythic:mythicDone?0:Math.min(100,p.pity.mythic+1)},
         stats:{...p.stats,totalRolls:p.stats.totalRolls+1,rollsToday:p.stats.rollsToday+1,coinsEarned:p.stats.coinsEarned+result.value,
           bestDenominator:Math.max(p.stats.bestDenominator,result.denominator),
           bestItemId:isRarer(result,ITEMS.find(i=>i.id===p.stats.bestItemId))?result.id:p.stats.bestItemId,
           secretsFound:p.stats.secretsFound+(result.rarity==="SECRET"?1:0),
           history:[result.id,...p.stats.history].slice(0,9)},
         quests:p.quests.map(q=>{
           if(q.claimed)return q;
           if(q.id==="daily-rolls"||q.id==="daily-rolls100"||q.id==="weekly-rolls")return {...q,progress:Math.min(q.target,q.progress+1)};
           if(q.id==="daily-epic"&&epicDone)return {...q,progress:1};
           if(q.id==="weekly-legendary"&&result.rarity==="LEGENDARY")return {...q,progress:Math.min(q.target,q.progress+1)};
           if(q.id==="weekly-mythic"&&result.rarity==="MYTHIC")return {...q,progress:1};
           return q;
         })
       };
       next=gainXp(next,Math.max(5,Math.round(9+result.power/45)));
       next.achievements=updateAchievements(next,result);
       if(isNew)notify(result.name+" ajouté à la collection !");
       if(next.level>p.level)notify("Niveau "+next.level+" débloqué !",true);
       return next;
     });
     setRolling(false);
     if(high)notify("INCROYABLE ! "+result.chanceDisplay+" — "+result.name,true);
   },delay);
 };

 useEffect(()=>{
   if(!autoRoll)return;
   const id=window.setInterval(()=>doRoll(),Math.max(220,720/player.rollSpeed));
   return()=>window.clearInterval(id);
 },[autoRoll,player.rollSpeed,player.stats.totalRolls,banner,rolling]);

 const equip=(itemId:string)=>{
   if(!player.inventory.some(e=>e.itemId===itemId)){notify("Objet non obtenu.");return;}
   setPlayer(p=>({...p,equipped:itemId,stats:{...p.stats,itemsEquipped:p.stats.itemsEquipped+1}}));
   setLastRoll(ITEMS.find(x=>x.id===itemId));
   notify("Résultat équipé !");
 };
 const favorite=(itemId:string)=>{
   setPlayer(p=>{
     const exists=p.favorites.includes(itemId);
     const favorites=exists?p.favorites.filter(id=>id!==itemId):[...p.favorites,itemId];
     return {...p,favorites,inventory:p.inventory.map(e=>e.itemId===itemId?{...e,favorite:!exists}:e)};
   });
 };
 const sell=(entryId:string)=>{
   const entry=player.inventory.find(e=>e.id===entryId);
   const item=ITEMS.find(x=>x.id===entry?.itemId);
   if(!entry||!item||entry.locked||entry.favorite){notify("Cet objet est verrouillé ou favori.");return;}
   setPlayer(p=>({...p,inventory:p.inventory.filter(e=>e.id!==entryId),coins:p.coins+item.value,stats:{...p.stats,coinsEarned:p.stats.coinsEarned+item.value,itemsSold:p.stats.itemsSold+1},quests:p.quests.map(q=>q.id==="daily-sell"?{...q,progress:Math.min(q.target,q.progress+1)}:q)}));
   notify("+"+formatNumber(item.value)+" coins");
 };
 const sellSelected=()=>{selected.forEach(sell);setSelected([]);setSellConfirm(false);};
 const claimQuest=(id:string)=>{
   const q=player.quests.find(x=>x.id===id);if(!q||q.claimed||q.progress<q.target)return;
   setPlayer(p=>({...p,coins:p.coins+q.rewardCoins,gems:p.gems+q.rewardGems,quests:p.quests.map(x=>x.id===id?{...x,claimed:true}:x),stats:{...p.stats,coinsEarned:p.stats.coinsEarned+q.rewardCoins}}));
   notify("Récompense de quête récupérée !",true);
 };
 const buyUpgrade=(id:string)=>{
   const u=UPGRADES.find(x=>x.id===id);if(!u)return;
   const level=player.upgrades[id]||0;const cost=Math.floor(u.baseCost*Math.pow(1.45,level));
   if(level>=u.maxLevel){return;} if(player.coins<cost){notify("Pas assez de coins.");return;}
   setPlayer(p=>{
     const next:PlayerState={...p,upgrades:{...p.upgrades,[id]:level+1},coins:p.coins-cost,stats:{...p.stats,coinsSpent:p.stats.coinsSpent+cost}};
     if(id==="u-luck")next.luck+=5;if(id==="u-speed")next.rollSpeed+=.03;if(id==="u-inventory")next.inventoryCapacity+=5;
     return next;
   });
   notify(u.name+" amélioré → niveau "+(level+1)+"/"+u.maxLevel,true);
 };
 const skillPoints=Math.floor(player.level/2)+3;
 const spentSkills=Object.entries(player.skills).reduce((sum,[id,l])=>sum+(SKILLS.find(x=>x.id===id)?.cost||0)*l,0);
 const buySkill=(id:string)=>{
   const s=SKILLS.find(x=>x.id===id);if(!s)return;
   const level=player.skills[id]||0;const blocked=s.requires?.some(r=>(player.skills[r]||0)<1);
   if(blocked){notify("Prérequis non rempli.");return;}
   if(level>=s.maxLevel||skillPoints-spentSkills<s.cost*(level+1)){notify("Pas assez de points.");return;}
   setPlayer(p=>({...p,skills:{...p.skills,[id]:level+1}}));notify(s.name+" débloqué !",true);
 };
 const buyShop=(id:string)=>{
   const prod=SHOP_PRODUCTS.find(x=>x.id===id);if(!prod)return;
   const currency=prod.currency as "coins"|"gems";if(player[currency]<prod.price){notify("Pas assez de "+(currency==="coins"?"coins":"gems")+".");return;}
   setPlayer(p=>{
     let next:PlayerState={...p,[currency]:p[currency]-prod.price,stats:{...p.stats,coinsSpent:p.stats.coinsSpent+(currency==="coins"?prod.price:0)}};
     const a=prod.action.split(":");
     if(a[0]==="luck")next.luck+=Number(a[1]);
     if(a[0]==="slots")next.inventoryCapacity+=Number(a[1]);
     if(a[0]==="speed")next.rollSpeed+=Number(a[1])/100;
     if(a[0]==="auto")next.upgrades={...next.upgrades,"u-auto-roll":1};
     if(a[0]==="boost")next.boosts={...next.boosts,[a[1]]:Date.now()+Number(a[2])*1000};
     return next;
   });
   notify(prod.name+" activé !",true);
 };
 const claimDaily=()=>{
   const i=player.dailyClaimed;if(i>=7||player.dailyRewards[i])return;
   const card=DAILY_REWARD_CARDS[i];
   setPlayer(p=>{
     const daily=[...p.dailyRewards];daily[i]=true;
     return {...p,dailyRewards:daily,dailyClaimed:i+1,coins:p.coins+(card.reward.coins||0),gems:p.gems+(card.reward.gems||0),tickets:p.tickets+(card.reward.tickets||0),boosts:card.reward.boost?{...p.boosts,[card.reward.boost]:Date.now()+(card.reward.seconds||0)*1000}:p.boosts};
   });
   notify("Jour "+(i+1)+" récupéré !",true);
 };
 const redeem=()=>{
   const code=codeInput.trim().toUpperCase();const reward=CODES[code];
   if(!reward){notify("Code invalide.");return;}
   if(player.claimedCodes.includes(code)){notify("Code déjà utilisé.");return;}
   setPlayer(p=>({...p,claimedCodes:[...p.claimedCodes,code],coins:p.coins+(reward.coins||0),gems:p.gems+(reward.gems||0),tickets:p.tickets+(reward.tickets||0)}));
   setCodeInput("");notify("Code valide — récompense ajoutée !",true);
 };
 const unlockZone=(zoneName:string,index:number)=>{
   if(player.zones.includes(zoneName)){setPlayer(p=>({...p,selectedZone:zoneName}));return;}
   if(index>0&&!player.zones.includes(ZONES[index-1].name)){notify("La zone précédente doit être débloquée.");return;}
   const cost=2500*(index+1);if(player.coins<cost){notify("Il faut "+formatNumber(cost)+" coins.");return;}
   setPlayer(p=>({...p,coins:p.coins-cost,zones:[...p.zones,zoneName],selectedZone:zoneName,stats:{...p.stats,coinsSpent:p.stats.coinsSpent+cost}}));
   notify("Zone "+zoneName+" débloquée !",true);
 };
 const finishTutorial=()=>{localStorage.setItem("anime-rng-tutorial","done");setTutorial(false);};

 const unique=new Set(player.inventory.map(e=>e.itemId)).size;
 const best=ITEMS.find(x=>x.id===player.stats.bestItemId)||lastRoll||ITEMS[0];
 const equipped=ITEMS.find(x=>x.id===player.equipped)||ITEMS[0];
 const luck=player.luck+(player.boosts.luck&&player.boosts.luck>Date.now()?45:0);

 return <div className={"min-h-screen bg-[#050611] text-white "+(player.settings.reducedMotion?"reduced-motion":"")}>
   <AmbientBackground enabled={player.settings.particles}/>
   <Sidebar view={view} setView={setView} openCodes={()=>setCodeOpen(true)} player={player}/>
   <div className="lg:pl-[274px]">
    <Header player={player} xp={xpPercent(player)} setView={setView} openCodes={()=>setCodeOpen(true)}/>
    <main className="relative z-10 px-4 pb-28 pt-4 sm:px-6 xl:px-8">
      {view==="home"&&<HomeView player={player} best={best} equipped={equipped} setView={setView} openZones={()=>setZoneOpen(true)}/>}
      {view==="roll"&&<RollView player={player} lastRoll={lastRoll} luck={luck} rolling={rolling} autoRoll={autoRoll} setAutoRoll={setAutoRoll} banner={banner} setBanner={setBanner} doRoll={doRoll} history={player.stats.history} equipped={equipped} equip={equip} openZones={()=>setZoneOpen(true)}/>}
      {view==="collection"&&<CollectionView player={player} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} equip={equip} favorite={favorite}/>}
      {view==="inventory"&&<InventoryView player={player} query={query} setQuery={setQuery} selected={selected} setSelected={setSelected} equip={equip} favorite={favorite} sell={sell} openSell={()=>setSellConfirm(true)}/>}
      {view==="shop"&&<ShopView player={player} buy={buyShop}/>}
      {view==="skills"&&<SkillsView player={player} buy={buySkill}/>}
      {view==="upgrades"&&<UpgradesView player={player} buy={buyUpgrade}/>}
      {view==="quests"&&<QuestsView player={player} claim={claimQuest}/>}
      {view==="rewards"&&<RewardsView player={player} claim={claimDaily}/>}
      {view==="profile"&&<ProfileView player={player} best={best} unique={unique} setTitle={t=>setPlayer(p=>({...p,equippedTitle:t}))}/>}
      {view==="leaderboard"&&<LeaderboardView best={best}/>}
      {view==="achievements"&&<AchievementsView player={player}/>}
      {view==="stats"&&<StatsView player={player} unique={unique}/>}
      {view==="settings"&&<SettingsView player={player} setPlayer={setPlayer}/>}
    </main>
   </div>
   <MobileNav view={view} setView={setView}/>
   <Notifications items={notes}/>
   {resultOpen&&lastRoll&&<ResultModal item={lastRoll} player={player} close={()=>setResultOpen(false)} equip={()=>{equip(lastRoll.id);setResultOpen(false)}}/>}
   {codeOpen&&<Modal title="CODES" close={()=>setCodeOpen(false)}><div className="space-y-5"><p className="text-sm text-white/55">Entre un code pour recevoir des coins, gems ou tickets.</p><div className="flex gap-2"><input className="field flex-1" placeholder="Entre ton code..." value={codeInput} onChange={e=>setCodeInput(e.target.value)}/><button className="primary-btn" onClick={redeem}>VALIDER</button></div><div className="grid gap-3 sm:grid-cols-3">{Object.keys(CODES).map(c=><button key={c} className="mini-card text-left" onClick={()=>setCodeInput(c)}>{c}<span className="mt-1 block text-xs text-white/35">Cliquer pour remplir</span></button>)}</div></div></Modal>}
   {sellConfirm&&<Modal title="VENTE MULTIPLE" close={()=>setSellConfirm(false)}><p className="text-sm text-white/55">Vendre {selected.length} objet(s) sélectionné(s) ? Favoris et verrouillés sont ignorés.</p><div className="mt-5 flex justify-end gap-3"><button className="ghost-btn" onClick={()=>setSellConfirm(false)}>ANNULER</button><button className="danger-btn" onClick={sellSelected}>VENDRE</button></div></Modal>}
   {zoneOpen&&<Modal title="ZONES • CHOISIS TA DESTINATION" close={()=>setZoneOpen(false)}><div className="grid gap-3 md:grid-cols-2">{ZONES.map(z=>{const unlocked=player.zones.includes(z.name);const cost=2500*(z.index+1);return <button className={"zone-card "+(unlocked?"zone-card-active":"")} key={z.id} onClick={()=>{unlockZone(z.name,z.index);setZoneOpen(false)}}><div className="flex items-center justify-between gap-3"><div className="text-left"><div className="font-display text-sm">{z.name}</div><div className="mt-1 text-xs text-white/40">{z.description}</div></div><span className="badge whitespace-nowrap">{unlocked?"DÉBLOQUÉE":formatNumber(cost)+" ◈"}</span></div><div className="mt-4 flex justify-between text-xs text-white/35"><span>{z.bonus}</span><span>Zone {z.index+1}/7</span></div></button>})}</div></Modal>}
   {tutorial&&<Modal title={["BIENVENUE","PREMIER ROLL","COLLECTION","ÉQUIPE TON DROP","PROGRESSE","CONTINUE"][tutorialStep]} close={finishTutorial}><div className="space-y-5"><div className="tutorial-orb"><span>{tutorialStep+1}</span></div><p className="text-sm leading-7 text-white/65">{[
     "Ta chasse commence maintenant. Chaque roll peut révéler une aura originale.",
     "Clique sur ROLL : le moteur consulte réellement le dénominateur 1/X de chaque résultat.",
     "Chaque découverte unique remplit ta Collection. Les inconnus restent affichés avec leur chance.",
     "Depuis l’inventaire, équipe une aura et fixe-la en favori pour éviter une vente accidentelle.",
     "Dépense tes coins dans les Upgrades, complète les Skills et débloque de nouvelles zones.",
     "Termine les quêtes, récupère les Rewards et chasse le 1/10 000 000."
   ][tutorialStep]}</p><div className="flex justify-between gap-3"><button className="ghost-btn" onClick={finishTutorial}>PASSER</button><button className="primary-btn" onClick={()=>tutorialStep<5?setTutorialStep(s=>s+1):finishTutorial()}>{tutorialStep<5?"SUIVANT":"COMMENCER"}</button></div></div></Modal>}
 </div>;
}

function updateAchievements(player:PlayerState,result:RngItem){
 const epic=["EPIC","LEGENDARY","MYTHIC","DIVINE","CELESTIAL","TRANSCENDENT","SECRET"].includes(result.rarity)?1:0;
 const legendary=["LEGENDARY","MYTHIC","DIVINE","CELESTIAL","TRANSCENDENT","SECRET"].includes(result.rarity)?1:0;
 const mythic=["MYTHIC","DIVINE","CELESTIAL","TRANSCENDENT","SECRET"].includes(result.rarity)?1:0;
 const divine=["DIVINE","CELESTIAL","TRANSCENDENT","SECRET"].includes(result.rarity)?1:0;
 const secret=result.rarity==="SECRET"?1:0;
 const unique=new Set(player.inventory.map(e=>e.itemId)).size;
 return player.achievements.map(a=>{
  let progress=0;
  if(a.metric==="totalRolls")progress=player.stats.totalRolls;
  if(a.metric==="bestDenominator")progress=player.stats.bestDenominator;
  if(a.metric==="collection")progress=unique;
  if(a.metric==="itemsSold")progress=player.stats.itemsSold;
  if(a.metric==="zones")progress=player.zones.length;
  if(a.metric==="level")progress=player.level;
  if(a.metric==="epic")progress=epic;
  if(a.metric==="legendary")progress=legendary;
  if(a.metric==="mythic")progress=mythic;
  if(a.metric==="divine")progress=divine;
  if(a.metric==="secret")progress=secret;
  return {...a,unlocked:a.unlocked||progress>=a.target};
 });
}

function AmbientBackground({enabled}:{enabled:boolean}){return <div className="ambient"><div className="ambient-grid"/><div className="orb orb-a"/><div className="orb orb-b"/><div className="orb orb-c"/>{enabled&&<div className="particle-field">{Array.from({length:30}).map((_,i)=><span key={i} style={{left:(i*37)%100+"%",top:(i*53)%100+"%",animationDelay:(i%7)*-1.2+"s",animationDuration:5+(i%5)+"s"}}/>)}</div>}</div>}

function Sidebar({view,setView,player,openCodes}:{view:View;setView:(v:View)=>void;player:PlayerState;openCodes:()=>void}){return <aside className="sidebar hidden lg:flex"><div className="brand-block"><div className="brand-mark">✦</div><div><div className="brand-title">ANIME RNG</div><div className="brand-sub">BEYOND FATE</div></div></div><div className="sidebar-section"><div className="section-label">GAME</div>{NAV.slice(0,5).map(n=><NavItem key={n.id} item={n} active={view===n.id} onClick={()=>setView(n.id)}/>)}</div><div className="sidebar-section"><div className="section-label">PROGRESSION</div>{NAV.slice(5,10).map(n=><NavItem key={n.id} item={n} active={view===n.id} onClick={()=>setView(n.id)}/>)}</div><div className="sidebar-section"><div className="section-label">PLUS</div>{NAV.slice(10).map(n=><NavItem key={n.id} item={n} active={view===n.id} onClick={()=>setView(n.id)}/>)}</div><div className="sidebar-bottom"><button className="code-side" onClick={openCodes}><span>⌁</span><span><b>CODES</b><small>Récompenses bonus</small></span></button><div className="mini-profile"><div className="avatar">{player.username[0]}</div><div className="min-w-0"><div className="truncate font-semibold text-xs">{player.username}</div><div className="truncate text-[9px] text-white/35">Niveau {player.level} • {player.equippedTitle}</div></div></div></div></aside>}
function NavItem({item,active,onClick}:{item:{icon:string;label:string};active:boolean;onClick:()=>void}){return <button onClick={onClick} className={"nav-item "+(active?"nav-item-active":"")}><span className="nav-icon">{item.icon}</span><span>{item.label}</span>{active&&<span className="nav-pip"/>}</button>}
function MobileNav({view,setView}:{view:View;setView:(v:View)=>void}){return <nav className="mobile-nav lg:hidden">{NAV.slice(0,5).map(n=><button key={n.id} className={view===n.id?"mobile-nav-active":""} onClick={()=>setView(n.id)}><span>{n.icon}</span><small>{n.label}</small></button>)}</nav>}
function Header({player,xp,setView,openCodes}:{player:PlayerState;xp:number;setView:(v:View)=>void;openCodes:()=>void}){const active=player.boosts.luck&&player.boosts.luck>Date.now()?Math.ceil((player.boosts.luck-Date.now())/1000):0;return <header className="topbar"><div className="topbar-left"><button className="mobile-menu lg:hidden" onClick={()=>setView("home")}>☰</button><div className="level-pill"><span className="level-dot">LV</span><strong>{player.level}</strong><span className="xp-mini"><span style={{width:xp+"%"}}/></span></div><div className="currency-pill"><span>◈</span><strong>{formatNumber(player.coins)}</strong></div><div className="currency-pill gem"><span>✦</span><strong>{formatNumber(player.gems)}</strong></div><div className="currency-pill ticket"><span>◆</span><strong>{formatNumber(player.tickets)}</strong></div></div><div className="topbar-right">{active>0&&<div className="boost-chip">⚡ {active}s</div>}<button className="top-action" onClick={openCodes}>⌁ <span className="hidden sm:inline">CODE</span></button><button className="top-action" onClick={()=>setView("rewards")}>◇ <span className="hidden sm:inline">REWARDS</span></button><button className="top-action" onClick={()=>setView("profile")}>◎</button></div></header>}

function HomeView({player,best,equipped,setView,openZones}:{player:PlayerState;best:RngItem;equipped:RngItem;setView:(v:View)=>void;openZones:()=>void}){return <div className="page-shell"><section className="hero-panel"><div className="hero-copy"><div className="eyebrow"><span>✦</span> YOUR FATE IS WAITING</div><h1>Roll. Discover.<br/><span>Transcend.</span></h1><p>Une boucle RNG 2D originale où chaque roll peut devenir ton nouveau drop préféré. La vraie obsession : voir jusqu’où va ton prochain <b>1/X</b>.</p><div className="hero-buttons"><button className="primary-btn primary-lg" onClick={()=>setView("roll")}>PLAY RNG <span>→</span></button><button className="ghost-btn" onClick={openZones}>CHOISIR UNE ZONE</button></div><div className="hero-stats"><StatInline label="ROLLS" value={formatNumber(player.stats.totalRolls)}/><StatInline label="COLLECTION" value={new Set(player.inventory.map(e=>e.itemId)).size+" / "+ITEMS.length}/><StatInline label="BEST 1/X" value={"1/"+formatNumber(player.stats.bestDenominator)}/></div></div><div className="hero-art"><div className="hero-ring ring-1"/><div className="hero-ring ring-2"/><div className="hero-ring ring-3"/><div className="hero-core"><div className="core-label">EQUIPPED</div><div className="core-icon">{equipped.icon}</div><div className="core-name">{equipped.name}</div><ChanceBadge item={equipped} large/><RarityBadge rarity={equipped.rarity}/></div><div className="floating-card floating-best"><span>BEST DROP</span><b>{best.name}</b><small>{best.chanceDisplay}</small></div><div className="floating-card floating-event"><span>EVENT</span><b>{EVENTS[0].title}</b><small>{EVENTS[0].bonus}</small></div></div></section><section className="grid gap-4 xl:grid-cols-3"><Panel title="TA PROGRESSION" icon="↗" className="xl:col-span-2"><div className="grid gap-3 sm:grid-cols-3"><BigStat title="Luck" value={"+"+player.luck+"%"} hint="Chance de base" icon="✦"/><BigStat title="Roll Speed" value={player.rollSpeed.toFixed(2)+"x"} hint="Cadence" icon="↯"/><BigStat title="Play Time" value={formatDuration(player.stats.playSeconds)} hint="Temps de jeu" icon="◷"/></div><div className="mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="mb-2 flex justify-between text-xs uppercase tracking-[.18em] text-white/45"><span>XP vers niveau {player.level+1}</span><span>{Math.round(xpPercent(player))}%</span></div><div className="xp-track"><div className="xp-fill" style={{width:xpPercent(player)+"%"}}/></div><div className="mt-2 text-xs text-white/35">{formatNumber(player.xp)} / {formatNumber(nextXp(player.level))} XP</div></div></Panel><Panel title="BOOSTS ACTIFS" icon="⚡"><BoostList player={player}/></Panel></section><section className="grid gap-4 xl:grid-cols-2"><Panel title="DERNIÈRES DÉCOUVERTES" icon="✦"><div className="grid gap-2 sm:grid-cols-2">{player.stats.history.slice(0,6).map((id,i)=><RngRow key={id+"-"+i} item={ITEMS.find(x=>x.id===id)} compact/>)}</div></Panel><Panel title="LUCKY FESTIVAL" icon="✺"><div className="event-card"><div><div className="event-kicker">ÉVÉNEMENT ACTIF</div><h3>{EVENTS[0].title}</h3><p>{EVENTS[0].description}</p></div><div className="event-bonus">{EVENTS[0].bonus}<span>{EVENTS[0].duration}</span></div></div></Panel></section></div>}

function RollView({player,lastRoll,luck,rolling,autoRoll,setAutoRoll,banner,setBanner,doRoll,history,equipped,equip,openZones}:{player:PlayerState;lastRoll?:RngItem;luck:number;rolling:boolean;autoRoll:boolean;setAutoRoll:(v:boolean)=>void;banner:RngItem["banner"];setBanner:(v:RngItem["banner"])=>void;doRoll:()=>void;history:string[];equipped:RngItem;equip:(id:string)=>void;openZones:()=>void}){return <div className="page-shell"><div className="roll-topline"><div><div className="eyebrow">RNG CHAMBER</div><h2>La prochaine aura peut être <span>absurde.</span></h2></div><button className="ghost-btn" onClick={openZones}>ZONE • {player.selectedZone.toUpperCase()}</button></div><div className="banner-tabs">{(["NORMAL","ANCIENT","DIVINE","SECRET"] as const).map(b=><button key={b} onClick={()=>setBanner(b)} className={"banner-tab "+(banner===b?"banner-tab-active":"")}>{b}<span>{b==="NORMAL"?"1x":b==="ANCIENT"?"1.4x":b==="DIVINE"?"2x":"3x"}</span></button>)}</div><div className="roll-layout"><div className="panel roll-stage"><div className="roll-stage-top"><div className="tag">DROP ACTUEL</div><div className="tag tag-live">● LIVE RNG</div></div><div className={"result-orb-area "+(rolling?"is-rolling":"")} style={{"--glow":lastRoll?RARITIES[lastRoll.rarity].glow:"rgba(129,140,248,.25)"} as CSSProperties}><div className="result-halo halo-a"/><div className="result-halo halo-b"/><div className="result-card-main"><div className="result-icon-main">{lastRoll?.icon||"✦"}</div><div className="result-name-main">{lastRoll?.name||"Astra Novice"}</div>{lastRoll&&<><RarityBadge rarity={lastRoll.rarity} large/><ChanceBadge item={lastRoll} large/></>}<div className="result-power"><span>POWER</span><b>{formatNumber(lastRoll?.power||10)}</b></div></div></div><div className="roll-actions"><button className={"roll-button "+(rolling?"roll-button-disabled":"")} onClick={doRoll} disabled={rolling}><div className="roll-button-inner"><span className="roll-symbol">{rolling?"…":"✦"}</span><strong>{rolling?"ROLLING":"ROLL"}</strong><small>{player.rollSpeed.toFixed(2)}x cadence</small></div></button><div className="roll-tools"><button className={"toggle-btn "+(autoRoll?"toggle-on":"")} onClick={()=>setAutoRoll(!autoRoll)}>∞ AUTO ROLL <span>{autoRoll?"ON":"OFF"}</span></button><div className="stat-chip">✦ Luck <b>+{luck}%</b></div><div className="stat-chip">↯ Speed <b>{player.rollSpeed.toFixed(2)}x</b></div><div className="stat-chip">◉ Rolls <b>{formatNumber(player.stats.totalRolls)}</b></div></div></div><div className="pity-grid"><PityBar label="EPIC PITY" current={player.pity.epic}/><PityBar label="LEGENDARY PITY" current={player.pity.legendary}/><PityBar label="MYTHIC PITY" current={player.pity.mythic}/></div></div><div className="space-y-4"><Panel title="ÉQUIPÉ" icon="◈"><RngFeature item={equipped}/></Panel><Panel title="DERNIERS ROLLS" icon="↯"><div className="space-y-2">{history.slice(0,7).map((id,i)=><RngRow key={id+"-"+i} item={ITEMS.find(x=>x.id===id)} onEquip={equip}/>)}</div></Panel></div></div></div>}

function CollectionView({player,query,setQuery,filter,setFilter,equip,favorite}:{player:PlayerState;query:string;setQuery:(v:string)=>void;filter:Rarity|"ALL";setFilter:(v:Rarity|"ALL")=>void;equip:(id:string)=>void;favorite:(id:string)=>void}){const owned=new Set(player.inventory.map(e=>e.itemId));const items=ITEMS.filter(i=>filter==="ALL"||i.rarity===filter).filter(i=>i.name.toLowerCase().includes(query.toLowerCase()));return <div className="page-shell"><PageHeading title="COLLECTION" subtitle={owned.size+" / "+ITEMS.length+" résultats découverts"} icon="◈"/><div className="toolbar"><input className="field flex-1" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher une aura..."/><div className="filter-row">{["ALL",...RARITY_LIST].map(r=><button key={r} className={"filter-chip "+(filter===r?"filter-chip-active":"")} onClick={()=>setFilter(r as Rarity|"ALL")}>{r==="ALL"?"TOUT":r}</button>)}</div></div><div className="collection-grid">{items.map(item=><CollectionCard key={item.id} item={item} owned={owned.has(item.id)} equipped={player.equipped===item.id} favorite={player.favorites.includes(item.id)} equip={equip} favoriteToggle={favorite}/>)}</div></div>}

function InventoryView({player,query,setQuery,selected,setSelected,equip,favorite,sell,openSell}:{player:PlayerState;query:string;setQuery:(v:string)=>void;selected:string[];setSelected:(v:string[])=>void;equip:(id:string)=>void;favorite:(id:string)=>void;sell:(id:string)=>void;openSell:()=>void}){const entries=player.inventory.filter(e=>ITEMS.find(i=>i.id===e.itemId)?.name.toLowerCase().includes(query.toLowerCase()));const toggle=(id:string)=>setSelected(selected.includes(id)?selected.filter(x=>x!==id):[...selected,id]);return <div className="page-shell"><PageHeading title="INVENTAIRE" subtitle={player.inventory.length+" / "+player.inventoryCapacity+" slots occupés"} icon="▦"/><div className="toolbar"><input className="field flex-1" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Chercher dans ton inventaire..."/><button className="ghost-btn" onClick={()=>setSelected(entries.filter(e=>!e.locked&&!e.favorite).map(e=>e.id))}>SÉLECTIONNER TOUT</button>{selected.length>0&&<button className="danger-btn" onClick={openSell}>VENDRE ({selected.length})</button>}</div><div className="inventory-grid">{entries.map(entry=><InventoryCard key={entry.id} entry={entry} selected={selected.includes(entry.id)} equipped={player.equipped===entry.itemId} toggle={toggle} equip={equip} favorite={favorite} sell={sell}/>)}</div></div>}

function ShopView({player,buy}:{player:PlayerState;buy:(id:string)=>void}){const groups=[["CHANCE & ROLL",SHOP_PRODUCTS.slice(0,6)],["INVENTAIRE",SHOP_PRODUCTS.slice(6,9)],["BOOSTS",SHOP_PRODUCTS.slice(9,13)],["COSMÉTIQUES • ZERO POWER PAYWALL",SHOP_PRODUCTS.slice(13)]];return <div className="page-shell"><PageHeading title="SHOP" subtitle="Le marché de ta chance." icon="◒"/><div className="shop-hero"><div><div className="eyebrow">PREMIUM ECONOMY</div><h2>Boost ta boucle sans casser le jeu.</h2><p>Les cosmétiques sont facultatifs. Les boosts sont puissants mais temporaires.</p></div><div className="shop-balance"><span>◈ {formatNumber(player.coins)}</span><span>✦ {formatNumber(player.gems)}</span></div></div>{groups.map(([title,products])=><section className="shop-section" key={title as string}><div className="section-title">{title as string}</div><div className="shop-grid">{(products as typeof SHOP_PRODUCTS).map(p=><ShopCard key={p.id} product={p} buy={buy}/>)}</div></section>)}</div>}

function SkillsView({player,buy}:{player:PlayerState;buy:(id:string)=>void}){const branches=["Luck","Roll","Fortune","Survival","Special"];const points=Math.floor(player.level/2)+3;const spent=Object.entries(player.skills).reduce((sum,[id,l])=>sum+(SKILLS.find(s=>s.id===id)?.cost||0)*l,0);return <div className="page-shell"><PageHeading title="COMPÉTENCES" subtitle={points-spent+" points disponibles • arbre actif"} icon="⌘"/><div className="skill-board">{branches.map(b=><div className="skill-branch" key={b}><div className="skill-branch-head"><span>{b}</span><small>{b==="Luck"?"Chance":b==="Roll"?"Cadence":b==="Fortune"?"Économie":b==="Survival"?"Protection":"Anomalies"}</small></div>{SKILLS.filter(s=>s.branch===b).map((s,i)=><div className="skill-node-wrap" key={s.id}><SkillNode skill={s} owned={player.skills[s.id]||0} buy={buy}/>{i<SKILLS.filter(x=>x.branch===b).length-1&&<div className="skill-line"/>}</div>)}</div>)}</div></div>}

function UpgradesView({player,buy}:{player:PlayerState;buy:(id:string)=>void}){return <div className="page-shell"><PageHeading title="AMÉLIORATIONS" subtitle="Des bonus permanents pour faire évoluer toute la boucle." icon="↗"/>{["Character","RNG","Automation"].map(cat=><section className="upgrade-section" key={cat}><div className="section-title">{cat.toUpperCase()}</div><div className="upgrade-grid">{UPGRADES.filter(u=>u.category===cat).map(u=><UpgradeCard key={u.id} upgrade={u} level={player.upgrades[u.id]||0} buy={buy}/>)}</div></section>)}</div>}

function QuestsView({player,claim}:{player:PlayerState;claim:(id:string)=>void}){return <div className="page-shell"><PageHeading title="QUÊTES" subtitle="Des objectifs courts, puis de vrais grinders." icon="☑"/><div className="quest-columns"><section><div className="section-title">QUOTIDIENNES</div>{player.quests.filter(q=>q.kind==="daily").map(q=><QuestCard key={q.id} q={q} claim={claim}/>)}</section><section><div className="section-title">HEBDOMADAIRES</div>{player.quests.filter(q=>q.kind==="weekly").map(q=><QuestCard key={q.id} q={q} claim={claim}/>)}</section></div></div>}

function RewardsView({player,claim}:{player:PlayerState;claim:()=>void}){return <div className="page-shell"><PageHeading title="RÉCOMPENSES QUOTIDIENNES" subtitle="7 jours de connexion, une dernière case qui fait très mal." icon="◇"/><div className="daily-grid">{DAILY_REWARD_CARDS.map((c,i)=><div className={"daily-card "+(player.dailyRewards[i]?"daily-done":i===player.dailyClaimed?"daily-next":"")} key={c.day}><div className="daily-top"><span>JOUR {c.day}</span>{i<player.dailyClaimed&&<b>✓</b>}</div><div className="daily-icon">{c.icon}</div><h3>{c.title}</h3><div className="daily-value">{c.value}</div>{i===player.dailyClaimed?<button className="primary-btn w-full" onClick={claim}>RÉCUPÉRER</button>:<div className="daily-lock">{i<player.dailyClaimed?"RÉCUPÉRÉ":"VERROUILLÉ"}</div>}</div>)}</div><div className="event-card"><div><div className="event-kicker">EVENT</div><h3>{EVENTS[0].title}</h3><p>{EVENTS[0].description}</p></div><div className="event-bonus">{EVENTS[0].bonus}<span>{EVENTS[0].duration}</span></div></div></div>}

function ProfileView({player,best,unique,setTitle}:{player:PlayerState;best:RngItem;unique:number;setTitle:(title:string)=>void}){const stats=[["TOTAL ROLLS",formatNumber(player.stats.totalRolls),"◉"],["BEST RARITY",best.rarity,"✹"],["BEST 1/X",best.chanceDisplay,"☄"],["COLLECTION",unique+"/"+ITEMS.length,"◈"],["COINS",formatNumber(player.coins),"◒"],["PLAY TIME",formatDuration(player.stats.playSeconds),"◷"],["TITLES",String(player.titles.length),"✦"],["SECRETS",formatNumber(player.stats.secretsFound),"⬢"]];return <div className="page-shell"><PageHeading title="PROFIL" subtitle="Ton identité dans la chasse au drop." icon="◎"/><div className="profile-hero"><div className="avatar-xl">{player.username[0]}</div><div className="min-w-0 flex-1"><div className="profile-name">{player.username}</div><div className="profile-title">{player.equippedTitle}</div><div className="xp-track mt-4 max-w-xl"><div className="xp-fill" style={{width:xpPercent(player)+"%"}}/></div><div className="mt-2 text-xs text-white/35">Niveau {player.level} • {formatNumber(player.xp)} / {formatNumber(nextXp(player.level))} XP</div></div><div className="profile-badge">RNG<br/><span>HUNTER</span></div></div><div className="stats-grid">{stats.map(([l,v,i])=><div className="stat-card" key={l}><span className="stat-icon">{i}</span><div><div className="stat-label">{l}</div><div className="stat-value">{v}</div></div></div>)}</div><Panel title="TITRES" icon="✦"><div className="flex flex-wrap gap-2">{TITLES.map(t=><button key={t} className={"filter-chip "+(player.equippedTitle===t?"filter-chip-active":"")} onClick={()=>setTitle(t)}>{t}</button>)}</div></Panel></div>}

function LeaderboardView({best}:{best:RngItem}){const [mode,setMode]=useState<"RAREST DROPS"|"TOTAL ROLLS"|"LUCK"|"COINS"|"COLLECTION">("RAREST DROPS");const rows=Array.from({length:100},(_,i)=>({rank:i+1,name:["RinFlux","AkiByte","KuroZen","MikaVoid","SoraShift","NekoPrime","VantaRNG","NovaKyo","YumeIX","AstraCore"][i%10]+(i>9?"_"+(i+1):""),denominator:Math.max(42,Math.round((i+2)*(i%3===0?71000:44000))),rolls:Math.round(120000/(i+1)+i*700),luck:10+(100-i)*.62,coins:450000-i*3200,collection:30+(100-i)%70}));return <div className="page-shell"><PageHeading title="CLASSEMENT" subtitle="Top 100 • plusieurs façons de dominer la boucle." icon="♛"/><div className="leader-tabs">{(["RAREST DROPS","TOTAL ROLLS","LUCK","COINS","COLLECTION"] as const).map(m=><button key={m} className={"leader-tab "+(mode===m?"leader-active":"")} onClick={()=>setMode(m)}>{m}</button>)}</div><div className="leader-board">{rows.map(r=><div className={"leader-row "+(r.rank<=3?"leader-top":"")} key={r.rank}><div className="rank">#{r.rank}</div><div className="avatar sm">{r.name[0]}</div><div className="leader-name"><b>{r.name}</b><span>{r.rank<=3?"DROP HUNTER":"RNG RUNNER"}</span></div><div className="leader-drop">{mode==="RAREST DROPS"&&<><span>1/{formatNumber(r.denominator)}</span><small>{r.rolls.toLocaleString("fr-FR")} rolls</small></>}{mode==="TOTAL ROLLS"&&<><span>{formatNumber(r.rolls)}</span><small>total rolls</small></>}{mode==="LUCK"&&<><span>+{r.luck.toFixed(0)}%</span><small>luck</small></>}{mode==="COINS"&&<><span>{formatNumber(r.coins)} ◈</span><small>fortune</small></>}{mode==="COLLECTION"&&<><span>{r.collection}/100</span><small>collections</small></>}</div></div>)}</div><div className="note-card">Ton meilleur drop : <b>{best.name}</b> • <b>{best.chanceDisplay}</b>. Le leaderboard est une simulation locale de démonstration.</div></div>}

function AchievementsView({player}:{player:PlayerState}){return <div className="page-shell"><PageHeading title="SUCCÈS" subtitle="Chaque jalon pousse ton profil plus loin." icon="✹"/><div className="achievement-grid">{player.achievements.map(a=><div className={"achievement-card "+(a.unlocked?"achievement-unlocked":"")} key={a.id}><div className="achievement-icon">{a.unlocked?"✹":"?"}</div><div className="min-w-0 flex-1"><div className="font-display text-sm tracking-wider">{a.title}</div><p className="mt-1 text-xs text-white/40">{a.description}</p><div className="mt-3 flex justify-between text-[10px] text-white/35"><span>+{formatNumber(a.rewardCoins)} ◈</span><span>{a.unlocked?"DÉBLOQUÉ":"VERROUILLÉ"}</span></div></div></div>)}</div></div>}

function StatsView({player,unique}:{player:PlayerState;unique:number}){const bars=[["COMMON",72],["UNCOMMON",15],["RARE",8],["EPIC",3],["LEGENDARY",1.3],["MYTHIC",.4],["DIVINE",.1],["CELESTIAL",.04],["TRANSCENDENT",.01],["SECRET",.001]];return <div className="page-shell"><PageHeading title="STATISTIQUES AVANCÉES" subtitle="Lecture détaillée de ta boucle RNG." icon="▥"/><div className="stats-grid">{[["TOTAL ROLLS",formatNumber(player.stats.totalRolls),"◉"],["ROLLS AUJOURD'HUI",formatNumber(player.stats.rollsToday),"↯"],["MEILLEUR 1/X","1/"+formatNumber(player.stats.bestDenominator),"☄"],["OBJETS VENDUS",formatNumber(player.stats.itemsSold),"◒"],["COINS GAGNÉS",formatNumber(player.stats.coinsEarned),"◈"],["COINS DÉPENSÉS",formatNumber(player.stats.coinsSpent),"↗"],["OBJETS ÉQUIPÉS",formatNumber(player.stats.itemsEquipped),"◎"],["SECRETS",formatNumber(player.stats.secretsFound),"⬢"],["COLLECTION",unique+"/"+ITEMS.length,"✦"]].map(([l,v,i])=><div className="stat-card" key={l}><span className="stat-icon">{i}</span><div><div className="stat-label">{l}</div><div className="stat-value">{v}</div></div></div>)}</div><div className="grid gap-4 lg:grid-cols-2"><Panel title="RÉPARTITION ESTIMÉE" icon="◈"><div className="space-y-3">{bars.map(([name,val])=><div key={name}><div className="flex justify-between text-xs text-white/45"><span>{name}</span><span>{val}%</span></div><div className="chart-track"><div className="chart-bar" style={{width:Math.min(100,Number(val))+"%"}}/></div></div>)}</div></Panel><Panel title="PITY TRACKER" icon="◌"><PityBar label="EPIC" current={player.pity.epic}/><PityBar label="LEGENDARY" current={player.pity.legendary}/><PityBar label="MYTHIC" current={player.pity.mythic}/></Panel></div></div>}

function SettingsView({player,setPlayer}:{player:PlayerState;setPlayer:Dispatch<SetStateAction<PlayerState>>}){const toggle=(key:"music"|"sfx"|"animations"|"shake"|"particles"|"reducedMotion")=>setPlayer(p=>({...p,settings:{...p.settings,[key]:!p.settings[key]}}));return <div className="page-shell"><PageHeading title="SETTINGS" subtitle="Ton espace, ton rythme, ton niveau d'effets." icon="⚙"/><div className="settings-grid">{[["music","Musique","Fond sonore"],["sfx","Effets","Sons des interactions"],["animations","Animations","Transitions et feedback"],["shake","Screen Shake","Impact des drops"],["particles","Particules","Décor flottant"],["reducedMotion","Mode réduit","Limite les animations"]].map(([key,label,desc])=><button className="setting-card" key={key} onClick={()=>toggle(key as any)}><div><div className="font-display text-sm">{label}</div><div className="mt-1 text-xs text-white/35">{desc}</div></div><span className={"switch "+(player.settings[key as keyof PlayerState["settings"]]?"switch-on":"")}><span/></span></button>)}</div><div className="panel"><div className="panel-title">VOLUME</div><input type="range" min="0" max="100" value={player.settings.volume} onChange={e=>setPlayer(p=>({...p,settings:{...p.settings,volume:Number(e.target.value)}}))} className="w-full accent-indigo-400"/><div className="mt-2 text-xs text-white/35">{player.settings.volume}%</div></div><div className="danger-zone"><b>LOCAL SAVE</b><span>La progression est conservée dans le navigateur.</span><button className="danger-btn" onClick={()=>{localStorage.removeItem("anime-rng-player-v1");location.reload()}}>RESET SAVE</button></div></div>}

function Panel({title,icon,children,className=""}:{title:string;icon:string;children:ReactNode;className?:string}){return <section className={"panel "+className}><div className="panel-title"><span>{icon}</span>{title}</div>{children}</section>}
function PageHeading({title,subtitle,icon}:{title:string;subtitle:string;icon:string}){return <div className="page-heading"><div className="page-heading-icon">{icon}</div><div><div className="eyebrow">{title}</div><h2>{subtitle}</h2></div></div>}
function StatInline({label,value}:{label:string;value:string}){return <div><div className="stat-label">{label}</div><div className="stat-inline-value">{value}</div></div>}
function BigStat({title,value,hint,icon}:{title:string;value:string;hint:string;icon:string}){return <div className="big-stat"><span>{icon}</span><div><div className="text-xs uppercase tracking-widest text-white/35">{title}</div><div className="mt-1 font-display text-lg">{value}</div><div className="text-xs text-white/35">{hint}</div></div></div>}
function RarityBadge({rarity,large=false}:{rarity:Rarity;large?:boolean}){return <span className={"rarity-badge rarity-"+rarity.toLowerCase()+(large?" rarity-large":"")}>{RARITIES[rarity].icon} {rarity}</span>}
function ChanceBadge({item,large=false}:{item:RngItem;large?:boolean}){return <span className={"chance-badge "+(large?"chance-large":"")}>{item.chanceDisplay}</span>}
function RngRow({item,onEquip,compact=false}:{item?:RngItem;onEquip?:(id:string)=>void;compact?:boolean}){if(!item)return null;return <div className={"rng-row "+(compact?"rng-row-compact":"")}><div className="rng-row-icon" style={{color:item.color}}>{item.icon}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{item.name}</div><div className="text-[10px] text-white/35">{item.rarity}</div></div><ChanceBadge item={item}/>{onEquip&&<button className="icon-btn" onClick={()=>onEquip(item.id)}>◎</button>}</div>}
function RngFeature({item}:{item:RngItem}){return <div><div className="feature-aura" style={{"--glow":RARITIES[item.rarity].glow} as CSSProperties}><span>{item.icon}</span></div><div className="mt-3 font-display text-sm">{item.name}</div><div className="mt-2"><RarityBadge rarity={item.rarity}/></div><div><ChanceBadge item={item} large/></div><p className="mt-3 text-xs leading-relaxed text-white/40">{item.description}</p></div>}
function PityBar({label,current}:{label:string;current:number}){return <div className="pity-item"><div className="flex justify-between text-[10px] tracking-widest text-white/45"><span>{label}</span><span>{current} / 100</span></div><div className="pity-track"><div className="pity-fill" style={{width:current+"%"}}/></div></div>}
function BoostList({player}:{player:PlayerState}){const active=Object.entries(player.boosts).filter(([_,end])=>end>Date.now());return active.length?<div className="space-y-3">{active.map(([name,end])=><div className="boost-row" key={name}><span>⚡</span><div className="flex-1"><b className="text-sm">{name.toUpperCase()}</b><div className="text-xs text-white/35">{Math.ceil((end-Date.now())/1000)} secondes</div></div><div className="boost-progress"><span/></div></div>)}</div>:<div className="empty-state"><div>◌</div><p>Aucun boost actif.<br/>Le prochain peut tomber dans le Shop ou les Rewards.</p></div>}
function CollectionCard({item,owned,equipped,favorite,equip,favoriteToggle}:{item:RngItem;owned:boolean;equipped:boolean;favorite:boolean;equip:(id:string)=>void;favoriteToggle:(id:string)=>void}){return <div className={"collection-card "+(owned?"":"collection-locked")+" "+(equipped?"collection-equipped":"")} style={{"--glow":RARITIES[item.rarity].glow} as CSSProperties}><div className="collection-card-top"><span className="card-number">#{String(ITEMS.indexOf(item)+1).padStart(3,"0")}</span><button className="star-btn" onClick={()=>owned&&favoriteToggle(item.id)}>{favorite?"★":"☆"}</button></div><div className="collection-art">{owned?item.icon:"?"}</div><div className="collection-name">{owned?item.name:"???"}</div><RarityBadge rarity={item.rarity}/><ChanceBadge item={item} large/><div className="collection-meta"><span>{formatNumber(item.value)} ◈</span><span>PW {formatNumber(item.power)}</span></div><p>{owned?item.description:"Résultat non découvert. La chance reste visible pour garder une cible RNG."}</p>{owned&&<button className={"ghost-btn w-full "+(equipped?"ghost-active":"")} onClick={()=>equip(item.id)}>{equipped?"ÉQUIPÉ":"ÉQUIPER"}</button>}</div>}
function InventoryCard({entry,selected,equipped,toggle,equip,favorite,sell}:{entry:PlayerState["inventory"][number];selected:boolean;equipped:boolean;toggle:(id:string)=>void;equip:(id:string)=>void;favorite:(id:string)=>void;sell:(id:string)=>void}){const item=ITEMS.find(x=>x.id===entry.itemId)!;return <div className={"inventory-card "+(selected?"inventory-selected":"")}><div className="inventory-select"><input type="checkbox" checked={selected} onChange={()=>toggle(entry.id)} disabled={entry.locked||entry.favorite}/></div><div className="inventory-icon" style={{color:item.color}}>{item.icon}</div><div className="min-w-0 flex-1"><div className="truncate font-semibold">{item.name}</div><div className="mt-1 flex flex-wrap gap-1"><RarityBadge rarity={item.rarity}/><ChanceBadge item={item}/></div><div className="mt-2 text-[11px] text-white/35">Valeur {formatNumber(item.value)} ◈ • Power {formatNumber(item.power)}</div></div><div className="flex flex-col items-end gap-1"><button className="icon-btn" onClick={()=>favorite(item.id)}>{entry.favorite?"★":"☆"}</button><button className="icon-btn" onClick={()=>equip(item.id)}>◎</button><button className="icon-btn danger-icon" onClick={()=>sell(entry.id)} disabled={entry.locked||entry.favorite}>⌫</button></div></div>}
function ShopCard({product,buy}:{product:typeof SHOP_PRODUCTS[number];buy:(id:string)=>void}){return <div className="shop-card"><div className="shop-icon">{product.icon}</div><div className="shop-content"><div className="font-display text-sm">{product.name}</div><p>{product.desc}</p><div className="shop-bottom"><span className="price">{formatNumber(product.price)} {product.currency==="coins"?"◈":"✦"}</span><button className="primary-btn" onClick={()=>buy(product.id)}>ACHETER</button></div></div></div>}
function SkillNode({skill,owned,buy}:{skill:typeof SKILLS[number];owned:number;buy:(id:string)=>void}){const done=owned>=skill.maxLevel;return <div className={"skill-node "+(owned>0?"skill-owned":"")+" "+(done?"skill-done":"")}><div className="skill-core">{done?"✓":skill.level}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><div className="font-display text-xs">{skill.name}</div><span className="level-mini">{owned}/{skill.maxLevel}</span></div><p>{skill.description}</p><div className="text-[11px] text-cyan-200/70">{skill.bonus}</div></div><button className="skill-buy" onClick={()=>buy(skill.id)} disabled={done}>{done?"MAX":"+"+skill.cost}</button></div>}
function UpgradeCard({upgrade,level,buy}:{upgrade:typeof UPGRADES[number];level:number;buy:(id:string)=>void}){const max=level>=upgrade.maxLevel;const cost=Math.floor(upgrade.baseCost*Math.pow(1.45,level));return <div className="upgrade-card"><div className="upgrade-top"><span className="badge">{upgrade.category}</span><span className="level-mini">Niveau {level}/{upgrade.maxLevel}</span></div><div className="font-display mt-4 text-sm">{upgrade.name}</div><div className="mt-2 text-sm text-white/70">{upgrade.effect}</div><div className="upgrade-bar"><span style={{width:(level/upgrade.maxLevel)*100+"%"}}/></div><div className="mt-3 flex items-center justify-between"><span className="price">{max?"MAX":formatNumber(cost)+" ◈"}</span><button className="primary-btn" onClick={()=>buy(upgrade.id)} disabled={max}>{max?"MAX":"AMÉLIORER"}</button></div><div className="mt-2 text-[10px] text-white/30">Avant / Après : +{level*5} → +{max?level*5:(level+1)*5}</div></div>}
function QuestCard({q,claim}:{q:PlayerState["quests"][number];claim:(id:string)=>void}){const pct=Math.min(100,q.progress/q.target*100);return <div className="quest-card"><div className="quest-top"><span className="badge">{q.kind==="daily"?"DAILY":"WEEKLY"}</span><span>{q.progress}/{q.target}</span></div><div className="font-display mt-3 text-sm">{q.title}</div><div className="quest-track"><span style={{width:pct+"%"}}/></div><div className="quest-bottom"><span>+{formatNumber(q.rewardCoins)} ◈ {q.rewardGems?"+ "+q.rewardGems+" ✦":""}</span><button className="primary-btn" disabled={q.progress<q.target||q.claimed} onClick={()=>claim(q.id)}>{q.claimed?"RÉCUPÉRÉ":"RÉCUPÉRER"}</button></div></div>}
function Notifications({items}:{items:{id:number;text:string;rare:boolean}[]}){return <div className="notification-stack">{items.map(n=><div className={"notification "+(n.rare?"notification-rare":"")} key={n.id}><span>{n.rare?"✹":"✦"}</span><b>{n.text}</b></div>)}</div>}
function ResultModal({item,player,close,equip}:{item:RngItem;player:PlayerState;close:()=>void;equip:()=>void}){const intense=["MYTHIC","DIVINE","CELESTIAL","TRANSCENDENT","SECRET"].includes(item.rarity);return <div className={"modal-overlay "+(intense?"modal-intense":"")}><div className="result-modal" style={{"--glow":RARITIES[item.rarity].glow} as CSSProperties}><div className="result-sparks">{Array.from({length:intense?18:8}).map((_,i)=><span key={i} style={{transform:"rotate("+(i*22)+"deg) translateY(-"+(55+(i%4)*20)+"px)"}}/>)}</div><div className="modal-rarity">{RARITIES[item.rarity].icon} {item.rarity}</div><div className="modal-icon">{item.icon}</div><div className="modal-name">{item.name}</div><ChanceBadge item={item} large/><div className="modal-meta"><span>POWER {formatNumber(item.power)}</span><span>VALUE {formatNumber(item.value)} ◈</span><span>ZONE {item.zone}</span></div>{intense&&<div className="modal-callout">INCROYABLE • TON DESTIN VIENT DE CHANGER</div>}<div className="flex w-full gap-3"><button className="ghost-btn flex-1" onClick={close}>CONTINUER</button><button className="primary-btn flex-1" onClick={equip}>ÉQUIPER</button></div><div className="modal-foot">Roll total : {formatNumber(player.stats.totalRolls)} • Chance : {item.chanceDisplay}</div></div></div>}
function Modal({title,children,close}:{title:string;children:ReactNode;close:()=>void}){return <div className="modal-overlay"><div className="modal-box"><div className="modal-head"><div className="font-display tracking-[.18em] text-sm">{title}</div><button className="icon-btn" onClick={close}>×</button></div>{children}</div></div>}
function formatDuration(seconds:number){const h=Math.floor(seconds/3600);const m=Math.floor(seconds%3600/60);const s=seconds%60;return h?h+"h "+m+"m":m+"m "+String(s).padStart(2,"0")+"s"}

export default App;