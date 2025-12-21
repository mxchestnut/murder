import PlayFab from 'playfab-sdk/Scripts/PlayFab/PlayFab';
import PlayFabClient from 'playfab-sdk/Scripts/PlayFab/PlayFabClient';

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

    PlayFabClient.GetUserData(request, (result: any, error: any) => {
      if (error) {
        reject(new Error(error.errorMessage || 'Failed to get user data'));
        return;
      }

      resolve(result?.data?.Data || {});
    });
  });
}

/**
 * Get all characters for a user
 * PathCompanion stores character data in PlayFab's title data or user data
 */
export async function getCharacterList(sessionTicket: string): Promise<PathCompanionCharacter[]> {
  try {
    const userData = await getUserData(sessionTicket);
    
    // PathCompanion might store character list in user data
    // The exact structure depends on how PathCompanion implements it
    // This is a reasonable assumption - we may need to adjust based on actual data structure
    const characters: PathCompanionCharacter[] = [];

    // Look for character data keys
    for (const [key, value] of Object.entries(userData)) {
      if (key.startsWith('Character_') || key.includes('character')) {
        try {
          const charData = typeof value === 'string' ? JSON.parse(value as string) : value;
          characters.push({
            characterId: key,
            characterName: charData.name || charData.characterName || 'Unnamed Character',
            data: charData,
            lastModified: new Date(charData.lastModified || Date.now()),
          });
        } catch (e) {
          console.error('Failed to parse character data:', e);
        }
      }
    }

    return characters;
  } catch (error) {
    throw new Error(`Failed to get character list: ${error}`);
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

    const charData = typeof userData[characterId].Value === 'string' 
      ? JSON.parse(userData[characterId].Value) 
      : userData[characterId].Value;

    return {
      characterId,
      characterName: charData.name || charData.characterName || 'Unnamed Character',
      data: charData,
      lastModified: new Date(userData[characterId].LastUpdated || Date.now()),
    };
  } catch (error) {
    throw new Error(`Failed to get character: ${error}`);
  }
}

/**
 * Helper to extract ability scores from PathCompanion character data
 * PathCompanion uses Pathfinder 2e, which has the same core abilities as D&D
 */
export function extractAbilityScores(characterData: any) {
  // PathCompanion structure may vary, but should have standard PF2e abilities
  const abilities = characterData.abilities || characterData.abilityScores || {};
  
  return {
    strength: abilities.strength || abilities.str || 10,
    dexterity: abilities.dexterity || abilities.dex || 10,
    constitution: abilities.constitution || abilities.con || 10,
    intelligence: abilities.intelligence || abilities.int || 10,
    wisdom: abilities.wisdom || abilities.wis || 10,
    charisma: abilities.charisma || abilities.cha || 10,
  };
}

/**
 * Calculate ability modifier (same for both D&D and Pathfinder)
 */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export default {
  loginToPlayFab,
  getUserData,
  getCharacterList,
  getCharacter,
  extractAbilityScores,
  calculateModifier,
};
