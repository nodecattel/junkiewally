# JunkieWally ⛵️

The first Web3 wallet for the Junkcoin ($JKC) blockchain - Your secure gateway to the JKC ecosystem.

## 🎯 Overview

JunkieWally is a comprehensive browser extension wallet designed specifically for Junkcoin ($JKC). Built with security and usability in mind, it provides essential tools for managing your digital assets on the Junkcoin blockchain.

## 🙏 Credits

JunkieWally is proudly built upon the foundation of [Nintondo Extension](https://github.com/Nintondo/extension) and [Luckycoin Wallet](https://github.com/LuckyCoinProj/luckycoinwallet). Special thanks to the Nintondo developers for their excellent work which made this wallet possible.


## ✨ Features

- 💎 Secure $JKC Management 
- 🌐 Complete Web3 Wallet Functionality
- 🔗 Built-in Network Integration
- 🛡️ Enhanced Security Protocols
- 🎨 Intuitive User Interface

## 🚀 Coming Soon

- 📜 Junkinals Support (awaiting official inscription indexing)
- ⚡️ Advanced Inscription Management
- 🔌 Expanded DApp Integration
- 🔐 Enhanced Security Features

## 🔗 Useful Links

- 🔍 Block Explorer: [junkpool.blockraid.io](https://junkpool.blockraid.io)
- 🌐 Website: [junk-coin.com](https://junk-coin.com)
- 💬 Telegram: [junkcoin_JKC](https://t.me/junkcoin_JKC)
- 🐦 Twitter: [@junkcoin_JKC](https://x.com/junkcoin_JKC)

## 🛠️ Installation

### Prerequisites

Install bun.sh:
```bash
curl -fsSL https://bun.sh/install | bash
```

Install dependencies:
```bash
bun i
```

### 🔧 Browser Extension Setup

#### Chrome
```bash
# Build extension
bun chrome

# Installation steps:
1. Open Chrome Extensions (chrome://extensions/)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/chrome` folder
```

#### Firefox
```bash
# Build extension
bun firefox

# Installation steps:
1. Go to about:debugging#/runtime/this-firefox
2. Click "Load Temporary Add-on"
3. Select any file from `dist/firefox` folder
```

## 💻 Development

Development mode with hot reloading:
```bash
bun dev
```

Build for both browsers:
```bash
bun both
```

Create release builds:
```bash
bun release
```

## 🔒 Security Note

Always ensure you're downloading JunkieWally from official sources and verify all connection endpoints.

⛵️ JunkieWally - Secure, Simple, Reliable. 🌊
