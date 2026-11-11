// Carga three + GLTFLoader + SkeletonUtils + forja3d y el modelo en Node
const path = require('path'), fs = require('fs');
const R = 'C:/Users/sinbr/Desktop/2026/4.- Manual Diseño Operaciones + IA/Claude/Primer Proyecto/Forja-iOS/Resources/';
global.THREE = require(R + 'three.min.js'); globalThis.window = globalThis; global.self = globalThis; global.requestAnimationFrame = () => {};
const vm = require('vm');
function inc(f) { vm.runInThisContext(fs.readFileSync(R + f, 'utf8'), { filename: f }); }
inc('GLTFLoader.js'); inc('SkeletonUtils.js'); inc('forja3d.js');
module.exports = function (done) {
  const buf = fs.readFileSync(R + 'body.glb');
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  new THREE.GLTFLoader().parse(ab, '', g => { FORJA3D.setModel(g.scene); done(g.scene); }, e => { console.error('ERR', e); });
};
if (require.main === module) module.exports(scene => {
  scene.updateMatrixWorld(true);
  scene.traverse(o => { if (o.isBone && !/Hand[A-Z]|Toe_End|HeadTop/.test(o.name)) { const p = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld); console.log(o.name.replace('mixamorig', ''), p.x.toFixed(1), p.y.toFixed(1), p.z.toFixed(1)); } });
  scene.traverse(o => { if (o.isSkinnedMesh) { o.geometry.computeBoundingBox(); console.log('mesh', o.name, o.geometry.attributes.position.count, JSON.stringify(o.geometry.boundingBox)); } });
});
