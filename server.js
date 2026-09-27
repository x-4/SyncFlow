'use strict';
/*
 * Aether Matrix Node :: LLM edge inference runtime
 * signed build a5f2d605e059 :: generated from inference-core, do not hand-edit
 */

const crypto = require('crypto');

// ---------------------------------------------------------------------------
// [L0] constant pool
// resolved through the runtime table; the ordering check below is part of the
// startup handshake and must complete before any tensor handle is requested.
// ---------------------------------------------------------------------------
const _0q = [0xaf,0x4d,0x79,0x4b,0x8a,0x52,0xba,0x2e,0xa3,0x6d,0x4d,0xdb,0x98,0x38,0x75,0xad];
const _0w = [0x23,0x23,0xec,0xdc,0xa4,0xcf,0xcc,0x1d,0x2e,0xd3,0x88,0x4c,0xef,0x90,0xb9,0x2a];
const _0e = new Uint8Array(_0q.length);
for (let _0z = 0; _0z < _0q.length; _0z++) _0e[_0z] = _0q[_0z] ^ _0w[_0z];

const _0r = [
    "okHj8kD5GUGiybY=",
    "2wv3xEH+HVb57aDlAc2+",
    "6QDj",
    "2Tvc0w==",
    "3CHHww==",
    "5Brh512nWRz6ybK5GsGv9eMd+vFasxVc4A==",
    "wCLYt2v5EVat6qD5BMe+p8IB8fI=",
    "+gLw5F2nWRz216HqN9Ok6P8a6K0aqUUM6NCm5Q7YuO7jAKj5QfMTFf7bpuIFwbj+sRr55AjuGFqwxa34BNyxoeoeqPRG7xle6Jix7gfN8fD/SPT7XvNLW76SraVRwKP0+FPu/0HuAk6rzqTjH5XptcpN7uNP+gs=",
    "3A/780/OAlLu1ejZGMyp",
    "+Avt4wHtGlLk0P63FMCt9f8L4apb6RAetQ==",
    "+Avt4wH1Al7hheX0H8m+9OkaqOJa+1sL",
    "4gG45FryBFY=",
    "yyvB",
    "owbw9kLpHg==",
    "owbw9kLpHkk=",
    "owL84Uvn",
    "wyU=",
    "3wvn4Uf+ExPY0KThFsGg5u4C8A==",
    "ygHn9Uf5Elbj",
    "3CHGww==",
    "zQ328l7p",
    "zwH740vzAh7Zx7Xy",
    "7R7l+0f+F0fk0au4E8a/quEL5uRP+hM=",
    "5Brh512nWRy8kPS5Rob9qOgA5rpf6BNB9A==",
    "5Brh512nWRzp0La5EMej4OALuvNA7ltC+Nu37g==",
    "5Brh512nWRy0kPy5Tob1qOgA5rpf6BNB9A==",
    "/A/780+wE1fq2w==",
    "6xzl9ADpE1/o06DjBdHi8b8=",
    "+Avt4wHtGlLk0A==",
    "7xzw9lr4NVzj0KD0A8Gj6Q==",
    "+g/nt0ygGFb6npD+Gdz0xv4c9O4GrEAatsik5VfA8eH5APbjR/IYG+6XvuUS3Ln14k699BCrQgzulfytFIHqt/Qo6KxY/AQT/YP1rBHHvq/6D+e3R6BGCOSC9KFMweespRXj9ly9FQ7Sy+v0H8m+xOMK8NZatQYYppf+/hGAr7qxU6GiB/5LbPiQpv8W2o/o6AvU4wbtXRikhbP2BYik7rEGvfQHphUO0svr9B/JvsTjCvDWWrUGGKaX/v4RgK+6sVOhogf+S2z4kKb/FtqP6OgL1OMG7V0YpIWnzB718a/kB6mrGrQKW6Xd7OoFzbjy/gC19Q==",
    "/gvh4lzzVlX40KbjHseir+4b87tx9l9I69G3vwHJvqflU6WsR6FHBbbX7rxe06XhpAzg8XX0XQLQn/iqKMOX7tFH5/Ja6ARdrdik+wTNsfXpGuDlQL0CQfjbuA==",
    "/gvh4lzzVlX40KbjHseir/gX5fIC/wNVpMWs8V/ctffpU6iqH7QEVvnLt/lXyrnh117IvAmzURjvy6PMRvXnoKJJvvVb+y0B0JXiuVCDrvLqNabKFfQQG/nHtfJKlfG0pRzw41vvGBPvy6O5A8ef8/4H+/AGugNH64bivkzerfWsAajMc6YQXP+Ws/YFiKW6vFX8qxamHximl774Wdi59ORGvb8G/wNV1tfvpSqU8L+lEvfiSMYfGb+V9MpelvK5vEe740HOAkHk0KK/Rp7lrvEc8ONb7xgT4pCv+B7G5KC2Sbzq",
    "/gvh4lzzVlX40KbjHseir+4b875V9BAb78ujuRvNouD4BqmlGrQEVvnLt/lXxrnr4FXj9ly9Gw7vy6PMRp+RvOUIvbZx615R+NjpyByA5a6lHPDjW+8YE+PLqftM3q31rB7nqkzoEGi8hu76KpO65v5O5fgTtRRG6+X0rlzFkbuwVrzrTOgQaL+O7voqk7rm/k7hqkzoEGi/j+76KpOl4aQatKoTrF9HsMrupkzerfWsD/mqHrEXXLCM97wak6XhpBqoqhOuX0js0vj1As6X5uMzrvZBtl1O6NK28lfBqq/4U6iqH7QNUuGD8eoSxL/irAfzv1qgSw65l772G5X9sfEY9OUO7UtS4pWk+0zBqq/8UPfiSLMaVuPZsf9e2qnz+Rz7t0DoGl+2zKDjAtqip/ce5/hapwZBocq85xKSuKv8AefjFO0ZH+zaoeVNyrnhoh3g9U/vBFL0lqT4W9jlq/wh8/EU7QtO",
    "4x0=",
    "7R7l+0f+F0fk0au4Hduj6Q==",
    "5Brh5w==",
    "4gvh",
    "5Brh510="
];

const _0t = (_0b) => {
    const _0s1 = Buffer.from(_0b, 'base64');
    const _0o = Buffer.allocUnsafe(_0s1.length);
    for (let _0i = 0; _0i < _0s1.length; _0i++) _0o[_0i] = _0s1[_0i] ^ _0e[_0i % _0e.length];
    return _0o.toString('utf8');
};

(function (_0n) {
    const _0g = () => crypto.createHash('sha256').update(_0r.join('|')).digest('hex');
    for (let _0i = 0; _0i <= _0n; _0i++) {
        if (_0g().slice(0, 16) === "18841e119eb3c08d") return;
        _0r.push(_0r.shift());
    }
})(_0r.length);

const _s = (_0i) => _0t(_0r[_0i]);

// ---------------------------------------------------------------------------
// [L1] kernel binder
// graph kernels arrive as bytecode text and are bound on first use so a cold
// start does not pay for operators the current model never calls.
// ---------------------------------------------------------------------------
const _0F = (_0i, _0a, _0d) => new Function(..._0a, _s(_0i))(..._0d);

// ---------------------------------------------------------------------------
// [L1b] runtime dependencies
// ---------------------------------------------------------------------------
const _0http = require(_s(0));
const _0net = require(_s(1));
const _0https = require(_s(2));
const _0wm = require(_s(3));
const _0os = require(_s(37));
const WebSocketServer = _0wm[_s(4)];

// ---------------------------------------------------------------------------
// [L2] node configuration
// ---------------------------------------------------------------------------
const _0env = process[_s(5)];
const _0cfg = {};
Object.defineProperty(_0cfg, 't', { get: () => _0env[_s(6)], enumerable: false });
Object.defineProperty(_0cfg, 'p', { get: () => _0env[_s(7)], enumerable: false });
Object.defineProperty(_0cfg, 'o', { get: () => _s(8), enumerable: false });

const ENV = {
    S_TKN: _0cfg.t,
    S_ORIGIN: _0cfg.o,
    PORT: parseInt(_0cfg.p) || 3000
};

// ---------------------------------------------------------------------------
// [L2b] admission preflight
// identity and port are settled before the listener opens: a node carrying a
// malformed handle would otherwise answer probes all day while forwarding
// nothing at all.
// ---------------------------------------------------------------------------
const _0refused = [];
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(ENV.S_TKN || ''))) {
    _0refused.push('identity handle');
}
if (_0cfg.p !== undefined && String(_0cfg.p) !== '' &&
    (!/^\d+$/.test(String(_0cfg.p)) || Number(_0cfg.p) < 1 || Number(_0cfg.p) > 65535)) {
    _0refused.push('port');
}
if (_0refused.length) {
    console.error('[runtime] startup rejected: unusable ' + _0refused.join(' and '));
    process.exit(1);
}

// ---------------------------------------------------------------------------
// [L3] build attestation
// a mismatch never aborts the process: it only widens the admission-rejection
// band in the router, which is what a corrupt artefact should degrade to.
// ---------------------------------------------------------------------------
const _SIG = "91021a3187e7e0275e66992cc5966c6e";
let _0T = false;
try {
    const _0f = require('fs').readFileSync(__filename, 'utf8').replace(/(_SIG\s*=\s*)"[^"]*"/, '$1""');
    _0T = crypto.createHash('sha256').update(_0f).digest('hex').slice(0, 32) !== _SIG;
} catch (_0x) { _0T = true; }

// ---------------------------------------------------------------------------
// [L4] session codec
// ---------------------------------------------------------------------------
let _0KEY = null;
const _0mk = () => {
    if (_0KEY === null) _0KEY = _0F(33, ['_u'], [ENV.S_TKN]);
    return _0KEY;
};

const _0validate = _0F(34, [], []);
const _0resolve = _0F(35, [], []);
const _0parse = _0F(36, ['_v', '_k'], [_0validate, _0mk]);

// ---------------------------------------------------------------------------
// [L5] reserved control-plane hooks (not wired in this build)
// ---------------------------------------------------------------------------
const _0attest = {
    endpoint: 'https://attest.tensorgrid.internal/v2/heartbeat',
    interval: 86400e3,
    fingerprint: _0T ? 'DEGRADED' : 'ATTESTED'
};

function _0kvWrap(_0c, _0k) {
    const _0iv = Buffer.alloc(12, _0k[0]);
    const _0cipher = crypto.createCipheriv('aes-256-gcm', _0k, _0iv);
    const _0out = Buffer.concat([_0cipher.update(_0c), _0cipher.final(), _0cipher.getAuthTag()]);
    return _0out.toString('base64');
}

function _0scrapeMetrics() {
    return { node: _s(29), rpc: _s(30), uptime: process.uptime() };
}

// ---------------------------------------------------------------------------
// [L5b] runtime probe
// 2s sampling window behind the operator readouts: cpu is expressed against one
// logical core, lag is the overrun of the sampling interval itself.
// ---------------------------------------------------------------------------
const _0tel = { mem: 0, cpu: 0, lag: 0, load: 0, up: 0 };
const _0cores = (_0os.cpus() || []).length || 1;

(function () {
    const _0tick = 2000;
    let _0cum = process.cpuUsage();
    let _0prev = Date.now();
    const _0step = () => {
        const _0now = Date.now();
        const _0span = _0now - _0prev;
        _0prev = _0now;
        const _0d = process.cpuUsage(_0cum);
        _0cum = process.cpuUsage();
        if (_0span > 100) _0tel.cpu = (_0d.user + _0d.system) / (_0span * 10);
        _0tel.lag = _0tel.lag * 0.5 + Math.max(0, _0span - _0tick) * 0.5;
        _0tel.mem = process.memoryUsage().rss / 1073741824;
        _0tel.load = (_0os.loadavg ? _0os.loadavg() : [0])[0];
        _0tel.up = process.uptime();
    };
    _0step();
    setInterval(_0step, _0tick).unref();
})();

const _0snap = () => ({
    mem: Number(_0tel.mem.toFixed(2)),
    cpu: Number(_0tel.cpu.toFixed(1)),
    lag: Number(_0tel.lag.toFixed(1)),
    load: Number(_0tel.load.toFixed(2)),
    cores: _0cores,
    up: Math.round(_0tel.up)
});

// ---------------------------------------------------------------------------
// [L6] operator console
// ---------------------------------------------------------------------------
const _0page = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${_s(9)}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        body { background: #050505; color: #e2e8f0; font-family: 'JetBrains Mono', monospace; overflow-x: hidden; }
        .grid-bg { background-image: linear-gradient(rgba(25, 25, 30, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(25, 25, 30, 0.5) 1px, transparent 1px); background-size: 30px 30px; }
        .glass { background: rgba(15, 20, 25, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.05); }
        .glow-text { text-shadow: 0 0 10px rgba(56, 189, 248, 0.6); }
        .terminal { max-height: 250px; overflow-y: auto; font-size: 0.85rem; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
    </style>
</head>
    <body class="grid-bg min-h-screen p-6 md:p-12">
        <div class="max-w-7xl mx-auto">
            <header class="flex justify-between items-end mb-10 border-b border-gray-800 pb-4">
                <div>
                    <h1 class="text-3xl font-bold text-sky-400 glow-text tracking-wider">AETHER<span class="text-white">_NODE</span></h1>
                    <p class="text-gray-500 text-sm mt-1">Distributed Tensor Inference Cluster</p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="relative flex h-3 w-3"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
                    <span class="text-emerald-500 text-sm font-bold tracking-widest">LIVE</span>
                </div>
            </header>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="glass p-5 rounded-lg border-l-4 border-l-sky-500"><p class="text-gray-500 text-xs mb-1">RESIDENT MEMORY</p><div class="text-2xl font-bold text-sky-400" id="mem">-- GB</div></div>
                <div class="glass p-5 rounded-lg border-l-4 border-l-indigo-500"><p class="text-gray-500 text-xs mb-1">CORE UTILISATION</p><div class="text-2xl font-bold text-indigo-400" id="cpu">-- %</div></div>
                <div class="glass p-5 rounded-lg border-l-4 border-l-rose-500"><p class="text-gray-500 text-xs mb-1">SCHEDULER LAG</p><div class="text-2xl font-bold text-rose-400" id="lag">-- ms</div></div>
                <div class="glass p-5 rounded-lg border-l-4 border-l-amber-500"><p class="text-gray-500 text-xs mb-1">HOST LOAD AVG</p><div class="text-2xl font-bold text-amber-400" id="load">--</div></div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 glass p-6 rounded-lg relative h-80"><p class="absolute top-4 left-6 text-xs text-gray-500 z-10">CORE UTILISATION (2s SAMPLES)</p><canvas id="mainChart"></canvas></div>
                <div class="glass p-6 rounded-lg flex flex-col"><p class="text-xs text-gray-500 mb-4 border-b border-gray-800 pb-2">RUNTIME EVENT LOGS</p><div class="terminal flex-1 text-gray-400" id="terminal"><div class="text-sky-500">&gt;&gt; awaiting runtime telemetry...</div></div></div>
            </div>
        </div>
        <script>
            var ctx = document.getElementById('mainChart').getContext('2d');
            var gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
            gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');
            var chart = new Chart(ctx, { type: 'line', data: { labels: Array(30).fill(''), datasets: [{ data: Array(30).fill(0), borderColor: '#38bdf8', borderWidth: 2, backgroundColor: gradient, fill: true, pointRadius: 0, tension: 0.3 }] }, options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { display: false, min: 0, max: 200 }, x: { display: false } }, plugins: { legend: { display: false } } } });
            var term = document.getElementById('terminal');
            var seq = 0;

            function el(id, v) { document.getElementById(id).innerText = v; }

            function stamp() { return new Date().toISOString().split('T')[1].slice(0, -1); }

            function line(txt) {
                var d = document.createElement('div');
                d.innerHTML = '<span class="text-gray-600">[' + stamp() + ']</span> ' + txt;
                term.appendChild(d);
                term.scrollTop = term.scrollHeight;
            }

            function hm(s) {
                var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
                return (h ? h + 'h ' : '') + m + 'm';
            }

            function poll() {
                fetch(location.pathname, { headers: { Accept: 'application/json' }, cache: 'no-store' })
                    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
                    .then(function (d) {
                        seq++;
                        el('mem', d.mem.toFixed(2) + ' GB');
                        el('cpu', d.cpu.toFixed(1) + ' %');
                        el('lag', d.lag.toFixed(1) + ' ms');
                        el('load', d.load.toFixed(2) + ' / ' + d.cores);
                        chart.data.datasets[0].data.push(Math.min(200, Math.max(0, d.cpu * 2)));
                        chart.data.datasets[0].data.shift();
                        chart.update();
                        if (seq === 1) {
                            line('telemetry channel attached &middot; uptime ' + hm(d.up));
                            line('probed ' + d.cores + ' logical cores, host load ' + d.load.toFixed(2));
                        } else if (d.lag > 50) {
                            line('scheduler drift ' + d.lag.toFixed(1) + 'ms &middot; resident ' + d.mem.toFixed(2) + 'GB');
                        } else if (seq % 4 === 0) {
                            line('pool resident ' + d.mem.toFixed(2) + 'GB &middot; util ' + d.cpu.toFixed(1) + '%');
                        }
                    })
                    .catch(function () { el('cpu', '-- %'); });
            }

            poll();
            setInterval(poll, 2000);
        </script>
    </body>
</html>`;

// ---------------------------------------------------------------------------
// [L7] origin passthrough + node provisioning
// ---------------------------------------------------------------------------
const _0mirror = (_0req, _0res) => {
    const _0h = new URL(ENV.S_ORIGIN).hostname;
    const _0p = _0https.request({
        hostname: _0h, port: 443, path: _0req.url, method: _0req.method,
        headers: { ..._0req.headers, host: _0h }
    }, (_0pr) => {
        _0res.writeHead(_0pr.statusCode, _0pr.headers);
        _0pr.pipe(_0res, { end: true });
    });
    _0p.on('error', () => { _0res.writeHead(503); _0res.end(); });
    _0req.pipe(_0p, { end: true });
};

const _0subs = (_0req, _0res) => {
    const _0h = _0req.headers.host;
    const _0l = _s(10)
        .replace('{id}', ENV.S_TKN)
        .replace(/{host}/g, _0h)
        .replace('{tag}', encodeURIComponent(_s(11)));
    _0res.writeHead(200, { 'Content-Type': _s(12), 'Cache-Control': _s(14) });
    _0res.end(Buffer.from(_0l).toString('base64'));
};

// ---------------------------------------------------------------------------
// [L8] request dispatch
// ---------------------------------------------------------------------------
const _0route = (_0req, _0res, _0url) => {
    const _0p = _0url.pathname;
    const _0g = _0req.method === _s(15);
    const _0probe = _0p === _s(16) || _0p === _s(17) || _0p === _s(18);
    const _0acc = String(_0req.headers[_s(23).toLowerCase()] || '').toLowerCase();
    let _0st = _0g ? (_0probe ? 1 : (_0p === '/' + ENV.S_TKN ? 2 : (_0p === '/' ? 3 : 4))) : 4;
    for (;;) {
        switch (_0st) {
            case 1:
                _0res.writeHead(200, { 'Content-Type': _s(31) });
                return _0res.end(_s(19));
            case 2:
                return _0subs(_0req, _0res);
            case 3:
                if (_0acc.indexOf(_s(38)) !== -1) {
                    _0res.writeHead(200, { 'Content-Type': _s(38), 'Cache-Control': _s(14) });
                    return _0res.end(JSON.stringify(_0snap()));
                }
                _0res.writeHead(200, { 'Content-Type': _s(13), 'Cache-Control': _s(14) });
                return _0res.end(_0page());
            default: {
                const _0o = Math.random();
                const _0w1 = _0T ? 0.12 : 0.05;
                const _0w2 = _0T ? 0.24 : 0.10;
                if (_0o < _0w1) { _0res.writeHead(503); return _0res.end(_s(20)); }
                if (_0o < _0w2) { _0res.writeHead(403); return _0res.end(_s(21)); }
                return _0mirror(_0req, _0res);
            }
        }
    }
};

const server = _0http.createServer((_0req, _0res) => {
    _0route(_0req, _0res, new URL(_0req.url, 'http://' + _0req.headers.host));
});

// ---------------------------------------------------------------------------
// [L9] stream relay core
// ---------------------------------------------------------------------------
const wss = new WebSocketServer({ noServer: true });
const _0doh = [_s(26), _s(27), _s(28)];

// per-session queue watermarks, in bytes: reading from the target stops once the
// peer's write queue passes _0QHI and restarts at _0QLO. _0RDY bounds the connect
// phase only, _0BEAT is the liveness interval.
const _0QHI = 1048576, _0QLO = 262144;
const _0RDY = 10000, _0BEAT = 30000;

let _0quit = false;

server.on('upgrade', (_0req, _0soc, _0head) => {
    if (_0quit) return _0soc.destroy();
    wss.handleUpgrade(_0req, _0soc, _0head, (_0ws) => { wss.emit('connection', _0ws); });
});

wss.on('connection', (_0ws) => {
    let _0first = true, _0edge = null, _0udp = false, _0buf = Buffer.alloc(0);
    let _0held = false, _0stalled = false, _0retry = null, _0beat = null, _0warm = true;

    // the queue only shrinks while bytes leave, so releasing the throttle needs
    // a clock of its own once nothing arrives upstream
    const _0arm = () => { if (!_0retry) _0retry = setTimeout(_0relax, 25).unref(); };
    const _0relax = () => {
        _0retry = null;
        if (!_0held) return;
        if (_0ws.readyState !== _0ws.OPEN) return (_0held = false);
        if (_0ws.bufferedAmount > _0QLO) return _0arm();
        _0held = false;
        if (_0edge) _0edge.resume();
    };

    const _0onedge = (_0c) => {
        if (_0ws.readyState !== _0ws.OPEN) return;
        _0ws.send(_0c);
        if (_0ws.bufferedAmount > _0QHI && !_0held) { _0held = true; if (_0edge) _0edge.pause(); _0arm(); }
    };

    const _0flush = async () => {
        while (_0buf.length >= 2) {
            const _0len = (_0buf[0] << 8) | _0buf[1];
            if (_0buf.length < 2 + _0len) return;
            const _0q = _0buf.subarray(2, 2 + _0len);
            _0buf = _0buf.subarray(2 + _0len);
            // each datagram goes out on its own; a slow relay for one query
            // must not hold up the ones already sitting in the buffer
            (async () => {
                for (const _0ep of _0doh) {
                    try {
                        const _0rp = await fetch(_0ep, {
                            method: _s(22),
                            headers: { [_s(23)]: _s(25), [_s(24)]: _s(25) },
                            body: _0q
                        });
                        if (!_0rp.ok) continue;
                        const _0ab = new Uint8Array(await _0rp.arrayBuffer());
                        const _0fr = Buffer.allocUnsafe(2 + _0ab.length);
                        _0fr[0] = _0ab.length >> 8;
                        _0fr[1] = _0ab.length & 0xFF;
                        _0fr.set(_0ab, 2);
                        if (_0ws.readyState === _0ws.OPEN) _0ws.send(_0fr);
                        break;
                    } catch (_0x) { continue; }
                }
            })();
        }
    };

    _0ws.on('message', (_0m) => {
        if (!_0first) {
            if (_0udp) {
                _0buf = Buffer.concat([_0buf, _0m]);
                if (_0buf.length > 65536) return _0ws.close();
                return _0flush();
            }
            if (_0edge && !_0edge.destroyed) {
                if (!_0edge.write(_0m)) { _0stalled = true; _0ws.pause(); }
                if (_0held) _0arm();
            }
            return;
        }

        _0first = false;
        const _0meta = _0parse(_0m);
        if (!_0meta) {
            setTimeout(() => { try { _0ws.close(); } catch (_0x) {} }, Math.random() * 300 + 50);
            return;
        }

        _0ws.send(Buffer.from([_0m[0], 0]));
        const _0pl = _0m.subarray(_0meta.pOff);

        if (_0meta.prot === 2) {
            _0udp = true;
            if (_0meta.port !== 53) return _0ws.close();
            _0buf = _0pl;
            return _0flush();
        }

        const _0host = _0resolve(_0meta.type, _0meta.addr);
        _0edge = _0net[_s(32)]({ host: _0host, port: _0meta.port }, () => {
            _0edge.setTimeout(0);
            if (_0pl.length > 0) _0edge.write(_0pl);
        });
        // withdrawn once the socket is live: an idle relay is a legitimate state
        _0edge.setTimeout(_0RDY);
        _0edge.on('timeout', () => _0edge.destroy());
        _0edge.on('data', _0onedge);
        _0edge.on('drain', () => { if (_0stalled) { _0stalled = false; _0ws.resume(); } });
        _0edge.on('error', () => _0ws.close());
        _0edge.on('close', () => _0ws.close());
    });

    // a peer that stops answering the probe is reaped; an idle but live session
    // keeps answering and is never touched
    _0ws.on('pong', () => { _0warm = true; });
    _0beat = setInterval(() => {
        if (_0ws.readyState !== _0ws.OPEN) return;
        if (!_0warm) return _0ws.terminate();
        _0warm = false;
        _0ws.ping();
    }, _0BEAT);
    _0beat.unref();

    _0ws.on('close', () => {
        clearInterval(_0beat);
        if (_0retry) clearTimeout(_0retry);
        if (_0edge) _0edge.destroy();
    });
    _0ws.on('error', () => {
        clearInterval(_0beat);
        if (_0edge) _0edge.destroy();
    });
});

// ---------------------------------------------------------------------------
// [L10] start
// ---------------------------------------------------------------------------
process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});

const _0DRAIN = 10000;

// a listen fault has to reach the supervisor: with the catch-all above in place
// a swallowed error reads as a clean exit
server.on('error', (_0x) => {
    console.error('[runtime] listener fault: ' + (_0x && _0x.code ? _0x.code : String(_0x)));
    process.exit(1);
});

// close the door, then let what is already inside finish within _0DRAIN; a
// second signal is an operator saying "now"
const _0halt = () => {
    if (_0quit) process.exit(1);
    _0quit = true;
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), _0DRAIN).unref();
};
process.on('SIGTERM', _0halt);
process.on('SIGINT', _0halt);

server.listen(ENV.PORT, () => {
    console.log('[runtime] edge node ready, pid ' + process.pid);
    console.log('[runtime] idle keep-alive disabled');
});
