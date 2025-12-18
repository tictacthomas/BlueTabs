// Settings script

// Default settings
const DEFAULT_SETTINGS = {
    closeModifier: { display: 'Shift', code: 'ShiftLeft', key: 'Shift', modifiers: { shift: true } },
    switchModifier: { display: 'Space', code: 'Space', key: ' ', modifiers: {} },
    confirmKey: { display: 'Enter', code: 'Enter', key: 'Enter', modifiers: {} },
    recentlyClosedKey: { display: 'Tab', code: 'Tab', key: 'Tab', modifiers: {} },
    settingsKey: { display: 'Ctrl+Alt+S', code: 'KeyS', key: 's', modifiers: { ctrl: true, alt: true } }
};

// State
let recordingMode = null;
let recordedCloseKey = null;
let recordedSwitchKey = null;
let recordedConfirmKey = null;
let recordedRecentlyClosedKey = null;
let recordedSettingsKey = null;
let currentRecordingKey = null;

// Load saved settings
async function loadSettings() {
    const result = await chrome.storage.sync.get({ 
        closeModifierData: null,
        switchModifierData: null,
        confirmKeyData: null,
        recentlyClosedKeyData: null,
        settingsKeyData: null,
        showInstructions: true
    });
    
    recordedCloseKey = result.closeModifierData || DEFAULT_SETTINGS.closeModifier;
    recordedSwitchKey = result.switchModifierData || DEFAULT_SETTINGS.switchModifier;
    recordedConfirmKey = result.confirmKeyData || DEFAULT_SETTINGS.confirmKey;
    recordedRecentlyClosedKey = result.recentlyClosedKeyData || DEFAULT_SETTINGS.recentlyClosedKey;
    recordedSettingsKey = result.settingsKeyData || DEFAULT_SETTINGS.settingsKey;
    
    // Update UI
    document.getElementById('closeModifierDisplay').value = recordedCloseKey.display;
    document.getElementById('switchModifierDisplay').value = recordedSwitchKey.display;
    document.getElementById('confirmKeyDisplay').value = recordedConfirmKey.display;
    document.getElementById('recentlyClosedKeyDisplay').value = recordedRecentlyClosedKey.display;
    document.getElementById('settingsKeyDisplay').value = recordedSettingsKey.display;
    document.getElementById('showInstructions').checked = result.showInstructions;
    
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
        display: (mode === 'confirm' || mode === 'recentlyClosed' || mode === 'settings') 
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
        switch: recordedSwitchKey,
        confirm: recordedConfirmKey,
        recentlyClosed: recordedRecentlyClosedKey,
        settings: recordedSettingsKey
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
                                conflict.name === 'switch' ? 'Switch Modifier' :
                                conflict.name === 'confirm' ? 'Confirm' :
                                conflict.name === 'settings' ? 'Settings' :
                                conflict.name.charAt(0).toUpperCase() + conflict.name.slice(1);
    
    const currentDisplayName = recordingMode === 'recentlyClosed' ? 'Recently Closed' : 
                               recordingMode === 'close' ? 'Close Modifier' :
                               recordingMode === 'switch' ? 'Switch Modifier' :
                               recordingMode === 'confirm' ? 'Confirm' :
                               recordingMode === 'settings' ? 'Settings' :
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

        const swappButton = document.createElement('button');
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
        switch: { var: 'recordedSwitchKey', display: 'switchModifierDisplay' },
        confirm: { var: 'recordedConfirmKey', display: 'confirmKeyDisplay' },
        recentlyClosed: { var: 'recordedRecentlyClosedKey', display: 'recentlyClosedKeyDisplay' },
        settings: { var: 'recordedSettingsKey', display: 'settingsKeyDisplay' }
    };
    
    const config = keys[mode];
    if (config) {
        if (mode === 'close') recordedCloseKey = key;
        else if (mode === 'switch') recordedSwitchKey = key;
        else if (mode === 'confirm') recordedConfirmKey = key;
        else if (mode === 'recentlyClosed') recordedRecentlyClosedKey = key;
        else if (mode === 'settings') recordedSettingsKey = key;
        
        document.getElementById(config.display).value = key ? key.display : '';
    }
}

// Save settings (auto-save)
async function saveSettings() {
    if (!recordedCloseKey || !recordedSwitchKey || !recordedConfirmKey || !recordedRecentlyClosedKey || !recordedSettingsKey) {
        return;
    }
    
    const showInstructions = document.getElementById('showInstructions').checked;
    
    await chrome.storage.sync.set({ 
        closeModifierData: recordedCloseKey,
        switchModifierData: recordedSwitchKey,
        confirmKeyData: recordedConfirmKey,
        recentlyClosedKeyData: recordedRecentlyClosedKey,
        settingsKeyData: recordedSettingsKey,
        showInstructions: showInstructions
    });
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
        exampleClose3: recordedCloseKey?.display || 'Your Close Key',
        exampleClose4: recordedCloseKey?.display || 'Your Close Key',
        exampleSwitch2: recordedSwitchKey?.display || 'Your Switch Key',
        exampleConfirm3: recordedConfirmKey?.display || 'Your Confirm Key',
        exampleConfirm4: recordedConfirmKey?.display || 'Your Confirm Key',
        exampleRecentlyClosed2: recordedRecentlyClosedKey?.display || 'Your Key',
        exampleSettings2: recordedSettingsKey?.display || 'Your Key'
    };
    
    Object.entries(updates).forEach(([id, text]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    });
}

// Event listeners
const modes = ['close', 'switch', 'confirm', 'recentlyClosed', 'settings'];

modes.forEach(mode => {
    const baseName = mode.charAt(0).toUpperCase() + mode.slice(1);
    
    document.getElementById(`record${baseName}Button`).addEventListener('click', () => {
        if (recordingMode === mode) {
            stopRecording();
        } else {
            if (recordingMode) stopRecording();
            startRecording(mode);
        }
    });
    
    document.getElementById(`clear${baseName}Button`).addEventListener('click', () => clearKey(mode));
});

document.getElementById('showInstructions').addEventListener('change', saveSettings);

// Open Chrome shortcuts page
document.getElementById('openChromeShortcuts').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

// Load settings on page load
loadSettings();
