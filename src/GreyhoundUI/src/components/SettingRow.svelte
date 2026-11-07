<script>
  let { label, hint = '', children } = $props();
</script>

<div class="row">
  <div class="text">
    <div class="label">{label}</div>
    {#if hint}<div class="hint">{hint}</div>{/if}
  </div>
  <div class="control">{@render children()}</div>
</div>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 24px;
    min-height: 60px;
    margin: 0 16px;
    padding: 10px 0;
  }
  .row:not(:last-child) {
    border-bottom: 1px solid var(--line-soft);
  }
  .text {
    flex: 1;
    min-width: 0;
  }
  .label {
    font-size: 13.5px;
  }
  .hint {
    margin-top: 2px;
    color: var(--muted);
    font-size: 11.5px;
  }
  .control {
    display: flex;
    flex-shrink: 0;
  }
</style>
