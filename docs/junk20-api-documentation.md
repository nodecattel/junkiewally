# JUNK20 Indexer API Endpoints

**Base URL**: `https://junk20.junkiewally.xyz`

**Status**: Read-Only Token Indexer for Junkcoin Network

This document provides comprehensive documentation for all available API endpoints in the JUNK20 Indexer. The indexer is a read-only service that provides access to JUNK20 token data, balances, transactions, and real-time events on the Junkcoin network.

## Table of Contents

- [Address Endpoints](#address-endpoints)
  - [GET /address/{address}](#get-addressaddress)
  - [GET /address/{address}/tokens](#get-addressaddresstokens)
  - [GET /address/{address}/history](#get-addressaddresshistory)
  - [GET /address/{address}/tokens-tick](#get-addressaddresstokens-tick)
  - [GET /address/{address}/{tick}/balance](#get-addressaddresstickbalance)
- [Token Endpoints](#token-endpoints)
  - [GET /tokens](#get-tokens)
  - [GET /token](#get-token)
  - [GET /token/proof/{address}/{outpoint}](#get-tokenproofaddressoutpoint)
  - [GET /token-events/{tick}](#get-token-eventstick)
  - [GET /holders](#get-holders)
  - [GET /holders-stats](#get-holders-stats)
- [Event Endpoints](#event-endpoints)
  - [POST /events](#post-events)
  - [GET /events/{height}](#get-eventsheight)
  - [GET /txid/{txid}](#get-txidtxid)
- [Status Endpoints](#status-endpoints)
  - [GET /status](#get-status)
  - [GET /proof-of-history](#get-proof-of-history)
- [Utility Endpoints](#utility-endpoints)
  - [GET /all-addresses](#get-all-addresses)
  - [GET /all-tickers](#get-all-tickers)

---

## Address Endpoints

### GET /address/{address}

Retrieves token balances and transfers for a specific address.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | path, string | Yes | The address to retrieve token balances and transfers for |

**Request Example:**

```bash
curl -X GET "https://junk20.junkiewally.xyz/address/7jkS5cdTNxdbqmrFVYjADE41gz91cYuLkr"
```

**Response Example:**

```json
[
    {
        "tick": "JUNK",
        "balance": "1000",
        "transferable_balance": "1000",
        "transfers": [
            {
                "outpoint": "abc123...def:0",
                "value": "1000"
            }
        ],
        "transfers_count": 1
    }
]
```

### GET /address/{address}/tokens

Retrieves token balances for a specific address (same as /address/{address}).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | path, string | Yes | The address to retrieve token balances for |
| offset | query, string | No | Token tick to start pagination from |
| limit | query, number | No | Maximum number of tokens to return (default: 100) |

**Request Example:**

```bash
curl -X GET "https://junk20.junkiewally.xyz/address/7jkS5cdTNxdbqmrFVYjADE41gz91cYuLkr/tokens?limit=10"
```

**Response Example:**

```json
[
    {
        "tick": "JUNK",
        "balance": "1000",
        "transferable_balance": "1000"
    }
]
```

### GET /address/{address}/history

Retrieves the history of token actions for a specific address.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | path, string | Yes | The address to retrieve transaction history for |
| offset | query, string | No | Transaction ID to start pagination from |
| limit | query, number | No | Maximum number of transactions to return (default: 100) |

**Request Example:**

```bash
curl -X GET "https://junk20.junkiewally.xyz/address/7jkS5cdTNxdbqmrFVYjADE41gz91cYuLkr/history?limit=5"
```

**Response Example:**

```json
[
    {
        "txid": "abc123...def",
        "height": 850000,
        "timestamp": 1703001600,
        "events": [
            {
                "type": "transfer",
                "tick": "JUNK",
                "amount": "1000",
                "from": "DQR8...abc",
                "to": "7jkS5cdTNxdbqmrFVYjADE41gz91cYuLkr"
            }
        ]
    }
]
```

### GET /address/{address}/tokens-tick

Retrieves a list of token ticks for a specific address.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | path, string | Yes | The address to retrieve token ticks for |
| offset | query, string | No | Token tick to start pagination from |
| limit | query, number | No | Maximum number of ticks to return (default: 100) |

**Request Example:**

```bash
curl -X GET "https://junk20.junkiewally.xyz/address/7jkS5cdTNxdbqmrFVYjADE41gz91cYuLkr/tokens-tick"
```

**Response Example:**

```json
[
    "JUNK",
    "COIN",
    "TEST"
]
```

### GET /address/{address}/{tick}/balance

Retrieves detailed balance information for a specific token and address, including transfers.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | path, string | Yes | The address to query |
| tick | path, string | Yes | The token tick to retrieve balance for |

**Request Example:**

```bash
curl -X GET "https://junk20.junkiewally.xyz/address/7jkS5cdTNxdbqmrFVYjADE41gz91cYuLkr/JUNK/balance"
```

**Response Example:**

```json
{
    "tick": "JUNK",
    "balance": "1000",
    "transferable_balance": "1000",
    "transfers": [
        {
            "outpoint": "abc123...def:0",
            "value": "1000"
        }
    ],
    "transfers_count": 1
}
```

---

## Token Endpoints

### GET /tokens

Retrieves metadata for all tokens with filtering and search capabilities.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| offset | query, string | No | Token tick to start pagination from |
| limit | query, number | No | Maximum number of tokens to return (default: 100) |
| search | query, string | No | Search term to filter tokens by tick name |

**Request Example:**

```bash
curl -X GET "https://junk20.junkiewally.xyz/tokens?limit=10&search=JUNK"
```

**Response Example:**

```json
[
    {
        "tick": "JUNK",
        "max_supply": "21000000",
        "minted": "1000000",
        "holders": 150,
        "deploy_height": 840000,
        "deploy_txid": "abc123...def"
    }
]
```

### GET /token

Retrieves detailed information about a specific token.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tick | query, string | Yes | The token tick to retrieve information for |

**Request Example:**

```bash
curl -X GET "https://junk20.junkiewally.xyz/token?tick=JUNK"
```

**Response Example:**

```json
{
    "tick": "JUNK",
    "max_supply": "21000000",
    "minted": "1000000",
    "holders": 150,
    "deploy_height": 840000,
    "deploy_txid": "abc123...def",
    "limit_per_mint": "1000",
    "decimals": 18
}
```

### GET /token/proof/{address}/{outpoint}

Retrieves cryptographic proof for a specific token transfer.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | path, string | Yes | The address involved in the transfer |
| outpoint | path, string | Yes | The outpoint (txid:vout) of the transfer |

**Request Example:**

```bash
curl -X GET "https://junk20.junkiewally.xyz/token/proof/7jkS5cdTNxdbqmrFVYjADE41gz91cYuLkr/abc123...def:0"
```

**Response Example:**

```json
{
    "proof": "merkle_proof_data",
    "transfer": {
        "tick": "JUNK",
        "amount": "1000",
        "from": "DQR8...abc",
        "to": "DQR8...xyz"
    }
}
```

### GET /token-events/{tick}

Retrieves all events for a specific token, sorted by date of creation.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tick | path, string | Yes | The token tick to retrieve events for |
| offset | query, string | No | Event ID to start pagination from |
| limit | query, number | No | Maximum number of events to return (default: 100) |

**Request Example:**

```bash
curl -X GET "https://junk20.junkiewally.xyz/token-events/JUNK?limit=5"
```

**Response Example:**

```json
[
    {
        "event_id": "evt_123",
        "type": "deploy",
        "tick": "JUNK",
        "max_supply": "21000000",
        "limit_per_mint": "1000",
        "height": 840000,
        "txid": "abc123...def",
        "timestamp": 1703001600
    },
    {
        "event_id": "evt_124",
        "type": "mint",
        "tick": "JUNK",
        "amount": "1000",
        "to": "7jkS5cdTNxdbqmrFVYjADE41gz91cYuLkr",
        "height": 840001,
        "txid": "def456...ghi",
        "timestamp": 1703001700
    }
]
```

### GET /holders

Retrieves token holder information with filtering capabilities.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tick | query, string | No | Filter by specific token tick |
| offset | query, string | No | Address to start pagination from |
| limit | query, number | No | Maximum number of holders to return (default: 100) |

**Request Example:**

```bash
curl -X GET "https://junk20.junkiewally.xyz/holders?tick=JUNK&limit=10"
```

**Response Example:**

```json
[
    {
        "address": "7jkS5cdTNxdbqmrFVYjADE41gz91cYuLkr",
        "tick": "JUNK",
        "balance": "1000",
        "transferable_balance": "1000"
    }
]
```

### GET /holders-stats

Retrieves statistical information about token holders.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tick | query, string | No | Filter by specific token tick |

**Request Example:**

```bash
curl -X GET "https://junk20.junkiewally.xyz/holders-stats?tick=JUNK"
```

**Response Example:**

```json
{
    "tick": "JUNK",
    "total_holders": 150,
    "total_supply": "1000000",
    "average_balance": "6666.67",
    "median_balance": "1000",
    "top_holders": [
        {
            "address": "7jkS5cdTNxdbqmrFVYjADE41gz91cYuLkr",
            "balance": "50000",
            "percentage": "5.0"
        }
    ]
}
```

---

## Event Endpoints

### POST /events

Subscribes to real-time events via Server-Sent Events (SSE) for specific addresses and tokens.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| addresses | body, array | No | Array of addresses to monitor |
| ticks | body, array | No | Array of token ticks to monitor |

**Request Example:**

```bash
curl -X POST "https://junk20.junkiewally.xyz/events" \
  -H "Content-Type: application/json" \
  -d '{
    "addresses": ["7jkS5cdTNxdbqmrFVYjADE41gz91cYuLkr"],
    "ticks": ["JUNK"]
  }'
```

**Response Example (SSE Stream):**

```
data: {"type":"transfer","tick":"JUNK","amount":"100","from":"DQR8...abc","to":"7jkS5cdTNxdbqmrFVYjADE41gz91cYuLkr","height":850001,"txid":"ghi789...jkl"}

data: {"type":"mint","tick":"JUNK","amount":"1000","to":"7jkS5cdTNxdbqmrFVYjADE41gz91cYuLkr","height":850002,"txid":"mno012...pqr"}
```

### GET /events/{height}

Retrieves all token events that occurred at a specific block height.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| height | path, number | Yes | The block height to retrieve events for |

**Request Example:**

```bash
curl -X GET "https://junk20.junkiewally.xyz/events/850000"
```

**Response Example:**

```json
[
    {
        "type": "deploy",
        "tick": "JUNK",
        "max_supply": "21000000",
        "limit_per_mint": "1000",
        "height": 850000,
        "txid": "abc123...def",
        "timestamp": 1703001600
    }
]
```

### GET /txid/{txid}

Retrieves all token events associated with a specific transaction ID.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| txid | path, string | Yes | The transaction hash (ID) to retrieve events for |

**Request Example:**

```bash
curl -X GET "https://junk20.junkiewally.xyz/txid/abc123...def"
```

**Response Example:**

```json
[
    {
        "type": "transfer",
        "tick": "JUNK",
        "amount": "1000",
        "from": "DQR8...abc",
        "to": "7jkS5cdTNxdbqmrFVYjADE41gz91cYuLkr",
        "height": 850001,
        "txid": "abc123...def",
        "timestamp": 1703001700
    }
]
```

---

## Status Endpoints

### GET /status

Retrieves the current status and health information of the indexer service.

**Request Example:**

```bash
curl -X GET "https://junk20.junkiewally.xyz/status"
```

**Response Example:**

```json
{
    "status": "healthy",
    "version": "1.0.0",
    "network": "junkcoin",
    "current_height": 850100,
    "indexed_height": 850099,
    "sync_progress": 99.99,
    "uptime": 86400,
    "total_tokens": 1250,
    "total_addresses": 5000,
    "last_updated": 1703001800
}
```

### GET /proof-of-history

Retrieves cryptographic verification data for the indexer's historical accuracy.

**Request Example:**

```bash
curl -X GET "https://junk20.junkiewally.xyz/proof-of-history"
```

**Response Example:**

```json
{
    "merkle_root": "abc123...def",
    "block_height": 850099,
    "timestamp": 1703001800,
    "proof_chain": [
        "hash1...",
        "hash2...",
        "hash3..."
    ],
    "verification_status": "valid"
}
```

---

## Utility Endpoints

### GET /all-addresses

Retrieves a stream of all addresses that have token balances. This endpoint returns data as a streaming JSON array.

**Request Example:**

```bash
curl -X GET "https://junk20.junkiewally.xyz/all-addresses"
```

**Response Example (Streaming):**

```json
[
    "7jkS...Lkr",
    "7QR8...abc",
    "7QR8...def",
    "7QR8...ghi"
]
```

### GET /all-tickers

Retrieves a stream of all token tickers available in the indexer. This endpoint returns data as a streaming JSON array.

**Request Example:**

```bash
curl -X GET "https://junk20.junkiewally.xyz/all-tickers"
```

**Response Example (Streaming):**

```json
[
    "JUNK",
    "COIN",
    "TEST",
    "DEMO"
]
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
    "error": "Invalid parameter",
    "message": "The provided address format is invalid"
}
```

### 404 Not Found

```json
{
    "error": "Resource not found",
    "message": "Address not found or has no token balances"
}
```

### 500 Internal Server Error

```json
{
    "error": "Internal server error",
    "message": "An unexpected error occurred while processing the request"
}
```

---

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Standard endpoints**: 100 requests per minute per IP
- **Streaming endpoints**: 10 concurrent connections per IP
- **SSE endpoints**: 5 concurrent connections per IP

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1703001900
```

---

## Authentication

The JUNK20 Indexer API is currently **public and does not require authentication**. All endpoints are accessible without API keys or tokens.

---

## Support and Documentation

- **Interactive Documentation**: https://junk20.junkiewally.xyz/docs/
- **Base URL**: https://junk20.junkiewally.xyz
- **Network**: Junkcoin (JUNK20 tokens)
- **Status**: Read-only indexer service

For technical support or questions about the API, please refer to the interactive documentation or contact the development team.

---

*Network: Junkcoin*
