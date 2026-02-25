// Constants
const SHORTCUT_KEYS = ['A', 'S', 'D', 'F', 'Z', 'X', 'C', 'V', 'Q', 'W', 'E', 'R'];
const FALLBACK_ICON = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><text y=%2214%22 font-size=%2214%22>🌐</text></svg>';
const DEFAULT_SETTINGS = {
    closeModifier: { display: 'Shift', code: 'ShiftLeft', key: 'Shift', modifiers: { shift: true } },
    targetModifier: { display: 'Alt', code: 'AltLeft', key: 'Alt', modifiers: { alt: true } },
    recentlyClosedKey: { display: 'Tab', code: 'Tab', key: 'Tab', modifiers: {} },
    engineModifier: { display: 'F21', code: 'F21', key: 'F21', modifiers: {} },
    forceSearchKey: { display: 'Ctrl', code: 'ControlLeft', key: 'Control', modifiers: { ctrl: true } },
    webSearchKey: { display: 'Enter', code: 'Enter', key: 'Enter', modifiers: {} }
};

// Currency codes for validation
const CURRENCY_CODES = ['USD', 'EUR', 'GBP', 'JPY', 'NOK', 'SEK', 'DKK', 'CHF', 'CAD', 'AUD', 'NZD', 'CNY', 'INR', 'BRL', 'MXN', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'ISK', 'HRK', 'RUB', 'TRY', 'ZAR', 'KRW', 'SGD', 'HKD', 'THB', 'MYR', 'IDR', 'PHP', 'ILS'];

// Currency aliases
const CURRENCY_ALIASES = {
    'euro': 'EUR'
};

// Default currencies to show when only one currency specified
const DEFAULT_TARGET_CURRENCIES = ['NOK', 'EUR', 'USD'];

// Current target currencies (loaded from settings)
let targetCurrencies = [...DEFAULT_TARGET_CURRENCIES];

// Normalize currency code (handle aliases)
function normalizeCurrency(input) {
    const upper = input.toUpperCase();
    const lower = input.toLowerCase();
    if (CURRENCY_CODES.includes(upper)) return upper;
    if (CURRENCY_ALIASES[lower]) return CURRENCY_ALIASES[lower];
    return null;
}

// All supported languages with names and flags
const ALL_LANGUAGES = {
    'en': { name: 'English', flag: '🇬🇧' },
    'de': { name: 'German', flag: '🇩🇪' },
    'no': { name: 'Norwegian', flag: '🇳🇴' },
    'es': { name: 'Spanish', flag: '🇪🇸' },
    'fr': { name: 'French', flag: '🇫🇷' },
    'it': { name: 'Italian', flag: '🇮🇹' },
    'pt': { name: 'Portuguese', flag: '🇵🇹' },
    'nl': { name: 'Dutch', flag: '🇳🇱' },
    'pl': { name: 'Polish', flag: '🇵🇱' },
    'ru': { name: 'Russian', flag: '🇷🇺' },
    'ja': { name: 'Japanese', flag: '🇯🇵' },
    'zh': { name: 'Chinese', flag: '🇨🇳' },
    'ko': { name: 'Korean', flag: '🇰🇷' },
    'ar': { name: 'Arabic', flag: '🇸🇦' },
    'hi': { name: 'Hindi', flag: '🇮🇳' },
    'tr': { name: 'Turkish', flag: '🇹🇷' },
    'sv': { name: 'Swedish', flag: '🇸🇪' },
    'da': { name: 'Danish', flag: '🇩🇰' },
    'fi': { name: 'Finnish', flag: '🇫🇮' },
    'cs': { name: 'Czech', flag: '🇨🇿' },
    'el': { name: 'Greek', flag: '🇬🇷' },
    'he': { name: 'Hebrew', flag: '🇮🇱' },
    'th': { name: 'Thai', flag: '🇹🇭' },
    'vi': { name: 'Vietnamese', flag: '🇻🇳' },
    'uk': { name: 'Ukrainian', flag: '🇺🇦' },
    'ro': { name: 'Romanian', flag: '🇷🇴' },
    'hu': { name: 'Hungarian', flag: '🇭🇺' },
    'id': { name: 'Indonesian', flag: '🇮🇩' }
};

// Default translation settings
const DEFAULT_TRANSLATION_PREFIXES = {
    "'e": 'en',"'n": 'no',"'g": 'de',"'a": 'auto'
};
const DEFAULT_TRANSLATION_TARGETS = ['en', 'de', 'no'];

// Default definition settings
const DEFAULT_DEFINITION_PREFIXES = {
    "'d": 'en'
};

// Current translation settings (loaded from storage)
let translationPrefixes = { ...DEFAULT_TRANSLATION_PREFIXES };
let translationTargets = [...DEFAULT_TRANSLATION_TARGETS];

// Current definition settings (loaded from storage)
let definitionPrefixes = { ...DEFAULT_DEFINITION_PREFIXES };

const getLanguageName = (code) => ALL_LANGUAGES[code]?.name || code;
const getLanguageFlag = (code) => ALL_LANGUAGES[code]?.flag || '🌐';

function isQuotePrefixedCommand(query) {
    const t = query.trim().toLowerCase();
    const matchesPrefix = (prefixes) => Object.keys(prefixes).some(p => t === p || t.startsWith(p + ' '));
    return matchesPrefix(definitionPrefixes) || 
           matchesPrefix(translationPrefixes) || matchesPrefix(WEATHER_LOCATIONS);
}

function parseTranslationQuery(query) {
    const trimmed = query.trim();
    for (const [prefix, lang] of Object.entries(translationPrefixes)) {
        if (trimmed.toLowerCase().startsWith(prefix)) {
            const text = trimmed.slice(prefix.length).trim();
            if (text.length > 0) return { sourceLang: lang, text };
        }
    }
    return null;
}

async function fetchSingleTranslation(text, fromLang, toLang) {
    try {
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.responseStatus === 200 ? data.responseData?.translatedText : null;
    } catch (e) { return null; }
}

async function detectLanguage(text) {
    try {
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|en`);
        if (response.ok) {
            const data = await response.json();
            const detected = data.responseData?.detectedLanguage?.toLowerCase();
            if (detected === 'nb' || detected === 'nn') return 'no';
            if (ALL_LANGUAGES[detected]) return detected;
        }
    } catch (e) {}
    return 'en';
}

// Fetch all translations
async function fetchTranslations(text, sourceLang) {
    // Detect language if auto
    const detectedLang = sourceLang === 'auto' ? await detectLanguage(text) : sourceLang;
    
    // Get target languages (exclude source)
    const targets = translationTargets.filter(lang => lang !== detectedLang);
    
    // Fetch translations in parallel
    const results = await Promise.all(
        targets.map(async (toLang) => {
            const translated = await fetchSingleTranslation(text, detectedLang, toLang);
            return { lang: toLang, text: translated };
        })
    );
    
    // Add original text
    const allResults = [
        { lang: detectedLang, text: text, isOriginal: true },
        ...results.filter(r => r.text)
    ];
    
    // Sort by the order in translationTargets
    allResults.sort((a, b) => {
        const indexA = translationTargets.indexOf(a.lang);
        const indexB = translationTargets.indexOf(b.lang);
        // Put items not in targets at the end
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
    
    return {
        type: 'translation',
        translations: allResults,
        detectedLang
    };
}

function parseDefinitionQuery(query) {
    const trimmed = query.trim();
    for (const [prefix, lang] of Object.entries(definitionPrefixes)) {
        if (trimmed.toLowerCase().startsWith(prefix)) {
            const word = trimmed.slice(prefix.length).trim();
            if (word.length > 0) return { lang, word };
        }
    }
    return null;
}

// Fetch definition from Free Dictionary API
async function fetchDefinition(word, lang = 'en') {
    try {
        // Try the specified language first
        let response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/${lang}/${encodeURIComponent(word.toLowerCase())}`);
        
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                const entry = data[0];
                const phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';
                const meanings = entry.meanings?.slice(0, 3).map(meaning => ({
                    partOfSpeech: meaning.partOfSpeech,
                    definitions: meaning.definitions?.slice(0, 2).map(def => ({
                        definition: def.definition,
                        example: def.example
                    }))
                })) || [];
                
                return {
                    type: 'definition',
                    word: entry.word,
                    phonetic,
                    meanings,
                    language: lang !== 'en' ? ALL_LANGUAGES[lang]?.name || lang : null
                };
            }
        }
        
        // If not found and language is English, try spelling suggestions
        if (lang === 'en') {
            const suggestResponse = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(word)}&max=1`);
            if (suggestResponse.ok) {
                const suggestions = await suggestResponse.json();
                if (suggestions.length > 0) {
                    const suggestedWord = suggestions[0].word;
                    response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(suggestedWord)}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (Array.isArray(data) && data.length > 0) {
                            const entry = data[0];
                            const phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';
                            const meanings = entry.meanings?.slice(0, 3).map(meaning => ({
                                partOfSpeech: meaning.partOfSpeech,
                                definitions: meaning.definitions?.slice(0, 2).map(def => ({
                                    definition: def.definition,
                                    example: def.example
                                }))
                            })) || [];
                            
                            return {
                                type: 'definition',
                                word: entry.word,
                                phonetic,
                                meanings,
                                correctedFrom: word
                            };
                        }
                    }
                }
            }
        }
        
        return { type: 'definition', error: `Word not found: "${word}"` };
    } catch (error) {
        console.error('Definition fetch error:', error);
        return { type: 'definition', error: 'Failed to fetch definition' };
    }
}

const DEFAULT_WEATHER_LOCATIONS = {
    "'t": { name: 'Tryvann', lat: 59.9847, lon: 10.6678 },
    "'w": { name: 'Oslo Røa', lat: 59.9473, lon: 10.6348 }
};

// Current weather locations (loaded from settings)
let WEATHER_LOCATIONS = { ...DEFAULT_WEATHER_LOCATIONS };

// Weather condition code mapping (WMO codes used by Open-Meteo)
const WEATHER_CODES = {
    0: 'clear sky',1: 'mainly clear',
    2: 'partly cloudy',
    3: 'overcast',
    45: 'fog',
    48: 'depositing rime fog',
    51: 'light drizzle', 53: 'moderate drizzle',55: 'dense drizzle',56: 'light freezing drizzle',57: 'dense freezing drizzle',
    61: 'slight rain',63: 'moderate rain',65: 'heavy rain',66: 'light freezing rain',67: 'heavy freezing rain',
    71: 'slight snow',73: 'moderate snow',75: 'heavy snow',77: 'snow grains',
    80: 'slight rain showers',81: 'moderate rain showers',82: 'violent rain showers',
    85: 'slight snow showers',86: 'heavy snow showers',
    95: 'thunderstorm',96: 'thunderstorm with slight hail',99: 'thunderstorm with heavy hail'
};


// Parse weather time offset - returns hours offset or null
function parseWeatherTimeOffset(input) {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return 0;
    
    // Hours: just a number (e.g., "12")
    const hoursOnly = parseInt(trimmed, 10);
    if (!isNaN(hoursOnly) && trimmed === String(hoursOnly)) {
        return hoursOnly;
    }
    
    // Days: number followed by 'd' (e.g., "2d")
    const daysMatch = trimmed.match(/^(\d+)d$/);
    if (daysMatch) {
        return parseInt(daysMatch[1], 10) * 24;
    }
    
    // Day names: mon, tue, wed, thu, fri, sat, sun
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayIndex = dayNames.indexOf(trimmed);
    if (dayIndex !== -1) {
        const now = new Date();
        const currentDay = now.getDay();
        let daysUntil = dayIndex - currentDay;
        if (daysUntil <= 0) daysUntil += 7; // Next week if today or past
        return daysUntil * 24;
    }
    
    // Date format: ddmon (e.g., "30jan", "5feb")
    const dateMatch = trimmed.match(/^(\d{1,2})(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$/);
    if (dateMatch) {
        const day = parseInt(dateMatch[1], 10);
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const month = monthNames.indexOf(dateMatch[2]);
        
        const now = new Date();
        let targetYear = now.getFullYear();
        let targetDate = new Date(targetYear, month, day);
        
        // If the date is in the past, assume next year
        if (targetDate < now) {
            targetYear++;
            targetDate = new Date(targetYear, month, day);
        }
        
        const diffMs = targetDate.getTime() - now.getTime();
        const diffHours = Math.round(diffMs / (1000 * 60 * 60));
        return diffHours;
    }
    
    return null; // Invalid format
}

// Parse weather query - returns { location, hourOffset } or null
function parseWeatherQuery(query) {
    const trimmed = query.trim().toLowerCase();
    
    for (const [prefix, location] of Object.entries(WEATHER_LOCATIONS)) {
        if (trimmed === prefix) {
            return { location, hourOffset: 0 };
        }
        if (trimmed.startsWith(prefix + ' ')) {
            const rest = trimmed.slice(prefix.length).trim();
            const hourOffset = parseWeatherTimeOffset(rest);
            if (hourOffset !== null) {
                // Cap at 16 days (384 hours) - API limit
                const cappedOffset = Math.min(hourOffset, 384);
                return { location, hourOffset: cappedOffset };
            }
            // If not a valid time format, still return with no offset
            return { location, hourOffset: 0 };
        }
    }
    return null;
}

const getWeatherSymbol = (code) => (code != null && WEATHER_CODES[code]) || '🌡️';

// Fetch weather from Open-Meteo API (16 days forecast)
async function fetchWeather(location, hourOffset = 0) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m&forecast_days=16&timezone=auto`
        );
        
        if (!response.ok) throw new Error('API error');
        
        const data = await response.json();
        const hourly = data.hourly;
        
        if (!hourly || !hourly.time || hourly.time.length === 0) return null;
        
        // Find the index for "now" (closest to current time)
        const now = new Date();
        let nowIndex = 0;
        let closestDiff = Infinity;
        for (let i = 0; i < hourly.time.length; i++) {
            const entryTime = new Date(hourly.time[i]);
            const diff = Math.abs(entryTime.getTime() - now.getTime());
            if (diff < closestDiff) {
                closestDiff = diff;
                nowIndex = i;
            }
        }
        
        // Apply hour offset
        const targetIndex = nowIndex + hourOffset;
        if (targetIndex < 0 || targetIndex >= hourly.time.length) {
            return null; // Out of range
        }
        
        // Get current weather at target index
        const targetTime = new Date(hourly.time[targetIndex]);
        const nowTemp = hourly.temperature_2m[targetIndex];
        const nowHumidity = hourly.relative_humidity_2m[targetIndex];
        const nowPrecip = hourly.precipitation_probability[targetIndex];
        const nowCode = hourly.weather_code[targetIndex];
        const nowWind = hourly.wind_speed_10m[targetIndex];
        
        // Get forecasts at specific hour offsets from the target time: +1h, +3h, +6h, +9h
        const forecastOffsets = [1, 3, 6, 9];
        const hourlyForecasts = [];
        
        for (const offset of forecastOffsets) {
            const forecastIndex = targetIndex + offset;
            if (forecastIndex >= 0 && forecastIndex < hourly.time.length) {
                const displayTime = new Date(hourly.time[forecastIndex]);
                const timeLabel = displayTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
                
                hourlyForecasts.push({
                    time: timeLabel,
                    temp: Math.round(hourly.temperature_2m[forecastIndex] || 0),
                    wind: Math.round(hourly.wind_speed_10m[forecastIndex] || 0),
                    humidity: Math.round(hourly.relative_humidity_2m[forecastIndex] || 0),
                    precip: Math.round(hourly.precipitation_probability[forecastIndex] || 0),
                    symbol: getWeatherSymbol(hourly.weather_code[forecastIndex])
                });
            }
        }
        
        // Format current time display - show date if more than 24 hours
        let currentTimeLabel;
        if (hourOffset === 0) {
            currentTimeLabel = location.name;
        } else if (hourOffset < 24) {
            currentTimeLabel = `${location.name} (+${hourOffset}h)`;
        } else {
            // Show the actual date for multi-day offsets
            const dateStr = targetTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
            currentTimeLabel = `${location.name} (${dateStr})`;
        }
        
        // Format the time label for the "current" box
        const currentBoxTimeLabel = hourOffset !== 0
            ? targetTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
            : 'Now';
        
        return {
            type: 'weather',
            location: currentTimeLabel,
            current: {
                temp: Math.round(nowTemp || 0),
                wind: Math.round(nowWind || 0),
                humidity: Math.round(nowHumidity || 0),
                precip: Math.round(nowPrecip || 0),
                symbol: getWeatherSymbol(nowCode),
                timeLabel: currentBoxTimeLabel
            },
            hourly: hourlyForecasts
        };
    } catch (error) {
        console.error('Weather fetch error:', error);
        return null;
    }
}

async function parseAIQuery(query) {
    const t = query.trim();
    if (t.length <= 1) return null;
    const { aiTrigger } = await chrome.storage.sync.get({ aiTrigger: "''" });
    // '?' always works as a natural trigger
    if (t.endsWith('?')) return t.slice(0, -1).trim() || null;
    if (aiTrigger && t.endsWith(aiTrigger)) return t.slice(0, -aiTrigger.length).trim() || null;
    return null;
}

// Fetch AI response from Groq (API key set by user in Settings)
async function fetchAIResponse(question) {
    const { groqApiKey } = await chrome.storage.sync.get({ groqApiKey: '' });
    if (!groqApiKey) {
        return { type: 'ai', question, answer: '⚠️ No Groq API key set. Open the extension Settings page to add your free key.' };
    }
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqApiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    {
                        role: 'system',
                        content: 'Answer in 1-2 short sentences maximum. Be concise and direct. always use metric and celsius. my location is norway. if the answer is a number only display the number'
                    },
                    {
                        role: 'user',
                        content: question
                    }
                ],
                max_tokens: 100,
                temperature: 0.5
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            console.error('Groq API error:', error);
            return null;
        }
        
        const data = await response.json();
        const answer = data.choices?.[0]?.message?.content?.trim();
        
        if (answer) {
            return {
                type: 'ai',
                question: question,
                answer: answer
            };
        }
        
        return null;
    } catch (error) {
        console.error('AI fetch error:', error);
        return null;
    }
}

// Search engine configurations
// Small helpers for modifiers/display
const buildModifierFlags = (keys = []) => {
  const flags = {};
  keys.forEach(k => {
    if (k === 'shift') flags.shift = true;
    else if (k === 'control') flags.ctrl = true;
    else if (k === 'alt') flags.alt = true;
    else if (k === 'meta') flags.meta = true;
  });
  return flags;
};

const buildModifierLabel = (keys = []) =>
  keys
    .map(k => (k === 'control' ? 'Ctrl' : k.charAt(0).toUpperCase() + k.slice(1)))
    .join('+');

const makeShortcut = (key, extraModifierKeys = []) => {
  const keyUpper = key.toUpperCase();
  const extraFlags = buildModifierFlags(extraModifierKeys);
  const baseMods = engineModifierKey.modifiers || {};
  const modifiers = { ...baseMods, ...extraFlags };
  const extraLabel = buildModifierLabel(extraModifierKeys);
  const baseDisplay = engineModifierKey.display;
  const display = extraLabel
    ? `${baseDisplay}+${extraLabel}+${keyUpper}`
    : `${baseDisplay}+${keyUpper}`;

  return {
    display,
    code: `Key${keyUpper}`,
    key: key.toLowerCase(),
    modifiers
  };
};

// Search engine configurations
const getSearchEngines = () => {

const defaultEngines = { 
herewego: { name: 'herewego', shortcut: makeShortcut('m'), url: 'https://wego.here.com/discover/', urlSuffix: '?map=59.94914,10.65364,10' }, 
shopping: { name: 'DuckDuckGo', shortcut: makeShortcut('s'), url: 'https://duckduckgo.com/?e=&t=h_&q=', urlSuffix: '&ia=shopping&iax=shopping' }, 
BraveLeo: { name: 'BraveAI', shortcut: makeShortcut('l'), url: 'https://search.brave.com/ask?... q=', urlSuffix: '' }, 
Translate: { name: 'Translate', shortcut: makeShortcut('t'), url: 'https://translate.google.com/?sl=auto&tl=de,no,en&text=&q=', urlSuffix: '' }, 
openHours: { name: 'OpenHours', shortcut: makeShortcut('o'), url: 'https://apningstider.com/spots?loc=&q=', urlSuffix: '' }, 
youtube: { name: 'YouTube', shortcut: makeShortcut('y'), url: 'https://www.youtube.com/results?search_query=', urlSuffix: '' }, 
wikipedia: { name: 'Wikipedia', shortcut: makeShortcut('w'), url: 'https://en.wikipedia.org/wiki/Special:Search?search=', urlSuffix: '' }, 
amazonDE: { name: 'Amazon.de', shortcut: makeShortcut('a'), url: 'https://www.amazon.de/s?k=', urlSuffix: '' }, 
amazonCOM: { name: 'Amazon.com', shortcut: makeShortcut('z'), url: 'https://www.amazon.com/s?k=', urlSuffix: '' }, 
klarna: { name: 'Klarna', shortcut: makeShortcut('k'), url: 'https://www.klarna.com/no/shopping/results?q=', urlSuffix: '' }, 
prisjakt: { name: 'Prisjakt', shortcut: makeShortcut('p'), url: 'https://www.prisjakt.no/search?query=', urlSuffix: '' }, 
ikea: { name: 'IKEA', shortcut: makeShortcut('i'), url: 'https://www.ikea.com/no/no/search/?q=', urlSuffix: '' }, 
finn: { name: 'Finn.no', shortcut: makeShortcut('f'), url: 'https://www.finn.no/recommerce/forsale/search?q=', urlSuffix: '' }, 
brave: { name: 'Brave Search', shortcut: makeShortcut('b'), url: 'https://search.brave.com/search?q=', urlSuffix: '' }
};

  const allEngines = { ...defaultEngines };

  // Apply modifications to default engines
  if (modifiedDefaultEngines) {
    Object.entries(modifiedDefaultEngines).forEach(([engineId, mod]) => {
      const engine = allEngines[engineId];
      if (!engine) return;

      engine.name = mod.name;
      engine.url = mod.url;
      if (mod.urlSuffix !== undefined) engine.urlSuffix = mod.urlSuffix;

      engine.shortcut = makeShortcut(mod.key, mod.modifierKeys);
    });
  }

  // Remove disabled engines
  if (disabledDefaultEngines?.length) {
    disabledDefaultEngines.forEach(id => delete allEngines[id]);
  }

  // Add custom engines
  if (customEngines?.length) {
    customEngines.forEach(engine => {
      const keyLower = engine.key.toLowerCase();
      const idSuffix = engine.modifierKeys?.join('_') || 'none';
      const shortcut = makeShortcut(engine.key, engine.modifierKeys);

      allEngines[`custom_${keyLower}_${idSuffix}`] = {
        name: engine.name,
        shortcut,
        url: engine.url,
        urlSuffix: engine.urlSuffix || '',
        isCustom: true
      };
    });
  }

  return allEngines;
};

// State
let allTabs = [], filteredTabs = [], recentlyClosed = [], filteredClosed = [], selectedIndex = 0, currentTabId = null;
let modifierHeld = false, otherKeyPressedWithModifier = false, targetModifierHeld = false, otherKeyPressedWithTargetModifier = false;
let engineModifierHeld = false, otherKeyPressedWithEngineModifier = false, closePressedInCombo = false;
let closeModifierKey = DEFAULT_SETTINGS.closeModifier, targetModifierKey = DEFAULT_SETTINGS.targetModifier;
let recentlyClosedKey = DEFAULT_SETTINGS.recentlyClosedKey;
let engineModifierKey = DEFAULT_SETTINGS.engineModifier, forceSearchKey = DEFAULT_SETTINGS.forceSearchKey, webSearchKey = DEFAULT_SETTINGS.webSearchKey;
let pinnedWebsites = [], customEngines = [], disabledDefaultEngines = [], modifiedDefaultEngines = {}, hotPages = [];
let recentlyClosedMode = false, onlySearchClosedWhenJumped = false, forceSearchMode = false;
let searchSuggestions = [], suggestionsFetchAbortController = null, suggestionsDebounceTimer = null;
let targetModifierHeldForSuggestion = false, suggestionSelectedIndex = -1, suggestionSelectedEngine = null, targetModifierOnlyPressed = false;
let matchedHotPage = null, searchHistory = [], searchHistoryIndex = -1;
let enableSearchHistory = true, recentlyClosedKeyDisabled = false, forceSearchKeyDisabled = false;
let defaultSearchEngine = 'https://duckduckgo.com/?q=';

// Build search URL using the configured default search engine
function buildSearchUrl(query) {
    return defaultSearchEngine + encodeURIComponent(query);
}
let instantAnswer = null, currencyCache = {};

// Theme classes for instant answers
const THEME_CLASSES = ['theme-blue', 'theme-purple', 'theme-green'];
const TEXT_PRIMARY = ['text-blue-primary', 'text-purple-primary', 'text-green-primary'];
const TEXT_SECONDARY = ['text-blue-secondary', 'text-purple-secondary', 'text-green-secondary'];

// Utilities
async function setZoom() {
    setTimeout(() => {
    try {chrome.tabs.setZoom(1.0); } catch (e) {}
    document.body.style.zoom = "1";
}, 1000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function isUrlOrDomain(input) {
    return /^https?:\/\//i.test(input) || /^[^\s]+\.[^\s]+$/.test(input) || /^(localhost|(\d{1,3}\.){3}\d{1,3})(:\d+)?/.test(input);
}

// Save search to history
async function saveSearchHistory(query) {
    // Check setting directly from storage
    const settings = await chrome.storage.sync.get({ enableSearchHistory: true });
    if (!settings.enableSearchHistory) return; // Feature disabled
    if (!query || isUrlOrDomain(query)) return; // Don't save URLs
    // Remove if already exists, then add to front
    searchHistory = searchHistory.filter(s => s !== query);
    searchHistory.unshift(query);
    // Keep only last 10
    searchHistory = searchHistory.slice(0, 10);
    await chrome.storage.local.set({ searchHistory });
}

function modifierMatches(keyConfig, event, forRelease = false) {
    if (!keyConfig) return false;
    const mods = keyConfig.modifiers || {};
    const modCount = Object.keys(mods).length;
    
    if (forRelease && modCount === 1) {
        if (mods.ctrl && !mods.alt && !mods.shift && !mods.meta) return event.key === 'Control';
        if (mods.alt && !mods.ctrl && !mods.shift && !mods.meta) return event.key === 'Alt';
        if (mods.shift && !mods.ctrl && !mods.alt && !mods.meta) return event.key === 'Shift';
    }
    
    if (forRelease && mods.ctrl && mods.alt && !mods.shift && !mods.meta) {
        return (event.key === 'Control' || event.key === 'Alt');
    }
    
    return !!mods.ctrl === !!event.ctrlKey && !!mods.alt === !!event.altKey && 
           !!mods.shift === !!event.shiftKey && !!mods.meta === !!event.metaKey &&
           (event.code === keyConfig.code || event.key === keyConfig.key);
}

// Parse and evaluate currency conversion
function parseCurrencyQuery(query) {
    // Match patterns like "10 usd nok", "100 eur to usd", "50.5 gbp in nok", or just "10 sek"
    const twoMatch = query.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s+(?:to|in)?\s*([a-zA-Z]+)$/i);
    const oneMatch = query.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/i);
    
    if (twoMatch) {
        const amount = parseFloat(twoMatch[1]);
        const fromCurrency = normalizeCurrency(twoMatch[2]);
        const toCurrency = normalizeCurrency(twoMatch[3]);
        
        if (!fromCurrency || !toCurrency) return null;
        return { amount, from: fromCurrency, to: toCurrency, multi: false };
    }
    
    if (oneMatch) {
        const amount = parseFloat(oneMatch[1]);
        const fromCurrency = normalizeCurrency(oneMatch[2]);
        
        if (!fromCurrency) return null;
        
        // Get target currencies excluding the source currency
        const targets = targetCurrencies.filter(c => c !== fromCurrency);
        
        return { amount, from: fromCurrency, targets, multi: true };
    }
    
    return null;
}

// Fetch currency conversion (single target)
async function fetchSingleCurrencyConversion(amount, from, to) {
    const cacheKey = `${from}_${to}`;
    const now = Date.now();
    
    // Check cache (valid for 10 minutes)
    if (currencyCache[cacheKey] && (now - currencyCache[cacheKey].timestamp) < 600000) {
        const rate = currencyCache[cacheKey].rate;
        return { to, converted: amount * rate, rate };
    }
    
    try {
        const response = await fetch(`https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`);
        if (!response.ok) throw new Error('API error');
        
        const data = await response.json();
        const convertedAmount = data.rates[to];
        const rate = convertedAmount / amount;
        
        // Cache the rate
        currencyCache[cacheKey] = { rate, timestamp: now };
        
        return { to, converted: convertedAmount, rate };
    } catch (error) {
        console.error('Currency conversion error:', error);
        return null;
    }
}

// Fetch currency conversion (handles both single and multi-target)
async function fetchCurrencyConversion(amount, from, toOrTargets, multi = false) {
    if (!multi) {
        // Single target conversion
        const result = await fetchSingleCurrencyConversion(amount, from, toOrTargets);
        if (!result) return null;
        
        return {
            type: 'currency',
            multi: false,
            conversions: [{ currency: result.to, amount: result.converted.toFixed(2) }]
        };
    }
    
    // Multi-target conversion
    const targets = toOrTargets;
    const now = Date.now();
    
    try {
        // Try to fetch all at once
        const targetStr = targets.join(',');
        const response = await fetch(`https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${targetStr}`);
        if (!response.ok) throw new Error('API error');
        
        const data = await response.json();
        
        // Build conversions array
        const conversions = targets.map(t => {
            const converted = data.rates[t];
            if (converted !== undefined) {
                // Cache individual rates
                currencyCache[`${from}_${t}`] = { rate: converted / amount, timestamp: now };
                return { currency: t, amount: converted.toFixed(2) };
            }
            return null;
        }).filter(Boolean);
        
        if (conversions.length === 0) return null;
        
        return {
            type: 'currency',
            multi: true,
            conversions
        };
    } catch (error) {
        console.error('Currency conversion error:', error);
        return null;
    }
}

// Simple math evaluator without eval/Function (CSP safe)
function evaluateMath(expr) {
    // Remove spaces
    expr = expr.replace(/\s+/g, '');
    
    // Tokenize
    const tokens = [];
    let num = '';
    for (let i = 0; i < expr.length; i++) {
        const c = expr[i];
        if ((c >= '0' && c <= '9') || c === '.') {
            num += c;
        } else if (c === '-' && num === '' && (tokens.length === 0 || typeof tokens[tokens.length - 1] === 'string' && tokens[tokens.length - 1] !== ')')) {
            // Negative sign at start or after operator/open paren
            num += c;
        } else {
            if (num) { 
                tokens.push(parseFloat(num)); 
                num = ''; 
            }
            if (['+', '-', '*', '/', '(', ')', '^', '%'].includes(c)) {
                tokens.push(c);
            }
        }
    }
    if (num) tokens.push(parseFloat(num));
    
    // Shunting yard algorithm for operator precedence
    const output = [], ops = [];
    const prec = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 3 };
    const rightAssoc = { '^': true };
    
    for (const token of tokens) {
        if (typeof token === 'number') {
            output.push(token);
        } else if (token === '(') {
            ops.push(token);
        } else if (token === ')') {
            while (ops.length && ops[ops.length - 1] !== '(') output.push(ops.pop());
            ops.pop();
        } else if (prec[token]) {
            while (ops.length && prec[ops[ops.length - 1]] && 
                   (prec[ops[ops.length - 1]] > prec[token] || 
                    (prec[ops[ops.length - 1]] === prec[token] && !rightAssoc[token]))) {
                output.push(ops.pop());
            }
            ops.push(token);
        }
    }
    while (ops.length) output.push(ops.pop());
    
    // Evaluate RPN
    const stack = [];
    for (const token of output) {
        if (typeof token === 'number') {
            stack.push(token);
        } else {
            const b = stack.pop(), a = stack.pop();
            switch (token) {
                case '+': stack.push(a + b); break;
                case '-': stack.push(a - b); break;
                case '*': stack.push(a * b); break;
                case '/': stack.push(a / b); break;
                case '%': stack.push(a % b); break;
                case '^': stack.push(Math.pow(a, b)); break;
            }
        }
    }
    return stack[0];
}

// Parse and evaluate math expression
function parseMathQuery(query) {
    const trimmed = query.trim();
    
    // Don't process if empty or has letters
    if (!trimmed || /[a-zA-Z]/.test(trimmed)) return null;
    
    // Must look like a math expression (number operator number pattern)
    if (!/\d\s*[+*\/\^%\-]\s*\d/.test(trimmed)) return null;
    
    // Only allow safe characters
    if (!/^[0-9+\-*\/\^%.()\s]+$/.test(trimmed)) return null;
    
    try {
        const result = evaluateMath(trimmed);
        
        if (typeof result !== 'number' || !isFinite(result)) return null;
        
        // Format result
        const formatted = Number.isInteger(result) ? String(result) : parseFloat(result.toFixed(10)).toString();
        
        return {
            type: 'math',
            result: trimmed + ' = ' + formatted,
            details: 'Calculator'
        };
    } catch (e) {
        return null;
    }
}

async function processInstantAnswer(query) {
    const q = query.trim();
    instantAnswer = null;
    
    // AI (ends with configured trigger or ?)
    const aiQ = await parseAIQuery(q);
    if (aiQ) { instantAnswer = await fetchAIResponse(aiQ); return; }
    
    // Weather
    const weather = parseWeatherQuery(q);
    if (weather) { instantAnswer = await fetchWeather(weather.location, weather.hourOffset); return; }
    
    // Translation
    const trans = parseTranslationQuery(q);
    if (trans) { const r = await fetchTranslations(trans.text, trans.sourceLang); if (r?.translations.length > 0) instantAnswer = r; return; }
    
    // Definition
    const def = parseDefinitionQuery(q);
    if (def) { instantAnswer = await fetchDefinition(def.word, def.lang); return; }
    
    // Math
    const math = parseMathQuery(q);
    if (math) { instantAnswer = math; return; }
    
    // Currency
    const curr = parseCurrencyQuery(q);
    if (curr) { instantAnswer = curr.multi ? await fetchCurrencyConversion(curr.amount, curr.from, curr.targets, true) : await fetchCurrencyConversion(curr.amount, curr.from, curr.to, false); }
}

// Render instant answer box
function renderInstantAnswer() {
    // Remove existing answer boxes
    document.querySelectorAll('.instant-answer-box').forEach(el => el.remove());
    const oldBox = document.getElementById('instant-answer');
    if (oldBox) oldBox.remove();
    
    if (!instantAnswer) return;
    
    const tabList = document.getElementById('tab-list');
    
    if (instantAnswer.type === 'ai') {
        // AI response - single box with gradient
        const container = document.createElement('div');
        container.className = 'instant-answer-box answer-box theme-orange flex-row flex-start padded';
        container.innerHTML = `
            <div class="answer-icon">🤖</div>
            <div class="answer-content">
                <div class="answer-text text-orange-primary">${escapeHtml(instantAnswer.answer)}</div>
                <div class="answer-label text-orange-secondary">AI Answer</div>
            </div>
        `;
        tabList.parentNode.insertBefore(container, tabList);
    } else if (instantAnswer.type === 'weather') {
        // Weather display
        const container = document.createElement('div');
        container.className = 'instant-answer-box instant-answer-container weather';
        
        // Current weather box
        const currentBox = document.createElement('div');
        currentBox.className = `answer-box weather-box flex-1 ${THEME_CLASSES[0]}`;
        currentBox.innerHTML = `
            <div class="answer-time ${TEXT_SECONDARY[0]}">${instantAnswer.current.timeLabel || 'Now'}</div>
            <div class="answer-icon large">${instantAnswer.current.symbol}</div>
            <div class="answer-value ${TEXT_PRIMARY[0]}">${instantAnswer.current.temp}°</div>
            <div class="answer-stats ${TEXT_SECONDARY[0]}">💨${instantAnswer.current.wind} 💧${instantAnswer.current.humidity}% 🌧${instantAnswer.current.precip}%</div>
        `;
        container.appendChild(currentBox);
        
        // Hourly forecast boxes
        instantAnswer.hourly.forEach((hour, index) => {
            const themeIndex = (index + 1) % THEME_CLASSES.length;
            const hourBox = document.createElement('div');
            hourBox.className = `answer-box weather-box flex-1 ${THEME_CLASSES[themeIndex]}`;
            hourBox.innerHTML = `
                <div class="answer-time ${TEXT_SECONDARY[themeIndex]}">${hour.time}</div>
                <div class="answer-icon large">${hour.symbol}</div>
                <div class="answer-value ${TEXT_PRIMARY[themeIndex]}">${hour.temp}°</div>
                <div class="answer-stats ${TEXT_SECONDARY[themeIndex]}">💨${hour.wind} 💧${hour.humidity}% 🌧${hour.precip}%</div>
            `;
            container.appendChild(hourBox);
        });
        
        tabList.parentNode.insertBefore(container, tabList);
    } else if (instantAnswer.type === 'currency' && instantAnswer.conversions) {
        // Create container for currency boxes
        const container = document.createElement('div');
        container.className = 'instant-answer-box instant-answer-container currency';
        
        // Calculate box width based on number of conversions
        const count = instantAnswer.conversions.length;
        const perRow = count <= 5 ? count : Math.ceil(count / 2);
        const boxWidth = `calc(${100 / perRow}% - ${(perRow - 1) * 8 / perRow}px)`;
        
        instantAnswer.conversions.forEach((conv, index) => {
            const themeIndex = index % THEME_CLASSES.length;
            const box = document.createElement('div');
            box.className = `answer-box ${THEME_CLASSES[themeIndex]}`;
            box.style.width = boxWidth;
            box.innerHTML = `
                <div class="answer-title ${TEXT_PRIMARY[themeIndex]}">${escapeHtml(conv.amount)}</div>
                <div class="answer-subtitle ${TEXT_SECONDARY[themeIndex]}">${escapeHtml(conv.currency)}</div>
            `;
            container.appendChild(box);
        });
        
        tabList.parentNode.insertBefore(container, tabList);
    } else if (instantAnswer.type === 'translation' && instantAnswer.translations) {
        // Create container for translation boxes
        const container = document.createElement('div');
        container.className = 'instant-answer-box instant-answer-container column';
        
      instantAnswer.translations.filter(trans => !trans.isOriginal).forEach((trans, index) => {
            const themeIndex = index % THEME_CLASSES.length;
            const box = document.createElement('div');
            box.className = `answer-box flex-row ${THEME_CLASSES[themeIndex]}`;
            const langLabel = getLanguageName(trans.lang);
            const flag = getLanguageFlag(trans.lang);
            box.innerHTML = `
                <div class="translation-flag">${flag}</div>
                <div class="translation-content">
                    <div class="translation-text ${TEXT_PRIMARY[themeIndex]}">${escapeHtml(trans.text)}</div>
                    <div class="translation-lang ${TEXT_SECONDARY[themeIndex]}">${escapeHtml(langLabel)}${trans.isOriginal ? ' (original)' : ''}</div>
                </div>
            `;
            container.appendChild(box);
        });
        
        tabList.parentNode.insertBefore(container, tabList);
    } else if (instantAnswer.type === 'math') {
        // Math result - single green box
        const box = document.createElement('div');
        box.className = 'instant-answer-box answer-box theme-green flex-row padded';
        box.innerHTML = `
            <div class="answer-icon">🔢</div>
            <div class="answer-content">
                <div class="answer-value text-green-primary">${escapeHtml(instantAnswer.result)}</div>
                <div class="answer-subtitle text-green-secondary">${escapeHtml(instantAnswer.details)}</div>
            </div>
        `;
        tabList.parentNode.insertBefore(box, tabList);
    } else if (instantAnswer.type === 'definition') {
        // Definition result
        const container = document.createElement('div');
        container.className = 'instant-answer-box answer-box theme-indigo padded';
        
        if (instantAnswer.error) {
            container.innerHTML = `
                <div class="definition-error">
                    <div class="answer-icon">📖</div>
                    <div class="definition-error-text text-indigo-secondary">${escapeHtml(instantAnswer.error)}</div>
                </div>
            `;
        } else {
            let html = `
                <div class="definition-header">
                    <div class="answer-icon">📖</div>
                    <div>
                        <span class="definition-word text-indigo-primary">${escapeHtml(instantAnswer.word)}</span>
                        ${instantAnswer.phonetic ? `<span class="definition-phonetic text-indigo-secondary">${escapeHtml(instantAnswer.phonetic)}</span>` : ''}
                        ${instantAnswer.language ? `<span class="definition-lang text-indigo-tertiary">(${escapeHtml(instantAnswer.language)})</span>` : ''}
                        ${instantAnswer.correctedFrom ? `<span class="definition-corrected text-indigo-tertiary">(corrected from "${escapeHtml(instantAnswer.correctedFrom)}")</span>` : ''}
                    </div>
                </div>
            `;
            
            instantAnswer.meanings.forEach(meaning => {
                html += `<div class="definition-meaning">`;
                html += `<div class="definition-pos text-indigo-secondary">${escapeHtml(meaning.partOfSpeech)}</div>`;
                meaning.definitions.forEach((def, i) => {
                    html += `<div class="definition-def text-indigo-primary">${i + 1}. ${escapeHtml(def.definition)}</div>`;
                    if (def.example) {
                        html += `<div class="definition-example text-indigo-tertiary">"${escapeHtml(def.example)}"</div>`;
                    }
                });
                html += `</div>`;
            });
            
            container.innerHTML = html;
        }
        
        tabList.parentNode.insertBefore(container, tabList);
    }
}

// Fetch search suggestions
async function fetchSearchSuggestions(query) {
    if (!query.trim()) {
        searchSuggestions = [];
        return;
    }

    if (suggestionsFetchAbortController) suggestionsFetchAbortController.abort();
    if (suggestionsDebounceTimer) clearTimeout(suggestionsDebounceTimer);

    suggestionsFetchAbortController = new AbortController();
    
    try {
        const response = await Promise.race([
            fetch(`https://search.brave.com/api/suggest?q=${encodeURIComponent(query)}`, 
                { signal: suggestionsFetchAbortController.signal, mode: 'cors' }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]);
        
        if (response.ok) {
            const data = await response.json();
            searchSuggestions = Array.isArray(data[1]) && data[1].length > 0 ? data[1].slice(0, 8) : [];
        } else {
            searchSuggestions = [];
        }
    } catch (error) {
        if (error.name !== 'AbortError') console.error('Error fetching suggestions:', error);
        searchSuggestions = [];
    }
    
    const currentCombinedTabs = [...filteredTabs, ...filteredClosed];
    if (currentCombinedTabs.length === 0) renderSearchSuggestions();
}

// Load settings
async function loadModifierSettings() {
    // Parallel fetch: sync storage, local storage, and topSites all at once
    const [result, localResult, topSites] = await Promise.all([
        chrome.storage.sync.get({ 
            closeModifierData: null, targetModifierData: null,
            recentlyClosedKeyData: null, engineModifierData: null,
            forceSearchKeyData: null, webSearchKeyData: null,
            showInstructions: false, pinnedWebsites: [], hotPages: [], onlySearchClosedWhenJumped: true,
            customEngines: [], disabledDefaultEngines: [], modifiedDefaultEngines: {},
            useTopSitesAsHotPages: false, enableSearchHistory: true,
            recentlyClosedKeyDisabled: false, forceSearchKeyDisabled: false,
            prioritizeHotPage: true, targetCurrencies: null, translationPrefixes: null,
            translationTargets: null, weatherLocations: null, definitionPrefixes: null,
            showClock: true,animations: true, defaultSearchEngine: null, servicePrefix: "'"
        }),
        chrome.storage.local.get({ searchHistory: [] }),
        chrome.topSites.get().catch(() => [])
    ]);
    
    // Store settings for later use - ensure boolean
    enableSearchHistory = result.enableSearchHistory !== false;
    prioritizeHotPage = result.prioritizeHotPage !== false;  // Default true
    animations = result.animations !== false
    showInstructions = result.showInstructions !== false;
    recentlyClosedKeyDisabled = result.recentlyClosedKeyDisabled === true;
    forceSearchKeyDisabled = result.forceSearchKeyDisabled === true;
    
    searchHistory = localResult.searchHistory || [];
    
    closeModifierKey = result.closeModifierData || DEFAULT_SETTINGS.closeModifier;
    targetModifierKey = result.targetModifierData || DEFAULT_SETTINGS.targetModifier;
    recentlyClosedKey = result.recentlyClosedKeyData || DEFAULT_SETTINGS.recentlyClosedKey;
    engineModifierKey = result.engineModifierData || DEFAULT_SETTINGS.engineModifier;
    forceSearchKey = result.forceSearchKeyData || DEFAULT_SETTINGS.forceSearchKey;
    webSearchKey = result.webSearchKeyData || DEFAULT_SETTINGS.webSearchKey;
    pinnedWebsites = result.pinnedWebsites || [];
    onlySearchClosedWhenJumped = result.onlySearchClosedWhenJumped;
    customEngines = result.customEngines || [];
    disabledDefaultEngines = result.disabledDefaultEngines || [];
    modifiedDefaultEngines = result.modifiedDefaultEngines || {};
    defaultSearchEngine = result.defaultSearchEngine || 'https://duckduckgo.com/?q=';
    
    // Load target currencies, translation settings, definition settings, weather locations
    if (result.targetCurrencies?.length > 0) targetCurrencies = result.targetCurrencies;
    if (result.translationPrefixes && Object.keys(result.translationPrefixes).length > 0) translationPrefixes = result.translationPrefixes;
    if (result.translationTargets?.length > 0) translationTargets = result.translationTargets;
    if (result.definitionPrefixes && Object.keys(result.definitionPrefixes).length > 0) definitionPrefixes = result.definitionPrefixes;
    if (result.weatherLocations && Object.keys(result.weatherLocations).length > 0) WEATHER_LOCATIONS = result.weatherLocations;

    // Normalize legacy prefix keys: if stored with "'" but servicePrefix differs, remap on the fly
    const svcPfx = result.servicePrefix || "'";
    if (svcPfx !== "'") {
        const remap = (obj) => {
            const out = {};
            for (const [k, v] of Object.entries(obj)) {
                out[k.startsWith("'") ? svcPfx + k.slice(1) : k] = v;
            }
            return out;
        };
        translationPrefixes = remap(translationPrefixes);
        definitionPrefixes = remap(definitionPrefixes);
        WEATHER_LOCATIONS = remap(WEATHER_LOCATIONS);
    }
    
    // Load hot pages
    const manualHotPages = result.hotPages || [];
    
    // If no manual hot pages, load from hotpages.json
    if (manualHotPages.length === 0) {
        try {
            const response = await fetch(chrome.runtime.getURL('hotpages.json'));
            if (response.ok) {
                const data = await response.json();
                if (data?.hotPages?.length > 0) {
                    hotPages = data.hotPages;
                    // Save to storage so it's cached for next time
                    chrome.storage.sync.set({ hotPages });
                }
            }
        } catch (e) {
            // Silently ignore
        }
    } else {
        hotPages = manualHotPages;
    }
    
    // Merge topSites if enabled (already fetched in parallel above)
    if (result.useTopSitesAsHotPages && topSites.length > 0) {
        const topSitesAsHotPages = topSites.map(site => ({
            url: site.url,
            title: site.title,
            fromTopSites: true
        }));
        const existingUrls = new Set(hotPages.map(p => p.url));
        hotPages = [...hotPages, ...topSitesAsHotPages.filter(p => !existingUrls.has(p.url))];
    }
    
    const instructionsEl = document.getElementById('instructions');
    instructionsEl.classList.toggle('visible', result.showInstructions);
    updateInstructions();
    renderPinnedWebsites();
    
    // Clock setting
    showClock = result.showClock !== false;
    clockSettingLoaded = true;
    updateClock();
}

// Update instructions
function updateInstructions() {
    const instructionsDiv = document.getElementById('instructions');
    
    // Build optional key shortcuts (only show if not disabled)
    const recentlyClosedShortcut = !recentlyClosedKeyDisabled && recentlyClosedKey 
        ? `<span><span class="shortcut-hint">${recentlyClosedKey.display}</span> jump to closed</span>` 
        : '';
    
    const newContent = `
        <div class="instructions-flex">
            <span><span class="shortcut-hint">${targetModifierKey.display}</span>+<span class="shortcut-hint">A</span> switch/restore</span>
            <span><span class="shortcut-hint">${targetModifierKey.display}</span> confirm highlighted</span>
            <span><span class="shortcut-hint">${closeModifierKey.display}</span>+<span class="shortcut-hint">A</span> close tab</span>
            <span><span class="shortcut-hint">${targetModifierKey.display}</span>+<span class="shortcut-hint">${closeModifierKey.display}</span> close highlighted</span>
            ${recentlyClosedShortcut}
            <span><span class="shortcut-hint">↑</span><span class="shortcut-hint">↓</span> navigate</span>
        </div>
    `;
    
    if (instructionsDiv.innerHTML.trim() !== newContent.trim()) {
        instructionsDiv.innerHTML = newContent;
    }
}

// Initialize
async function initialize() {
    const [tabs, sessions] = await Promise.all([
        chrome.tabs.query({ windowType: 'normal' }),
        chrome.sessions.getRecentlyClosed({ maxResults: 25 }),
        loadModifierSettings()
    ]);
    
    currentTabId = tabs.find(t => t.active)?.id || null;
    allTabs = tabs;
    recentlyClosed = sessions.filter(s => s.tab).map(s => s.tab);
    
    filteredTabs = onlySearchClosedWhenJumped && recentlyClosedMode ? [] : tabs;
    filteredClosed = onlySearchClosedWhenJumped && !recentlyClosedMode ? [] : recentlyClosed;
    
    renderTabs();
    selectTab(0);
    updateRecentlyClosedIcon();
}

// Apply settings from cache without storage fetch
// Render tabs
function renderTabs() {
    const tabList = document.getElementById('tab-list');
    const combinedTabs = [...filteredTabs, ...filteredClosed];

    if (animations){
        tabList.style.transition = 'opacity 0.0735s'     
    }
    else{
        tabList.style.transition = 'opacity 0.0s'     
    }
        

    
    
    // If force search mode is enabled and we have a query, show suggestions instead
    const query = document.getElementById('search-box').value.trim();
    if (forceSearchMode && query) {
        renderSearchSuggestions();
        return;
    }
    
    if (combinedTabs.length === 0) {
        renderSearchSuggestions();
        return;
    }

    // Render instant answer above tabs if available
    renderInstantAnswer();

    tabList.classList.add('two-columns');
    document.body.classList.add('two-column-mode');
    // Don't remove 'loaded' class here - it causes flashing
    
    const fragment = document.createDocumentFragment();
    let globalIndex = 0;
    
    // Open tabs
    if (filteredTabs.length > 0) {
        // No header for open tabs (removed per user request)
        
        const sortedTabs = [...filteredTabs].sort((a, b) => (a.audible && !b.audible) ? -1 : (!a.audible && b.audible) ? 1 : 0);
        const tabElements = sortedTabs.map((tab, index) => {
            const isActive = tab.id === currentTabId;
            const shortcutKey = globalIndex < SHORTCUT_KEYS.length ? SHORTCUT_KEYS[globalIndex] : '';
            const item = document.createElement('div');
            item.className = `tab-item ${isActive ? 'active-tab' : ''}`;
            item.dataset.index = index;
            item.dataset.globalIndex = globalIndex;
            item.dataset.type = 'open';
            item.dataset.tabId = tab.id;
            
            const isPinned = pinnedWebsites.some(p => p.url === tab.url);
            const isHot = hotPages.some(p => p.url === tab.url);
            item.innerHTML = `
                ${shortcutKey ? `<div class="tab-shortcut">${shortcutKey}</div>` : ''}
                ${tab.audible ? '<div class="audio-icon">🔊</div>' : ''}
                <img class="tab-favicon" src="${tab.favIconUrl || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><text y=%2214%22 font-size=%2214%22>🌐</text></svg>'}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><text y=%2214%22 font-size=%2214%22>🌐</text></svg>'">
                <div class="tab-info">
                    <div class="tab-title">${escapeHtml(tab.title || 'Untitled')}</div>
                    <div class="tab-url">${escapeHtml(new URL(tab.url).hostname)}</div>
                </div>
                <div class="hot-btn ${isHot ? 'hot' : ''}" data-tab-url="${tab.url.replace(/"/g, '&quot;')}" data-tab-title="${(tab.title || 'Untitled').replace(/"/g, '&quot;')}" data-favicon="${(tab.favIconUrl || '').replace(/"/g, '&quot;')}">🔥</div>
                <div class="star-btn ${isPinned ? 'pinned' : ''}" data-tab-url="${tab.url.replace(/"/g, '&quot;')}" data-tab-title="${(tab.title || 'Untitled').replace(/"/g, '&quot;')}" data-favicon="${(tab.favIconUrl || '').replace(/"/g, '&quot;')}">★</div>
                <div class="close-btn" data-tab-id="${tab.id}">×</div>
            `;
            globalIndex++;
            return item;
        });
        
        // Reorder for two-column layout (left column first, then right)
        const tabsPerColumn = Math.ceil(tabElements.length / 2);
        for (let i = 0; i < tabsPerColumn; i++) {
            if (tabElements[i]) fragment.appendChild(tabElements[i]);
        }
        for (let i = tabsPerColumn; i < tabElements.length; i++) {
            if (tabElements[i]) fragment.appendChild(tabElements[i]);
        }
    }
    
    // Recently closed tabs
    if (filteredClosed.length > 0) {
        const header = document.createElement('div');
        header.className = 'section-header';
        // Show hint about Tab key when in onlySearchClosedWhenJumped mode and there are open tabs (only if key not disabled)
        const showTabHint = onlySearchClosedWhenJumped && query && allTabs.length > 0 && !recentlyClosedKeyDisabled && recentlyClosedKey;
        header.textContent = showTabHint 
            ? `Recently Closed (press ${recentlyClosedKey?.display || 'Tab'} for open tabs)` 
            : 'Recently Closed';
        fragment.appendChild(header);
        
        filteredClosed.forEach((tab, index) => {
            const shortcutKey = globalIndex < SHORTCUT_KEYS.length ? SHORTCUT_KEYS[globalIndex] : '';
            const item = document.createElement('div');
            item.className = 'tab-item closed-tab';
            item.dataset.index = index;
            item.dataset.globalIndex = globalIndex;
            item.dataset.type = 'closed';
            item.dataset.closedIndex = index;
            
            item.innerHTML = `
                ${shortcutKey ? `<div class="tab-shortcut closed-shortcut">${shortcutKey}</div>` : ''}
                <img class="tab-favicon" src="${tab.favIconUrl || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><text y=%2214%22 font-size=%2214%22>🌐</text></svg>'}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><text y=%2214%22 font-size=%2214%22>🌐</text></svg>'">
                <div class="tab-info">
                    <div class="tab-title">${escapeHtml(tab.title || 'Untitled')}</div>
                    <div class="tab-url">${escapeHtml(new URL(tab.url).hostname)}</div>
                </div>
            `;
            fragment.appendChild(item);
            globalIndex++;
        });
    }
    
    tabList.innerHTML = '';
    tabList.appendChild(fragment);
    
    requestAnimationFrame(() => {
        tabList.classList.add('loaded');
    });
    
    setupEventDelegation();
}

// Render search suggestions
function renderSearchSuggestions() {
    const tabList = document.getElementById('tab-list');
    tabList.classList.add('two-columns');
    document.body.classList.add('two-column-mode');
    // Don't remove 'loaded' class here - it causes flashing on every keystroke
    
    const currentQuery = document.getElementById('search-box').value.trim();
    const query = currentQuery.toLowerCase();
    const hasMatchingTabs = allTabs.some(tab => 
        tab.title.toLowerCase().includes(query) || tab.url.toLowerCase().includes(query)
    ) || recentlyClosed.some(tab => 
        tab.title.toLowerCase().includes(query) || tab.url.toLowerCase().includes(query)
    );
    
    // Render instant answer if available
    renderInstantAnswer();
    
    const fragment = document.createDocumentFragment();
    
    // Only show suggestions section if we have suggestions or no instant answer
    if (searchSuggestions.length > 0 || !instantAnswer) {
        const header = document.createElement('div');
        header.className = 'section-header';
        // Only show the key hint if force search key is not disabled
        const showForceSearchHint = hasMatchingTabs && !forceSearchKeyDisabled && forceSearchKey;
        header.textContent = showForceSearchHint ? `Search Suggestions (Press ${forceSearchKey.display} to return to tabs)` : 'Search Suggestions';
        fragment.appendChild(header);
        
        searchSuggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'tab-item suggestion-item';
            item.dataset.index = index;
            item.dataset.globalIndex = index;
            item.dataset.type = 'suggestion';
            item.dataset.query = suggestion;
            
            const shortcutKey = index < SHORTCUT_KEYS.length ? SHORTCUT_KEYS[index] : '';
            const isTargetModifierSelected = targetModifierHeldForSuggestion && suggestionSelectedIndex === index;
            if (isTargetModifierSelected) item.classList.add('suggestion-selected');
            
            item.innerHTML = `
                ${shortcutKey ? `<div class="tab-shortcut">${shortcutKey}</div>` : ''}
                <div class="suggestion-icon">🔍</div>
                <div class="tab-info">
                    <div class="tab-title">${escapeHtml(suggestion)}</div>
                    <div class="tab-url">Search suggestion${suggestionSelectedEngine && isTargetModifierSelected ? ` → ${getSearchEngines()[suggestionSelectedEngine].name}` : ''}</div>
                </div>
            `;
            fragment.appendChild(item);
        });
    }
    
    tabList.innerHTML = '';
    tabList.appendChild(fragment);
    
    // Ensure loaded class is present (don't toggle it)
    requestAnimationFrame(() => {
        tabList.classList.add('loaded');
        if (targetModifierHeldForSuggestion && suggestionSelectedIndex >= 0) {
            selectTab(suggestionSelectedIndex);
        } else {
            selectedIndex = -1;
            document.querySelectorAll('.tab-item').forEach(item => item.classList.remove('selected'));
        }
    });
    
    setupEventDelegation();
}

// Render pinned websites
function renderPinnedWebsites() {
    const pinnedContainer = document.getElementById('pinned-websites');
    
    if (pinnedWebsites.length === 0) {
        pinnedContainer.classList.remove('has-pins');
        pinnedContainer.innerHTML = '';
        return;
    }
    
    pinnedContainer.classList.add('has-pins');
    const fragment = document.createDocumentFragment();
    const container = document.createElement('div');
    container.className = 'pinned-container';
    
    pinnedWebsites.slice(0, 9).forEach((pin, index) => {
        const item = document.createElement('div');
        item.className = 'pinned-item';
        item.dataset.url = pin.url;
        item.dataset.index = index;
        
        let domainLetter = '?';
        try {
            const url = new URL(pin.url);
            domainLetter = url.hostname.replace(/^www\./, '').charAt(0).toUpperCase();
        } catch (e) {
            domainLetter = pin.url.charAt(0).toUpperCase();
        }
        
        const fallbackIcon = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect width='16' height='16' fill='%234285f4'/><text x='50%25' y='50%25' font-size='10' font-family='Arial' text-anchor='middle' dominant-baseline='central' fill='white'>${domainLetter}</text></svg>`;
        
        item.innerHTML = `
            <img class="pinned-favicon" src="${pin.favicon || fallbackIcon}" onerror="this.src='${fallbackIcon}'" title="${escapeHtml(pin.title)}">
            <div class="pinned-number">${index + 1}</div>
            <div class="pinned-remove">×</div>
        `;
        container.appendChild(item);
    });
    
    fragment.appendChild(container);
    pinnedContainer.innerHTML = '';
    pinnedContainer.appendChild(fragment);
    setupPinnedEventListeners();
}

// Event listeners
function setupPinnedEventListeners() {
    const pinnedContainer = document.querySelector('.pinned-container');
    if (!pinnedContainer) return;
    
    pinnedContainer.addEventListener('click', (e) => {
        const pinnedItem = e.target.closest('.pinned-item');
        if (!pinnedItem) return;
        
        if (e.target.closest('.pinned-remove')) {
            e.stopPropagation();
            unpinWebsite(pinnedItem.dataset.url);
            return;
        }
        
        chrome.tabs.create({ url: pinnedItem.dataset.url });
        window.close();
    });
}

async function pinWebsite(url, title, favicon) {
    if (pinnedWebsites.length >= 9 || pinnedWebsites.some(p => p.url === url)) return;
    pinnedWebsites.push({ url, title, favicon });
    await chrome.storage.sync.set({ pinnedWebsites });
    renderPinnedWebsites();
    // Update star buttons in-place without re-rendering
    document.querySelectorAll('.star-btn').forEach(btn => {
        if (btn.dataset.tabUrl === url) btn.classList.add('pinned');
    });
    searchBox.focus();
}

async function unpinWebsite(url) {
    pinnedWebsites = pinnedWebsites.filter(p => p.url !== url);
    await chrome.storage.sync.set({ pinnedWebsites });
    renderPinnedWebsites();
    // Update star buttons in-place without re-rendering
    document.querySelectorAll('.star-btn').forEach(btn => {
        if (btn.dataset.tabUrl === url) btn.classList.remove('pinned');
    });
    searchBox.focus();
}

async function addHotPage(url, title) {
    if (hotPages.some(p => p.url === url)) return;
    hotPages.push({ url, title });
    await chrome.storage.sync.set({ hotPages: hotPages.filter(p => !p.fromTopSites) });
    // Update hot buttons in-place without re-rendering
    document.querySelectorAll('.hot-btn').forEach(btn => {
        if (btn.dataset.tabUrl === url) btn.classList.add('hot');
    });
    searchBox.focus();
}

async function removeHotPage(url) {
    hotPages = hotPages.filter(p => p.url !== url);
    await chrome.storage.sync.set({ hotPages: hotPages.filter(p => !p.fromTopSites) });
    // Update hot buttons in-place without re-rendering
    document.querySelectorAll('.hot-btn').forEach(btn => {
        if (btn.dataset.tabUrl === url) btn.classList.remove('hot');
    });
    searchBox.focus();
}


function getMatchingHotPage(query) {
    if (!query) return null;
    const q = query.toLowerCase();
    return hotPages.find(p => {
        try {
            const host = new URL(p.url).hostname.replace(/^www\./, '').toLowerCase();
            // Check all "tails" of the hostname starting from segment boundaries
            // For "mail.proton.me" this checks: "mail.proton.me", "proton.me"
            // But NOT "me" (the TLD alone)
            const parts = host.split('.');
            for (let i = 0; i < parts.length - 1; i++) { // -1 to exclude TLD-only match
                const tail = parts.slice(i).join('.');
                if (tail.startsWith(q)) return true;
            }
            return false;
        } catch { return false; }
    }) || null;
}

function setupEventDelegation() {
    const tabList = document.getElementById('tab-list');
    if (tabList._clickHandler) tabList.removeEventListener('click', tabList._clickHandler);
    if (tabList._contextHandler) tabList.removeEventListener('contextmenu', tabList._contextHandler);
    
    tabList._clickHandler = async (e) => {
        const item = e.target.closest('.tab-item');
        const closeBtn = e.target.closest('.close-btn');
        const starBtn = e.target.closest('.star-btn');
        const hotBtn = e.target.closest('.hot-btn');
        
        if (hotBtn && item) {
            e.stopPropagation();
            hotBtn.classList.contains('hot') 
                ? removeHotPage(hotBtn.dataset.tabUrl)
                : addHotPage(hotBtn.dataset.tabUrl, hotBtn.dataset.tabTitle, hotBtn.dataset.favicon);
        } else if (starBtn && item) {
            e.stopPropagation();
            starBtn.classList.contains('pinned') 
                ? unpinWebsite(starBtn.dataset.tabUrl)
                : pinWebsite(starBtn.dataset.tabUrl, starBtn.dataset.tabTitle, starBtn.dataset.favicon);
        } else if (closeBtn && item) {
            e.stopPropagation();
            closeTab(parseInt(closeBtn.dataset.tabId));
        } else if (item) {
            if (item.dataset.type === 'open') {
                switchToTab(parseInt(item.dataset.tabId));
            } else if (item.dataset.type === 'closed') {
                restoreTab(parseInt(item.dataset.closedIndex));
            } else if (item.dataset.type === 'suggestion') {
                await saveSearchHistory(item.dataset.query);
                chrome.tabs.create({ url: buildSearchUrl(item.dataset.query) });
                window.close();
            } else if (item.dataset.type === 'hotpage') {
                chrome.tabs.create({ url: item.dataset.url });
                window.close();
            }
        }
    };
    
    // Right-click to close tabs
    tabList._contextHandler = (e) => {
        const item = e.target.closest('.tab-item');
        if (item && item.dataset.type === 'open') {
            e.preventDefault();
            closeTab(parseInt(item.dataset.tabId));
        }
    };
    
    tabList.addEventListener('click', tabList._clickHandler);
    tabList.addEventListener('contextmenu', tabList._contextHandler);
}

function selectTab(index) {
    const items = document.querySelectorAll('.tab-item');
    if (index < 0) { selectedIndex = -1; items.forEach(i => i.classList.remove('selected')); return; }
    selectedIndex = Math.max(0, Math.min(index, items.length - 1));
    items.forEach((item, i) => item.classList.toggle('selected', i === selectedIndex));
    items[selectedIndex]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

async function switchToTab(tabId) {
    await chrome.tabs.update(tabId, { active: true });
    await chrome.windows.update((await chrome.tabs.get(tabId)).windowId, { focused: true });
    window.close();
}

async function closeTab(tabId) {
    await chrome.tabs.remove(tabId);
    allTabs = allTabs.filter(t => t.id !== tabId);
    filteredTabs = filteredTabs.filter(t => t.id !== tabId);
    // Remove the tab item from DOM without re-rendering
    const tabItem = document.querySelector(`.tab-item[data-tab-id="${tabId}"]`);
    if (tabItem) {
        tabItem.remove();
        // Re-select to maintain proper selection after removal
        const items = document.querySelectorAll('.tab-item');
        if (items.length > 0) {
            selectedIndex = Math.min(selectedIndex, items.length - 1);
            selectTab(selectedIndex);
        } else {
            selectedIndex = -1;
        }
    }
    searchBox.focus();
}

async function restoreTab(idx) {
    const tab = recentlyClosed[idx];
    if (tab?.url) {
        await chrome.tabs.create({ url: tab.url, windowId: (await chrome.windows.getCurrent()).id, active: true });
        window.close();
    }
}

// Search functionality
const searchBox = document.getElementById('search-box');
let searchTimeout;

searchBox.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    targetModifierHeldForSuggestion = false;
    suggestionSelectedIndex = -1;
    suggestionSelectedEngine = null;
    
    if (searchTimeout) cancelAnimationFrame(searchTimeout);
    
    searchTimeout = requestAnimationFrame(async () => {
        // Check for matching hot page
        matchedHotPage = getMatchingHotPage(e.target.value.trim());
        
        if (!query) {
            // Reset force search mode when query is cleared
            forceSearchMode = false;
            instantAnswer = null;
            matchedHotPage = null;
            searchHistoryIndex = -1; // Reset search history cycling
            renderInstantAnswer();
            
            if (onlySearchClosedWhenJumped && recentlyClosedMode) {
                filteredTabs = [];
                filteredClosed = recentlyClosed;
            } else if (onlySearchClosedWhenJumped && !recentlyClosedMode) {
                filteredTabs = allTabs;
                filteredClosed = [];
            } else {
                filteredTabs = allTabs;
                filteredClosed = recentlyClosed;
            }
            
            searchSuggestions = [];
            if (suggestionsFetchAbortController) suggestionsFetchAbortController.abort();
            if (suggestionsDebounceTimer) clearTimeout(suggestionsDebounceTimer);
        } else {
            // Check if this is a quote-prefixed command (should hide tabs/suggestions)
            const isQuoteCommand = isQuotePrefixedCommand(e.target.value.trim());
            
            if (isQuoteCommand) {
                // Hide all tabs for quote-prefixed commands
                filteredTabs = [];
                filteredClosed = [];
                searchSuggestions = [];
                if (suggestionsFetchAbortController) suggestionsFetchAbortController.abort();
                if (suggestionsDebounceTimer) clearTimeout(suggestionsDebounceTimer);
            } else {
                const filter = tab => tab.title.toLowerCase().includes(query) || tab.url.toLowerCase().includes(query);
                
                if (onlySearchClosedWhenJumped && recentlyClosedMode) {
                    filteredTabs = [];
                    filteredClosed = recentlyClosed.filter(filter);
                } else if (onlySearchClosedWhenJumped && !recentlyClosedMode) {
                    filteredTabs = allTabs.filter(filter);
                    filteredClosed = [];
                } else {
                    filteredTabs = allTabs.filter(filter);
                    filteredClosed = recentlyClosed.filter(filter);
                }
                
                fetchSearchSuggestions(e.target.value.trim());
            }
            
            // Process instant answer (math or currency)
            await processInstantAnswer(e.target.value.trim());
            renderInstantAnswer();
        }
        
        // Render hot page autocomplete indicator
        renderHotPageAutocomplete();
        
        // Update recently closed icon visibility
        updateRecentlyClosedIcon();
        
        const previousSelectedIndex = selectedIndex;
        renderTabs();
        
        const combinedTabs = [...filteredTabs, ...filteredClosed];
        const currentlyShowingSuggestions = ((combinedTabs.length === 0) || forceSearchMode) && query;
        
        if (currentlyShowingSuggestions) {
            selectedIndex = -1;
            document.querySelectorAll('.tab-item').forEach(item => item.classList.remove('selected'));
        } else if (!query || previousSelectedIndex < 0 || previousSelectedIndex >= combinedTabs.length) {
            selectTab(0);
        } else if (combinedTabs.length > 0) {
            selectTab(Math.min(previousSelectedIndex, combinedTabs.length - 1));
        }
    });
});

function renderHotPageAutocomplete() {
    document.getElementById('hot-page-indicator')?.remove();
    const searchBox = document.getElementById('search-box');
    searchBox.style.textIndent = '0px'; // Reset indent
    
    if (!matchedHotPage) return;
    try {
        const host = new URL(matchedHotPage.url).hostname.replace(/^www\./, '');
        const q = searchBox.value;
        const qLower = q.toLowerCase();
        const hostLower = host.toLowerCase();
        
        // Find where the query matches in the host
        let prefix = '';
        let suffix = '';
        
        // Check all tails to find the match position (excluding TLD-only)
        const parts = hostLower.split('.');
        for (let i = 0; i < parts.length - 1; i++) { // -1 to exclude TLD-only match
            const tail = parts.slice(i).join('.');
            if (tail.startsWith(qLower)) {
                // Found the match - calculate prefix and suffix using original case
                const originalParts = host.split('.');
                prefix = i > 0 ? originalParts.slice(0, i).join('.') + '.' : '';
                const tailOriginal = originalParts.slice(i).join('.');
                suffix = tailOriginal.substring(q.length);
                break;
            }
        }
        
        // Calculate prefix width using canvas for accurate measurement
        if (prefix) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const computedStyle = window.getComputedStyle(searchBox);
            ctx.font = computedStyle.font || '16px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
            const prefixWidth = ctx.measureText(prefix).width;
            searchBox.style.textIndent = prefixWidth + 'px';
        }
        
        const indicator = document.createElement('div');
        indicator.id = 'hot-page-indicator';
        indicator.innerHTML = `<span class="hot-indicator-prefix">${escapeHtml(prefix)}</span><span class="hot-indicator-typed">${escapeHtml(q)}</span><span class="hot-indicator-suffix">${escapeHtml(suffix)}</span>
            <span class="hot-indicator-badge">🔥 <kbd class="hot-indicator-kbd">${engineModifierKey.display}</kbd></span>`;
        searchBox.parentElement.appendChild(indicator);
    } catch {}
}

// Block zoom
document.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.preventDefault();
        e.stopImmediatePropagation();
    }
}, { passive: false, capture: true });

// Keyboard handlers
searchBox.addEventListener('keydown', async (e) => {
    // Recently closed key
    if (recentlyClosedKey && !recentlyClosedKeyDisabled && modifierMatches(recentlyClosedKey, e)) {
        e.preventDefault();
        e.stopPropagation();
        
        // Toggle between open tabs and recently closed
        recentlyClosedMode = !recentlyClosedMode;
        const query = searchBox.value.trim().toLowerCase();
        const filter = tab => !query || tab.title.toLowerCase().includes(query) || tab.url.toLowerCase().includes(query);
        
        if (onlySearchClosedWhenJumped) {
            if (recentlyClosedMode) {
                // If no recently closed tabs, don't switch modes
                const matchingClosed = recentlyClosed.filter(filter);
                if (matchingClosed.length === 0) {
                    recentlyClosedMode = false;
                    return;
                }
                filteredTabs = [];
                filteredClosed = matchingClosed;
            } else {
                filteredTabs = allTabs.filter(filter);
                filteredClosed = [];
            }
            renderTabs();
        } else {
            // When not in onlySearchClosedWhenJumped mode, just scroll to the section
            if (recentlyClosedMode) {
                // If no recently closed tabs, don't switch modes
                if (filteredClosed.length === 0) {
                    recentlyClosedMode = false;
                    return;
                }
            }
        }
        
        if (recentlyClosedMode) {
            const firstClosedTab = document.querySelector('.closed-tab');
            if (firstClosedTab) {
                selectTab(parseInt(firstClosedTab.dataset.globalIndex));
                document.querySelector('.section-header:last-of-type')?.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            selectTab(0);
            document.querySelector('.tab-list')?.scrollTo(0, 0);
        }
        return;
    }
    
    // Force search key - toggle between tabs and suggestions
    if (forceSearchKey && !forceSearchKeyDisabled && modifierMatches(forceSearchKey, e)) {
        const query = searchBox.value.trim();
        if (!query) return; // Do nothing if no search query
        
        // If trying to go back to tabs but there are none, do nothing
        const combinedTabs = [...filteredTabs, ...filteredClosed];
        if (forceSearchMode && combinedTabs.length === 0) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        forceSearchMode = !forceSearchMode;
        renderTabs(); // Will show suggestions if forceSearchMode is true
        
        // Reset selection for suggestions, select first tab when returning to tabs
        if (forceSearchMode) {
            selectedIndex = -1;
            document.querySelectorAll('.tab-item').forEach(item => item.classList.remove('selected'));
        } else {
            selectTab(0);
        }
        
        return;
    }
    
    // Engine modifier
    if (modifierMatches(engineModifierKey, e) && !engineModifierHeld && !e.repeat) {
        engineModifierHeld = true;
        otherKeyPressedWithEngineModifier = false;
        e.preventDefault();
        return;
    }
    
    if (engineModifierHeld && !modifierMatches(engineModifierKey, e)) {
        otherKeyPressedWithEngineModifier = true;
        const engines = getSearchEngines();
        
        const matchedEntry = Object.entries(engines).find(([id, eng]) => {
            if (eng.shortcut.code !== e.code) return false;
            const mods = eng.shortcut.modifiers || {};
            return (mods.shift === true) === e.shiftKey && (mods.ctrl === true) === e.ctrlKey &&
                   (mods.alt === true) === e.altKey && (mods.meta === true) === e.metaKey;
        });
        
        if (matchedEntry) {
            e.preventDefault();
            const query = searchBox.value.trim();
            if (query) {
                let url = matchedEntry[1].url + encodeURIComponent(query);
                if (matchedEntry[1].urlSuffix) url += matchedEntry[1].urlSuffix;
                chrome.tabs.create({ url });
                window.close();
            }
        }
        return;
    }
    
    // Close modifier
    // Don't activate close modifier tracking if target is already held (it's a combo)
    if (modifierMatches(closeModifierKey, e) && !modifierHeld && !e.repeat && !targetModifierHeld) {
        modifierHeld = true;
        otherKeyPressedWithModifier = false;
        e.preventDefault();
        return;
    }
    
    if (modifierHeld && !modifierMatches(closeModifierKey, e)) {
        otherKeyPressedWithModifier = true;
        
        // Check for close + engine modifier + letter for hot page direct navigation
        if (engineModifierHeld) {
            const letter = e.key.toLowerCase();
            if (/^[a-z]$/.test(letter)) {
                e.preventDefault();
                // Find hot page starting with this letter
                const hotPage = hotPages.find(p => {
                    try {
                        const url = new URL(p.url);
                        const hostname = url.hostname.replace(/^www\./, '');
                        const domainName = hostname.split('.')[0];
                        return domainName.toLowerCase().startsWith(letter);
                    } catch (e) {
                        return false;
                    }
                });
                if (hotPage) {
                    chrome.tabs.create({ url: hotPage.url });
                    window.close();
                }
                return;
            }
        }
        
        const keyIndex = SHORTCUT_KEYS.indexOf(e.key.toUpperCase());
        
        if (keyIndex !== -1) {
            e.preventDefault();
            const targetItem = Array.from(document.querySelectorAll('.tab-item'))
                .find(item => parseInt(item.dataset.globalIndex) === keyIndex);
            if (targetItem?.dataset.type === 'open') {
                closeTab(parseInt(targetItem.dataset.tabId));
            }
            return;
        }
    }
    

    if (webSearchKey && modifierMatches(webSearchKey, e)) {
        e.preventDefault();
        const input = searchBox.value.trim();

            if (!otherKeyPressedWithEngineModifier && matchedHotPage && prioritizeHotPage) { 
        chrome.tabs.create({ url: matchedHotPage.url });
        window.close();
    }

        
        if (input) {
            await saveSearchHistory(input);
            // Always do web search, never switch to tab
            const url = isUrlOrDomain(input) 
                ? (input.match(/^https?:\/\//) ? input : `https://${input}`)
                : buildSearchUrl(input);
            chrome.tabs.create({ url });
            window.close();
        }
        return;
    }
    
    // Target modifier
    const hasSuggestions = Array.from(document.querySelectorAll('.tab-item')).some(item => item.dataset.type === 'suggestion');
    
    if (modifierMatches(targetModifierKey, e) && hasSuggestions && !e.repeat) {
        targetModifierHeldForSuggestion = true;
        targetModifierOnlyPressed = true;
        suggestionSelectedIndex = -1;
        suggestionSelectedEngine = null;
        e.preventDefault();
        return;
    }
    
    if (modifierMatches(targetModifierKey, e) && !targetModifierHeldForSuggestion && !targetModifierHeld && !e.repeat) {
        targetModifierHeld = true;
        otherKeyPressedWithTargetModifier = false;
        e.preventDefault();
        return;
    }
    
    if (targetModifierHeld && !modifierMatches(targetModifierKey, e)) {
        otherKeyPressedWithTargetModifier = true;
        
        // Target + Close = close highlighted tab
        if (closeModifierKey && (e.code === closeModifierKey.code || e.key === closeModifierKey.key)) {
            e.preventDefault();
            closePressedInCombo = true; // Mark that close was used in a combo
            const allItems = document.querySelectorAll('.tab-item');
            const selectedItem = selectedIndex >= 0 ? allItems[selectedIndex] : null;
            if (selectedItem?.dataset.type === 'open') {
                closeTab(parseInt(selectedItem.dataset.tabId));
            }
            return;
        }
        
        // Pinned websites (1-9)
        if (e.key >= '1' && e.key <= '9') {
            const pinnedIndex = parseInt(e.key) - 1;
            if (pinnedIndex < pinnedWebsites.length) {
                e.preventDefault();
                chrome.tabs.create({ url: pinnedWebsites[pinnedIndex].url });
                window.close();
                return;
            }
        }
        
        const keyIndex = SHORTCUT_KEYS.indexOf(e.key.toUpperCase());
        if (keyIndex !== -1) {
            e.preventDefault();
            const targetItem = Array.from(document.querySelectorAll('.tab-item'))
                .find(item => parseInt(item.dataset.globalIndex) === keyIndex);
            
            if (targetItem) {
                if (targetItem.dataset.type === 'open') {
                    switchToTab(parseInt(targetItem.dataset.tabId));
                } else if (targetItem.dataset.type === 'closed') {
                    restoreTab(parseInt(targetItem.dataset.closedIndex));
                } else if (targetItem.dataset.type === 'suggestion') {
                    await saveSearchHistory(targetItem.dataset.query);
                    chrome.tabs.create({ url: buildSearchUrl(targetItem.dataset.query) });
                    window.close();
                }
            }
        }
        return;
    }
    
    // Switch modifier for suggestions with engine selection
    if (targetModifierHeldForSuggestion && !modifierMatches(targetModifierKey, e)) {
        targetModifierOnlyPressed = false;
        
        // Find matching engine considering shift modifier
        const engines = getSearchEngines();
        let matchedEngineId = null;
        
        Object.entries(engines).forEach(([id, engine]) => {
            if (engine.shortcut.code === e.code) {
                const requiresShift = engine.shortcut.modifiers?.shift === true;
                const shiftPressed = e.shiftKey;
                const ctlrPressed = e.ctrltKey;
                
                if (requiresShift === shiftPressed) {
                    matchedEngineId = id;
                }
            }
        });
        
        const shortcutKeys = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyQ', 'KeyW', 'KeyE', 'KeyR'];
        const shortcutIndex = shortcutKeys.indexOf(e.code);
        
        if (suggestionSelectedIndex !== -1 && matchedEngineId) {
            suggestionSelectedEngine = matchedEngineId;
            e.preventDefault();
            renderSearchSuggestions();
            return;
        } else if (shortcutIndex !== -1) {
            suggestionSelectedIndex = shortcutIndex;
            suggestionSelectedEngine = null;
            e.preventDefault();
            renderSearchSuggestions();
            return;
        } else if (suggestionSelectedIndex === -1 && matchedEngineId) {
            suggestionSelectedIndex = 0;
            suggestionSelectedEngine = matchedEngineId;
            e.preventDefault();
            renderSearchSuggestions();
            return;
        }
    }
    
    // Arrow navigation (two-column aware)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const allItems = document.querySelectorAll('.tab-item');
        if (allItems.length === 0) return;
        
        const totalItems = allItems.length;
        const columns = 2;
        const rows = Math.ceil(totalItems / columns);
        
        let newIndex;
        
        if (selectedIndex === -1) {
            // No selection yet
            newIndex = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 0 : totalItems - 1;
        } else {
            const currentRow = Math.floor(selectedIndex / columns);
            const currentCol = selectedIndex % columns;
            
            if (e.key === 'ArrowDown') {
                // Move down one row, same column
                const nextRow = currentRow + 1;
                if (nextRow < rows) {
                    newIndex = nextRow * columns + currentCol;
                    if (newIndex >= totalItems) newIndex = totalItems - 1;
                } else {
                    newIndex = selectedIndex; // Stay in place
                }
            } else if (e.key === 'ArrowUp') {
                // Move up one row, same column
                const prevRow = currentRow - 1;
                if (prevRow >= 0) {
                    newIndex = prevRow * columns + currentCol;
                } else {
                    newIndex = selectedIndex; // Stay in place
                }
            } else if (e.key === 'ArrowRight') {
                // Move to right column or next row first column
                if (currentCol < columns - 1 && selectedIndex + 1 < totalItems) {
                    newIndex = selectedIndex + 1;
                } else {
                    newIndex = selectedIndex; // Stay in place
                }
            } else if (e.key === 'ArrowLeft') {
                // Move to left column or prev row last column
                if (currentCol > 0) {
                    newIndex = selectedIndex - 1;
                } else {
                    newIndex = selectedIndex; // Stay in place
                }
            }
        }
        
        selectTab(newIndex);
    }
});

// Key release handlers
searchBox.addEventListener('keyup', async (e) => {
    // Close modifier release
    if (modifierMatches(closeModifierKey, e, true) && modifierHeld) {
        e.preventDefault();
        const wasOtherKeyPressed = otherKeyPressedWithModifier;
        const isSpaceKey = closeModifierKey.code === 'Space';
        const wasUsedInCombo = closePressedInCombo;
        
        // Reset flags immediately
        modifierHeld = false;
        otherKeyPressedWithModifier = false;
        closePressedInCombo = false;
        
        // Skip all close key actions if it was used as part of switch+close combo
        if (wasUsedInCombo) {
            return;
        }
        
        if (isSpaceKey && !wasOtherKeyPressed) {
            const pos = searchBox.selectionStart;
            searchBox.value = searchBox.value.substring(0, pos) + ' ' + searchBox.value.substring(pos);
            searchBox.selectionStart = searchBox.selectionEnd = pos + 1;
            searchBox.dispatchEvent(new Event('input'));
        } else if (!wasOtherKeyPressed && searchHistory.length > 0) {
            // Cycle through search history (disabled in 3 button mode since Close is used for combos)
            const settings = await chrome.storage.sync.get({ enableSearchHistory: true });
            if (settings.enableSearchHistory) {
                searchHistoryIndex = (searchHistoryIndex + 1) % searchHistory.length;
                searchBox.value = searchHistory[searchHistoryIndex];
                searchBox.dispatchEvent(new Event('input'));
            }
        }
        return;
    }
    
    // Target modifier release
    if (
    modifierMatches(targetModifierKey, e, true) &&
    (
        targetModifierHeld ||
        (targetModifierHeldForSuggestion && suggestionSelectedIndex === -1)
    )
) {
        
        // Switch to highlighted tab when target key is released alone
        if (!otherKeyPressedWithTargetModifier) {
            const allItems = document.querySelectorAll('.tab-item');
            const selectedItem = selectedIndex >= 0 ? allItems[selectedIndex] : null;
            
            if (selectedItem?.dataset.type === 'open') {
                switchToTab(parseInt(selectedItem.dataset.tabId));
            } else if (selectedItem?.dataset.type === 'closed') {
                restoreTab(parseInt(selectedItem.dataset.closedIndex));
            } else if (selectedItem?.dataset.type === 'suggestion') {
                const query = selectedItem.dataset.query;
                saveSearchHistory(query);
                chrome.tabs.create({ url: buildSearchUrl(query) });
                window.close();
            } else {
                const input = searchBox.value.trim();
                if (input) {
                    saveSearchHistory(input);
                    const url = isUrlOrDomain(input) 
                        ? (input.match(/^https?:\/\//) ? input : `https://${input}`)
                        : buildSearchUrl(input);
                    chrome.tabs.create({ url });
                    window.close();
                }
            }
        } else if (targetModifierKey.code === 'Space' && !otherKeyPressedWithTargetModifier) {
            const pos = searchBox.selectionStart;
            searchBox.value = searchBox.value.substring(0, pos) + ' ' + searchBox.value.substring(pos);
            searchBox.selectionStart = searchBox.selectionEnd = pos + 1;
            searchBox.dispatchEvent(new Event('input'));
        }
        targetModifierHeld = false;
        otherKeyPressedWithTargetModifier = false;
    }
    
    // Engine modifier release
    if (modifierMatches(engineModifierKey, e, true) && engineModifierHeld) {
        e.preventDefault();
        
        // If there's a matching hot page and no other key was pressed, navigate to it
        if (!otherKeyPressedWithEngineModifier && matchedHotPage) {
            chrome.tabs.create({ url: matchedHotPage.url });
            window.close();
        } else if (!otherKeyPressedWithEngineModifier && engineModifierKey.key.length === 1) {
            const pos = searchBox.selectionStart;
            searchBox.value = searchBox.value.substring(0, pos) + engineModifierKey.key + searchBox.value.substring(pos);
            searchBox.selectionStart = searchBox.selectionEnd = pos + 1;
            searchBox.dispatchEvent(new Event('input'));
        }
        engineModifierHeld = false;
        otherKeyPressedWithEngineModifier = false;
    }
    
    // Switch modifier for suggestions release
    if (modifierMatches(targetModifierKey, e, true) && targetModifierHeldForSuggestion) {
        e.preventDefault();
        
        if (suggestionSelectedIndex >= 0) {
            const suggestionItems = Array.from(document.querySelectorAll('.tab-item'))
                .filter(item => item.dataset.type === 'suggestion');
            
            if (suggestionSelectedIndex < suggestionItems.length) {
                const query = suggestionItems[suggestionSelectedIndex].dataset.query;
                await saveSearchHistory(query);
                let url;
                
                if (suggestionSelectedEngine && getSearchEngines()[suggestionSelectedEngine]) {
                    const engine = getSearchEngines()[suggestionSelectedEngine];
                    url = engine.url + encodeURIComponent(query);
                    
                    // Add URL suffix if defined
                    if (engine.urlSuffix) {
                        url += engine.urlSuffix;
                    }
                } else {
                    url = buildSearchUrl(query);
                }
                
                chrome.tabs.create({ url });
                window.close();
            }
        } else if (targetModifierOnlyPressed && targetModifierKey.code === 'Space') {
            const pos = searchBox.selectionStart;
            searchBox.value = searchBox.value.substring(0, pos) + ' ' + searchBox.value.substring(pos);
            searchBox.selectionStart = searchBox.selectionEnd = pos + 1;
            searchBox.dispatchEvent(new Event('input'));
        }
        
        targetModifierHeldForSuggestion = false;
        targetModifierOnlyPressed = false;
        suggestionSelectedIndex = -1;
        suggestionSelectedEngine = null;
        
    }
});

// Initialize
//setZoom();
initialize();

// Settings dropdown
const settingsIcon = document.getElementById('settings-icon');
const settingsDropdown = document.getElementById('settings-dropdown');
const mainSettingsOption = document.getElementById('option-main-settings');

settingsIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    const visible = settingsDropdown.classList.toggle('visible');
    mainSettingsOption.classList.toggle('pre-selected', visible);
});

settingsIcon.addEventListener('contextmenu', (e) => { e.preventDefault(); chrome.runtime.openOptionsPage(); window.close(); });
addEventListener('contextmenu', (e) => e.preventDefault());
document.querySelectorAll('.settings-option').forEach(opt => opt.addEventListener('mouseenter', () => mainSettingsOption.classList.remove('pre-selected')));
document.addEventListener('click', (e) => {
    if (!settingsDropdown.contains(e.target) && e.target !== settingsIcon) {
        settingsDropdown.classList.remove('visible');
        mainSettingsOption.classList.remove('pre-selected');
    }
});

document.getElementById('option-main-settings').addEventListener('click', () => { chrome.runtime.openOptionsPage(); window.close(); });
document.getElementById('option-shortcuts').addEventListener('click', () => { chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }); window.close(); });
document.getElementById('option-details').addEventListener('click', () => { chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` }); window.close(); });

document.getElementById('recently-closed-icon').addEventListener('click', () => {
    if (onlySearchClosedWhenJumped) {
        recentlyClosedMode = true;
        const query = document.getElementById('search-box').value.trim().toLowerCase();
        filteredTabs = [];
        filteredClosed = query ? recentlyClosed.filter(t => t.title.toLowerCase().includes(query) || t.url.toLowerCase().includes(query)) : recentlyClosed;
        renderTabs();
        selectTab(0);
    }
});

// Clock
let clockInterval = null, showClock = true, clockSettingLoaded = false;
function updateClock() {
    const container = document.getElementById('clock-container');
    const el = document.getElementById('clock-display');
    if (!el || !container) return;
    // Only hide after setting is loaded and it's false
    if (clockSettingLoaded) {
        container.classList.toggle('hidden', !showClock);
    }
    const now = new Date();
    el.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    el.classList.add('visible');
}
// Start clock immediately (container visible by default with current time)
updateClock();
clockInterval = setInterval(updateClock, 1000);

function updateRecentlyClosedIcon() {
    const icon = document.getElementById('recently-closed-icon');
    if (!icon) return;
    const query = document.getElementById('search-box').value.trim().toLowerCase();
    const matches = t => t.title.toLowerCase().includes(query) || t.url.toLowerCase().includes(query);
    if (onlySearchClosedWhenJumped && !recentlyClosedMode && recentlyClosed.some(matches) && (query.length > 0 || recentlyClosed.length > 0)) {
        icon.classList.remove('hidden');
        const count = query ? recentlyClosed.filter(matches).length : recentlyClosed.length;
        icon.title = `Jump to recently closed tabs (${count} match${count !== 1 ? 'es' : ''})`;
    } else {
        icon.classList.add('hidden');
    }
}

window.addEventListener('blur', () => setTimeout(() => { if (!document.hasFocus()) window.close(); }, 100));