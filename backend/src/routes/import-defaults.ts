import { Router } from 'express';
import { db } from '../db/index.js';
import { prompts, tropes } from '../db/schema.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = Router();

// Import default prompts and tropes - admin only
router.post('/import', isAuthenticated, async (req, res) => {
  try {
    // Check if already imported
    const existingPrompts = await db.select().from(prompts);
    if (existingPrompts.length > 0) {
      return res.status(400).json({ error: 'Defaults already imported' });
    }
    
    // Insert prompts
    const promptData = [
      { category: 'character', promptText: 'What does your character do when they think no one is watching?' },
      { category: 'character', promptText: 'Describe a childhood memory that shaped who your character is today.' },
      { category: 'character', promptText: 'What is your character\'s greatest fear, and how do they hide it?' },
      { category: 'character', promptText: 'What lie does your character tell themselves?' },
      { category: 'character', promptText: 'What would your character sacrifice everything for?' },
      
      { category: 'world', promptText: 'What is the most sacred tradition in your world?' },
      { category: 'world', promptText: 'Describe the scent and sounds of your world\'s marketplace.' },
      { category: 'world', promptText: 'What is forbidden in your world, and why?' },
      { category: 'world', promptText: 'How do people in your world celebrate coming of age?' },
      { category: 'world', promptText: 'What natural phenomenon is unique to your world?' },
      
      { category: 'combat', promptText: 'Your character is outmatched. What unconventional tactic do they try?' },
      { category: 'combat', promptText: 'Describe the moment before your character strikes.' },
      { category: 'combat', promptText: 'What does your character notice about their opponent that others miss?' },
      { category: 'combat', promptText: 'How does your character\'s fighting style reflect their personality?' },
      { category: 'combat', promptText: 'What goes through your character\'s mind after their first kill?' },
      
      { category: 'social', promptText: 'Your character walks into a room full of strangers. What happens?' },
      { category: 'social', promptText: 'How does your character comfort someone who is crying?' },
      { category: 'social', promptText: 'What social rule does your character break without realizing?' },
      { category: 'social', promptText: 'Describe how your character flirts (or fails to).' },
      { category: 'social', promptText: 'What does your character do when they disagree with someone they respect?' },
      
      { category: 'plot', promptText: 'A stranger offers your character exactly what they want. What\'s the catch?' },
      { category: 'plot', promptText: 'Your character discovers a secret that could destroy someone they care about.' },
      { category: 'plot', promptText: 'Everything is going according to plan. What goes wrong?' },
      { category: 'plot', promptText: 'Your character must choose between two people they love.' },
      { category: 'plot', promptText: 'The truth has been revealed. Now what?' }
    ];
    
    for (const p of promptData) {
      await db.insert(prompts).values({
        category: p.category,
        promptText: p.promptText
      });
    }
    
    // Insert tropes
    const tropeData = [
      // Archetypes
      { category: 'archetype', name: 'The Chosen One', description: 'A character destined for greatness, often marked by prophecy or unique abilities.', useCount: 0 },
      { category: 'archetype', name: 'The Reluctant Hero', description: 'Someone thrust into heroism against their will, growing into the role.', useCount: 0 },
      { category: 'archetype', name: 'The Mentor', description: 'An experienced guide who trains and advises the protagonist.', useCount: 0 },
      { category: 'archetype', name: 'The Trickster', description: 'A cunning character who uses wit and deception to achieve their goals.', useCount: 0 },
      { category: 'archetype', name: 'The Tragic Villain', description: 'An antagonist with understandable motivations and a sympathetic backstory.', useCount: 0 },
      
      // Dynamics (relationship tropes)
      { category: 'dynamic', name: 'Jock x Cheerleader', description: 'The classic popular athlete paired with the spirited cheerleader, often navigating social pressures.', useCount: 0 },
      { category: 'dynamic', name: 'Princess x Bodyguard', description: 'A royal or high-status individual falls for their sworn protector, creating forbidden romance tension.', useCount: 0 },
      { category: 'dynamic', name: 'Enemies to Lovers', description: 'Two characters who start as adversaries gradually develop romantic feelings for each other.', useCount: 0 },
      { category: 'dynamic', name: 'Childhood Friends to Lovers', description: 'Characters who grew up together discover romantic feelings as they mature.', useCount: 0 },
      { category: 'dynamic', name: 'Mentor x Protégé', description: 'A teacher-student relationship that may develop into something deeper, often with power dynamics.', useCount: 0 },
      { category: 'dynamic', name: 'Rivals to Allies', description: 'Competing characters forced to work together, building mutual respect.', useCount: 0 },
      { category: 'dynamic', name: 'Forbidden Love', description: 'Romance between characters separated by social class, faction, or other barriers.', useCount: 0 },
      { category: 'dynamic', name: 'Arranged Marriage', description: 'Characters forced into marriage who may or may not develop genuine feelings.', useCount: 0 },
      { category: 'dynamic', name: 'Fake Dating', description: 'Characters pretend to be in a relationship, leading to real feelings.', useCount: 0 },
      { category: 'dynamic', name: 'Grumpy x Sunshine', description: 'A pessimistic character paired with an optimistic one, balancing each other.', useCount: 0 },
      
      // Situations
      { category: 'situation', name: 'Trapped Together', description: 'Characters forced into close proximity (elevator, cave, safe house) leading to bonding or conflict.', useCount: 0 },
      { category: 'situation', name: 'Amnesia', description: 'A character loses their memory, creating identity crisis and relationship complications.', useCount: 0 },
      { category: 'situation', name: 'Identity Reveal', description: 'A character\'s secret identity or past is exposed, changing everything.', useCount: 0 },
      { category: 'situation', name: 'Mistaken Identity', description: 'One character is confused for someone else, leading to comedy or drama.', useCount: 0 },
      { category: 'situation', name: 'Fish Out of Water', description: 'A character in an unfamiliar environment must adapt to new rules and culture.', useCount: 0 },
      
      // Plot tropes
      { category: 'plot', name: 'The Prophecy', description: 'An ancient prediction drives the story forward, with characters trying to fulfill or prevent it.', useCount: 0 },
      { category: 'plot', name: 'Betrayal', description: 'A trusted ally reveals their true colors, shattering relationships and plans.', useCount: 0 },
      { category: 'plot', name: 'Redemption Arc', description: 'A flawed or villainous character seeks to make amends and become better.', useCount: 0 },
      { category: 'plot', name: 'The Heist', description: 'Characters plan and execute an elaborate theft or rescue operation.', useCount: 0 },
      { category: 'plot', name: 'Tournament Arc', description: 'Characters compete in a structured competition, testing their skills and growth.', useCount: 0 },
      { category: 'plot', name: 'Time Loop', description: 'A character relives the same period repeatedly until they can break the cycle.', useCount: 0 },
      { category: 'plot', name: 'The Sacrifice', description: 'A character must give up something precious for the greater good.', useCount: 0 },
      { category: 'plot', name: 'Race Against Time', description: 'Characters must accomplish their goal before a deadline or disaster strikes.', useCount: 0 }
    ];
    
    for (const t of tropeData) {
      await db.insert(tropes).values({
        category: t.category,
        name: t.name,
        description: t.description,
        useCount: t.useCount
      });
    }
    
    const promptCount = await db.select().from(prompts);
    const tropeCount = await db.select().from(tropes);
    
    res.json({
      success: true,
      imported: {
        prompts: promptCount.length,
        tropes: tropeCount.length
      }
    });
  } catch (error) {
    console.error('Error importing defaults:', error);
    res.status(500).json({ error: 'Failed to import defaults' });
  }
});

export default router;
