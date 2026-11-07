<script>
  import { fly, slide } from 'svelte/transition';
  import { Boxes, Box, Film, Image, AudioLines, Settings, Terminal, Gamepad2, RefreshCw, LoaderCircle, Unplug, Ban, Sun, Moon, Monitor } from '@lucide/svelte';
  import { engine } from '../lib/engine.svelte.js';
  import { theme } from '../lib/theme.svelte.js';

  let { page = $bindable() } = $props();

  const NAV = [
    ['assets', Boxes],
    ['models', Box],
    ['anims', Film],
    ['images', Image],
    ['sounds', AudioLines],
    ['settings', Settings],
    ['log', Terminal],
  ];
  const THEMES = [
    ['light', Sun],
    ['dark', Moon],
    ['system', Monitor],
  ];

  const status = $derived.by(() => {
    if (engine.connection === 'loading') return { title: 'loading assets…', hint: 'reading the game’s memory' };
    if (engine.connection === 'connected') return { title: 'connected', hint: `${engine.assets.length.toLocaleString()} assets · ${engine.process}` };
    if (engine.connection === 'error') return { title: 'engine offline', hint: engine.error };
    return { title: 'waiting for game', hint: engine.error || 'start a supported game, then load it' };
  });
</script>

<aside>
  <div class="brand">
    <img src="/logo.png" alt="" />
    <div>
      <div class="name">greyhound</div>
      <div class="sub">call of duty asset exporter</div>
    </div>
  </div>

  <div class="status {engine.connection}">
    <div class="line">
      <span class="dot"></span>
      <div class="text">
        {#key status.title}
          <div class="title" in:fly={{ y: 4, duration: 250 }}>{status.title}</div>
        {/key}
        <div class="hint">{status.hint}</div>
      </div>
    </div>

    {#if engine.exporting}
      <div class="export" transition:slide={{ duration: 250 }}>
        <div class="export-text">
          <span>exporting {engine.exportCount.toLocaleString()} {engine.exportCount === 1 ? 'asset' : 'assets'}</span>
          <span>{engine.progress}%</span>
        </div>
        <div class="bar"><div style="width: {Math.max(engine.progress, 3)}%"></div></div>
        <button class="button cancel" onclick={() => engine.cancel()}><Ban size={13} /> cancel</button>
      </div>
    {:else}
      <div class="buttons">
        <button class="button load" disabled={engine.connection === 'loading'} onclick={() => engine.loadGame()}>
          {#if engine.connection === 'loading'}
            <LoaderCircle size={14} class="spin" /> loading
          {:else if engine.connection === 'connected'}
            <RefreshCw size={14} /> reload
          {:else}
            <Gamepad2 size={15} /> load game
          {/if}
        </button>
        {#if engine.connection === 'connected'}
          <button class="button icon" title="unload game" aria-label="unload game" onclick={() => engine.clear()} in:fly={{ x: 8, duration: 200 }}>
            <Unplug size={14} />
          </button>
        {/if}
      </div>
    {/if}
  </div>

  <nav>
    {#each NAV as [name, Icon] (name)}
      <button class:active={page === name} onclick={() => (page = name)}>
        <Icon size={16} />
        <span>{name}</span>
      </button>
    {/each}
  </nav>

  <div class="themes">
    {#each THEMES as [name, Icon] (name)}
      <button class:active={theme.choice === name} title="{name} theme" aria-label="{name} theme" onclick={() => theme.set(name)}>
        <Icon size={16} />
      </button>
    {/each}
  </div>
  <div class="footer">built on greyhound</div>
</aside>

<style>
  aside {
    display: flex;
    flex-direction: column;
    width: 226px;
    padding: 14px 8px 10px;
    background: var(--sidebar);
    border-right: 1px solid var(--line-soft);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 4px 14px;
  }
  .brand img {
    width: 36px;
    height: 36px;
    border-radius: 6px;
  }
  .name {
    font: 17px var(--font-type);
    letter-spacing: 0.5px;
  }
  .sub {
    color: var(--muted);
    font-size: 11px;
  }

  .status {
    padding: 14px 12px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.03), var(--shadow);
  }
  .line {
    display: flex;
    gap: 10px;
  }
  .dot {
    flex-shrink: 0;
    width: 9px;
    height: 9px;
    margin: 5px 2px 0;
    border-radius: 50%;
    background: var(--faint);
    transition: background 0.3s, box-shadow 0.3s;
  }
  .loading .dot {
    background: var(--accent);
    animation: ping 1.1s ease-out infinite;
  }
  .connected .dot {
    background: var(--ok);
  }
  .error .dot {
    background: var(--danger);
  }
  @keyframes ping {
    from {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 70%, transparent);
    }
    to {
      box-shadow: 0 0 0 8px transparent;
    }
  }
  .text {
    min-width: 0;
  }
  .title {
    font-size: 13.5px;
  }
  .hint {
    color: var(--muted);
    font-size: 11.5px;
    overflow-wrap: anywhere;
  }
  .buttons {
    display: flex;
    gap: 6px;
    margin-top: 12px;
  }
  .load {
    flex: 1;
  }

  .export {
    margin-top: 12px;
  }
  .export-text {
    display: flex;
    justify-content: space-between;
    color: var(--muted);
    font-size: 11.5px;
  }
  .bar {
    height: 6px;
    margin: 6px 0 10px;
    border-radius: 6px;
    background: var(--control);
    overflow: hidden;
  }
  .bar div {
    height: 100%;
    border-radius: 6px;
    background: repeating-linear-gradient(-45deg, var(--accent) 0 8px, color-mix(in srgb, var(--accent) 70%, white) 8px 16px);
    background-size: 22px 100%;
    animation: stripes 0.6s linear infinite;
    transition: width 0.4s var(--ease);
  }
  @keyframes stripes {
    to {
      background-position: 22px 0;
    }
  }
  .cancel {
    width: 100%;
  }

  nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 16px;
  }
  nav button {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 32px;
    padding: 0 10px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: none;
    color: var(--text);
    text-align: left;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  nav button :global(svg) {
    color: var(--muted);
    transition: color 0.15s, transform 0.25s var(--ease);
  }
  nav button:hover {
    background: var(--row-hover);
  }
  nav button:hover :global(svg) {
    transform: scale(1.12);
  }
  nav .active {
    background: var(--control);
    border-color: var(--line);
  }
  nav .active :global(svg) {
    color: var(--accent);
  }

  .themes {
    display: flex;
    gap: 6px;
    margin-top: auto;
  }
  .themes button {
    flex: 1;
    display: grid;
    place-items: center;
    height: 28px;
    border: 1px solid var(--control-line);
    border-radius: 6px;
    background: var(--control);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .themes .active {
    background: var(--row-hover);
    color: var(--accent);
  }
  .footer {
    margin: 10px 4px 0;
    color: var(--muted);
    font-size: 11px;
  }
</style>
