import { Box, Film, Image, AudioLines, Palette, FileText, Sparkles, CircleQuestionMark } from '@lucide/svelte';

// Color comes from the matching --type-* css variable
export const TYPES = {
  model: { label: 'models', icon: Box },
  anim: { label: 'anims', icon: Film },
  image: { label: 'images', icon: Image },
  sound: { label: 'sounds', icon: AudioLines },
  material: { label: 'materials', icon: Palette },
  rawfile: { label: 'raw files', icon: FileText },
  effect: { label: 'effects', icon: Sparkles },
  unknown: { label: 'other', icon: CircleQuestionMark },
};

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function details(asset) {
  switch (asset.type) {
    case 'model':
      return [plural(asset.bones, 'bone'), asset.cosmetic_bones ? plural(asset.cosmetic_bones, 'cosmetic') : '', plural(asset.lods, 'lod')].filter(Boolean).join(' · ');
    case 'anim':
      return `${plural(asset.frames, 'frame')} · ${Math.round(asset.framerate)} fps · ${plural(asset.bones, 'bone')}`;
    case 'image':
      return asset.width > 0 ? `${asset.width} × ${asset.height}` : 'n/a';
    case 'sound': {
      if (!asset.length_ms) return 'n/a';
      const seconds = Math.round(asset.length_ms / 1000);
      return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    }
    case 'material':
      return plural(asset.images, 'image');
    case 'rawfile':
      return asset.size < 1024 ? `${asset.size} b` : `${(asset.size / 1024).toFixed(1)} kb`;
    default:
      return '';
  }
}
