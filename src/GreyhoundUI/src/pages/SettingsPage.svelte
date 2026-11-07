<script>
  import { scale } from 'svelte/transition';
  import { open } from '@tauri-apps/plugin-dialog';
  import { FolderSearch, FolderOpen, RotateCcw } from '@lucide/svelte';
  import Card from '../components/Card.svelte';
  import SettingRow from '../components/SettingRow.svelte';
  import Toggle from '../components/Toggle.svelte';
  import Pills from '../components/Pills.svelte';
  import { engine } from '../lib/engine.svelte.js';

  let { page } = $props();

  const isTrue = (key) => engine.settings[key] === 'true';
  const flip = (key) => engine.setSetting(key, isTrue(key) ? 'false' : 'true');

  async function browse(key) {
    const folder = await open({ directory: true, defaultPath: engine.exportRoot || undefined, title: 'choose where exports go' });
    if (folder) engine.setSetting(key, folder);
  }
</script>

<div class="page">
  <header>
    <h1 class="page-title">{page.title}</h1>
    <p class="page-subtitle">{page.subtitle}</p>
  </header>

  {#each page.cards as card, i (card.title)}
    <Card title={card.title} delay={60 * (i + 1)}>
      {#each card.rows as row (row.label)}
        <SettingRow label={row.label} hint={row.hint}>
          {#if row.kind === 'toggle'}
            <Toggle label={row.label} checked={isTrue(row.key)} onchange={() => flip(row.key)} />
          {:else if row.kind === 'choice'}
            <Pills options={row.options} isOn={(value) => engine.settings[row.key] === value} onpick={(value) => engine.setSetting(row.key, value)} />
          {:else if row.kind === 'formats'}
            <Pills options={row.options} isOn={isTrue} onpick={flip} />
          {:else if row.kind === 'folder'}
            <div class="folder">
              {#if !engine.settings[row.key]}<em class="default">default</em>{/if}
              {#key engine.exportRoot}
                <!-- rtl box so long paths lose their start, bdi keeps the path itself left to right -->
                <span class="path" title={engine.exportRoot} in:scale={{ start: 0.96, duration: 250 }}><bdi>{engine.exportRoot || '…'}</bdi></span>
              {/key}
              <button class="button" onclick={() => browse(row.key)}><FolderSearch size={14} /> browse</button>
              <button class="button icon" title="open folder" aria-label="open folder" onclick={() => engine.reveal(engine.exportRoot)}><FolderOpen size={14} /></button>
              {#if engine.settings[row.key]}
                <button class="button icon" title="back to default" aria-label="back to default" onclick={() => engine.setSetting(row.key, '')} transition:scale={{ duration: 180 }}>
                  <RotateCcw size={14} />
                </button>
              {/if}
            </div>
          {/if}
        </SettingRow>
      {/each}
    </Card>
  {/each}

  {#if engine.connection === 'error'}
    <p class="offline">the engine isn’t running, so these can’t be read or saved right now</p>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
    padding: 26px;
    overflow-y: auto;
  }
  header {
    margin-bottom: 4px;
  }
  .offline {
    color: var(--danger);
  }
  .folder {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .path {
    display: block;
    max-width: 380px;
    height: 30px;
    padding: 0 10px;
    line-height: 28px;
    border: 1px solid var(--control-line);
    border-radius: 7px;
    background: var(--control);
    font: 12px var(--font-mono);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    direction: rtl;
    user-select: text;
  }
  .default {
    color: var(--muted);
    font-size: 11.5px;
  }
</style>
