/* PaperChasers — logic for standalone product-N.html pages.
   Expects PRODUCT_ID to be set inline before this script loads,
   and PRODUCTS / cart helpers to already be loaded. */
(function(){
  const product = PRODUCTS.find(p => p.id === PRODUCT_ID);
  let selectedSize = product ? product.sizes[0] : null;

  function initSizes(){
    const row = document.getElementById('sizeRow');
    if(!product) return;
    product.sizes.forEach(s=>{
      const b = document.createElement('button');
      b.className = 'size-btn' + (s===selectedSize ? ' sel' : '');
      b.textContent = s;
      b.onclick = ()=>{
        selectedSize = s;
        row.querySelectorAll('.size-btn').forEach(x=>x.classList.remove('sel'));
        b.classList.add('sel');
      };
      row.appendChild(b);
    });
  }

  function initAddButton(){
    const btn = document.getElementById('addBtn');
    if(!btn || !product) return;
    btn.onclick = async ()=>{
      await cartAdd(product, selectedSize);
      await refreshCartUI();
      btn.textContent = 'Added ✓';
      btn.classList.add('added');
      setTimeout(()=>{ btn.textContent = 'Add to Cart'; btn.classList.remove('added'); }, 1000);
    };
  }

  /* ---- cart drawer (shared UI, same behaviour as main site) ---- */
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
    const links = document.querySelector('.nav-left');
    if(!toggle || !links) return;
    toggle.onclick = ()=> links.classList.toggle('mobile-open');
  }

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

  document.addEventListener('DOMContentLoaded', async ()=>{
    initSizes();
    initAddButton();
    initDrawer();
    initMobileMenu();
    initCheckout();
    await refreshCartUI();
  });
})();
