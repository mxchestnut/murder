import { MessageCircle, Dices, Users, Link, HelpCircle, Sparkles, Star, BookOpen, Clock, StickyNote } from 'lucide-react';

export default function DiscordCommands() {
  return (
    <div className="discord-commands-container">
      <div className="commands-header">
        <MessageCircle size={32} />
        <div>
          <h1>Discord Bot Commands</h1>
          <p>Use these commands with Murder bot in your Discord server - 32+ commands available!</p>
        </div>
      </div>

      <div className="commands-sections">
        {/* Channel Linking */}
        <section className="command-section">
          <div className="section-header">
            <Link size={24} />
            <h2>Channel Linking</h2>
          </div>
          <p className="section-description">
            Link Discord channels to characters so portal rolls automatically post there
          </p>

          <div className="command-card">
            <div className="command-syntax">
              <code>!setchar &lt;character_name&gt;</code>
            </div>
            <div className="command-description">
              Link this channel to a character. Portal rolls will post here automatically.
            </div>
            <div className="command-examples">
              <div className="example-label">Examples:</div>
              <code>!setchar Ogun</code>
              <code>!setchar Max Eisenhardt</code>
            </div>
          </div>

          <div className="command-card">
            <div className="command-syntax">
              <code>!char</code>
            </div>
            <div className="command-description">
              Show which character is currently linked to this channel
            </div>
          </div>
        </section>

        {/* Rolling Dice */}
        <section className="command-section">
          <div className="section-header">
            <Dices size={24} />
            <h2>Rolling Dice</h2>
          </div>
          <p className="section-description">
            Roll checks for your characters directly from Discord
          </p>

          <div className="command-card">
            <div className="command-syntax">
              <code>!roll &lt;stat/save/skill&gt;</code>
            </div>
            <div className="command-description">
              Roll a check for the character linked to this channel
            </div>
            <div className="command-examples">
              <div className="example-label">Ability Scores:</div>
              <code>!roll strength</code>
              <code>!roll dexterity</code>
              <code>!roll constitution</code>
              <code>!roll intelligence</code>
              <code>!roll wisdom</code>
              <code>!roll charisma</code>
            </div>
            <div className="command-examples">
              <div className="example-label">Saving Throws:</div>
              <code>!roll fortitude</code>
              <code>!roll reflex</code>
              <code>!roll will</code>
            </div>
            <div className="command-examples">
              <div className="example-label">Skills:</div>
              <code>!roll perception</code>
              <code>!roll stealth</code>
              <code>!roll diplomacy</code>
            </div>
          </div>

          <div className="command-card highlight">
            <div className="command-syntax">
              <code>!&lt;CharacterName&gt; &lt;stat/save/skill&gt;</code>
            </div>
            <div className="command-description">
              Roll with any character by name, from any channel (no linking needed!)
            </div>
            <div className="command-examples">
              <div className="example-label">Examples:</div>
              <code>!Ogun strength</code>
              <code>!Elystrix perception</code>
              <code>!Max fortitude</code>
            </div>
          </div>
        </section>

        {/* Character Proxying */}
        <section className="command-section">
          <div className="section-header">
            <Users size={24} />
            <h2>Character Proxying</h2>
          </div>
          <p className="section-description">
            Speak as your character with their name and avatar (like Tupperbox)
          </p>

          <div className="command-card highlight">
            <div className="command-syntax">
              <code>&lt;CharacterName&gt;: &lt;message&gt;</code>
            </div>
            <div className="command-description">
              Post a message as your character. Your message will be deleted and reposted with the character's name and avatar.
            </div>
            <div className="command-examples">
              <div className="example-label">Examples:</div>
              <code>Ogun: Time to crush some skulls!</code>
              <code>Elystrix: I sense danger ahead...</code>
              <code>Max: The future of mutantkind is at stake.</code>
            </div>
            <div className="command-note">
              💡 Tip: Add an avatar URL to your character in the portal for custom avatars!
            </div>
          </div>
        </section>

        {/* RP Prompts & Tropes */}
        <section className="command-section">
          <div className="section-header">
            <Sparkles size={24} />
            <h2>RP Prompts & Inspiration</h2>
          </div>
          <p className="section-description">
            Get creative prompts and trope inspiration for your roleplay
          </p>

          <div className="command-card">
            <div className="command-syntax">
              <code>!prompt [category]</code>
            </div>
            <div className="command-description">
              Get a random RP prompt. Categories: character, world, combat, social, plot
            </div>
            <div className="command-examples">
              <div className="example-label">Examples:</div>
              <code>!prompt</code>
              <code>!prompt character</code>
              <code>!prompt combat</code>
            </div>
          </div>

          <div className="command-card">
            <div className="command-syntax">
              <code>!trope [category]</code>
            </div>
            <div className="command-description">
              Get random trope inspiration. Categories: character, plot, relationship, world
            </div>
            <div className="command-examples">
              <div className="example-label">Examples:</div>
              <code>!trope</code>
              <code>!trope character</code>
            </div>
          </div>
        </section>

        {/* Session & Scene Tracking */}
        <section className="command-section">
          <div className="section-header">
            <BookOpen size={24} />
            <h2>Session & Scene Tracking</h2>
          </div>
          <p className="section-description">
            Track sessions and scenes with automatic message logging
          </p>

          <div className="command-card">
            <div className="command-syntax">
              <code>!session start &lt;title&gt;</code>
            </div>
            <div className="command-description">
              Start tracking a session. All messages will be logged until you end it.
            </div>
            <div className="command-examples">
              <div className="example-label">More Session Commands:</div>
              <code>!session end</code>
              <code>!session pause</code>
              <code>!session resume</code>
              <code>!session list</code>
            </div>
          </div>

          <div className="command-card">
            <div className="command-syntax">
              <code>!scene start &lt;title&gt;</code>
            </div>
            <div className="command-description">
              Start a new scene with automatic message logging
            </div>
            <div className="command-examples">
              <div className="example-label">More Scene Commands:</div>
              <code>!scene end</code>
              <code>!scene tag &lt;tags&gt;</code>
              <code>!scene location &lt;place&gt;</code>
              <code>!scene list</code>
            </div>
          </div>

          <div className="command-card">
            <div className="command-syntax">
              <code>!recap</code>
            </div>
            <div className="command-description">
              Get a quick summary of the current session
            </div>
          </div>
        </section>

        {/* Hall of Fame */}
        <section className="command-section">
          <div className="section-header">
            <Star size={24} />
            <h2>Hall of Fame (Starboard)</h2>
          </div>
          <p className="section-description">
            React with ⭐ to epic messages! Messages with 10+ stars get immortalized
          </p>

          <div className="command-card highlight">
            <div className="command-syntax">
              <code>React with ⭐</code>
            </div>
            <div className="command-description">
              React to any message with a star emoji. When a message gets 10+ stars, it's automatically posted to #hall-of-fame!
            </div>
            <div className="command-note">
              💡 Hall of Fame messages include context (previous message) and are removed if stars drop below 10
            </div>
          </div>

          <div className="command-card">
            <div className="command-syntax">
              <code>!hall</code>
            </div>
            <div className="command-description">
              View recent Hall of Fame entries
            </div>
          </div>

          <div className="command-card">
            <div className="command-syntax">
              <code>!hall top</code>
            </div>
            <div className="command-description">
              View top 20 most-starred messages of all time
            </div>
          </div>
        </section>

        {/* Relationship Tracking */}
        <section className="command-section">
          <div className="section-header">
            <Users size={24} />
            <h2>Relationship Tracking</h2>
          </div>
          <p className="section-description">
            Track character relationships that display in profiles
          </p>

          <div className="command-card">
            <div className="command-syntax">
              <code>!&lt;Char1&gt; is &lt;Char2&gt;'s &lt;descriptor&gt; | &lt;notes&gt;</code>
            </div>
            <div className="command-description">
              Create or update a character relationship
            </div>
            <div className="command-examples">
              <div className="example-label">Examples:</div>
              <code>!Aria is Kael's best friend | They met during the war</code>
              <code>!Marcus is Elena's mentor | Teaching her ancient magic</code>
            </div>
            <div className="command-note">
              💡 View relationships in !profile &lt;character&gt; → Relationships tab
            </div>
          </div>
        </section>

        {/* Utility Commands */}
        <section className="command-section">
          <div className="section-header">
            <Clock size={24} />
            <h2>Utility Commands</h2>
          </div>

          <div className="command-card">
            <div className="command-syntax">
              <code>!time [set &lt;date&gt;]</code>
            </div>
            <div className="command-description">
              View or set in-game time/date
            </div>
          </div>

          <div className="command-card">
            <div className="command-syntax">
              <code>!note add &lt;text&gt;</code>
            </div>
            <div className="command-description">
              Add a GM note. Use !note list to view your notes
            </div>
          </div>

          <div className="command-card">
            <div className="command-syntax">
              <code>!npc &lt;name&gt;</code>
            </div>
            <div className="command-description">
              Generate quick NPC stat block (AI-powered)
            </div>
          </div>

          <div className="command-card">
            <div className="command-syntax">
              <code>!music</code>
            </div>
            <div className="command-description">
              Get mood music suggestions for the current scene
            </div>
          </div>
        </section>

        {/* Admin Commands */}
        <section className="command-section">
          <div className="section-header">
            <StickyNote size={24} />
            <h2>Admin Commands</h2>
          </div>
          <p className="section-description">
            Requires Discord Administrator permission
          </p>

          <div className="command-card">
            <div className="command-syntax">
              <code>!learn &lt;question&gt; | &lt;answer&gt;</code>
            </div>
            <div className="command-description">
              Add knowledge base entry for !ask command
            </div>
          </div>

          <div className="command-card">
            <div className="command-syntax">
              <code>!botset</code>
            </div>
            <div className="command-description">
              Set the bot announcement channel for scheduled prompts and events
            </div>
          </div>
        </section>

        {/* Help */}
        <section className="command-section">
          <div className="section-header">
            <HelpCircle size={24} />
            <h2>Getting Help</h2>
          </div>

          <div className="command-card">
            <div className="command-syntax">
              <code>!help</code>
            </div>
            <div className="command-description">
              Display a complete command reference in Discord
            </div>
          </div>
        </section>
      </div>

      <div className="setup-section">
        <h2>Setup Instructions</h2>
        <ol>
          <li>Make sure Murder bot is in your Discord server</li>
          <li>Create a <code>#hall-of-fame</code> channel for starred messages</li>
          <li>Create or import your characters in the Character Sheets tab</li>
          <li>Optionally add avatar URLs to your characters for custom proxying</li>
          <li>Use <code>!setchar &lt;name&gt;</code> in any channel to link it for auto-rolls</li>
          <li>Use <code>!botset</code> (admin) to set announcement channel for daily prompts</li>
          <li>Start rolling, tracking sessions, and roleplaying!</li>
        </ol>

        <div className="feature-highlight">
          <h3>🌟 New Features!</h3>
          <ul>
            <li><strong>Daily Prompts:</strong> Get creative inspiration with !prompt and !trope</li>
            <li><strong>Hall of Fame:</strong> Star epic moments (⭐ × 10) to immortalize them</li>
            <li><strong>Session Tracking:</strong> Automatic message logging for sessions and scenes</li>
            <li><strong>Relationships:</strong> Track character connections in profiles</li>
            <li><strong>AI Tools:</strong> NPC generator, music suggestions, and more!</li>
          </ul>
        </div>
      </div>

      <style>{`
        .discord-commands-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .commands-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid var(--border-color);
        }

        .commands-header svg {
          color: var(--primary-color);
        }

        .commands-header h1 {
          margin: 0;
          font-size: 2rem;
        }

        .commands-header p {
          margin: 0.25rem 0 0 0;
          color: var(--text-secondary);
        }

        .commands-sections {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .command-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1.5rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .section-header svg {
          color: var(--accent-color);
        }

        .section-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .section-description {
          color: var(--text-secondary);
          margin: 0 0 1.5rem 0;
        }

        .command-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1.25rem;
          margin-bottom: 1rem;
        }

        .command-card.highlight {
          border-color: var(--accent-color);
          background: var(--accent-light);
        }

        .command-syntax {
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: var(--accent-color);
        }

        .command-syntax code {
          background: var(--accent-light);
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          border-left: 3px solid var(--accent-color);
          color: var(--text-primary);
        }

        .command-description {
          color: var(--text-primary);
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .command-examples {
          margin-top: 1rem;
        }

        .example-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .command-examples code {
          display: block;
          background: var(--bg-tertiary);
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          color: var(--accent-color);
        }

        .command-note {
          margin-top: 1rem;
          padding: 0.75rem;
          background: var(--accent-light);
          border-left: 3px solid var(--accent-color);
          border-radius: 4px;
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .setup-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1.5rem;
          margin-top: 2rem;
        }

        .setup-section h2 {
          margin-top: 0;
          margin-bottom: 1rem;
        }

        .setup-section ol {
          margin: 0;
          padding-left: 1.5rem;
        }

        .setup-section li {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }

        .setup-section code {
          background: var(--accent-light);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .feature-highlight {
          margin-top: 2rem;
          padding: 1.5rem;
          background: var(--accent-light);
          border-left: 4px solid var(--accent-color);
          border-radius: 4px;
        }

        .feature-highlight h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          color: var(--accent-color);
        }

        .feature-highlight ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .feature-highlight li {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }

        .feature-highlight strong {
          color: var(--accent-color);
        }
      `}</style>
    </div>
  );
}
