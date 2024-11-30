# Personal Userscripts Collection
[Instant Search Switcher](https://greasyfork.org/en/scripts/518797-instant-search-switcher) - [Android Double Tap to Seek](https://greasyfork.org/en/scripts/518800-android-double-tap-to-seek-video)

A collection of browser userscripts created for personal use, designed to enhance web browsing experience. These scripts are compatible with userscript managers like Tampermonkey.

If you are on any Android phone, you can use these with Firefox Android (Highly Recommend), Kiwi Browser, Microsoft Edge Canary, Lemur Browser and Quetta Browser.

## Available Scripts

### - Site Search for Arc Browser

Enables quick search shortcuts that work on any website with a search box. Type a shortcut followed by your search query to instantly redirect to that search engine.

#### Features
- Supported search engines and shortcuts:
  - Perplexity (@perplexity)
  - Brave Search (@brave)
  - YouTube (@youtube)
  - Morphic (@morphic)
  - Qwant (@qwant)
  - Phind (@phind)
  - Yandex (@yandex)

#### Usage
1. Install the userscript in your browser's userscript manager (e.g., Tampermonkey)
2. In your address bar, type a shortcut followed by your search query
3. The script will instantly redirect you to the corresponding search engine

Example:
- Type "@perplexity how to code" → Redirects to Perplexity AI
- Type "@brave latest news" → Redirects to Brave Search
- Type "@youtube cooking tutorial" → Redirects to YouTube

#### Adding Custom Search Engines
1. Open the userscript in your userscript manager
2. Find the `searchEngines` array
3. Add a new entry following this format:
```javascript
{
    shortcut: '@yourshortcut',
    url: 'https://example.com/search?q=%s'
}
```
4. Replace:
   - `@yourshortcut` with your preferred shortcut (e.g., '@ddg' for DuckDuckGo)
   - The URL with the search engine's URL, keeping `%s` where the search query should go

Tips:
- To find the correct search URL, perform a search on your desired site and copy the URL
- Replace your search terms in the URL with `%s`
- Make sure your shortcut is unique and starts with '@'

### - Android Double Tap to Seek

Adds double-tap-to-seek functionality to web video players that don't natively support this feature.

#### Features
- Works in fullscreen mode only
- Automatically enables/disables based on screen state
- Shows toast messages for enable/disable status
- Configurable site blacklist for compatibility
- Tested on:
  - Firefox for Android with Tampermonkey
  - Kiwi Browser with Tampermonkey

### - Instant Search Switcher

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
- Currently works on:
  - Google
  - Brave
  - Bing search pages
- Easily extensible: Add more search engines by modifying the userscript

## Installation

1. Install a userscript manager (e.g., Tampermonkey) in your browser
2. Click on the script you want to install
3. Your userscript manager should automatically detect and prompt you to install the script

## Contributing

Feel free to suggest improvements or report issues. These scripts are primarily maintained for personal use but contributions are welcome.

## License

These userscripts are available under the GPL-2.0 License.
