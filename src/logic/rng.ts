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

export const PITY_THRESHOLDS:Record<"LEGENDARY"|"MYTHIC"|"DIVINE",number>={
 LEGENDARY:100,
 MYTHIC:250,
 DIVINE:499
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
 const pityTarget=player.pity.divine>=PITY_THRESHOLDS.DIVINE-1?"DIVINE"
   :player.pity.mythic>=PITY_THRESHOLDS.MYTHIC-1?"MYTHIC"
   :player.pity.legendary>=PITY_THRESHOLDS.LEGENDARY-1?"LEGENDARY"
   :undefined;
 if(pityTarget){
   const guaranteed=ITEMS.filter(item=>item.rarity===pityTarget);
   if(guaranteed.length) return guaranteed[randomInt(guaranteed.length)];
 }

 const allowedRarities:Rarity[]=["COMMON","UNCOMMON","RARE","EPIC","LEGENDARY","MYTHIC","DIVINE","CELESTIAL","TRANSCENDENT","SECRET"];
 const baseWeights:Record<Rarity,number>={
   COMMON:52,UNCOMMON:25,RARE:13,EPIC:6,LEGENDARY:2.8,MYTHIC:0.9,DIVINE:0.3,CELESTIAL:0.08,TRANSCENDENT:0.025,SECRET:0.005
 };

 // Luck still helps, but it no longer explodes the high-rarity weights exponentially.
 // This keeps strong drops rare even with multiple luck sources.
 const weighted=allowedRarities.map((rarity,index)=>({
   rarity,
   weight:baseWeights[rarity]*(1+(Math.max(0,luck)*index)/900)
 }));
 const total=weighted.reduce((sum,x)=>sum+x.weight,0);
 let pick=Math.random()*total;
 let selectedRarity=weighted[weighted.length-1].rarity;
 for(const entry of weighted){
   pick-=entry.weight;
   if(pick<=0){selectedRarity=entry.rarity;break;}
 }
 const rarityItems=pool.filter(item=>item.rarity===selectedRarity);
 if(rarityItems.length){
   const item=rarityItems[randomInt(rarityItems.length)];
   return item;
 }
 return pool[0]||ITEMS[0];
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
