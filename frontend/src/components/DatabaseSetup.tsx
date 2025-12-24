import { useState } from 'react';
import { api } from '../utils/api';

interface ImportResult {
  success: boolean;
  imported?: {
    prompts: number;
    tropes: number;
  };
  error?: string;
}

export default function DatabaseSetup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleImport = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await api.post('/api/import-defaults/import');
      setResult(response.data);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.response?.data?.error || 'Failed to import defaults'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5dc] p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 border border-[#8b7355]">
          <h1 className="text-3xl font-serif text-[#3a2f2a] mb-4">
            Database Setup
          </h1>
          
          <p className="text-gray-700 mb-6">
            Click the button below to import the default prompts and tropes into the database.
            This includes:
          </p>
          
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>25 RP prompts across 5 categories (character, world, combat, social, plot)</li>
            <li>33 tropes across 4 categories (archetype, dynamic, situation, plot)</li>
            <li>Relationship dynamics: Jock x Cheerleader, Princess x Bodyguard, Enemies to Lovers, etc.</li>
          </ul>
          
          <button
            onClick={handleImport}
            disabled={loading}
            className="w-full bg-[#8b7355] hover:bg-[#7a6349] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Importing...' : 'Import Default Content'}
          </button>
          
          {result && (
            <div className={`mt-6 p-4 rounded-lg ${
              result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {result.success ? (
                <>
                  <div className="text-green-800 font-semibold mb-2">✅ Import Successful!</div>
                  <div className="text-green-700">
                    Imported {result.imported?.prompts} prompts and {result.imported?.tropes} tropes
                  </div>
                </>
              ) : (
                <div className="text-red-800">
                  ❌ Error: {result.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
