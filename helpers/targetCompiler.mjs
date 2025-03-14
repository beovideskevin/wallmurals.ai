import { OfflineCompiler } from 'mind-ar/src/image-target/offline-compiler.js';

import { writeFile } from 'fs/promises'
import { loadImage } from 'canvas';

//canvas.loadImage treats path as relative from where nodejs was executed, not relative to the script's location
// const imagePaths = ['./card.png'];

export async function run(imagePaths, destination) {
    //load all images
    const images = await Promise.all(imagePaths.map(value => loadImage(value)));
    const compiler = new OfflineCompiler();
    await compiler.compileImageTargets(images, console.log);
    const buffer = compiler.exportData();
    await writeFile(destination, buffer); // 'targets.mind'
}
