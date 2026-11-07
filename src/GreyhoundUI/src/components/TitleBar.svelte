<script>
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { Minus, Square, X } from '@lucide/svelte';

  const appWindow = getCurrentWindow();
</script>

<div class="titlebar" data-tauri-drag-region>
  <span class="name" data-tauri-drag-region>greyhound</span>
  <div class="buttons">
    <button aria-label="minimize" onclick={() => appWindow.minimize()}><Minus size={15} /></button>
    <button aria-label="maximize" onclick={() => appWindow.toggleMaximize()}><Square size={12} /></button>
    <button class="close" aria-label="close" onclick={() => appWindow.close()}><X size={16} /></button>
  </div>
</div>

<style>
  .titlebar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    padding-left: 12px;
    background: var(--titlebar);
    border-bottom: 1px solid var(--line-soft);
  }
  .name {
    font: 14px var(--font-type);
    letter-spacing: 0.5px;
    color: var(--muted);
  }
  .buttons {
    display: flex;
    height: 100%;
  }
  button {
    display: grid;
    place-items: center;
    width: 46px;
    height: 100%;
    border: 0;
    background: none;
    color: var(--muted);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  button:hover {
    background: var(--row-hover);
    color: var(--text);
  }
  .close:hover {
    background: #c42b1c;
    color: #fff;
  }
</style>
