import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const configPath = 'astro.config.mjs';

function getHash(content: string): string {
  return 'sha256-' + crypto.createHash('sha256').update(content).digest('base64');
}

function extractScriptsFromHtmlString(html: string): string[] {
  const regex = /<script([^>]*)>(.*?)<\/script>/gs;
  const scripts: string[] = [];
  for (const match of html.matchAll(regex)) {
    const attrs = match[1];
    const content = match[2];
    if (attrs.includes('src=')) continue;
    if (attrs.includes('type="application/json"') || attrs.includes("type='application/json'")) continue;
    if (attrs.includes('type="application/ld+json"') || attrs.includes("type='application/ld+json'")) continue;
    if (content.trim().length > 0) {
      scripts.push(content);
    }
  }
  return scripts;
}

function extractStylesFromHtmlString(html: string): string[] {
  const regex = /<style([^>]*)>(.*?)<\/style>/gs;
  const styles: string[] = [];
  for (const match of html.matchAll(regex)) {
    const attrs = match[1];
    const content = match[2];
    // Skip external stylesheets (linked via href or similar)
    if (attrs.includes('href=')) continue;
    if (content.trim().length > 0) {
      styles.push(content);
    }
  }
  return styles;
}

function getHtmlFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getHtmlFiles(filePath, fileList);
    } else if (filePath.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function getPageName(file: string): string {
  let pageName = path.relative('dist', file).replaceAll('\\', '/');
  pageName = pageName.replace(/^[a-z]{2}\//, ''); // Remove locale prefix (e.g., 'fr/')

  if (pageName === 'index.html') pageName = 'index';
  else if (pageName === '404.html') pageName = '404';
  else if (pageName.endsWith('/index.html')) pageName = pageName.replace('/index.html', '');
  else if (pageName.endsWith('.html')) pageName = pageName.replace('.html', '');

  return pageName;
}

function formatComment(pages: Set<string>, totalPages: number): string {
  if (pages.size === totalPages) {
    return 'All pages';
  } else if (pages.size > 3) {
    const pageArray = Array.from(pages);
    return pageArray.slice(0, 3).join(', ') + '...';
  } else {
    return Array.from(pages).join(', ');
  }
}

interface DirectiveUpdate {
  newHashesMatches: string[];
  oldHashesMatches: string[];
  configChanged: boolean;
}

function updateDirectiveHashes(
  config: string,
  directiveName: string,
  hashMap: Map<string, Set<string>>,
  totalPages: number
): { updatedConfig: string; result: DirectiveUpdate } {
  const newHashesLines: string[] = [];
  const newHashesMatches: string[] = [];

  for (const [hash, pages] of hashMap.entries()) {
    newHashesMatches.push(hash);
    const comment = formatComment(pages, totalPages);
    newHashesLines.push(`          '${hash}', // ${comment}`);
  }

  const directiveRegex = new RegExp(String.raw`(${directiveName}:\s*\{[\s\S]*?hashes:\s*\[)([\s\S]*?)(\],)`);
  const match = directiveRegex.exec(config);

  if (!match) {
    console.error(`Could not find ${directiveName} hashes in astro.config.mjs`);
    process.exit(1);
  }

  const prefix = match[1];
  const oldHashesContent = match[2];
  const suffix = match[3];

  const oldHashesMatches = [...oldHashesContent.matchAll(/'(sha256-[^']+)'/g)].map((m) => m[1]);

  const addedHashes = newHashesMatches.filter((h) => !oldHashesMatches.includes(h)).length;
  const removedHashes = oldHashesMatches.filter((h) => !newHashesMatches.includes(h)).length;
  const changedCount = Math.max(addedHashes, removedHashes);

  const newHashesContent = '\n' + newHashesLines.join('\n') + '\n        ';
  const updatedConfig = config.replace(directiveRegex, prefix + newHashesContent + suffix);
  const configChanged = config !== updatedConfig;

  if (!configChanged) {
    console.log(`\x1b[32m✓ No changes to ${directiveName} hashes in astro config.\x1b[0m`);
  } else if (changedCount === 0) {
    console.log(`\x1b[33m✓ Updated ${directiveName} hash comments in astro config.\x1b[0m`);
  } else {
    console.log(
      `\x1b[33m✓ Updated ${changedCount} ${directiveName} hash${changedCount === 1 ? '' : 'es'} in astro config.\x1b[0m`
    );
  }

  return {
    updatedConfig,
    result: { newHashesMatches, oldHashesMatches, configChanged },
  };
}

const htmlFiles = getHtmlFiles('dist');
const scriptHashMap = new Map<string, Set<string>>();
const styleHashMap = new Map<string, Set<string>>();
const uniquePages = new Set<string>();

// 1. Scan all HTML files for inline scripts and styles, compute hashes
for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const scripts = extractScriptsFromHtmlString(content);
  const styles = extractStylesFromHtmlString(content);
  const pageName = getPageName(file);

  uniquePages.add(pageName);

  for (const script of scripts) {
    const hash = getHash(script);
    if (!scriptHashMap.has(hash)) {
      scriptHashMap.set(hash, new Set());
    }
    scriptHashMap.get(hash)!.add(pageName);
  }

  for (const style of styles) {
    const hash = getHash(style);
    if (!styleHashMap.has(hash)) {
      styleHashMap.set(hash, new Set());
    }
    styleHashMap.get(hash)!.add(pageName);
  }
}

// 2. Read and update astro.config.mjs
let config = fs.readFileSync(configPath, 'utf8');
const totalPages = uniquePages.size;

const { updatedConfig: configAfterScripts, result: scriptResult } = updateDirectiveHashes(
  config,
  'scriptDirective',
  scriptHashMap,
  totalPages
);

const { updatedConfig: configAfterStyles, result: styleResult } = updateDirectiveHashes(
  configAfterScripts,
  'styleDirective',
  styleHashMap,
  totalPages
);

if (configAfterStyles !== config) {
  fs.writeFileSync(configPath, configAfterStyles);
}

// 3. Update HTML files directly
let updatedCount = 0;

const replacements: [string, string][] = [];

for (const { oldHashesMatches, newHashesMatches } of [scriptResult, styleResult]) {
  const oldHashesString = oldHashesMatches.map((h) => `'${h}'`).join(' ');
  const newHashesString = newHashesMatches.map((h) => `'${h}'`).join(' ');
  if (oldHashesMatches.length > 0 && oldHashesString !== newHashesString) {
    replacements.push([oldHashesString, newHashesString]);
  }
}

if (replacements.length > 0) {
  for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let fileChanged = false;
    for (const [oldStr, newStr] of replacements) {
      if (content.includes(oldStr)) {
        content = content.replace(oldStr, newStr);
        fileChanged = true;
      }
    }
    if (fileChanged) {
      fs.writeFileSync(file, content);
      updatedCount++;
    }
  }
}

if (updatedCount > 0) {
  console.log(`\x1b[33m✓ Updated CSP hashes in ${updatedCount} HTML files.\x1b[0m`);
} else {
  console.log(`\x1b[32m✓ No changes to CSP hashes in HTML files.\x1b[0m`);
}
