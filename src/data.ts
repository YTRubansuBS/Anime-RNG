import type {Achievement,Rarity,RngItem,SkillNode,Upgrade} from "./types";

export const RARITIES:Record<Rarity,{label:string;icon:string;tone:string;glow:string}>={
 COMMON:{label:"COMMON",icon:"◌",tone:"slate",glow:"rgba(148,163,184,.16)"},
 UNCOMMON:{label:"UNCOMMON",icon:"✦",tone:"emerald",glow:"rgba(52,211,153,.22)"},
 RARE:{label:"RARE",icon:"◆",tone:"sky",glow:"rgba(56,189,248,.24)"},
 EPIC:{label:"EPIC",icon:"✧",tone:"violet",glow:"rgba(167,139,250,.28)"},
 LEGENDARY:{label:"LEGENDARY",icon:"✹",tone:"amber",glow:"rgba(251,191,36,.30)"},
 MYTHIC:{label:"MYTHIC",icon:"☄",tone:"rose",glow:"rgba(244,63,94,.32)"},
 DIVINE:{label:"DIVINE",icon:"◈",tone:"cyan",glow:"rgba(103,232,249,.36)"},
 CELESTIAL:{label:"CELESTIAL",icon:"✺",tone:"pink",glow:"rgba(232,121,249,.38)"},
 TRANSCENDENT:{label:"TRANSCENDENT",icon:"✦",tone:"indigo",glow:"rgba(165,180,252,.42)"},
 SECRET:{label:"SECRET",icon:"⬢",tone:"fuchsia",glow:"rgba(217,70,239,.55)"}
};

export const ZONES=[
 {id:"hidden-village",name:"Hidden Village",index:0,bonus:"+0% Luck",description:"Ruelles de brume et lanternes suspendues."},
 {id:"neon-city",name:"Neon City",index:1,bonus:"+8% Luck",description:"Ville néon vibrante et saturée de particules."},
 {id:"sacred-temple",name:"Sacred Temple",index:2,bonus:"+16% Luck",description:"Temple silencieux chargé d'énergie."},
 {id:"sky-realm",name:"Sky Realm",index:3,bonus:"+24% Luck",description:"Îles flottantes sous une mer d'étoiles."},
 {id:"void-realm",name:"Void Realm",index:4,bonus:"+32% Luck",description:"Faille obscure où la chance devient instable."},
 {id:"celestial-realm",name:"Celestial Realm",index:5,bonus:"+40% Luck",description:"Cité cosmique réservée aux grands chasseurs."},
 {id:"infinity-realm",name:"Infinity Realm",index:6,bonus:"+55% Luck",description:"Dimension finale au bord du destin."}
];

const names:Record<Rarity,string[]>={
 COMMON:["Astra Novice","Kairo Spark","Mika Ember","Sora Thread","Neru Pulse","Yuna Mist","Rin Slate","Kaze Drift","Hana Bloom","Taki Rune","Mira Glint","Ren Ash","Noa Prism","Yoru Flicker","Kiri Moss","Aoi Byte","Raku Echo","Nami Veil","Kai Orbit","Luma Seed"],
 UNCOMMON:["Velan Shard","Sena Volt","Iori Mirage","Koru Bloom","Nyx Runner","Mako Flare","Aya Cipher","Rei Lantern","Sumi Arc","Tora Crest","Kira Flux","Aven Gale","Niko Pulse","Mira Halo","Zen Coil","Rhea Spark","Kyo Drift","Yume Trace","Rinova Star","Solin Veil"],
 RARE:["Astral Fang","Neon Ronin","Azure Warden","Violet Gale","Crimson Script","Moon Circuit","Thunder Saint","Frost Sigil","Dusk Samurai","Solar Edge","Prism Oracle","Iron Comet","Echo Valkyr","Void Dancer","Ember Seer"],
 EPIC:["Starbreaker","Night Bloom","Radiant Oni","Eclipse Runner","Sky Requiem","Crimson Monarch","Tempest Sage","Astral Vow","Void Harvester","Moonfire Queen","Sable Nova","Celestial Archer","Storm Oracle","Dream Shogun","Obsidian Halo"],
 LEGENDARY:["Aurora Sovereign","Inferno Regent","Moonlit Emperor","Stormblade Prime","Nebula Queen","Eternal Warden","Fate Weaver","Astral Tyrant","Solar Revenant","Crimson Zenith"],
 MYTHIC:["World-Ender Kael","Infinite Sakura","Void Apostle","Chrono Leviathan","Starfall Herald","Eclipse Deity","Astral Overlord","Heaven Rift"],
 DIVINE:["Seraph of Dawn","Celestial Judicator","Divine Nova","Aether Empress","Heavenly Requiem"],
 CELESTIAL:["Crown of Infinity","Starlit Deity","Cosmic Shogun","Eternal Prism"],
 TRANSCENDENT:["Beyond Fate","Origin Singularity"],
 SECRET:["Void Emperor"]
};

const denominators:Record<Rarity,number[]>={
 COMMON:[50,58,64,72,80,90,100,110,120,135,150,165,180,200,220,250,280,320,360,420],
 UNCOMMON:[450,500,560,620,700,780,860,950,1050,1150,1300,1450,1600,1800,2000,2200,2500,2800,3200,3600],
 RARE:[4000,4500,5000,6000,7000,8000,9000,10000,12000,14000,16000,18000,20000,24000,28000],
 EPIC:[32000,36000,42000,48000,56000,65000,75000,90000,105000,120000,140000,165000,190000,220000,250000],
 LEGENDARY:[320000,380000,450000,520000,600000,700000,800000,900000,1000000,1200000],
 MYTHIC:[1500000,1800000,2200000,2700000,3200000,3800000,4500000,5500000],
 DIVINE:[6500000,7500000,8500000,10000000,12000000],
 CELESTIAL:[15000000,18000000,22000000,28000000],
 TRANSCENDENT:[40000000,70000000],
 SECRET:[10000000]
};

const order:Rarity[]=["COMMON","UNCOMMON","RARE","EPIC","LEGENDARY","MYTHIC","DIVINE","CELESTIAL","TRANSCENDENT","SECRET"];
const icons=["◉","✦","◈","◌","⬢","✧","✺","✹","☄","◆"];
const bannerFor=(_r:Rarity):RngItem["banner"]=>"NORMAL";
const power:Record<Rarity,number>={COMMON:10,UNCOMMON:28,RARE:65,EPIC:130,LEGENDARY:260,MYTHIC:520,DIVINE:1000,CELESTIAL:2400,TRANSCENDENT:6000,SECRET:15000};
const value:Record<Rarity,number>={COMMON:6,UNCOMMON:18,RARE:55,EPIC:140,LEGENDARY:320,MYTHIC:800,DIVINE:1800,CELESTIAL:5000,TRANSCENDENT:15000,SECRET:50000};

const buildItems=():RngItem[]=>{
 const out:RngItem[]=[];
 order.forEach(r=>{
  names[r].forEach((name,index)=>{
   const denominator=denominators[r][index];
   const id=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
   out.push({
    id,name,rarity:r,denominator,
    chanceDisplay:"1/"+denominator.toLocaleString("fr-FR").replace(/\u00a0/g," "),
    chancePercent:100/denominator,
    value:value[r]+index*Math.max(1,Math.floor(value[r]/6)),
    power:power[r]+index*Math.max(2,Math.floor(power[r]/5)),
    description:name+" canalise une force originale et laisse une signature visuelle unique.",
    zone:ZONES[index%ZONES.length].name,icon:icons[index%icons.length],
    color:"hsl("+(190+(index*31%150))+" 90% 65%)",
    effect:r==="SECRET"?"Void Collapse":r.toLowerCase()+" resonance",banner:bannerFor(r)
   });
  });
 });
 return out;
};

export const ITEMS=buildItems();
export const getItem=(id?:string)=>ITEMS.find(i=>i.id===id);
export const TITLES=["Beginner","Lucky","Fortune","Hunter","Mythic Hunter","Divine Hunter","Secret Seeker","RNG Master","Beyond Fate"];

export const SKILLS:SkillNode[]=[
 {id:"luck-1",name:"Luck I",branch:"Luck",level:1,maxLevel:5,cost:1,description:"Chance de base améliorée.",bonus:"+5 Luck"},
 {id:"luck-2",name:"Luck II",branch:"Luck",level:2,maxLevel:5,cost:2,description:"Affûte ton instinct.",bonus:"+8 Luck",requires:["luck-1"]},
 {id:"luck-3",name:"Luck III",branch:"Luck",level:3,maxLevel:5,cost:3,description:"Ta chance devient inquiétante.",bonus:"+12 Luck",requires:["luck-2"]},
 {id:"luck-super",name:"Super Luck",branch:"Luck",level:4,maxLevel:5,cost:5,description:"Amplifie les hautes raretés.",bonus:"+20 Luck",requires:["luck-3"]},
 {id:"luck-ultra",name:"Ultra Luck",branch:"Luck",level:5,maxLevel:5,cost:8,description:"Une anomalie statistique ambulante.",bonus:"+35 Luck",requires:["luck-super"]},
 {id:"roll-1",name:"Faster Roll I",branch:"Roll",level:1,maxLevel:5,cost:1,description:"Réduit le temps entre deux rolls.",bonus:"+4% speed"},
 {id:"roll-2",name:"Faster Roll II",branch:"Roll",level:2,maxLevel:5,cost:2,description:"Ton cycle devient plus nerveux.",bonus:"+7% speed",requires:["roll-1"]},
 {id:"roll-3",name:"Faster Roll III",branch:"Roll",level:3,maxLevel:5,cost:3,description:"Les rolls s'enchaînent.",bonus:"+10% speed",requires:["roll-2"]},
 {id:"roll-rapid",name:"Rapid Roll",branch:"Roll",level:4,maxLevel:5,cost:5,description:"Cadence agressive.",bonus:"+15% speed",requires:["roll-3"]},
 {id:"roll-instant",name:"Instant Roll",branch:"Roll",level:5,maxLevel:5,cost:8,description:"Cap vers le rythme maximal.",bonus:"+22% speed",requires:["roll-rapid"]},
 {id:"fortune-1",name:"Bonus Coins I",branch:"Fortune",level:1,maxLevel:5,cost:1,description:"Chaque vente rapporte davantage.",bonus:"+10% coins"},
 {id:"fortune-2",name:"Bonus Coins II",branch:"Fortune",level:2,maxLevel:5,cost:2,description:"Tes découvertes deviennent rentables.",bonus:"+15% coins",requires:["fortune-1"]},
 {id:"fortune-double",name:"Double Coins",branch:"Fortune",level:3,maxLevel:5,cost:4,description:"Double les récompenses temporaires.",bonus:"x2 coins",requires:["fortune-2"]},
 {id:"fortune-treasure",name:"Treasure Finder",branch:"Fortune",level:4,maxLevel:5,cost:6,description:"Détecte des gains secondaires.",bonus:"+1 bonus roll",requires:["fortune-double"]},
 {id:"fortune-jackpot",name:"Jackpot",branch:"Fortune",level:5,maxLevel:5,cost:10,description:"Petite chance de x5 coins.",bonus:"5% jackpot",requires:["fortune-treasure"]},
 {id:"survival-shield",name:"Shield",branch:"Survival",level:1,maxLevel:3,cost:2,description:"Protège d'une mauvaise série.",bonus:"1 shield"},
 {id:"survival-second",name:"Second Chance",branch:"Survival",level:2,maxLevel:3,cost:4,description:"Annule un mauvais résultat.",bonus:"reroll fail",requires:["survival-shield"]},
 {id:"survival-rare",name:"Rare Protection",branch:"Survival",level:3,maxLevel:3,cost:6,description:"Conserve ton meilleur drop.",bonus:"auto-lock",requires:["survival-second"]},
 {id:"special-secret",name:"Secret Finder",branch:"Special",level:1,maxLevel:5,cost:4,description:"Aide ciblée sur les anomalies.",bonus:"+3% secret luck"},
 {id:"special-mythic",name:"Mythic Hunter",branch:"Special",level:2,maxLevel:5,cost:5,description:"Boost ciblé sur MYTHIC.",bonus:"+5% mythic luck",requires:["special-secret"]},
 {id:"special-divine",name:"Divine Hunter",branch:"Special",level:3,maxLevel:5,cost:7,description:"Affûte les drops DIVINE.",bonus:"+7% divine luck",requires:["special-mythic"]},
 {id:"special-jackpot",name:"Jackpot Protocol",branch:"Special",level:4,maxLevel:5,cost:9,description:"Chance de duplicate bonus.",bonus:"+4% duplicate",requires:["special-divine"]}
];

export const UPGRADES:Upgrade[]=[
 ["u-luck","Luck","Character",10,120,"+5 Luck"],["u-speed","Speed","Character",10,160,"+3% speed"],["u-energy","Energy","Character",10,180,"+4% energy"],["u-inventory","Inventory","Character",10,220,"+5 slots"],["u-coins","Coins","Character",10,180,"+8% coins"],["u-xp","XP","Character",10,200,"+8% XP"],
 ["u-rare","Rare Chance","RNG",10,280,"+4% rare luck"],["u-epic","Epic Chance","RNG",10,420,"+4% epic luck"],["u-legendary","Legendary Chance","RNG",10,650,"+3% legendary luck"],["u-mythic","Mythic Chance","RNG",10,900,"+2% mythic luck"],["u-divine","Divine Chance","RNG",10,1500,"+2% divine luck"],["u-secret","Secret Chance","RNG",10,3500,"+1% secret luck"],
 ["u-auto-roll","Auto Roll","Automation",1,2500,"Auto roll permanent"],["u-auto-sell","Auto Sell","Automation",1,3200,"Sell Common automatically"],["u-auto-equip","Auto Equip","Automation",1,4000,"Equip strongest drop"],["u-auto-collect","Auto Collect","Automation",1,5000,"Collect quest rewards"]
].map(x=>({id:x[0] as string,name:x[1] as string,category:x[2] as string,level:0,maxLevel:x[3] as number,baseCost:x[4] as number,effect:x[5] as string}));

export const ACHIEVEMENTS:Achievement[]=[
 ["a-first","First Roll","Effectue ton premier roll.",1,"totalRolls",50],["a-100","100 Rolls","Atteins 100 rolls.",100,"totalRolls",250],["a-1000","1 000 Rolls","Atteins 1 000 rolls.",1000,"totalRolls",1200],
 ["a-epic","First Epic","Obtiens un EPIC.",1,"epic",800],["a-legendary","First Legendary","Obtiens un LEGENDARY.",1,"legendary",2500],["a-mythic","First Mythic","Obtiens un MYTHIC.",1,"mythic",6000],
 ["a-divine","First Divine","Obtiens un DIVINE.",1,"divine",15000],["a-secret","First Secret","Obtiens un SECRET.",1,"secret",50000],["a-10k","One in Ten Thousand","Obtiens un résultat 1/10 000 ou plus rare.",10000,"bestDenominator",3000],
 ["a-100k","One in One Hundred Thousand","Obtiens un 1/100 000 ou plus rare.",100000,"bestDenominator",10000],["a-1m","One in a Million","Obtiens un 1/1 000 000 ou plus rare.",1000000,"bestDenominator",25000],
 ["a-collection","Collector","Possède 100 découvertes uniques.",100,"collection",9000],["a-master","RNG Master","Atteins le niveau 20.",20,"level",10000],
 ["a-sell","Merchant","Vends 250 objets.",250,"itemsSold",7000],["a-zones","Beyond The Village","Débloque 5 zones.",5,"zones",12000]
].map(x=>({id:x[0] as string,title:x[1] as string,description:x[2] as string,target:x[3] as number,metric:x[4] as string,rewardCoins:x[5] as number,unlocked:false}));

export const DAILY_REWARD_CARDS=[
 {day:1,icon:"◈",title:"Coins",value:"+500",reward:{coins:500}}, {day:2,icon:"✦",title:"Luck Boost",value:"5 min",reward:{boost:"luck",seconds:300}},
 {day:3,icon:"◈",title:"Coins",value:"+1 200",reward:{coins:1200}}, {day:4,icon:"◆",title:"Tickets",value:"+3",reward:{tickets:3}},
 {day:5,icon:"☄",title:"Super Boost",value:"10 min",reward:{boost:"super",seconds:600}}, {day:6,icon:"◈",title:"Coins",value:"+3 500",reward:{coins:3500}},
 {day:7,icon:"⬢",title:"Fate Chest",value:"★★★",reward:{coins:10000,gems:100}}
];

export const SHOP_PRODUCTS=[
 {id:"luck5",name:"+5% Luck",price:500,currency:"coins",icon:"✦",desc:"Boost de fortune pendant 20 rolls.",action:"luck:5"},
 {id:"luck10",name:"+10% Luck",price:900,currency:"coins",icon:"✧",desc:"Poussée de fortune pendant 45 rolls.",action:"luck:10"},
 {id:"luck25",name:"+25% Luck",price:25,currency:"gems",icon:"☄",desc:"Boost premium pendant 5 minutes.",action:"boost:luck:300"},
 {id:"luck50",name:"+50% Luck",price:65,currency:"gems",icon:"✹",desc:"Boost premium massif pendant 15 minutes.",action:"boost:luck:900"},
 {id:"speed",name:"Rapid Cycle",price:1800,currency:"coins",icon:"↯",desc:"Réduit le cooldown visuel.",action:"speed:10"},
 {id:"auto",name:"Auto Roll",price:45,currency:"gems",icon:"∞",desc:"Lance automatiquement.",action:"auto"},
 {id:"slots10",name:"+10 Slots",price:700,currency:"coins",icon:"▦",desc:"Augmente la capacité.",action:"slots:10"},
 {id:"slots25",name:"+25 Slots",price:30,currency:"gems",icon:"▤",desc:"Ajoute 25 emplacements.",action:"slots:25"},
 {id:"slots50",name:"+50 Slots",price:55,currency:"gems",icon:"▥",desc:"Ajoute 50 emplacements.",action:"slots:50"},
 {id:"x2luck5",name:"x2 Luck • 5 min",price:20,currency:"gems",icon:"⚡",desc:"Double la chance du moteur.",action:"boost:luck:300"},
 {id:"x2luck15",name:"x2 Luck • 15 min",price:50,currency:"gems",icon:"⚡",desc:"Double la chance pendant 15 minutes.",action:"boost:luck:900"},
 {id:"x2roll10",name:"x2 Rolls • 10 min",price:35,currency:"gems",icon:"⟳",desc:"Double le rythme de jeu.",action:"boost:rolls:600"},
 {id:"super",name:"Super Boost",price:90,currency:"gems",icon:"✺",desc:"Luck, XP et coins amplifiés.",action:"boost:super:900"},
 {id:"aurora",name:"Aurora Trail",price:50,currency:"gems",icon:"∿",desc:"Traînée cosmique exclusive.",action:"cosmetic"},
 {id:"void",name:"Void Theme",price:80,currency:"gems",icon:"⬢",desc:"Thème noir-violet.",action:"cosmetic"}
];

export const CODES:Record<string,{coins?:number;gems?:number;tickets?:number}>={ASCEND:{coins:2500},VOID777:{gems:25},RNG2026:{tickets:7,coins:777}};
export const EVENTS=[{id:"lucky-festival",title:"LUCKY FESTIVAL",duration:"24h",bonus:"+50% Luck",description:"Un courant de fortune traverse toutes les zones."}];