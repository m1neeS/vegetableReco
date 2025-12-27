/**
 * LLM integration for recipe recommendations
 * Supports: Groq API (fast & free) or Ollama (local)
 */
const axios = require('axios');

// LLM Provider Configuration
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'groq'; // 'groq' or 'ollama'

// Groq Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Ollama Configuration (fallback)
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.LLM_MODEL || 'llama3.2:1b';

const LLM_TIMEOUT = parseInt(process.env.LLM_TIMEOUT) || 30000;

/**
 * Get recommendation from LLM
 */
async function getLLMRecommendation(vegetableName) {
  if (vegetableName === 'Unknown vegetable') {
    return getFallbackRecommendation();
  }

  try {
    if (LLM_PROVIDER === 'groq' && GROQ_API_KEY) {
      return await getGroqRecommendation(vegetableName);
    } else {
      return await getOllamaRecommendation(vegetableName);
    }
  } catch (error) {
    console.error('LLM error, using fallback:', error.message);
    return getDefaultRecommendation(vegetableName);
  }
}

/**
 * Get recommendation from Groq API (fast!)
 */
async function getGroqRecommendation(vegetableName) {
  const prompt = buildPrompt(vegetableName);

  const response = await axios.post(
    GROQ_URL,
    {
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah ahli kuliner Indonesia. Selalu jawab dalam format JSON yang valid tanpa markdown atau penjelasan tambahan.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    },
    {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: LLM_TIMEOUT
    }
  );

  const llmResponse = response.data.choices[0].message.content;
  return parseRecommendation(llmResponse, vegetableName);
}

/**
 * Get recommendation from Ollama (local)
 */
async function getOllamaRecommendation(vegetableName) {
  const prompt = buildPrompt(vegetableName);

  const response = await axios.post(
    `${OLLAMA_URL}/api/generate`,
    {
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.7, num_predict: 1000 }
    },
    { timeout: LLM_TIMEOUT }
  );

  return parseRecommendation(response.data.response, vegetableName);
}

/**
 * Build prompt for LLM
 */
function buildPrompt(vegetableName) {
  // Translate vegetable name to Indonesian
  const indonesianName = translateToIndonesian(vegetableName);
  
  return `Berikan rekomendasi untuk sayuran "${indonesianName}" dalam format JSON berikut:

{
  "recipes": ["nama resep 1", "nama resep 2", "nama resep 3"],
  "nutrition": {
    "calories": "XX kkal/100g",
    "vitamins": ["Vitamin A", "Vitamin C"],
    "benefits": ["manfaat kesehatan 1", "manfaat kesehatan 2"]
  },
  "storageTips": "tips penyimpanan sayuran ini"
}

PENTING:
- Berikan 3 resep masakan Indonesia yang populer menggunakan ${indonesianName}
- Semua teks HARUS dalam Bahasa Indonesia
- Gunakan nama sayuran dalam Bahasa Indonesia (${indonesianName}), JANGAN gunakan nama Inggris
- Hanya berikan JSON, tanpa markdown code block atau penjelasan`;
}

/**
 * Translate vegetable name to Indonesian
 */
function translateToIndonesian(englishName) {
  const translations = {
    'Bean': 'Buncis',
    'Carrot': 'Wortel',
    'Broccoli': 'Brokoli',
    'Cabbage': 'Kol',
    'Capsicum': 'Paprika',
    'Cauliflower': 'Kembang Kol',
    'Cucumber': 'Timun',
    'Tomato': 'Tomat',
    'Potato': 'Kentang',
    'Pumpkin': 'Labu Kuning',
    'Radish': 'Lobak',
    'Brinjal': 'Terong',
    'Bitter_Gourd': 'Pare',
    'Bottle_Gourd': 'Labu Air',
    'Papaya': 'Pepaya'
  };
  return translations[englishName] || englishName;
}

/**
 * Parse LLM response to structured format
 */
function parseRecommendation(response, vegetableName) {
  try {
    // Remove markdown code blocks if present
    let cleanResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.recipes && parsed.nutrition && parsed.storageTips) {
        // Check for placeholder templates
        const isPlaceholder = 
          (Array.isArray(parsed.recipes) && parsed.recipes.some(r => 
            r.toLowerCase().includes('resep 1') || 
            r.toLowerCase().includes('nama resep')
          )) ||
          (parsed.nutrition.calories && parsed.nutrition.calories.includes('XX'));
        
        if (isPlaceholder) {
          return getDefaultRecommendation(vegetableName);
        }
        
        return {
          recipes: Array.isArray(parsed.recipes) ? parsed.recipes : [parsed.recipes],
          nutrition: parsed.nutrition,
          storageTips: String(parsed.storageTips)
        };
      }
    }
  } catch (e) {
    console.error('Failed to parse LLM response:', e.message);
  }

  return getDefaultRecommendation(vegetableName);
}


/**
 * Default recommendations for all vegetables
 */
function getDefaultRecommendation(vegetableName) {
  const defaults = {
    Bean: {
      recipes: ['Tumis Buncis Bawang Putih', 'Sayur Asem Buncis', 'Oseng Buncis Tempe'],
      nutrition: { calories: '31 kkal/100g', vitamins: ['Vitamin C', 'Vitamin K', 'Vitamin A'], benefits: ['Kaya serat', 'Baik untuk pencernaan', 'Menjaga kesehatan tulang'] },
      storageTips: 'Simpan di kulkas dalam kantong plastik berlubang, tahan 5-7 hari'
    },
    Carrot: {
      recipes: ['Sup Wortel Ayam', 'Tumis Wortel Telur', 'Jus Wortel Jeruk'],
      nutrition: { calories: '41 kkal/100g', vitamins: ['Vitamin A', 'Beta Karoten', 'Vitamin K'], benefits: ['Baik untuk kesehatan mata', 'Kaya antioksidan', 'Meningkatkan imunitas'] },
      storageTips: 'Simpan di kulkas tanpa daun, tahan 2-3 minggu'
    },
    Broccoli: {
      recipes: ['Tumis Brokoli Bawang Putih', 'Sup Krim Brokoli', 'Brokoli Saus Tiram'],
      nutrition: { calories: '34 kkal/100g', vitamins: ['Vitamin C', 'Vitamin K', 'Folat'], benefits: ['Kaya antioksidan', 'Mencegah kanker', 'Baik untuk jantung'] },
      storageTips: 'Simpan di kulkas dalam kantong plastik, tahan 3-5 hari'
    },
    Cabbage: {
      recipes: ['Tumis Kol Telur', 'Sayur Sop Kol', 'Asinan Kol'],
      nutrition: { calories: '25 kkal/100g', vitamins: ['Vitamin C', 'Vitamin K', 'Vitamin B6'], benefits: ['Rendah kalori', 'Baik untuk pencernaan', 'Kaya serat'] },
      storageTips: 'Simpan di kulkas utuh, tahan 1-2 minggu'
    },
    Capsicum: {
      recipes: ['Tumis Paprika Warna-warni', 'Paprika Isi Daging', 'Salad Paprika Segar'],
      nutrition: { calories: '31 kkal/100g', vitamins: ['Vitamin C', 'Vitamin A', 'Vitamin B6'], benefits: ['Kaya antioksidan', 'Meningkatkan imunitas', 'Baik untuk kulit'] },
      storageTips: 'Simpan di kulkas dalam kantong plastik, tahan 1-2 minggu'
    },
    Cauliflower: {
      recipes: ['Tumis Kembang Kol', 'Sup Kembang Kol', 'Kembang Kol Goreng Tepung'],
      nutrition: { calories: '25 kkal/100g', vitamins: ['Vitamin C', 'Vitamin K', 'Folat'], benefits: ['Rendah kalori', 'Kaya serat', 'Baik untuk otak'] },
      storageTips: 'Simpan di kulkas dalam kantong plastik, tahan 4-7 hari'
    },
    Cucumber: {
      recipes: ['Acar Timun', 'Salad Timun Segar', 'Timun Serut Sambal'],
      nutrition: { calories: '15 kkal/100g', vitamins: ['Vitamin K', 'Vitamin C', 'Kalium'], benefits: ['Menghidrasi tubuh', 'Rendah kalori', 'Menyegarkan'] },
      storageTips: 'Simpan di kulkas, tahan 1 minggu'
    },
    Tomato: {
      recipes: ['Sambal Tomat', 'Sup Tomat', 'Tumis Tomat Telur'],
      nutrition: { calories: '18 kkal/100g', vitamins: ['Vitamin C', 'Vitamin A', 'Likopen'], benefits: ['Kaya antioksidan', 'Baik untuk jantung', 'Menjaga kesehatan kulit'] },
      storageTips: 'Simpan di suhu ruang jika belum matang, di kulkas jika sudah matang'
    },
    Potato: {
      recipes: ['Kentang Goreng', 'Perkedel Kentang', 'Sup Kentang'],
      nutrition: { calories: '77 kkal/100g', vitamins: ['Vitamin C', 'Vitamin B6', 'Kalium'], benefits: ['Sumber karbohidrat', 'Mengenyangkan', 'Kaya kalium'] },
      storageTips: 'Simpan di tempat gelap dan sejuk, hindari kulkas'
    },
    Pumpkin: {
      recipes: ['Kolak Labu', 'Sup Labu Kuning', 'Tumis Labu'],
      nutrition: { calories: '26 kkal/100g', vitamins: ['Vitamin A', 'Vitamin C', 'Beta Karoten'], benefits: ['Baik untuk mata', 'Kaya serat', 'Meningkatkan imunitas'] },
      storageTips: 'Simpan utuh di tempat sejuk, tahan berminggu-minggu'
    },
    Radish: {
      recipes: ['Acar Lobak', 'Sup Lobak', 'Tumis Lobak'],
      nutrition: { calories: '16 kkal/100g', vitamins: ['Vitamin C', 'Folat', 'Kalium'], benefits: ['Rendah kalori', 'Baik untuk pencernaan', 'Detoksifikasi'] },
      storageTips: 'Simpan di kulkas tanpa daun, tahan 1-2 minggu'
    },
    Brinjal: {
      recipes: ['Terong Balado', 'Terong Goreng', 'Tumis Terong'],
      nutrition: { calories: '25 kkal/100g', vitamins: ['Vitamin B1', 'Vitamin B6', 'Kalium'], benefits: ['Rendah kalori', 'Kaya serat', 'Baik untuk jantung'] },
      storageTips: 'Simpan di kulkas, tahan 4-5 hari'
    },
    Bitter_Gourd: {
      recipes: ['Tumis Pare', 'Pare Isi', 'Keripik Pare'],
      nutrition: { calories: '17 kkal/100g', vitamins: ['Vitamin C', 'Vitamin A', 'Folat'], benefits: ['Menurunkan gula darah', 'Kaya antioksidan', 'Baik untuk diabetes'] },
      storageTips: 'Simpan di kulkas dalam kantong plastik, tahan 4-5 hari'
    },
    Bottle_Gourd: {
      recipes: ['Sayur Labu Air', 'Tumis Labu Air', 'Sup Labu Air'],
      nutrition: { calories: '14 kkal/100g', vitamins: ['Vitamin C', 'Vitamin B', 'Kalsium'], benefits: ['Rendah kalori', 'Menghidrasi', 'Baik untuk pencernaan'] },
      storageTips: 'Simpan di kulkas, tahan 1-2 minggu'
    },
    Papaya: {
      recipes: ['Tumis Pepaya Muda', 'Sup Pepaya', 'Salad Pepaya'],
      nutrition: { calories: '43 kkal/100g', vitamins: ['Vitamin C', 'Vitamin A', 'Folat'], benefits: ['Baik untuk pencernaan', 'Kaya enzim papain', 'Meningkatkan imunitas'] },
      storageTips: 'Simpan di suhu ruang sampai matang, lalu di kulkas'
    }
  };

  return defaults[vegetableName] || getFallbackRecommendation();
}

/**
 * Fallback when LLM unavailable
 */
function getFallbackRecommendation() {
  return {
    recipes: ['Rekomendasi tidak tersedia saat ini'],
    nutrition: { info: 'Informasi nutrisi tidak tersedia' },
    storageTips: 'Simpan di tempat sejuk dan kering'
  };
}

module.exports = { 
  getLLMRecommendation, 
  getFallbackRecommendation,
  getDefaultRecommendation,
  LLM_TIMEOUT 
};
