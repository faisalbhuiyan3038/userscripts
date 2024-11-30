# Personal Userscripts Collection
[Instant Search Switcher](https://greasyfork.org/en/scripts/518797-instant-search-switcher) - [Android Double Tap to Seek](https://greasyfork.org/en/scripts/518800-android-double-tap-to-seek-video) - [Arc-Style Site Search](https://greasyfork.org/en/scripts/your-script-id)

A collection of browser userscripts created for personal use, designed to enhance web browsing experience. These scripts are compatible with userscript managers like Tampermonkey.

If you are on any Android phone, you can use these with Firefox Android (Highly Recommend), Kiwi Browser, Microsoft Edge Canary, Lemur Browser and Quetta Browser.

## Available Scripts

### 1. Arc-Style Site Search

A userscript that brings Arc browser's quick site search functionality to any browser. Use shortcuts like `@perplexity` to instantly search on your favorite sites.

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

### 2. Android Double Tap to Seek

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
