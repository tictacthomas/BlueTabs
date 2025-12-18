// Popup script for tab switcher

// Constants
const CACHE_DURATION = 2000;
const SHORTCUT_KEYS = ['A', 'S', 'D', 'F', 'Z', 'X', 'C', 'V', 'Q', 'W', 'E', 'R'];
const DEFAULT_SETTINGS = {
    closeModifier: { display: 'Shift', code: 'ShiftLeft', key: 'Shift', modifiers: { shift: true } },
    switchModifier: { display: 'Space', code: 'Space', key: ' ', modifiers: {} },
    confirmKey: { display: 'Enter', code: 'Enter', key: 'Enter', modifiers: {} },
    recentlyClosedKey: { display: 'Tab', code: 'Tab', key: 'Tab', modifiers: {} },
    settingsKey: { display: 'Ctrl+Alt+S', code: 'KeyS', key: 's', modifiers: { ctrl: true, alt: true } }
};

// State
let allTabs = [];
let filteredTabs = [];
let recentlyClosed = [];
let filteredClosed = [];
let selectedIndex = 0;
let currentTabId = null;
let tabCache = null;
let cacheTimestamp = 0;
let modifierHeld = false;
let otherKeyPressedWithModifier = false;
let switchModifierHeld = false;
let otherKeyPressedWithSwitchModifier = false;
let closeModifierKey = null;
let switchModifierKey = null;
let confirmKey = null;
let recentlyClosedKey = null;
let settingsKey = null;
let pinnedWebsites = [];

// Initialize default keys immediately to prevent flash
closeModifierKey = DEFAULT_SETTINGS.closeModifier;
switchModifierKey = DEFAULT_SETTINGS.switchModifier;
confirmKey = DEFAULT_SETTINGS.confirmKey;
recentlyClosedKey = DEFAULT_SETTINGS.recentlyClosedKey;
settingsKey = DEFAULT_SETTINGS.settingsKey;

// Utility: Set zoom to 100%
async function setZoom() {
    try {
        await chrome.tabs.setZoom(1.0);
    } catch (e) {
        console.log('Zoom set failed:', e);
    }
    document.body.style.zoom = "1";
}

// Initialize zoom immediately
setZoom();

// Set initial instructions visibility immediately (prevents flash)
chrome.storage.sync.get({ showInstructions: true }, (result) => {
    const instructionsDiv = document.getElementById('instructions');
    instructionsDiv.style.display = result.showInstructions ? 'block' : 'none';
});

// Update instructions with default settings immediately (prevents flash)
updateInstructions();

// Utility: Check if modifier matches event
function modifierMatches(keyConfig, event, forRelease = false) {
    if (!keyConfig) return false;
    
    const mods = keyConfig.modifiers || {};
    const modCount = Object.keys(mods).length;
    
    // Handle single modifier keys (Ctrl, Alt, Shift alone) - only for release detection
    if (forRelease && modCount === 1) {
        if (mods.ctrl && !mods.alt && !mods.shift && !mods.meta) {
            return event.key === 'Control';
        }
        if (mods.alt && !mods.ctrl && !mods.shift && !mods.meta) {
            return event.key === 'Alt';
        }
        if (mods.shift && !mods.ctrl && !mods.alt && !mods.meta) {
            return event.key === 'Shift';
        }
    }
    
    // Handle Ctrl+Alt combination - only for release detection
    if (forRelease && mods.ctrl && mods.alt && !mods.shift && !mods.meta) {
        return (event.key === 'Control' || event.key === 'Alt');
    }
    
    // Handle other key combinations (regular matching)
    const ctrlMatch = !!mods.ctrl === !!event.ctrlKey;
    const altMatch = !!mods.alt === !!event.altKey;
    const shiftMatch = !!mods.shift === !!event.shiftKey;
    const metaMatch = !!mods.meta === !!event.metaKey;
    const keyMatch = (event.code === keyConfig.code) || (event.key === keyConfig.key);
    
    return ctrlMatch && altMatch && shiftMatch && metaMatch && keyMatch;
}

// Load settings
async function loadModifierSettings() {
    const result = await chrome.storage.sync.get({ 
        closeModifierData: null,
        switchModifierData: null,
        confirmKeyData: null,
        recentlyClosedKeyData: null,
        settingsKeyData: null,
        showInstructions: true,
        pinnedWebsites: []
    });
    
    closeModifierKey = result.closeModifierData || DEFAULT_SETTINGS.closeModifier;
    switchModifierKey = result.switchModifierData || DEFAULT_SETTINGS.switchModifier;
    confirmKey = result.confirmKeyData || DEFAULT_SETTINGS.confirmKey;
    recentlyClosedKey = result.recentlyClosedKeyData || DEFAULT_SETTINGS.recentlyClosedKey;
    settingsKey = result.settingsKeyData || DEFAULT_SETTINGS.settingsKey;
    pinnedWebsites = result.pinnedWebsites || [];
    
    console.log('Loaded settings:', { closeModifierKey, switchModifierKey, confirmKey, recentlyClosedKey, settingsKey });
    
    // Handle instructions visibility
    const instructionsDiv = document.getElementById('instructions');
    instructionsDiv.style.display = result.showInstructions ? 'block' : 'none';
    
    updateInstructions();
    renderPinnedWebsites();
}

// Update instructions dynamically
function updateInstructions() {
    const instructionsDiv = document.getElementById('instructions');
    
    const newContent = `
        <div style="display: flex; flex-wrap: wrap; justify-content: flex-start; gap: 4px 12px; line-height: 1.8;">
            <span><span class="shortcut-hint">${switchModifierKey.display}+Key</span> switch/restore</span>
            <span><span class="shortcut-hint">${closeModifierKey.display}+Key</span> close tab</span>
            <span><span class="shortcut-hint">${closeModifierKey.display}+${confirmKey.display}</span> close highlighted</span>
            <div style="width: 100%; height: 0;"></div>
            <span><span class="shortcut-hint">${confirmKey.display}</span> confirm</span>
            <span><span class="shortcut-hint">${recentlyClosedKey.display}</span> jump to closed</span>
            <span><span class="shortcut-hint">${settingsKey.display}</span> settings</span>
            <span><span class="shortcut-hint">↑↓</span> navigate</span>
        </div>
    `;
    
    // Only update if content changed to prevent flash
    if (instructionsDiv.innerHTML.trim() !== newContent.trim()) {
        instructionsDiv.innerHTML = newContent;
    }
}

// Show loading skeleton
function showLoadingSkeleton() {
    const tabList = document.getElementById('tab-list');
    
    // Fade out first
    tabList.classList.remove('loaded');
    
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < 8; i++) {
        const item = document.createElement('div');
        item.className = 'tab-item skeleton';
        item.innerHTML = `
            <div style="width: 16px; height: 16px; background: #e0e0e0; border-radius: 2px; margin-right: 10px;"></div>
            <div style="flex: 1;">
                <div style="height: 13px; background: #e0e0e0; border-radius: 2px; width: ${60 + Math.random() * 30}%; margin-bottom: 4px;"></div>
                <div style="height: 11px; background: #f0f0f0; border-radius: 2px; width: ${40 + Math.random() * 40}%;"></div>
            </div>
        `;
        fragment.appendChild(item);
    }
    
    tabList.innerHTML = '';
    tabList.appendChild(fragment);
    
    // Trigger fade-in animation
    requestAnimationFrame(() => {
        tabList.classList.add('loaded');
    });
}

// Initialize
async function initialize() {
    await setZoom();
    
    // Start loading settings and data in parallel
    const settingsPromise = loadModifierSettings();
    const tabsPromise = chrome.tabs.query({ windowType: 'normal' });
    const closedPromise = chrome.sessions.getRecentlyClosed({ maxResults: 25 });
    
    const now = Date.now();
    
    // Use cached data immediately if available for instant display
    if (tabCache && (now - cacheTimestamp) < CACHE_DURATION) {
        allTabs = tabCache;
        filteredTabs = tabCache;
        const activeTab = tabCache.find(tab => tab.active);
        currentTabId = activeTab ? activeTab.id : null;
        renderTabs();
        selectTab(0);
    } else {
        showLoadingSkeleton();
    }
    
    // Wait for all data to load in parallel
    const [tabs, sessions] = await Promise.all([tabsPromise, closedPromise, settingsPromise]);
    
    const activeTab = tabs.find(tab => tab.active);
    currentTabId = activeTab ? activeTab.id : null;
    
    allTabs = tabs;
    filteredTabs = tabs;
    tabCache = tabs;
    cacheTimestamp = now;
    
    recentlyClosed = sessions
        .filter(session => session.tab)
        .map(session => session.tab);
    filteredClosed = recentlyClosed;
    
    renderTabs();
    selectTab(0);
}

// Render tabs
function renderTabs() {
    const tabList = document.getElementById('tab-list');
    const combinedTabs = [...filteredTabs, ...filteredClosed];
    
    if (combinedTabs.length === 0) {
        const searchQuery = document.getElementById('search-box').value;
        tabList.innerHTML = 
        '<div class="no-tabs" style="font-size: 20px; font-weight: bold;">Make a web search for: ' + escapeHtml(searchQuery) + '</div>';
        tabList.classList.add('loaded');
        return;
    }

    
    
    
    // Fade out before updating
    tabList.classList.remove('loaded');
    
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    let globalIndex = 0;
    
    // Open tabs
    if (filteredTabs.length > 0) {
        const header = document.createElement('div');
        //header.className = 'section-header';
        //header.textContent = 'Open Tabs';
        fragment.appendChild(header);
        
        // Sort tabs: audio tabs first, then others
        const sortedFilteredTabs = [...filteredTabs].sort((a, b) => {
            if (a.audible && !b.audible) return -1;
            if (!a.audible && b.audible) return 1;
            return 0;
        });
        
        sortedFilteredTabs.forEach((tab, index) => {
            const isActive = tab.id === currentTabId;
            const shortcutKey = globalIndex < SHORTCUT_KEYS.length ? SHORTCUT_KEYS[globalIndex] : '';
            
            const item = document.createElement('div');
            item.className = `tab-item ${isActive ? 'active-tab' : ''}`;
            item.dataset.index = index;
            item.dataset.globalIndex = globalIndex;
            item.dataset.type = 'open';
            item.dataset.tabId = tab.id;
            
            const isPinned = pinnedWebsites.some(p => p.url === tab.url);
            
            // Properly escape attributes
            const escapedUrl = tab.url.replace(/"/g, '&quot;');
            const escapedTitle = (tab.title || 'Untitled').replace(/"/g, '&quot;');
            const escapedFavicon = (tab.favIconUrl || '').replace(/"/g, '&quot;');
            
            item.innerHTML = `
                ${shortcutKey ? `<div class="tab-shortcut">${shortcutKey}</div>` : ''}
                ${tab.audible ? '<div class="audio-icon">🔊</div>' : ''}
                <img class="tab-favicon" src="${tab.favIconUrl || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><text y=%2214%22 font-size=%2214%22>🌐</text></svg>'}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><text y=%2214%22 font-size=%2214%22>🌐</text></svg>'">
                <div class="tab-info">
                    <div class="tab-title">${escapeHtml(tab.title || 'Untitled')}</div>
                    <div class="tab-url">${escapeHtml(new URL(tab.url).hostname)}</div>
                </div>
                <div class="star-btn ${isPinned ? 'pinned' : ''}" data-tab-url="${escapedUrl}" data-tab-title="${escapedTitle}" data-favicon="${escapedFavicon}">★</div>
                <div class="close-btn" data-tab-id="${tab.id}">×</div>
            `;
            
            fragment.appendChild(item);
            globalIndex++;
        });
    }
    
    // Recently closed tabs
    if (filteredClosed.length > 0) {
        const header = document.createElement('div');
        header.className = 'section-header';
        header.textContent = 'Recently Closed';
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
    
    // Single DOM update
    tabList.innerHTML = '';
    tabList.appendChild(fragment);
    
    // Trigger fade-in animation on next frame
    requestAnimationFrame(() => {
        tabList.classList.add('loaded');
    });
    
    // Use event delegation instead of individual listeners
    setupEventDelegation();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
        
        // Extract first letter of domain for fallback icon
        let domainLetter = '?';
        try {
            const url = new URL(pin.url);
            const domain = url.hostname.replace(/^www\./, '');
            domainLetter = domain.charAt(0).toUpperCase();
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

// Setup event listeners for pinned websites
function setupPinnedEventListeners() {
    const pinnedContainer = document.querySelector('.pinned-container');
    if (!pinnedContainer) return;
    
    pinnedContainer.addEventListener('click', (e) => {
        const pinnedItem = e.target.closest('.pinned-item');
        if (!pinnedItem) return;
        
        // Check if remove button was clicked
        if (e.target.closest('.pinned-remove')) {
            e.stopPropagation();
            unpinWebsite(pinnedItem.dataset.url);
            return;
        }
        
        // Open the pinned website
        const url = pinnedItem.dataset.url;
        chrome.tabs.create({ url: url });
        window.close();
    });
}

// Pin a website
async function pinWebsite(url, title, favicon) {
    if (pinnedWebsites.length >= 9) {
        return; // Max 9 pinned websites
    }
    
    if (pinnedWebsites.some(p => p.url === url)) {
        return; // Already pinned
    }
    
    pinnedWebsites.push({ url, title, favicon });
    await chrome.storage.sync.set({ pinnedWebsites });
    renderPinnedWebsites();
    renderTabs();
    searchBox.focus();
}

// Unpin a website
async function unpinWebsite(url) {
    pinnedWebsites = pinnedWebsites.filter(p => p.url !== url);
    await chrome.storage.sync.set({ pinnedWebsites });
    renderPinnedWebsites();
    renderTabs();
    searchBox.focus();
}

// Setup event delegation for better performance
function setupEventDelegation() {
    const tabList = document.getElementById('tab-list');
    
    // Remove old listener if exists
    if (tabList._clickHandler) {
        tabList.removeEventListener('click', tabList._clickHandler);
    }
    
    // Single event listener for all clicks
    tabList._clickHandler = (e) => {
        const item = e.target.closest('.tab-item');
        const closeBtn = e.target.closest('.close-btn');
        const starBtn = e.target.closest('.star-btn');
        
        if (starBtn && item) {
            e.stopPropagation();
            const url = starBtn.dataset.tabUrl;
            const title = starBtn.dataset.tabTitle;
            const favicon = starBtn.dataset.favicon;
            
            if (starBtn.classList.contains('pinned')) {
                unpinWebsite(url);
            } else {
                pinWebsite(url, title, favicon);
            }
        } else if (closeBtn && item) {
            e.stopPropagation();
            closeTab(parseInt(closeBtn.dataset.tabId));
        } else if (item) {
            if (item.dataset.type === 'open') {
                switchToTab(parseInt(item.dataset.tabId));
            } else {
                restoreTab(parseInt(item.dataset.closedIndex));
            }
        }
    };
    
    tabList.addEventListener('click', tabList._clickHandler);
}

// Select tab
function selectTab(index) {
    const allItems = document.querySelectorAll('.tab-item');
    selectedIndex = Math.max(0, Math.min(index, allItems.length - 1));
    
    allItems.forEach((item, i) => {
        item.classList.toggle('selected', i === selectedIndex);
    });
    
    allItems[selectedIndex]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

// Switch to tab
async function switchToTab(tabId) {
    await chrome.tabs.update(tabId, { active: true });
    const tab = await chrome.tabs.get(tabId);
    await chrome.windows.update(tab.windowId, { focused: true });
    window.close();
}

// Close tab
async function closeTab(tabId) {
    await chrome.tabs.remove(tabId);
    allTabs = allTabs.filter(t => t.id !== tabId);
    filteredTabs = filteredTabs.filter(t => t.id !== tabId);
    renderTabs();
    selectTab(selectedIndex);
    searchBox.focus();
}

// Restore tab
async function restoreTab(closedIndex) {
    if (closedIndex >= 0 && closedIndex < recentlyClosed.length) {
        const tab = recentlyClosed[closedIndex];
        if (tab && tab.sessionId) {
            await chrome.sessions.restore(tab.sessionId);
            window.close();
        }
    }
}

// Search functionality
const searchBox = document.getElementById('search-box');
let searchTimeout;
searchBox.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    
    // Cancel pending renders
    if (searchTimeout) {
        cancelAnimationFrame(searchTimeout);
    }
    
    // Schedule render on next animation frame for smoother performance
    searchTimeout = requestAnimationFrame(() => {
        if (!query) {
            filteredTabs = allTabs;
            filteredClosed = recentlyClosed;
        } else {
            filteredTabs = allTabs.filter(tab => 
                tab.title.toLowerCase().includes(query) || tab.url.toLowerCase().includes(query)
            );
            filteredClosed = recentlyClosed.filter(tab => 
                tab.title.toLowerCase().includes(query) || tab.url.toLowerCase().includes(query)
            );
        }
        
        renderTabs();
        selectTab(0);
    });
});


// Block Ctrl + Mouse Wheel zoom in pop up
document.addEventListener(
  'wheel',
  (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  },
  { passive: false, capture: true } // passive: false is required to call preventDefault
);

// Keyboard handlers
searchBox.addEventListener('keydown', (e) => {
    // Recently closed key
    if (recentlyClosedKey && modifierMatches(recentlyClosedKey, e)) {
        e.preventDefault();
        const closedSection = document.querySelector('.section-header:last-of-type');
        if (closedSection) {
            closedSection.scrollIntoView({ behavior: 'smooth' });
            const firstClosedTab = document.querySelector('.closed-tab');
            if (firstClosedTab) {
                const closedIndex = parseInt(firstClosedTab.dataset.globalIndex);
                selectTab(closedIndex);
            }
        }
        return;
    }
    
    // Settings key
    if (settingsKey && modifierMatches(settingsKey, e)) {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
        window.close();
        return;
    }
    
    // Close modifier handling
    const isCloseModifier = modifierMatches(closeModifierKey, e);
    
    if (isCloseModifier && !modifierHeld && !e.repeat) {
        modifierHeld = true;
        otherKeyPressedWithModifier = false;
        e.preventDefault();
        return;
    }
    
    if (isCloseModifier && e.repeat) {
        e.preventDefault();
        return;
    }
    
    // Handle close modifier + shortcuts
    if (modifierHeld && !isCloseModifier) {
        otherKeyPressedWithModifier = true;
        const keyIndex = SHORTCUT_KEYS.indexOf(e.key.toUpperCase());
        
        if (keyIndex !== -1) {
            e.preventDefault();
            e.stopPropagation();
            const allItems = document.querySelectorAll('.tab-item');
            const targetItem = Array.from(allItems).find(item => 
                parseInt(item.dataset.globalIndex) === keyIndex
            );
            
            if (targetItem?.dataset.type === 'open') {
                closeTab(parseInt(targetItem.dataset.tabId));
            }
            return;
        }
        
        // Close modifier + confirm key
        if (confirmKey && (e.code === confirmKey.code || e.key === confirmKey.key)) {
            e.preventDefault();
            e.stopPropagation();
            const allItems = document.querySelectorAll('.tab-item');
            const selectedItem = allItems[selectedIndex];
            
            if (selectedItem?.dataset.type === 'open') {
                closeTab(parseInt(selectedItem.dataset.tabId));
            }
            return;
        }
    }
    
// Confirm key (check after modifiers to allow modifier+confirm combos)
if (confirmKey && modifierMatches(confirmKey, e)) {
    e.preventDefault();
    const allItems = document.querySelectorAll('.tab-item');
    const selectedItem = allItems[selectedIndex];
    
    if (selectedItem?.dataset.type === 'open') {
        switchToTab(parseInt(selectedItem.dataset.tabId));
    } else if (selectedItem?.dataset.type === 'closed') {
        restoreTab(parseInt(selectedItem.dataset.closedIndex));
    } else if (allItems.length === 0 && searchBox.value.trim() !== '') {
        // No results found - check if it's a URL/domain or perform web search
        const input = searchBox.value.trim();
        let url;
        
        // Check if input looks like a URL or domain
        if (isUrlOrDomain(input)) {
            // Add https:// if no protocol is specified
            url = input.match(/^https?:\/\//) ? input : `https://${input}`;
        } else {
            // Perform Google search
            url = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
        }
        
        chrome.tabs.create({ url: url });
        window.close();
    }
    return;
}

// Helper function to detect if input is a URL or domain
function isUrlOrDomain(input) {
    // Check if it starts with a protocol
    if (/^https?:\/\//i.test(input)) {
        return true;
    }
    
    // Check if it looks like a domain (contains a dot and no spaces)
    if (/^[^\s]+\.[^\s]+$/.test(input)) {
        return true;
    }
    
    // Check if it's localhost or an IP address
    if (/^(localhost|(\d{1,3}\.){3}\d{1,3})(:\d+)?/.test(input)) {
        return true;
    }
    
    return false;
}
    // Switch modifier handling
    const isSwitchModifier = modifierMatches(switchModifierKey, e);
    
    if (isSwitchModifier && !switchModifierHeld && !e.repeat) {
        switchModifierHeld = true;
        otherKeyPressedWithSwitchModifier = false;
        e.preventDefault();
        return;
    }
    
    if (isSwitchModifier && e.repeat) {
        e.preventDefault();
        return;
    }
    
    // Handle switch modifier + shortcuts
    if (switchModifierHeld && !isSwitchModifier) {
        otherKeyPressedWithSwitchModifier = true;
        
        // Check for number keys 1-9 for pinned websites
        const numberKey = e.key;
        if (numberKey >= '1' && numberKey <= '9') {
            const pinnedIndex = parseInt(numberKey) - 1;
            if (pinnedIndex < pinnedWebsites.length) {
                e.preventDefault();
                e.stopPropagation();
                chrome.tabs.create({ url: pinnedWebsites[pinnedIndex].url });
                window.close();
                return;
            }
        }
        
        const keyIndex = SHORTCUT_KEYS.indexOf(e.key.toUpperCase());
        
        if (keyIndex !== -1) {
            e.preventDefault();
            e.stopPropagation();
            const allItems = document.querySelectorAll('.tab-item');
            const targetItem = Array.from(allItems).find(item => 
                parseInt(item.dataset.globalIndex) === keyIndex
            );
            
            if (targetItem) {
                if (targetItem.dataset.type === 'open') {
                    switchToTab(parseInt(targetItem.dataset.tabId));
                } else if (targetItem.dataset.type === 'closed') {
                    restoreTab(parseInt(targetItem.dataset.closedIndex));
                }
            }
            return;
        }
    }
    
    // Arrow key navigation
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        selectTab(selectedIndex + (e.key === 'ArrowDown' ? 1 : -1));
    }
});

searchBox.addEventListener('keyup', (e) => {
    // Handle close modifier release
    if (modifierMatches(closeModifierKey, e, true) && modifierHeld) {
        e.preventDefault();
        
        // Add space if Space-based and no other key was pressed
        if (closeModifierKey.code === 'Space' && !otherKeyPressedWithModifier) {
            const cursorPos = searchBox.selectionStart;
            searchBox.value = searchBox.value.substring(0, cursorPos) + ' ' + searchBox.value.substring(cursorPos);
            searchBox.selectionStart = searchBox.selectionEnd = cursorPos + 1;
            searchBox.dispatchEvent(new Event('input'));
        }
        
        modifierHeld = false;
        otherKeyPressedWithModifier = false;
    }
    
    // Handle switch modifier release
    if (modifierMatches(switchModifierKey, e, true) && switchModifierHeld) {
        e.preventDefault();
        
        // Add space if Space-based and no other key was pressed
        if (switchModifierKey.code === 'Space' && !otherKeyPressedWithSwitchModifier) {
            const cursorPos = searchBox.selectionStart;
            searchBox.value = searchBox.value.substring(0, cursorPos) + ' ' + searchBox.value.substring(cursorPos);
            searchBox.selectionStart = searchBox.selectionEnd = cursorPos + 1;
            searchBox.dispatchEvent(new Event('input'));
        }
        
        switchModifierHeld = false;
        otherKeyPressedWithSwitchModifier = false;
    }
});

// Initialize on load
initialize();

// Close window when it loses focus
window.addEventListener('blur', () => {
    setTimeout(() => {
        if (!document.hasFocus()) window.close();
    }, 100);
});
