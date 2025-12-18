// Background service worker

let switcherWindowId = null;

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
    
    // Get the current window to center the popup relative to it
    const currentWindow = await chrome.windows.getCurrent();
    
    // Calculate center position
    const width = 605;
    const height = 735;
    const left = Math.round(currentWindow.left + (currentWindow.width - width) / 2);
    const top = Math.round(currentWindow.top + (currentWindow.height - height) / 2);
    
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
});
