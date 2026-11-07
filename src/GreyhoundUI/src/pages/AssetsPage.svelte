<script>
  import { scale, fly } from 'svelte/transition';
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { SvelteSet } from 'svelte/reactivity';
  import { Search, Download, X, LoaderCircle, Check, Radar, Gamepad2, SearchX } from '@lucide/svelte';
  import Card from '../components/Card.svelte';
  import { engine } from '../lib/engine.svelte.js';
  import { TYPES, details } from '../lib/assets.js';

  const ROW = 34;
  const OVERSCAN = 8;

  let query = $state('');
  let search;
  const hiddenTypes = new SvelteSet();
  const selected = new SvelteSet();
  let anchor = -1;

  let scrollTop = $state(0);
  let viewport = $state(0);
  let intro = $state(false);

  // Lowercased once per load, filtering runs on every keystroke
  const names = $derived(engine.assets.map((asset) => asset.name.toLowerCase()));

  const counts = $derived.by(() => {
    const result = {};
    for (const asset of engine.assets) result[asset.type] = (result[asset.type] ?? 0) + 1;
    return result;
  });

  const visible = $derived.by(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const result = [];
    for (let i = 0; i < engine.assets.length; i++) {
      if (hiddenTypes.has(engine.assets[i].type)) continue;
      if (terms.every((term) => names[i].includes(term))) result.push(i);
    }
    return result;
  });

  const first = $derived(Math.max(0, Math.floor(scrollTop / ROW) - OVERSCAN));
  const last = $derived(Math.min(visible.length, Math.ceil((scrollTop + viewport) / ROW) + OVERSCAN));

  const total = new Tween(0, { duration: 900, easing: cubicOut });
  $effect(() => {
    total.target = engine.assets.length;
  });

  // New game loaded: drop the old selection and replay the row intro
  $effect(() => {
    if (!engine.loadedAt) return;
    selected.clear();
    anchor = -1;
    intro = true;
    const timer = setTimeout(() => (intro = false), 1200);
    return () => clearTimeout(timer);
  });

  function toggleType(type) {
    hiddenTypes.has(type) ? hiddenTypes.delete(type) : hiddenTypes.add(type);
  }

  function pick(event, position) {
    const index = visible[position];
    if (event.shiftKey && anchor >= 0) {
      if (!event.ctrlKey) selected.clear();
      const from = Math.min(anchor, position, visible.length - 1);
      const to = Math.min(Math.max(anchor, position), visible.length - 1);
      for (let p = from; p <= to; p++) selected.add(visible[p]);
      return;
    }
    if (event.ctrlKey) selected.has(index) ? selected.delete(index) : selected.add(index);
    else {
      selected.clear();
      selected.add(index);
    }
    anchor = position;
  }

  function keydown(event) {
    if (event.ctrlKey && event.key === 'f') {
      event.preventDefault();
      search?.focus();
    }
    if (event.target instanceof HTMLInputElement) return;
    if (event.ctrlKey && event.key === 'a') {
      event.preventDefault();
      visible.forEach((index) => selected.add(index));
    } else if (event.key === 'Enter') engine.exportAssets([...selected]);
    else if (event.key === 'Escape') selected.clear();
  }
</script>

<svelte:window onkeydown={keydown} />

<div class="page">
  <header class="head">
    <div>
      <h1 class="page-title">assets</h1>
      <p class="page-subtitle">
        {#if engine.connection === 'connected'}
          <span class="count">{Math.round(total.current).toLocaleString()}</span> loaded from {engine.process}
        {:else}
          everything greyhound can see in the running game
        {/if}
      </p>
    </div>
    <div class="head-actions">
      <button class="button" disabled={!selected.size || engine.exporting} onclick={() => engine.exportAssets([...selected])}>
        <Download size={14} /> export selected
        {#if selected.size}<span class="badge" in:scale={{ duration: 200 }}>{selected.size.toLocaleString()}</span>{/if}
      </button>
      <button class="button primary" disabled={!visible.length || engine.exporting} onclick={() => engine.exportAssets(visible)}>
        <Download size={14} /> export all shown
      </button>
    </div>
  </header>

  <Card delay={40}>
    <div class="toolbar">
      <label class="search">
        <Search size={15} />
        <input bind:this={search} bind:value={query} placeholder="search names, space separates words  (ctrl+f)" spellcheck="false" disabled={!engine.assets.length} />
        {#if query}
          <button aria-label="clear search" onclick={() => (query = '')} transition:scale={{ duration: 150 }}><X size={14} /></button>
        {/if}
      </label>
      <div class="chips">
        {#each Object.entries(counts) as [type, count], i (type)}
          {@const Icon = TYPES[type]?.icon ?? TYPES.unknown.icon}
          <button class="chip" class:off={hiddenTypes.has(type)} style="--c: var(--type-{type}, var(--type-unknown))" onclick={() => toggleType(type)} in:fly={{ y: 6, delay: 60 * i, duration: 300 }}>
            <Icon size={13} />
            {TYPES[type]?.label ?? type}
            <span>{count.toLocaleString()}</span>
          </button>
        {/each}
      </div>
    </div>
  </Card>

  <Card delay={90}>
    <div class="table">
      <div class="columns">
        <span>name</span><span>type</span><span>status</span><span>details</span>
      </div>

      {#if engine.connection === 'loading'}
        <div class="skeleton">
          {#each Array(14) as _, i}
            <div class="ghost" style="--i: {i}">
              <span style="width: {38 + ((i * 37) % 45)}%"></span><span></span><span></span><span></span>
            </div>
          {/each}
        </div>
      {:else if !engine.assets.length}
        <div class="empty" in:fly={{ y: 10, duration: 350 }}>
          <div class="radar"><Radar size={34} /></div>
          <div class="empty-title">{engine.error || 'no game loaded'}</div>
          <div class="empty-hint">start a supported game, then load it here or from the sidebar</div>
          <button class="button primary" onclick={() => engine.loadGame()}><Gamepad2 size={15} /> load game</button>
        </div>
      {:else if !visible.length}
        <div class="empty" in:fly={{ y: 10, duration: 300 }}>
          <SearchX size={30} />
          <div class="empty-title">nothing matches “{query}”</div>
          <div class="empty-hint">check the spelling, or turn some type filters back on</div>
        </div>
      {:else}
        <div class="viewport" bind:clientHeight={viewport} onscroll={(e) => (scrollTop = e.currentTarget.scrollTop)}>
          <div class="spacer" style="height: {visible.length * ROW}px">
            {#each visible.slice(first, last) as index, i (index)}
              {@const asset = engine.assets[index]}
              {@const status = engine.statusOf(index)}
              {@const Icon = TYPES[asset.type]?.icon ?? TYPES.unknown.icon}
              <div
                class="row"
                class:selected={selected.has(index)}
                class:intro
                style="top: {(first + i) * ROW}px; --c: var(--type-{asset.type}, var(--type-unknown)); --i: {first + i}"
                role="option"
                aria-selected={selected.has(index)}
                tabindex="-1"
                onclick={(e) => pick(e, first + i)}
                onkeydown={(e) => e.key === ' ' && (e.preventDefault(), pick(e, first + i))}
                ondblclick={() => engine.exportAssets([index])}
              >
                <span class="name" title={asset.name}><i></i>{asset.name}</span>
                <span class="type"><Icon size={14} />{asset.type}</span>
                <span class="status-cell">
                  {#key status}
                    <span class="status {status}" in:scale={{ start: 0.7, duration: 220 }}>
                      {#if status === 'processing'}<LoaderCircle size={11} class="spin" />{:else if status === 'exported'}<Check size={11} />{/if}
                      {status.replace('_', ' ')}
                    </span>
                  {/key}
                </span>
                <span class="details">{details(asset)}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </Card>

  <div class="foot">
    {#if engine.assets.length}
      showing {visible.length.toLocaleString()} of {engine.assets.length.toLocaleString()} · click, ctrl or shift to select · double-click or enter exports
    {/if}
  </div>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 14px;
    height: 100%;
    padding: 26px 26px 12px;
  }
  .head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }
  .count {
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }
  .head-actions {
    display: flex;
    gap: 8px;
  }
  .badge {
    min-width: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: var(--accent);
    color: var(--accent-ink);
    font-size: 11px;
    font-weight: 600;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
  }
  .search {
    display: flex;
    flex: 1 1 280px;
    align-items: center;
    gap: 8px;
    height: 32px;
    padding: 0 10px;
    border: 1px solid var(--control-line);
    border-radius: 7px;
    background: var(--control);
    color: var(--muted);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .search:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
  }
  .search input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: 0;
    background: none;
    color: var(--text);
  }
  .search input::placeholder {
    color: var(--faint);
  }
  .search button {
    display: grid;
    place-items: center;
    padding: 2px;
    border: 0;
    border-radius: 4px;
    background: none;
    color: var(--muted);
    cursor: pointer;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 10px;
    border: 1px solid color-mix(in srgb, var(--c) 55%, transparent);
    border-radius: 14px;
    background: color-mix(in srgb, var(--c) 14%, transparent);
    color: var(--c);
    cursor: pointer;
    transition: background 0.2s, opacity 0.2s, transform 0.2s var(--ease), filter 0.2s;
  }
  .chip span {
    color: var(--text);
    font-variant-numeric: tabular-nums;
    opacity: 0.8;
  }
  .chip:hover {
    transform: translateY(-1px);
  }
  .chip:active {
    transform: scale(0.95);
  }
  .chip.off {
    background: none;
    opacity: 0.45;
    filter: grayscale(0.6);
  }

  .page > :global(.card:nth-of-type(2)) {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  .table {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
  }
  .columns,
  .row,
  .ghost {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 110px 120px 230px;
    align-items: center;
    gap: 12px;
    padding: 0 16px;
  }
  .columns {
    height: 34px;
    background: var(--card-head);
    border-bottom: 1px solid var(--line);
    font: 14px var(--font-type);
    letter-spacing: 1px;
  }

  .viewport {
    flex: 1;
    overflow-y: auto;
  }
  .spacer {
    position: relative;
  }
  .row {
    position: absolute;
    left: 0;
    right: 0;
    height: 34px;
    border-bottom: 1px solid var(--line-soft);
    cursor: default;
    transition: background 0.12s;
  }
  .row:hover {
    background: var(--row-hover);
  }
  .row.selected {
    background: var(--row-selected);
  }
  .row.intro {
    animation: row-in 0.4s var(--ease) both;
    animation-delay: calc(min(var(--i), 30) * 18ms);
  }
  @keyframes row-in {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
  }
  .name {
    display: flex;
    align-items: center;
    gap: 10px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .name i {
    flex-shrink: 0;
    width: 3px;
    height: 16px;
    border-radius: 2px;
    background: var(--c);
  }
  .type {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--c);
  }
  .status {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 20px;
    padding: 0 8px;
    border-radius: 10px;
    background: var(--control);
    color: var(--muted);
    font-size: 11.5px;
  }
  .status.exported {
    background: color-mix(in srgb, var(--ok) 18%, transparent);
    color: var(--ok);
  }
  .status.processing {
    background: color-mix(in srgb, var(--accent) 18%, transparent);
    color: var(--accent);
  }
  .status.error {
    background: color-mix(in srgb, var(--danger) 18%, transparent);
    color: var(--danger);
  }
  .status.placeholder,
  .status.not_loaded {
    color: var(--faint);
    font-style: italic;
  }
  .details {
    color: var(--muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ghost {
    height: 34px;
    border-bottom: 1px solid var(--line-soft);
    animation: row-in 0.4s var(--ease) both;
    animation-delay: calc(var(--i) * 40ms);
  }
  .ghost span {
    height: 10px;
    border-radius: 5px;
    background: linear-gradient(90deg, var(--skeleton) 30%, var(--skeleton-shine) 50%, var(--skeleton) 70%);
    background-size: 300% 100%;
    animation: shimmer 1.3s linear infinite;
  }
  .ghost span:nth-child(2) {
    width: 60%;
  }
  .ghost span:nth-child(3) {
    width: 55%;
  }
  .ghost span:nth-child(4) {
    width: 70%;
  }
  @keyframes shimmer {
    from {
      background-position: 100% 0;
    }
    to {
      background-position: -200% 0;
    }
  }

  .empty {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 40px;
    color: var(--muted);
    text-align: center;
  }
  .radar {
    color: var(--accent);
    animation: sweep 2.4s ease-in-out infinite;
  }
  @keyframes sweep {
    50% {
      opacity: 0.45;
      transform: scale(0.92) rotate(-12deg);
    }
  }
  .empty-title {
    color: var(--text);
    font: 16px var(--font-type);
  }
  .empty-hint {
    margin-bottom: 8px;
    font-size: 12px;
  }

  .foot {
    min-height: 16px;
    color: var(--faint);
    font-size: 11.5px;
  }
</style>
