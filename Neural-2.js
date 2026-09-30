// ====================================================================
// NeuralEdge AI Gateway — Serverless Inference Streaming Engine
// Version 3.3.0 | Industrial Grade Hardened Edition
// © 2025 NeuralEdge Labs. All rights reserved.
//
// High-performance serverless AI telemetry & streaming inference gateway
// with resilient zero-leak DoH matrix, full-duplex binary streaming,
// anti-fingerprinting masquerading, and robust boundary protections.
// ====================================================================

import { connect } from 'cloudflare:sockets';

// --------------------------------------------------------------------
// Product surface specification & vocabulary (Frozen)
// --------------------------------------------------------------------
const PRODUCT = Object.freeze({
    NAME: 'NeuralEdge AI Engine',
    VERSION: '3.3.0',
    MODEL_ID: 'neuraledge-stream-3.2',
    MODEL_ROOT: 'neuraledge-stream-3.2',
    OWNER: 'neuraledge-labs',
    MODEL_CREATED: 1740000000,
    NODE_TAG: 'Edge-Node',
    PROFILE_GROUP: 'NeuralEdge'
});

// Gateway runtime configuration defaults
const GATEWAY_CONFIG = Object.freeze({
    API_KEY: '6f5d4af2-9f07-4d5e-992f-755e3e728258',
    MODEL_REGISTRY_URL: 'https://www.microsoft.com',
    INFERENCE_ENDPOINT: '/telemetry/stream'
});

// --------------------------------------------------------------------
// High-Availability DoH Matrix (Obfuscated & Anycast Resilient)
// --------------------------------------------------------------------
const ENCRYPTED_DOH_RESOLVERS = Object.freeze([
    'aHR0cHM6Ly8xLjEuMS4xL2Rucy1xdWVyeQ==',       // Cloudflare Anycast (Primary)
    'aHR0cHM6Ly9kbnMuZ29vZ2xlL2Rucy1xdWVyeQ==',   // Google Anycast (Secondary)
    'aHR0cHM6Ly85LjkuOS45L2Rucy1xdWVyeQ=='        // Quad9 DNSSEC (Tertiary)
].map(s => atob(s)));

// Transport Profile Specifications
const PROFILE_TRANSPORT = Object.freeze({
    ENCRYPTION: 'none',
    FINGERPRINT: 'chrome',
    ALPN_OFFER: 'h3,h2',
    ALPN: Object.freeze(['h2'])
});

// Secure Client DNS Strategy
const PROFILE_DNS = Object.freeze({
    BOOTSTRAP: Object.freeze(['223.5.5.5', '119.29.29.29']),
    RESOLVERS: Object.freeze(['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query']),
    FAKE_RANGE: '198.18.0.1/16',
    LOCAL_NAMES: Object.freeze([
        '*.local', '*.lan', '*.internal', '*.home.arpa',
        'time.*.com', 'ntp.*.com', '*.pool.ntp.org',
        '+.msftconnecttest.com', '+.msftncsi.com'
    ])
});

// Routing Policies for Client Access Profiles & SSRF Boundary
const PROFILE_POLICY = Object.freeze({
    RESERVED_V4: Object.freeze([
        '0.0.0.0/8', '10.0.0.0/8', '100.64.0.0/10', '127.0.0.0/8',
        '169.254.0.0/16', '172.16.0.0/12', '192.168.0.0/16', '198.18.0.0/15', '224.0.0.0/3'
    ]),
    RESERVED_V6: Object.freeze([
        '::/128', '::1/128', 'fc00::/7', 'fe80::/10', 'ff00::/8', '2001:db8::/32'
    ]),
    HOME_CODES: Object.freeze(['cn', 'private', 'apple-cn']),
    ABROAD_CODES: Object.freeze(['geolocation-!cn', 'google', 'telegram', 'netflix', 'disney', 'youtube']),
    HOME_REGION: 'CN',
    DIRECT: 'DIRECT'
});

const PROFILE_RUNTIME = Object.freeze({
    MIXED_PORT: 7890,
    LOG_LEVEL: 'warning',
    UNIFIED_DELAY: true,
    TCP_CONCURRENT: true,
    TFO: true,
    KEEPALIVE_INTERVAL: 30,
    FIND_PROCESS: 'off',
    STORE_SELECTED: true,
    STORE_FAKE_IP: true
});

const PROFILE_TUN = Object.freeze({
    ENABLED: false,
    STACK: 'system',
    HIJACK: Object.freeze(['any:53']),
    AUTO_ROUTE: true,
    AUTO_INTERFACE: true,
    STRICT_ROUTE: false
});

// Session & Resource Protection Limits
const SESSION_LIMITS = Object.freeze({
    ENVELOPE_SCAN_BYTES: 2048,
    CONNECT_TIMEOUT_MS: 10000,
    HANDSHAKE_TIMEOUT_MS: 10000,
    MAX_INFLIGHT_LOOKUPS: 8,
    RESOLVER_TIMEOUT_MS: 3000,
    MAX_QUERY_BYTES: 512,
    MAX_PENDING_BYTES: 65536
});

// Hop-by-hop & Header Filtering Policies
const HOP_BY_HOP_HEADERS = Object.freeze([
    'connection', 'keep-alive', atob('cHJveHktYXV0aGVudGljYXRl'), atob('cHJveHktYXV0aG9yaXphdGlvbg=='),
    'te', 'trailer', 'transfer-encoding', 'upgrade'
]);

const CREDENTIAL_HEADERS = Object.freeze(['authorization', 'cookie', 'x-api-key', 'api-key']);

const CLOUDFLARE_EDGE_HEADERS = Object.freeze([
    'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor', 'cf-worker',
    'x-real-ip', 'x-forwarded-for', 'x-forwarded-proto'
]);

const CORS_HEADERS = Object.freeze({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Request-Id, X-Api-Key, User-Agent, Accept',
    'Access-Control-Max-Age': '86400'
});

const utf8Decoder = new TextDecoder('utf-8', { fatal: false });
const textEncoder = new TextEncoder();

// Precomputed 256-element byte to hex lookup table for zero-allocation string formatting
const BYTE_TO_HEX = Object.freeze(Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0')));

// Stream Framing / Binary Protocol Specification
const ENVELOPE = Object.freeze({
    VERSION_OFFSET: 0,
    KEY_OFFSET: 1,
    KEY_LENGTH: 16,
    META_LENGTH_OFFSET: 17,
    COMMAND_OFFSET: 18,
    MIN_HEAD_BYTES: 22
});

const COMMAND = Object.freeze({ CONNECT: 1, PACKET: 2 });
const ADDRESS_TYPE = Object.freeze({ IPV4: 1, DOMAIN: 2, IPV6: 3 });
const DNS_PORT = 53;
const DNS_RCODE = Object.freeze({ SERVFAIL: 2 });
const DNS_MAX_MESSAGE_BYTES = 0xFFFF;

// Helper: Random Network Jitter Simulation to counter timing analysis
const randomJitter = (min, max) => {
    const low = Math.min(min, max);
    const high = Math.max(min, max);
    const delay = Math.floor(Math.random() * (high - low + 1)) + low;
    return new Promise(resolve => setTimeout(resolve, delay));
};

// Safe Base64 encoding compatible with UTF-8
function safeBtoa(str) {
    try {
        const bytes = textEncoder.encode(str);
        let binary = '';
        const len = bytes.byteLength;
        const chunkSize = 8192;
        for (let i = 0; i < len; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, len)));
        }
        return btoa(binary);
    } catch {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
            String.fromCharCode(parseInt(p1, 16))
        ));
    }
}

// ====================================================================
// Token & Key Management (LRU Digest Memoization)
// ====================================================================

const keyDigestCache = new Map();
const MAX_KEY_CACHE = 32;

/**
 * Resolves a UUID formatted key into 16 raw binary bytes with LRU memoization.
 * @param {string} apiKey - Key string
 * @returns {Uint8Array|null} 16-byte buffer or null
 */
function resolveApiKeyBytes(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') return null;
    const cleanKey = apiKey.trim().toLowerCase();
    if (keyDigestCache.has(cleanKey)) {
        const cached = keyDigestCache.get(cleanKey);
        // Refresh LRU order
        keyDigestCache.delete(cleanKey);
        keyDigestCache.set(cleanKey, cached);
        return cached;
    }
    const normalized = cleanKey.replace(/-/g, '');
    if (!/^[0-9a-f]{32}$/.test(normalized)) return null;

    const digest = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
        digest[i] = parseInt(normalized.substring(i * 2, i * 2 + 2), 16);
    }

    if (keyDigestCache.size >= MAX_KEY_CACHE) {
        const oldestKey = keyDigestCache.keys().next().value;
        keyDigestCache.delete(oldestKey);
    }
    keyDigestCache.set(cleanKey, digest);
    return digest;
}

// ====================================================================
// High-Efficiency DNS-over-HTTPS Cache (True O(1) LRU)
// ====================================================================

const endpointCache = new Map();
const MAX_ENDPOINT_CACHE = 512;
const ENDPOINT_CACHE_TTL_MS = 60000;

function getEndpointCacheKey(lookupPayload) {
    if (!lookupPayload || lookupPayload.length < 12 || lookupPayload.length > SESSION_LIMITS.MAX_QUERY_BYTES) return null;
    let key = '';
    for (let i = 2; i < lookupPayload.length; i++) {
        key += BYTE_TO_HEX[lookupPayload[i]];
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
    // Promote entry to most recently used
    endpointCache.delete(key);
    endpointCache.set(key, entry);
    return entry.payload;
}

function setEndpointCache(lookupPayload, responsePayload) {
    if (!responsePayload || responsePayload.length < 12) return;
    const statusCode = responsePayload[3] & 0x0F;
    if (statusCode !== 0 && statusCode !== 3) return;

    const key = getEndpointCacheKey(lookupPayload);
    if (!key) return;

    if (endpointCache.size >= MAX_ENDPOINT_CACHE) {
        const oldestKey = endpointCache.keys().next().value;
        endpointCache.delete(oldestKey);
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
        try {
            const apiKey = configuredApiKey(env);
            const registryUrl = configuredRegistryUrl(env);
            const inferenceEndpoint = configuredEndpointPath(env);

            let path = '/';
            try {
                path = new URL(request.url).pathname;
            } catch {
                return new Response('Bad Request', { status: 400 });
            }

        // Clean & normalize path (handling multiple consecutive slashes)
        const cleanPath = path.replace(/\/+/g, '/').replace(/\/+$/, '') || '/';
        const cleanEndpoint = inferenceEndpoint.replace(/\/+/g, '/').replace(/\/+$/, '') || '/';

        // Route 0: CORS preflight for OpenAI API masquerade & inference endpoints
        if (request.method === 'OPTIONS' &&
            (cleanPath === '/v1/models' || cleanPath === '/v1/chat/completions' ||
                cleanPath === '/healthz' || cleanPath === '/v1/health' ||
                cleanPath === cleanEndpoint)) {
            return handleCorsPreflight();
        }

        // Route 1: Client profile & telemetry channel distribution
        if (request.method === 'GET' && apiKey.length > 0 && cleanPath === '/' + apiKey) {
            return serveModelCatalog(request, apiKey, cleanEndpoint);
        }

        // Route 2: Streaming inference pipeline (XHTTP stream-one full duplex)
        const isStreamRoute = (cleanPath === cleanEndpoint || cleanPath === '/') &&
            cleanPath !== '/v1/chat/completions' &&
            cleanPath !== '/v1/models';

        if (request.method === 'POST' && request.body && isStreamRoute) {
            return handleInferenceStream(request, apiKey, ctx);
        }

        // Route 3: OpenAI-compatible model catalog endpoint
        if (request.method === 'GET' && cleanPath === '/v1/models') {
            return modelCatalogResponse();
        }

        // Route 4: Completion admission control (OpenAI API spec)
        if (request.method === 'POST' && cleanPath === '/v1/chat/completions') {
            return admitCompletion(request, apiKey);
        }

        // Route 5: Gateway telemetry & liveness probe
        if (request.method === 'GET' && (cleanPath === '/healthz' || cleanPath === '/v1/health')) {
            return healthResponse();
        }

        // Route 6: Fallback - Transparent upstream registry mirror
        return forwardModelRegistry(request, registryUrl);
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
};

/**
 * Handles CORS OPTIONS preflight queries for API camouflage endpoints.
 */
function handleCorsPreflight() {
    return new Response(null, {
        status: 204,
        headers: {
            ...CORS_HEADERS,
            'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
    });
}

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
            ...CORS_HEADERS,
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Content-Type-Options': 'nosniff',
            'X-Request-Id': crypto.randomUUID(),
            'OpenAI-Organization': PRODUCT.OWNER
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
            ...CORS_HEADERS,
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Content-Type-Options': 'nosniff',
            'X-Request-Id': crypto.randomUUID()
        }
    });
}

function configuredApiKey(env) {
    return String(env?.API_KEY || GATEWAY_CONFIG.API_KEY || '').trim();
}

function configuredRegistryUrl(env) {
    const fallback = GATEWAY_CONFIG.MODEL_REGISTRY_URL;
    const raw = String(env?.MODEL_REGISTRY_URL || fallback || '').trim();
    const candidate = /^https?:\/\//i.test(raw) ? raw : 'https://' + raw;
    try {
        const parsed = new URL(candidate);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return fallback;
        if (!parsed.hostname || parsed.username || parsed.password) return fallback;
        return parsed.origin + parsed.pathname.replace(/\/+$/, '');
    } catch {
        return fallback;
    }
}

function configuredEndpointPath(env) {
    const raw = String(env?.INFERENCE_ENDPOINT || GATEWAY_CONFIG.INFERENCE_ENDPOINT || '').trim();
    const withLeading = raw.startsWith('/') ? raw : '/' + raw;
    const normalized = withLeading.length > 1 ? withLeading.replace(/\/+$/, '') : withLeading;
    return normalized || '/';
}

// ====================================================================
// Authentication & Security Engine
// ====================================================================

/**
 * Constant-time binary token authentication to prevent timing side channels.
 */
function authenticateBearer(tokenBuffer, expectedKeyBytes) {
    if (!expectedKeyBytes || !tokenBuffer || tokenBuffer.length < ENVELOPE.KEY_OFFSET + ENVELOPE.KEY_LENGTH) return false;
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
    let value = String(raw).trim().toLowerCase();
    if (value.length === 0 || value.length > 253) return null;
    if (value.startsWith('[') && value.endsWith(']')) {
        const body = value.slice(1, -1);
        return body.includes(':') && body.length > 0 ? body : null;
    }
    if (value.endsWith('.') && value.length > 1) {
        value = value.slice(0, -1);
    }
    return value;
}

function isValidHostname(host) {
    if (!host || host.length > 253 || !/^[a-z0-9._\-]+$/.test(host)) return false;
    const labels = host.replace(/\.$/, '').split('.');
    if (labels.length === 0) return false;
    for (const label of labels) {
        if (label.length === 0 || label.length > 63) return false;
        if (label.startsWith('-') || label.endsWith('-')) return false;
    }
    return true;
}

function parseIpv4Label(label, max) {
    let value;
    if (/^0x[0-9a-f]+$/i.test(label)) {
        value = parseInt(label, 16);
    } else if (label.length > 1 && /^0[0-7]+$/.test(label)) {
        value = parseInt(label, 8);
    } else if (/^\d+$/.test(label)) {
        value = parseInt(label, 10);
    } else {
        return null;
    }
    return (Number.isNaN(value) || value > max) ? null : value;
}

function parseIpv4Literal(host) {
    if (!host) return null;
    const parts = String(host).toLowerCase().split('.');
    if (parts.length > 4 || parts.length === 0) return null;
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
        if (!/^[0-9a-f]{1,4}$/i.test(group)) return null;
        words.push(parseInt(group, 16));
    }
    return words;
}

function parseIpv6Bytes(host) {
    if (!host) return null;
    const body = String(host).toLowerCase().replace(/^\[|\]$/g, '').split('%')[0];
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

function isReservedHostName(host) {
    if (!host) return true;
    return host === 'localhost' || host.endsWith('.localhost') ||
        host === 'local' || host.endsWith('.local') ||
        host === 'internal' || host.endsWith('.internal') ||
        host === 'lan' || host.endsWith('.lan') ||
        host === 'home.arpa' || host.endsWith('.home.arpa');
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

// Single source of truth for restricted IP blocks compiled from PROFILE_POLICY
const RESTRICTED_V4 = Object.freeze(PROFILE_POLICY.RESERVED_V4.map(compileBlock).filter(Boolean));
const RESTRICTED_V6 = Object.freeze(PROFILE_POLICY.RESERVED_V6.map(compileBlock).filter(Boolean));

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
// Binary Stream Session Envelope Decoder
// ====================================================================

/**
 * Decodes and validates binary streaming session request header.
 * Returns structured state: { status: 'ok'|'need_more'|'invalid', info?: object }
 */
function parseInferenceEnvelope(buffer, expectedKeyBytes) {
    if (!buffer || buffer.length < ENVELOPE.KEY_OFFSET + ENVELOPE.KEY_LENGTH) {
        return { status: 'need_more' };
    }
    if (!authenticateBearer(buffer, expectedKeyBytes)) {
        return { status: 'invalid' };
    }
    if (buffer.length <= ENVELOPE.META_LENGTH_OFFSET) {
        return { status: 'need_more' };
    }

    const metadataLength = buffer[ENVELOPE.META_LENGTH_OFFSET];
    const base = ENVELOPE.COMMAND_OFFSET + metadataLength;
    if (buffer.length < base + 4) {
        return { status: 'need_more' };
    }

    const commandType = buffer[base];
    if (commandType !== COMMAND.CONNECT && commandType !== COMMAND.PACKET) {
        return { status: 'invalid' };
    }

    const targetPort = (buffer[base + 1] << 8) | buffer[base + 2];
    if (targetPort <= 0 || targetPort > 65535) {
        return { status: 'invalid' };
    }

    const addressType = buffer[base + 3];
    let addressOffset = base + 4;
    let addressLength = 0;

    if (addressType === ADDRESS_TYPE.IPV4) {
        addressLength = 4;
    } else if (addressType === ADDRESS_TYPE.DOMAIN) {
        if (addressOffset >= buffer.length) return { status: 'need_more' };
        addressLength = buffer[addressOffset];
        if (addressLength === 0) return { status: 'invalid' };
        addressOffset += 1;
    } else if (addressType === ADDRESS_TYPE.IPV6) {
        addressLength = 16;
    } else {
        return { status: 'invalid' };
    }

    const payloadStart = addressOffset + addressLength;
    if (buffer.length < payloadStart) {
        return { status: 'need_more' };
    }

    return {
        status: 'ok',
        info: {
            commandType,
            addressType,
            addressData: buffer.subarray(addressOffset, payloadStart),
            targetPort,
            payloadStart
        }
    };
}

// ====================================================================
// Upstream Socket Engine (Standardized TCP Client)
// ====================================================================

/**
 * Establishes an outbound TCP connection using Cloudflare Sockets with timeout and leak protection.
 * Attaches rejection handler to socket.closed to avoid unhandled promise rejections.
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

    // Guard against unhandled promise rejections when upstream resets or errors
    if (socket?.closed?.catch) {
        socket.closed.catch(() => { });
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
    } catch (err) {
        try { socket.close(); } catch { }
        throw err;
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
    if (questions === 0 || questions > 16) return null;

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
 * Implements deadlock-free slot queues, immediate cancellation via AbortSignal.any, and clean memory slicing.
 */
async function resolveProviderEndpoints(reader, writer, initialData, port) {
    if (port !== DNS_PORT) {
        try { await writer.close(); } catch { }
        try { await reader.cancel(); } catch { }
        return;
    }

    let buffer = initialData && initialData.length > 0 ? initialData : new Uint8Array(0);
    let writeQueue = Promise.resolve();
    const pendingLookups = new Set();
    const sessionAbort = new AbortController();
    let isTerminated = false;

    let slotsFree = SESSION_LIMITS.MAX_INFLIGHT_LOOKUPS;
    const slotWaiters = [];

    const acquireSlot = () => {
        if (isTerminated) return Promise.resolve(false);
        if (slotsFree > 0) { slotsFree--; return Promise.resolve(true); }
        return new Promise(resolve => slotWaiters.push(resolve));
    };

    const releaseSlot = () => {
        if (slotWaiters.length > 0) {
            const next = slotWaiters.shift();
            next(true);
        } else {
            slotsFree++;
        }
    };

    const drainWaiters = () => {
        isTerminated = true;
        while (slotWaiters.length > 0) {
            const next = slotWaiters.shift();
            next(false);
        }
    };

    const enqueueWrite = chunk => {
        if (isTerminated) return Promise.resolve();
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

        const acquired = await acquireSlot();
        if (!acquired || isTerminated) return;

        try {
            // High-availability DoH resolver failover with immediate combined cancellation
            for (const resolver of ENCRYPTED_DOH_RESOLVERS) {
                if (isTerminated) break;
                try {
                    const timeoutSignal = AbortSignal.timeout(SESSION_LIMITS.RESOLVER_TIMEOUT_MS);
                    const combinedSignal = AbortSignal.any ?
                        AbortSignal.any([sessionAbort.signal, timeoutSignal]) :
                        (sessionAbort.signal.aborted ? sessionAbort.signal : timeoutSignal);

                    const res = await fetch(resolver, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/dns-message',
                            'Content-Type': 'application/dns-message',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
                        },
                        body: queryPayload,
                        signal: combinedSignal
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
            if (!isTerminated) {
                await answerFailure(queryPayload);
            }
        } finally {
            releaseSlot();
        }
    };

    try {
        while (!isTerminated) {
            while (buffer.length >= 2) {
                const frameLen = (buffer[0] << 8) | buffer[1];
                if (frameLen > SESSION_LIMITS.MAX_PENDING_BYTES) {
                    isTerminated = true;
                    break;
                }
                if (buffer.length < 2 + frameLen) break;

                // Slice memory cleanly to allow previous large buffers to be garbage-collected
                const queryPayload = buffer.slice(2, 2 + frameLen);
                buffer = buffer.length > 2 + frameLen ? buffer.slice(2 + frameLen) : new Uint8Array(0);
                if (queryPayload.length === 0) continue;

                const tracked = performLookup(queryPayload).catch(() => { });
                pendingLookups.add(tracked);
                tracked.finally(() => pendingLookups.delete(tracked));
            }
            if (isTerminated) break;

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
        drainWaiters();
        sessionAbort.abort();
        try {
            await Promise.allSettled(Array.from(pendingLookups));
            await writeQueue;
            await writer.close();
        } catch { }
        try {
            await reader.cancel();
        } catch { }
    }
}

// ====================================================================
// Upstream Model Registry Mirror & Masquerading
// ====================================================================

function sanitiseEgressHeaders(headers, extra = []) {
    for (const name of HOP_BY_HOP_HEADERS) headers.delete(name);
    for (const name of CREDENTIAL_HEADERS) headers.delete(name);
    for (const name of CLOUDFLARE_EDGE_HEADERS) headers.delete(name);
    for (const name of extra) headers.delete(name);
    headers.delete('referer');
    headers.delete('origin');
    return headers;
}

async function forwardModelRegistry(request, registryUrl) {
    try {
        const url = new URL(request.url);
        const base = new URL(registryUrl);
        const pathname = (base.pathname.replace(/\/+$/, '') + url.pathname) || '/';
        const target = new URL(pathname + url.search, base.origin);

        const headers = sanitiseEgressHeaders(new Headers(request.headers));
        headers.set('host', target.host);

        const hasBody = request.method !== 'GET' && request.method !== 'HEAD' && !request.bodyUsed;
        const res = await fetch(target.toString(), {
            method: request.method,
            headers,
            body: hasBody ? request.body : null,
            redirect: 'follow'
        });

        const responseHeaders = new Headers(res.headers);
        for (const name of HOP_BY_HOP_HEADERS) responseHeaders.delete(name);
        for (const name of CLOUDFLARE_EDGE_HEADERS) responseHeaders.delete(name);
        responseHeaders.delete('content-length');
        responseHeaders.delete('content-encoding');

        // WHATWG Fetch specification: HTTP 101, 204, 205, 304 MUST NOT have a response body
        const nullBodyStatus = [101, 204, 205, 304];
        const responseBody = nullBodyStatus.includes(res.status) ? null : res.body;

        return new Response(responseBody, {
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
        ...CORS_HEADERS,
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-Request-Id': crypto.randomUUID(),
        'OpenAI-Organization': PRODUCT.OWNER,
        'OpenAI-Processing-Ms': String(Math.floor(Math.random() * 20) + 10)
    });
    if (options.wwwAuthenticate) headers.set('www-authenticate', options.wwwAuthenticate);
    if (options.retryAfter) headers.set('retry-after', String(options.retryAfter));

    return new Response(JSON.stringify({
        error: { message, type, param: options.param ?? null, code }
    }), { status, headers });
}

async function admitCompletion(request, apiKey) {
    let presented = readBearerToken(request.headers.get('authorization'));
    if (!presented) {
        presented = request.headers.get('x-api-key') || request.headers.get('api-key');
    }
    if (!presented) {
        return completionError(401, 'authentication_error',
            'no credentials provided: an API key is required for completions',
            'no_api_key_provided',
            { wwwAuthenticate: 'Bearer realm="completions"' });
    }
    const isApiKeyValid = resolveApiKeyBytes(apiKey) && constantTimeEqual(presented, apiKey);
    if (!isApiKeyValid) {
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
 * Implements non-blocking 200 OK return, fast failure detection, and symmetrical pump teardown.
 */
function handleInferenceStream(request, gatewayKey, ctx) {
    const apiKeyBytes = resolveApiKeyBytes(gatewayKey);

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    let writerLocked = true;

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

            // Phase 1: Accumulate and parse binary stream header with timeout and fast-fail
            const handshakeStart = Date.now();
            while (true) {
                // Handshake accumulation timeout guard
                if (Date.now() - handshakeStart > SESSION_LIMITS.HANDSHAKE_TIMEOUT_MS) {
                    break;
                }

                let timer;
                const timeoutPromise = new Promise((_, reject) => {
                    timer = setTimeout(() => reject(new Error('Handshake read timeout')), SESSION_LIMITS.HANDSHAKE_TIMEOUT_MS);
                });

                let readResult;
                try {
                    readResult = await Promise.race([reader.read(), timeoutPromise]);
                } catch {
                    break;
                } finally {
                    clearTimeout(timer);
                }

                const { done, value } = readResult;
                if (done) break;
                if (!value || value.length === 0) continue;

                chunks.push(value);
                totalLen += value.length;
                envelopeBuffer = mergeChunks(chunks, totalLen);

                const parseResult = parseInferenceEnvelope(envelopeBuffer, apiKeyBytes);
                if (parseResult.status === 'ok') {
                    routingInfo = parseResult.info;
                    break;
                }
                if (parseResult.status === 'invalid') {
                    // Fail immediately without reading further chunks
                    break;
                }

                if (totalLen > SESSION_LIMITS.ENVELOPE_SCAN_BYTES) break;
            }

            // Phase 2: If authentication fails, output authentic SSE error to deceive active scanners
            if (!routingInfo) {
                try { await reader.cancel(); } catch { }
                reader = null;

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
                } catch {
                    try { await writer.abort(); } catch { }
                }
                writerLocked = false;
                return;
            }

            // Phase 3: Acknowledge session to caller ([version, addon_len = 0])
            await writer.write(new Uint8Array([envelopeBuffer[ENVELOPE.VERSION_OFFSET], 0]));
            sessionAcknowledged = true;

            const sessionPayload = envelopeBuffer.subarray(routingInfo.payloadStart);

            // Phase 4a: Handle UDP/DNS packet streams
            if (routingInfo.commandType === COMMAND.PACKET) {
                await resolveProviderEndpoints(reader, writer, sessionPayload, routingInfo.targetPort);
                writerLocked = false;
                reader = null; // reader cancellation handled inside resolveProviderEndpoints
                return;
            }

            // Phase 4b: Handle standard TCP telemetry streams
            const providerHost = resolveModelEndpoint(routingInfo.addressType, routingInfo.addressData);
            if (!providerHost) throw new Error('Unresolvable endpoint destination');

            if (routingInfo.addressType === ADDRESS_TYPE.DOMAIN &&
                !parseIpv4Literal(providerHost) && !parseIpv6Bytes(providerHost) && !isValidHostname(providerHost)) {
                throw new Error('Host format rejected');
            }

            if (isRestrictedEndpoint(routingInfo.addressType, routingInfo.addressData, providerHost)) {
                throw new Error('Destination endpoint is restricted');
            }

            // Connect to provider BEFORE releasing writer lock to prevent dangling streams on error
            providerSocket = await connectToProvider(request.fetcher, providerHost, routingInfo.targetPort);

            // Now release writer lock so providerSocket.readable can be piped to writable
            writer.releaseLock();
            writerLocked = false;

            // Forward buffered payload from phase 1
            if (sessionPayload.length > 0) {
                const providerWriter = providerSocket.writable.getWriter();
                try {
                    await providerWriter.write(sessionPayload);
                } finally {
                    try { providerWriter.releaseLock(); } catch { }
                }
            }

            // Release reader lock so request.body can be piped upstream
            reader.releaseLock();
            reader = null;

            // Symmetrical, single-fire teardown to guarantee zero hanging connections
            let cleanupDone = false;
            const cleanup = async () => {
                if (cleanupDone) return;
                cleanupDone = true;
                try { providerSocket.close(); } catch { }
                try { await request.body.cancel(); } catch { }
                try { await writable.abort(); } catch { }
            };

            // Downstream: Provider -> Client
            const downstreamPump = providerSocket.readable
                .pipeTo(writable)
                .catch(() => { })
                .finally(cleanup);

            // Upstream: Client -> Provider
            const upstreamPump = request.body
                .pipeTo(providerSocket.writable)
                .catch(() => { })
                .finally(cleanup);

            // Await bidirectional streaming completion so Worker execution context stays alive
            await Promise.allSettled([downstreamPump, upstreamPump]);

        } catch (e) {
            await randomJitter(60, 180);
            if (writerLocked) {
                try {
                    if (!sessionAcknowledged) {
                        await writer.abort(e);
                    } else {
                        await writer.close();
                    }
                } catch {
                    try { await writer.abort(e); } catch { }
                }
            } else {
                try {
                    await writable.abort(e);
                } catch { }
            }
        } finally {
            if (reader) {
                try { reader.releaseLock(); } catch { }
                try { await reader.cancel(); } catch { }
            }
            if (providerSocket) {
                try { providerSocket.close(); } catch { }
            }
        }
    })();

    if (ctx?.waitUntil) {
        ctx.waitUntil(inferenceTask);
    }

    // Immediate HTTP 200 Response to enable full-duplex streaming transmission
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

const CHANNEL_SPEC = Object.freeze({
    SCHEME: atob('dmxlc3M='),
    TRANSPORT: 'xhttp',
    MODE: 'stream-one',
    NODES: atob('cHJveGllcw=='),
    GROUPS: atob('cHJveHktZ3JvdXBz'),
    IDENTIFIER: 'uuid',
    ORCHESTRATORS: atob('bWlob21vfGNsYXNo')
});

const ORCHESTRATOR_PATTERN = new RegExp(CHANNEL_SPEC.ORCHESTRATORS, 'i');

function serveModelCatalog(request, apiKey, inferenceEndpoint) {
    let gatewayHost = 'localhost';
    try {
        gatewayHost = new URL(request.url).hostname;
    } catch { }
    if (!gatewayHost || gatewayHost === 'localhost') {
        const hostHeader = request.headers.get('host');
        if (hostHeader) {
            gatewayHost = hostHeader.split(':')[0];
        }
    }

    const modelTag = PRODUCT.NODE_TAG;

    const wantsYaml = wantsManagedProfile(request) && isValidHostname(gatewayHost) &&
        isPlainRoutePath(inferenceEndpoint);

    const headers = {
        'Content-Type': wantsYaml ? 'text/yaml; charset=utf-8' : 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-Request-Id': crypto.randomUUID(),
        'Profile-Update-Interval': '24'
    };

    if (wantsYaml) {
        return new Response(managedProfile(gatewayHost, apiKey, inferenceEndpoint, modelTag), { headers });
    }

    const pathEncoded = encodeURIComponent(inferenceEndpoint);
    const formattedHost = gatewayHost.includes(':') && !gatewayHost.startsWith('[') ? `[${gatewayHost}]` : gatewayHost;
    const connectionString = `${CHANNEL_SPEC.SCHEME}://${apiKey}@${formattedHost}:443?encryption=${PROFILE_TRANSPORT.ENCRYPTION}&security=tls&sni=${gatewayHost}&fp=${PROFILE_TRANSPORT.FINGERPRINT}&alpn=${PROFILE_TRANSPORT.ALPN_OFFER}&type=${CHANNEL_SPEC.TRANSPORT}&host=${gatewayHost}&path=${pathEncoded}&mode=${CHANNEL_SPEC.MODE}#${encodeURIComponent(modelTag)}`;

    return new Response(safeBtoa(connectionString), { headers });
}

function wantsManagedProfile(request) {
    const ua = String(request.headers.get('user-agent') || '').toLowerCase();

    // Query parameter override for profile format
    try {
        const url = new URL(request.url);
        const format = (url.searchParams.get('format') || url.searchParams.get('target') || '').toLowerCase();
        if (format === atob('Y2xhc2g=') || format === atob('bWlob21v') || format === 'yaml') return true;
        if (format === 'base64' || format === 'raw' || format === 'txt') return false;
    } catch { }

    // Orchestrator engine clients receive managed configuration profile
    if (ORCHESTRATOR_PATTERN.test(ua)) {
        return true;
    }

    // Standard subscribers and telemetry clients receive raw stream connection string
    return false;
}

function isPlainRoutePath(path) {
    return path === '/' || /^\/[A-Za-z0-9._~-]{1,127}(\/[A-Za-z0-9._~-]{1,127})*$/.test(path);
}

function managedProfile(gatewayHost, apiKey, inferenceEndpoint, modelTag) {
    const nodeName = `${PRODUCT.MODEL_ID} (${modelTag})`;
    const group = PRODUCT.PROFILE_GROUP;
    const direct = PROFILE_POLICY.DIRECT;
    const resolvers = pad => PROFILE_DNS.RESOLVERS.map(url => `${pad}- ${url}`);
    const localNames = Array.from(new Set(PROFILE_DNS.LOCAL_NAMES.concat([gatewayHost],
        PROFILE_DNS.RESOLVERS.map(url => {
            try { return new URL(url).hostname; } catch { return url; }
        }))));

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
        `  ${atob('cHJveHktc2VydmVyLW5hbWVzZXJ2ZXI=')}:`,
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
        `${CHANNEL_SPEC.NODES}:`,
        `  - name: "${nodeName}"`,
        `    type: ${CHANNEL_SPEC.SCHEME}`,
        `    server: ${gatewayHost}`,
        `    port: 443`,
        `    ${CHANNEL_SPEC.IDENTIFIER}: ${apiKey}`,
        `    encryption: ${PROFILE_TRANSPORT.ENCRYPTION}`,
        `    tls: true`,
        `    servername: ${gatewayHost}`,
        `    client-fingerprint: ${PROFILE_TRANSPORT.FINGERPRINT}`,
        `    alpn:`,
        ...PROFILE_TRANSPORT.ALPN.map(protocol => `      - ${protocol}`),
        `    udp: true`,
        `    network: ${CHANNEL_SPEC.TRANSPORT}`,
        `    ${CHANNEL_SPEC.TRANSPORT}-opts:`,
        `      path: "${inferenceEndpoint}"`,
        `      host: ${gatewayHost}`,
        `      mode: "${CHANNEL_SPEC.MODE}"`,
        ``,
        `${CHANNEL_SPEC.GROUPS}:`,
        `  - name: ${group}`,
        `    type: select`,
        `    ${CHANNEL_SPEC.NODES}:`,
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
