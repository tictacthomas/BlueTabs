// Content script for instant jump functionality
// Forwards key events to background script for global state tracking

console.log('Instant jump content script loaded!');

let engineModifierHeld = false; // Track locally to know when to preventDefault
let engineModifierKey = { display: 'F21', code: 'F21', key: 'F21', modifiers: {} };
let instantJumpEnabled = true;

// Load the configured modifier key and enabled state
chrome.storage.sync.get({ engineModifierData: null, enableInstantJump: true }, (result) => {
    if (result.engineModifierData) {
        engineModifierKey = result.engineModifierData;
        console.log('Loaded engine modifier key:', engineModifierKey);
    }
    instantJumpEnabled = result.enableInstantJump !== false;
});

// Listen for storage changes to update modifier key and enabled state
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        if (changes.engineModifierData) {
            engineModifierKey = changes.engineModifierData.newValue;
            console.log('Engine modifier key updated:', engineModifierKey);
        }
        if (changes.enableInstantJump) {
            instantJumpEnabled = changes.enableInstantJump.newValue !== false;
            // Release held state if feature was just disabled
            if (!instantJumpEnabled) engineModifierHeld = false;
            console.log('Instant jump enabled:', instantJumpEnabled);
        }
    }
});

// Check if key event matches the configured modifier
function isEngineModifier(e) {
    const mods = engineModifierKey.modifiers || {};
    const ctrlMatch = !!mods.ctrl === !!e.ctrlKey;
    const altMatch = !!mods.alt === !!e.altKey;
    const shiftMatch = !!mods.shift === !!e.shiftKey;
    const metaMatch = !!mods.meta === !!e.metaKey;
    const keyMatch = (e.code === engineModifierKey.code) || (e.key === engineModifierKey.key);
    
    return ctrlMatch && altMatch && shiftMatch && metaMatch && keyMatch;
}

// Check with background if modifier is already held (for tab switches)
chrome.runtime.sendMessage({ action: 'getModifierState' }, (response) => {
    if (response && response.held) {
        engineModifierHeld = true;
        console.log('Modifier already held on tab load');
    }
});

// Listen for modifier state broadcasts from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'modifierState') {
        engineModifierHeld = request.held;
        console.log('Modifier state updated from broadcast:', request.held);
    }
});

// Listen for keydown and forward to background
document.addEventListener('keydown', (e) => {
    if (!instantJumpEnabled) return;
    const isModifier = isEngineModifier(e);
    const isLetter = e.code.startsWith('Key') && e.code.length === 4;
    
    if (isModifier) {
        engineModifierHeld = true;
        e.preventDefault();
        e.stopPropagation();
        console.log('Engine modifier pressed, forwarding to background');
        
        chrome.runtime.sendMessage({
            action: 'keydown',
            event: {
                code: e.code,
                key: e.key,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey,
                shiftKey: e.shiftKey,
                metaKey: e.metaKey
            }
        });
    } else if (isLetter && engineModifierHeld) {
        // Letter key while modifier is held - prevent typing
        e.preventDefault();
        e.stopPropagation();
        console.log('Letter pressed while modifier held, forwarding to background:', e.code);
        
        chrome.runtime.sendMessage({
            action: 'keydown',
            event: {
                code: e.code,
                key: e.key,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey,
                shiftKey: e.shiftKey,
                metaKey: e.metaKey
            }
        });
    }
}, true);

// Prevent text input when engine modifier is held
document.addEventListener('beforeinput', (e) => {
    if (!instantJumpEnabled) return;
    if (engineModifierHeld) {
        e.preventDefault();
        console.log('Blocked input while modifier held');
    }
}, true);

// Listen for keyup and forward to background
document.addEventListener('keyup', (e) => {
    if (!instantJumpEnabled) return;
    const isModifier = isEngineModifier(e);
    
    if (isModifier) {
        engineModifierHeld = false;
        e.preventDefault();
        e.stopPropagation();
        console.log('Engine modifier released, forwarding to background');
        
        chrome.runtime.sendMessage({
            action: 'keyup',
            event: {
                code: e.code,
                key: e.key,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey,
                shiftKey: e.shiftKey,
                metaKey: e.metaKey
            }
        });
    }
}, true);