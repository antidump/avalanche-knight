const fs = require('fs');
const path = require('path');

// List of files to bundle in dependency order
const files = [
  'js/common/math.js',
  'js/common/vector.js',
  'js/renderer/bitmap.js',
  'js/renderer/canvas.js',
  'js/renderer/sprite.js',
  'js/audio/sample.js',
  'js/audio/audioplayer.js',
  'js/core/assets.js',
  'js/core/input.js',
  'js/core/scene.js',
  'js/core/scenemanager.js',
  'js/core/event.js',
  'js/core/program.js',
  'js/game/existingobject.js',  // Base class first
  'js/game/gameobject.js',      // Extends ExistingObject
  'js/game/touchableobject.js', // Extends GameObject
  'js/game/groundlayer.js',
  'js/game/terrain.js',
  'js/game/decoration.js',
  'js/game/specialplatform.js',
  'js/game/propeller.js',
  'js/game/player.js',
  'js/game/camera.js',
  'js/game/assetgen.js',
  'js/game/audiointro.js',
  'js/game/game.js',
  'js/funtico-sdk.js',
  'js/main.js'
];

let bundle = '';

// Read and concatenate all files
files.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    // Remove import/export statements and fix function declarations
    const cleaned = content
      .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
      .replace(/^export\s+const\s+/gm, 'const ')
      .replace(/^export\s+let\s+/gm, 'let ')
      .replace(/^export\s+var\s+/gm, 'var ')
      .replace(/^export\s+class\s+/gm, 'class ')
      .replace(/^export\s+function\s+/gm, 'function ')
      .replace(/^export\s+.*?;?\s*$/gm, '')
      .replace(/^export\s+{.*?}.*?;?\s*$/gm, '')
      .replace(/^export\s+default\s+.*?;?\s*$/gm, '');
    
    bundle += `\n// === ${file} ===\n`;
    bundle += cleaned;
    bundle += '\n';
  }
});

// Write bundle
fs.writeFileSync('build/bundle.js', bundle);
console.log('Bundle created: build/bundle.js');
