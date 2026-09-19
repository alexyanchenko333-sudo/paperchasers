/* PaperChasers — shared cart storage helpers.
   Cart persists via localStorage (personal, per-visitor) so it stays
   in sync between the catalog page and every standalone product page. */
const CART_KEY = "pc_cart_v1";

async function cartGet(){
  try{
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  }catch(e){
    console.error('Cart get error:', e);
    return [];
  }
}

async function cartSave(cart){
  try{
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }catch(e){
    console.error('Cart save error:', e);
  }
  return cart;
}

async function cartAdd(product, size){
  const cart = await cartGet();
  const existing = cart.find(i => i.id === product.id && i.size === size);
  if(existing){ existing.qty += 1; }
  else{
    cart.push({ id: product.id, name: product.name, price: product.price, size, qty: 1 });
  }
  await cartSave(cart);
  return cart;
}

async function cartCount(){
  const cart = await cartGet();
  return cart.reduce((s,i)=>s+i.qty, 0);
}
