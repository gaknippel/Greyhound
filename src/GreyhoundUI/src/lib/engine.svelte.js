// Talks to `Greyhound.exe --server` through the Tauri shell: JSON requests out, replies and events back
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

const ERRORS = {
  no_games_running: 'no supported game is running',
  unsupported_game_update: 'this game is supported, but not this update',
  'busy exporting': 'wait for the export to finish',
};

let nextId = 1;
const pending = new Map();

class Greyhound {
  // idle | loading | connected | error
  connection = $state('idle');
  process = $state('');
  error = $state('');
  // Plain array, 30k+ rows would be slow as deep state; live statuses go in `statuses`
  assets = $state.raw([]);
  statuses = $state({});
  loadedAt = $state(0);
  exporting = $state(false);
  progress = $state(0);
  exportCount = $state(0);
  lastExport = $state(null);
  settings = $state({});
  // Where exports actually land: the export_path setting, or exported_files next to Greyhound.exe
  exportRoot = $state('');
  log = $state.raw([]);

  constructor() {
    this.listening = Promise.all([
      listen('engine', (e) => this.#receive(e.payload)),
      listen('engine-exit', () => {
        this.connection = 'error';
        this.error = 'the engine stopped';
        this.exporting = false;
        this.#write('note', 'engine stopped');
      }),
    ]);
  }

  statusOf(index) {
    return this.statuses[index] ?? this.assets[index]?.status ?? 'unknown';
  }

  #write(kind, text) {
    this.log = [...this.log.slice(-399), { time: new Date(), kind, text: text.length > 400 ? text.slice(0, 400) + '…' : text }];
  }

  #receive(line) {
    const msg = JSON.parse(line);
    if (msg.event === 'progress') return void (this.progress = msg.value);
    if (msg.event === 'status') return void (this.statuses[msg.index] = msg.status);

    this.#write('in', line);
    if (msg.event === 'export_done') {
      this.exporting = false;
      this.progress = 100;
      this.lastExport = { count: this.exportCount, path: msg.path, cancelled: msg.cancelled, at: Date.now() };
    } else if (pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  }

  async request(cmd, args = {}) {
    await this.listening;
    const id = nextId++;
    const line = JSON.stringify({ id, cmd, ...args });
    this.#write('out', line);
    return new Promise((resolve) => {
      pending.set(id, resolve);
      invoke('send', { line }).catch((err) => {
        pending.delete(id);
        resolve({ ok: false, error: String(err), offline: true });
      });
    });
  }

  async loadGame() {
    this.connection = 'loading';
    this.error = '';
    const started = Date.now();

    const game = await this.request('load_game');
    const list = game.ok ? await this.request('assets') : game;
    // Keep the loading state up long enough to read as loading instead of a flicker
    await new Promise((done) => setTimeout(done, Math.max(0, 500 - (Date.now() - started))));

    if (!game.ok || !list.ok) {
      this.connection = list.offline ? 'error' : 'idle';
      this.error = ERRORS[list.error] ?? list.error;
      this.assets = [];
      return;
    }
    this.statuses = {};
    this.assets = list.assets;
    this.process = game.process;
    this.connection = 'connected';
    this.loadedAt = Date.now();
  }

  async clear() {
    await this.request('clear');
    this.assets = [];
    this.statuses = {};
    this.process = '';
    this.connection = 'idle';
  }

  async exportAssets(indices) {
    if (!indices.length || this.exporting) return;
    this.exporting = true;
    this.progress = 0;
    this.exportCount = indices.length;
    this.lastExport = null;
    const reply = await this.request('export', { indices });
    if (!reply.ok) {
      this.exporting = false;
      this.error = ERRORS[reply.error] ?? reply.error;
    }
  }

  cancel() {
    return this.request('cancel');
  }

  async loadSettings(keys) {
    const reply = await this.request('get_settings', { keys });
    if (reply.ok) this.settings = reply.settings;
  }

  async setSetting(key, value) {
    const previous = this.settings[key];
    this.settings[key] = value;
    const reply = await this.request('set_setting', { key, value });
    if (!reply.ok) this.settings[key] = previous;
    if (key === 'export_path') await this.loadExportRoot();
  }

  async loadExportRoot() {
    const reply = await this.request('export_root');
    if (reply.ok) this.exportRoot = reply.path;
  }

  reveal(path) {
    return invoke('reveal', { path }).catch((err) => this.#write('note', String(err)));
  }
}

export const engine = new Greyhound();
