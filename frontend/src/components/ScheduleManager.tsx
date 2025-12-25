import { useState, useEffect } from 'react';
import { api } from '../utils/api';

interface Schedule {
  id: number;
  channelId: string;
  guildId: string;
  scheduleTime: string;
  enabled: boolean;
  category: string | null;
  lastSent: string | null;
  createdAt: string;
}

interface ScheduleManagerProps {
  type: 'prompts' | 'tropes';
}

export default function ScheduleManager({ type }: ScheduleManagerProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    channelId: '',
    guildId: '',
    scheduleTime: '09:00',
    category: '',
    enabled: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, [type]);

  const fetchSchedules = async () => {
    try {
      const endpoint = type === 'prompts' ? '/prompts/schedule' : '/tropes/schedule';
      const response = await api.get(endpoint);
      setSchedules(response.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = type === 'prompts' ? '/prompts/schedule' : '/tropes/schedule';
      await api.post(endpoint, formData);
      setFormData({
        channelId: '',
        guildId: '',
        scheduleTime: '09:00',
        category: '',
        enabled: true
      });
      setShowAddForm(false);
      fetchSchedules();
    } catch (error) {
      console.error('Error creating schedule:', error);
    }
  };

  const handleToggleEnabled = async (channelId: string, currentEnabled: boolean) => {
    try {
      const schedule = schedules.find(s => s.channelId === channelId);
      if (!schedule) return;

      const endpoint = type === 'prompts' ? '/prompts/schedule' : '/tropes/schedule';
      await api.post(endpoint, {
        channelId: schedule.channelId,
        guildId: schedule.guildId,
        scheduleTime: schedule.scheduleTime,
        category: schedule.category,
        enabled: !currentEnabled
      });
      fetchSchedules();
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  const handleDelete = async (channelId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const endpoint = type === 'prompts' ? `/prompts/schedule/${channelId}` : `/tropes/schedule/${channelId}`;
      await api.delete(endpoint);
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const categories = type === 'prompts'
    ? ['character', 'world', 'combat', 'social', 'plot']
    : ['archetype', 'dynamic', 'situation', 'plot'];

  if (loading) {
    return <div className="text-center py-4">Loading schedules...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[#3a2f2a]">
          Auto-Posting Schedule
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-[#8b7355] text-white rounded hover:bg-[#7a6349] transition"
        >
          {showAddForm ? 'Cancel' : '+ Add Schedule'}
        </button>
      </div>

      <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded p-3">
        <strong>Note:</strong> Schedules automatically post random {type} to the specified Discord channel at the scheduled time each day.
        Make sure your Discord bot is in the server and has permission to post in the channel.
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discord Channel ID *
            </label>
            <input
              type="text"
              value={formData.channelId}
              onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
              placeholder="123456789012345678"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#8b7355]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Right-click a channel in Discord → Copy Channel ID
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discord Server (Guild) ID *
            </label>
            <input
              type="text"
              value={formData.guildId}
              onChange={(e) => setFormData({ ...formData, guildId: e.target.value })}
              placeholder="123456789012345678"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#8b7355]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Right-click your server icon → Copy Server ID
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schedule Time (24-hour format) *
            </label>
            <input
              type="time"
              value={formData.scheduleTime}
              onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#8b7355]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Daily posting time (your server's timezone)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category (optional)
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#8b7355]"
            >
              <option value="">All Categories (Random)</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="enabled" className="text-sm text-gray-700">
              Enabled (start posting immediately)
            </label>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-[#8b7355] text-white rounded hover:bg-[#7a6349] transition"
          >
            Create Schedule
          </button>
        </form>
      )}

      {/* Schedules List */}
      <div className="space-y-2">
        {schedules.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
            No schedules configured yet. Click "Add Schedule" to create one.
          </div>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-white rounded-lg p-4 border border-gray-200 hover:border-[#8b7355] transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      schedule.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {schedule.enabled ? 'Active' : 'Paused'}
                    </span>
                    {schedule.category && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {schedule.category}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Channel ID:</span>
                      <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {schedule.channelId}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Time:</span>
                      <span className="font-medium">{schedule.scheduleTime} daily</span>
                    </div>
                    {schedule.lastSent && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Last sent:</span>
                        <span>{new Date(schedule.lastSent).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleEnabled(schedule.channelId, schedule.enabled)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition"
                  >
                    {schedule.enabled ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.channelId)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
