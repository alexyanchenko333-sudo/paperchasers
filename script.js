/* PaperChasers — main site script (index.html) */
(function(){

  /* ---------------- CATALOG ---------------- */
  const selectedSize = {};

  function svgArt(hue, seed){
    return `<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="72" height="72" fill="${hue}" opacity="0.5" transform="rotate(${(seed%2?-4:4)} 40 40)"/>
      <rect x="14" y="14" width="52" height="52" fill="none" stroke="#16140F" stroke-width="2" stroke-dasharray="4 3"/>
    </svg>`;
  }

  let activeCat = 'All';

  function initFilters(){
    const cats = ['All', ...new Set(PRODUCTS.map(p=>p.cat))];
    const filtersEl = document.getElementById('filters');
    cats.forEach(c=>{
      const b = document.createElement('button');
      b.className = 'filter-btn' + (c==='All' ? ' active' : '');
      b.textContent = c;
      b.onclick = ()=>{
        activeCat = c;
        document.querySelectorAll('.filter-btn').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        renderGrid();
      };
      filtersEl.appendChild(b);
    });

    const toggle = document.getElementById('filterToggle');
    toggle.onclick = ()=>{
      const open = filtersEl.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
  }

  function renderGrid(){
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    const list = PRODUCTS.filter(p => activeCat==='All' || p.cat===activeCat).slice(0, 2);
    list.forEach(p=>{
      if(!selectedSize[p.id]) selectedSize[p.id] = p.sizes[0];
      const card = document.createElement('div');
      card.className = 'card';
      const artInner = p.img
        ? `<img src="${p.img}" alt="${p.name}" loading="lazy">`
        : svgArt(p.hue, p.id);
      card.innerHTML = `
        ${p.badge ? `<div class="badge">${p.badge}</div>` : ''}
        <a class="card-link-name" href="product-${p.id}.html">
          <div class="art" style="${p.img ? '' : `background:${p.hue}22`}">${artInner}</div>
        </a>
        <div class="body">
          <a class="card-link-name" href="product-${p.id}.html"><h3>${p.name}</h3></a>
          <div class="price">${p.price.toLocaleString('ru-RU')} ₽</div>
          <div class="sizes" data-id="${p.id}"></div>
          <button class="add-btn" data-id="${p.id}">Add to Cart</button>
          <div class="card-barcode"></div>
        </div>
      `;
      grid.appendChild(card);

      const sizesEl = card.querySelector('.sizes');
      p.sizes.forEach(s=>{
        const sb = document.createElement('button');
        sb.className = 'size-btn' + (selectedSize[p.id]===s ? ' sel' : '');
        sb.textContent = s;
        sb.onclick = ()=>{
          selectedSize[p.id] = s;
          sizesEl.querySelectorAll('.size-btn').forEach(x=>x.classList.remove('sel'));
          sb.classList.add('sel');
        };
        sizesEl.appendChild(sb);
      });

      card.querySelector('.add-btn').onclick = async (e)=>{
        await cartAdd(p, selectedSize[p.id]);
        await refreshCartUI();
        const btn = e.currentTarget;
        btn.textContent = 'Added ✓';
        btn.classList.add('added');
        setTimeout(()=>{ btn.textContent='Add to Cart'; btn.classList.remove('added'); }, 900);
      };
    });
  }

  /* ---------------- LOOKBOOK (editorial marquee, right → left) ---------------- */
  // big-small-big-small fallback (only portrait cards, all shots are 3:4)
  const sizeClasses = ['size-lg','size-md'];
  function renderLookbook(){
    const track = document.getElementById('marqueeTrack');
    const buildSet = ()=> LOOKBOOK_IMAGES.map((item, i) => `
        <div class="frame-card ${item.size || sizeClasses[i % sizeClasses.length]}">
          <img src="${item.src}" alt="${item.alt}" loading="lazy">
        </div>
      `).join('');
    // duplicated so the track can loop seamlessly at -50%
    track.innerHTML = buildSet() + buildSet();
  }

  /* ---------------- CART DRAWER ---------------- */
  async function refreshCartUI(){
    const cart = await cartGet();

    const countEl = document.getElementById('cartCount');
    if(countEl) countEl.textContent = cart.reduce((s,i)=>s+i.qty,0);
    const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
    const totalEl = document.getElementById('cartTotal');
    if(totalEl) totalEl.textContent = total.toLocaleString('ru-RU') + ' ₽';

    const itemsEl = document.getElementById('drawerItems');
    if(!itemsEl) return;

    if(cart.length===0){
      itemsEl.innerHTML = `<div class="empty-cart">Nothing filed yet.<br>Add something from the catalog.</div>`;
      return;
    }

    itemsEl.innerHTML = '';

    cart.forEach(item=>{
      const row = document.createElement('div');
      row.className = 'line-item';
      row.innerHTML = `
        <div>
          <div class="nm">${item.name}</div>
          <div class="meta">SIZE ${item.size}</div>
          <div class="qty-row">
            <button aria-label="Decrease quantity">−</button>
            <span>${item.qty}</span>
            <button aria-label="Increase quantity">+</button>
            <button class="rm">Remove</button>
          </div>
        </div>
        <div>${(item.price*item.qty).toLocaleString('ru-RU')} ₽</div>
      `;
      const [minus, plus, rm] = row.querySelectorAll('button');
      minus.onclick = async ()=>{ await changeQty(item.id, item.size, -1); };
      plus.onclick = async ()=>{ await changeQty(item.id, item.size, 1); };
      rm.onclick = async ()=>{ await removeItem(item.id, item.size); };
      itemsEl.appendChild(row);
    });
  }

  async function changeQty(id, size, delta){
    let cart = await cartGet();
    const item = cart.find(i=>i.id===id && i.size===size);
    if(!item) return;
    item.qty += delta;
    if(item.qty <= 0) cart = cart.filter(i=>!(i.id===id && i.size===size));
    await cartSave(cart);
    await refreshCartUI();
  }

  async function removeItem(id, size){
    let cart = await cartGet();
    cart = cart.filter(i=>!(i.id===id && i.size===size));
    await cartSave(cart);
    await refreshCartUI();
  }

  function initDrawer(){
    const overlay = document.getElementById('overlay');
    const drawer = document.getElementById('drawer');
    async function openDrawer(){
      overlay.classList.add('show'); drawer.classList.add('open');
      document.getElementById('receiptDate').textContent = 'FILED ' + new Date().toLocaleDateString(undefined,{year:'numeric',month:'short',day:'2-digit'});
      await refreshCartUI();
    }
    function closeDrawer(){ overlay.classList.remove('show'); drawer.classList.remove('open'); }
    document.getElementById('openCartBtn').onclick = openDrawer;
    document.getElementById('closeDrawer').onclick = closeDrawer;
    overlay.onclick = ()=>{ closeDrawer(); closeModal(); };
  }

  function initMobileMenu(){
    const toggle = document.getElementById('menuToggle');
    const links = document.getElementById('navLinks');
    if(!toggle || !links) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.onclick = ()=>{
      const open = links.classList.toggle('mobile-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? '✕' : '☰';
    };
    links.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=>{
      links.classList.remove('mobile-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = '☰';
    }));
  }

  /* ---------------- CHECKOUT ---------------- */
  const modal = document.getElementById('checkoutModal');
  const modalCard = document.getElementById('checkoutCard');

  async function checkoutForm(){
    const cart = await cartGet();
    const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
    modalCard.innerHTML = `
      <button class="modal-close" id="closeModal" aria-label="Close">✕</button>
      <h3>Checkout</h3>
      <div class="modal-note">Demo store — this form doesn't process a real payment or place a real order. Swap in a payment provider before going live.</div>
      <form id="checkoutFormEl">
        <div class="field"><label>Full Name</label><input required name="name"></div>
        <div class="field"><label>Email</label><input required type="email" name="email"></div>
        <div class="field"><label>Address</label><input required name="address"></div>
        <div class="field-row">
          <div class="field"><label>City</label><input required name="city"></div>
          <div class="field"><label>ZIP</label><input required name="zip"></div>
        </div>
        <label class="consent-row">
          <input type="checkbox" id="consentBox" required>
          <span>I agree to the <a href="privacy-policy.html" target="_blank" rel="noopener">Privacy Policy</a> and the processing of my details above to fulfil this order.</span>
        </label>
        <div class="total-row"><span>Total Due</span><span>${total.toLocaleString('ru-RU')} ₽</span></div>
        <button class="place-btn" type="submit">Place Order</button>
      </form>
    `;
    document.getElementById('closeModal').onclick = closeModal;
    document.getElementById('checkoutFormEl').onsubmit = (e)=>{
      e.preventDefault();
      const orderNo = 'PC-' + Math.floor(100000 + Math.random()*899999);
      showConfirmation(orderNo);
    };
  }

  async function showConfirmation(orderNo){
    modalCard.innerHTML = `
      <button class="modal-close" id="closeModal" aria-label="Close">✕</button>
      <div class="confirm">
        <div class="stamp">FILED</div>
        <h3>Order Received</h3>
        <div class="ordno">ORDER № ${orderNo}</div>
        <p>This is a demo confirmation — no payment was charged and no real order was placed. Connect a payment processor and order backend to take this live.</p>
      </div>
    `;
    document.getElementById('closeModal').onclick = closeModal;
    await cartSave([]);
    await refreshCartUI();
  }

  function closeModal(){ modal.classList.remove('show'); }

  function initCheckout(){
    document.getElementById('checkoutBtn').onclick = async ()=>{
      const cart = await cartGet();
      if(cart.length===0) return;
      window.location.href = 'checkout.html';
    };
  }

  /* ---------------- BOOT ---------------- */
  document.addEventListener('DOMContentLoaded', async ()=>{
    initFilters();
    renderGrid();
    renderLookbook();
    initDrawer();
    initMobileMenu();
    initCheckout();
    await refreshCartUI();

    // Scroll reveal. Desktop keeps the original set (sections, cards,
    // lookbook frames); on narrow screens only product cards animate —
    // animating whole sections and the marquee janks on mobile and fights
    // the marquee keyframes. Revealed nodes are unobserved and their
    // inline styles cleared so :hover lifts keep working.
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const narrow = window.matchMedia('(max-width: 720px)').matches;
    const revealables = document.querySelectorAll(narrow ? '.card' : 'section, .card, .frame-card');
    if(!revealables.length || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          const el = entry.target;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          // Hand control back to CSS so :hover keeps working.
          setTimeout(()=>{ el.style.opacity=''; el.style.transform=''; el.style.transition=''; }, 650);
          observer.unobserve(el);
        }
      });
    }, {threshold: narrow ? 0.05 : 0.1, rootMargin:'0px 0px -40px 0px'});
    revealables.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  });
})();
