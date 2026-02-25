# 🟦 Blue Tabs

A fast, keyboard-driven tab manager for you browser. Navigate to or close tabs without lifting your hands from the keyboard. reopen recently closed tabs. and a search bar acting like a url with additional features. privacy focused and highly customizable to you preference. and more . 

---

## Features


### 📌 Pinned Websites & Hot Pages

Pin your most-visited sites to the top of the switcher for one-click access. Hot pages can be populated automatically from your browser's top sites.

As you type a domain that matches a hot page, ghost text completes it inline with a 🔥 badge — hit the engine modifier to open it immediately.

### 🧠 Instant Answers

currency convertion . weather. dictionary. math results 

| Query example                | What you get                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `100 usd`                    | Live currency conversion (USD → NOK, EUR, and more)                                             |
| `'e bonjour`                 | Translate to English                                                                            |
| `'d serendipity`             | Dictionary definition with phonetics                                                            |
| Weather prefix               | Current weather for configured locations                                                        |
| `12 * (34 + 5)`              | Instant math result — supports `+ - * / ^ %` and parentheses                                    |


##optional ai integration

a lott of us a tick of ai bein integrated into absolutely everything. if that is you you can keep this setting off. if you would like quick ai answers turn it on (not always reliable)

### 🔍 One Bar to Rule Them All

The search bar is the heart of Blue Tabs. It's not just a tab filter — it's a unified address bar, search bar, and command palette in one:

- **Filter open tabs** as you type, or hit `Tab` to search recently closed ones too — closing a tab is just as fast, hit your close modifier instead of Enter
- **Type a URL or bare domain** (e.g. `github.com`) → navigates directly, no search needed
- **Type a query** → live Brave Search suggestions appear inline; hit Enter to search with your default engine
- **Hold the engine modifier + a letter** to instantly redirect the search to a specific engine — YouTube, Wikipedia, Google Translate, and more. All shortcuts are remappable and you can add your own custom engines
- **Search history** → cycle through past queries with the up arrow (stores last 10)


consume search engines

name a few of the built in engines. note that there are more and that the user can configure their own. also mention a bit how the engines work. and how it is meore eficient that way 



### 🔤 Instant Jump (no popup needed)

Hold your configured **Engine modifier key** and press any letter to instantly jump to a tab whose domain starts with that letter. Press the same letter again to cycle through all matching tabs.

### ⌨️ Fully Configurable Keyboard Shortcuts

Every key binding is remappable in Settings:

|Action|Default|
|---|---|
|Open/close switcher|`Alt+T`|
|Close a tab|`Shift` + select|
|Target a tab in another window|`Alt` + select|
|Show recently closed|`Tab`|
|Toggle search suggestions|`Ctrl`|
|Web search|`Enter`|
|Instant jump modifier|`F21`|

---

## Installation

1. Download or clone this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top right toggle).
4. Click **Load unpacked** and select the `blue tabs` folder.
5. Press `Alt+T` to open the switcher.

> **Note:** The default instant-jump modifier is `F21`. You can remap this to any key in the extension settings.

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
| `https://api.groq.com/*`     | Power AI-assisted instant answers                          |
| `https://search.brave.com/*` | Enable Brave Search suggestions                            |

---

## License

MIT
