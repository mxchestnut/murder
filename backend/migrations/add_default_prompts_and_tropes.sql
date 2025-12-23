-- Default RP Prompts
-- Character Development
INSERT INTO prompts (category, prompt_text) VALUES
('character', 'What does your character do when they think no one is watching?'),
('character', 'Describe a childhood memory that still influences your character today.'),
('character', 'What is your character''s greatest fear, and how do they hide it?'),
('character', 'If your character could change one decision from their past, what would it be?'),
('character', 'What does your character value more: honor, survival, or freedom?'),

-- World Building
('world', 'Describe the local tavern and its most interesting patron.'),
('world', 'What legend or myth is whispered about this place?'),
('world', 'Describe an unusual custom or tradition in this town.'),
('world', 'What conflict simmers beneath the surface of this peaceful scene?'),
('world', 'Describe the weather and how it affects the mood.'),

-- Combat
('combat', 'The ambush comes from an unexpected direction. Describe it.'),
('combat', 'Your enemy has a weakness. What is it, and how do you discover it?'),
('combat', 'Describe the moment when the tide of battle turns.'),
('combat', 'An ally falls. How does your character react?'),
('combat', 'The battle is won, but at what cost?'),

-- Social
('social', 'A stranger approaches with valuable information. What do they want in return?'),
('social', 'You overhear a conversation not meant for you. What do you learn?'),
('social', 'An old friend appears, but something about them has changed. What is it?'),
('social', 'You must convince someone who doesn''t trust you. How do you approach it?'),
('social', 'A celebration is underway. How does your character participate?'),

-- Plot
('plot', 'A message arrives that changes everything. What does it say?'),
('plot', 'You discover a secret that wasn''t meant to be found. What is it?'),
('plot', 'An unexpected ally offers help. What is their hidden motive?'),
('plot', 'Time is running out. What do you prioritize?'),
('plot', 'The consequences of a past action catch up to you. What happens?');

-- Default Tropes

-- Archetypes
INSERT INTO tropes (category, name, description) VALUES
('archetype', 'The Reluctant Hero', 'Someone thrust into adventure against their will, who must find their courage.'),
('archetype', 'The Mentor', 'A wise figure who guides others, often with mysterious past knowledge.'),
('archetype', 'The Trickster', 'A chaotic force who breaks rules and reveals truths through deception.'),
('archetype', 'The Loyal Companion', 'Always there for their friends, even when the odds are impossible.'),
('archetype', 'The Fallen Noble', 'Once held power or status, now seeking redemption or revenge.'),
('archetype', 'The Fish Out of Water', 'An outsider trying to navigate an unfamiliar world.'),
('archetype', 'The Protector', 'Lives to keep others safe, often at great personal cost.'),
('archetype', 'The Scholar', 'Seeks knowledge above all else, sometimes dangerously so.'),
('archetype', 'The Wanderer', 'Never stays in one place long, always searching for something.'),
('archetype', 'The Haunted Veteran', 'Scarred by past battles, struggling with what they''ve done.'),

-- Dynamics
('dynamic', 'Enemies to Allies', 'Two characters who start as opponents gradually develop mutual respect.'),
('dynamic', 'Found Family', 'Unrelated individuals who become as close as blood relatives.'),
('dynamic', 'Mentor and Student', 'One teaches, one learns, both change each other.'),
('dynamic', 'Friendly Rivalry', 'Competition that pushes both parties to be better.'),
('dynamic', 'The Old Flame', 'Past romantic history complicates present interactions.'),
('dynamic', 'Opposites Attract', 'Very different personalities complement each other.'),
('dynamic', 'The Betrayal', 'Trust shattered by someone close.'),
('dynamic', 'Protector and Protected', 'One keeps the other safe, often at great personal risk.'),
('dynamic', 'Partners in Crime', 'Two who work together seamlessly, often in dubious ventures.'),
('dynamic', 'The Unspoken Bond', 'Connection that needs no words to be understood.'),

-- Situations
('situation', 'Last Stand', 'Defending a position against overwhelming odds.'),
('situation', 'The Heist', 'A carefully planned theft with high stakes.'),
('situation', 'Trapped Together', 'Forced cooperation in confined circumstances.'),
('situation', 'The Masquerade', 'Social event where everyone hides something.'),
('situation', 'The Chase', 'Pursuit through challenging terrain.'),
('situation', 'Time Loop', 'Reliving the same events until getting it right.'),
('situation', 'The Trial', 'Judgment before authority, with freedom on the line.'),
('situation', 'Survival Against Nature', 'Elements and wilderness as the primary threat.'),
('situation', 'The Investigation', 'Piecing together clues to solve a mystery.'),
('situation', 'The Rescue', 'Race against time to save someone important.'),

-- Plot
('plot', 'Hidden Identity', 'Someone is not who they claim to be.'),
('plot', 'The Prophecy', 'Ancient words that seem to foretell current events.'),
('plot', 'The Artifact', 'A powerful object everyone wants.'),
('plot', 'Secret Society', 'Hidden organizations pulling strings behind scenes.'),
('plot', 'The Curse', 'A supernatural affliction that must be broken.'),
('plot', 'Revenge Quest', 'Seeking justice for a past wrong.'),
('plot', 'The Chosen One', 'Special destiny or unique ability sets someone apart.'),
('plot', 'Moral Dilemma', 'No good choices, only lesser evils.'),
('plot', 'The Twist', 'Everything you thought you knew was wrong.'),
('plot', 'Redemption Arc', 'A chance to make up for past mistakes.');
