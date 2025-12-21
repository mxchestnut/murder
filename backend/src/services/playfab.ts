import PlayFab from 'playfab-sdk/Scripts/PlayFab/PlayFab';
import PlayFabClient from 'playfab-sdk/Scripts/PlayFab/PlayFabClient';
// @ts-ignore - PlayFab SDK doesn't have full TypeScript definitions
import PlayFabServer from 'playfab-sdk/Scripts/PlayFab/PlayFabServer';
import * as zlib from 'zlib';

// PathCompanion Title ID (publicly visible)
const TITLE_ID = 'BCA4C';

// Initialize PlayFab
PlayFab.settings.titleId = TITLE_ID;

export interface PathCompanionAuth {
  playfabId: string;
  sessionTicket: string;
  entityToken: string;
}

export interface PathCompanionCharacter {
  characterId: string;
  characterName: string;
  data: any; // The character sheet data from PlayFab
  lastModified: Date;
}

/**
 * Login to PlayFab using username/email and password
 * This gets a session ticket that can be used for subsequent requests
 * Tries username first, then email if username fails
 */
export async function loginToPlayFab(username: string, password: string): Promise<PathCompanionAuth> {
  return new Promise((resolve, reject) => {
    // First try login with username
    const usernameRequest = {
      TitleId: TITLE_ID,
      Username: username,
      Password: password,
      InfoRequestParameters: {
        GetUserAccountInfo: true,
      }
    };

    PlayFabClient.LoginWithPlayFab(usernameRequest, (error: any, result: any) => {
      if (error) {
        // If username login fails with "User not found", try email login
        if (error.error === 'AccountNotFound' || error.errorCode === 1001) {
          console.log('Username login failed, trying email login...');
          
          const emailRequest = {
            TitleId: TITLE_ID,
            Email: username, // Try using the input as email
            Password: password,
            InfoRequestParameters: {
              GetUserAccountInfo: true,
            }
          };
          
          PlayFabClient.LoginWithEmailAddress(emailRequest, (emailError: any, emailResult: any) => {
            if (emailError) {
              console.error('PlayFab email login error:', JSON.stringify(emailError, null, 2));
              const errorMsg = emailError.errorMessage || emailError.error || 'PlayFab login failed';
              reject(new Error(errorMsg));
              return;
            }
            
            if (!emailResult || !emailResult.data) {
              console.error('PlayFab email login - no result data. Result:', emailResult);
              reject(new Error('No data returned from PlayFab'));
              return;
            }
            
            console.log('PlayFab email login successful for:', username);
            resolve({
              playfabId: emailResult.data.PlayFabId,
              sessionTicket: emailResult.data.SessionTicket,
              entityToken: emailResult.data.EntityToken?.EntityToken || '',
            });
          });
        } else {
          console.error('PlayFab login error details:', JSON.stringify(error, null, 2));
          const errorMsg = error.errorMessage || error.error || 'PlayFab login failed';
          reject(new Error(errorMsg));
        }
        return;
      }

      if (!result || !result.data) {
        console.error('PlayFab login - no result data. Result:', result);
        reject(new Error('No data returned from PlayFab'));
        return;
      }

      console.log('PlayFab login successful for:', username);
      resolve({
        playfabId: result.data.PlayFabId,
        sessionTicket: result.data.SessionTicket,
        entityToken: result.data.EntityToken?.EntityToken || '',
      });
    });
  });
}

/**
 * Get user data from PlayFab
 * This typically includes character references
 */
export async function getUserData(sessionTicket: string): Promise<any> {
  return new Promise((resolve, reject) => {
    PlayFab.settings.sessionTicket = sessionTicket;

    const request = {
      SessionTicket: sessionTicket,
    };

    PlayFabClient.GetUserData(request, (error: any, result: any) => {
      if (error) {
        console.error('GetUserData error:', JSON.stringify(error, null, 2));
        reject(new Error(error.errorMessage || 'Failed to get user data'));
        return;
      }

      console.log('GetUserData success, data keys:', Object.keys(result?.data?.Data || {}));
      resolve(result?.data?.Data || {});
    });
  });
}

/**
 * Get all characters for a user
 * PathCompanion stores character data in PlayFab's title data or user data
 */
export async function getCharacterFromShareKey(shareKey: string): Promise<PathCompanionCharacter> {
  try {
    // Decode the share key
    const decoded = JSON.parse(Buffer.from(shareKey, 'base64').toString('utf-8'));
    const { account, character } = decoded;
    
    console.log('Fetching shared character:', { account, character });
    
    // Use PlayFab Client API with anonymous login to access public data
    // This requires the character to be publicly shared
    return new Promise((resolve, reject) => {
      // First, login anonymously
      PlayFabClient.LoginWithCustomID({
        CustomId: `cyarika_import_${Date.now()}`,
        CreateAccount: true,
        TitleId: TITLE_ID
      }, (error: any, result: any) => {
        if (error) {
          console.error('PlayFab anonymous login error:', error);
          return reject(new Error('Failed to authenticate with PathCompanion'));
        }
        
        const sessionTicket = result.data.SessionTicket;
        
        // Now try to get the user's public data
        PlayFabClient.GetUserData({
          PlayFabId: account,
          Keys: [character]
        }, (error2: any, result2: any) => {
          if (error2) {
            console.error('PlayFab GetUserData error:', error2);
            return reject(new Error('Character not found or not publicly shared'));
          }
          
          if (!result2?.data?.Data?.[character]) {
            return reject(new Error('Character not found'));
          }
          
          try {
            const zlib = require('zlib');
            const charValue = result2.data.Data[character];
            const rawValue = charValue.Value;
            
            // Decompress the character data
            const compressed = Buffer.from(rawValue, 'base64');
            const decompressed = zlib.inflateSync(compressed);
            const charData = JSON.parse(decompressed.toString('utf-8'));
            
            console.log('Successfully decompressed character:', charData.name || 'Unknown');
            
            resolve({
              characterId: character,
              characterName: charData.name || charData.characterName || charData.Name || 'Unnamed Character',
              data: charData,
              lastModified: new Date(charValue.LastUpdated || Date.now()),
            });
          } catch (e) {
            console.error('Failed to decompress character data:', e);
            reject(new Error('Failed to parse character data'));
          }
        });
      });
    });
  } catch (error) {
    throw new Error(`Invalid share key: ${error}`);
  }
}

/**
 * Get a specific character's data
 */
export async function getCharacter(sessionTicket: string, characterId: string): Promise<PathCompanionCharacter | null> {
  try {
    const userData = await getUserData(sessionTicket);
    
    if (!userData[characterId]) {
      return null;
    }

    // PathCompanion stores character data as base64-encoded gzipped JSON
    const charValue = userData[characterId];
    const compressedData = typeof charValue.Value === 'string' 
      ? charValue.Value 
      : JSON.stringify(charValue.Value);

    // PathCompanion stores character data as base64-encoded compressed JSON
    const buffer = Buffer.from(compressedData, 'base64');
    
    return new Promise((resolve, reject) => {
      // Try inflate (deflate compression) instead of gunzip
      zlib.inflate(buffer, (err, decompressed) => {
        let charData;
        
        if (err) {
          // Try inflateRaw if inflate fails
          zlib.inflateRaw(buffer, (err2, decompressed2) => {
            if (err2) {
              // Try plain JSON as last resort
              try {
                const plainText = buffer.toString('utf8');
                charData = JSON.parse(plainText);
                console.log(`Character ${characterId} parsed as plain JSON (not compressed)`);
                resolve({
                  characterId,
                  characterName: charData.name || charData.characterName || charData.Name || 'Unnamed Character',
                  data: charData,
                  lastModified: new Date(charValue.LastUpdated || Date.now()),
                });
              } catch (parseErr) {
                console.error(`Failed to parse character ${characterId} data:`, {
                  inflateError: err.message,
                  inflateRawError: err2.message,
                  parseError: parseErr,
                  bufferHex: buffer.toString('hex').substring(0, 100)
                });
                reject(new Error('Failed to decompress/parse character data'));
              }
              return;
            }
            
            // inflateRaw succeeded
            try {
              const decompressedStr = decompressed2.toString('utf8');
              console.log(`Decompressed ${characterId} with inflateRaw:`, decompressedStr.substring(0, 200));
              charData = JSON.parse(decompressedStr);
              resolve({
                characterId,
                characterName: charData.name || charData.characterName || charData.Name || 'Unnamed Character',
                data: charData,
                lastModified: new Date(charValue.LastUpdated || Date.now()),
              });
            } catch (parseErr) {
              console.error(`Failed to parse inflateRaw decompressed ${characterId}:`, parseErr);
              reject(new Error('Failed to parse character data'));
            }
          });
          return;
        }
        
        // inflate succeeded
        try {
          const decompressedStr = decompressed.toString('utf8');
          console.log(`Decompressed ${characterId} with inflate:`, decompressedStr.substring(0, 200));
          charData = JSON.parse(decompressedStr);
          
          // Log the full structure to find the name
          console.log(`Full character structure keys for ${characterId}:`, Object.keys(charData));
          if (charData.characterInfo) {
            console.log(`characterInfo keys:`, Object.keys(charData.characterInfo));
            console.log(`characterInfo first 500 chars:`, JSON.stringify(charData.characterInfo).substring(0, 500));
          }
          
          // Extract character name from PathCompanion structure
          const characterName = charData.characterInfo?.characterName || 
                                charData.campaignName ||  // For GM characters
                                charData.name || 
                                charData.characterName || 
                                charData.Name || 
                                charData.characterInfo?.name ||
                                charData.basicInfo?.name ||
                                characterId;  // Fallback to ID instead of "Unnamed Character"
          
          console.log(`Extracted character name for ${characterId}: ${characterName}`);
          
          resolve({
            characterId,
            characterName,
            data: charData,
            lastModified: new Date(charValue.LastUpdated || Date.now()),
          });
        } catch (parseErr) {
          console.error(`Failed to parse inflate decompressed ${characterId}:`, parseErr);
          reject(new Error('Failed to parse character data'));
        }
      });
    });
  } catch (error) {
    throw new Error(`Failed to get character: ${error}`);
  }
}

/**
 * Helper to extract character level from PathCompanion character data
 */
export function extractCharacterLevel(characterData: any): number {
  // Try different possible locations for level data
  if (characterData.characterInfo?.levelInfo) {
    // levelInfo is an object with keys like "1", "2", etc. for each level
    const levels = Object.keys(characterData.characterInfo.levelInfo);
    const numericLevels = levels.map(l => parseInt(l)).filter(l => !isNaN(l));
    if (numericLevels.length > 0) {
      return Math.max(...numericLevels);
    }
  }
  
  // Fallback checks
  if (characterData.level !== undefined) return characterData.level;
  if (characterData.characterInfo?.level !== undefined) return characterData.characterInfo.level;
  if (characterData.characterLevel !== undefined) return characterData.characterLevel;
  
  return 1; // Default to level 1
}

/**
 * Helper to extract ability scores from PathCompanion character data
 * PathCompanion uses Pathfinder 2e, which has the same core abilities as D&D
 */
export function extractAbilityScores(characterData: any) {
  // PathCompanion structure: characterInfo.stats with complex score objects
  const stats = characterData.characterInfo?.stats || 
                characterData.stats || 
                characterData.abilities || 
                characterData.abilityScores || 
                {};
  
  // Helper to extract score from PathCompanion's complex structure
  const extractScore = (stat: any): number => {
    if (typeof stat === 'number') return stat;
    if (stat?.total !== undefined) return stat.total;
    if (stat?.permanentTotal !== undefined) return stat.permanentTotal;
    if (stat?.value !== undefined) return stat.value;
    return 10; // Default
  };
  
  return {
    strength: extractScore(stats.strength || stats.str),
    dexterity: extractScore(stats.dexterity || stats.dex),
    constitution: extractScore(stats.constitution || stats.con),
    intelligence: extractScore(stats.intelligence || stats.int),
    wisdom: extractScore(stats.wisdom || stats.wis),
    charisma: extractScore(stats.charisma || stats.cha),
  };
}

/**
 * Calculate ability modifier (same for both D&D and Pathfinder)
 */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Extract combat stats from PathCompanion character data
 */
export function extractCombatStats(characterData: any) {
  const charInfo = characterData.characterInfo || {};
  const stats = charInfo.stats || {};
  
  console.log('Extracting combat stats from:', {
    hasCharInfo: !!characterData.characterInfo,
    hasStats: !!charInfo.stats,
    charInfoKeys: Object.keys(charInfo).slice(0, 10)
  });
  
  return {
    currentHp: charInfo.currentHp || charInfo.hitPoints?.current || 0,
    maxHp: charInfo.maxHp || charInfo.hitPoints?.max || 0,
    tempHp: charInfo.tempHp || charInfo.hitPoints?.temp || 0,
    armorClass: charInfo.ac || charInfo.armorClass || stats.armorClass?.total || 10,
    touchAc: charInfo.touchAc || stats.armorClass?.touch || 10,
    flatFootedAc: charInfo.flatFootedAc || stats.armorClass?.flatFooted || 10,
    initiative: charInfo.initiative || stats.initiative?.total || 0,
    speed: charInfo.speed || charInfo.baseSpeed || 30,
    baseAttackBonus: charInfo.bab || charInfo.baseAttackBonus || 0,
    cmb: charInfo.cmb || stats.cmb?.total || 0,
    cmd: charInfo.cmd || stats.cmd?.total || 10,
  };
}

/**
 * Extract saving throws from PathCompanion character data
 */
export function extractSavingThrows(characterData: any) {
  const charInfo = characterData.characterInfo || {};
  const saves = charInfo.savingThrows || charInfo.saves || {};
  
  return {
    fortitudeSave: saves.fortitude?.total || saves.fort?.total || saves.fortitude || 0,
    reflexSave: saves.reflex?.total || saves.ref?.total || saves.reflex || 0,
    willSave: saves.will?.total || saves.will || 0,
  };
}

/**
 * Extract skills from PathCompanion character data
 */
export function extractSkills(characterData: any) {
  const charInfo = characterData.characterInfo || {};
  const skillsData = charInfo.skills || {};
  const skills: any = {};
  
  console.log('Extracting skills from:', { 
    hasCharInfo: !!characterData.characterInfo,
    hasSkills: !!charInfo.skills,
    skillsKeys: Object.keys(skillsData).slice(0, 5)
  });
  
  // PathCompanion stores skills as objects with ranks, modifiers, etc.
  for (const [skillName, skillValue] of Object.entries(skillsData)) {
    if (typeof skillValue === 'object' && skillValue !== null) {
      const skill: any = skillValue;
      skills[skillName] = {
        ranks: skill.ranks || 0,
        total: skill.total || skill.value || 0,
        misc: skill.misc || skill.modifier || 0,
        classSkill: skill.classSkill || false
      };
    }
  }
  
  console.log(`Extracted ${Object.keys(skills).length} skills`);
  
  return skills;
}

/**
 * Extract feats from PathCompanion character data
 */
export function extractFeats(characterData: any) {
  const charInfo = characterData.characterInfo || {};
  const featsData = charInfo.feats || [];
  
  if (Array.isArray(featsData)) {
    return featsData.map((feat: any) => {
      if (typeof feat === 'string') return feat;
      return feat.name || feat.featName || 'Unknown Feat';
    });
  }
  
  // If feats is an object, convert to array
  if (typeof featsData === 'object') {
    return Object.keys(featsData).map(key => {
      const feat = featsData[key];
      if (typeof feat === 'string') return feat;
      return feat.name || feat.featName || key;
    });
  }
  
  return [];
}

/**
 * Extract special abilities from PathCompanion character data
 */
export function extractSpecialAbilities(characterData: any) {
  const charInfo = characterData.characterInfo || {};
  const abilities: string[] = [];
  
  // Check various possible locations for special abilities
  if (charInfo.specialAbilities && Array.isArray(charInfo.specialAbilities)) {
    abilities.push(...charInfo.specialAbilities.map((a: any) => 
      typeof a === 'string' ? a : a.name || a.description || 'Unknown Ability'
    ));
  }
  
  if (charInfo.classAbilities && Array.isArray(charInfo.classAbilities)) {
    abilities.push(...charInfo.classAbilities.map((a: any) => 
      typeof a === 'string' ? a : a.name || a.description || 'Unknown Ability'
    ));
  }
  
  if (charInfo.traits && Array.isArray(charInfo.traits)) {
    abilities.push(...charInfo.traits.map((t: any) => 
      typeof t === 'string' ? t : t.name || t.description || 'Unknown Trait'
    ));
  }
  
  return abilities;
}

/**
 * Extract weapons from PathCompanion character data
 */
export function extractWeapons(characterData: any) {
  const charInfo = characterData.characterInfo || {};
  const weaponsData = charInfo.weapons || charInfo.equipment?.weapons || [];
  
  if (!Array.isArray(weaponsData)) return [];
  
  return weaponsData.map((weapon: any) => ({
    name: weapon.name || weapon.weaponName || 'Unknown Weapon',
    attackBonus: weapon.attackBonus || weapon.attack || 0,
    damage: weapon.damage || weapon.damageRoll || '1d6',
    critical: weapon.critical || weapon.crit || '×2',
    range: weapon.range || weapon.rangeIncrement || 0,
    type: weapon.type || weapon.damageType || 'S',
    notes: weapon.notes || weapon.description || ''
  }));
}

/**
 * Extract armor from PathCompanion character data
 */
export function extractArmor(characterData: any) {
  const charInfo = characterData.characterInfo || {};
  const armorData = charInfo.armor || charInfo.equipment?.armor || {};
  
  if (typeof armorData !== 'object' || armorData === null) return {};
  
  return {
    name: armorData.name || armorData.armorName || 'No Armor',
    acBonus: armorData.acBonus || armorData.bonus || 0,
    maxDex: armorData.maxDex || armorData.maxDexBonus || 99,
    checkPenalty: armorData.checkPenalty || armorData.armorCheckPenalty || 0,
    spellFailure: armorData.spellFailure || armorData.arcaneSpellFailure || 0,
    type: armorData.type || 'light'
  };
}

/**
 * Extract spells from PathCompanion character data
 */
export function extractSpells(characterData: any) {
  const charInfo = characterData.characterInfo || {};
  const spellsData = charInfo.spells || {};
  const spells: any = {};
  
  // PathCompanion might organize spells by level
  for (let level = 0; level <= 9; level++) {
    const levelKey = `level${level}`;
    if (spellsData[levelKey] || spellsData[level.toString()]) {
      const levelSpells = spellsData[levelKey] || spellsData[level.toString()];
      if (Array.isArray(levelSpells)) {
        spells[level] = levelSpells.map((spell: any) => 
          typeof spell === 'string' ? spell : spell.name || spell.spellName || 'Unknown Spell'
        );
      }
    }
  }
  
  return spells;
}

/**
 * Extract basic character info (race, alignment, deity, size)
 */
export function extractBasicInfo(characterData: any) {
  const charInfo = characterData.characterInfo || {};
  
  return {
    race: charInfo.race || charInfo.raceName || '',
    alignment: charInfo.alignment || '',
    deity: charInfo.deity || charInfo.god || '',
    size: charInfo.size || 'Medium'
  };
}

export default {
  loginToPlayFab,
  getUserData,
  getCharacterFromShareKey,
  getCharacter,
  extractAbilityScores,
  extractCharacterLevel,
  calculateModifier,
  extractCombatStats,
  extractSavingThrows,
  extractSkills,
  extractFeats,
  extractSpecialAbilities,
  extractWeapons,
  extractArmor,
  extractSpells,
  extractBasicInfo,
};
