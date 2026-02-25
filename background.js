// Background service worker

let switcherWindowId = null;

// Instant jump state - track last jumped tab for each letter
let lastJumpedTab = {}; // { 'y': tabId, 'g': tabId, ... }
let engineModifierKey = { display: 'F21', code: 'F21', key: 'F21', modifiers: {} };
let engineModifierHeld = false; // Global state tracked in background

// ============================================
// PRELOADED CACHE FOR FAST POPUP LOADING
// ============================================
let cachedTabs = [];
let cachedSessions = [];
let cachedSettings = null;

// Preload all data
async function preloadData() {
    const [tabs, sessions, settings] = await Promise.all([
        chrome.tabs.query({ windowType: 'normal' }),
        chrome.sessions.getRecentlyClosed({ maxResults: 25 }),
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
            showClock: true, animations: true, defaultSearchEngine: null, enableInstantJump: true
        })
    ]);
    cachedTabs = tabs;
    cachedSessions = sessions;
    cachedSettings = settings;
    
    // If no hotPages in storage, load from hotpages.json
    if (!settings.hotPages || settings.hotPages.length === 0) {
        try {
            const response = await fetch(chrome.runtime.getURL('hotpages.json'));
            if (response.ok) {
                const data = await response.json();
                if (data?.hotPages?.length > 0) {
                    cachedSettings.hotPages = data.hotPages;
                    // Save to storage for future
                    chrome.storage.sync.set({ hotPages: data.hotPages });
                }
            }
        } catch (e) {}
    }
}

// Initial preload
preloadData();

// Update cache on tab changes
chrome.tabs.onCreated.addListener(() => {
    chrome.tabs.query({ windowType: 'normal' }).then(tabs => { cachedTabs = tabs; });
});
chrome.tabs.onRemoved.addListener(() => {
    chrome.tabs.query({ windowType: 'normal' }).then(tabs => { cachedTabs = tabs; });
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete' || changeInfo.title || changeInfo.url) {
        chrome.tabs.query({ windowType: 'normal' }).then(tabs => { cachedTabs = tabs; });
    }
});
chrome.tabs.onActivated.addListener(() => {
    chrome.tabs.query({ windowType: 'normal' }).then(tabs => { cachedTabs = tabs; });
});

// Update cache on session changes  
chrome.sessions.onChanged.addListener(() => {
    chrome.sessions.getRecentlyClosed({ maxResults: 25 }).then(sessions => { cachedSessions = sessions; });
});

// Update cache on settings changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        if (changes.engineModifierData) {
            engineModifierKey = changes.engineModifierData.newValue;
        }
        // Refresh settings cache
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
            showClock: true, animations: true, defaultSearchEngine: null, enableInstantJump: true
        }).then(settings => { cachedSettings = settings; });
    }
});

// Load engine modifier key from settings
async function loadEngineModifier() {
    const result = await chrome.storage.sync.get({ engineModifierData: null });
    if (result.engineModifierData) {
        engineModifierKey = result.engineModifierData;
    }
}

// Initialize engine modifier on startup
loadEngineModifier();

// Check if modifier key matches
function isModifierKey(keyConfig, event) {
    if (!keyConfig) return false;
    return (event.code === keyConfig.code) || (event.key === keyConfig.key);
}

// Check if modifier is pressed (for modifier keys)
function modifierMatches(keyConfig, event) {
    if (!keyConfig) return false;
    
    const mods = keyConfig.modifiers || {};
    const ctrlMatch = !!mods.ctrl === !!event.ctrlKey;
    const altMatch = !!mods.alt === !!event.altKey;
    const shiftMatch = !!mods.shift === !!event.shiftKey;
    const metaMatch = !!mods.meta === !!event.metaKey;
    const keyMatch = (event.code === keyConfig.code) || (event.key === keyConfig.key);
    
    return ctrlMatch && altMatch && shiftMatch && metaMatch && keyMatch;
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);
    
    // Return cached data for fast popup loading
    if (request.action === 'getCachedData') {
        sendResponse({ 
            tabs: cachedTabs, 
            sessions: cachedSessions, 
            settings: cachedSettings 
        });
        return true;
    }
    
    if (request.action === 'getModifierState') {
        sendResponse({ held: engineModifierHeld });
        return;
    }
    
    if (request.action === 'keydown') {
        // Track engine modifier state globally
        if (modifierMatches(engineModifierKey, request.event)) {
            engineModifierHeld = true;
            console.log('Engine modifier pressed (global)');
            // Broadcast to all tabs
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, { action: 'modifierState', held: true }).catch(() => {});
                });
            });
        } else if (engineModifierHeld && request.event.code.startsWith('Key') && request.event.code.length === 4) {
            // Letter key pressed while modifier is held
            const letter = request.event.code.substring(3);
            const instantJumpEnabled = cachedSettings?.enableInstantJump !== false;
            console.log('Letter pressed while modifier held:', letter);
            if (instantJumpEnabled) handleInstantJump(letter);
        }
    } else if (request.action === 'keyup') {
        // Release engine modifier state globally
        if (modifierMatches(engineModifierKey, request.event)) {
            engineModifierHeld = false;
            console.log('Engine modifier released (global)');
            // Broadcast to all tabs
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, { action: 'modifierState', held: false }).catch(() => {});
                });
            });
        }
    }
});

// Handle instant jump to tabs by domain first letter
async function handleInstantJump(letter) {
    console.log('handleInstantJump called with letter:', letter);
    const letterLower = letter.toLowerCase();
    
    // Get all tabs
    const tabs = await chrome.tabs.query({ windowType: 'normal' });
    console.log('Total tabs found:', tabs.length);
    
    // Find tabs where domain starts with the letter
    const matchingTabs = tabs.filter(tab => {
        try {
            const url = new URL(tab.url);
            const domain = url.hostname.replace(/^www\./, '');
            const matches = domain.toLowerCase().startsWith(letterLower);
            if (matches) {
                console.log('Matching tab found:', domain, tab.title);
            }
            return matches;
        } catch (e) {
            return false;
        }
    }).sort((a, b) => {
        // Sort by domain name for consistent ordering
        try {
            const domainA = new URL(a.url).hostname.replace(/^www\./, '');
            const domainB = new URL(b.url).hostname.replace(/^www\./, '');
            return domainA.localeCompare(domainB);
        } catch (e) {
            return 0;
        }
    });
    
    console.log('Matching tabs after filter:', matchingTabs.length);
    
    if (matchingTabs.length === 0) {
        console.log('No matching tabs found for letter:', letter);
        return;
    }
    
    // Find next tab to jump to
    let targetTab;
    const lastTabId = lastJumpedTab[letterLower];
    
    if (lastTabId) {
        // Find current position and get next tab
        const currentIndex = matchingTabs.findIndex(tab => tab.id === lastTabId);
        console.log('Last jumped tab index:', currentIndex);
        if (currentIndex !== -1 && currentIndex < matchingTabs.length - 1) {
            // Jump to next matching tab
            targetTab = matchingTabs[currentIndex + 1];
        } else {
            // Cycle back to first tab
            targetTab = matchingTabs[0];
        }
    } else {
        // First time jumping to this letter, use first match
        targetTab = matchingTabs[0];
    }
    
    console.log('Jumping to tab:', targetTab.title, targetTab.url);
    
    // Pre-inject content script into target tab
    if (targetTab.url && !targetTab.url.startsWith('chrome://') && !targetTab.url.startsWith('edge://') && !targetTab.url.startsWith('chrome-extension://')) {
        await chrome.scripting.executeScript({
            target: { tabId: targetTab.id },
            files: ['instant-jump.js']
        }).catch(() => {});
    }
    
    // Switch to the target tab
    await chrome.tabs.update(targetTab.id, { active: true });
    await chrome.windows.update(targetTab.windowId, { focused: true });
    
    // Push modifier state to the new tab
    chrome.tabs.sendMessage(targetTab.id, { action: 'modifierState', held: engineModifierHeld }).catch(() => {});
    
    // Remember this tab for next cycle
    lastJumpedTab[letterLower] = targetTab.id;
    console.log('Instant jump complete!');
}

// Listen for keyboard shortcuts only
chrome.commands.onCommand.addListener(async (command) => {
    console.log('Command received:', command);
    if (command === 'toggle-switcher') {
        await toggleTabSwitcher();
    }
});

async function toggleTabSwitcher() {
    // Check if window already exists
    if (switcherWindowId !== null) {
        try {
            const existingWindow = await chrome.windows.get(switcherWindowId);
            if (existingWindow) {
                // Window exists, close it
                await chrome.windows.remove(switcherWindowId);
                switcherWindowId = null;
                return;
            }
        } catch (e) {
            // Window doesn't exist anymore
            switcherWindowId = null;
        }
    }
    
    // Get showInstructions setting to adjust height
    const settings = await chrome.storage.sync.get({ showInstructions: false });
    const instructionsHeight = settings.showInstructions ? 75 : 0;
    
    const height = 533 + instructionsHeight;
    const width = 812;
    
    // Get display info to center on screen
    const displayInfo = await chrome.system.display.getInfo();
    const primaryDisplay = displayInfo.find(d => d.isPrimary) || displayInfo[0];
    const screenWidth = primaryDisplay.workArea.width;
    const screenHeight = primaryDisplay.workArea.height;
    const screenLeft = primaryDisplay.workArea.left;
    const screenTop = primaryDisplay.workArea.top;
    
    const left = Math.round(screenLeft + (screenWidth - width) / 2);
    const top = Math.round(screenTop + (screenHeight - height) / 2);
    
    // Create new popup window
    const newWindow = await chrome.windows.create({
        url: 'popup.html',
        type: 'popup',
        width: width,
        height: height,
        left: left,
        top: top,
        focused: true
    });
    
    switcherWindowId = newWindow.id;
    
    // Clean up when window is closed
    chrome.windows.onRemoved.addListener((windowId) => {
        if (windowId === switcherWindowId) {
            switcherWindowId = null;
        }
    });
}

// Optional: Log when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    console.log('Custom Tab Switcher installed');
    injectIntoAllTabs();
});

chrome.runtime.onStartup.addListener(() => {
    console.log('Custom Tab Switcher started');
    injectIntoAllTabs();
});

// Inject content script into all existing tabs
async function injectIntoAllTabs() {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
        if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://') && !tab.url.startsWith('chrome-extension://')) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['instant-jump.js']
            }).catch(() => {});
        }
    }
}