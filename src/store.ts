import {useEffect,useState,type Dispatch, type SetStateAction} from "react";
import {ACHIEVEMENTS,ITEMS} from "./data";
import type {PlayerState} from "./types";
import {nextXp} from "./logic/rng";

const STORAGE="anime-rng-player-v1";
const seedQuests=()=>[
 {id:"daily-rolls",title:"Entrer dans le flow",kind:"daily" as const,target:50,progress:0,rewardCoins:500,rewardGems:0,claimed:false},
 {id:"daily-rolls100",title:"Encore plus de rolls",kind:"daily" as const,target:100,progress:0,rewardCoins:900,rewardGems:0,claimed:false},
 {id:"daily-epic",title:"Chasseur d'Epic",kind:"daily" as const,target:1,progress:0,rewardCoins:1200,rewardGems:5,claimed:false},
 {id:"daily-sell",title:"Nettoyage de l'inventaire",kind:"daily" as const,target:20,progress:0,rewardCoins:800,rewardGems:0,claimed:false},
 {id:"weekly-rolls",title:"Rituel de la semaine",kind:"weekly" as const,target:1000,progress:0,rewardCoins:8000,rewardGems:30,claimed:false},
 {id:"weekly-legendary",title:"Légendaires en série",kind:"weekly" as const,target:5,progress:0,rewardCoins:12000,rewardGems:45,claimed:false},
 {id:"weekly-mythic",title:"Au-delà du Mythe",kind:"weekly" as const,target:1,progress:0,rewardCoins:25000,rewardGems:80,claimed:false}
];

export const defaultPlayer:PlayerState={
 username:"RUBANSU",level:1,xp:0,coins:3200,gems:120,tickets:7,luck:8,rollSpeed:1,inventoryCapacity:50,
 inventory:[
  {id:"starter-1",itemId:ITEMS[0].id,locked:true,favorite:false,obtainedAt:Date.now()-500000},
  {id:"starter-2",itemId:ITEMS[1].id,locked:false,favorite:true,obtainedAt:Date.now()-250000}
 ],
 equipped:ITEMS[1].id,equippedItems:[ITEMS[1].id],equippedSlots:1,favorites:[ITEMS[1].id],skills:{},upgrades:{},quests:seedQuests(),
 achievements:ACHIEVEMENTS.map(a=>({...a})),dailyRewards:[true,false,false,false,false,false,false],dailyClaimed:1,claimedCodes:[],
 zones:["Hidden Village"],selectedZone:"Hidden Village",
 stats:{totalRolls:0,rollsToday:0,bestDenominator:58,bestItemId:ITEMS[1].id,coinsEarned:0,coinsSpent:0,itemsSold:0,itemsEquipped:1,secretsFound:0,playSeconds:60,history:[ITEMS[1].id,ITEMS[0].id]},
 pity:{legendary:0,mythic:0,divine:0},boosts:{},titles:["Beginner"],equippedTitle:"Beginner",
 settings:{music:false,sfx:true,animations:true,shake:true,particles:true,reducedMotion:false,volume:70}
};

export const normalizePlayer=(saved:Partial<PlayerState>):PlayerState=>{
 const p={...defaultPlayer,...saved};
 const equippedItems=Array.isArray(saved.equippedItems)
   ? saved.equippedItems.filter(Boolean)
   : (saved.equipped?[saved.equipped]:defaultPlayer.equippedItems||[]);
 return {
  ...p,
  equippedItems,
  equipped:equippedItems[0],
  equippedSlots:Math.min(5,Math.max(1,Number(saved.equippedSlots||defaultPlayer.equippedSlots))),
  stats:{...defaultPlayer.stats,...(saved.stats||{})},
  pity:{
   legendary:Math.min(100,Math.max(0,Number(saved.pity?.legendary??defaultPlayer.pity.legendary))),
   mythic:Math.min(250,Math.max(0,Number(saved.pity?.mythic??defaultPlayer.pity.mythic))),
   divine:Math.min(499,Math.max(0,Number(saved.pity?.divine??defaultPlayer.pity.divine)))
  },
  settings:{...defaultPlayer.settings,...(saved.settings||{})},
  quests:saved.quests||seedQuests(),
  achievements:saved.achievements||ACHIEVEMENTS.map(a=>({...a})),
  inventory:saved.inventory||defaultPlayer.inventory,
  skills:saved.skills||{},
  upgrades:saved.upgrades||{}
 };
};

export const readPlayer=():PlayerState=>{
 try{
  const raw=localStorage.getItem(STORAGE);
  if(!raw)return defaultPlayer;
  return normalizePlayer(JSON.parse(raw) as Partial<PlayerState>);
 }catch{return defaultPlayer;}
};
export const usePlayer=()=>{
 const [player,setPlayer]=useState<PlayerState>(()=>readPlayer());
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(player)),[player]);
 return [player,setPlayer] as const;
};

export const usePlayerTicker=(setPlayer:Dispatch<SetStateAction<PlayerState>>)=>{
 useEffect(()=>{const id=window.setInterval(()=>setPlayer(p=>({...p,stats:{...p.stats,playSeconds:p.stats.playSeconds+1}})),1000);return()=>window.clearInterval(id)},[setPlayer]);
};

export const xpPercent=(player:PlayerState)=>Math.min(100,(player.xp/nextXp(player.level))*100);