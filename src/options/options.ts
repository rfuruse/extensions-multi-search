export interface Engine {
  id: string;
  label: string;
  url: string;
  encode: 'UTF8' | 'SJIS' | 'EUCJP';
  enabled: boolean;
}

const DEFAULT_ENGINES: Engine[] = [
  {
    id: crypto.randomUUID(),
    encode: "UTF8",
    label: "Google",
    url: "https://www.google.com/search?q=%s",
    enabled: false
  },
  {
    id: crypto.randomUUID(),
    encode: "UTF8",
    label: "GitHub",
    url: "https://github.com/search?q=%s",
    enabled: false
  },
  {
    id: crypto.randomUUID(),
    encode: "UTF8",
    label: "Stack Overflow",
    url: "https://stackoverflow.com/search?q=%s",
    enabled: false
  }
];

let engines: Engine[] = [];
let statusTimer: ReturnType<typeof setTimeout> | null = null;

const engineListEl = document.getElementById('engine-list')!;
const enabledCountEl = document.getElementById('enabled-count')!;
const btnAdd = document.getElementById('btn-add')!;
const btnSave = document.getElementById('btn-save')!;
const btnReset = document.getElementById('btn-reset')!;
const btnExport = document.getElementById('btn-export')!;
const btnImport = document.getElementById('btn-import')!;
const fileImport = document.getElementById('file-import') as HTMLInputElement;
const statusMsgEl = document.getElementById('status-msg')!;
const template = document.getElementById('engine-card-template') as HTMLTemplateElement;
const dropOverlay = document.getElementById('drop-overlay')!;

async function init() {
  await loadEngines();
  render();
  setupEventListeners();

  chrome.storage.onChanged.addListener((changes) => {
    if (changes['engines']) {
      engines = changes['engines'].newValue ?? DEFAULT_ENGINES;
      render();
    }
  });
}

async function loadEngines() {
  const result = await chrome.storage.sync.get('engines');
  engines = result['engines'] ?? DEFAULT_ENGINES;

  engines = engines.map(e => e.id ? e : { ...e, id: crypto.randomUUID() });
}

function render() {
  engineListEl.innerHTML = '';

  const enabledCount = engines.filter(e => e.enabled).length;
  enabledCountEl.textContent = `${enabledCount} / ${engines.length} 有効`;

  if (engines.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'notification is-light';
    emptyMsg.style.cssText = 'text-align:center;color:#8a9bb0;';
    emptyMsg.textContent = '検索エンジンがありません。追加してください。';
    engineListEl.appendChild(emptyMsg);
    return;
  }

  engines.forEach((engine) => {
    const clone = template.content.cloneNode(true) as DocumentFragment;
    const cardEl = clone.querySelector('.ms-engine-card') as HTMLDivElement;

    if (!engine.enabled) {
      cardEl.classList.add('is-disabled');
    }

    const toggleEl = clone.querySelector('.ms-engine-card__toggle') as HTMLInputElement;
    toggleEl.checked = engine.enabled;
    toggleEl.title = engine.enabled ? '無効にする' : '有効にする';
    toggleEl.addEventListener('change', (e) => {
      engine.enabled = (e.target as HTMLInputElement).checked;
      render();
    });

    const labelEl = clone.querySelector('.ms-engine-card__label-input') as HTMLInputElement;
    labelEl.value = engine.label;
    labelEl.addEventListener('input', (e) => {
      engine.label = (e.target as HTMLInputElement).value;
    });

    const deleteBtn = clone.querySelector('.ms-engine-card__delete') as HTMLButtonElement;
    deleteBtn.addEventListener('click', () => {
      engines = engines.filter(e => e.id !== engine.id);
      render();
    });

    const urlEl = clone.querySelector('.ms-engine-card__url') as HTMLInputElement;
    urlEl.value = engine.url;
    urlEl.disabled = !engine.enabled;
    urlEl.addEventListener('input', (e) => {
      engine.url = (e.target as HTMLInputElement).value;
    });

    const selectEl = clone.querySelector('.ms-engine-card__encode select') as HTMLSelectElement;
    selectEl.value = engine.encode;
    selectEl.disabled = !engine.enabled;
    selectEl.addEventListener('change', (e) => {
      engine.encode = (e.target as HTMLSelectElement).value as Engine['encode'];
    });

    engineListEl.appendChild(clone);
  });
}

function addEngine() {
  engines.push({
    id: crypto.randomUUID(),
    label: '',
    url: 'https://example.com/search?q=%s',
    encode: 'UTF8',
    enabled: true,
  });
  render();
}

async function saveSettings() {
  await chrome.storage.sync.set({ engines });
  showStatus('保存しました ✓');
}

async function resetSettings() {
  if (!confirm('デフォルト設定に戻しますか？')) return;
  engines = DEFAULT_ENGINES.map(e => ({ ...e, id: crypto.randomUUID() }));
  await chrome.storage.sync.set({ engines });
  showStatus('リセットしました ✓');
  render();
}

function exportSettings() {
  const dataStr = JSON.stringify(engines, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `multi-search-settings-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();

  URL.revokeObjectURL(url);
  showStatus('エクスポートしました ✓');
}

function handleFileImport(file: File) {
  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const json = event.target?.result as string;
      const parsed = JSON.parse(json);

      if (!Array.isArray(parsed)) {
        throw new Error('Invalid format: not an array');
      }

      engines = parsed.map((e: any) => ({
        id: e.id || crypto.randomUUID(),
        label: e.label || '',
        url: e.url || '',
        encode: ['UTF8', 'SJIS', 'EUCJP'].includes(e.encode) ? e.encode : 'UTF8',
        enabled: typeof e.enabled === 'boolean' ? e.enabled : true
      }));

      await chrome.storage.sync.set({ engines });
      render();
      showStatus('インポートしました ✓');
    } catch (err) {
      alert('設定ファイルの読み込みに失敗しました。形式が正しいか確認してください。');
      console.error(err);
    } finally {
      fileImport.value = '';
    }
  };
  reader.readAsText(file);
}

function importSettings(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  handleFileImport(file);
}

function showStatus(msg: string) {
  statusMsgEl.textContent = msg;
  statusMsgEl.classList.add('is-visible');

  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusMsgEl.classList.remove('is-visible');
  }, 2500);
}

function setupEventListeners() {
  btnAdd.addEventListener('click', addEngine);
  btnSave.addEventListener('click', saveSettings);
  btnReset.addEventListener('click', resetSettings);
  btnExport.addEventListener('click', exportSettings);
  btnImport.addEventListener('click', () => fileImport.click());
  fileImport.addEventListener('change', importSettings);

  // Drag & Drop イベントの設定
  document.addEventListener('dragover', (e) => {
    e.preventDefault(); // デフォルトの挙動（ファイルを開く等）を無効化
    dropOverlay.classList.add('is-active');
  });

  document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    // ブラウザウィンドウ外にマウスが出た場合のみオーバーレイを消す
    if (!e.relatedTarget) {
      dropOverlay.classList.remove('is-active');
    }
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    dropOverlay.classList.remove('is-active');

    const file = e.dataTransfer?.files[0];
    if (file && file.name.endsWith('.json')) {
      handleFileImport(file);
    } else if (file) {
      alert('JSONファイルを選択してください。');
    }
  });
}

document.addEventListener('DOMContentLoaded', init);