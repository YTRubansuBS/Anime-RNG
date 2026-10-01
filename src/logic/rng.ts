import type {PlayerState,Rarity,RngItem} from "../types";
import {ITEMS} from "../data";

const order:Rarity[]=["SECRET","TRANSCENDENT","CELESTIAL","DIVINE","MYTHIC","LEGENDARY","EPIC","RARE","UNCOMMON","COMMON"];
const randomInt=(max:number)=>Math.floor(Math.random()*Math.max(1,max));

export const formatNumber=(value:number)=>new Intl.NumberFormat("fr-FR").format(Math.round(value));
export const nextXp=(level:number)=>Math.floor(250+Math.pow(level,1.55)*75);

const passes=(item:RngItem,luck:number)=>randomInt(Math.max(1,Math.floor(item.denominator/Math.max(1,1+luck/100))))===0;

const RARITY_LUCK:Record<Rarity,number>={
 COMMON:0,UNCOMMON:2,RARE:5,EPIC:9,LEGENDARY:14,MYTHIC:20,DIVINE:27,CELESTIAL:35,TRANSCENDENT:45,SECRET:60
};

export const PITY_THRESHOLDS:Record<"EPIC"|"LEGENDARY"|"MYTHIC",number>={
 EPIC:100,
 LEGENDARY:250,
 MYTHIC:500
};
export const itemLuckBonus=(item:RngItem|undefined)=>item?RARITY_LUCK[item.rarity]:0;
export const equippedLuckBonus=(player:PlayerState)=>{
 const ids=player.equippedItems?.length?player.equippedItems:(player.equipped?[player.equipped]:[]);
 return ids.reduce((sum,id)=>sum+itemLuckBonus(ITEMS.find(i=>i.id===id)),0);
};

export function rollRng(player:PlayerState,banner:RngItem["banner"]){
 const luckBoost=player.boosts.luck && player.boosts.luck>Date.now()?45:0;
 const superBoost=player.boosts.super && player.boosts.super>Date.now()?35:0;
 const luck=player.luck+equippedLuckBonus(player)+luckBoost+superBoost+Object.values(player.upgrades).reduce((s,v)=>s+v*2,0);
 const pool=ITEMS.filter(i=>i.banner===banner||banner==="NORMAL"&&i.banner==="NORMAL").sort((a,b)=>b.denominator-a.denominator);

 // Pity is a real guarantee, not just a hidden luck boost.
 // Higher-rarity pity takes priority and can still trigger from any banner.
 const pityTarget=player.pity.mythic>=PITY_THRESHOLDS.MYTHIC?"MYTHIC"
   :player.pity.legendary>=PITY_THRESHOLDS.LEGENDARY?"LEGENDARY"
   :player.pity.epic>=PITY_THRESHOLDS.EPIC?"EPIC"
   :undefined;
 if(pityTarget){
   const guaranteed=ITEMS.filter(item=>item.rarity===pityTarget);
   if(guaranteed.length) return guaranteed[randomInt(guaranteed.length)];
 }

 const candidates=pool.length?pool:ITEMS;
 for(const item of candidates){
  const pityBoost=item.rarity==="EPIC"&&player.pity.epic>=95?20
    :item.rarity==="LEGENDARY"&&player.pity.legendary>=240?25
    :item.rarity==="MYTHIC"&&player.pity.mythic>=490?30
    :0;
  if(passes(item,luck+pityBoost)) return item;
 }
 const commons=ITEMS.filter(i=>i.rarity==="COMMON");
 return commons[randomInt(commons.length)];
}

export const isRarer=(a:RngItem|undefined,b:RngItem|undefined)=>{
 if(!a) return false;if(!b)return true;
 const rank=(r:Rarity)=>["COMMON","UNCOMMON","RARE","EPIC","LEGENDARY","MYTHIC","DIVINE","CELESTIAL","TRANSCENDENT","SECRET"].indexOf(r);
 const ar=rank(a.rarity),br=rank(b.rarity);return ar===br?a.denominator>b.denominator:ar>br;
};

export const gainXp=(player:PlayerState,amount:number)=>{
 let xp=player.xp+amount,level=player.level,reward=0,levelUps=0;
 while(xp>=nextXp(level)){xp-=nextXp(level);level++;reward+=250+level*40;levelUps++;}
 return {...player,xp,level,coins:player.coins+reward};
};

export {order as RARITY_ORDER};