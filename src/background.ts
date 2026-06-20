import Encoding from 'encoding-japanese';
import type { Engine } from './options/options';

type ColorName = chrome.tabGroups.ColorEnum;

const DEFAULT_ENGINES: Engine[] = [
  { id: 'google', label: 'Google', url: 'https://www.google.com/search?q=%s', encode: 'UTF8', enabled: true },
  { id: 'github', label: 'GitHub', url: 'https://github.com/search?q=%s', encode: 'UTF8', enabled: true },
  { id: 'sof', label: 'Stack Overflow', url: 'https://stackoverflow.com/search?q=%s', encode: 'UTF8', enabled: true },
];

const COLORS: ColorName[] = [
  'grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'
];

async function getEngines(): Promise<Engine[]> {
  const result = await chrome.storage.sync.get('engines');
  const engines: Engine[] = result['engines'] ?? DEFAULT_ENGINES;
  // enabled なものだけ返す
  return engines.filter(e => e.enabled);
}

function encodeQuery(text: string, encode: Engine['encode']): string {
  if (encode === 'UTF8') return encodeURIComponent(text);
  const converted = Encoding.convert(
    Encoding.stringToCode(text),
    { to: encode, from: 'UNICODE' }
  );
  return converted
    .map((b: number) => '%' + b.toString(16).toUpperCase().padStart(2, '0'))
    .join('');
}

async function multiSearch(text: string): Promise<void> {
  const engines = await getEngines();
  if (engines.length === 0) return;

  const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  const urls = engines.map(e => e.url.replace('%s', encodeQuery(text, e.encode)));

  const tabIds: number[] = [];
  for (const url of urls) {
    const tab = await chrome.tabs.create({ url, active: false });
    if (tab.id != null) tabIds.push(tab.id);
  }

  const groupId = await chrome.tabs.group({ tabIds });
  await chrome.tabGroups.update(groupId, {
    title: text,
    color: randomColor,
    collapsed: false,
  });
  await chrome.tabs.update(tabIds[0], { active: true });
}

// ---- Omnibox ----
chrome.omnibox.onInputEntered.addListener(async (text: string) => {
  await multiSearch(text);
});

// ---- Context Menu ----
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'multi-search',
    title: '"%s" をマルチ検索',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === 'multi-search' && info.selectionText) {
    await multiSearch(info.selectionText);
  }
});