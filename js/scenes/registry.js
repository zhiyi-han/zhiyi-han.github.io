/* ============================================================
   Max's World — scene plug-in registry
   ============================================================
   To add a new zone to the world, create a file in this folder
   (e.g. space.js), then import and list it here. Each scene
   module exports one object:

     export const spaceScene = {
       id:    'space',            // unique key
       angle: 260,                // degrees around the island ring
       color: 0x7a4fd0,           // sign / glow colour
       content: {
         en: { icon:'🛰️', t:'Space Station', sub:'…',
               body:'…', chips:['…'] },
         zh: { icon:'🛰️', t:'太空站', sub:'…',
               body:'…', chips:['…'] },
       },
       build(z, ctx){             // build and return a THREE.Group
         // ctx = { mat }  — shared cached-material helper.
         // Import THREE and helpers directly in your module:
         //   import * as THREE from 'three';
         //   import { rand, makeCanvas, canvasTexture } from '../helpers.js';
         const g = new ctx.THREE.Group();
         // …meshes…
         return g;
       },
     };

   Then register it below:

     import { spaceScene } from './space.js';
     export const EXTRA_SCENES = [spaceScene];

   Everything else is automatic: signpost, stepping-stone path,
   star on the progress bar, panel content in both languages,
   the M-menu entry and the auto tour all pick it up.
   ============================================================ */

export const EXTRA_SCENES = [];
