(() => {
  const canvas = document.createElement('canvas');
  canvas.className = 'holo-mosaic-background';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const tile = 52, gap = 4;
  let width = 0, height = 0, dpr = 1, raf = 0, time = 0;
  let pointer = { x: -1000, y: -1000, active: false };
  const waves = [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    width = innerWidth; height = innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const cols = Math.ceil(width / tile) + 1;
    const rows = Math.ceil(height / tile) + 1;
    const now = time;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * tile - tile / 2;
        const y = row * tile - tile / 2;
        const cx = x + tile / 2, cy = y + tile / 2;
        const dx = cx - pointer.x, dy = cy - pointer.y;
        const dist = Math.hypot(dx, dy);
        const hover = pointer.active ? Math.max(0, 1 - dist / 190) : 0;
        let wave = 0;
        for (const w of waves) {
          const radius = (now - w.start) * 210;
          wave = Math.max(wave, Math.max(0, 1 - Math.abs(Math.hypot(cx-w.x, cy-w.y)-radius)/32));
        }
        const drift = (Math.sin(now * .55 + col * .31 + row * .17) + 1) / 2;
        const glint = Math.pow(Math.max(0, Math.sin(now * 1.7 + col * 2.17 + row * 1.39)), 18);
        const light = Math.min(1, .08 + drift * .12 + hover * .38 + wave * .5 + glint * .6);
        const turn = (hover + wave) * .035;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.sin(col * 1.7 + row * 2.1) * .025 + turn);
        const g = Math.round(27 + light * 180);
        const gradient = ctx.createLinearGradient(-tile/2, -tile/2, tile/2, tile/2);
        gradient.addColorStop(0, `rgba(${g+10},${g+12},${g+17},${.10 + light*.24})`);
        gradient.addColorStop(.48, `rgba(232,235,241,${.035 + light*.36})`);
        gradient.addColorStop(1, `rgba(119,121,79,${.06 + light*.2})`);
        roundedRect(-tile/2+gap/2, -tile/2+gap/2, tile-gap, tile-gap, 5);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = `rgba(235,238,244,${.08 + light*.34})`;
        ctx.lineWidth = .7;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-tile/2+8, -tile/2+7);
        ctx.lineTo(tile/2-8, -tile/2+7);
        ctx.strokeStyle = `rgba(255,255,255,${.025 + light*.28})`;
        ctx.stroke();
        if (glint > .45 || hover > .82 || wave > .85) {
          ctx.fillStyle = `rgba(255,255,255,${Math.min(.9, glint*.75 + hover*.25 + wave*.4)})`;
          ctx.beginPath();
          ctx.arc((Math.sin(now+col)*.3)*tile, (Math.cos(now+row)*.3)*tile, 1.1 + glint*1.4, 0, Math.PI*2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
    const vignette = ctx.createRadialGradient(width*.5,height*.45,Math.min(width,height)*.12,width*.5,height*.45,Math.max(width,height)*.78);
    vignette.addColorStop(0,'rgba(25,0,0,0)');
    vignette.addColorStop(1,'rgba(25,0,0,.16)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0,0,width,height);
  }

  function animate() {
    time += .016;
    for (let i=waves.length-1;i>=0;i--) if (time-waves[i].start>3.8) waves.splice(i,1);
    draw();
    if (!reduced) raf = requestAnimationFrame(animate);
  }

  addEventListener('resize', resize, { passive:true });
  addEventListener('pointermove', e => { pointer.x=e.clientX; pointer.y=e.clientY; pointer.active=true; }, { passive:true });
  addEventListener('pointerleave', () => { pointer.active=false; }, { passive:true });
  addEventListener('pointerdown', e => { if(e.target.closest('a,button,input,textarea,select,label,[role="button"]')) return; waves.push({x:e.clientX,y:e.clientY,start:time}); if(waves.length>5) waves.shift(); }, { passive:true });
  document.addEventListener('visibilitychange', () => {
    if(document.hidden) cancelAnimationFrame(raf);
    else if(!reduced) { raf=requestAnimationFrame(animate); }
  });
  resize();
  if(!reduced) raf=requestAnimationFrame(animate);
})();