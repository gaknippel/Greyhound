<script>
  import { tick } from 'svelte';
  import { ArrowUpRight, ArrowDownLeft, CircleExclamationPoint } from '@lucide/svelte';
  import Card from '../components/Card.svelte';
  import { engine } from '../lib/engine.svelte.js';

  const ICONS = { out: ArrowUpRight, in: ArrowDownLeft, note: CircleExclamationPoint };
  let list = $state();

  // Follow new lines like a terminal
  $effect(() => {
    engine.log;
    tick().then(() => list && (list.scrollTop = list.scrollHeight));
  });
</script>

<div class="page">
  <header>
    <h1 class="page-title">log</h1>
    <p class="page-subtitle">everything sent to and from the engine. progress ticks are left out</p>
  </header>

  <Card title="engine" delay={60}>
    <div class="list" bind:this={list}>
      {#each engine.log as entry, i (i)}
        {@const Icon = ICONS[entry.kind]}
        <div class="line {entry.kind}">
          <span class="time">{entry.time.toLocaleTimeString()}</span>
          <Icon size={13} />
          <span class="text">{entry.text}</span>
        </div>
      {:else}
        <div class="empty">nothing yet, load a game to see traffic</div>
      {/each}
    </div>
  </Card>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
    padding: 26px 26px 18px;
  }
  .page > :global(.card) {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }
  .list {
    flex: 1;
    padding: 8px 0;
    overflow-y: auto;
    font: 12px/1.5 var(--font-mono);
    user-select: text;
  }
  .line {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 1px 16px;
  }
  .line :global(svg) {
    flex-shrink: 0;
    align-self: center;
  }
  .time {
    color: var(--faint);
  }
  .out :global(svg) {
    color: var(--accent);
  }
  .in :global(svg) {
    color: var(--ok);
  }
  .note {
    color: var(--danger);
  }
  .text {
    overflow-wrap: anywhere;
  }
  .empty {
    padding: 8px 16px;
    color: var(--muted);
    font-family: var(--font-ui);
  }
</style>
