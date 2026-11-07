<script>
  import { fade } from 'svelte/transition';
  import TitleBar from './components/TitleBar.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import Toast from './components/Toast.svelte';
  import AssetsPage from './pages/AssetsPage.svelte';
  import SettingsPage from './pages/SettingsPage.svelte';
  import LogPage from './pages/LogPage.svelte';
  import { engine } from './lib/engine.svelte.js';
  import { SETTING_PAGES, SETTING_KEYS } from './lib/settings.js';
  import './lib/theme.svelte.js';

  let page = $state('assets');

  engine.loadSettings(SETTING_KEYS);
  engine.loadExportRoot();
</script>

<div class="shell">
  <TitleBar />
  <div class="body">
    <Sidebar bind:page />
    <main>
      {#key page}
        <div class="view" in:fade={{ duration: 180 }}>
          {#if page === 'assets'}
            <AssetsPage />
          {:else if page === 'log'}
            <LogPage />
          {:else}
            <SettingsPage page={SETTING_PAGES[page]} />
          {/if}
        </div>
      {/key}
    </main>
  </div>
  <Toast />
</div>

<style>
  .shell {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .body {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  main {
    flex: 1;
    min-width: 0;
    position: relative;
  }
  .view {
    position: absolute;
    inset: 0;
  }
</style>
