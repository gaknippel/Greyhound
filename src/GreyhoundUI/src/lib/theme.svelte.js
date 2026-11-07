// light | dark | system, remembered per machine
const media = window.matchMedia('(prefers-color-scheme: light)');

function stored() {
  try {
    return localStorage.getItem('theme') ?? 'dark';
  } catch {
    return 'dark';
  }
}

class Theme {
  choice = $state(stored());

  constructor() {
    $effect.root(() => {
      $effect(() => this.#apply());
    });
    media.addEventListener('change', () => this.#apply());
  }

  set(choice) {
    this.choice = choice;
    try {
      localStorage.setItem('theme', choice);
    } catch {}
  }

  #apply() {
    const light = this.choice === 'light' || (this.choice === 'system' && media.matches);
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
  }
}

export const theme = new Theme();
