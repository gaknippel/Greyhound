<script>
  import { fly } from 'svelte/transition';
  import { Check, Ban, FolderOpen, X } from '@lucide/svelte';
  import { engine } from '../lib/engine.svelte.js';

  let shown = $state(null);

  // Show each finished export for a few seconds
  $effect(() => {
    if (!engine.lastExport) return;
    shown = engine.lastExport;
    const timer = setTimeout(() => (shown = null), 7000);
    return () => clearTimeout(timer);
  });
</script>

{#if shown}
  <div class="toast" class:cancelled={shown.cancelled} transition:fly={{ y: 24, duration: 350 }}>
    <span class="icon">{#if shown.cancelled}<Ban size={16} />{:else}<Check size={16} />{/if}</span>
    <div class="text">
      <div>{shown.cancelled ? 'export cancelled' : `exported ${shown.count.toLocaleString()} ${shown.count === 1 ? 'asset' : 'assets'}`}</div>
      <div class="path">{shown.path}</div>
    </div>
    <button class="button" onclick={() => engine.reveal(shown.path)}><FolderOpen size={14} /> open</button>
    <button class="close" aria-label="dismiss" onclick={() => (shown = null)}><X size={14} /></button>
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    right: 22px;
    bottom: 22px;
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 460px;
    padding: 12px 12px 12px 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: 0 10px 30px rgb(0 0 0 / 0.35);
  }
  .icon {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--ok) 20%, transparent);
    color: var(--ok);
    animation: pop 0.45s var(--ease) 0.15s both;
  }
  .cancelled .icon {
    background: var(--control);
    color: var(--muted);
  }
  @keyframes pop {
    from {
      transform: scale(0.3);
    }
  }
  .text {
    min-width: 0;
  }
  .path {
    color: var(--muted);
    font-size: 11.5px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .close {
    display: grid;
    place-items: center;
    padding: 4px;
    border: 0;
    border-radius: 4px;
    background: none;
    color: var(--muted);
    cursor: pointer;
  }
</style>
