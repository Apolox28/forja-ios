// Comprueba que cada combinación key:eq de un lote se crea y anima sin errores
const list = process.argv[2].split(',');
require('./nodemodel.js')(() => {
  let bad = 0;
  for (const c of list) {
    const [k, e] = c.split(':');
    try { if (!FORJA3D._test.P[k]) throw new Error('no existe'); const st = FORJA3D.createStage(k, e); for (let f = 0; f <= 8; f++) st.update(f / 8); }
    catch (er) { bad++; console.log('FALLO', c, er.message); }
  }
  console.log('funcionan', list.length - bad, 'de', list.length);
});
