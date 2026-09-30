const RING_CAPACITY = 100;

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

const ring = [];
let active = null;

function push(sample) {
    if (ring.length >= RING_CAPACITY) ring.shift();
    ring.push(sample);
}

export function begin(meta = {}) {
    active = { meta, start: now(), phases: {} };
    return active;
}

export function mark(token, phase) {
    if (!token || token !== active) return;
    token.phases[phase] = now();
}

export function end(token, extra = {}) {
    if (!token || token !== active) return null;
    const finished = now();
    const phases = {};
    let prev = token.start;
    for (const [name, at] of Object.entries(token.phases)) {
        phases[name] = at - prev;
        prev = at;
    }
    phases.draw = finished - prev;
    const sample = {
        total: finished - token.start,
        phases,
        ...token.meta,
        ...extra,
    };
    push(sample);
    active = null;
    return sample;
}

export function cancel(token) {
    if (token && token === active) active = null;
}

function percentile(sorted, p) {
    if (sorted.length === 0) return 0;
    const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
    return sorted[Math.max(0, index)];
}

export function samples() {
    return [...ring];
}

export function last() {
    return ring.length ? ring[ring.length - 1] : null;
}

export function stats() {
    if (ring.length === 0) return null;
    const totals = ring.map((s) => s.total).sort((a, b) => a - b);
    const phaseStats = {};
    for (const sample of ring) {
        for (const [name, value] of Object.entries(sample.phases)) {
            (phaseStats[name] ??= []).push(value);
        }
    }
    const aggregate = {};
    for (const [name, values] of Object.entries(phaseStats)) {
        const sorted = [...values].sort((a, b) => a - b);
        aggregate[name] = {
            min: sorted[0],
            p50: percentile(sorted, 50),
            p95: percentile(sorted, 95),
            max: sorted[sorted.length - 1],
        };
    }
    return {
        count: ring.length,
        min: totals[0],
        p50: percentile(totals, 50),
        p95: percentile(totals, 95),
        max: totals[totals.length - 1],
        phases: aggregate,
    };
}

export function summary(sample) {
    const s = sample ?? last();
    if (!s) return null;
    return {
        total: s.total,
        load: s.phases.load ?? 0,
        layout: s.phases.layout ?? 0,
        draw: s.phases.draw ?? 0,
        sprites: s.sprites ?? 0,
        cacheHits: s.cacheHits ?? 0,
        chars: s.chars ?? 0,
    };
}

export function reset() {
    ring.length = 0;
    active = null;
}
