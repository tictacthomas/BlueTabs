// Settings script

// Default settings
const DEFAULT_SETTINGS = {
    closeModifier: { display: 'Shift', code: 'ShiftLeft', key: 'Shift', modifiers: { shift: true } },
    targetModifier: { display: 'Alt', code: 'AltLeft', key: 'Alt', modifiers: { alt: true } },
    recentlyClosedKey: { display: 'Tab', code: 'Tab', key: 'Tab', modifiers: {} },
    engineModifier: { display: 'F21', code: 'F21', key: 'F21', modifiers: {} },
    forceSearchKey: { display: 'Ctrl', code: 'ControlLeft', key: 'Control', modifiers: { ctrl: true } },
    webSearchKey: { display: 'Enter', code: 'Enter', key: 'Enter', modifiers: {} }
};

// State
let recordingMode = null;
let recordedCloseKey = null;
let recordedTargetKey = null;
let recordedRecentlyClosedKey = null;
let recordedEngineKey = null;
let recordedForceSearchKey = null;
let recordedWebSearchKey = null;
let currentRecordingKey = null;




// Modal open/close functions
function openWeatherModal() {
    document.getElementById('weatherModal').classList.add('show');
}

function closeWeatherModal() {
    document.getElementById('weatherModal').classList.remove('show');
}

function openCurrencyModal() {
    document.getElementById('currencyModal').classList.add('show');
}

function closeCurrencyModal() {
    document.getElementById('currencyModal').classList.remove('show');
}

function openTranslationModal() {
    document.getElementById('translationModal').classList.add('show');
}

function closeTranslationModal() {
    document.getElementById('translationModal').classList.remove('show');
}

// Modal button event listeners
document.getElementById('manageWeatherButton')?.addEventListener('click', openWeatherModal);
document.getElementById('closeWeatherModal')?.addEventListener('click', closeWeatherModal);
document.getElementById('weatherModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'weatherModal') closeWeatherModal();
});

document.getElementById('manageCurrencyButton')?.addEventListener('click', openCurrencyModal);
document.getElementById('closeCurrencyModal')?.addEventListener('click', closeCurrencyModal);
document.getElementById('currencyModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'currencyModal') closeCurrencyModal();
});

document.getElementById('manageTranslationButton')?.addEventListener('click', openTranslationModal);
document.getElementById('closeTranslationModal')?.addEventListener('click', closeTranslationModal);
document.getElementById('translationModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'translationModal') closeTranslationModal();
});

// Load saved settings
async function loadSettings() {
    const result = await chrome.storage.sync.get({ 
        closeModifierData: null,
        targetModifierData: null,
        recentlyClosedKeyData: null,
        engineModifierData: null,
        forceSearchKeyData: null,
        webSearchKeyData: null,
        showInstructions: false,
        prioritizeHotPage: true,
        animations: true,
        onlySearchClosedWhenJumped: true,
        useTopSitesAsHotPages: false,
        enableSearchHistory: true,
        enableInstantJump: true,
        recentlyClosedKeyDisabled: false,
        forceSearchKeyDisabled: false,
        showClock: true,
        defaultSearchEngine: null,
        customSearchEngineUrl: ''
    });





    
    recordedCloseKey = result.closeModifierData || DEFAULT_SETTINGS.closeModifier;
    recordedTargetKey = result.targetModifierData || DEFAULT_SETTINGS.targetModifier;
    recordedRecentlyClosedKey = result.recentlyClosedKeyData || DEFAULT_SETTINGS.recentlyClosedKey;
    recordedEngineKey = result.engineModifierData || DEFAULT_SETTINGS.engineModifier;
    recordedForceSearchKey = result.forceSearchKeyData || DEFAULT_SETTINGS.forceSearchKey;
    recordedWebSearchKey = result.webSearchKeyData || DEFAULT_SETTINGS.webSearchKey;
    
    // Update UI
    document.getElementById('closeModifierDisplay').value = recordedCloseKey.display;
    document.getElementById('targetModifierDisplay').value = recordedTargetKey.display;
    document.getElementById('recentlyClosedKeyDisplay').value = recordedRecentlyClosedKey.display;
    document.getElementById('engineModifierDisplay').value = recordedEngineKey.display;
    document.getElementById('forceSearchKeyDisplay').value = recordedForceSearchKey.display;
    document.getElementById('webSearchKeyDisplay').value = recordedWebSearchKey.display;
    document.getElementById('showInstructions').checked = result.showInstructions;
    document.getElementById('prioritizeHotPage').checked = result.prioritizeHotPage;
    document.getElementById('animations').checked = result.animations;
    document.getElementById('onlySearchClosedWhenJumped').checked = result.onlySearchClosedWhenJumped;
    document.getElementById('useTopSitesAsHotPages').checked = result.useTopSitesAsHotPages;
    document.getElementById('enableSearchHistory').checked = result.enableSearchHistory;
    document.getElementById('enableInstantJump').checked = result.enableInstantJump !== false;
    document.getElementById('showClock').checked = result.showClock;
    
    // Load default search engine setting
    loadSearchEngineSetting(result.defaultSearchEngine, result.customSearchEngineUrl || '');
    
    // Apply disabled states for optional keys
    updateDisabledKeyUI('recentlyClosed', result.recentlyClosedKeyDisabled);
    updateDisabledKeyUI('forceSearch', result.forceSearchKeyDisabled);
    
    updateExamples();
}

// Load the browser-level extension shortcut
async function loadExtensionShortcut() {
    try {
        const commands = await chrome.commands.getAll();
        const toggleCommand = commands.find(cmd => cmd.name === 'toggle-switcher');
        
        if (toggleCommand && toggleCommand.shortcut) {
            // Update the display in the "How it works" section
            const shortcutDisplay = toggleCommand.shortcut || 'Not set';
            
            // Find and update elements that show the extension shortcut
            // You would need to add an element in the HTML for this
            const shortcutElement = document.getElementById('extensionShortcut');
            if (shortcutElement) {
                shortcutElement.textContent = shortcutDisplay;
            }
        }
    } catch (error) {
        console.error('Failed to load extension shortcut:', error);
    }
}

// Call this in your initialization
loadExtensionShortcut();

// Get UI element IDs for a mode
function getUIElements(mode) {
    const baseName = mode.charAt(0).toUpperCase() + mode.slice(1);
    return {
        button: `record${baseName}Button`,
        status: `recording${baseName}Status`,
        display: (mode === 'confirm' || mode === 'recentlyClosed' || mode === 'settings' || mode === 'forceSearch') 
            ? `${mode}KeyDisplay` 
            : `${mode}ModifierDisplay`
    };
}

// Start recording
function startRecording(mode) {
    recordingMode = mode;
    currentRecordingKey = null;
    
    const { button, status } = getUIElements(mode);
    
    document.getElementById(button).textContent = 'Recording';
    document.getElementById(button).classList.add('recording');
    document.getElementById(status).style.color = '#667eea';
    
    document.addEventListener('keydown', handleKeyRecord);
    document.addEventListener('keyup', handleKeyUp);
}

// Stop recording
function stopRecording() {
    if (!recordingMode) return;
    
    const { button, status } = getUIElements(recordingMode);
    
    document.getElementById(button).textContent = 'Record';
    document.getElementById(button).classList.remove('recording');
    document.getElementById(status).textContent = '';
    
    document.removeEventListener('keydown', handleKeyRecord);
    document.removeEventListener('keyup', handleKeyUp);
    
    if (currentRecordingKey && checkAndSetKey(currentRecordingKey)) {
        saveSettings();
    }
    
    currentRecordingKey = null;
    recordingMode = null;
}

// Handle key recording
function handleKeyRecord(e) {
    e.preventDefault();
    
    const { status, display } = getUIElements(recordingMode);
    
    // Build modifiers
    const modifiers = [];
    const modifierObj = {};
    
    if (e.ctrlKey) { modifiers.push('Ctrl'); modifierObj.ctrl = true; }
    if (e.altKey) { modifiers.push('Alt'); modifierObj.alt = true; }
    if (e.shiftKey) { modifiers.push('Shift'); modifierObj.shift = true; }
    if (e.metaKey) { modifiers.push('Meta'); modifierObj.meta = true; }
    
    const isModifierKey = ['Control', 'Alt', 'Shift', 'Meta'].includes(e.key);
    const isSingleChar = e.key.length === 1;
    const isAlphaNumeric = /^[a-zA-Z0-9]$/.test(e.key);
    const hasModifiers = modifiers.length > 0;
    
    // Validation: no single alphanumeric keys without modifiers
    if (isSingleChar && isAlphaNumeric && !hasModifiers) {
        document.getElementById(status).textContent = '❌ Single letters/numbers not allowed. Press a modifier key or special key.';
        document.getElementById(status).style.color = '#e53e3e';
        document.getElementById(display).value = '';
        currentRecordingKey = null;
        currentRecordingKey = { error: true }; // Mark as error to prevent auto-stop
        return;
    }
    
    // Special validation: no Space alone for Recently Closed key
    if (recordingMode === 'recentlyClosed' && e.code === 'Space' && !hasModifiers) {
        document.getElementById(status).textContent = '❌ Space alone is not allowed for this shortcut. Use Space with modifiers or a different key.';
        document.getElementById(status).style.color = '#e53e3e';
        document.getElementById(display).value = '';
        currentRecordingKey = { error: true }; // Mark as error to prevent auto-stop
        return;
    }
    
    // Build display string
    const displayParts = [...modifiers];
    
    if (!isModifierKey) {
        if (e.code === 'Space') {
            displayParts.push('Space');
        } else if (e.key.length === 1) {
            displayParts.push(e.key.toUpperCase());
        } else {
            displayParts.push(e.key);
        }
    }
    
    const displayStr = displayParts.join('+');
    
    if (displayStr) {
        document.getElementById(display).value = displayStr;
        document.getElementById(status).style.color = '#667eea';
        
        currentRecordingKey = {
            display: displayStr,
            key: e.key,
            code: e.code,
            modifiers: modifierObj
        };
    }
}

// Handle key up during recording
function handleKeyUp(e) {
    if (!recordingMode) return;
    
    // Don't auto-stop if there was a validation error
    if (currentRecordingKey && currentRecordingKey.error) {
        currentRecordingKey = null;
        return;
    }
    
    // Auto-complete recording on any key release (if we have a valid recording)
    if (currentRecordingKey) {
        stopRecording();
    }
}

// Check if keys conflict
function keysConflict(key1, key2) {
    if (!key1 || !key2) return false;
    
    // Compare display strings for simple check
    return key1.display === key2.display;
}

// Check if keys conflict
function findConflict(newKey) {
    const keys = {
        close: recordedCloseKey,
        target: recordedTargetKey,
        recentlyClosed: recordedRecentlyClosedKey,
        engine: recordedEngineKey,
        forceSearch: recordedForceSearchKey
    };
    
    for (const [name, key] of Object.entries(keys)) {
        if (name !== recordingMode && keysConflict(newKey, key)) {
            return { name, key };
        }
    }
    return null;
}

// Check and set key
function checkAndSetKey(newKey) {
    const conflict = findConflict(newKey);
    
    if (conflict) {
        showConflictDialog(conflict, newKey);
        return false;
    }
    
    setKeyForMode(recordingMode, newKey);
    updateExamples();
    return true;
}

// Show conflict dialog
function showConflictDialog(conflict, newKey) {
    // Remove any existing overlay first
    const existingOverlay = document.getElementById('conflict-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Capture current recording mode before it gets cleared
    const currentMode = recordingMode;
    
    // Get display names
    const conflictDisplayName = conflict.name === 'recentlyClosed' ? 'Recently Closed' : 
                                conflict.name === 'close' ? 'Close Modifier' :
                                conflict.name === 'target' ? 'Target Modifier' :
                                conflict.name === 'settings' ? 'Settings' :
                                conflict.name === 'engine' ? 'Engine Modifier' :
                                conflict.name === 'forceSearch' ? 'Force Search' :
                                conflict.name.charAt(0).toUpperCase() + conflict.name.slice(1);
    
    const currentDisplayName = recordingMode === 'recentlyClosed' ? 'Recently Closed' : 
                               recordingMode === 'close' ? 'Close Modifier' :
                               recordingMode === 'target' ? 'Target Modifier' :
                               recordingMode === 'settings' ? 'Settings' :
                               recordingMode === 'engine' ? 'Engine Modifier' :
                               recordingMode === 'forceSearch' ? 'Force Search' :
                               recordingMode.charAt(0).toUpperCase() + recordingMode.slice(1);
    
    const overlay = document.createElement('div');
    overlay.id = 'conflict-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.5); display: flex;
        align-items: center; justify-content: center; z-index: 1000;
    `;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: white; padding: 32px; border-radius: 12px;
        max-width: 500px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;
    
    const title = document.createElement('h2');
    title.textContent = 'Shortcut Conflict';
    title.style.cssText = 'margin-bottom: 16px; color: #1a202c; font-size: 20px;';
    
    const message = document.createElement('p');
    message.style.cssText = 'margin-bottom: 24px; color: #4a5568; line-height: 1.6;';
    message.innerHTML = `
        <strong style="color: #667eea;">${newKey.display}</strong> is already bound to <strong>${conflictDisplayName}</strong>.
        <br>
        Do you want to <strong style="color: #667eea;">${newKey.display}</strong> to be <strong>${currentDisplayName}</strong> instead?
        `;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 12px; justify-content: flex-end;';
    
    const yesButton = document.createElement('button');
    yesButton.textContent = 'Yes';
    yesButton.type = 'button';
    yesButton.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        color: white; padding: 12px 24px;
        border: none; border-radius: 8px; font-size: 14px;
        font-weight: 600; cursor: pointer;
    `;
    
    const noButton = document.createElement('button');
    noButton.textContent = 'No';
    noButton.type = 'button';
    noButton.style.cssText = `
        background: #e2e8f0; color: #2d3748; padding: 12px 24px;
        border: none; border-radius: 8px; font-size: 14px;
        font-weight: 600; cursor: pointer;
    `;
    
    // Handle Yes button
    yesButton.onclick = function() {
        // Clear the conflicting shortcut
        setKeyForMode(conflict.name, null);
        
        // Set new key to current mode (use captured currentMode)
        setKeyForMode(currentMode, newKey);
        
        // Update examples
        updateExamples();
        
        // Auto-save the changes
        saveSettings();
        
        // Remove dialog
        overlay.remove();
    };
    
    // Handle No button
    noButton.onclick = function() {
        // Clear the input field for the current shortcut being configured
        const displayId = (currentMode === 'confirm' || currentMode === 'recentlyClosed' || currentMode === 'settings') 
            ? `${currentMode}KeyDisplay` 
            : `${currentMode}ModifierDisplay`;
        document.getElementById(displayId).value = '';
        
        // Clear the status message
        const statusId = `recording${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}Status`;
        document.getElementById(statusId).textContent = '';
        
        // Remove dialog
        overlay.remove();
    };
    
    // Allow clicking outside the dialog to dismiss
    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };
    
    // Prevent clicks on dialog from closing overlay
    dialog.onclick = (e) => e.stopPropagation();
    
    buttonContainer.appendChild(yesButton);
    buttonContainer.appendChild(noButton);
    dialog.appendChild(title);
    dialog.appendChild(message);
    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
}

// Set key for a mode
function setKeyForMode(mode, key) {
    const keys = {
        close: { var: 'recordedCloseKey', display: 'closeModifierDisplay' },
        target: { var: 'recordedTargetKey', display: 'targetModifierDisplay' },
        recentlyClosed: { var: 'recordedRecentlyClosedKey', display: 'recentlyClosedKeyDisplay' },
        engine: { var: 'recordedEngineKey', display: 'engineModifierDisplay' },
        forceSearch: { var: 'recordedForceSearchKey', display: 'forceSearchKeyDisplay' },
        webSearch: { var: 'recordedWebSearchKey', display: 'webSearchKeyDisplay' }
    };
    
    const config = keys[mode];
    if (config) {
        if (mode === 'close') recordedCloseKey = key;
        else if (mode === 'target') recordedTargetKey = key;
        else if (mode === 'recentlyClosed') recordedRecentlyClosedKey = key;
        else if (mode === 'engine') recordedEngineKey = key;
        else if (mode === 'forceSearch') recordedForceSearchKey = key;
        else if (mode === 'webSearch') recordedWebSearchKey = key;
        
        document.getElementById(config.display).value = key ? key.display : '';
    }
}

// Save settings (auto-save)
async function saveSettings() {
    if (!recordedCloseKey || !recordedTargetKey || !recordedRecentlyClosedKey || !recordedEngineKey || !recordedForceSearchKey || !recordedWebSearchKey) {
        return;
    }
    
    const showInstructions = document.getElementById('showInstructions').checked;
    const onlySearchClosedWhenJumped = document.getElementById('onlySearchClosedWhenJumped').checked;
    const useTopSitesAsHotPages = document.getElementById('useTopSitesAsHotPages').checked;
    const enableSearchHistory = document.getElementById('enableSearchHistory').checked;
    
    await chrome.storage.sync.set({ 
        closeModifierData: recordedCloseKey,
        targetModifierData: recordedTargetKey,
        recentlyClosedKeyData: recordedRecentlyClosedKey,
        engineModifierData: recordedEngineKey,
        forceSearchKeyData: recordedForceSearchKey,
        webSearchKeyData: recordedWebSearchKey,
        showInstructions: showInstructions,
        onlySearchClosedWhenJumped: onlySearchClosedWhenJumped,
        useTopSitesAsHotPages: useTopSitesAsHotPages,
        enableSearchHistory: enableSearchHistory,
        enableInstantJump: enableInstantJump
        
    });
}

// Save just checkbox settings (doesn't require keys to be set)
async function saveCheckboxSettings() {
    const showInstructions = document.getElementById('showInstructions').checked;
    const onlySearchClosedWhenJumped = document.getElementById('onlySearchClosedWhenJumped').checked;
    const useTopSitesAsHotPages = document.getElementById('useTopSitesAsHotPages').checked;
    const enableSearchHistory = document.getElementById('enableSearchHistory').checked;
    const enableInstantJump = document.getElementById('enableInstantJump').checked;
    const showClock = document.getElementById('showClock').checked;
    const prioritizeHotPage = document.getElementById('prioritizeHotPage').checked;
    const animations = document.getElementById('animations').checked;

    await chrome.storage.sync.set({ 
        showInstructions: showInstructions,
        prioritizeHotPage: prioritizeHotPage,
        animations:animations,
        onlySearchClosedWhenJumped: onlySearchClosedWhenJumped,
        useTopSitesAsHotPages: useTopSitesAsHotPages,
        enableSearchHistory: enableSearchHistory,
        enableInstantJump: enableInstantJump,
        showClock: showClock
    });
}

// Update UI for disabled optional keys (recentlyClosed, forceSearch)
function updateDisabledKeyUI(keyType, disabled) {
    const displayId = `${keyType}KeyDisplay`;
    const recordBtnId = `record${keyType.charAt(0).toUpperCase() + keyType.slice(1)}Button`;
    const clearBtnId = `clear${keyType.charAt(0).toUpperCase() + keyType.slice(1)}Button`;
    const disableBtnId = `disable${keyType.charAt(0).toUpperCase() + keyType.slice(1)}Button`;
    const itemId = `${keyType}KeyItem`;
    
    const display = document.getElementById(displayId);
    const recordBtn = document.getElementById(recordBtnId);
    const clearBtn = document.getElementById(clearBtnId);
    const disableBtn = document.getElementById(disableBtnId);
    const keyItem = document.getElementById(itemId);
    
    if (disabled) {
        // Disable and gray out controls
        display.value = '';
        display.disabled = true;
        display.style.opacity = '0.5';
        display.style.cursor = 'not-allowed';
        display.placeholder = 'Disabled';
        recordBtn.disabled = true;
        recordBtn.style.opacity = '0.5';
        recordBtn.style.cursor = 'not-allowed';
        clearBtn.disabled = true;
        clearBtn.style.opacity = '0.5';
        clearBtn.style.cursor = 'not-allowed';
        disableBtn.textContent = 'Enable';
        disableBtn.classList.add('disabled');
        if (keyItem) {
            keyItem.style.opacity = '0.7';
        }
        
        // Clear the key data
        if (keyType === 'recentlyClosed') {
            recordedRecentlyClosedKey = null;
        } else if (keyType === 'forceSearch') {
            recordedForceSearchKey = null;
        }
    } else {
        // Re-enable controls
        display.disabled = false;
        display.style.opacity = '1';
        display.style.cursor = '';
        display.placeholder = 'Record...';
        recordBtn.disabled = false;
        recordBtn.style.opacity = '1';
        recordBtn.style.cursor = 'pointer';
        clearBtn.disabled = false;
        clearBtn.style.opacity = '1';
        clearBtn.style.cursor = 'pointer';
        disableBtn.textContent = 'Disable';
        disableBtn.classList.remove('disabled');
        if (keyItem) {
            keyItem.style.opacity = '1';
        }
        
        // Restore default key if not set
        if (keyType === 'recentlyClosed' && !recordedRecentlyClosedKey) {
            recordedRecentlyClosedKey = DEFAULT_SETTINGS.recentlyClosedKey;
            display.value = recordedRecentlyClosedKey.display;
        } else if (keyType === 'forceSearch' && !recordedForceSearchKey) {
            recordedForceSearchKey = DEFAULT_SETTINGS.forceSearchKey;
            display.value = recordedForceSearchKey.display;
        }
    }
    
    updateExamples();
}

// Toggle disable state for optional keys
async function toggleDisableKey(keyType) {
    const disabledKey = `${keyType}KeyDisabled`;
    const result = await chrome.storage.sync.get({ [disabledKey]: false });
    const newDisabledState = !result[disabledKey];
    
    // Update storage
    const storageUpdate = { [disabledKey]: newDisabledState };
    
    // Also clear the key data if disabling
    if (newDisabledState) {
        if (keyType === 'recentlyClosed') {
            storageUpdate.recentlyClosedKeyData = null;
        } else if (keyType === 'forceSearch') {
            storageUpdate.forceSearchKeyData = null;
        }
    } else {
        // Restore default key when enabling
        if (keyType === 'recentlyClosed') {
            storageUpdate.recentlyClosedKeyData = DEFAULT_SETTINGS.recentlyClosedKey;
        } else if (keyType === 'forceSearch') {
            storageUpdate.forceSearchKeyData = DEFAULT_SETTINGS.forceSearchKey;
        }
    }
    
    await chrome.storage.sync.set(storageUpdate);
    
    // Update UI
    updateDisabledKeyUI(keyType, newDisabledState);
}

// Clear key
function clearKey(type) {
    setKeyForMode(type, null);
    updateExamples();
    saveSettings();
}

// Update examples
function updateExamples() {
    const updates = {
        exampleClose3: recordedCloseKey?.display || DEFAULT_SETTINGS.closeModifier.display,
        exampleClose4: recordedCloseKey?.display || DEFAULT_SETTINGS.closeModifier.display,
        exampleTarget2: recordedTargetKey?.display || DEFAULT_SETTINGS.targetModifier.display,
        exampleTarget3: recordedTargetKey?.display || DEFAULT_SETTINGS.targetModifier.display,
        exampleTarget4: recordedTargetKey?.display || DEFAULT_SETTINGS.targetModifier.display,
        exampleRecentlyClosed2: recordedRecentlyClosedKey?.display || DEFAULT_SETTINGS.recentlyClosedKey.display,
        exampleEngine2: recordedEngineKey?.display || DEFAULT_SETTINGS.engineModifier.display
    };
    
    Object.entries(updates).forEach(([id, text]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    });
    
    // Hide rows for disabled keys
    const recentlyClosedRow = document.getElementById('recentlyClosedRow');
    if (recentlyClosedRow) {
        chrome.storage.sync.get({ recentlyClosedKeyDisabled: false }, (result) => {
            recentlyClosedRow.style.display = result.recentlyClosedKeyDisabled ? 'none' : '';
        });
    }
}

// Event listeners
const modes = ['close', 'target', 'recentlyClosed', 'engine', 'forceSearch', 'webSearch'];

modes.forEach(mode => {
    const baseName = mode.charAt(0).toUpperCase() + mode.slice(1);
    
    document.getElementById(`record${baseName}Button`)?.addEventListener('click', () => {
        if (recordingMode === mode) {
            stopRecording();
        } else {
            if (recordingMode) stopRecording();
            startRecording(mode);
        }
    });
    
    document.getElementById(`clear${baseName}Button`)?.addEventListener('click', () => clearKey(mode));
});

document.getElementById('showInstructions').addEventListener('change', saveCheckboxSettings);
document.getElementById('prioritizeHotPage').addEventListener('change', saveCheckboxSettings);
document.getElementById('animations').addEventListener('change', saveCheckboxSettings);
document.getElementById('onlySearchClosedWhenJumped').addEventListener('change', saveCheckboxSettings);
document.getElementById('useTopSitesAsHotPages').addEventListener('change', saveCheckboxSettings);
document.getElementById('enableSearchHistory').addEventListener('change', saveCheckboxSettings);
document.getElementById('enableInstantJump').addEventListener('change', saveCheckboxSettings);
document.getElementById('showClock').addEventListener('change', saveCheckboxSettings);

// Hot pages export/import handlers
document.getElementById('exportHotPages').addEventListener('click', async () => {
    const result = await chrome.storage.sync.get({ hotPages: [] });
    const hotPages = result.hotPages || [];
    const jsonData = { hotPages };
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hotpages.json';
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('importHotPagesBtn').addEventListener('click', () => {
    document.getElementById('importHotPagesFile').click();
});

document.getElementById('importHotPagesFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        if (jsonData.hotPages && Array.isArray(jsonData.hotPages)) {
            const result = await chrome.storage.sync.get({ hotPages: [] });
            const existingHotPages = result.hotPages || [];
            const existingUrls = new Set(existingHotPages.map(p => p.url));
            
            for (const page of jsonData.hotPages) {
                if (!existingUrls.has(page.url)) {
                    existingHotPages.push({
                        url: page.url,
                        title: page.title,
                        favicon: page.favicon || `https://icons.duckduckgo.com/ip3/${new URL(page.url).hostname}.ico`
                    });
                }
            }
            
            await chrome.storage.sync.set({ hotPages: existingHotPages });
            alert(`Imported ${jsonData.hotPages.length} hot pages successfully!`);
        } else {
            alert('Invalid JSON format. Expected { "hotPages": [...] }');
        }
    } catch (err) {
        alert('Error importing file: ' + err.message);
    }
    
    // Reset file input
    e.target.value = '';
});

// Event listeners for disable buttons
document.getElementById('disableRecentlyClosedButton').addEventListener('click', () => toggleDisableKey('recentlyClosed'));
document.getElementById('disableForceSearchButton').addEventListener('click', () => toggleDisableKey('forceSearch'));
//document.getElementById('disableWebSearch').addEventListener('click', () => toggleDisableKey('forceWebSearch'));


// Open Chrome shortcuts page
document.getElementById('openChromeShortcuts').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

// Load settings on page load
loadSettings();

// Engine Manager functionality
let customEngines = [];
let defaultEnginesData = [
    { id: 'herewego', name: 'herewego', key: 'm', url: 'https://wego.here.com/discover/', urlSuffix: '?map=59.94914,10.65364,10', isDefault: true, modifierKeys: [] },
    { id: 'shopping', name: 'DuckDuckGo', key: 's', url: 'https://duckduckgo.com/?e=&t=h_&q=', urlSuffix: '&ia=shopping&iax=shopping', isDefault: true, modifierKeys: [] },
    { id: 'BraveLeo', name: 'BraveAI', key: 'l', url: 'https://search.brave.com/ask?q=', urlSuffix: '', isDefault: true, modifierKeys: [] },
    { id: 'Translate', name: 'Translate', key: 't', url: 'https://translate.google.com/?sl=auto&tl=de,no,en&text=&q=', urlSuffix: '', isDefault: true, modifierKeys: [] },
    { id: 'openHours', name: 'OpenHours', key: 'o', url: 'https://apningstider.com/spots?loc=&q=', urlSuffix: '', isDefault: true, modifierKeys: [] },
    { id: 'youtube', name: 'YouTube', key: 'y', url: 'https://www.youtube.com/results?search_query=', urlSuffix: '', isDefault: true, modifierKeys: [] },
    { id: 'wikipedia', name: 'Wikipedia', key: 'w', url: 'https://en.wikipedia.org/wiki/Special:Search?search=', urlSuffix: '', isDefault: true, modifierKeys: [] },
    { id: 'amazonDE', name: 'Amazon.de', key: 'a', url: 'https://www.amazon.de/s?k=', urlSuffix: '', isDefault: true, modifierKeys: [] },
    { id: 'amazonCOM', name: 'Amazon.com', key: 'z', url: 'https://www.amazon.com/s?k=', urlSuffix: '', isDefault: true, modifierKeys: [] },
    { id: 'klarna', name: 'Klarna', key: 'k', url: 'https://www.klarna.com/no/shopping/results?q=', urlSuffix: '', isDefault: true, modifierKeys: [] },
    { id: 'prisjakt', name: 'Prisjakt', key: 'p', url: 'https://www.prisjakt.no/search?query=', urlSuffix: '', isDefault: true, modifierKeys: [] },
    { id: 'ikea', name: 'IKEA', key: 'i', url: 'https://www.ikea.com/no/no/search/?q=', urlSuffix: '', isDefault: true, modifierKeys: [] },
    { id: 'finn', name: 'Finn.no', key: 'f', url: 'https://www.finn.no/recommerce/forsale/search?q=', urlSuffix: '', isDefault: true, modifierKeys: [] },
    { id: 'brave', name: 'Brave Search', key: 'b', url: 'https://search.brave.com/search?q=', urlSuffix: '', isDefault: true, modifierKeys: [] }
];
let disabledDefaultEngines = [];

// Load custom engines from storage
async function loadCustomEngines() {
    const result = await chrome.storage.sync.get({ 
        customEngines: [], 
        disabledDefaultEngines: [],
        modifiedDefaultEngines: {}
    });
    customEngines = result.customEngines;
    disabledDefaultEngines = result.disabledDefaultEngines || [];
    
    // Apply any modifications to default engines
    const modifications = result.modifiedDefaultEngines || {};
    defaultEnginesData = defaultEnginesData.map(engine => {
        if (modifications[engine.id]) {
            return { ...engine, ...modifications[engine.id], isModified: true };
        }
        return engine;
    });
    
    renderEnginesList();
    updateEngineShortcutPreview();
}

// Save custom engines to storage
async function saveCustomEngines() {
    const modifiedDefaults = {};
    defaultEnginesData.forEach(engine => {
        if (engine.isModified) {
            modifiedDefaults[engine.id] = {
                name: engine.name,
                key: engine.key,
                url: engine.url,
                urlSuffix: engine.urlSuffix || '',
                modifierKeys: engine.modifierKeys || []
            };
        }
    });
    
    await chrome.storage.sync.set({ 
        customEngines: customEngines,
        disabledDefaultEngines: disabledDefaultEngines,
        modifiedDefaultEngines: modifiedDefaults
    });
}

// Update the shortcut preview in the add form
function updateEngineShortcutPreview() {
    const preview = document.getElementById('engineShortcutPreview');
    const engineModifier = recordedEngineKey?.display || 'Ctrl';
    preview.textContent = `${engineModifier}+[Key]`;
}

// Get all engines (default + custom)
function getAllEngines() {
    const enabledDefaults = defaultEnginesData.filter(engine => 
        !disabledDefaultEngines.includes(engine.id)
    );
    return [...enabledDefaults, ...customEngines];
}

// Format shortcut display for an engine
function formatShortcutDisplay(engine) {
    const engineModifier = recordedEngineKey?.display || 'Ctrl';
    const key = engine.key.toUpperCase();
    
    // Handle custom modifier keys
    if (engine.modifierKeys && engine.modifierKeys.length > 0) {
        const modifierDisplay = engine.modifierKeys.map(mod => {
            if (mod === 'control') return 'Ctrl';
            if (mod === 'shift') return 'Shift';
            if (mod === 'alt') return 'Alt';
            if (mod === 'meta') return 'Meta';
            return mod.charAt(0).toUpperCase() + mod.slice(1);
        }).join('+');
        return `${engineModifier}+${modifierDisplay}+${key}`;
    }
    return `${engineModifier}+${key}`;
}

// Render the engines list
function renderEnginesList() {
    const enginesList = document.getElementById('enginesList');
    const allEngines = getAllEngines();
    
    if (allEngines.length === 0) {
        enginesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <h3 style="margin: 0 0 8px 0; color: #475569;">No Engines Available</h3>
                <p style="margin: 0; font-size: 14px;">All default engines have been disabled. Add custom engines above or re-enable default ones.</p>
            </div>
        `;
        return;
    }
    
    // Count enabled defaults to calculate custom engine indices correctly
    const enabledDefaultsCount = defaultEnginesData.filter(engine => 
        !disabledDefaultEngines.includes(engine.id)
    ).length;
    
    enginesList.innerHTML = allEngines.map((engine, index) => {
        const isDefault = engine.isDefault;
        const isModified = engine.isModified;
        // For custom engines, calculate the actual index in customEngines array
        const customIndex = isDefault ? -1 : index - enabledDefaultsCount;
        const engineIndex = isDefault ? `default_${engine.id}` : customIndex;
        
        // Get current modifier display
        const currentModifier = engine.modifierKeys && engine.modifierKeys.length > 0 
            ? (engine.modifierKeys[0] === 'control' ? 'Ctrl' : 
               engine.modifierKeys[0].charAt(0).toUpperCase() + engine.modifierKeys[0].slice(1))
            : '';
        
        return `
            <div class="engine-item ${isDefault ? 'default-engine' : 'custom-engine'}" data-index="${engineIndex}" data-engine-id="${engine.id || ''}" data-custom-index="${customIndex}">
                <div class="engine-item-header">
                    <div class="engine-info">
                        <div class="engine-name">
                            ${escapeHtml(engine.name)}
                            ${isDefault ? `<span class="engine-badge ${isModified ? 'modified' : 'default'}">
                                ${isModified ? 'Modified' : 'Default'}
                            </span>` : '<span class="engine-badge custom">Custom</span>'}
                        </div>
                        <div class="engine-shortcut">${formatShortcutDisplay(engine)}</div>
                        <div class="engine-url">${escapeHtml(engine.url)}</div>
                    </div>
                    <div class="engine-actions">
                        <button class="engine-edit-btn" data-action="edit" data-index="${engineIndex}">Edit</button>
                        ${isDefault ? 
                            `<button class="engine-disable-btn" data-action="disable" data-engine-id="${engine.id}">Disable</button>
                             ${isModified ? `<button class="engine-reset-btn" data-action="reset" data-engine-id="${engine.id}">Reset</button>` : ''}` :
                            `<button class="engine-delete-btn" data-action="delete" data-custom-index="${customIndex}">Delete</button>`
                        }
                    </div>
                </div>
                <div class="engine-edit-form">
                    <div>
                        <label>Engine Name</label>
                        <input type="text" id="editName${engineIndex}" value="${escapeHtml(engine.name)}" maxlength="30">
                    </div>
                    <div>
                        <label>Search URL (prefix)</label>
                        <input type="url" id="editUrl${engineIndex}" value="${escapeHtml(engine.url)}" maxlength="500">
                    </div>
                    <div>
                        <label>Key</label>
                        <input type="text" id="editKey${engineIndex}" value="${engine.key.toUpperCase()}" maxlength="1" style="text-transform: uppercase;">
                    </div>
                    <div class="url-suffix-section">
                        <label>URL Suffix (after search query)</label>
                        <input type="text" id="editUrlSuffix${engineIndex}" value="${escapeHtml(engine.urlSuffix || '')}" placeholder="e.g. &param=value" maxlength="200">
                    </div>
                    <div class="modifier-recording-section">
                        <label>Modifier Key (optional)</label>
                        <div class="modifier-input-group">
                            <input type="text" id="editModifierDisplay${engineIndex}" value="${currentModifier}" placeholder="None" readonly>
                            <button type="button" class="record-modifier-btn" data-record-target="${engineIndex}">Record</button>
                            <button type="button" class="clear-modifier-btn" data-clear-target="${engineIndex}">Clear</button>
                        </div>
                    </div>
                    <div class="edit-buttons">
                        <button class="engine-add-btn engine-save-btn" data-action="save" data-index="${engineIndex}" style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);">Save</button>
                        <button class="engine-edit-btn engine-cancel-btn" data-action="cancel" data-index="${engineIndex}">Cancel</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Show disabled engines section if any
    if (disabledDefaultEngines.length > 0) {
        const disabledEnginesHtml = disabledDefaultEngines.map(engineId => {
            const originalEngine = defaultEnginesData.find(e => e.id === engineId);
            if (!originalEngine) return '';
            
            return `
                <div class="disabled-engine-item">
                    <div class="engine-info">
                        <div class="engine-name">
                            ${escapeHtml(originalEngine.name)}
                            <span class="engine-badge disabled">Disabled</span>
                        </div>
                        <div class="engine-url">${escapeHtml(originalEngine.url)}</div>
                    </div>
                    <div class="engine-actions">
                        <button class="engine-add-btn" data-action="enable" data-engine-id="${engineId}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">Enable</button>
                    </div>
                </div>
            `;
        }).join('');
        
        enginesList.innerHTML += `
            <div class="disabled-engines-section">
                <h3 style="margin: 20px 0 10px 0; color: #64748b; font-size: 16px; border-top: 1px solid #e2e8f0; padding-top: 20px;">Disabled Default Engines</h3>
                ${disabledEnginesHtml}
            </div>
        `;
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Validate engine input
function validateEngineInput(name, url, key, excludeEngineId = null) {
    const errors = [];
    
    if (!name.trim()) {
        errors.push('Engine name is required');
    }
    
    if (!url.trim()) {
        errors.push('Search URL is required');
    } else {
        try {
            new URL(url);
        } catch {
            errors.push('Invalid URL format');
        }
    }
    
    if (!key.trim()) {
        errors.push('Shortcut key is required');
    } else if (!/^[a-zA-Z]$/.test(key)) {
        errors.push('Shortcut key must be a single letter');
    }
    
    return errors;
}

// Check if key + modifier combination is already in use
// Set includeDisabled=true to also check against disabled default engines
function isKeyInUse(key, modifierKeys = [], excludeEngineId = null, excludeIndex = -1, includeDisabled = false) {
    const allEngines = getAllEngines();
    const enabledDefaultsCount = defaultEnginesData.filter(engine => 
        !disabledDefaultEngines.includes(engine.id)
    ).length;
    
    // Normalize modifier keys for comparison
    const normalizeModifiers = (mods) => {
        if (!mods || !Array.isArray(mods)) return [];
        return [...mods].sort();
    };
    
    const newModifiers = normalizeModifiers(modifierKeys);
    
    // Check enabled engines
    const conflictsWithEnabled = allEngines.some((engine, index) => {
        // Skip if this is the engine we're editing
        if (engine.isDefault && engine.id === excludeEngineId) return false;
        // For custom engines, calculate the actual index in customEngines array
        const customIndex = engine.isDefault ? -1 : index - enabledDefaultsCount;
        if (!engine.isDefault && customIndex === excludeIndex) return false;
        
        // Check if same key
        if (engine.key.toLowerCase() !== key.toLowerCase()) return false;
        
        // Check if same modifier combination
        const engineModifiers = normalizeModifiers(engine.modifierKeys);
        
        // Same key is allowed if modifiers are different
        if (newModifiers.length !== engineModifiers.length) return false;
        
        return newModifiers.every((mod, i) => mod === engineModifiers[i]);
    });
    
    if (conflictsWithEnabled) return true;
    
    // Also check disabled default engines if requested
    if (includeDisabled) {
        return disabledDefaultEngines.some(engineId => {
            if (engineId === excludeEngineId) return false;
            
            const engine = defaultEnginesData.find(e => e.id === engineId);
            if (!engine) return false;
            
            // Check if same key
            if (engine.key.toLowerCase() !== key.toLowerCase()) return false;
            
            // Check if same modifier combination
            const engineModifiers = normalizeModifiers(engine.modifierKeys);
            
            if (newModifiers.length !== engineModifiers.length) return false;
            
            return newModifiers.every((mod, i) => mod === engineModifiers[i]);
        });
    }
    
    return false;
}

// Check if a disabled engine's key conflicts with existing engines
function getConflictingEngine(engineId) {
    const engine = defaultEnginesData.find(e => e.id === engineId);
    if (!engine) return null;
    
    const normalizeModifiers = (mods) => {
        if (!mods || !Array.isArray(mods)) return [];
        return [...mods].sort();
    };
    
    const engineModifiers = normalizeModifiers(engine.modifierKeys);
    const allEngines = getAllEngines();
    
    for (const existingEngine of allEngines) {
        if (existingEngine.key.toLowerCase() !== engine.key.toLowerCase()) continue;
        
        const existingModifiers = normalizeModifiers(existingEngine.modifierKeys);
        
        if (engineModifiers.length !== existingModifiers.length) continue;
        
        if (engineModifiers.every((mod, i) => mod === existingModifiers[i])) {
            return existingEngine;
        }
    }
    
    return null;
}

// State for engine modifier recording
let recordingEngineModifier = null; // 'new' or engine index
let recordedEngineModifierKey = null;

// Handle engine modifier key recording
function handleEngineModifierRecord(e) {
    if (!recordingEngineModifier) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    let display;
    if (recordingEngineModifier === 'new') {
        display = document.getElementById('engineModifierKeyDisplay');
    } else {
        display = document.getElementById(`editModifierDisplay${recordingEngineModifier}`);
    }
    
    // Only allow modifier keys
    const isModifierKey = ['Control', 'Alt', 'Shift', 'Meta'].includes(e.key);
    
    if (isModifierKey) {
        let displayName = e.key;
        if (e.key === 'Control') displayName = 'Ctrl';
        
        recordedEngineModifierKey = {
            key: e.key.toLowerCase(),
            display: displayName
        };
        
        if (display) {
            display.value = displayName;
        }
        
        // Stop recording after capturing the key
        stopEngineModifierRecording();
    }
}

// Stop recording engine modifier
function stopEngineModifierRecording() {
    if (!recordingEngineModifier) return;
    
    let button;
    if (recordingEngineModifier === 'new') {
        button = document.getElementById('recordEngineModifierBtn');
    } else {
        button = document.querySelector(`button[data-record-target="${recordingEngineModifier}"]`);
    }
    
    if (button) {
        button.textContent = 'Record';
        button.classList.remove('recording');
    }
    
    document.removeEventListener('keydown', handleEngineModifierRecord, true);
    
    recordingEngineModifier = null;
}

// Start recording engine modifier
function startEngineModifierRecording(target) {
    // Stop any existing recording
    if (recordingEngineModifier) {
        stopEngineModifierRecording();
    }
    
    recordingEngineModifier = target;
    recordedEngineModifierKey = null;
    
    let button;
    let display;
    
    if (target === 'new') {
        button = document.getElementById('recordEngineModifierBtn');
        display = document.getElementById('engineModifierKeyDisplay');
    } else {
        button = document.querySelector(`button[data-record-target="${target}"]`);
        display = document.getElementById(`editModifierDisplay${target}`);
    }
    
    if (button) {
        button.textContent = 'Press key...';
        button.classList.add('recording');
    }
    if (display) {
        display.value = '';
        display.placeholder = 'Press modifier...';
    }
    
    // Use capture phase to intercept before other handlers
    document.addEventListener('keydown', handleEngineModifierRecord, true);
}

// Clear engine modifier
function clearEngineModifier(target) {
    // Only clear the global recordedEngineModifierKey for new engines
    if (target === 'new') {
        recordedEngineModifierKey = null;
    }
    
    let display;
    if (target === 'new') {
        display = document.getElementById('engineModifierKeyDisplay');
    } else {
        display = document.getElementById(`editModifierDisplay${target}`);
    }
    
    if (display) {
        display.value = '';
        display.placeholder = 'None';
    }
}

// Make functions globally accessible
window.startEngineModifierRecording = startEngineModifierRecording;
window.stopEngineModifierRecording = stopEngineModifierRecording;
window.clearEngineModifier = clearEngineModifier;

// Add new engine - make it so that engines can have the same key if they do not share the same requires shift status
function addEngine() {
    const name = document.getElementById('engineName').value.trim();
    const url = document.getElementById('engineUrl').value.trim();
    const key = document.getElementById('engineKey').value.trim().toLowerCase();
    const urlSuffix = document.getElementById('engineUrlSuffix').value.trim();
    
    // Get modifier keys from the recorded modifier
    const modifierKeys = recordedEngineModifierKey ? [recordedEngineModifierKey.key] : [];
    
    const errors = validateEngineInput(name, url, key);
    
    if (isKeyInUse(key, modifierKeys)) {
        const modDisplay = modifierKeys.length > 0 ? `${recordedEngineModifierKey.display}+` : '';
        errors.push(`Key "${modDisplay}${key.toUpperCase()}" is already in use`);
    }
    
    if (errors.length > 0) {
        alert('Please fix the following errors:\n\n' + errors.join('\n'));
        return;
    }
    
    // Check if key conflicts with a disabled default engine and warn user
    if (isKeyInUse(key, modifierKeys, null, -1, true)) {
        const modDisplay = modifierKeys.length > 0 ? `${recordedEngineModifierKey.display}+` : '';
        if (!confirm(`Warning: Key "${modDisplay}${key.toUpperCase()}" is used by a disabled default engine. If you re-enable that engine later, there will be a conflict.\n\nDo you want to continue anyway?`)) {
            return;
        }
    }
    
    customEngines.push({ 
        name, 
        url, 
        urlSuffix,
        key,
        modifierKeys: modifierKeys
    });
    saveCustomEngines();
    renderEnginesList();
    
    // Clear form
    document.getElementById('engineName').value = '';
    document.getElementById('engineUrl').value = '';
    document.getElementById('engineKey').value = '';
    document.getElementById('engineUrlSuffix').value = '';
    clearEngineModifier('new');
    recordedEngineModifierKey = null;
}

// Make addEngine globally accessible
window.addEngine = addEngine;
window.startEngineModifierRecording = startEngineModifierRecording;
window.clearEngineModifier = clearEngineModifier;

// Edit engine
function editEngine(engineIndex) {
    const engineItem = document.querySelector(`[data-index="${engineIndex}"]`);
    engineItem.classList.add('editing');
}

// Cancel edit
function cancelEngineEdit(engineIndex) {
    const engineItem = document.querySelector(`[data-index="${engineIndex}"]`);
    engineItem.classList.remove('editing');
    
    // Reset values
    if (engineIndex.toString().startsWith('default_')) {
        const engineId = engineIndex.replace('default_', '');
        const engine = defaultEnginesData.find(e => e.id === engineId);
        document.getElementById(`editName${engineIndex}`).value = engine.name;
        document.getElementById(`editUrl${engineIndex}`).value = engine.url;
        document.getElementById(`editKey${engineIndex}`).value = engine.key.toUpperCase();
        document.getElementById(`editUrlSuffix${engineIndex}`).value = engine.urlSuffix || '';
        
        // Reset modifier display
        const modifierDisplay = document.getElementById(`editModifierDisplay${engineIndex}`);
        if (modifierDisplay) {
            const currentModifier = engine.modifierKeys && engine.modifierKeys.length > 0 
                ? (engine.modifierKeys[0] === 'control' ? 'Ctrl' : 
                   engine.modifierKeys[0].charAt(0).toUpperCase() + engine.modifierKeys[0].slice(1))
                : '';
            modifierDisplay.value = currentModifier;
        }
    } else {
        const engine = customEngines[engineIndex];
        document.getElementById(`editName${engineIndex}`).value = engine.name;
        document.getElementById(`editUrl${engineIndex}`).value = engine.url;
        document.getElementById(`editKey${engineIndex}`).value = engine.key.toUpperCase();
        document.getElementById(`editUrlSuffix${engineIndex}`).value = engine.urlSuffix || '';
        
        // Reset modifier display
        const modifierDisplay = document.getElementById(`editModifierDisplay${engineIndex}`);
        if (modifierDisplay) {
            const currentModifier = engine.modifierKeys && engine.modifierKeys.length > 0 
                ? (engine.modifierKeys[0] === 'control' ? 'Ctrl' : 
                   engine.modifierKeys[0].charAt(0).toUpperCase() + engine.modifierKeys[0].slice(1))
                : '';
            modifierDisplay.value = currentModifier;
        }
    }
}

// Save engine edit
function saveEngineEdit(engineIndex) {
    const name = document.getElementById(`editName${engineIndex}`).value.trim();
    const url = document.getElementById(`editUrl${engineIndex}`).value.trim();
    const key = document.getElementById(`editKey${engineIndex}`).value.trim().toLowerCase();
    const urlSuffix = document.getElementById(`editUrlSuffix${engineIndex}`).value.trim();
    
    const isDefault = engineIndex.toString().startsWith('default_');
    const excludeId = isDefault ? engineIndex.replace('default_', '') : null;
    const excludeIndex = isDefault ? -1 : parseInt(engineIndex);
    
    // Get modifier keys from the display field or data attribute
    const modifierDisplay = document.getElementById(`editModifierDisplay${engineIndex}`);
    let modifierKeys = [];
    
    if (modifierDisplay && modifierDisplay.value.trim()) {
        const modValue = modifierDisplay.value.trim().toLowerCase();
        if (modValue === 'ctrl' || modValue === 'control') {
            modifierKeys = ['control'];
        } else if (modValue === 'shift') {
            modifierKeys = ['shift'];
        } else if (modValue === 'alt') {
            modifierKeys = ['alt'];
        } else if (modValue === 'meta') {
            modifierKeys = ['meta'];
        }
    }
    
    const errors = validateEngineInput(name, url, key, excludeId);
    
    if (isKeyInUse(key, modifierKeys, excludeId, excludeIndex)) {
        const modDisplayStr = modifierKeys.length > 0 ? `${modifierDisplay.value.trim()}+` : '';
        errors.push(`Key "${modDisplayStr}${key.toUpperCase()}" is already in use`);
    }
    
    if (errors.length > 0) {
        alert('Please fix the following errors:\n\n' + errors.join('\n'));
        return;
    }
    
    // For custom engines, check if key conflicts with a disabled default engine and warn user
    if (!isDefault && isKeyInUse(key, modifierKeys, excludeId, excludeIndex, true)) {
        const modDisplayStr = modifierKeys.length > 0 ? `${modifierDisplay.value.trim()}+` : '';
        if (!confirm(`Warning: Key "${modDisplayStr}${key.toUpperCase()}" is used by a disabled default engine. If you re-enable that engine later, there will be a conflict.\n\nDo you want to continue anyway?`)) {
            return;
        }
    }
    
    if (isDefault) {
        const engineId = engineIndex.replace('default_', '');
        const engineData = defaultEnginesData.find(e => e.id === engineId);
        
        engineData.name = name;
        engineData.url = url;
        engineData.urlSuffix = urlSuffix;
        engineData.key = key;
        engineData.modifierKeys = modifierKeys;
        engineData.isModified = true;
    } else {
        customEngines[engineIndex] = { 
            name, 
            url, 
            urlSuffix,
            key,
            modifierKeys: modifierKeys
        };
    }
    
    saveCustomEngines();
    renderEnginesList();
}

// Delete custom engine
function deleteEngine(index) {
    const engine = customEngines[index];
    if (confirm(`Are you sure you want to delete "${engine.name}"?`)) {
        customEngines.splice(index, 1);
        saveCustomEngines();
        renderEnginesList();
    }
}

// Disable default engine
function disableDefaultEngine(engineId) {
    const engine = defaultEnginesData.find(e => e.id === engineId);
    if (confirm(`Are you sure you want to disable "${engine.name}"?`)) {
        disabledDefaultEngines.push(engineId);
        saveCustomEngines();
        renderEnginesList();
    }
}

// Enable default engine
function enableDefaultEngine(engineId) {
    const conflictingEngine = getConflictingEngine(engineId);
    const engine = defaultEnginesData.find(e => e.id === engineId);
    
    if (conflictingEngine) {
        const modDisplay = engine.modifierKeys?.length 
            ? engine.modifierKeys.map(m => m === 'control' ? 'Ctrl' : m.charAt(0).toUpperCase() + m.slice(1)).join('+') + '+' 
            : '';
        alert(`Cannot enable "${engine.name}" because its shortcut (${modDisplay}${engine.key.toUpperCase()}) conflicts with "${conflictingEngine.name}". Please change or delete the conflicting engine first.`);
        return;
    }
    
    disabledDefaultEngines = disabledDefaultEngines.filter(id => id !== engineId);
    saveCustomEngines();
    renderEnginesList();
}

// Reset default engine to original settings
function resetDefaultEngine(engineId) {
    const engine = defaultEnginesData.find(e => e.id === engineId);
    if (confirm(`Are you sure you want to reset "${engine.name}" to default settings?`)) {
        // Find original settings and restore them
        const originalSettings = {
            'herewego': { name: 'herewego', key: 'm', url: 'https://wego.here.com/discover/', urlSuffix: '?map=59.94914,10.65364,10', modifierKeys: [] },
            'shopping': { name: 'DuckDuckGo', key: 's', url: 'https://duckduckgo.com/?e=&t=h_&q=', urlSuffix: '&ia=shopping&iax=shopping', modifierKeys: [] },
            'BraveLeo': { name: 'BraveAI', key: 'l', url: 'https://search.brave.com/ask?q=', urlSuffix: '', modifierKeys: [] },
            'Translate': { name: 'Translate', key: 't', url: 'https://translate.google.com/?sl=auto&tl=de,no,en&text=&q=', urlSuffix: '', modifierKeys: [] },
            'openHours': { name: 'OpenHours', key: 'o', url: 'https://apningstider.com/spots?loc=&q=', urlSuffix: '', modifierKeys: [] },
            'youtube': { name: 'YouTube', key: 'y', url: 'https://www.youtube.com/results?search_query=', urlSuffix: '', modifierKeys: [] },
            'wikipedia': { name: 'Wikipedia', key: 'w', url: 'https://en.wikipedia.org/wiki/Special:Search?search=', urlSuffix: '', modifierKeys: [] },
            'amazonDE': { name: 'Amazon.de', key: 'a', url: 'https://www.amazon.de/s?k=', urlSuffix: '', modifierKeys: [] },
            'amazonCOM': { name: 'Amazon.com', key: 'z', url: 'https://www.amazon.com/s?k=', urlSuffix: '', modifierKeys: [] },
            'klarna': { name: 'Klarna', key: 'k', url: 'https://www.klarna.com/no/shopping/results?q=', urlSuffix: '', modifierKeys: [] },
            'prisjakt': { name: 'Prisjakt', key: 'p', url: 'https://www.prisjakt.no/search?query=', urlSuffix: '', modifierKeys: [] },
            'ikea': { name: 'IKEA', key: 'i', url: 'https://www.ikea.com/no/no/search/?q=', urlSuffix: '', modifierKeys: [] },
            'finn': { name: 'Finn.no', key: 'f', url: 'https://www.finn.no/recommerce/forsale/search?q=', urlSuffix: '', modifierKeys: [] },
            'brave': { name: 'Brave Search', key: 'b', url: 'https://search.brave.com/search?q=', urlSuffix: '', modifierKeys: [] }
        };
        
        const original = originalSettings[engineId];
        if (original) {
            Object.assign(engine, original);
            engine.isDefault = true;
            engine.isModified = false;
            saveCustomEngines();
            renderEnginesList();
        }
    }
}

// Make functions globally accessible
window.editEngine = editEngine;
window.cancelEngineEdit = cancelEngineEdit;
window.saveEngineEdit = saveEngineEdit;
window.deleteEngine = deleteEngine;
window.disableDefaultEngine = disableDefaultEngine;
window.enableDefaultEngine = enableDefaultEngine;
window.resetDefaultEngine = resetDefaultEngine;

// Modal controls
function openEngineModal() {
    document.getElementById('engineModal').classList.add('show');
    loadCustomEngines();
}

function closeEngineModal() {
    document.getElementById('engineModal').classList.remove('show');
}

// Event listeners for engine manager
document.getElementById('manageEnginesButton').addEventListener('click', openEngineModal);
document.getElementById('closeEngineModal').addEventListener('click', closeEngineModal);
document.getElementById('addEngineBtn').addEventListener('click', addEngine);

// Event delegation for engine list actions
document.getElementById('enginesList').addEventListener('click', (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    
    const action = button.dataset.action;
    const engineId = button.dataset.engineId;
    const index = button.dataset.index;
    const customIndex = button.dataset.customIndex;
    
    switch (action) {
        case 'edit':
            editEngine(index);
            break;
        case 'save':
            saveEngineEdit(index);
            break;
        case 'cancel':
            cancelEngineEdit(index);
            break;
        case 'delete':
            deleteEngine(parseInt(customIndex));
            break;
        case 'disable':
            disableDefaultEngine(engineId);
            break;
        case 'enable':
            enableDefaultEngine(engineId);
            break;
        case 'reset':
            resetDefaultEngine(engineId);
            break;
    }
});

// Close modal when clicking outside
document.getElementById('engineModal').addEventListener('click', (e) => {
    if (e.target.id === 'engineModal') {
        closeEngineModal();
    }
});

// Auto-uppercase key input
document.getElementById('engineKey').addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
});

// Enter key to add engine
document.getElementById('engineKey').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addEngine();
    }
});

// Event listeners for new engine modifier recording
document.getElementById('recordEngineModifierBtn').addEventListener('click', () => {
    startEngineModifierRecording('new');
});

document.getElementById('clearEngineModifierBtn').addEventListener('click', () => {
    clearEngineModifier('new');
});

// Event delegation for edit form modifier buttons
document.getElementById('enginesList').addEventListener('click', (e) => {
    const recordBtn = e.target.closest('button[data-record-target]');
    const clearBtn = e.target.closest('button[data-clear-target]');
    
    if (recordBtn) {
        const target = recordBtn.dataset.recordTarget;
        startEngineModifierRecording(target);
    }
    
    if (clearBtn) {
        const target = clearBtn.dataset.clearTarget;
        clearEngineModifier(target);
    }
});

// Update shortcut preview when engine modifier changes
const originalUpdateExamples = updateExamples;
updateExamples = function() {
    originalUpdateExamples();
    updateEngineShortcutPreview();
};

// Load custom engines on page load
loadCustomEngines();

// ============================================
// Weather Locations Management
// ============================================

const DEFAULT_WEATHER_LOCATIONS = {
    "'t": { name: 'Tryvann', lat: 59.9847, lon: 10.6678 },
    "'w": { name: 'Oslo Røa', lat: 59.9473, lon: 10.6348 }
};

let weatherLocations = { ...DEFAULT_WEATHER_LOCATIONS };

// Load weather locations from storage
async function loadWeatherLocations() {
    const result = await chrome.storage.sync.get({ weatherLocations: null });
    if (result.weatherLocations && Object.keys(result.weatherLocations).length > 0) {
        weatherLocations = result.weatherLocations;
    } else {
        weatherLocations = { ...DEFAULT_WEATHER_LOCATIONS };
    }
    renderWeatherLocations();
}

// Save weather locations to storage
async function saveWeatherLocations() {
    await chrome.storage.sync.set({ weatherLocations });
}

// Render weather locations list
function renderWeatherLocations() {
    const container = document.getElementById('weatherLocationsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (const [prefix, location] of Object.entries(weatherLocations)) {
        const item = document.createElement('div');
        item.className = 'weather-location-item';
        item.innerHTML = `
            <span class="prefix">${prefix}</span>
            <span class="name">${location.name}</span>
            <span class="coords">${location.lat}, ${location.lon}</span>
            <button class="delete-btn" data-prefix="${prefix}">Delete</button>
        `;
        container.appendChild(item);
    }
    
    // Add delete event listeners
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const prefix = btn.dataset.prefix;
            delete weatherLocations[prefix];
            saveWeatherLocations();
            renderWeatherLocations();
        });
    });
}

// Add new weather location
function addWeatherLocation() {
    const prefixInput = document.getElementById('newWeatherPrefix');
    const nameInput = document.getElementById('newWeatherName');
    const latInput = document.getElementById('newWeatherLat');
    const lonInput = document.getElementById('newWeatherLon');
    
    let prefix = prefixInput.value.trim().toLowerCase();
    const name = nameInput.value.trim();
    const lat = parseFloat(latInput.value.trim());
    const lon = parseFloat(lonInput.value.trim());
    
    // Validate inputs
    if (!prefix) {
        alert(`Please enter a prefix (e.g., ${currentServicePrefix}w)`);
        return;
    }
    
    // Ensure prefix starts with the current service prefix char
    if (!prefix.startsWith(currentServicePrefix)) {
        if (SVC_PREFIX_CHARS.includes(prefix[0])) prefix = prefix.slice(1);
        prefix = currentServicePrefix + prefix;
    }

    if (!name) {
        alert('Please enter a location name');
        return;
    }
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
        alert('Please enter a valid latitude (-90 to 90)');
        return;
    }
    
    if (isNaN(lon) || lon < -180 || lon > 180) {
        alert('Please enter a valid longitude (-180 to 180)');
        return;
    }
    
    // Add to locations
    weatherLocations[prefix] = { name, lat, lon };
    saveWeatherLocations();
    renderWeatherLocations();
    
    // Clear inputs
    prefixInput.value = '';
    nameInput.value = '';
    latInput.value = '';
    lonInput.value = '';
}

// Add weather location button handler
document.getElementById('addWeatherLocation')?.addEventListener('click', addWeatherLocation);

// Enter key to add weather location
['newWeatherPrefix', 'newWeatherName', 'newWeatherLat', 'newWeatherLon'].forEach(id => {
    document.getElementById(id)?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addWeatherLocation();
        }
    });
});

// Load weather locations on page load
loadWeatherLocations();

// ============================================
// Currency Configuration Management
// ============================================

const DEFAULT_TARGET_CURRENCIES = ['NOK', 'EUR', 'USD'];

let targetCurrencies = [...DEFAULT_TARGET_CURRENCIES];

// Load target currencies from storage
async function loadTargetCurrencies() {
    const result = await chrome.storage.sync.get({ targetCurrencies: null });
    if (result.targetCurrencies && Array.isArray(result.targetCurrencies) && result.targetCurrencies.length > 0) {
        targetCurrencies = result.targetCurrencies;
    } else {
        targetCurrencies = [...DEFAULT_TARGET_CURRENCIES];
    }
    renderCurrencies();
}

// Save target currencies to storage
async function saveTargetCurrencies() {
    await chrome.storage.sync.set({ targetCurrencies });
}

// Render currencies list
function renderCurrencies() {
    const container = document.getElementById('currencyList');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (const currency of targetCurrencies) {
        const item = document.createElement('div');
        item.className = 'currency-item';
        item.innerHTML = `
            <span class="currency-code">${currency}</span>
            <button class="delete-btn" data-currency="${currency}">×</button>
        `;
        container.appendChild(item);
    }
    
    // Add delete event listeners
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const currency = btn.dataset.currency;
            targetCurrencies = targetCurrencies.filter(c => c !== currency);
            saveTargetCurrencies();
            renderCurrencies();
        });
    });
}

// Add new currency
function addCurrency() {
    const select = document.getElementById('newCurrencySelect');
    const currency = select.value.trim().toUpperCase();
    
    if (!currency) {
        alert('Please select a currency');
        return;
    }
    
    if (targetCurrencies.includes(currency)) {
        alert('Currency already added');
        return;
    }
    
    if (targetCurrencies.length >= 10) {
        alert('Maximum 10 currencies allowed');
        return;
    }
    
    targetCurrencies.push(currency);
    saveTargetCurrencies();
    renderCurrencies();
    
    // Reset select
    select.value = '';
}

// Add currency button handler
document.getElementById('addCurrency')?.addEventListener('click', addCurrency);

// Load target currencies on page load
loadTargetCurrencies();

// ============================================
// Translation Configuration Management
// ============================================

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
    'id': { name: 'Indonesian', flag: '🇮🇩' },
    'auto': { name: 'Auto-detect', flag: '🔍' }
};

const DEFAULT_TRANSLATION_PREFIXES = {
    "'e": 'en',
    "'n": 'no',
    "'g": 'de',
    "'a": 'auto'
};
const DEFAULT_TRANSLATION_TARGETS = ['en', 'de', 'no'];

let translationPrefixes = { ...DEFAULT_TRANSLATION_PREFIXES };
let translationTargets = [...DEFAULT_TRANSLATION_TARGETS];

// Load translation settings from storage
async function loadTranslationSettings() {
    const result = await chrome.storage.sync.get({ 
        translationPrefixes: null,
        translationTargets: null 
    });
    if (result.translationPrefixes && Object.keys(result.translationPrefixes).length > 0) {
        translationPrefixes = result.translationPrefixes;
    } else {
        translationPrefixes = { ...DEFAULT_TRANSLATION_PREFIXES };
    }
    if (result.translationTargets && Array.isArray(result.translationTargets) && result.translationTargets.length > 0) {
        translationTargets = result.translationTargets;
    } else {
        translationTargets = [...DEFAULT_TRANSLATION_TARGETS];
    }
    renderTranslationPrefixes();
    renderTranslationTargets();
}

// Save translation prefixes to storage
async function saveTranslationPrefixes() {
    await chrome.storage.sync.set({ translationPrefixes });
}

// Save translation targets to storage
async function saveTranslationTargets() {
    await chrome.storage.sync.set({ translationTargets });
}

// Render translation prefixes list
function renderTranslationPrefixes() {
    const container = document.getElementById('translationPrefixList');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (const [prefix, langCode] of Object.entries(translationPrefixes)) {
        const langInfo = ALL_LANGUAGES[langCode] || { name: langCode, flag: '🌐' };
        const item = document.createElement('div');
        item.className = 'translation-prefix-item';
        item.innerHTML = `
            <span class="prefix-code">${prefix}</span>
            <span class="lang-name">${langInfo.flag} ${langInfo.name}</span>
            <button class="delete-btn" data-prefix="${prefix}">×</button>
        `;
        container.appendChild(item);
    }
    
    // Add delete event listeners
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const prefix = btn.dataset.prefix;
            delete translationPrefixes[prefix];
            saveTranslationPrefixes();
            renderTranslationPrefixes();
        });
    });
}

// Render translation targets list
function renderTranslationTargets() {
    const container = document.getElementById('translationTargetList');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (const langCode of translationTargets) {
        const langInfo = ALL_LANGUAGES[langCode] || { name: langCode, flag: '🌐' };
        const item = document.createElement('div');
        item.className = 'translation-target-item';
        item.innerHTML = `
            <span class="lang-flag">${langInfo.flag}</span>
            <span class="lang-name">${langInfo.name}</span>
            <button class="delete-btn" data-lang="${langCode}">×</button>
        `;
        container.appendChild(item);
    }
    
    // Add delete event listeners
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            translationTargets = translationTargets.filter(l => l !== lang);
            saveTranslationTargets();
            renderTranslationTargets();
        });
    });
}

// Add new translation prefix
function addTranslationPrefix() {
    const prefixInput = document.getElementById('newTranslationPrefix');
    const langSelect = document.getElementById('newTranslationPrefixLang');
    
    let prefix = prefixInput.value.trim().toLowerCase();
    const langCode = langSelect.value;
    
    if (!prefix) {
        alert(`Please enter a prefix (e.g., ${currentServicePrefix}e)`);
        return;
    }
    
    // Ensure prefix starts with the current service prefix char
    if (!prefix.startsWith(currentServicePrefix)) {
        if (SVC_PREFIX_CHARS.includes(prefix[0])) prefix = prefix.slice(1);
        prefix = currentServicePrefix + prefix;
    }
    
    if (!langCode) {
        alert('Please select a language');
        return;
    }
    
    if (translationPrefixes[prefix]) {
        alert('This prefix is already in use');
        return;
    }
    
    translationPrefixes[prefix] = langCode;
    saveTranslationPrefixes();
    renderTranslationPrefixes();
    
    // Clear inputs
    prefixInput.value = '';
    langSelect.value = '';
}

// Add new translation target
function addTranslationTarget() {
    const langSelect = document.getElementById('newTranslationTarget');
    const langCode = langSelect.value;
    
    if (!langCode) {
        alert('Please select a language');
        return;
    }
    
    if (translationTargets.includes(langCode)) {
        alert('Language already added');
        return;
    }
    
    if (translationTargets.length >= 5) {
        alert('Maximum 5 target languages allowed');
        return;
    }
    
    translationTargets.push(langCode);
    saveTranslationTargets();
    renderTranslationTargets();
    
    // Reset select
    langSelect.value = '';
}

// Add translation prefix button handler
document.getElementById('addTranslationPrefix')?.addEventListener('click', addTranslationPrefix);

// Add translation target button handler
document.getElementById('addTranslationTarget')?.addEventListener('click', addTranslationTarget);

// Enter key handlers
document.getElementById('newTranslationPrefix')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTranslationPrefix();
    }
});

// Load translation settings on page load
loadTranslationSettings();

// ============ Definition Settings ============

const DEFAULT_DEFINITION_PREFIXES = {
    "'d": 'en'
};

let definitionPrefixes = { ...DEFAULT_DEFINITION_PREFIXES };

// Definition modal functions
function openDefinitionModal() {
    document.getElementById('definitionModal').classList.add('show');
}

function closeDefinitionModal() {
    document.getElementById('definitionModal').classList.remove('show');
}

document.getElementById('manageDefinitionButton')?.addEventListener('click', openDefinitionModal);
document.getElementById('closeDefinitionModal')?.addEventListener('click', closeDefinitionModal);
document.getElementById('definitionModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'definitionModal') closeDefinitionModal();
});

// Load definition settings from storage
async function loadDefinitionSettings() {
    const result = await chrome.storage.sync.get({ 
        definitionPrefixes: null
    });
    if (result.definitionPrefixes && Object.keys(result.definitionPrefixes).length > 0) {
        definitionPrefixes = result.definitionPrefixes;
    } else {
        definitionPrefixes = { ...DEFAULT_DEFINITION_PREFIXES };
    }
    renderDefinitionPrefixes();
}

// Save definition prefixes to storage
async function saveDefinitionPrefixes() {
    await chrome.storage.sync.set({ definitionPrefixes });
}

// Render definition prefixes list
function renderDefinitionPrefixes() {
    const container = document.getElementById('definitionPrefixList');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (const [prefix, langCode] of Object.entries(definitionPrefixes)) {
        const langInfo = ALL_LANGUAGES[langCode] || { name: langCode, flag: '🌐' };
        const item = document.createElement('div');
        item.className = 'translation-prefix-item';
        item.innerHTML = `
            <span class="prefix-code">${prefix}</span>
            <span class="lang-name">${langInfo.flag} ${langInfo.name}</span>
            <button class="delete-btn" data-prefix="${prefix}">×</button>
        `;
        container.appendChild(item);
    }
    
    // Add delete event listeners
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const prefix = btn.dataset.prefix;
            delete definitionPrefixes[prefix];
            saveDefinitionPrefixes();
            renderDefinitionPrefixes();
        });
    });
}

// Add new definition prefix
function addDefinitionPrefix() {
    const prefixInput = document.getElementById('newDefinitionPrefix');
    const langSelect = document.getElementById('newDefinitionLang');
    
    let prefix = prefixInput.value.trim().toLowerCase();
    const langCode = langSelect.value;
    
    if (!prefix) {
        alert(`Please enter a prefix (e.g., ${currentServicePrefix}d)`);
        return;
    }
    
    // Ensure prefix starts with the current service prefix char
    if (!prefix.startsWith(currentServicePrefix)) {
        if (SVC_PREFIX_CHARS.includes(prefix[0])) prefix = prefix.slice(1);
        prefix = currentServicePrefix + prefix;
    }
    
    if (!langCode) {
        alert('Please select a language');
        return;
    }
    
    if (definitionPrefixes[prefix]) {
        alert('This prefix is already in use');
        return;
    }
    
    definitionPrefixes[prefix] = langCode;
    saveDefinitionPrefixes();
    renderDefinitionPrefixes();
    
    // Clear inputs
    prefixInput.value = '';
    langSelect.value = '';
}

// Add definition prefix button handler
document.getElementById('addDefinitionPrefix')?.addEventListener('click', addDefinitionPrefix);

// Enter key handler
document.getElementById('newDefinitionPrefix')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addDefinitionPrefix();
    }
});

// Load definition settings on page load
loadDefinitionSettings();
// ============================================
// HELP MODALS FUNCTIONALITY
// ============================================

// Initialize help modals
function initHelpModals() {
    // Get all "Learn more" buttons
    const learnMoreButtons = document.querySelectorAll('.hint-learn-more');
    
    learnMoreButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.dataset.modal;
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('show');
            }
        });
    });
    
    // Get all help modals
    const helpModals = document.querySelectorAll('.help-modal');
    
    helpModals.forEach(modal => {
        // Close button handler
        const closeBtn = modal.querySelector('.help-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('show');
            });
        }
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
    
    // Escape key to close any open help modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            helpModals.forEach(modal => {
                modal.classList.remove('show');
            });
        }
    });
}

// Initialize help modals when DOM is ready
document.addEventListener('DOMContentLoaded', initHelpModals);

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initHelpModals();
}

// ============================================
// COLLAPSIBLE SETTINGS SECTION
// ============================================

function initCollapsibleSettings() {
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsContent = document.getElementById('settingsCollapsibleContent');
    
    if (!settingsToggle || !settingsContent) return;
    
    // Load saved state from localStorage - default is collapsed
    // Only expand if explicitly saved as 'false' (meaning user expanded it)
    const isCollapsed = localStorage.getItem('settingsSectionCollapsed') !== 'false';
    
    if (!isCollapsed) {
        // User previously had it expanded, so expand it
        settingsToggle.classList.remove('collapsed');
        settingsContent.classList.remove('hidden');
    }
    
    settingsToggle.addEventListener('click', () => {
        const willCollapse = !settingsToggle.classList.contains('collapsed');
        
        settingsToggle.classList.toggle('collapsed');
        settingsContent.classList.toggle('hidden');
        
        // Save state to localStorage
        localStorage.setItem('settingsSectionCollapsed', willCollapse);
    });
}

// Initialize collapsible settings when DOM is ready
document.addEventListener('DOMContentLoaded', initCollapsibleSettings);

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initCollapsibleSettings, 0);
}

// ============================================
// DEFAULT SEARCH ENGINE MANAGEMENT
// ============================================

const PRESET_ENGINES = {
    ddg:       'https://duckduckgo.com/?q=',
    brave:     'https://search.brave.com/search?q=',
    google:    'https://www.google.com/search?q=',
    startpage: 'https://www.startpage.com/search?q='
};

function loadSearchEngineSetting(savedUrl, savedCustomUrl) {
    const customRow = document.getElementById('customSearchEngineRow');
    const customInput = document.getElementById('customSearchEngineUrl');

    // Determine which preset matches, or use custom
    let selectedPreset = 'ddg'; // default
    if (savedUrl) {
        const matchedPreset = Object.entries(PRESET_ENGINES).find(([, url]) => url === savedUrl);
        if (matchedPreset) {
            selectedPreset = matchedPreset[0];
        } else {
            selectedPreset = 'custom';
            if (customInput) customInput.value = savedUrl;
        }
    }

    // Set radio
    const radio = document.querySelector(`input[name="defaultSearchEngine"][value="${selectedPreset}"]`);
    if (radio) radio.checked = true;

    // Show/hide custom row
    if (customRow) customRow.style.display = selectedPreset === 'custom' ? 'block' : 'none';

    updateEngineRadioStyles(selectedPreset);
}

function updateEngineRadioStyles(selected) {
    ['ddg', 'brave', 'google', 'startpage', 'custom'].forEach(id => {
        const label = document.getElementById(`engine-radio-${id}`);
        if (!label) return;
        if (id === selected) {
            label.style.borderColor = '#667eea';
            label.style.background = 'linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)';
            label.style.fontWeight = '600';
        } else {
            label.style.borderColor = '#e2e8f0';
            label.style.background = '#f7fafc';
            label.style.fontWeight = '400';
        }
    });
}

async function saveDefaultSearchEngine() {
    const selected = document.querySelector('input[name="defaultSearchEngine"]:checked')?.value || 'ddg';
    let url;
    if (selected === 'custom') {
        const customInput = document.getElementById('customSearchEngineUrl');
        url = customInput?.value?.trim() || PRESET_ENGINES.ddg;
        // Validate URL
        try { new URL(url); } catch { url = PRESET_ENGINES.ddg; }
    } else {
        url = PRESET_ENGINES[selected] || PRESET_ENGINES.ddg;
    }
    await chrome.storage.sync.set({ defaultSearchEngine: url });
}

// Wire up radio buttons
document.querySelectorAll('input[name="defaultSearchEngine"]').forEach(radio => {
    radio.addEventListener('change', () => {
        const selected = radio.value;
        const customRow = document.getElementById('customSearchEngineRow');
        if (customRow) customRow.style.display = selected === 'custom' ? 'block' : 'none';
        updateEngineRadioStyles(selected);
        saveDefaultSearchEngine();
    });
});

// Wire up custom URL input
document.getElementById('customSearchEngineUrl')?.addEventListener('input', () => {
    saveDefaultSearchEngine();
});

// ============================================
// GROQ API KEY MANAGEMENT
// ============================================

async function loadGroqApiKey() {
    const { groqApiKey } = await chrome.storage.sync.get({ groqApiKey: '' });
    const input = document.getElementById('groqApiKey');
    if (input && groqApiKey) {
        input.value = groqApiKey;
    }
}

async function saveGroqApiKey() {
    const input = document.getElementById('groqApiKey');
    const key = input?.value?.trim() || '';
    await chrome.storage.sync.set({ groqApiKey: key });

    const msg = document.getElementById('groqApiKeySavedMsg');
    if (msg) {
        msg.style.display = 'block';
        setTimeout(() => { msg.style.display = 'none'; }, 2500);
    }
}

document.getElementById('saveGroqApiKey')?.addEventListener('click', saveGroqApiKey);

document.getElementById('toggleGroqKeyVisibility')?.addEventListener('click', function() {
    const input = document.getElementById('groqApiKey');
    if (!input) return;
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    this.textContent = isHidden ? 'Hide' : 'Show';
});

// Load on page start
loadGroqApiKey();

// ============================================
// AI TRIGGER SUFFIX MANAGEMENT
// ============================================

const AI_TRIGGER_IDS = {
    "''": 'aitrig-sq',
    '""': 'aitrig-dq',
    '..': 'aitrig-dots',
    '!!': 'aitrig-exc',
    '??': 'aitrig-qq'
};

function updateAiTriggerStyles(selected) {
    Object.entries(AI_TRIGGER_IDS).forEach(([val, id]) => {
        const label = document.getElementById(id);
        if (!label) return;
        if (val === selected) {
            label.style.borderColor = '#667eea';
            label.style.background = 'linear-gradient(135deg,#ede9fe 0%,#dbeafe 100%)';
            label.style.fontWeight = '600';
        } else {
            label.style.borderColor = '#e2e8f0';
            label.style.background = '#f7fafc';
            label.style.fontWeight = '400';
        }
    });
}

async function loadAiTrigger() {
    const { aiTrigger } = await chrome.storage.sync.get({ aiTrigger: "''" });
    const radio = document.querySelector(`input[name="aiTrigger"][value="${CSS.escape ? aiTrigger : aiTrigger}"]`);
    // Use querySelectorAll and compare value directly (avoids CSS escaping issues)
    document.querySelectorAll('input[name="aiTrigger"]').forEach(r => {
        if (r.value === aiTrigger) r.checked = true;
    });
    updateAiTriggerStyles(aiTrigger);
}

async function saveAiTrigger(value) {
    await chrome.storage.sync.set({ aiTrigger: value });
    updateAiTriggerStyles(value);
}

document.querySelectorAll('input[name="aiTrigger"]').forEach(radio => {
    radio.addEventListener('change', () => saveAiTrigger(radio.value));
});

loadAiTrigger();

// ============================================
// SERVICE PREFIX CHARACTER MANAGEMENT
// ============================================

const SVC_PREFIX_CHARS = ["'", '.', '!', '?', '"'];
const SVC_PREFIX_IDS = { "'": 'svcpfx-sq', '.': 'svcpfx-dot', '!': 'svcpfx-exc', '?': 'svcpfx-qst', '"': 'svcpfx-dq' };

let currentServicePrefix = "'";

// Remap all keys in an object from one prefix char to another
function remapPrefixKeys(obj, oldChar, newChar) {
    const result = {};
    for (const [key, val] of Object.entries(obj)) {
        if (key.startsWith(oldChar)) {
            result[newChar + key.slice(1)] = val;
        } else {
            // Keep as-is (already using a different char or no prefix)
            result[key] = val;
        }
    }
    return result;
}

function updateServicePrefixStyles(selected) {
    for (const [char, id] of Object.entries(SVC_PREFIX_IDS)) {
        const label = document.getElementById(id);
        if (!label) continue;
        if (char === selected) {
            label.style.borderColor = '#667eea';
            label.style.background = 'linear-gradient(135deg,#ede9fe 0%,#dbeafe 100%)';
            label.style.fontWeight = '600';
        } else {
            label.style.borderColor = '#e2e8f0';
            label.style.background = '#f7fafc';
            label.style.fontWeight = '400';
        }
    }
    // Update inline examples
    const exW = selected + 'w', exE = selected + 'e', exD = selected + 'd', exDE = selected + 'de';
    ['svcPrefixExample','weatherPrefixNote'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = exW; });
    ['svcPrefixExampleT','weatherPrefixExampleMon'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = selected + 't'; });
    document.getElementById('weatherPrefixExample') && (document.getElementById('weatherPrefixExample').textContent = exW);
    document.getElementById('weatherPrefixNoteT') && (document.getElementById('weatherPrefixNoteT').textContent = selected + 't');
    document.querySelectorAll('.svc-pfx-eg').forEach(el => {
        // Update based on original char - keep the letter, just swap prefix
        const letter = el.textContent.trim().slice(1);
        el.textContent = selected + letter;
    });
    // Update placeholder on prefix inputs
    ['newWeatherPrefix','newTranslationPrefix','newDefinitionPrefix'].forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) el.placeholder = [exW, exE, exD][i];
    });
}

async function loadServicePrefix() {
    const { servicePrefix } = await chrome.storage.sync.get({ servicePrefix: "'" });
    currentServicePrefix = servicePrefix;
    document.querySelectorAll('input[name="servicePrefix"]').forEach(r => {
        if (r.value === servicePrefix) r.checked = true;
    });
    updateServicePrefixStyles(servicePrefix);
}

async function changeServicePrefix(newChar) {
    const oldChar = currentServicePrefix;
    if (newChar === oldChar) return;

    // Remap the current in-memory objects (which may be defaults never written to storage)
    weatherLocations    = remapPrefixKeys(weatherLocations,    oldChar, newChar);
    translationPrefixes = remapPrefixKeys(translationPrefixes, oldChar, newChar);
    definitionPrefixes  = remapPrefixKeys(definitionPrefixes,  oldChar, newChar);

    await chrome.storage.sync.set({
        servicePrefix: newChar,
        weatherLocations,
        translationPrefixes,
        definitionPrefixes
    });

    currentServicePrefix = newChar;
    updateServicePrefixStyles(newChar);

    // Re-render all prefix lists
    renderWeatherLocations();
    renderTranslationPrefixes();
    renderDefinitionPrefixes();
}

// Wire up the radio buttons
document.querySelectorAll('input[name="servicePrefix"]').forEach(radio => {
    radio.addEventListener('change', () => changeServicePrefix(radio.value));
});

// Load on start
loadServicePrefix();
