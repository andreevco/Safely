type TextAccessor<T> = (item: T) => string;

const BONUS_FIRST_CHAR = 10;
const BONUS_WORD_BOUNDARY = 6;
const BONUS_CONSECUTIVE = 8;
const BONUS_CASE_MATCH = 2;

function isSeparator(ch: string): boolean {
    return ch === ' ' || ch === '-' || ch === '_' || ch === '.' || ch === '/';
}

function fuzzyScore(query: string, target: string): number | null {
    const q = query.toLowerCase();
    const t = target.toLowerCase();
    const qLen = q.length;
    const tLen = t.length;

    if (qLen === 0) return 0;
    if (qLen > tLen) return null;

    let qi = 0;
    let endIdx = -1;
    for (let ti = 0; ti < tLen; ti++) {
        if (t[ti] === q[qi]) {
            endIdx = ti;
            if (++qi === qLen) break;
        }
    }
    if (qi !== qLen) return null;

    qi = qLen - 1;
    let startIdx = endIdx;
    for (let ti = endIdx; ti >= 0; ti--) {
        if (t[ti] === q[qi]) {
            startIdx = ti;
            if (--qi < 0) break;
        }
    }

    let score = 0;
    qi = 0;
    let prevMatchIdx = -2;

    for (let ti = startIdx; ti <= endIdx; ti++) {
        if (t[ti] !== q[qi]) continue;

        score += 1;

        if (ti === prevMatchIdx + 1) score += BONUS_CONSECUTIVE;
        if (ti === 0) score += BONUS_FIRST_CHAR;
        else if (isSeparator(t[ti - 1])) score += BONUS_WORD_BOUNDARY;
        if (target[ti] === query[qi]) score += BONUS_CASE_MATCH;

        prevMatchIdx = ti;
        qi++;
    }

    score -= (tLen - qLen) * 0.5;

    return score;
}

export function fuzzySearch<T>(items: T[], query: string, getKey: TextAccessor<T>): T[] {
    const trimmed = query.trim();
    if (!trimmed) return items;

    const scored: { item: T; score: number }[] = [];

    for (const item of items) {
        const score = fuzzyScore(trimmed, getKey(item));
        if (score !== null) scored.push({ item, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.map(r => r.item);
}
