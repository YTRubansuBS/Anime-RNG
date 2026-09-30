export type View="home"|"roll"|"collection"|"inventory"|"shop"|"skills"|"upgrades"|"quests"|"rewards"|"profile"|"leaderboard"|"achievements"|"stats"|"settings";
export type Rarity="COMMON"|"UNCOMMON"|"RARE"|"EPIC"|"LEGENDARY"|"MYTHIC"|"DIVINE"|"CELESTIAL"|"TRANSCENDENT"|"SECRET";
export interface RngItem{
 id:string; name:string; rarity:Rarity; denominator:number; chanceDisplay:string; chancePercent:number;
 value:number; power:number; description:string; zone:string; icon:string; color:string;
 effect:string; banner:"NORMAL"|"ANCIENT"|"DIVINE"|"SECRET";
}
export interface InventoryEntry{id:string;itemId:string;locked:boolean;favorite:boolean;obtainedAt:number;}
export interface Quest{id:string;title:string;kind:"daily"|"weekly";target:number;progress:number;rewardCoins:number;rewardGems:number;claimed:boolean;}
export interface Achievement{id:string;title:string;description:string;target:number;metric:string;rewardCoins:number;unlocked:boolean;}
export interface SkillNode{id:string;name:string;branch:string;level:number;maxLevel:number;cost:number;description:string;bonus:string;requires?:string[];}
export interface Upgrade{id:string;name:string;category:string;level:number;maxLevel:number;baseCost:number;effect:string;}
export interface PlayerState{
 username:string;level:number;xp:number;coins:number;gems:number;tickets:number;luck:number;rollSpeed:number;
 inventoryCapacity:number;inventory:InventoryEntry[];equipped?:string;favorites:string[];skills:Record<string,number>;
 upgrades:Record<string,number>;quests:Quest[];achievements:Achievement[];dailyRewards:boolean[];dailyClaimed:number;
 claimedCodes:string[];zones:string[];selectedZone:string;
 stats:{totalRolls:number;rollsToday:number;bestDenominator:number;bestItemId?:string;coinsEarned:number;coinsSpent:number;itemsSold:number;itemsEquipped:number;secretsFound:number;playSeconds:number;history:string[]};
 pity:{epic:number;legendary:number;mythic:number};boosts:Record<string,number>;titles:string[];equippedTitle:string;
 settings:{music:boolean;sfx:boolean;animations:boolean;shake:boolean;particles:boolean;reducedMotion:boolean;volume:number};
}