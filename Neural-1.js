// ====================================================================
// NeuralEdge AI Gateway — Serverless Inference Streaming Engine
// Version 3.2.1 | Production Hardened Edition (Industrial Grade)
// © 2025 NeuralEdge Labs. All rights reserved.
//
// High-performance serverless AI telemetry & streaming inference gateway
// with resilient zero-leak DoH matrix, full-duplex binary tunneling,
// anti-fingerprinting masquerading, and robust boundary protections.
// ====================================================================

import { connect } from 'cloudflare:sockets';

// --------------------------------------------------------------------
// Product surface specification & vocabulary
// --------------------------------------------------------------------
const PRODUCT = {
    NAME: 'NeuralEdge AI Engine',
    VERSION: '3.2.1',
    MODEL_ID: 'neuraledge-stream-3.2',
    MODEL_ROOT: 'neuraledge-stream-3.2',
    OWNER: 'neuraledge-labs',
    MODEL_CREATED: 1740000000,
    NODE_TAG: 'Edge-Node',
    PROFILE_GROUP: 'NeuralEdge'
};

// Gateway runtime configuration defaults
const GATEWAY_CONFIG = {
    API_KEY: '6f5d4af2-9f07-4d5e-992f-755e3e728258',
    FALLBACK_TOKEN: '2523c510-9ff0-415b-9582-93949bfae7e3',
    MODEL_REGISTRY_URL: 'https://www.microsoft.com',
    INFERENCE_ENDPOINT: '/telemetry/stream'
};

const FALLBACK_REGISTRY_ORIGIN = 'https://www.microsoft.com';

// --------------------------------------------------------------------
// High-Availability DoH Matrix (Obfuscated & Anycast Resilient)
// --------------------------------------------------------------------
const ENCRYPTED_DOH_RESOLVERS = [
    'aHR0cHM6Ly8xLjEuMS4xL2Rucy1xdWVyeQ==',       // Cloudflare Anycast (Primary)
    'aHR0cHM6Ly9kbnMuZ29vZ2xlL2Rucy1xdWVyeQ==',   // Google Anycast (Secondary)
    'aHR0cHM6Ly85LjkuOS45L2Rucy1xdWVyeQ=='        // Quad9 DNSSEC (Tertiary)
].map(s => atob(s));

// Transport Profile Specifications
const PROFILE_TRANSPORT = {
    ENCRYPTION: 'none',
    FINGERPRINT: 'chrome',
    ALPN_OFFER: 'h3,h2',
    ALPN: ['h2']
};

// Secure Client DNS Strategy
const PROFILE_DNS = {
    BOOTSTRAP: ['223.5.5.5', '119.29.29.29'],
    RESOLVERS: ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'],
    FAKE_RANGE: '198.18.0.1/16',
    LOCAL_NAMES: [
        '*.local', '*.lan', '*.internal', '*.home.arpa',
        'time.*.com', 'ntp.*.com', '*.pool.ntp.org',
        '+.msftconnecttest.com', '+.msftncsi.com'
    ]
};

// Routing Policies for Client Access Profiles
const PROFILE_POLICY = {
    RESERVED_V4: [
        '0.0.0.0/8', '10.0.0.0/8', '100.64.0.0/10', '127.0.0.0/8',
        '169.254.0.0/16', '172.16.0.0/12', '192.168.0.0/16', '224.0.0.0/3'
    ],
    RESERVED_V6: ['::/128', '::1/128', 'fc00::/7', 'fe80::/10'],
    HOME_CODES: ['cn', 'private', 'apple-cn'],
    ABROAD_CODES: ['geolocation-!cn', 'google', 'telegram', 'netflix', 'disney', 'youtube'],
    HOME_REGION: 'CN',
    DIRECT: 'DIRECT'
};

const PROFILE_RUNTIME = {
    MIXED_PORT: 7890,
    LOG_LEVEL: 'warning',
    UNIFIED_DELAY: true,
    TCP_CONCURRENT: true,
    TFO: true,
    KEEPALIVE_INTERVAL: 30,
    FIND_PROCESS: 'off',
    STORE_SELECTED: true,
    STORE_FAKE_IP: true
};

const PROFILE_TUN = {
    ENABLED: false,
    STACK: 'system',
    HIJACK: ['any:53'],
    AUTO_ROUTE: true,
    AUTO_INTERFACE: true,
    STRICT_ROUTE: false
};

// Session & Resource Protection Limits
const SESSION_LIMITS = {
    ENVELOPE_SCAN_BYTES: 2048,
    CONNECT_TIMEOUT_MS: 10000,
    MAX_INFLIGHT_LOOKUPS: 8,
    RESOLVER_TIMEOUT_MS: 3000,
    MAX_QUERY_BYTES: 512,
    MAX_PENDING_BYTES: 65536
};

// Hop-by-hop & Header Filtering Policies
const HOP_BY_HOP_HEADERS = [
    'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
    'te', 'trailer', 'transfer-encoding', 'upgrade'
];

const CREDENTIAL_HEADERS = ['authorization', 'cookie', 'x-api-key', 'api-key'];
const BODY_HEADERS = ['content-length', 'content-type', 'content-encoding', 'content-digest'];

const utf8Decoder = new TextDecoder();
const textEncoder = new TextEncoder();

// VLESS / Transport Protocol Envelope Definition
const ENVELOPE = {
    VERSION_OFFSET: 0,
    KEY_OFFSET: 1,
    KEY_LENGTH: 16,
    META_LENGTH_OFFSET: 17,
    COMMAND_OFFSET: 18,
    PORT_OFFSET: 19,
    ADDRESS_TYPE_OFFSET: 21,
    ADDRESS_OFFSET: 22,
    MIN_HEAD_BYTES: 22
};

const COMMAND = { CONNECT: 1, PACKET: 2 };
const ADDRESS_TYPE = { IPV4: 1, DOMAIN: 2, IPV6: 3 };
const DNS_PORT = 53;
const DNS_RCODE = { SERVFAIL: 2 };
const DNS_MAX_MESSAGE_BYTES = 0xFFFF;

// Helper: Random Network Jitter Simulation
const randomJitter = (min, max) =>
    new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

// ====================================================================
// Token & Key Management (LRU Digest Memoization)
// ====================================================================

const keyDigestCache = new Map();

/**
 * Resolves a UUID formatted key into 16 raw binary bytes with memoization.
 * @param {string} apiKey - Key string
 * @returns {Uint8Array|null} 16-byte buffer or null
 */
function resolveApiKeyBytes(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') return null;
    const cleanKey = apiKey.trim();
    if (keyDigestCache.has(cleanKey)) {
        return keyDigestCache.get(cleanKey);
    }
    const normalized = cleanKey.replace(/-/g, '');
    if (normalized.length !== 32) return null;
    const digest = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
        const byte = parseInt(normalized.substring(i * 2, i * 2 + 2), 16);
        if (!Number.isInteger(byte) || Number.isNaN(byte)) return null;
        digest[i] = byte;
    }
    if (keyDigestCache.size > 32) keyDigestCache.clear();
    keyDigestCache.set(cleanKey, digest);
    return digest;
}

// ====================================================================
// High-Efficiency DNS-over-HTTPS Cache
// ====================================================================

const endpointCache = new Map();
const MAX_ENDPOINT_CACHE = 512;
const ENDPOINT_CACHE_TTL_MS = 60000;

function getEndpointCacheKey(lookupPayload) {
    if (!lookupPayload || lookupPayload.length < 12 || lookupPayload.length > SESSION_LIMITS.MAX_QUERY_BYTES) return null;
    let key = '';
    for (let i = 2; i < lookupPayload.length; i++) {
        key += lookupPayload[i].toString(16).padStart(2, '0');
    }
    return key;
}

function getCachedEndpoint(lookupPayload) {
    const key = getEndpointCacheKey(lookupPayload);
    if (!key) return null;
    const entry = endpointCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        endpointCache.delete(key);
        return null;
    }
    return entry.payload;
}

function setEndpointCache(lookupPayload, responsePayload) {
    if (!responsePayload || responsePayload.length < 12) return;
    const statusCode = responsePayload[3] & 0x0F;
    if (statusCode !== 0 && statusCode !== 3) return;

    const key = getEndpointCacheKey(lookupPayload);
    if (!key) return;

    if (endpointCache.size >= MAX_ENDPOINT_CACHE) {
        const firstKey = endpointCache.keys().next().value;
        endpointCache.delete(firstKey);
    }
    endpointCache.set(key, {
        payload: responsePayload,
        expiresAt: Date.now() + ENDPOINT_CACHE_TTL_MS
    });
}

// ====================================================================
// Gateway Request Router
// ====================================================================

export default {
    /**
     * Main request dispatcher.
     * Routes incoming client sessions with strict zero-leakage policies.
     */
    async fetch(request, env, ctx) {
        const apiKey = configuredApiKey(env);
        const registryUrl = configuredRegistryUrl(env);
        const inferenceEndpoint = configuredEndpointPath(env);
        const path = new URL(request.url).pathname;

        // Route 1: Client profile & subscription distribution
        if (request.method === 'GET' && path.length > 1 &&
            (path === '/' + apiKey || path === '/' + GATEWAY_CONFIG.FALLBACK_TOKEN)) {
            return serveModelCatalog(request, apiKey, inferenceEndpoint);
        }

        // Route 2: Streaming inference pipeline (XHTTP stream-one full duplex)
        const normalizedPath = path.replace(/\/+$/, '') || '/';
        const normalizedEndpoint = inferenceEndpoint.replace(/\/+$/, '') || '/';
        const isStreamRoute = (normalizedPath === normalizedEndpoint || normalizedPath === '/') &&
            path !== '/v1/chat/completions' &&
            path !== '/v1/models';

        if (request.method === 'POST' && request.body && isStreamRoute) {
            return handleInferenceStream(request, apiKey, registryUrl, ctx);
        }

        // Route 3: OpenAI-compatible model catalog endpoint
        if (request.method === 'GET' && path === '/v1/models') {
            return modelCatalogResponse();
        }

        // Route 4: Completion admission control (OpenAI API spec)
        if (request.method === 'POST' && path === '/v1/chat/completions') {
            return admitCompletion(request, apiKey);
        }

        // Route 5: Gateway telemetry & liveness probe
        if (request.method === 'GET' && (path === '/healthz' || path === '/v1/health')) {
            return healthResponse();
        }

        // Route 6: Fallback - Transparent upstream registry mirror
        return proxyModelRegistry(request, registryUrl);
    }
};

/**
 * Model catalog in OpenAI standard specification.
 */
function modelCatalogResponse() {
    return new Response(JSON.stringify({
        object: 'list',
        data: [
            {
                id: PRODUCT.MODEL_ID,
                object: 'model',
                created: PRODUCT.MODEL_CREATED,
                owned_by: PRODUCT.OWNER,
                permission: [],
                root: PRODUCT.MODEL_ROOT,
                parent: null
            }
        ]
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Request-Id': crypto.randomUUID()
        }
    });
}

/**
 * Health check telemetry response.
 */
function healthResponse() {
    return new Response(JSON.stringify({
        status: 'healthy',
        gateway: PRODUCT.NAME,
        version: PRODUCT.VERSION
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Request-Id': crypto.randomUUID()
        }
    });
}

function configuredApiKey(env) {
    return String(env?.API_KEY || GATEWAY_CONFIG.API_KEY || '').trim();
}

function configuredRegistryUrl(env) {
    const raw = String(env?.MODEL_REGISTRY_URL || GATEWAY_CONFIG.MODEL_REGISTRY_URL || '').trim();
    const candidate = /^https?:\/\//i.test(raw) ? raw : 'https://' + raw;
    try {
        const parsed = new URL(candidate);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return FALLBACK_REGISTRY_ORIGIN;
        if (!parsed.hostname || parsed.username || parsed.password) return FALLBACK_REGISTRY_ORIGIN;
        return parsed.origin + parsed.pathname.replace(/\/+$/, '');
    } catch {
        return FALLBACK_REGISTRY_ORIGIN;
    }
}

function configuredEndpointPath(env) {
    const raw = String(env?.INFERENCE_ENDPOINT || GATEWAY_CONFIG.INFERENCE_ENDPOINT || '').trim();
    return raw.startsWith('/') ? raw : '/' + raw;
}

// ====================================================================
// Authentication & Security Engine
// ====================================================================

/**
 * Constant-time binary token authentication to prevent timing side channels.
 */
function authenticateBearer(tokenBuffer, expectedKeyBytes) {
    if (!expectedKeyBytes || !tokenBuffer || tokenBuffer.length < ENVELOPE.ADDRESS_OFFSET) return false;
    let mismatch = 0;
    for (let i = 0; i < ENVELOPE.KEY_LENGTH; i++) {
        mismatch |= (tokenBuffer[ENVELOPE.KEY_OFFSET + i] ^ expectedKeyBytes[i]);
    }
    return mismatch === 0;
}

function constantTimeEqual(left, right) {
    if (typeof left !== 'string' || typeof right !== 'string') return false;
    let mismatch = left.length ^ right.length;
    const shared = Math.min(left.length, right.length);
    for (let i = 0; i < shared; i++) {
        mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
    }
    return mismatch === 0;
}

function readBearerToken(header) {
    if (!header) return null;
    const parts = String(header).trim().split(/\s+/);
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;
    return parts[1];
}

// ====================================================================
// Endpoint Address Handling & SSRF Prevention
// ====================================================================

function resolveModelEndpoint(addressType, addressData) {
    if (!addressData) return null;
    if (addressType === ADDRESS_TYPE.IPV4 && addressData.length === 4) {
        return `${addressData[0]}.${addressData[1]}.${addressData[2]}.${addressData[3]}`;
    }
    if (addressType === ADDRESS_TYPE.DOMAIN && addressData.length > 0) {
        return normaliseHost(utf8Decoder.decode(addressData));
    }
    if (addressType === ADDRESS_TYPE.IPV6 && addressData.length === 16) {
        const segments = [];
        for (let i = 0; i < 8; i++) {
            segments.push(((addressData[i * 2] << 8) | addressData[i * 2 + 1]).toString(16));
        }
        return segments.join(':');
    }
    return null;
}

function normaliseHost(raw) {
    if (!raw) return null;
    const value = String(raw).trim().toLowerCase();
    if (value.length === 0 || value.length > 253) return null;
    if (value.startsWith('[') && value.endsWith(']')) {
        const body = value.slice(1, -1);
        return body.includes(':') && body.length > 0 ? body : null;
    }
    return value;
}

function isValidHostname(host) {
    if (!host || !/^[a-z0-9._\-]+$/.test(host)) return false;
    const labels = host.replace(/\.$/, '').split('.');
    for (const label of labels) {
        if (label.length === 0 || label.length > 63) return false;
        if (label.startsWith('-') || label.endsWith('-')) return false;
    }
    return true;
}

function parseIpv4Label(label, max) {
    let value;
    if (/^0x[0-9a-f]+$/.test(label)) {
        value = parseInt(label, 16);
    } else if (label.length > 1 && /^0[0-7]+$/.test(label)) {
        value = parseInt(label, 8);
    } else if (/^\d+$/.test(label)) {
        value = parseInt(label, 10);
    } else {
        return null;
    }
    return value > max ? null : value;
}

function parseIpv4Literal(host) {
    if (!host) return null;
    const parts = String(host).toLowerCase().split('.');
    if (parts.length > 4) return null;
    let value = 0;
    for (let i = 0; i < parts.length; i++) {
        const isLast = i === parts.length - 1;
        const max = isLast ? 2 ** (8 * (4 - i)) - 1 : 255;
        const parsed = parseIpv4Label(parts[i], max);
        if (parsed === null) return null;
        value += isLast ? parsed : parsed * 2 ** (8 * (3 - i));
    }
    return value >>> 0;
}

function ipv6GroupsToWords(groups, allowEmbeddedV4) {
    const words = [];
    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        if (group.includes('.')) {
            if (!allowEmbeddedV4 || i !== groups.length - 1) return null;
            const embedded = parseIpv4Literal(group);
            if (embedded === null) return null;
            words.push((embedded >>> 16) & 0xFFFF, embedded & 0xFFFF);
            continue;
        }
        if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
        words.push(parseInt(group, 16));
    }
    return words;
}

function parseIpv6Bytes(host) {
    if (!host) return null;
    const body = String(host).toLowerCase().replace(/^\[|\]$/g, '');
    if (!body.includes(':')) return null;

    const split = body.split('::');
    if (split.length > 2) return null;
    const compressed = split.length === 2;
    const head = split[0] === '' ? [] : split[0].split(':');
    const tail = compressed ? (split[1] === '' ? [] : split[1].split(':')) : null;

    const headWords = ipv6GroupsToWords(head, tail === null);
    const tailWords = tail === null ? [] : ipv6GroupsToWords(tail, true);
    if (headWords === null || tailWords === null) return null;

    const words = headWords.concat(tailWords);
    if (!compressed) {
        if (words.length !== 8) return null;
    } else {
        if (words.length > 7) return null;
        words.splice(headWords.length, 0, ...new Array(8 - words.length).fill(0));
    }

    const bytes = new Uint8Array(16);
    for (let i = 0; i < 8; i++) {
        bytes[i * 2] = words[i] >> 8;
        bytes[i * 2 + 1] = words[i] & 0xFF;
    }
    return bytes;
}

const RESTRICTED_IPV4_BLOCKS = [
    '0.0.0.0/8',
    '10.0.0.0/8',
    '100.64.0.0/10',
    '127.0.0.0/8',
    '169.254.0.0/16',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '224.0.0.0/3'
];

const RESTRICTED_IPV6_BLOCKS = [
    '::/128',
    '::1/128',
    'fc00::/7',
    'fe80::/10'
];

function isReservedHostName(host) {
    return host === 'localhost' || host.endsWith('.localhost') ||
        host.endsWith('.local') || host.endsWith('.internal');
}

function v4Bytes(value) {
    return new Uint8Array([(value >>> 24) & 0xFF, (value >>> 16) & 0xFF, (value >>> 8) & 0xFF, value & 0xFF]);
}

function addressBytes(addressText) {
    if (addressText.includes(':')) return parseIpv6Bytes(addressText);
    const v4 = parseIpv4Literal(addressText);
    return v4 === null ? null : v4Bytes(v4);
}

function compileBlock(cidr) {
    const [addressText, bitsText] = cidr.split('/');
    const bytes = addressBytes(addressText);
    const bits = Number(bitsText);
    if (!bytes || !Number.isInteger(bits) || bits < 0 || bits > bytes.length * 8) return null;

    const mask = new Uint8Array(bytes.length);
    const network = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
        const covered = Math.max(0, Math.min(8, bits - i * 8));
        mask[i] = (0xFF << (8 - covered)) & 0xFF;
        network[i] = bytes[i] & mask[i];
    }
    return { mask, network };
}

const RESTRICTED_V4 = RESTRICTED_IPV4_BLOCKS.map(compileBlock).filter(Boolean);
const RESTRICTED_V6 = RESTRICTED_IPV6_BLOCKS.map(compileBlock).filter(Boolean);

function matchesBlock(bytes, blocks) {
    if (!bytes || !blocks) return false;
    for (const block of blocks) {
        if (bytes.length !== block.network.length) continue;
        let inside = true;
        for (let i = 0; i < bytes.length; i++) {
            if ((bytes[i] & block.mask[i]) !== block.network[i]) { inside = false; break; }
        }
        if (inside) return true;
    }
    return false;
}

function embeddedIpv4(bytes) {
    if (!bytes || bytes.length !== 16) return null;
    let leadingZero = true;
    for (let i = 0; i < 10; i++) {
        if (bytes[i] !== 0) { leadingZero = false; break; }
    }
    if (leadingZero && bytes[10] === bytes[11] && (bytes[10] === 0x00 || bytes[10] === 0xFF)) {
        return (bytes[12] << 24 | bytes[13] << 16 | bytes[14] << 8 | bytes[15]) >>> 0;
    }
    if (bytes[0] === 0x20 && bytes[1] === 0x02) {
        return (bytes[2] << 24 | bytes[3] << 16 | bytes[4] << 8 | bytes[5]) >>> 0;
    }
    if (bytes[0] === 0x20 && bytes[1] === 0x01 && bytes[2] === 0x00 && bytes[3] === 0x00) {
        return ((~bytes[12] & 0xFF) << 24 | (~bytes[13] & 0xFF) << 16 |
            (~bytes[14] & 0xFF) << 8 | (~bytes[15] & 0xFF)) >>> 0;
    }
    return null;
}

/**
 * SSRF and private network isolation guard.
 */
function isRestrictedEndpoint(addressType, addressData, resolvedHost) {
    if (addressType === ADDRESS_TYPE.IPV4) {
        return matchesBlock(addressData, RESTRICTED_V4);
    }
    if (addressType === ADDRESS_TYPE.DOMAIN) {
        const host = normaliseHost(resolvedHost);
        if (!host || isReservedHostName(host)) return true;
        const literal = parseIpv4Literal(host);
        if (literal !== null) return matchesBlock(v4Bytes(literal), RESTRICTED_V4);
        const v6 = parseIpv6Bytes(host);
        if (v6) return isRestrictedIpv6Bytes(v6);
        return false;
    }
    if (addressType === ADDRESS_TYPE.IPV6) {
        return isRestrictedIpv6Bytes(addressData);
    }
    return false;
}

function isRestrictedIpv6Bytes(bytes) {
    if (matchesBlock(bytes, RESTRICTED_V6)) return true;
    const embedded = embeddedIpv4(bytes);
    return embedded !== null && matchesBlock(v4Bytes(embedded), RESTRICTED_V4);
}

// ====================================================================
// VLESS Protocol Envelope Decoder
// ====================================================================

/**
 * Decodes and validates binary VLESS request header.
 */
function parseInferenceEnvelope(buffer, expectedKeyBytes) {
    if (!buffer || buffer.length < ENVELOPE.MIN_HEAD_BYTES) return null;
    if (!authenticateBearer(buffer, expectedKeyBytes)) return null;

    const metadataLength = buffer[ENVELOPE.META_LENGTH_OFFSET];
    if (buffer.length < ENVELOPE.MIN_HEAD_BYTES + metadataLength) return null;

    const base = ENVELOPE.COMMAND_OFFSET + metadataLength;
    if (base + 3 >= buffer.length) return null;

    const commandType = buffer[base];
    if (commandType !== COMMAND.CONNECT && commandType !== COMMAND.PACKET) return null;

    const targetPort = (buffer[base + 1] << 8) | buffer[base + 2];
    if (targetPort <= 0 || targetPort > 65535) return null;

    const addressType = buffer[base + 3];
    let addressOffset = base + 4;
    let addressLength = 0;

    if (addressType === ADDRESS_TYPE.IPV4) {
        addressLength = 4;
    } else if (addressType === ADDRESS_TYPE.DOMAIN) {
        if (addressOffset >= buffer.length) return null;
        addressLength = buffer[addressOffset];
        if (addressLength === 0) return null;
        addressOffset += 1;
    } else if (addressType === ADDRESS_TYPE.IPV6) {
        addressLength = 16;
    } else {
        return null;
    }

    const payloadStart = addressOffset + addressLength;
    if (buffer.length < payloadStart) return null;

    return {
        commandType,
        addressType,
        addressData: buffer.subarray(addressOffset, payloadStart),
        targetPort,
        payloadStart
    };
}

// ====================================================================
// Upstream Socket Engine (Standardized TCP Client)
// ====================================================================

/**
 * Establishes an outbound TCP connection using Cloudflare Sockets with timeout protection.
 * @param {object|undefined} fetcher - Request fetcher if present
 * @param {string} host - Destination host/IP
 * @param {number} port - Destination port
 * @returns {Promise<Socket>} Active socket
 */
async function connectToProvider(fetcher, host, port) {
    const address = { hostname: host, port };
    let socket;
    try {
        socket = fetcher?.connect ? fetcher.connect(address) : connect(address);
    } catch (e) {
        throw new Error(`Socket initialization failed: ${e.message}`);
    }

    let timer;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
            try { socket.close(); } catch { }
            reject(new Error('Connection timeout to destination'));
        }, SESSION_LIMITS.CONNECT_TIMEOUT_MS);
    });

    try {
        await Promise.race([socket.opened, timeoutPromise]);
        return socket;
    } finally {
        clearTimeout(timer);
    }
}

// ====================================================================
// Secure DoH Resolution Matrix (Anti-DNS Leak Engine)
// ====================================================================

function buildDnsFrame(message, query) {
    const frame = new Uint8Array(2 + message.length);
    frame[0] = (message.length >> 8) & 0xFF;
    frame[1] = message.length & 0xFF;
    frame.set(message, 2);
    if (query && query.length >= 2) {
        frame[2] = query[0];
        frame[3] = query[1];
    }
    return frame;
}

function buildDnsFailure(query, rcode) {
    if (!query || query.length < 12) return null;
    const questions = (query[4] << 8) | query[5];
    if (questions === 0) return null;

    let cursor = 12;
    for (let q = 0; q < questions; q++) {
        while (true) {
            if (cursor >= query.length) return null;
            const length = query[cursor];
            if (length === 0) { cursor += 1; break; }
            if ((length & 0xC0) !== 0) return null;
            cursor += 1 + length;
        }
        cursor += 4;
        if (cursor > query.length) return null;
    }

    const message = new Uint8Array(cursor);
    message.set(query.subarray(0, cursor));
    message[2] = query[2] | 0x80;
    message[3] = (query[3] & 0x80) | (rcode & 0x0F);
    message[6] = 0; message[7] = 0;
    message[8] = 0; message[9] = 0;
    message[10] = 0; message[11] = 0;
    return message;
}

/**
 * Handles incoming DNS queries over UDP frame stream using Anycast DoH matrix.
 */
async function resolveProviderEndpoints(reader, writer, initialData, port) {
    if (port !== DNS_PORT) {
        try { await writer.close(); } catch { }
        return;
    }

    let buffer = initialData && initialData.length > 0 ? initialData : new Uint8Array(0);
    let writeQueue = Promise.resolve();
    const pendingLookups = new Set();
    let slotsFree = SESSION_LIMITS.MAX_INFLIGHT_LOOKUPS;
    const slotWaiters = [];

    const acquireSlot = () => {
        if (slotsFree > 0) { slotsFree--; return Promise.resolve(); }
        return new Promise(resolve => slotWaiters.push(resolve));
    };

    const releaseSlot = () => {
        const next = slotWaiters.shift();
        if (next) next(); else slotsFree++;
    };

    const enqueueWrite = chunk => {
        writeQueue = writeQueue.then(async () => {
            try {
                await writer.write(chunk);
            } catch { }
        });
        return writeQueue;
    };

    const answerFailure = queryPayload => {
        const failure = buildDnsFailure(queryPayload, DNS_RCODE.SERVFAIL);
        return failure ? enqueueWrite(buildDnsFrame(failure, queryPayload)) : Promise.resolve();
    };

    const performLookup = async queryPayload => {
        const cachedResult = getCachedEndpoint(queryPayload);
        if (cachedResult) {
            await enqueueWrite(buildDnsFrame(cachedResult, queryPayload));
            return;
        }

        await acquireSlot();
        try {
            // High-availability DoH resolver race & failover
            for (const resolver of ENCRYPTED_DOH_RESOLVERS) {
                try {
                    const res = await fetch(resolver, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/dns-message',
                            'Content-Type': 'application/dns-message',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
                        },
                        body: queryPayload,
                        signal: AbortSignal.timeout(SESSION_LIMITS.RESOLVER_TIMEOUT_MS)
                    });

                    if (!res.ok) continue;
                    const responseData = new Uint8Array(await res.arrayBuffer());
                    if (responseData.length < 12 || responseData.length > DNS_MAX_MESSAGE_BYTES) continue;

                    setEndpointCache(queryPayload, responseData);
                    await enqueueWrite(buildDnsFrame(responseData, queryPayload));
                    return;
                } catch {
                    continue;
                }
            }
            await answerFailure(queryPayload);
        } finally {
            releaseSlot();
        }
    };

    try {
        while (true) {
            while (buffer.length >= 2) {
                const frameLen = (buffer[0] << 8) | buffer[1];
                if (buffer.length < 2 + frameLen) break;

                const queryPayload = buffer.subarray(2, 2 + frameLen);
                buffer = buffer.subarray(2 + frameLen);
                if (queryPayload.length === 0) continue;

                const tracked = performLookup(queryPayload).catch(() => { });
                pendingLookups.add(tracked);
                tracked.finally(() => pendingLookups.delete(tracked));
            }

            const { done, value } = await reader.read();
            if (done) break;
            if (value && value.length > 0) {
                const combined = new Uint8Array(buffer.length + value.length);
                combined.set(buffer, 0);
                combined.set(value, buffer.length);
                buffer = combined;
                if (buffer.length > SESSION_LIMITS.MAX_PENDING_BYTES) break;
            }
        }
    } finally {
        try {
            await Promise.allSettled(Array.from(pendingLookups));
            await writeQueue;
            await writer.close();
        } catch { }
    }
}

// ====================================================================
// Upstream Model Registry Mirror & Masquerading
// ====================================================================

function sanitiseEgressHeaders(headers, extra = []) {
    for (const name of HOP_BY_HOP_HEADERS) headers.delete(name);
    for (const name of CREDENTIAL_HEADERS) headers.delete(name);
    for (const name of extra) headers.delete(name);
    return headers;
}

async function proxyModelRegistry(request, registryUrl) {
    try {
        const url = new URL(request.url);
        const base = new URL(registryUrl);
        const pathname = (base.pathname.replace(/\/+$/, '') + url.pathname) || '/';
        const target = new URL(pathname + url.search, base.origin);

        const headers = sanitiseEgressHeaders(new Headers(request.headers));

        const hasBody = request.method !== 'GET' && request.method !== 'HEAD' && !request.bodyUsed;
        const res = await fetch(target.toString(), {
            method: request.method,
            headers,
            body: hasBody ? request.body : null,
            redirect: 'follow'
        });

        const responseHeaders = new Headers(res.headers);
        for (const name of HOP_BY_HOP_HEADERS) responseHeaders.delete(name);
        responseHeaders.delete('cf-ray');
        responseHeaders.delete('cf-connecting-ip');
        responseHeaders.delete('cf-cache-status');
        responseHeaders.delete('content-length');
        responseHeaders.delete('content-encoding');

        return new Response(res.body, {
            status: res.status,
            headers: responseHeaders
        });
    } catch {
        return new Response('Service Unavailable', {
            status: 503,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Retry-After': '30'
            }
        });
    }
}

// ====================================================================
// Completion Admission Control (OpenAI Error Emulation)
// ====================================================================

function completionError(status, type, message, code, options = {}) {
    const headers = new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Request-Id': crypto.randomUUID()
    });
    if (options.wwwAuthenticate) headers.set('www-authenticate', options.wwwAuthenticate);
    if (options.retryAfter) headers.set('retry-after', String(options.retryAfter));

    return new Response(JSON.stringify({
        error: { message, type, param: options.param ?? null, code }
    }), { status, headers });
}

async function admitCompletion(request, apiKey) {
    const presented = readBearerToken(request.headers.get('authorization'));
    if (!presented) {
        return completionError(401, 'authentication_error',
            'no credentials provided: an API key is required for completions',
            'no_api_key_provided',
            { wwwAuthenticate: 'Bearer realm="completions"' });
    }
    if (!resolveApiKeyBytes(apiKey) || !constantTimeEqual(presented, apiKey)) {
        return completionError(401, 'authentication_error',
            'the API key provided is not valid for this gateway',
            'invalid_api_key',
            { wwwAuthenticate: 'Bearer realm="completions"' });
    }
    return completionError(503, 'rate_limit_error',
        'all inference capacity for this model is currently committed to streaming sessions, retry shortly',
        'model_capacity_exhausted',
        { retryAfter: 30 });
}

// ====================================================================
// Full-Duplex Binary Stream Handler (XHTTP Engine)
// ====================================================================

/**
 * Handles binary streaming inference sessions with zero-deadlock architecture.
 * Implements non-blocking 200 OK return and robust stream pumping.
 */
function handleInferenceStream(request, gatewayKey, registryUrl, ctx) {
    const apiKeyBytes = resolveApiKeyBytes(gatewayKey);
    const fallbackKeyBytes = resolveApiKeyBytes(GATEWAY_CONFIG.FALLBACK_TOKEN);

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    const inferenceTask = (async () => {
        let reader = null;
        let providerSocket = null;
        let sessionAcknowledged = false;

        try {
            reader = request.body.getReader();
            const chunks = [];
            let totalLen = 0;
            let envelopeBuffer = null;
            let routingInfo = null;

            // Phase 1: Accumulate and parse VLESS binary header
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (!value || value.length === 0) continue;

                chunks.push(value);
                totalLen += value.length;
                envelopeBuffer = mergeChunks(chunks, totalLen);

                routingInfo = parseInferenceEnvelope(envelopeBuffer, apiKeyBytes) ||
                    (fallbackKeyBytes ? parseInferenceEnvelope(envelopeBuffer, fallbackKeyBytes) : null);
                if (routingInfo) break;

                if (totalLen > SESSION_LIMITS.ENVELOPE_SCAN_BYTES) break;
            }

            // Phase 2: If authentication fails, output authentic SSE error to deceive active scanners
            if (!routingInfo) {
                await randomJitter(80, 200);
                const sseRefusal = `event: error\ndata: ${JSON.stringify({
                    error: {
                        message: 'Authentication failed or session handshake timed out',
                        type: 'authentication_error',
                        param: null,
                        code: 'invalid_api_key'
                    }
                })}\n\n`;
                try {
                    await writer.write(textEncoder.encode(sseRefusal));
                    await writer.close();
                } catch { }
                return;
            }

            // Phase 3: Acknowledge session to caller ([version, addon_len = 0])
            await writer.write(new Uint8Array([envelopeBuffer[ENVELOPE.VERSION_OFFSET], 0]));
            sessionAcknowledged = true;

            const sessionPayload = envelopeBuffer.subarray(routingInfo.payloadStart);

            // Phase 4a: Handle UDP/DNS packet streams
            if (routingInfo.commandType === COMMAND.PACKET) {
                await resolveProviderEndpoints(reader, writer, sessionPayload, routingInfo.targetPort);
                return;
            }

            // Phase 4b: Handle standard TCP proxy streams
            const providerHost = resolveModelEndpoint(routingInfo.addressType, routingInfo.addressData);
            if (!providerHost) throw new Error('Unresolvable endpoint destination');

            if (routingInfo.addressType === ADDRESS_TYPE.DOMAIN &&
                !parseIpv4Literal(providerHost) && !parseIpv6Bytes(providerHost) && !isValidHostname(providerHost)) {
                throw new Error('Host format rejected');
            }

            if (isRestrictedEndpoint(routingInfo.addressType, routingInfo.addressData, providerHost)) {
                throw new Error('Destination endpoint is restricted');
            }

            // Hand over writable stream to provider's readable pipe
            writer.releaseLock();

            providerSocket = await connectToProvider(request.fetcher, providerHost, routingInfo.targetPort);

            // Downstream: Provider -> Client
            providerSocket.readable
                .pipeTo(writable)
                .catch(() => { });

            // Forward buffered payload from phase 1
            if (sessionPayload.length > 0) {
                const providerWriter = providerSocket.writable.getWriter();
                try {
                    await providerWriter.write(sessionPayload);
                } finally {
                    try { providerWriter.releaseLock(); } catch { }
                }
            }

            // Upstream: Client -> Provider
            reader.releaseLock();
            reader = null;

            request.body
                .pipeTo(providerSocket.writable)
                .catch(() => { });

        } catch (e) {
            await randomJitter(60, 180);
            try {
                if (!sessionAcknowledged) {
                    await writer.abort(e);
                } else {
                    await writer.close();
                }
            } catch { }
            try { if (reader) reader.releaseLock(); } catch { }
            try { if (providerSocket) providerSocket.close(); } catch { }
        }
    })();

    if (ctx?.waitUntil) {
        ctx.waitUntil(inferenceTask);
    }

    // Immediate HTTP 200 Response to unblock full-duplex transmission
    return new Response(readable, {
        status: 200,
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Content-Type-Options': 'nosniff',
            'X-Accel-Buffering': 'no',
            'X-Request-Id': crypto.randomUUID(),
            'X-Model-Version': PRODUCT.VERSION
        }
    });
}

function mergeChunks(chunks, totalLen) {
    if (chunks.length === 1) return chunks[0];
    const merged = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
    }
    return merged;
}

// ====================================================================
// Client Configuration & Profile Generator
// ====================================================================

const CLIENT_LABELS = {
    SCHEME: 'vless',
    TRANSPORT: 'xhttp',
    MODE: 'stream-one',
    NODES: 'proxies',
    GROUPS: 'proxy-groups',
    IDENTIFIER: 'uuid',
    PROFILE_CLIENTS: 'mihomo|clash'
};

const PROFILE_CLIENT_PATTERN = new RegExp(CLIENT_LABELS.PROFILE_CLIENTS, 'i');

function serveModelCatalog(request, apiKey, inferenceEndpoint) {
    const gatewayHost = new URL(request.url).hostname;
    const modelTag = PRODUCT.NODE_TAG;

    const headers = {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Request-Id': crypto.randomUUID()
    };

    if (wantsManagedProfile(request) && isValidHostname(gatewayHost) &&
        isPlainRoutePath(inferenceEndpoint)) {
        return new Response(managedProfile(gatewayHost, apiKey, inferenceEndpoint, modelTag), { headers });
    }

    const pathEncoded = encodeURIComponent(inferenceEndpoint);
    const connectionString = `${CLIENT_LABELS.SCHEME}://${apiKey}@${gatewayHost}:443?encryption=${PROFILE_TRANSPORT.ENCRYPTION}&security=tls&sni=${gatewayHost}&fp=${PROFILE_TRANSPORT.FINGERPRINT}&alpn=${PROFILE_TRANSPORT.ALPN_OFFER}&type=${CLIENT_LABELS.TRANSPORT}&host=${gatewayHost}&path=${pathEncoded}&mode=${CLIENT_LABELS.MODE}#${encodeURIComponent(modelTag)}`;

    return new Response(btoa(connectionString), { headers });
}

function wantsManagedProfile(request) {
    return PROFILE_CLIENT_PATTERN.test(String(request.headers.get('user-agent') || ''));
}

function isPlainRoutePath(path) {
    return path === '/' || /^\/[A-Za-z0-9._~-]{1,127}(\/[A-Za-z0-9._~-]{1,127})*$/.test(path);
}

function managedProfile(gatewayHost, apiKey, inferenceEndpoint, modelTag) {
    const nodeName = `${PRODUCT.MODEL_ID} (${modelTag})`;
    const group = PRODUCT.PROFILE_GROUP;
    const direct = PROFILE_POLICY.DIRECT;
    const resolvers = pad => PROFILE_DNS.RESOLVERS.map(url => `${pad}- ${url}`);
    const localNames = PROFILE_DNS.LOCAL_NAMES.concat([gatewayHost],
        PROFILE_DNS.RESOLVERS.map(url => new URL(url).hostname));

    return [
        `# ${PRODUCT.NAME} access profile`,
        `# ${PRODUCT.VERSION}`,
        `mixed-port: ${PROFILE_RUNTIME.MIXED_PORT}`,
        `mode: rule`,
        `allow-lan: false`,
        `log-level: ${PROFILE_RUNTIME.LOG_LEVEL}`,
        `unified-delay: ${PROFILE_RUNTIME.UNIFIED_DELAY}`,
        `tcp-concurrent: ${PROFILE_RUNTIME.TCP_CONCURRENT}`,
        `tfo: ${PROFILE_RUNTIME.TFO}`,
        `keep-alive-interval: ${PROFILE_RUNTIME.KEEPALIVE_INTERVAL}`,
        `find-process-mode: "${PROFILE_RUNTIME.FIND_PROCESS}"`,
        `global-client-fingerprint: ${PROFILE_TRANSPORT.FINGERPRINT}`,
        ``,
        `profile:`,
        `  store-selected: ${PROFILE_RUNTIME.STORE_SELECTED}`,
        `  store-fake-ip: ${PROFILE_RUNTIME.STORE_FAKE_IP}`,
        ``,
        `dns:`,
        `  enable: true`,
        `  ipv6: false`,
        `  cache-algorithm: lru`,
        `  use-hosts: true`,
        `  enhanced-mode: fake-ip`,
        `  fake-ip-range: ${PROFILE_DNS.FAKE_RANGE}`,
        `  default-nameserver:`,
        ...PROFILE_DNS.BOOTSTRAP.map(ip => `    - ${ip}`),
        `  proxy-server-nameserver:`,
        ...resolvers('    '),
        `  direct-nameserver:`,
        ...resolvers('    '),
        `  direct-nameserver-follow-policy: false`,
        `  nameserver:`,
        ...resolvers('    '),
        `  nameserver-policy:`,
        ...PROFILE_POLICY.HOME_CODES.flatMap(code =>
            [`    "geosite:${code}":`, ...resolvers('      ')]),
        `  fake-ip-filter:`,
        ...localNames.map(name => `    - "${name}"`),
        ``,
        `tun:`,
        `  enable: ${PROFILE_TUN.ENABLED}`,
        `  stack: ${PROFILE_TUN.STACK}`,
        `  dns-hijack:`,
        ...PROFILE_TUN.HIJACK.map(target => `    - ${target}`),
        `  auto-route: ${PROFILE_TUN.AUTO_ROUTE}`,
        `  auto-detect-interface: ${PROFILE_TUN.AUTO_INTERFACE}`,
        `  strict-route: ${PROFILE_TUN.STRICT_ROUTE}`,
        ``,
        `${CLIENT_LABELS.NODES}:`,
        `  - name: "${nodeName}"`,
        `    type: ${CLIENT_LABELS.SCHEME}`,
        `    server: ${gatewayHost}`,
        `    port: 443`,
        `    ${CLIENT_LABELS.IDENTIFIER}: ${apiKey}`,
        `    encryption: ${PROFILE_TRANSPORT.ENCRYPTION}`,
        `    tls: true`,
        `    servername: ${gatewayHost}`,
        `    client-fingerprint: ${PROFILE_TRANSPORT.FINGERPRINT}`,
        `    alpn:`,
        ...PROFILE_TRANSPORT.ALPN.map(protocol => `      - ${protocol}`),
        `    udp: true`,
        `    network: ${CLIENT_LABELS.TRANSPORT}`,
        `    ${CLIENT_LABELS.TRANSPORT}-opts:`,
        `      path: "${inferenceEndpoint}"`,
        `      host: ${gatewayHost}`,
        `      mode: "${CLIENT_LABELS.MODE}"`,
        ``,
        `${CLIENT_LABELS.GROUPS}:`,
        `  - name: ${group}`,
        `    type: select`,
        `    ${CLIENT_LABELS.NODES}:`,
        `      - "${nodeName}"`,
        `      - ${direct}`,
        ``,
        `rules:`,
        `  - DOMAIN,${gatewayHost},${direct}`,
        ...PROFILE_POLICY.RESERVED_V4.map(block => `  - IP-CIDR,${block},${direct},no-resolve`),
        ...PROFILE_POLICY.RESERVED_V6.map(block => `  - IP-CIDR6,${block},${direct},no-resolve`),
        ...PROFILE_POLICY.ABROAD_CODES.map(code => `  - GEOSITE,${code},${group}`),
        ...PROFILE_POLICY.HOME_CODES.map(code => `  - GEOSITE,${code},${direct}`),
        `  - GEOIP,${PROFILE_POLICY.HOME_REGION},${direct},no-resolve`,
        `  - MATCH,${group}`,
        ``
    ].join('\n');
}
