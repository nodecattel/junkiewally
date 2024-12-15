# Privacy Policy for JunkieWally

## Overview
JunkieWally is a non-custodial Web3 wallet for JunkCoin that prioritizes user privacy and security. This policy explains how we handle user data and protect your privacy.

## Data Collection Categories

### Data We DO NOT Collect
We explicitly DO NOT collect the following types of information:

1. Personally Identifiable Information (PII)
   - Names, addresses, email addresses
   - Age or identification numbers
   - Any personal contact information

2. Health Information
   - Medical data
   - Health records
   - Any health-related information

3. Financial and Payment Information
   - Credit card numbers
   - Bank details
   - Financial statements
   - Note: While we handle cryptocurrency transactions, we only process public blockchain data

4. Authentication Information
   - Passwords (these are only stored locally with encryption)
   - Security questions
   - PINs
   - Note: Your wallet password is stored only on your device

5. Personal Communications
   - Emails
   - Messages
   - Chat logs

6. Precise Location
   - GPS coordinates
   - Exact location data
   - Device location

7. Web History
   - Browsing history
   - Website visits
   - Search history

8. Website Content
   - Page content
   - Media files
   - User-generated content

### Data We DO Collect (Via Google Analytics)
We collect only anonymous, aggregated data through Google Analytics:

1. Basic Geographic Data
   - Country/region level only
   - No precise location
   - General time zone

2. Usage Statistics
   - Extension installation/uninstallation rates
   - Feature usage patterns
   - Error rates
   - Performance metrics

3. Device Information
   - Browser version
   - Operating system
   - Screen resolution
   - All anonymized and aggregated

## Data Storage and Security

### Local Storage
The following data is stored locally on your device only:
- Encrypted wallet information (private keys, seed phrases)
- Account preferences and settings
- Local address book
- Connected website permissions
- Language preferences

All sensitive data is encrypted using industry-standard encryption before being stored locally.

## Blockchain Data Handling

### Transaction Data Storage
1. Local Transaction Cache:
   - Transaction IDs (txids)
   - Transaction amounts
   - Confirmation status
   - Block height information
   - Sender/receiver addresses (public addresses only)
   - Time stamps
   - All stored locally and encrypted on your device

2. Real-time Transaction Data:
   - Fetched from JunkPool explorer (junkpool.blockraid.io)
   - Public blockchain data only
   - No private transaction details stored
   - Cached temporarily for performance

### UTXO Management
1. UTXO Data Storage:
   - Unspent transaction outputs
   - Output values
   - Transaction references
   - Script types
   - All data encrypted locally

2. UTXO Handling:
   - UTXOs fetched from JunkCoin API
   - Updated during transactions
   - Temporary caching for transaction building
   - Cleared after use
   - No external UTXO tracking

### Inscription Data Management
1. Inscription Storage:
   - Inscription IDs
   - Content hashes
   - Ownership addresses
   - Inscription numbers
   - All public blockchain data

2. Inscription Handling:
   - Data fetched from content API
   - Cached locally for performance
   - No private inscription content stored
   - Updated when viewing or transferring
   - Public metadata only

## Network Interactions

The extension interacts with:
1. JunkCoin blockchain network for:
   - Reading address balances and transaction history
   - Broadcasting transactions
   - UTXO management
   - Public blockchain data

2. NonKYC.io API for:
   - Fetching current JKC/USDT price information
   - No personal data is sent to this service

3. Inscription and token services for:
   - Reading NFT and token data
   - Verifying inscriptions
   - All interactions are read-only and public blockchain data

## Permissions Used

The extension requires specific permissions:
- `storage`: For storing encrypted wallet data locally
- `unlimitedStorage`: For blockchain data caching
- `sidePanel`: For UI display only
- Content script access: For interacting with Web3 websites

## Opt-Out & Data Control

### Google Analytics Opt-Out
You can opt out of Google Analytics tracking in several ways:

1. Chrome Settings:
   - Go to Chrome Settings
   - Privacy and Security
   - Site Settings
   - View permissions and data stored across sites
   - Find JunkieWally and disable analytics permissions

2. Install Google Analytics Opt-out Browser Extension:
   - Visit: https://tools.google.com/dlpage/gaoptout
   - Follow installation instructions

3. Enable "Do Not Track" in your browser:
   - Chrome Settings
   - Privacy and Security
   - Enable "Send a 'Do Not Track' request with your browsing traffic"

### Clearing Local Data
To remove all locally stored wallet data:

1. From Chrome Extension:
   - Click JunkieWally extension icon
   - Go to Settings
   - Select Security
   - Choose "Clear All Data"
   - Confirm action

2. From Chrome Settings:
   - Go to Chrome Settings
   - Extensions
   - Find JunkieWally
   - Click "Details"
   - Select "Clear Data"
   - Confirm action

Note: Clearing local data will remove your wallet information. Ensure you have backed up your seed phrase before proceeding.

## Data Retention
1. Local Cache:
   - Transaction history: last 100 transactions
   - UTXO data: current unspent outputs only
   - Inscription data: owned inscriptions only
   - All data can be cleared by user

2. Network Data:
   - Real-time blockchain queries
   - No permanent storage of network data
   - Temporary caching for performance
   - Cleared on extension restart

## Privacy Protection
As a non-custodial wallet:
- Your keys never leave your device
- All data is stored locally with encryption
- No personal information is collected
- No central servers or databases
- Complete control of your funds
- No third-party access possible

## Updates to Privacy Policy
We will update this privacy policy as needed to ensure accuracy and compliance with Chrome Web Store requirements. Users will be notified of significant changes.

## Contact
For questions about this privacy policy or our data practices, please open an issue on our GitHub repository:
https://github.com/nodecattel/junkiewally

## Last Updated
December 2024
