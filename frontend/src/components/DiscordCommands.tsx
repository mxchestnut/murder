import { MessageCircle, Dices, Users, Link, HelpCircle } from 'lucide-react';

export default function DiscordCommands() {
  return (
    <div className="discord-commands-container">
      <div className="commands-header">
        <MessageCircle size={32} />
        <div>
          <h1>Discord Bot Commands</h1>
          <p>Use these commands with PathKeeper bot in your Discord server</p>
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

          <div className="command-card">
            <div className="command-syntax">
              <code>!&lt;CharacterName&gt;: &lt;message&gt;</code>
            </div>
            <div className="command-description">
              Alternative syntax with ! prefix
            </div>
            <div className="command-examples">
              <div className="example-label">Example:</div>
              <code>!Ogun: Let's fight!</code>
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
              Display a quick command reference in Discord
            </div>
          </div>
        </section>
      </div>

      <div className="setup-section">
        <h2>Setup Instructions</h2>
        <ol>
          <li>Make sure PathKeeper bot is in your Discord server</li>
          <li>Create or import your characters in the Character Sheets tab</li>
          <li>Optionally add avatar URLs to your characters for custom proxying</li>
          <li>Use <code>!setchar &lt;name&gt;</code> in any channel to link it</li>
          <li>Start rolling and roleplaying!</li>
        </ol>
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
          background: var(--surface-color);
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
          background: var(--background-color);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1.25rem;
          margin-bottom: 1rem;
        }

        .command-card.highlight {
          border-color: var(--primary-color);
          background: linear-gradient(135deg, var(--background-color) 0%, rgba(88, 101, 242, 0.05) 100%);
        }

        .command-syntax {
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: var(--primary-color);
        }

        .command-syntax code {
          background: rgba(88, 101, 242, 0.1);
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          border-left: 3px solid var(--primary-color);
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
          background: rgba(0, 0, 0, 0.3);
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          color: #7dd3fc;
        }

        .command-note {
          margin-top: 1rem;
          padding: 0.75rem;
          background: rgba(250, 204, 21, 0.1);
          border-left: 3px solid #facc15;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .setup-section {
          background: var(--surface-color);
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
          background: rgba(88, 101, 242, 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
