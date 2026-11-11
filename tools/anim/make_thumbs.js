// Genera thumbs3d.html (página de render) a partir de combos.json
const fs = require('fs'), path = require('path');
const sp = process.argv[2];
const combos = fs.readFileSync(path.join(sp, 'combos.json'), 'utf8');
const base = 'file:///C:/Users/sinbr/Desktop/2026/4.-%20Manual%20Dise%C3%B1o%20Operaciones%20+%20IA/Claude/Primer%20Proyecto/Forja-iOS/Resources/';
const html = `<!doctype html><html><head><meta charset="utf-8"><title>t3d</title></head><body>
<script src="${base}three.min.js"></script>
<script src="${base}GLTFLoader.js"></script>
<script src="${base}SkeletonUtils.js"></script>
<script src="${base}forja3d.js"></script>
<pre id="out"></pre>
<script>
var combos=${combos}, out=[], N=160;
new THREE.GLTFLoader().load("${base}body.glb",function(gl){FORJA3D.setModel(gl.scene);
var off=document.createElement('canvas');off.width=off.height=N;
var r=FORJA3D.makeRenderer(off);r.setPixelRatio(1);r.setSize(N,N,false);
combos.forEach(function(it){var p=it.split(':');
  try{var st=FORJA3D.createStage(p[0],p[1]);st.camera.aspect=1;st.camera.updateProjectionMatrix();
  var dd=FORJA3D._test.P[p[0]]||{};st.update(dd.keys?(dd.thumb||0.5):(dd.cyclic?0.3:0.42));r.render(st.scene,st.camera);
  var c=document.createElement('canvas');c.width=c.height=N;var x=c.getContext('2d');
  var g=x.createRadialGradient(N/2,N*0.25,0,N/2,N*0.4,N*0.75);g.addColorStop(0,'#30333c');g.addColorStop(0.55,'#1b1d23');g.addColorStop(1,'#121317');
  x.fillStyle=g;x.fillRect(0,0,N,N);x.drawImage(off,0,0);
  out.push('thumb_'+p[0]+'_'+p[1]+'|'+c.toDataURL('image/jpeg',0.86));
  st.scene.traverse(function(o){if(o.geometry)o.geometry.dispose();});
  }catch(e){out.push('FALLO '+it+' '+e.message);}
});
document.getElementById('out').textContent=out.join('\\n');document.title='listo';
},undefined,function(e){document.getElementById('out').textContent='GLB '+e;});
</script></body></html>`;
fs.writeFileSync(path.join(sp, 'thumbs3d.html'), html);
console.log('ok');
