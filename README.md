# Window Switcher

A fast, keyboard-driven window switcher for Windows that replaces Alt+Tab with a clean, customizable overlay. Switch, close, and manage windows without touching your mouse.

![Platform](https://img.shields.io/badge/platform-Windows-blue) ![Python](https://img.shields.io/badge/python-3.8%2B-blue) ![License](https://img.shields.io/badge/license-MIT-green)

---

## The Idea

Alt+Tab is slow. You press it, cycle through a ribbon of thumbnails, overshoot, cycle back, and eventually land somewhere. Window Switcher replaces that loop with a single keypress. Every open window gets a letter. You press the letter. You're there.

---

## Switching Windows

Open the selector with your hotkey (default **Alt+Tab**). Every window on your current virtual desktop appears in a list, each one assigned a shortcut letter. Press the letter — the selector closes and that window is immediately in focus.

If there's only one window to switch to, you skip the list entirely. The selector appears invisibly in the background, switches you over, and disappears. It feels instantaneous because it is.

If two windows belong to the same application, pressing the hotkey bounces you between them directly, with no list at all.

---

## Closing Windows

You don't need to switch to a window to close it. Hold the **close key** (default **Space**) and tap a shortcut letter to close that window immediately. The selector stays open so you can close more, or just switch to whatever's left.

### Close-All Mode

For when you want to wipe out a whole application — or several — in one move:

1. Press the **Close-All key** (default **Shift**) to enter Close-All Mode
2. Press a window's shortcut to mark every window belonging to that application (a red dot appears on each)
3. Press another shortcut from a different app to add those windows to the target list too
4. Tap **Alt** to instantly mark every open window across all applications
5. Tap any marked window's shortcut to unmark it and protect it from closing
6. Press the **close key** to execute — all marked windows close, unmarked ones stay

It sounds like many steps but in practice it takes about two keypresses to close an entire application.

---

## Direct App Shortcuts — Instant App Switching

Direct App Shortcuts are per-application hotkeys that work globally, any time, even when the selector is closed. Bind **Ctrl+Alt+B** to your browser, **Ctrl+Alt+C** to your code editor, **Ctrl+Alt+T** to your terminal — whatever makes sense to you.

When you press a Direct App Shortcut, the behavior adapts to the situation automatically:

|Situation|What happens|
|---|---|
|App is not running|Launches it|
|App has one window, you're elsewhere|Switches to it instantly — no list|
|App has one window, you're already on it|Steps back to the previous window|
|App has exactly two windows|Cycles between them instantly — no list|
|App has three or more windows|Opens a filtered selector showing only that app's windows|

The filtered selector works exactly like the main one: shortcut letters, close key, Close-All Mode, everything. The difference is it only contains windows from that one application, so your shortcuts start at `a` and the list is short.

The result is that your most-used apps are always one chord away. Browser, editor, terminal, Slack, Spotify — each on its own hotkey, always responding in under a keystroke.

---

## Highly Configurable

Almost every behavior in Window Switcher can be changed, remapped, or turned off entirely.

### Hotkeys

Every action key is independently configurable. The main selector hotkey, the close key, Close-All Mode key, the Target All key, the hide trigger, the quit shortcut, the settings shortcut — all of them. Set any of them to `null` to disable that action completely if you don't use it.

```
# Examples of what you can set:
Show list hotkey:    alt+tab  /  ctrl+space  /  f9  /  anything
Close window key:    space  /  backspace  /  delete  /  null
Close-All key:       shift  /  ctrl  /  null
Target All key:      alt  /  null
Hide trigger:        enter  /  null
```

### Shortcut Letters

The letters assigned to windows in the list are fully customizable. By default they follow `a s d f z x c v q w e r ...` — a layout designed to keep your most-used shortcuts on strong fingers. You can replace this with anything:

```
# All single keys
a s d f g h j k l

# Modifier combos mixed in
a s d f ctrl+a ctrl+s alt+a alt+s

# Function keys
f1 f2 f3 f4 f5

# Mix of everything
a s d f1 f2 ctrl+a shift+s
```

Uppercase letters in the config (e.g. `A`) are automatically treated as `Shift+a` and displayed as a capital in the list.

### Other Configurable Behaviors

- **Interface scale** — resize the entire selector UI from 50% to 150%, independently of system DPI
- **Always hide with hotkey** — choose whether pressing your hotkey while a direct-app list is open switches to the main list, or just closes the selector
- **Double-tap to Target All** — double-tap the Close-All key quickly to automatically target every open application without pressing the Target All key
- **Allow targeting multiple processes** — control whether Close-All Mode can accumulate windows from multiple apps or stays locked to one at a time
- **Middle mouse button** — open the selector with a middle click anywhere
- **Mouse side button (back button)** — acts as Alt inside the selector, useful for modifier combos without moving your hand
- **AHK integration** — use AutoHotkey as the hotkey engine for lower-level key interception that works in games and fullscreen apps
- **Show/hide the help tooltip** — a small bar at the top of the selector showing your configured settings and quit keys

### Blocking and Hiding

**Blocked apps** — certain applications (games, fullscreen tools) should never trigger the selector. Add any process to the blocked list and the selector will not open while that app is in the foreground, even if you hit the hotkey.

**Hidden windows** — some windows you want open but never want cluttering your list. Hold the hide trigger key and tap a window's shortcut to permanently remove it from the selector. It keeps running in the background. Unhide it any time through Settings.

---

## Features at a Glance

- Single-keypress window switching with assigned shortcut letters
- Instant switching with no list when only one or two windows exist
- Close any window from the selector without switching to it
- Close-All Mode for wiping out entire applications in seconds
- Direct App Shortcuts for global per-app hotkeys that launch or switch intelligently
- Filtered per-app window lists when an app has multiple windows
- Every key and behavior is remappable or disableable
- Custom shortcut letter sequences including modifier combos and function keys
- Block apps from triggering the selector
- Hide individual windows from the list without closing them
- Middle mouse button and side mouse button support
- Virtual desktop aware — only shows windows on the current desktop
- DPI-aware, scalable UI
- AHK integration for deep hotkey compatibility
- System tray with quick access to settings

---

## Requirements

> **Just want to run it?** Download the standalone `.exe` from the releases page — no Python, no dependencies, nothing to install. Drop it in a folder alongside `config.json` and run it.

The rest of this section is only relevant if you want to run from source.

- Windows 10 or 11
- Python 3.8+
- [AutoHotkey](https://www.autohotkey.com/) _(optional but strongly recommended)_

### Python Dependencies

```
pip install PyQt5 pygetwindow psutil keyboard pynput pywin32 comtypes
```

For AHK integration:

```
pip install ahk
```

---

## Installation

1. Clone or download this repository
2. Install dependencies
3. Run:

```bash
python window_switcher.py
```

A "Window Switcher Active" notification confirms the app is running. It lives in the system tray from there.

> **Tip:** Running as administrator improves window focus reliability across all applications, especially those that resist being brought to the foreground.

---

## Building a Standalone Executable

```bash
pip install pyinstaller
pyinstaller --onefile --noconsole --name WindowSwitcher window_switcher.py
```

Place `config.json` in the same folder as the resulting executable.

---

## Configuration Reference

All settings are accessible through the in-app Settings dialog (**Ctrl+C** while the selector is open, or via the tray icon). They are saved to `config.json` alongside the script.


---

## License

MIT