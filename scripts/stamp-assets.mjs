#!/usr/bin/env node
/**
 * 给 HTML 里的本地 js/css 引用打上内容哈希版本号（?v=<sha256 前 8 位>）。
 *
 * 为什么需要：tv.nickyam.com 的静态资源被 CDN 缓存 31 天，
 * Cloudflare Pages 部署后不会自动清这份缓存，改完 JS 用户还在跑旧代码。
 * HTML 本身不缓存，所以只要 HTML 里的 URL 变了，浏览器和 CDN 都会重新取。
 *
 * 用法：node scripts/stamp-assets.mjs [--check]
 *   --check 只检查是否有未打哈希/哈希过期，不写文件（可用于 CI 闸门）
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HTML_FILES = readdirSync(ROOT).filter((f) => f.endsWith('.html'));
const ASSET_RE = /((?:src|href)=")((?:js|css|libs)\/[^"?#]+)(?:\?v=[0-9a-f]+)?(")/g;

const hashCache = new Map();
function assetHash(relPath) {
    if (hashCache.has(relPath)) return hashCache.get(relPath);
    const digest = createHash('sha256')
        .update(readFileSync(join(ROOT, relPath)))
        .digest('hex')
        .slice(0, 8);
    hashCache.set(relPath, digest);
    return digest;
}

const checkOnly = process.argv.includes('--check');
let changed = 0;
const stale = [];

for (const file of HTML_FILES) {
    const abs = join(ROOT, file);
    const before = readFileSync(abs, 'utf8');
    const after = before.replace(ASSET_RE, (match, head, rel, tail) => {
        let hash;
        try {
            hash = assetHash(rel);
        } catch {
            return match; // 文件不存在就保持原样，交给其它检查报错
        }
        return `${head}${rel}?v=${hash}${tail}`;
    });

    if (after !== before) {
        changed += 1;
        stale.push(file);
        if (!checkOnly) writeFileSync(abs, after);
    }
}

if (checkOnly) {
    if (stale.length) {
        console.error(`以下 HTML 的资源版本号已过期，请运行 node scripts/stamp-assets.mjs：\n  ${stale.join('\n  ')}`);
        process.exit(1);
    }
    console.log('资源版本号已是最新');
} else {
    console.log(changed ? `已更新 ${changed} 个 HTML：${stale.join(', ')}` : '资源版本号已是最新，无需改动');
}
