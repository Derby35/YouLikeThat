require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User            = require('../models/User');
const Player          = require('../models/Player');
const Stat            = require('../models/Stat');
const Watchlist       = require('../models/Watchlist');
const WatchlistPlayer = require('../models/WatchlistPlayer');

/* ── Stat helpers ── */
const q  = (gp,py,pt,ii,ry,rt)    => ({ gamesPlayed:gp, passingYards:py, passingTDs:pt, interceptions:ii, rushingYards:ry||0, rushingTDs:rt||0 });
const r  = (gp,ry,rt,rec,recy,rect) => ({ gamesPlayed:gp, rushingYards:ry, rushingTDs:rt, receptions:rec, receivingYards:recy, receivingTDs:rect });
const w  = (gp,rec,recy,rect,ry,rt) => ({ gamesPlayed:gp, receptions:rec, receivingYards:recy, receivingTDs:rect, rushingYards:ry||0, rushingTDs:rt||0 });
const fpts = s => +(
  (s.passingYards||0)*0.04+(s.passingTDs||0)*4+(s.interceptions||0)*-2+
  (s.rushingYards||0)*0.1+(s.rushingTDs||0)*6+
  (s.receivingYards||0)*0.1+(s.receivingTDs||0)*6+(s.receptions||0)*1
).toFixed(1);

/* ── Season data: playerName → { year: statObject } ── */
const SEASON_DATA = {
  /* ═══ QBs ═══ */
  'Lamar Jackson': {
    2021: q(16,2447,16,13,767,2), 2022: q(12,2242,17,7,764,3),
    2023: q(17,3678,24,7,821,5), 2024: q(17,4172,41,4,915,4),
  },
  'Josh Allen': {
    2021: q(17,4407,36,15,763,6), 2022: q(17,4283,35,14,762,7),
    2023: q(17,4306,29,18,524,15), 2024: q(17,3731,28,6,531,12),
  },
  'Jalen Hurts': {
    2021: q(16,3144,16,9,784,10), 2022: q(17,3701,22,6,760,13),
    2023: q(16,3858,23,15,605,15), 2024: q(16,3903,35,7,629,14),
  },
  'Joe Burrow': {
    2021: q(16,4611,34,14,118,2), 2022: q(16,4475,35,12,82,2),
    2023: q(10,2309,15,6,40,2), 2024: q(17,4918,43,6,89,2),
  },
  'Patrick Mahomes': {
    2021: q(17,4839,37,13,415,2), 2022: q(17,5250,41,12,358,4),
    2023: q(17,4183,26,14,389,4), 2024: q(17,4183,31,11,389,4),
  },
  'Brock Purdy': {
    2022: q(5,1374,13,4,39,1), 2023: q(17,4280,31,11,144,3),
    2024: q(17,4280,28,12,141,2),
  },
  'Jayden Daniels': {
    2024: q(17,3568,25,9,891,6),
  },
  'Baker Mayfield': {
    2021: q(14,3010,17,13,93,1), 2022: q(6,1313,9,3,48,1),
    2023: q(17,4044,28,10,89,3), 2024: q(17,4500,41,9,98,2),
  },
  'Sam Darnold': {
    2021: q(11,2527,9,13,213,2), 2022: q(13,2170,14,10,214,2),
    2023: q(3,637,4,1,30,0), 2024: q(14,3718,35,12,108,1),
  },
  'Jordan Love': {
    2021: q(4,411,3,3,23,0), 2022: q(5,526,6,3,46,0),
    2023: q(16,4159,32,11,223,4), 2024: q(16,4159,25,11,63,2),
  },
  'Justin Herbert': {
    2021: q(17,5014,38,15,302,3), 2022: q(17,4739,25,10,147,1),
    2023: q(17,3134,20,7,131,2), 2024: q(17,3870,23,9,107,2),
  },
  'Caleb Williams': {
    2024: q(17,3541,20,6,226,4),
  },
  'Anthony Richardson': {
    2023: q(4,577,4,5,222,4), 2024: q(11,1814,10,7,534,8),
  },
  'C.J. Stroud': {
    2023: q(15,4108,23,5,167,3), 2024: q(14,2898,15,7,68,0),
  },
  'Kyler Murray': {
    2021: q(16,3787,24,10,423,6), 2022: q(11,2368,14,7,418,2),
    2023: q(16,2888,18,8,355,2), 2024: q(16,3989,26,8,394,3),
  },
  'Trevor Lawrence': {
    2021: q(17,3641,12,17,334,2), 2022: q(17,4113,25,8,339,5),
    2023: q(17,4016,21,14,300,5), 2024: q(11,2045,11,9,144,0),
  },
  'Kirk Cousins': {
    2021: q(16,4221,33,7,44,0), 2022: q(16,4547,29,14,73,0),
    2023: q(15,2331,18,5,7,0), 2024: q(14,3508,18,16,75,2),
  },
  'Tua Tagovailoa': {
    2021: q(16,2653,16,10,37,1), 2022: q(13,3548,25,8,43,0),
    2023: q(16,4624,29,14,38,0), 2024: q(8,2165,16,8,60,0),
  },
  'Dak Prescott': {
    2021: q(16,4449,37,10,146,2), 2022: q(17,2860,23,15,155,0),
    2023: q(17,4516,36,9,96,2), 2024: q(8,1978,11,4,37,0),
  },
  'Geno Smith': {
    2021: q(2,63,0,1,0,0), 2022: q(17,4282,30,11,142,0),
    2023: q(16,3624,15,7,73,0), 2024: q(14,2666,20,8,105,0),
  },
  'Jared Goff': {
    2021: q(16,3245,19,8,4,0), 2022: q(17,4438,29,7,35,0),
    2023: q(17,4575,30,12,32,2), 2024: q(17,4629,37,12,64,0),
  },
  'Bo Nix': {
    2024: q(16,3307,29,12,242,5),
  },
  'Russell Wilson': {
    2021: q(14,3113,25,6,183,2), 2022: q(11,2835,16,11,259,4),
    2023: q(16,3070,26,8,244,3), 2024: q(11,2482,16,5,205,2),
  },
  'Drake Maye': {
    2024: q(13,2276,15,10,262,4),
  },
  'Aaron Rodgers': {
    2021: q(16,4115,37,4,101,3), 2022: q(16,3695,26,12,101,1),
    2023: q(4,1007,8,4,29,0), 2024: q(12,3897,28,11,91,0),
  },
  'Derek Carr': {
    2021: q(16,4804,23,14,84,0), 2022: q(15,3522,24,14,105,0),
    2023: q(17,2418,14,4,26,0), 2024: q(8,1468,8,5,32,0),
  },
  'Matthew Stafford': {
    2021: q(17,4886,41,17,43,2), 2022: q(10,2087,10,8,19,0),
    2023: q(17,3973,24,11,13,0), 2024: q(13,3762,20,8,23,0),
  },
  'Will Levis': {
    2023: q(9,1808,8,9,114,2), 2024: q(14,2697,13,13,147,1),
  },
  'Bryce Young': {
    2023: q(16,2877,11,10,214,2), 2024: q(13,2453,8,7,210,2),
  },
  "Aidan O'Connell": {
    2023: q(7,1068,5,4,41,0), 2024: q(11,2025,11,10,88,0),
  },
  'Jameis Winston': {
    2021: q(7,1746,14,3,71,0), 2022: q(11,2240,14,10,121,1),
    2023: q(6,1044,9,2,23,0), 2024: q(6,1475,6,5,42,0),
  },
  'Daniel Jones': {
    2021: q(16,2428,10,7,298,2), 2022: q(16,3205,15,5,708,7),
    2023: q(15,2186,7,7,389,6), 2024: q(7,1433,4,5,143,1),
  },

  /* ═══ RBs ═══ */
  'Saquon Barkley': {
    2021: r(16,593,4,41,263,2), 2022: r(16,1312,10,57,338,2),
    2023: r(17,962,6,52,280,2), 2024: r(17,2005,13,35,278,2),
  },
  'Derrick Henry': {
    2021: r(8,937,10,18,154,0), 2022: r(16,1538,13,31,214,2),
    2023: r(16,1167,12,22,155,0), 2024: r(16,1921,16,18,120,1),
  },
  'Christian McCaffrey': {
    2021: r(7,281,3,37,277,1), 2022: r(17,1139,8,85,574,4),
    2023: r(17,1459,14,67,564,7), 2024: r(16,1459,14,43,328,3),
  },
  "De'Von Achane": {
    2023: r(10,423,8,23,197,1), 2024: r(13,905,8,52,426,4),
  },
  'Bijan Robinson': {
    2023: r(17,976,7,59,487,4), 2024: r(17,1074,7,75,614,4),
  },
  'Josh Jacobs': {
    2021: r(15,872,9,33,348,2), 2022: r(17,1516,12,53,400,2),
    2023: r(17,805,6,41,314,2), 2024: r(17,1329,15,38,301,1),
  },
  'Kyren Williams': {
    2022: r(3,53,0,11,51,0), 2023: r(17,1144,12,44,250,3),
    2024: r(15,1170,12,38,283,2),
  },
  'James Cook': {
    2022: r(16,507,6,32,232,2), 2023: r(17,1122,2,44,379,0),
    2024: r(17,1009,16,44,342,0),
  },
  'Breece Hall': {
    2022: r(7,463,4,22,190,1), 2023: r(16,994,6,52,591,3),
    2024: r(17,994,9,55,591,2),
  },
  'Jonathan Taylor': {
    2021: r(17,1811,18,40,360,2), 2022: r(11,861,4,28,177,0),
    2023: r(15,741,7,34,271,1), 2024: r(17,1054,11,32,234,1),
  },
  'Travis Etienne': {
    2022: r(17,1125,5,35,316,1), 2023: r(16,800,4,48,354,3),
    2024: r(17,760,5,50,392,2),
  },
  'Alvin Kamara': {
    2021: r(13,898,4,47,439,5), 2022: r(13,897,4,48,490,4),
    2023: r(16,751,6,79,567,3), 2024: r(17,1100,9,54,429,2),
  },
  'Jahmyr Gibbs': {
    2023: r(14,945,10,52,316,3), 2024: r(16,1103,10,47,370,3),
  },
  'David Montgomery': {
    2021: r(13,849,7,33,213,1), 2022: r(17,1143,5,35,268,1),
    2023: r(11,581,13,19,127,0), 2024: r(16,856,11,24,175,0),
  },
  'Aaron Jones Sr.': {
    2021: r(16,799,4,52,391,2), 2022: r(17,1121,4,49,313,2),
    2023: r(15,720,5,40,245,2), 2024: r(17,794,7,58,391,3),
  },
  'Joe Mixon': {
    2021: r(16,1205,13,42,314,1), 2022: r(15,814,7,35,287,0),
    2023: r(14,1034,9,38,310,4), 2024: r(17,1101,6,44,377,3),
  },
  'Tony Pollard': {
    2021: r(16,719,6,39,337,1), 2022: r(16,1007,9,39,371,3),
    2023: r(17,1005,5,52,307,4), 2024: r(17,803,4,30,199,2),
  },
  'Rachaad White': {
    2022: r(17,529,3,64,394,2), 2023: r(14,599,5,46,375,3),
    2024: r(17,990,7,37,288,1),
  },
  "D'Andre Swift": {
    2021: r(13,617,7,62,452,2), 2022: r(16,1049,5,55,453,2),
    2023: r(17,1049,5,49,214,1), 2024: r(17,784,6,30,214,1),
  },
  'Brian Robinson Jr.': {
    2022: r(11,797,4,17,135,0), 2023: r(17,797,5,21,119,0),
    2024: r(17,1104,7,15,106,0),
  },
  'Najee Harris': {
    2021: r(17,1200,7,74,467,3), 2022: r(17,1034,7,42,214,1),
    2023: r(17,1035,8,44,214,1), 2024: r(17,1028,6,32,188,0),
  },
  'Chuba Hubbard': {
    2021: r(16,612,5,16,56,0), 2022: r(16,302,2,16,133,1),
    2023: r(14,704,6,27,182,2), 2024: r(17,1014,8,37,264,1),
  },
  'Javonte Williams': {
    2021: r(17,903,7,43,316,1), 2022: r(5,204,1,10,64,0),
    2023: r(17,775,5,33,265,3), 2024: r(16,765,5,25,202,1),
  },
  'Zack Moss': {
    2021: r(15,481,3,20,84,0), 2022: r(16,623,6,12,48,0),
    2023: r(15,898,8,26,143,1), 2024: r(17,904,8,24,167,1),
  },
  'Kenneth Walker III': {
    2022: r(11,581,4,14,89,1), 2023: r(16,905,7,23,152,0),
    2024: r(16,900,7,27,168,0),
  },
  'Raheem Mostert': {
    2021: r(8,253,3,16,99,0), 2022: r(14,791,8,27,201,0),
    2023: r(15,1012,6,31,166,1), 2024: r(14,741,8,22,141,1),
  },
  'Nick Chubb': {
    2021: r(14,1259,8,20,174,0), 2022: r(17,1525,12,22,105,0),
    2023: r(3,302,3,4,16,0), 2024: r(5,225,4,4,18,0),
  },
  'Gus Edwards': {
    2021: r(12,723,6,5,35,0), 2022: r(16,821,6,15,89,0),
    2023: r(14,543,3,12,67,1), 2024: r(14,669,7,9,71,0),
  },
  'Jaylen Warren': {
    2022: r(16,254,3,26,204,0), 2023: r(17,391,3,35,224,2),
    2024: r(17,491,3,29,241,2),
  },
  'Rico Dowdle': {
    2021: r(9,126,2,5,39,0), 2022: r(8,61,0,6,41,0),
    2023: r(16,482,2,14,96,0), 2024: r(17,1079,9,32,225,0),
  },
  'James Conner': {
    2021: r(15,752,15,37,375,4), 2022: r(15,718,6,35,222,1),
    2023: r(14,695,5,34,232,2), 2024: r(14,682,5,33,244,1),
  },
  'Zamir White': {
    2022: r(15,281,3,5,18,0), 2023: r(13,553,6,16,101,0),
    2024: r(16,785,7,16,117,0),
  },
  'Tank Bigsby': {
    2023: r(12,380,2,16,115,1), 2024: r(17,638,4,13,98,1),
  },
  'Blake Corum': {
    2024: r(14,423,5,14,101,0),
  },
  'Kendre Miller': {
    2023: r(10,424,3,20,84,0), 2024: r(12,614,5,15,111,0),
  },
  'Tyrone Tracy Jr.': {
    2024: r(14,601,4,19,150,0),
  },

  /* ═══ WRs ═══ */
  "Ja'Marr Chase": {
    2021: w(17,81,1455,13), 2022: w(14,87,1046,9),
    2023: w(15,100,1216,7), 2024: w(17,100,1708,17),
  },
  'CeeDee Lamb': {
    2021: w(16,79,1102,6), 2022: w(17,107,1359,9),
    2023: w(17,135,1749,12), 2024: w(17,95,1194,11),
  },
  'Amon-Ra St. Brown': {
    2021: w(17,90,912,5), 2022: w(17,106,1161,6),
    2023: w(17,119,1515,10), 2024: w(17,119,1263,10),
  },
  'Tyreek Hill': {
    2021: w(17,111,1239,9), 2022: w(17,119,1710,7),
    2023: w(17,119,1799,13), 2024: w(17,81,1100,6),
  },
  'Justin Jefferson': {
    2021: w(17,108,1616,10), 2022: w(17,128,1809,8),
    2023: w(10,68,1074,5), 2024: w(17,103,1533,10),
  },
  'Puka Nacua': {
    2023: w(16,105,1486,6), 2024: w(17,94,1025,4),
  },
  'A.J. Brown': {
    2021: w(13,63,869,5), 2022: w(16,88,1496,11),
    2023: w(16,106,1456,7), 2024: w(16,67,1020,7),
  },
  'Malik Nabers': {
    2024: w(16,109,1204,7),
  },
  'Brian Thomas Jr.': {
    2024: w(17,87,1282,10),
  },
  'Drake London': {
    2022: w(14,72,866,4), 2023: w(16,79,905,8),
    2024: w(17,100,1271,6),
  },
  'Zay Flowers': {
    2023: w(17,77,858,5), 2024: w(17,97,1138,6),
  },
  'Terry McLaurin': {
    2021: w(17,77,1053,5), 2022: w(16,77,919,5),
    2023: w(17,79,1033,5), 2024: w(17,68,1096,13),
  },
  'Mike Evans': {
    2021: w(16,74,1035,14), 2022: w(17,77,1124,8),
    2023: w(16,79,1255,13), 2024: w(17,65,1006,9),
  },
  'Ladd McConkey': {
    2024: w(17,82,1149,6),
  },
  'Tee Higgins': {
    2021: w(14,74,1091,6), 2022: w(16,74,836,7),
    2023: w(12,42,656,5), 2024: w(12,60,911,10),
  },
  'Courtland Sutton': {
    2021: w(15,58,776,2), 2022: w(16,64,829,2),
    2023: w(16,65,1012,10), 2024: w(17,72,1081,10),
  },
  'Chris Olave': {
    2022: w(16,72,1042,4), 2023: w(14,87,1353,5),
    2024: w(9,47,757,2),
  },
  'DeVonta Smith': {
    2021: w(17,64,916,5), 2022: w(17,95,1196,7),
    2023: w(17,107,1066,7), 2024: w(16,72,833,6),
  },
  'Stefon Diggs': {
    2021: w(17,103,1225,10), 2022: w(17,108,1429,11),
    2023: w(16,107,1183,8), 2024: w(8,47,496,2),
  },
  'Davante Adams': {
    2021: w(16,123,1553,11), 2022: w(17,100,1516,14),
    2023: w(17,103,1144,8), 2024: w(16,100,1144,7),
  },
  'George Pickens': {
    2022: w(17,52,801,4), 2023: w(17,63,1140,5),
    2024: w(16,59,900,3),
  },
  'Jaylen Waddle': {
    2021: w(16,104,1015,6), 2022: w(15,75,1356,9),
    2023: w(15,72,1014,4), 2024: w(14,69,936,7),
  },
  'DJ Moore': {
    2021: w(17,93,1157,4), 2022: w(17,67,888,7),
    2023: w(17,96,1364,8), 2024: w(17,77,1064,8),
  },
  'Brandon Aiyuk': {
    2021: w(17,56,826,5), 2022: w(17,78,1015,8),
    2023: w(16,75,1342,7), 2024: w(14,75,1012,6),
  },
  'Rashee Rice': {
    2023: w(17,79,938,5), 2024: w(4,20,288,3),
  },
  'Xavier Worthy': {
    2024: w(17,59,638,7),
  },
  'Rome Odunze': {
    2024: w(17,61,709,4),
  },
  'Marvin Harrison Jr.': {
    2024: w(17,66,1023,8),
  },
  'Jaxon Smith-Njigba': {
    2023: w(17,63,628,3), 2024: w(17,100,1130,5),
  },
  'DeAndre Hopkins': {
    2021: w(10,42,572,3), 2022: w(9,64,717,3),
    2023: w(16,75,1057,7), 2024: w(14,69,821,4),
  },
  'Jerry Jeudy': {
    2021: w(7,38,467,0), 2022: w(15,67,972,6),
    2023: w(16,54,758,2), 2024: w(16,63,741,4),
  },
  'Keenan Allen': {
    2021: w(16,106,1138,6), 2022: w(16,108,1243,8),
    2023: w(13,84,1015,6), 2024: w(17,72,765,4),
  },
  'Adam Thielen': {
    2021: w(10,67,726,10), 2022: w(17,70,716,6),
    2023: w(16,61,591,4), 2024: w(14,56,614,5),
  },
  'Tank Dell': {
    2023: w(9,47,709,7), 2024: w(7,35,398,3),
  },
  'Quentin Johnston': {
    2023: w(16,44,552,2), 2024: w(16,47,594,3),
  },
  'Diontae Johnson': {
    2021: w(16,107,1161,8), 2022: w(17,86,882,5),
    2023: w(17,78,717,5), 2024: w(15,72,717,4),
  },

  /* ═══ TEs ═══ */
  'Trey McBride': {
    2022: w(17,68,570,2), 2023: w(17,90,825,3),
    2024: w(17,111,1146,6),
  },
  'Sam LaPorta': {
    2023: w(17,86,889,10), 2024: w(17,72,777,10),
  },
  'Mark Andrews': {
    2021: w(17,107,1361,9), 2022: w(17,73,848,5),
    2023: w(14,53,544,6), 2024: w(17,67,886,6),
  },
  'Travis Kelce': {
    2021: w(17,92,1125,9), 2022: w(17,110,1338,12),
    2023: w(17,93,984,5), 2024: w(17,62,823,3),
  },
  'Evan Engram': {
    2021: w(13,46,408,3), 2022: w(13,73,766,4),
    2023: w(17,114,963,4), 2024: w(17,76,858,4),
  },
  'Jake Ferguson': {
    2022: w(17,27,236,3), 2023: w(17,71,761,5),
    2024: w(17,73,812,6),
  },
  'Cole Kmet': {
    2021: w(17,60,612,3), 2022: w(17,53,544,4),
    2023: w(17,42,383,2), 2024: w(17,77,719,6),
  },
  'David Njoku': {
    2021: w(15,36,475,4), 2022: w(15,53,628,4),
    2023: w(16,81,882,6), 2024: w(17,61,765,5),
  },
  'Pat Freiermuth': {
    2021: w(17,60,497,7), 2022: w(12,61,732,5),
    2023: w(17,59,634,4), 2024: w(17,64,700,7),
  },
  'Kyle Pitts': {
    2021: w(17,68,1026,1), 2022: w(12,28,356,2),
    2023: w(16,67,667,2), 2024: w(17,72,790,3),
  },
  'Dallas Goedert': {
    2021: w(15,56,830,4), 2022: w(15,55,702,3),
    2023: w(17,59,752,7), 2024: w(14,68,830,5),
  },
  'Dalton Kincaid': {
    2023: w(16,73,673,2), 2024: w(12,51,548,2),
  },
  'Isaiah Likely': {
    2022: w(17,36,373,3), 2023: w(13,20,258,2),
    2024: w(17,65,713,7),
  },
  'Jonnu Smith': {
    2021: w(15,28,448,2), 2022: w(17,37,252,2),
    2023: w(17,71,769,9), 2024: w(17,73,884,8),
  },
  'Cade Otton': {
    2022: w(16,42,404,2), 2023: w(16,44,395,2),
    2024: w(17,52,516,4),
  },
  'Gerald Everett': {
    2021: w(17,48,478,4), 2022: w(17,58,594,5),
    2023: w(15,41,391,4), 2024: w(14,46,492,3),
  },
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      User.deleteMany({}), Player.deleteMany({}), Stat.deleteMany({}),
      Watchlist.deleteMany({}), WatchlistPlayer.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    /* ── Users ── */
    const salt  = await bcrypt.genSalt(10);
    const admin = await User.create({ username: 'admin',      passwordHash: await bcrypt.hash('Admin123!',  salt), role: 'admin' });
    const john  = await User.create({ username: 'john_doe',   passwordHash: await bcrypt.hash('Password1!', salt), role: 'standard' });
    const jane  = await User.create({ username: 'jane_smith', passwordHash: await bcrypt.hash('Password1!', salt), role: 'standard' });
    console.log('Users seeded (3)');

    /* ═══════════════════════════════════════════════════════
       PLAYERS — 120 total (QB:32  RB:36  WR:36  TE:16)
    ═══════════════════════════════════════════════════════ */
    const players = await Player.insertMany([

      /* ── QBs (32) ── */
      { name: 'Lamar Jackson',       position:'QB', jerseyNumber: 8,  teamName:'Baltimore Ravens',         teamAbbr:'BAL', age:27 },
      { name: 'Josh Allen',          position:'QB', jerseyNumber:17,  teamName:'Buffalo Bills',            teamAbbr:'BUF', age:28 },
      { name: 'Jalen Hurts',         position:'QB', jerseyNumber: 1,  teamName:'Philadelphia Eagles',      teamAbbr:'PHI', age:26 },
      { name: 'Joe Burrow',          position:'QB', jerseyNumber: 9,  teamName:'Cincinnati Bengals',       teamAbbr:'CIN', age:28 },
      { name: 'Patrick Mahomes',     position:'QB', jerseyNumber:15,  teamName:'Kansas City Chiefs',       teamAbbr:'KC',  age:29 },
      { name: 'Brock Purdy',         position:'QB', jerseyNumber:13,  teamName:'San Francisco 49ers',      teamAbbr:'SF',  age:25 },
      { name: 'Jayden Daniels',      position:'QB', jerseyNumber: 5,  teamName:'Washington Commanders',    teamAbbr:'WSH', age:23 },
      { name: 'Baker Mayfield',      position:'QB', jerseyNumber: 6,  teamName:'Tampa Bay Buccaneers',     teamAbbr:'TB',  age:30 },
      { name: 'Sam Darnold',         position:'QB', jerseyNumber:14,  teamName:'Minnesota Vikings',        teamAbbr:'MIN', age:27 },
      { name: 'Jordan Love',         position:'QB', jerseyNumber:10,  teamName:'Green Bay Packers',        teamAbbr:'GB',  age:26 },
      { name: 'Justin Herbert',      position:'QB', jerseyNumber:10,  teamName:'Los Angeles Chargers',     teamAbbr:'LAC', age:26 },
      { name: 'Caleb Williams',      position:'QB', jerseyNumber:18,  teamName:'Chicago Bears',            teamAbbr:'CHI', age:23 },
      { name: 'Anthony Richardson',  position:'QB', jerseyNumber: 5,  teamName:'Indianapolis Colts',       teamAbbr:'IND', age:22 },
      { name: 'C.J. Stroud',         position:'QB', jerseyNumber: 7,  teamName:'Houston Texans',           teamAbbr:'HOU', age:23 },
      { name: 'Kyler Murray',        position:'QB', jerseyNumber: 1,  teamName:'Arizona Cardinals',        teamAbbr:'ARI', age:27 },
      { name: 'Trevor Lawrence',     position:'QB', jerseyNumber:16,  teamName:'Jacksonville Jaguars',     teamAbbr:'JAX', age:25 },
      { name: 'Kirk Cousins',        position:'QB', jerseyNumber: 8,  teamName:'Atlanta Falcons',          teamAbbr:'ATL', age:36 },
      { name: 'Tua Tagovailoa',      position:'QB', jerseyNumber: 1,  teamName:'Miami Dolphins',           teamAbbr:'MIA', age:26 },
      { name: 'Dak Prescott',        position:'QB', jerseyNumber: 4,  teamName:'Dallas Cowboys',           teamAbbr:'DAL', age:31 },
      { name: 'Geno Smith',          position:'QB', jerseyNumber: 7,  teamName:'Seattle Seahawks',         teamAbbr:'SEA', age:34 },
      { name: 'Jared Goff',          position:'QB', jerseyNumber:16,  teamName:'Detroit Lions',            teamAbbr:'DET', age:30 },
      { name: 'Bo Nix',              position:'QB', jerseyNumber:10,  teamName:'Denver Broncos',           teamAbbr:'DEN', age:24 },
      { name: 'Russell Wilson',      position:'QB', jerseyNumber: 3,  teamName:'Pittsburgh Steelers',      teamAbbr:'PIT', age:36 },
      { name: 'Drake Maye',          position:'QB', jerseyNumber:10,  teamName:'New England Patriots',     teamAbbr:'NE',  age:22 },
      { name: 'Aaron Rodgers',       position:'QB', jerseyNumber: 8,  teamName:'New York Jets',            teamAbbr:'NYJ', age:41 },
      { name: 'Derek Carr',          position:'QB', jerseyNumber: 4,  teamName:'New Orleans Saints',       teamAbbr:'NO',  age:33 },
      { name: 'Matthew Stafford',    position:'QB', jerseyNumber: 9,  teamName:'Los Angeles Rams',         teamAbbr:'LAR', age:36 },
      { name: 'Will Levis',          position:'QB', jerseyNumber: 8,  teamName:'Tennessee Titans',         teamAbbr:'TEN', age:25 },
      { name: 'Bryce Young',         position:'QB', jerseyNumber: 9,  teamName:'Carolina Panthers',        teamAbbr:'CAR', age:23 },
      { name: "Aidan O'Connell",     position:'QB', jerseyNumber: 4,  teamName:'Las Vegas Raiders',        teamAbbr:'LV',  age:26 },
      { name: 'Jameis Winston',      position:'QB', jerseyNumber: 5,  teamName:'Cleveland Browns',         teamAbbr:'CLE', age:31 },
      { name: 'Daniel Jones',        position:'QB', jerseyNumber: 8,  teamName:'New York Giants',          teamAbbr:'NYG', age:27 },

      /* ── RBs (36) ── */
      { name: 'Saquon Barkley',      position:'RB', jerseyNumber:26,  teamName:'Philadelphia Eagles',      teamAbbr:'PHI', age:27 },
      { name: 'Derrick Henry',       position:'RB', jerseyNumber:22,  teamName:'Baltimore Ravens',         teamAbbr:'BAL', age:30 },
      { name: 'Christian McCaffrey', position:'RB', jerseyNumber:23,  teamName:'San Francisco 49ers',      teamAbbr:'SF',  age:28 },
      { name: "De'Von Achane",       position:'RB', jerseyNumber:28,  teamName:'Miami Dolphins',           teamAbbr:'MIA', age:23 },
      { name: 'Bijan Robinson',      position:'RB', jerseyNumber: 7,  teamName:'Atlanta Falcons',          teamAbbr:'ATL', age:23 },
      { name: 'Josh Jacobs',         position:'RB', jerseyNumber: 8,  teamName:'Green Bay Packers',        teamAbbr:'GB',  age:26 },
      { name: 'Kyren Williams',      position:'RB', jerseyNumber:23,  teamName:'Los Angeles Rams',         teamAbbr:'LAR', age:24 },
      { name: 'James Cook',          position:'RB', jerseyNumber: 4,  teamName:'Buffalo Bills',            teamAbbr:'BUF', age:24 },
      { name: 'Breece Hall',         position:'RB', jerseyNumber:20,  teamName:'New York Jets',            teamAbbr:'NYJ', age:23 },
      { name: 'Jonathan Taylor',     position:'RB', jerseyNumber:28,  teamName:'Indianapolis Colts',       teamAbbr:'IND', age:25 },
      { name: 'Travis Etienne',      position:'RB', jerseyNumber: 1,  teamName:'Jacksonville Jaguars',     teamAbbr:'JAX', age:25 },
      { name: 'Alvin Kamara',        position:'RB', jerseyNumber:41,  teamName:'New Orleans Saints',       teamAbbr:'NO',  age:29 },
      { name: 'Jahmyr Gibbs',        position:'RB', jerseyNumber:26,  teamName:'Detroit Lions',            teamAbbr:'DET', age:22 },
      { name: 'David Montgomery',    position:'RB', jerseyNumber: 5,  teamName:'Detroit Lions',            teamAbbr:'DET', age:27 },
      { name: 'Aaron Jones Sr.',     position:'RB', jerseyNumber:33,  teamName:'Minnesota Vikings',        teamAbbr:'MIN', age:30 },
      { name: 'Joe Mixon',           position:'RB', jerseyNumber:28,  teamName:'Houston Texans',           teamAbbr:'HOU', age:28 },
      { name: 'Tony Pollard',        position:'RB', jerseyNumber:20,  teamName:'Tennessee Titans',         teamAbbr:'TEN', age:27 },
      { name: 'Rachaad White',       position:'RB', jerseyNumber:29,  teamName:'Tampa Bay Buccaneers',     teamAbbr:'TB',  age:26 },
      { name: "D'Andre Swift",       position:'RB', jerseyNumber: 0,  teamName:'Chicago Bears',            teamAbbr:'CHI', age:25 },
      { name: 'Brian Robinson Jr.',  position:'RB', jerseyNumber: 8,  teamName:'Washington Commanders',    teamAbbr:'WSH', age:25 },
      { name: 'Najee Harris',        position:'RB', jerseyNumber:22,  teamName:'Pittsburgh Steelers',      teamAbbr:'PIT', age:26 },
      { name: 'Chuba Hubbard',       position:'RB', jerseyNumber:30,  teamName:'Carolina Panthers',        teamAbbr:'CAR', age:25 },
      { name: 'Javonte Williams',    position:'RB', jerseyNumber:33,  teamName:'Denver Broncos',           teamAbbr:'DEN', age:24 },
      { name: 'Zack Moss',           position:'RB', jerseyNumber:21,  teamName:'Cincinnati Bengals',       teamAbbr:'CIN', age:27 },
      { name: 'Kenneth Walker III',  position:'RB', jerseyNumber: 9,  teamName:'Seattle Seahawks',         teamAbbr:'SEA', age:24 },
      { name: 'Raheem Mostert',      position:'RB', jerseyNumber:31,  teamName:'Miami Dolphins',           teamAbbr:'MIA', age:32 },
      { name: 'Nick Chubb',          position:'RB', jerseyNumber:24,  teamName:'Cleveland Browns',         teamAbbr:'CLE', age:28 },
      { name: 'Gus Edwards',         position:'RB', jerseyNumber:35,  teamName:'Los Angeles Chargers',     teamAbbr:'LAC', age:29 },
      { name: 'Jaylen Warren',       position:'RB', jerseyNumber:30,  teamName:'Pittsburgh Steelers',      teamAbbr:'PIT', age:25 },
      { name: 'Rico Dowdle',         position:'RB', jerseyNumber:23,  teamName:'Dallas Cowboys',           teamAbbr:'DAL', age:26 },
      { name: 'James Conner',        position:'RB', jerseyNumber: 6,  teamName:'Arizona Cardinals',        teamAbbr:'ARI', age:29 },
      { name: 'Zamir White',         position:'RB', jerseyNumber:35,  teamName:'Las Vegas Raiders',        teamAbbr:'LV',  age:24 },
      { name: 'Tank Bigsby',         position:'RB', jerseyNumber:30,  teamName:'Jacksonville Jaguars',     teamAbbr:'JAX', age:23 },
      { name: 'Blake Corum',         position:'RB', jerseyNumber:24,  teamName:'Los Angeles Rams',         teamAbbr:'LAR', age:22 },
      { name: 'Kendre Miller',       position:'RB', jerseyNumber:23,  teamName:'New Orleans Saints',       teamAbbr:'NO',  age:23 },
      { name: 'Tyrone Tracy Jr.',    position:'RB', jerseyNumber:29,  teamName:'New York Giants',          teamAbbr:'NYG', age:24 },

      /* ── WRs (36) ── */
      { name: "Ja'Marr Chase",       position:'WR', jerseyNumber: 1,  teamName:'Cincinnati Bengals',       teamAbbr:'CIN', age:24 },
      { name: 'CeeDee Lamb',         position:'WR', jerseyNumber:88,  teamName:'Dallas Cowboys',           teamAbbr:'DAL', age:25 },
      { name: 'Amon-Ra St. Brown',   position:'WR', jerseyNumber:14,  teamName:'Detroit Lions',            teamAbbr:'DET', age:24 },
      { name: 'Tyreek Hill',         position:'WR', jerseyNumber:10,  teamName:'Miami Dolphins',           teamAbbr:'MIA', age:30 },
      { name: 'Justin Jefferson',    position:'WR', jerseyNumber:18,  teamName:'Minnesota Vikings',        teamAbbr:'MIN', age:25 },
      { name: 'Puka Nacua',          position:'WR', jerseyNumber:17,  teamName:'Los Angeles Rams',         teamAbbr:'LAR', age:23 },
      { name: 'A.J. Brown',          position:'WR', jerseyNumber:11,  teamName:'Philadelphia Eagles',      teamAbbr:'PHI', age:27 },
      { name: 'Malik Nabers',        position:'WR', jerseyNumber: 1,  teamName:'New York Giants',          teamAbbr:'NYG', age:21 },
      { name: 'Brian Thomas Jr.',    position:'WR', jerseyNumber: 7,  teamName:'Jacksonville Jaguars',     teamAbbr:'JAX', age:22 },
      { name: 'Drake London',        position:'WR', jerseyNumber: 5,  teamName:'Atlanta Falcons',          teamAbbr:'ATL', age:23 },
      { name: 'Zay Flowers',         position:'WR', jerseyNumber: 4,  teamName:'Baltimore Ravens',         teamAbbr:'BAL', age:23 },
      { name: 'Terry McLaurin',      position:'WR', jerseyNumber:17,  teamName:'Washington Commanders',    teamAbbr:'WSH', age:29 },
      { name: 'Mike Evans',          position:'WR', jerseyNumber:13,  teamName:'Tampa Bay Buccaneers',     teamAbbr:'TB',  age:31 },
      { name: 'Ladd McConkey',       position:'WR', jerseyNumber:15,  teamName:'Los Angeles Chargers',     teamAbbr:'LAC', age:23 },
      { name: 'Tee Higgins',         position:'WR', jerseyNumber: 5,  teamName:'Cincinnati Bengals',       teamAbbr:'CIN', age:25 },
      { name: 'Courtland Sutton',    position:'WR', jerseyNumber:14,  teamName:'Denver Broncos',           teamAbbr:'DEN', age:29 },
      { name: 'Chris Olave',         position:'WR', jerseyNumber:12,  teamName:'New Orleans Saints',       teamAbbr:'NO',  age:24 },
      { name: 'DeVonta Smith',       position:'WR', jerseyNumber: 6,  teamName:'Philadelphia Eagles',      teamAbbr:'PHI', age:26 },
      { name: 'Stefon Diggs',        position:'WR', jerseyNumber:14,  teamName:'Houston Texans',           teamAbbr:'HOU', age:31 },
      { name: 'Davante Adams',       position:'WR', jerseyNumber:17,  teamName:'Las Vegas Raiders',        teamAbbr:'LV',  age:32 },
      { name: 'George Pickens',      position:'WR', jerseyNumber:14,  teamName:'Pittsburgh Steelers',      teamAbbr:'PIT', age:23 },
      { name: 'Jaylen Waddle',       position:'WR', jerseyNumber:17,  teamName:'Miami Dolphins',           teamAbbr:'MIA', age:26 },
      { name: 'DJ Moore',            position:'WR', jerseyNumber: 2,  teamName:'Chicago Bears',            teamAbbr:'CHI', age:27 },
      { name: 'Brandon Aiyuk',       position:'WR', jerseyNumber:11,  teamName:'San Francisco 49ers',      teamAbbr:'SF',  age:26 },
      { name: 'Rashee Rice',         position:'WR', jerseyNumber: 4,  teamName:'Kansas City Chiefs',       teamAbbr:'KC',  age:24 },
      { name: 'Xavier Worthy',       position:'WR', jerseyNumber: 1,  teamName:'Kansas City Chiefs',       teamAbbr:'KC',  age:22 },
      { name: 'Rome Odunze',         position:'WR', jerseyNumber:15,  teamName:'Chicago Bears',            teamAbbr:'CHI', age:23 },
      { name: 'Marvin Harrison Jr.', position:'WR', jerseyNumber:18,  teamName:'Arizona Cardinals',        teamAbbr:'ARI', age:22 },
      { name: 'Jaxon Smith-Njigba',  position:'WR', jerseyNumber:11,  teamName:'Seattle Seahawks',         teamAbbr:'SEA', age:23 },
      { name: 'DeAndre Hopkins',     position:'WR', jerseyNumber:10,  teamName:'Tennessee Titans',         teamAbbr:'TEN', age:32 },
      { name: 'Jerry Jeudy',         position:'WR', jerseyNumber: 3,  teamName:'Cleveland Browns',         teamAbbr:'CLE', age:25 },
      { name: 'Keenan Allen',        position:'WR', jerseyNumber:13,  teamName:'Chicago Bears',            teamAbbr:'CHI', age:32 },
      { name: 'Adam Thielen',        position:'WR', jerseyNumber: 4,  teamName:'Carolina Panthers',        teamAbbr:'CAR', age:34 },
      { name: 'Tank Dell',           position:'WR', jerseyNumber: 3,  teamName:'Houston Texans',           teamAbbr:'HOU', age:24 },
      { name: 'Quentin Johnston',    position:'WR', jerseyNumber: 1,  teamName:'Los Angeles Chargers',     teamAbbr:'LAC', age:23 },
      { name: 'Diontae Johnson',     position:'WR', jerseyNumber:11,  teamName:'Baltimore Ravens',         teamAbbr:'BAL', age:28 },

      /* ── TEs (16) ── */
      { name: 'Trey McBride',        position:'TE', jerseyNumber:85,  teamName:'Arizona Cardinals',        teamAbbr:'ARI', age:24 },
      { name: 'Sam LaPorta',         position:'TE', jerseyNumber:85,  teamName:'Detroit Lions',            teamAbbr:'DET', age:23 },
      { name: 'Mark Andrews',        position:'TE', jerseyNumber:89,  teamName:'Baltimore Ravens',         teamAbbr:'BAL', age:29 },
      { name: 'Travis Kelce',        position:'TE', jerseyNumber:87,  teamName:'Kansas City Chiefs',       teamAbbr:'KC',  age:35 },
      { name: 'Evan Engram',         position:'TE', jerseyNumber:17,  teamName:'Jacksonville Jaguars',     teamAbbr:'JAX', age:30 },
      { name: 'Jake Ferguson',       position:'TE', jerseyNumber:87,  teamName:'Dallas Cowboys',           teamAbbr:'DAL', age:24 },
      { name: 'Cole Kmet',           position:'TE', jerseyNumber:85,  teamName:'Chicago Bears',            teamAbbr:'CHI', age:25 },
      { name: 'David Njoku',         position:'TE', jerseyNumber:85,  teamName:'Cleveland Browns',         teamAbbr:'CLE', age:28 },
      { name: 'Pat Freiermuth',      position:'TE', jerseyNumber:88,  teamName:'Pittsburgh Steelers',      teamAbbr:'PIT', age:25 },
      { name: 'Kyle Pitts',          position:'TE', jerseyNumber: 8,  teamName:'Atlanta Falcons',          teamAbbr:'ATL', age:24 },
      { name: 'Dallas Goedert',      position:'TE', jerseyNumber:88,  teamName:'Philadelphia Eagles',      teamAbbr:'PHI', age:29 },
      { name: 'Dalton Kincaid',      position:'TE', jerseyNumber:86,  teamName:'Buffalo Bills',            teamAbbr:'BUF', age:26 },
      { name: 'Isaiah Likely',       position:'TE', jerseyNumber:80,  teamName:'Baltimore Ravens',         teamAbbr:'BAL', age:25 },
      { name: 'Jonnu Smith',         position:'TE', jerseyNumber:81,  teamName:'Miami Dolphins',           teamAbbr:'MIA', age:29 },
      { name: 'Cade Otton',          position:'TE', jerseyNumber:87,  teamName:'Tampa Bay Buccaneers',     teamAbbr:'TB',  age:25 },
      { name: 'Gerald Everett',      position:'TE', jerseyNumber: 7,  teamName:'Los Angeles Chargers',     teamAbbr:'LAC', age:31 },
    ]);

    const byName = Object.fromEntries(players.map(p => [p.name, p]));
    const findPlayer = (name) => {
      if (!byName[name]) throw new Error(`Player not found in DB: "${name}"`);
      return byName[name];
    };

    console.log(`Players seeded (${players.length})`);
    const byPos = players.reduce((a,p) => { a[p.position]=(a[p.position]||0)+1; return a; }, {});
    console.log('  Breakdown:', Object.entries(byPos).map(([k,v])=>`${k}:${v}`).join('  '));

    /* ── Build all stat docs across all seasons ── */
    const statDocs = [];
    for (const [playerName, seasonMap] of Object.entries(SEASON_DATA)) {
      const playerDoc = findPlayer(playerName);
      for (const [year, statObj] of Object.entries(seasonMap)) {
        statDocs.push({
          player: playerDoc._id,
          season: Number(year),
          ...statObj,
          fantasyPoints: fpts(statObj),
        });
      }
    }

    await Stat.insertMany(statDocs, { ordered: false });
    console.log(`Seeded ${statDocs.length} stat rows across 4 seasons for ${players.length} players`);

    /* ── Watchlists ── */
    const wl1 = await Watchlist.create({ name: 'My Top Picks', owner: admin._id });
    const wl2 = await Watchlist.create({ name: 'Sleepers 2024', owner: john._id });
    const wl3 = await Watchlist.create({ name: 'Waiver Wire Targets', owner: jane._id });

    const top5 = players.slice(0, 5);
    await WatchlistPlayer.insertMany(top5.map((pl, i) => ({
      watchlist: wl1._id,
      player:    pl._id,
      addedAt:   new Date(),
      sortOrder: i,
    })));
    const mid5 = players.slice(32, 37);
    await WatchlistPlayer.insertMany(mid5.map((pl, i) => ({
      watchlist: wl2._id,
      player:    pl._id,
      addedAt:   new Date(),
      sortOrder: i,
    })));
    console.log('Watchlists seeded (3)');

    await mongoose.disconnect();
    console.log('Done. Disconnected.');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
