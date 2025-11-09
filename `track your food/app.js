// Core app logic for multi-page demo
function goTo(path){ window.location.href = path; }

function saveCart(){ localStorage.setItem('tyf_cart', JSON.stringify(cart || [])); updateCartCount(); }
function loadCart(){ try{ cart = JSON.parse(localStorage.getItem('tyf_cart')) || []; }catch(e){ cart = []; } }
function updateCartCount(){ const cnt = (cart || []).reduce((s,i)=>s+i.qty,0); const el = document.getElementById('cart-count'); if(el) el.textContent = cnt; }

let cart = [];
loadCart();

let currentCategory = 'All';
let currentSort = 'recommended';

function renderRestaurants(list = RESTAURANTS){
  const container = document.getElementById('restaurantGrid');
  if(!container) return;
  container.innerHTML = '';
  list.forEach(r=>{
    const d = document.createElement('div');
    d.className = 'restaurant-card';
    d.innerHTML = `<div class="res-media"><img src="${r.img}" alt="${r.name}"><div class="offer-badge">${r.offers || ''}</div></div>
      <div class="res-body"><div style="display:flex;justify-content:space-between;align-items:center"><h4 class="res-title">${r.name}</h4>
      <div class="res-meta"><span class="rating">${r.rating} ★</span><span class="dot">•</span><span class="eta">${r.eta} min</span><span class="dot">•</span><span class="cost">₹${r.costForTwo}</span></div></div>
      <div class="res-sub">${r.cuisines.join(' • ')}</div></div>`;
    d.addEventListener('click', ()=> openRestaurant(r.id));
    container.appendChild(d);
  });
}

function filterCategory(cat, btn){
  currentCategory = cat;
  document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
  if(btn) btn.classList.add('active');
  let res = RESTAURANTS.slice();
  if(cat !== 'All') res = res.filter(r => r.cuisines.includes(cat) || r.name.toLowerCase().includes(cat.toLowerCase()));
  res = sortRestaurants(res, currentSort);
  renderRestaurants(res);
}

function applySort(val){ currentSort = val; filterCategory(currentCategory); }

function sortRestaurants(arr, key){
  if(key==='time') return arr.sort((a,b)=>a.eta-b.eta);
  if(key==='rating') return arr.sort((a,b)=>b.rating-a.rating);
  if(key==='cost_asc') return arr.sort((a,b)=>a.costForTwo-b.costForTwo);
  if(key==='cost_desc') return arr.sort((a,b)=>b.costForTwo-a.costForTwo);
  return arr;
}

function openRestaurant(id){
  sessionStorage.setItem('tyf_restaurant', id);
  window.location.href = 'order.html';
}

function renderCart(){
  loadCart();
  const list = document.getElementById('cartList');
  if(!list) return;
  list.innerHTML = '';
  if(cart.length===0){
    list.innerHTML = '<div class="small">Your cart is empty. Browse restaurants to add items.</div>';
    document.getElementById('cartTotal').textContent = '0';
    updateCartCount();
    return;
  }
  let total = 0;
  cart.forEach(it=>{
    total += it.price * it.qty;
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `<div><b>${it.name}</b><div class="small">₹${it.price} × ${it.qty}</div></div>
      <div><div style="display:flex;gap:6px"><button class="secondary" onclick="changeQty(${it.id}, -1)">-</button><button class="secondary" onclick="changeQty(${it.id}, +1)">+</button></div></div>`;
    list.appendChild(row);
  });
  document.getElementById('cartTotal').textContent = total;
  updateCartCount();
}

function changeQty(id, delta){
  const idx = cart.findIndex(c=>c.id===id);
  if(idx<0) return;
  cart[idx].qty += delta;
  if(cart[idx].qty<=0) cart.splice(idx,1);
  saveCart();
  renderCart();
}

function clearCart(){
  cart = [];
  saveCart();
  renderCart();
}

function openCheckout(){
  loadCart();
  if(cart.length===0){ alert('Cart is empty. Add items first.'); return; }
  const name = prompt('Enter your name for the order:', localStorage.getItem('tyf_user') || 'Guest');
  if(!name) return;
  const address = prompt('Delivery address:', 'House, Street, City, PIN');
  if(!address) return;
  const orderId = 'TF' + Date.now().toString().slice(-6);
  const order = { id: orderId, name, address, items: cart, total: cart.reduce((s,i)=>s+i.price*i.qty,0), step:0, placedAt: Date.now() };
  const orders = JSON.parse(localStorage.getItem('tyf_orders') || '[]');
  orders.push(order);
  localStorage.setItem('tyf_orders', JSON.stringify(orders));
  cart = [];
  saveCart();
  alert('Order placed! Your tracking ID: ' + orderId);
  window.location.href = 'tracking.html?tid=' + orderId;
}

function doLogin(){
  const name = document.getElementById('nameInput')?.value?.trim();
  const phone = document.getElementById('phoneInput')?.value?.trim();
  if(!name){ alert('Please enter your name.'); return; }
  localStorage.setItem('tyf_user', name);
  localStorage.setItem('tyf_phone', phone || '');
  alert('Welcome, ' + name + '!');
  window.location.href = 'index.html';
}

let currentTrack = null;
function viewTracking(){
  const tid = document.getElementById('tidInput').value.trim();
  if(!tid){ alert('Enter tracking id or use Last Order'); return; }
  loadTrackById(tid);
}
function loadLastOrder(){
  const orders = JSON.parse(localStorage.getItem('tyf_orders') || '[]');
  if(orders.length===0){ alert('No orders found. Place an order first.'); return; }
  const last = orders[orders.length-1];
  loadTrackById(last.id);
}
function loadTrackById(tid){
  const orders = JSON.parse(localStorage.getItem('tyf_orders') || '[]');
  const ord = orders.find(o=>o.id === tid);
  if(!ord){ alert('Tracking ID not found.'); return; }
  currentTrack = ord;
  document.getElementById('trackingPanel').style.display = 'block';
  document.getElementById('showTid').textContent = ord.id;
  updateTrackUI();
}
function updateTrackUI(){
  if(!currentTrack) return;
  const text = ['Placed','Preparing','On the way','Delivered'][currentTrack.step] || '—';
  document.getElementById('statusText').innerHTML = '<b>Status:</b> <span style="color:var(--accent)">' + text + '</span>';
  for(let i=1;i<=4;i++){ const e = document.getElementById('t'+i); if(!e) continue; if(i-1 <= currentTrack.step) e.classList.add('active'); else e.classList.remove('active'); }
}
function simulateNextTrack(){
  if(!currentTrack) return;
  if(currentTrack.step < 3) currentTrack.step += 1;
  const orders = JSON.parse(localStorage.getItem('tyf_orders') || '[]');
  const idx = orders.findIndex(o=>o.id===currentTrack.id);
  if(idx>=0){ orders[idx].step = currentTrack.step; localStorage.setItem('tyf_orders', JSON.stringify(orders)); }
  updateTrackUI();
}
function resetTrack(){ currentTrack = null; document.getElementById('trackingPanel').style.display = 'none'; document.getElementById('tidInput').value = ''; }

function renderRestaurantMenu(){
  const rid = parseInt(sessionStorage.getItem('tyf_restaurant') || '0');
  if(!rid) return;
  const rest = RESTAURANTS.find(r=>r.id===rid);
  if(!rest) return;
  const main = document.querySelector('main.container');
  if(!main) return;
  const header = document.createElement('section');
  header.className = 'card';
  header.innerHTML = `<h3>${rest.name} — ${rest.cuisines.join(', ')} <span class="small">• ${rest.eta} min</span></h3><p class="small">${rest.offers || ''}</p>`;
  main.insertBefore(header, main.firstChild);
  const menuList = document.createElement('div');
  menuList.className = 'menu-list';
  rest.menu.forEach(it=>{
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><b>${it.name}</b><div class="small">₹${it.price}</div></div><div><button class="btn" onclick="addMenuItem(${it.id}, ${it.price}, '${it.name}')">Add</button></div></div>`;
    menuList.appendChild(el);
  });
  main.insertBefore(menuList, main.children[1]);
}

function addMenuItem(id, price, name){
  loadCart();
  const found = cart.find(c=>c.id===id);
  if(found) found.qty += 1; else cart.push({id, name, price, qty:1});
  saveCart();
  updateCartCount();
  alert(name + ' added to cart');
}

document.addEventListener('DOMContentLoaded', ()=>{
  updateCartCount();
  if(window.location.pathname.endsWith('order.html')) renderRestaurantMenu();
  if(window.location.pathname.endsWith('tracking.html')){
    const params = new URLSearchParams(window.location.search);
    const tid = params.get('tid');
    if(tid) loadTrackById(tid);
  }
});
document.addEventListener('DOMContentLoaded', ()=>{
  const y = new Date().getFullYear();
  const el = document.getElementById('year');
  if(el) el.textContent = y;
});
