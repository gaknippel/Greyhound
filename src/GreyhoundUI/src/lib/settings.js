// Every setting page, keys and values match what the C++ settings dialogs write
const toggle = (key, label, hint) => ({ kind: 'toggle', key, label, hint });

export const SETTING_PAGES = {
  models: {
    title: 'models',
    subtitle: 'how models are written to disk. changes save instantly',
    cards: [
      {
        title: 'formats',
        rows: [
          {
            kind: 'formats',
            label: 'export as',
            hint: 'pick as many as you like',
            options: [
              ['cast', 'export_castmdl'], ['semodel', 'export_semodel'], ['glb', 'export_glb'], ['gltf', 'export_gltf'], ['obj', 'export_obj'],
              ['ma', 'export_ma'], ['smd', 'export_smd'], ['xmodel_export', 'export_xmexport'], ['xmodel_bin', 'export_xmbin'], ['xna', 'export_xna'],
            ],
          },
        ],
      },
      {
        title: 'textures',
        rows: [
          toggle('exportmodelimg', 'export images with models', 'every texture the model uses, next to it'),
          toggle('mdlmtlfolders', 'material folders', 'one folder per material inside _images'),
          toggle('global_images', 'global images folder', 'every model shares one images folder'),
          toggle('exportimgnames', 'export image names', 'a list of each material’s texture names'),
        ],
      },
      {
        title: 'options',
        rows: [
          toggle('exportalllods', 'all lods', 'every level of detail, not only the best'),
          toggle('exporthitbox', 'hitbox', 'include the model’s hitbox'),
          toggle('exportvtxcolor', 'vertex colors', 'per-vertex color data'),
          toggle('skipprevmodel', 'skip already exported', 'delete a model’s folder to export it again'),
        ],
      },
    ],
  },
  anims: {
    title: 'anims',
    subtitle: 'how animations are written to disk',
    cards: [
      {
        title: 'formats',
        rows: [{ kind: 'formats', label: 'export as', hint: 'pick as many as you like', options: [['seanim', 'export_seanim'], ['cast', 'export_castanim'], ['direct xanim', 'export_directxanim']] }],
      },
      {
        title: 'options',
        rows: [
          { kind: 'choice', key: 'directxanim_ver', label: 'direct xanim version', hint: 'which modtools will read them', options: [['waw', '17'], ['bo1', '19']] },
          toggle('skipprevanim', 'skip already exported', 'delete an anim to export it again'),
        ],
      },
    ],
  },
  images: {
    title: 'images',
    subtitle: 'textures, on their own or with models',
    cards: [
      {
        title: 'format',
        rows: [{ kind: 'choice', key: 'exportimg', label: 'save images as', hint: 'png for blender, tga for older modtools', options: [['png', 'PNG'], ['dds', 'DDS'], ['tga', 'TGA'], ['tiff', 'TIFF']] }],
      },
      {
        title: 'options',
        rows: [
          toggle('patchnormals', 'rebuild normal maps', 'turn baked normal maps back into regular ones'),
          toggle('patchcolor', 'rebuild color maps', 'remove the specular packed into alpha'),
          toggle('skipprevimg', 'skip already exported', 'delete an image to export it again'),
        ],
      },
    ],
  },
  sounds: {
    title: 'sounds',
    subtitle: 'audio from the game’s sound banks',
    cards: [
      { title: 'format', rows: [{ kind: 'choice', key: 'exportsnd', label: 'save sounds as', hint: 'flac is smaller, wav opens anywhere', options: [['wav', 'WAV'], ['flac', 'FLAC']] }] },
      {
        title: 'options',
        rows: [
          toggle('keepsndpath', 'keep folder paths', 'mirror the game’s sound folders'),
          toggle('skipprevsound', 'skip already exported', 'delete a sound to export it again'),
          toggle('skipblankaudio', 'skip blank audio', 'ignore silent entries in sab files'),
          toggle('usesabindexbo4', 'bo4 sab names', 'name black ops 4 sounds by sab name and index'),
        ],
      },
    ],
  },
  settings: {
    title: 'settings',
    subtitle: 'where exports go and what greyhound reads from the game',
    cards: [
      {
        title: 'export',
        rows: [{ kind: 'folder', key: 'export_path', label: 'export folder', hint: 'every game gets its own folder inside this one' }],
      },
      {
        title: 'load from game',
        rows: [
          toggle('showxmodel', 'models', 'applies the next time you load a game'),
          toggle('showxanim', 'anims', 'applies the next time you load a game'),
          toggle('showximage', 'images', 'can be slow on big games'),
          toggle('showxsounds', 'sounds', 'applies the next time you load a game'),
          toggle('showxmtl', 'materials', 'applies the next time you load a game'),
          toggle('showxrawfiles', 'raw files', 'scripts and other loose files'),
        ],
      },
      {
        title: 'list',
        rows: [{ kind: 'choice', key: 'assetsortmethod', label: 'sort assets by', hint: 'applies the next time you load a game', options: [['name', 'Name'], ['details', 'Details'], ['none', 'None']] }],
      },
    ],
  },
};

export const SETTING_KEYS = Object.values(SETTING_PAGES).flatMap((page) =>
  page.cards.flatMap((card) => card.rows.flatMap((row) => (row.kind === 'formats' ? row.options.map(([, key]) => key) : [row.key])))
);
