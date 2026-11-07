<script>
  let { checked = false, label, onchange } = $props();
</script>

<button class="toggle" class:on={checked} role="switch" aria-checked={checked} aria-label={label} onclick={() => onchange(!checked)}>
  <span></span>
</button>

<style>
  .toggle {
    position: relative;
    width: 34px;
    height: 18px;
    padding: 0;
    border: 1px solid var(--control-line);
    border-radius: 18px;
    background: var(--control);
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
  }
  span {
    position: absolute;
    top: 1px;
    left: 1px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #d9d9d9;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.4);
    transition: transform 0.25s var(--ease), background 0.2s;
  }
  .on {
    background: var(--accent);
    border-color: var(--accent);
  }
  .on span {
    transform: translateX(16px);
    background: #fff;
  }
  .toggle:active span {
    width: 17px;
  }
  .on:active span {
    transform: translateX(13px);
  }
</style>
