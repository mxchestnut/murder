import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface OverviewStats {
  characterCount: number;
  totalMessages: number;
  totalDiceRolls: number;
  nat20Count: number;
  nat1Count: number;
  totalDamageDealt: number;
}

interface LeaderboardEntry {
  characterId: number;
  characterName: string;
  avatarUrl: string | null;
  totalMessages: number;
  totalRolls: number;
  nat20Count: number;
  nat1Count: number;
  totalDamage: number;
  lastActive: string | null;
}

interface Activity {
  id: number;
  characterId: number;
  characterName: string;
  activityType: string;
  description: string;
  metadata: string | null;
  timestamp: string;
}

interface ComparisonData {
  id: number;
  name: string;
  level: number | null;
  characterClass: string | null;
  totalMessages: number | null;
  totalRolls: number | null;
  nat20Count: number | null;
  nat1Count: number | null;
  totalDamage: number | null;
  critRate: number;
  failRate: number;
}

const COLORS = ['#8b7355', '#c19a6b', '#a0826d', '#d4a574', '#b8956a'];

export default function StatsDashboard() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [comparison, setComparison] = useState<ComparisonData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState('messages');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllStats();
  }, [selectedMetric, selectedTimeframe]);

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      const [overviewRes, leaderboardRes, activityRes, comparisonRes] = await Promise.all([
        api.get('/stats/overview'),
        api.get(`/stats/leaderboard?metric=${selectedMetric}&timeframe=${selectedTimeframe}`),
        api.get('/stats/activity?limit=20'),
        api.get('/stats/compare')
      ]);

      setOverview(overviewRes.data);
      setLeaderboard(leaderboardRes.data);
      setActivities(activityRes.data);
      setComparison(comparisonRes.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5dc] p-8 flex items-center justify-center">
        <div className="text-[#3a2f2a]">Loading statistics...</div>
      </div>
    );
  }

  const pieData = overview ? [
    { name: 'Messages', value: overview.totalMessages },
    { name: 'Dice Rolls', value: overview.totalDiceRolls },
    { name: 'Nat 20s', value: overview.nat20Count },
    { name: 'Nat 1s', value: overview.nat1Count }
  ] : [];

  const comparisonChartData = comparison.map(c => ({
    name: c.name,
    Messages: c.totalMessages || 0,
    Rolls: c.totalRolls || 0,
    'Nat 20s': c.nat20Count || 0,
    Damage: Math.floor((c.totalDamage || 0) / 100) // Scale down for visibility
  }));

  return (
    <div className="min-h-screen bg-[#f5f5dc] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-serif text-[#3a2f2a] mb-8">📊 Stats Dashboard</h1>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-[#8b7355]">
            <div className="text-sm text-gray-600">Characters</div>
            <div className="text-2xl font-bold text-[#3a2f2a]">{overview?.characterCount || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-[#8b7355]">
            <div className="text-sm text-gray-600">Total Messages</div>
            <div className="text-2xl font-bold text-[#3a2f2a]">{overview?.totalMessages || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-[#8b7355]">
            <div className="text-sm text-gray-600">Dice Rolls</div>
            <div className="text-2xl font-bold text-[#3a2f2a]">{overview?.totalDiceRolls || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-[#8b7355]">
            <div className="text-sm text-gray-600">Nat 20s 🎲</div>
            <div className="text-2xl font-bold text-green-600">{overview?.nat20Count || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-[#8b7355]">
            <div className="text-sm text-gray-600">Nat 1s 💀</div>
            <div className="text-2xl font-bold text-red-600">{overview?.nat1Count || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-[#8b7355]">
            <div className="text-sm text-gray-600">Total Damage</div>
            <div className="text-2xl font-bold text-[#3a2f2a]">{overview?.totalDamageDealt || 0}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Activity Distribution Pie Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-[#8b7355]">
            <h2 className="text-xl font-serif text-[#3a2f2a] mb-4">Activity Distribution</h2>
            {pieData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No activity data yet
              </div>
            )}
          </div>

          {/* Character Comparison Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-[#8b7355]">
            <h2 className="text-xl font-serif text-[#3a2f2a] mb-4">Character Comparison</h2>
            {comparisonChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Messages" fill="#8b7355" />
                  <Bar dataKey="Rolls" fill="#c19a6b" />
                  <Bar dataKey="Nat 20s" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No characters with stats yet
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Leaderboard */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-[#8b7355]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-serif text-[#3a2f2a]">🏆 Leaderboard</h2>
              <div className="flex gap-2">
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="px-3 py-1 border border-[#8b7355] rounded text-sm"
                >
                  <option value="messages">Messages</option>
                  <option value="rolls">Dice Rolls</option>
                  <option value="nat20s">Nat 20s</option>
                  <option value="damage">Damage</option>
                </select>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="px-3 py-1 border border-[#8b7355] rounded text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="weekly">This Week</option>
                  <option value="daily">Today</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {leaderboard.length > 0 ? (
                leaderboard.map((entry, index) => (
                  <div
                    key={entry.characterId}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="text-xl font-bold text-gray-400 w-8">#{index + 1}</div>
                    {entry.avatarUrl && (
                      <img
                        src={entry.avatarUrl}
                        alt={entry.characterName}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-[#3a2f2a]">{entry.characterName}</div>
                      <div className="text-sm text-gray-600">
                        {selectedMetric === 'messages' && `${entry.totalMessages} messages`}
                        {selectedMetric === 'rolls' && `${entry.totalRolls} rolls`}
                        {selectedMetric === 'nat20s' && `${entry.nat20Count} nat 20s`}
                        {selectedMetric === 'damage' && `${entry.totalDamage} damage`}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No data for selected timeframe
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-[#8b7355]">
            <h2 className="text-xl font-serif text-[#3a2f2a] mb-4">⚡ Recent Activity</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-[#3a2f2a] text-sm">
                          {activity.characterName}
                        </div>
                        <div className="text-sm text-gray-700 mt-1">{activity.description}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-1">
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        activity.activityType === 'crit' ? 'bg-green-100 text-green-800' :
                        activity.activityType === 'fail' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {activity.activityType}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Comparison Table */}
        {comparison.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6 border border-[#8b7355]">
            <h2 className="text-xl font-serif text-[#3a2f2a] mb-4">📈 Detailed Stats</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#8b7355]">
                    <th className="text-left py-2 px-3">Character</th>
                    <th className="text-left py-2 px-3">Class</th>
                    <th className="text-right py-2 px-3">Level</th>
                    <th className="text-right py-2 px-3">Messages</th>
                    <th className="text-right py-2 px-3">Rolls</th>
                    <th className="text-right py-2 px-3">Crit Rate</th>
                    <th className="text-right py-2 px-3">Fail Rate</th>
                    <th className="text-right py-2 px-3">Damage</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((char) => (
                    <tr key={char.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-3 font-semibold">{char.name}</td>
                      <td className="py-2 px-3">{char.characterClass || '-'}</td>
                      <td className="py-2 px-3 text-right">{char.level || '-'}</td>
                      <td className="py-2 px-3 text-right">{char.totalMessages || 0}</td>
                      <td className="py-2 px-3 text-right">{char.totalRolls || 0}</td>
                      <td className="py-2 px-3 text-right text-green-600">{char.critRate}%</td>
                      <td className="py-2 px-3 text-right text-red-600">{char.failRate}%</td>
                      <td className="py-2 px-3 text-right">{char.totalDamage || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
