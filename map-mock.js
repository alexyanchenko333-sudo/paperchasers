/* MAP ABSTRACTION — MOCK implementation
   Interface to be kept 1-1 with real Yandex Maps JS API v3:
   const map = createCdekMap(containerEl, { onPointSelect, onClusterClick });
   map.setPoints(points); // [{id, latitude, longitude, ...}]
   map.setCenter({lat,lng,zoom});
   map.destroy();
   Later: replace createCdekMap internals with ymaps3, keep same API.
*/
window.createCdekMap = function(containerEl, opts){
  opts = opts || {};
  const onPointSelect = opts.onPointSelect || function(){};
  const onClusterClick = opts.onClusterClick || function(){};

  // State
  let points = [];
  let zoom = 11;
  let pan = {x:0, y:0};
  let isDragging = false;
  let dragStart = {x:0,y:0};
  let selectedId = null;

  // DOM
  containerEl.innerHTML = '';
  containerEl.className += ' cdek-map-mock';
  // Controls
  const viewport = document.createElement('div');
  viewport.className = 'cdek-viewport';
  const world = document.createElement('div');
  world.className = 'cdek-world';
  const controls = document.createElement('div');
  controls.className = 'cdek-controls';
  controls.innerHTML = '<button class="cdek-zoom-btn" data-z="+">+</button><button class="cdek-zoom-btn" data-z="-">−</button>';
  const status = document.createElement('div');
  status.className = 'cdek-map-status';
  status.textContent = 'Mock map — drag to move, +/- to zoom';

  viewport.appendChild(world);
  containerEl.appendChild(viewport);
  containerEl.appendChild(controls);
  containerEl.appendChild(status);

  // Styles injected once
  if(!document.getElementById('cdek-map-mock-style')){
    const s = document.createElement('style');
    s.id='cdek-map-mock-style';
    s.textContent = `
      .cdek-map-mock{position:relative; width:100%; height:380px; background:var(--paper); border:1px solid var(--ink); overflow:hidden; touch-action:none;}
      .cdek-viewport{position:absolute; inset:0; overflow:hidden; cursor:grab; background: repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(22,20,15,0.06) 29px), var(--paper);}
      .cdek-viewport:active{cursor:grabbing;}
      .cdek-world{position:absolute; inset:0; will-change:transform;}
      .cdek-marker{position:absolute; width:28px; height:28px; margin:-14px 0 0 -14px; background:var(--paper-white); border:0.9px solid var(--ink); display:flex; align-items:center; justify-content:center; font-family:var(--font-mono); font-size:10px; font-weight:700; color:var(--ink); cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.12); transition:transform .15s, box-shadow .15s;}
      .cdek-marker:hover{transform:scale(1.08); box-shadow:0 4px 12px rgba(0,0,0,0.18);}
      .cdek-marker.sel{background:var(--ink); color:var(--paper-white); border-color:var(--ink);}
      .cdek-cluster{position:absolute; width:34px; height:34px; margin:-17px 0 0 -17px; background:var(--ink); color:var(--paper-white); border:0.9px solid var(--ink); border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:var(--font-mono); font-size:11px; font-weight:700; cursor:pointer; box-shadow:0 2px 10px rgba(0,0,0,0.2);}
      .cdek-controls{position:absolute; right:10px; top:10px; display:flex; flex-direction:column; gap:6px; z-index:5;}
      .cdek-zoom-btn{width:32px; height:32px; background:var(--paper-white); border:0.9px solid var(--ink); font-size:16px; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center;}
      .cdek-map-status{position:absolute; left:8px; bottom:8px; font-family:var(--font-mono); font-size:9px; letter-spacing:0.06em; text-transform:uppercase; color:var(--carbon); background:rgba(245,241,231,0.92); padding:4px 6px; border:0.7px solid rgba(22,20,15,0.12);}
      @media (max-width: 760px){ .cdek-map-mock{height:320px;} }
    `;
    document.head.appendChild(s);
  }

  function project(p){
    // Simple linear projection for mock Russia bounds
    // bounds: lat 52..60, lng 30..83
    const W = viewport.clientWidth || 600;
    const H = viewport.clientHeight || 380;
    const x = ((p.longitude - 30) / (83 - 30)) * W;
    const y = ((60 - p.latitude) / (60 - 52)) * H;
    return {x,y};
  }

  function getScale(){ return Math.pow(1.22, zoom - 11); }

  function applyTransform(){
    const s = getScale();
    world.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${s})`;
  }

  function clusterPoints(list){
    if(zoom >= 13) return list.map(p=> ({type:'point', point:p}));
    const threshold = zoom >= 12 ? 42 : 68;
    const clusters = [];
    const used = new Set();
    for(let i=0;i<list.length;i++){
      if(used.has(i)) continue;
      const group=[list[i]];
      used.add(i);
      const a = project(list[i]);
      for(let j=i+1;j<list.length;j++){
        if(used.has(j)) continue;
        const b = project(list[j]);
        const dx = (a.x - b.x) * getScale();
        const dy = (a.y - b.y) * getScale();
        if(Math.hypot(dx,dy) < threshold){
          group.push(list[j]);
          used.add(j);
        }
      }
      if(group.length===1) clusters.push({type:'point', point:group[0]});
      else {
        // center
        const avg = group.reduce((acc,p)=>{const pr=project(p); return {x:acc.x+pr.x/group.length, y:acc.y+pr.y/group.length}}, {x:0,y:0});
        clusters.push({type:'cluster', points:group, x:avg.x, y:avg.y, count:group.length});
      }
    }
    return clusters;
  }

  function render(){
    world.innerHTML='';
    const clusters = clusterPoints(points);
    clusters.forEach(c=>{
      if(c.type==='point'){
        const pr = project(c.point);
        const el = document.createElement('button');
        el.className = 'cdek-marker' + (selectedId===c.point.id ? ' sel':'');
        el.style.left = pr.x + 'px';
        el.style.top  = pr.y + 'px';
        el.textContent = '●';
        el.title = c.point.city + ' ' + c.point.address;
        el.onclick = (e)=>{ e.stopPropagation(); selectedId=c.point.id; render(); onPointSelect(c.point); };
        world.appendChild(el);
      } else {
        const el = document.createElement('button');
        el.className='cdek-cluster';
        el.style.left=c.x+'px';
        el.style.top=c.y+'px';
        el.textContent = c.count;
        el.title = c.count + ' точек';
        el.onclick = (e)=>{ e.stopPropagation(); zoom = Math.min(15, zoom+2); applyTransform(); render(); onClusterClick(c); };
        world.appendChild(el);
      }
    });
    applyTransform();
  }

  // Controls
  controls.addEventListener('click', (e)=>{
    const btn = e.target.closest('.cdek-zoom-btn');
    if(!btn) return;
    zoom = btn.dataset.z === '+' ? Math.min(15, zoom+1) : Math.max(10, zoom-1);
    render();
  });

  // Drag
  viewport.addEventListener('mousedown', (e)=>{
    isDragging=true; dragStart={x:e.clientX - pan.x, y:e.clientY - pan.y};
  });
  window.addEventListener('mousemove', (e)=>{
    if(!isDragging) return;
    pan = {x: e.clientX - dragStart.x, y: e.clientY - dragStart.y};
    applyTransform();
  });
  window.addEventListener('mouseup', ()=> isDragging=false);
  // Touch
  viewport.addEventListener('touchstart', (e)=>{
    if(e.touches.length!==1) return;
    isDragging=true;
    dragStart={x:e.touches[0].clientX - pan.x, y:e.touches[0].clientY - pan.y};
  }, {passive:false});
  viewport.addEventListener('touchmove', (e)=>{
    if(!isDragging || e.touches.length!==1) return;
    e.preventDefault();
    pan = {x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y};
    applyTransform();
  }, {passive:false});
  viewport.addEventListener('touchend', ()=> isDragging=false);
  // Wheel zoom
  viewport.addEventListener('wheel', (e)=>{
    e.preventDefault();
    zoom = e.deltaY < 0 ? Math.min(15, zoom+1) : Math.max(10, zoom-1);
    render();
  }, {passive:false});

  // Public API
  return {
    setPoints(list){
      points = Array.isArray(list) ? list.slice() : [];
      // reset pan/zoom to fit if needed
      if(points.length){
        // auto center to avg
        const avgLat = points.reduce((s,p)=>s+p.latitude,0)/points.length;
        const avgLng = points.reduce((s,p)=>s+p.longitude,0)/points.length;
        this.setCenter({lat:avgLat, lng:avgLng, zoom: points.length>6 ? 11 : 12});
      }
      render();
    },
    setCenter({lat,lng,zoom:z}){
      if(typeof z==='number') zoom=z;
      // compute pan to bring lat/lng to center of viewport
      const W = viewport.clientWidth || 600;
      const H = viewport.clientHeight || 380;
      const pr = project({latitude:lat, longitude:lng});
      const s = getScale();
      pan = {x: W/2 - pr.x * s, y: H/2 - pr.y * s};
      render();
    },
    setSelectedId(id){ selectedId=id; render(); },
    destroy(){ containerEl.innerHTML=''; }
  };
};
