# 🟦 Blue Tabs

A fast, keyboard-driven tab manager for you browser. Navigate to or close tabs without lifting your hands from the keyboard. reopen recently closed tabs. and a search bar acting like a url with additional features. privacy focused and highly customizable to you preference. and more . 

---

## Features


### 📌 Pinned Websites & Hot Pages

Pin your most-visited sites to the top of the switcher for one-click access. Hot pages can be populated automatically from your browser's top sites.

As you type a domain that matches a hot page, ghost text completes it inline with a 🔥 badge — hit the engine modifier to open it immediately.


##optional ai integration

a lott of us a tick of ai bein integrated into absolutely everything. if that is you you can keep this setting off. if you would like quick ai answers turn it on (not always reliable)

### 🔍 One Bar to Rule Them All

The search bar is the heart of Blue Tabs. It's not just a tab filter — it's also like an adressbar with extra features:

- **Filter tabs** for those who ave alott open an once. you can also search your recently closed tabs
- **Make a web search or go to a domain**
- **Directly search any engine** type your query and press to buttons to instantly search it on — YouTube, Wikipedia, Google Translate, or any engine you chose to add. 
- **Instant Answers** you can get cureny covertions. word defenitions. translations. or 
-  optional **Search history** → cycle through past queries with the up arrow (stores last 10)




### 🔤 Instant Jump (no popup needed)

Hold your configured **Engine modifier key** and press any letter to instantly jump to a tab whose domain starts with that letter. like y for youtube og g for google. Press the same letter again to cycle through all matching tabs. can jump to but not from browser intarnal pages like chrome://extentions. 

### ⌨️ Fully Configurable Keyboard Shortcuts

Every key binding is remappable in Settings:
---

## Installation

will be comming chrome web store soon. but for now

1. Download or clone this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top right toggle).
4. Click **Load unpacked** and select the `blue tabs` folder.
5. Press `Alt+T` to open the switcher.
6. Press the settings icon to change anny keys or setting if needed


---

## Settings

Click the ⚙️ icon inside the switcher or go to **Settings → Extensions → Blue Tabs → Extension


## Permissions

| Permission                   | Why it's needed                                            |
| ---------------------------- | ---------------------------------------------------------- |
| `tabs`                       | Read and switch between open tabs                          |
| `sessions`                   | Access recently closed tabs                                |
| `storage`                    | Save your settings and pinned sites                        |
| `scripting`                  | Inject the instant-jump listener into pages                |
| `topSites`                   | Optionally populate hot pages from your most visited sites |
| `system.display`             | Center the popup window on your screen                     |
| `https://api.groq.com/*`     | AI-assisted instant answers                                |
| `https://search.brave.com/*` | Enable Brave Search suggestions                            |

---

## License

MIT
