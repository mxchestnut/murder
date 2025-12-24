import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import ScheduleManager from './ScheduleManager';
import '../index.css';

interface Prompt {
  id: number;
  category: string;
  promptText: string;
  createdBy: number | null;
  useCount: number;
  lastUsed: string | null;
  createdAt: string;
}

interface Trope {
  id: number;
  category: string;
  name: string;
  description: string;
  useCount: number;
  createdAt: string;
}

interface CategoryStats {
  category: string;
  count: number;
  totalUses: number;
}

type ViewMode = 'prompts' | 'tropes' | 'schedules';

const promptCategories = ['character', 'world', 'combat', 'social', 'plot'];
const tropeCategories = ['archetype', 'dynamic', 'situation', 'plot'];

export default function PromptsTropes() {
  const [viewMode, setViewMode] = useState<ViewMode>('prompts');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [tropes, setTropes] = useState<Trope[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [popularItems, setPopularItems] = useState<(Prompt | Trope)[]>([]);
  
  // Edit/Add modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingItem, setEditingItem] = useState<Prompt | Trope | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    promptText: '',
    name: '',
    description: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [viewMode, selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (viewMode === 'prompts') {
        const [promptsRes, statsRes, popularRes] = await Promise.all([
          api.get(`/prompts?category=${selectedCategory}`),
          api.get('/prompts/categories'),
          api.get('/prompts/popular?limit=5')
        ]);
        setPrompts(promptsRes.data);
        setCategoryStats(statsRes.data);
        setPopularItems(popularRes.data);
      } else {
        const [tropesRes, statsRes, popularRes] = await Promise.all([
          api.get(`/tropes?category=${selectedCategory}`),
          api.get('/tropes/categories'),
          api.get('/tropes/popular?limit=5')
        ]);
        setTropes(tropesRes.data);
        setCategoryStats(statsRes.data);
        setPopularItems(popularRes.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setModalMode('add');
    setEditingItem(null);
    setFormData({
      category: viewMode === 'prompts' ? promptCategories[0] : tropeCategories[0],
      promptText: '',
      name: '',
      description: ''
    });
    setShowModal(true);
  };

  const handleEdit = (item: Prompt | Trope) => {
    setModalMode('edit');
    setEditingItem(item);
    if (viewMode === 'prompts') {
      const prompt = item as Prompt;
      setFormData({
        category: prompt.category,
        promptText: prompt.promptText,
        name: '',
        description: ''
      });
    } else {
      const trope = item as Trope;
      setFormData({
        category: trope.category,
        promptText: '',
        name: trope.name,
        description: trope.description
      });
    }
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Are you sure you want to delete this ${viewMode === 'prompts' ? 'prompt' : 'trope'}?`)) {
      return;
    }

    try {
      const endpoint = viewMode === 'prompts' ? `/prompts/${id}` : `/tropes/${id}`;
      await api.delete(endpoint);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (viewMode === 'prompts') {
        const data = {
          category: formData.category,
          promptText: formData.promptText
        };

        if (modalMode === 'add') {
          await api.post('/prompts', data);
        } else if (editingItem) {
          await api.put(`/prompts/${editingItem.id}`, data);
        }
      } else {
        const data = {
          category: formData.category,
          name: formData.name,
          description: formData.description
        };

        if (modalMode === 'add') {
          await api.post('/tropes', data);
        } else if (editingItem) {
          await api.put(`/tropes/${editingItem.id}`, data);
        }
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save');
    }
  };

  const categories = viewMode === 'prompts' ? promptCategories : tropeCategories;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {viewMode === 'prompts' ? '💭 RP Prompts' : '🎭 Tropes'}
          </h1>
          <p className="text-gray-400">
            {viewMode === 'prompts' 
              ? 'Manage roleplay prompts for creative inspiration' 
              : 'Browse and manage storytelling tropes'}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          + Add {viewMode === 'prompts' ? 'Prompt' : 'Trope'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            setViewMode('prompts');
            setSelectedCategory('all');
          }}
          className={`px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'prompts'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          💭 Prompts
        </button>
        <button
          onClick={() => {
            setViewMode('tropes');
            setSelectedCategory('all');
          }}
          className={`px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'tropes'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          🎭 Tropes
        </button>
        <button
          onClick={() => setViewMode('schedules')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'schedules'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          ⏰ Schedules
        </button>
      </div>

      {/* Schedules View */}
      {viewMode === 'schedules' ? (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-purple-600 mb-4">Prompt Schedules</h2>
            <ScheduleManager type="prompts" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-purple-600 mb-4">Trope Schedules</h2>
            <ScheduleManager type="tropes" />
          </div>
        </div>
      ) : (
        <>
      {/* Category Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`p-4 rounded-lg border transition-colors ${
            selectedCategory === 'all'
              ? 'border-purple-500 bg-purple-500/20'
              : 'border-gray-600 bg-gray-800 hover:border-gray-500'
          }`}
        >
          <div className="text-sm text-gray-400">All {viewMode === 'prompts' ? 'Prompts' : 'Tropes'}</div>
          <div className="text-2xl font-bold text-white">
            {categoryStats.reduce((sum, cat) => sum + cat.count, 0)}
          </div>
          <div className="text-xs text-gray-500">
            {categoryStats.reduce((sum, cat) => sum + (cat.totalUses || 0), 0)} uses
          </div>
        </button>

        {categories.map(cat => {
          const stats = categoryStats.find(s => s.category === cat);
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`p-4 rounded-lg border transition-colors ${
                selectedCategory === cat
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-600 bg-gray-800 hover:border-gray-500'
              }`}
            >
              <div className="text-sm text-gray-400 capitalize">{cat}</div>
              <div className="text-2xl font-bold text-white">
                {stats?.count || 0}
              </div>
              <div className="text-xs text-gray-500">
                {stats?.totalUses || 0} uses
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-white mb-4">
            {selectedCategory === 'all' ? 'All' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} {viewMode === 'prompts' ? 'Prompts' : 'Tropes'}
          </h2>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : (
            <div className="space-y-4">
              {viewMode === 'prompts' ? (
                prompts.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    No prompts found. Add some to get started!
                  </div>
                ) : (
                  prompts.map(prompt => (
                    <div key={prompt.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded capitalize">
                          {prompt.category}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(prompt)}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(prompt.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-white mb-2">{prompt.promptText}</p>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>Used {prompt.useCount} times</span>
                        {prompt.lastUsed && (
                          <span>Last used: {new Date(prompt.lastUsed).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))
                )
              ) : (
                tropes.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    No tropes found. Add some to get started!
                  </div>
                ) : (
                  tropes.map(trope => (
                    <div key={trope.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded capitalize">
                          {trope.category}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(trope)}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(trope.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <h3 className="text-white font-semibold mb-1">{trope.name}</h3>
                      <p className="text-gray-300 text-sm mb-2">{trope.description}</p>
                      <div className="text-xs text-gray-500">
                        Used {trope.useCount} times
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          )}
        </div>

        {/* Popular Sidebar */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            ⭐ Most Popular
          </h2>
          <div className="space-y-3">
            {popularItems.map((item, idx) => (
              <div key={item.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-purple-400">#{idx + 1}</span>
                  <span className="px-2 py-0.5 bg-purple-600/20 text-purple-300 text-xs rounded capitalize">
                    {item.category}
                  </span>
                </div>
                {viewMode === 'prompts' ? (
                  <p className="text-sm text-white line-clamp-2">{(item as Prompt).promptText}</p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-white">{(item as Trope).name}</p>
                    <p className="text-xs text-gray-400 line-clamp-1">{(item as Trope).description}</p>
                  </>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {item.useCount} uses
                </div>
              </div>
            ))}
          </div>

          {/* Discord Command Help */}
          <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-2">Discord Commands</h3>
            <div className="space-y-2 text-xs text-gray-300">
              {viewMode === 'prompts' ? (
                <>
                  <div><code className="bg-gray-900 px-1 py-0.5 rounded">!prompt</code> - Random prompt</div>
                  <div><code className="bg-gray-900 px-1 py-0.5 rounded">!prompt random {selectedCategory !== 'all' ? selectedCategory : 'category'}</code></div>
                </>
              ) : (
                <>
                  <div><code className="bg-gray-900 px-1 py-0.5 rounded">!trope</code> - Random trope</div>
                  <div><code className="bg-gray-900 px-1 py-0.5 rounded">!trope {selectedCategory !== 'all' ? selectedCategory : 'category'}</code></div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              {modalMode === 'add' ? 'Add' : 'Edit'} {viewMode === 'prompts' ? 'Prompt' : 'Trope'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="capitalize">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {viewMode === 'prompts' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Prompt Text
                  </label>
                  <textarea
                    value={formData.promptText}
                    onChange={(e) => setFormData({ ...formData, promptText: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    rows={4}
                    required
                    placeholder="Enter the prompt text..."
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      required
                      placeholder="e.g., 'The Chosen One'"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      rows={4}
                      required
                      placeholder="Describe this trope..."
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  {modalMode === 'add' ? 'Add' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
