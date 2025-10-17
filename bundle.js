// Simple bundler to combine all JS files without export/import
const fs = require('fs');
const path = require('path');

// List of files in dependency order
const files = [
    'js/common/math.js',
    'js/common/vector.js',
    'js/core/event.js',
    'js/core/scene.js',
    'js/core/assets.js',
    'js/core/input.js',
    'js/core/program.js', 
    'js/core/scenemanager.js',
    'js/renderer/bitmap.js',
    'js/renderer/canvas.js',
    'js/renderer/sprite.js',
    'js/audio/sample.js',
    'js/audio/audioplayer.js',
    'js/game/existingobject.js',
    'js/game/gameobject.js',
    'js/game/player.js',
    'js/game/terrain.js',
    'js/game/camera.js',
    'js/game/touchableobject.js',
    'js/game/groundlayer.js',
    'js/game/decoration.js',
    'js/game/specialplatform.js',
    'js/game/propeller.js',
    'js/game/assetgen.js',
    'js/game/audiointro.js',
    'js/game/game.js',
    'js/funtico-sdk.js',
    'js/main.js'
];

let bundled = '';

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    // Remove ALL export and import statements
    const processed = content
        .replace(/export\s+const\s+/g, 'const ')
        .replace(/export\s+class\s+/g, 'class ')
        .replace(/export\s+function\s+/g, 'function ')
        .replace(/export\s+{\s*([^}]+)\s*};?/g, (match, exports) => {
            // Convert named exports to global variables
            return exports.split(',').map(exp => {
                const name = exp.trim();
                return `window.${name} = ${name};`;
            }).join('\n');
        })
        .replace(/export\s*{\s*};?/g, '') // Remove empty exports
        .replace(/export\s*;/g, '') // Remove standalone export semicolons
        .replace(/import\s+.*?from\s+['"][^'"]*['"];?/g, '') // Remove all import statements
        .replace(/import\s+['"][^'"]*['"];?/g, ''); // Remove import statements without from
    
    bundled += processed + '\n\n';
});

fs.writeFileSync('build-single/game-bundled.js', bundled);
console.log('Bundle created successfully!');
