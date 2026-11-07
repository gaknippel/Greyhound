<script>
  let { title = '', children, actions, delay = 0 } = $props();
</script>

<section class="card" style="--delay: {delay}ms">
  {#if title}
    <header>
      <span>{title}</span>
      {#if actions}<div class="actions">{@render actions()}</div>{/if}
    </header>
  {/if}
  {@render children()}
</section>

<style>
  .card {
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    overflow: hidden;
    animation: rise 0.45s var(--ease) both;
    animation-delay: var(--delay);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 34px;
    padding: 0 16px;
    background: var(--card-head);
    border-bottom: 1px solid var(--line);
    font: 15px var(--font-type);
    letter-spacing: 1px;
  }
  .actions {
    display: flex;
    gap: 6px;
    font: 12px var(--font-ui);
    letter-spacing: 0;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
  }
</style>
