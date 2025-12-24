import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Lazy load API key to allow it to be set by server.ts first
function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }
  return apiKey;
}

export async function askGemini(question: string, context?: string): Promise<string> {
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });
    
    const prompt = context 
      ? `Context: ${context}\n\nQuestion: ${question}\n\nProvide a concise, helpful answer for a D&D/Pathfinder player or GM.`
      : `Question: ${question}\n\nProvide a concise, helpful answer for a D&D/Pathfinder player or GM.`;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

export async function summarizeSession(messages: string[]): Promise<string> {
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });
    
    const messagesText = messages.join('\n');
    const prompt = `Summarize this D&D/Pathfinder session in 2-3 paragraphs. Focus on key events, character actions, and story developments:\n\n${messagesText}`;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error summarizing session:', error);
    throw error;
  }
}

export async function learnFromUrl(url: string): Promise<{ question: string; answer: string }[]> {
  const axios = require('axios');
  const cheerio = require('cheerio');
  
  try {
    console.log(`Learning from URL: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const entries: { question: string; answer: string }[] = [];

    // d20pfsrd.com specific parsing
    if (url.includes('d20pfsrd.com')) {
      // Get page title as the main topic
      const pageTitle = $('h1').first().text().trim() || $('title').text().split('–')[0].trim();
      
      // Extract main content from article body
      const mainContent = $('.article-content, .sites-canvas-main, #sites-canvas-main-content').first();
      
      if (mainContent.length > 0) {
        // Remove scripts, ads, and unwanted elements
        mainContent.find('script, style, .adsbygoogle, [id*="nitropay"], [class*="ad-"], iframe').remove();
        
        // Get the full text content, cleaning it up
        let fullText = mainContent.text()
          .replace(/\s+/g, ' ')  // Collapse whitespace
          .replace(/\n{3,}/g, '\n\n')  // Limit consecutive newlines
          .replace(/ognCreateVideoAdSpotOutstream\([^)]*\);?/g, '')  // Remove ad scripts
          .replace(/Section 15: Copyright Notice.*$/i, '')  // Remove copyright footer
          .trim();
        
        // Split into chunks if content is very long (max 2000 chars per entry)
        if (fullText.length > 2000) {
          fullText = fullText.substring(0, 2000) + '...';
        }
        
        if (fullText.length > 100) {
          entries.push({
            question: `What is ${pageTitle}?`,
            answer: fullText
          });
        }
      }
      
      // Also try to extract tables (for spell/feat stats)
      $('table').each((_: number, table: any) => {
        const tableText = $(table).text().replace(/\s+/g, ' ').trim();
        if (tableText.length > 50 && tableText.length < 1500) {
          entries.push({
            question: `${pageTitle} (stats)`,
            answer: tableText
          });
        }
      });
    } else {
      // Generic parsing for other sites
      const pageTitle = $('h1').first().text().trim() || $('title').text().trim();
      const paragraphs = $('p').map((_: number, el: any) => $(el).text().trim()).get();
      const content = paragraphs.join('\n\n').substring(0, 2000);
      
      if (content.length > 100) {
        entries.push({
          question: `What is ${pageTitle}?`,
          answer: content
        });
      }
    }

    console.log(`Extracted ${entries.length} entries from ${url}`);
    return entries;
  } catch (error) {
    console.error('Error learning from URL:', error);
    return [];
  }
}
