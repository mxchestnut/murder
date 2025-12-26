#!/usr/bin/env node

/**
 * Import default prompts and tropes
 * Run this script on the server to populate default content
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { prompts, tropes } from './src/db/schema.js';

// Get DATABASE_URL from environment (provided by AWS Secrets Manager in production)
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const db = drizzle(pool);

async function importDefaults() {
  try {
    console.log('🔍 Checking for existing content...');

    // Check if already imported
    const existingPrompts = await db.select().from(prompts);
    if (existingPrompts.length > 0) {
      console.log(`⚠️  Found ${existingPrompts.length} existing prompts - skipping import`);
      console.log('💡 To force re-import, delete existing prompts first');
      await pool.end();
      return;
    }

    console.log('📝 Importing default prompts...');

    // Import prompts from migration file
    const promptData = [
      { category: 'character', promptText: 'What does your character do when they think no one is watching?' },
      { category: 'character', promptText: 'Describe a childhood memory that still influences your character today.' },
      { category: 'character', promptText: 'What is your character\'s greatest fear, and how do they hide it?' },
      { category: 'character', promptText: 'If your character could change one decision from their past, what would it be?' },
      { category: 'character', promptText: 'What does your character value more: honor, survival, or freedom?' },

      { category: 'world', promptText: 'Describe the local tavern and its most interesting patron.' },
      { category: 'world', promptText: 'What legend or myth is whispered about this place?' },
      { category: 'world', promptText: 'Describe an unusual custom or tradition in this town.' },
      { category: 'world', promptText: 'What conflict simmers beneath the surface of this peaceful scene?' },
      { category: 'world', promptText: 'Describe the weather and how it affects the mood.' },

      { category: 'combat', promptText: 'The ambush comes from an unexpected direction. Describe it.' },
      { category: 'combat', promptText: 'Your enemy has a weakness. What is it, and how do you discover it?' },
      { category: 'combat', promptText: 'Describe the moment when the tide of battle turns.' },
      { category: 'combat', promptText: 'An ally falls. How does your character react?' },
      { category: 'combat', promptText: 'The battle is won, but at what cost?' },

      { category: 'social', promptText: 'A stranger approaches with valuable information. What do they want in return?' },
      { category: 'social', promptText: 'You overhear a conversation not meant for you. What do you learn?' },
      { category: 'social', promptText: 'An old friend appears, but something about them has changed. What is it?' },
      { category: 'social', promptText: 'You must convince someone who doesn\'t trust you. How do you approach it?' },
      { category: 'social', promptText: 'A celebration is underway. How does your character participate?' },

      { category: 'plot', promptText: 'A message arrives that changes everything. What does it say?' },
      { category: 'plot', promptText: 'You discover a secret that wasn\'t meant to be found. What is it?' },
      { category: 'plot', promptText: 'An unexpected ally offers help. What is their hidden motive?' },
      { category: 'plot', promptText: 'Time is running out. What do you prioritize?' },
      { category: 'plot', promptText: 'The consequences of a past action catch up to you. What happens?' }
    ];

    await db.insert(prompts).values(promptData);
    console.log(`✅ Imported ${promptData.length} prompts`);

    console.log('🎭 Importing default tropes...');

    // Import tropes from migration file
    const tropeData = [
      { category: 'archetype', name: 'The Reluctant Hero', description: 'Someone thrust into adventure against their will, who must find their courage.' },
      { category: 'archetype', name: 'The Mentor', description: 'A wise figure who guides others, often with mysterious past knowledge.' },
      { category: 'archetype', name: 'The Trickster', description: 'A chaotic force who breaks rules and reveals truths through deception.' },
      { category: 'archetype', name: 'The Loyal Companion', description: 'Always there for their friends, even when the odds are impossible.' },
      { category: 'archetype', name: 'The Fallen Noble', description: 'Once held power or status, now seeking redemption or revenge.' },
      { category: 'archetype', name: 'The Fish Out of Water', description: 'An outsider trying to navigate an unfamiliar world.' },
      { category: 'archetype', name: 'The Protector', description: 'Lives to keep others safe, often at great personal cost.' },
      { category: 'archetype', name: 'The Scholar', description: 'Seeks knowledge above all else, sometimes dangerously so.' },
      { category: 'archetype', name: 'The Wanderer', description: 'Never stays in one place long, always searching for something.' },
      { category: 'archetype', name: 'The Haunted Veteran', description: 'Scarred by past battles, struggling with what they\'ve done.' },

      { category: 'dynamic', name: 'Enemies to Allies', description: 'Two characters who start as opponents gradually develop mutual respect.' },
      { category: 'dynamic', name: 'Found Family', description: 'Unrelated individuals who become as close as blood relatives.' },
      { category: 'dynamic', name: 'Mentor and Student', description: 'One teaches, one learns, both change each other.' },
      { category: 'dynamic', name: 'Friendly Rivalry', description: 'Competition that pushes both parties to be better.' },
      { category: 'dynamic', name: 'The Old Flame', description: 'Past romantic history complicates present interactions.' },
      { category: 'dynamic', name: 'Opposites Attract', description: 'Very different personalities complement each other.' },
      { category: 'dynamic', name: 'The Betrayal', description: 'Trust shattered by someone close.' },
      { category: 'dynamic', name: 'Protector and Protected', description: 'One keeps the other safe, often at great personal risk.' },
      { category: 'dynamic', name: 'Partners in Crime', description: 'Two who work together seamlessly, often in dubious ventures.' },
      { category: 'dynamic', name: 'The Unspoken Bond', description: 'Connection that needs no words to be understood.' },

      { category: 'situation', name: 'Last Stand', description: 'Defending a position against overwhelming odds.' },
      { category: 'situation', name: 'The Heist', description: 'A carefully planned theft with high stakes.' },
      { category: 'situation', name: 'Trapped Together', description: 'Forced cooperation in confined circumstances.' },
      { category: 'situation', name: 'The Masquerade', description: 'Social event where everyone hides something.' },
      { category: 'situation', name: 'The Chase', description: 'Pursuit through challenging terrain.' },
      { category: 'situation', name: 'Time Loop', description: 'Reliving the same events until getting it right.' },
      { category: 'situation', name: 'The Trial', description: 'Judgment before authority, with freedom on the line.' },
      { category: 'situation', name: 'Survival Against Nature', description: 'Elements and wilderness as the primary threat.' },
      { category: 'situation', name: 'The Investigation', description: 'Piecing together clues to solve a mystery.' },
      { category: 'situation', name: 'The Rescue', description: 'Race against time to save someone important.' },

      { category: 'plot', name: 'Hidden Identity', description: 'Someone is not who they claim to be.' },
      { category: 'plot', name: 'The Prophecy', description: 'Ancient words that seem to foretell current events.' },
      { category: 'plot', name: 'The Artifact', description: 'A powerful object everyone wants.' },
      { category: 'plot', name: 'Secret Society', description: 'Hidden organizations pulling strings behind scenes.' },
      { category: 'plot', name: 'The Curse', description: 'A supernatural affliction that must be broken.' },
      { category: 'plot', name: 'Revenge Quest', description: 'Seeking justice for a past wrong.' },
      { category: 'plot', name: 'The Chosen One', description: 'Special destiny or unique ability sets someone apart.' },
      { category: 'plot', name: 'Moral Dilemma', description: 'No good choices, only lesser evils.' },
      { category: 'plot', name: 'The Twist', description: 'Everything you thought you knew was wrong.' },
      { category: 'plot', name: 'Redemption Arc', description: 'A chance to make up for past mistakes.' }
    ];

    await db.insert(tropes).values(tropeData);
    console.log(`✅ Imported ${tropeData.length} tropes`);

    console.log('🎉 Default content import complete!');

  } catch (error) {
    console.error('❌ Error importing defaults:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

importDefaults();
