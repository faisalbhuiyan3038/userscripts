# Personal Userscripts Collection
[Click here to visit my GreasyFork profile and see all the userscripts I created](https://greasyfork.org/en/users/1402168-faisalbhuiyan3038)

A collection of browser userscripts created for personal use, designed to enhance web browsing experience. These scripts are compatible with userscript managers like Tampermonkey.

If you are on any Android phone, you can use these with Firefox Android (Highly Recommend), Kiwi Browser, Microsoft Edge Canary, Lemur Browser and Quetta Browser.

## Available Scripts

### Stream to Android Player
What does this userscript do?
It detects streaming m3u8 or mp4 videos on the current site and if found will show a small play icon on the bottom right corner. When you tap it, you can find the list of detected streams. Clicking on each stream will open Android's native sharing menu where you can choose the app you want to open the video in. That's it! You can watch them in your favorite player with all the features the app supports like audio equalizer, swipe to seek etc.

Which video players are supported?
Any video player that supports opening streaming links will work. I tested with mpv and SVPlayer.

The streaming isn't detected on EVERY site, just some sites I use. If there are issues, leave a feedback and I will take a look at it when I am free.

This is available as an Edge and Firefox extension too.

### Brave Search Default for Opera
A userscript that sets Brave Search as the default search engine for Opera. You can modify it to set any other search engine as the default.

Simply, change the url and name in the config section of the script. This works by auto redirecting Yahoor searches with optimizations to ensure the actual default search engine never shows up. As a result, you need to set Yahoor as your default search engine in your browser settings for this to work.

### Android Swipe to Seek Video

A userscript that adds swipe-to-seek functionality to web video players that don't natively support this feature.

### Universal Video Sharpness Filter

A userscript that sharpens videos across any number of streaming sites. This applies a sharpening filter using SVG filters and CSS. It also slightly adjusts the contrast and brightness to maintain overall video quality.

In my testing, this one seems to lag on Firefox, but works well on Microsoft Edge. This script was inspired by [Youtube Video Sharpener](https://greasyfork.org/en/scripts/499365-youtube-sharpness-enhancer) script.

UPDATE1: Added a visible indicator (✓ or ✗) for when sharpening is enabled or disabled and a notification when state changes.

### Universal Video Sharpness CSS Filter
A userscript that applies a sharpening effect to videos by applying CSS filters. The effect is less noticable compared to the SVG filter method, but consumes less resources and works fine on all browsers.

UPDATE1: Added a visible indicator (✓ or ✗) for when sharpening is enabled or disabled and a notification when state changes.

### Arc-Style Site Search

A userscript that 'fixes' site search functionality in Arc Browser. Use shortcuts like `@perplexity` from the address bar directly to instantly search on your favorite sites. Why does this exist? Well, while the feature works perfectly on macOS, it's widely known that site search just does not work on Arc for Windows. So, decided to fix it.

#### Features
- Instant redirection to search results
- Multiple search engines support
- Easy to customize and extend

#### Supported Search Engines
| Shortcut | Site |
|----------|------|
| @perplexity | Perplexity AI |
| @g | Google |
| @youtube | YouTube |
| @morphic | Morphic |
| @qwant | Qwant |
| @phind | Phind |
| @yandex | Yandex |

#### Usage
1. Install a userscript manager (like Tampermonkey)
2. Install this userscript
3. In any search box, type a shortcut followed by your search query
   - Example: `@perplexity how to make pasta`
   - Example: `@youtube funny cats`
   - Example: `@phind javascript arrays`

The script will instantly redirect you to the corresponding search engine with your query.

#### Customization

##### Adding a New Search Engine
1. Open the userscript
2. Find the `searchEngines` array
3. Add a new entry following this format:
```javascript
{
    shortcut: '@example',
    url: 'https://example.com/search?q=%s'
}
```
4. Add the domain to the `searchDomains` Set:
```javascript
const searchDomains = new Set([
    'example.com',
    // other domains...
]);
```

##### Removing a Search Engine
1. Remove its entry from the `searchEngines` array
2. Remove its domain from the `searchDomains` Set

#### Important Note About Default Search Engines
⚠️ **Do not add your browser's default search engine** to the script. This can cause redirect loops because:
1. When you search, your browser first redirects to your default search engine
2. The script then tries to redirect from there
3. This creates a conflict and breaks the functionality

For example, if you use Brave Search as your default search engine, don't add the `@brave` shortcut to the script.

#### Query Parameter Support
The script supports various search query parameters:
- `q` (most search engines)
- `search_query` (YouTube)
- `text` (Yandex)

### Android Double Tap to Seek

Adds double-tap-to-seek functionality to web video players that don't natively support this feature.

#### Features
- Works in fullscreen mode only
- Automatically enables/disables based on screen state
- Shows toast messages for enable/disable status
- Configurable site blacklist for compatibility
- Tested on:
  - Firefox for Android with Tampermonkey
  - Kiwi Browser with Tampermonkey

### 3. Instant Search Switcher

Adds a convenient dropdown menu to switch between different search engines while preserving your search query.

#### Features
- Supported search engines:
  - Brave
  - Google
  - Bing
  - Yandex
  - Morphic
  - Perplexity
  - Phind
  - DuckDuckGo
- Currently works on:
  - Google
  - Brave
  - Bing search pages
  - DuckDuckGo
- Easily extensible: Add more search engines by modifying the userscript

## Installation

1. Install a userscript manager (e.g., Tampermonkey) in your browser
2. Click on the script you want to install
3. Your userscript manager should automatically detect and prompt you to install the script

## Contributing

Feel free to suggest improvements or report issues. These scripts are primarily maintained for personal use but contributions are welcome.

## License

These userscripts are available under the GPL-2.0 License.
