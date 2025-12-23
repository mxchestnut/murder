import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Performs a simple Google search and extracts the first snippet
 * Note: This is a basic implementation. For production, consider using Google Custom Search API
 */
export async function searchGoogle(query: string): Promise<{ title: string; snippet: string; url: string } | null> {
  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 5000
    });

    const $ = cheerio.load(response.data);
    
    // Try to find the first search result
    const firstResult = $('.g').first();
    
    if (firstResult.length > 0) {
      const title = firstResult.find('h3').text();
      const snippet = firstResult.find('.VwiC3b').text() || firstResult.find('.IsZvec').text() || '';
      const url = firstResult.find('a').attr('href') || '';
      
      if (title && snippet) {
        return { title, snippet, url };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Google search error:', error);
    return null;
  }
}
