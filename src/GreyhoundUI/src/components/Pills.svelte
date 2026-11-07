<script>
  // options: [[label, value]], isOn(value) decides which are lit, works for single and multi choice
  let { options, isOn, onpick } = $props();
</script>

<div class="pills">
  {#each options as [label, value] (value)}
    <button class:on={isOn(value)} onclick={() => onpick(value)}>{label}</button>
  {/each}
</div>

<style>
  .pills {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
    max-width: 520px;
  }
  button {
    height: 30px;
    padding: 0 12px;
    border: 1px solid var(--control-line);
    border-radius: 7px;
    background: var(--control);
    cursor: pointer;
    transition: background 0.18s, color 0.18s, border-color 0.18s, transform 0.18s var(--ease);
  }
  button:hover {
    border-color: var(--muted);
  }
  button:active {
    transform: scale(0.95);
  }
  .on {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-ink);
  }
</style>
