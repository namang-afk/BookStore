
const gradients = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #fccb90, #d57eeb)',
  'linear-gradient(135deg, #ff9a9e, #fecfef)',
  'linear-gradient(135deg, #a1c4fd, #c2e9fb)',
  'linear-gradient(135deg, #cfd9df, #e2ebf0)',
  'linear-gradient(135deg, #f5af19, #f12711)',
  'linear-gradient(135deg, #667db6, #0082c8)',
  'linear-gradient(135deg, #00c6ff, #0072ff)',
  'linear-gradient(135deg, #fc5c7d, #6a82fb)',
  'linear-gradient(135deg, #11998e, #38ef7d)',
  'linear-gradient(135deg, #c471f5, #fa71cd)',
  'linear-gradient(135deg, #f7971e, #ffd200)',
  'linear-gradient(135deg, #ee9ca7, #ffdde1)',
  'linear-gradient(135deg, #536976, #292E49)',
  'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)',
];

const catIcons = {
  'Fiction': '📖', 'Science Fiction': '🚀', 'Fantasy': '🧙', 'Mystery': '🔍',
  'Romance': '💕', 'Thriller': '🔪', 'Non-Fiction': '📰', 'Biography': '👤',
  'History': '🏛️', 'Science': '🔬', 'Self-Help': '💡', 'Philosophy': '🤔',
  'Horror': '👻', 'Adventure': '🗺️', 'Poetry': '✍️', 'Classics': '📜',
  'Young Adult': '🧑', 'Children': '🧒', 'Comics': '💥', 'Humor': '😂',
  'Psychology': '🧠', 'Business': '💼', 'Technology': '💻', 'Art': '🎨',
  'Travel': '✈️', 'Cooking': '🍳', 'Health': '🏥', 'Education': '🎓',
};

const subjects = [
  { query: 'fiction', category: 'Fiction', limit: 15 },
  { query: 'science_fiction', category: 'Science Fiction', limit: 12 },
  { query: 'fantasy', category: 'Fantasy', limit: 12 },
  { query: 'mystery', category: 'Mystery', limit: 12 },
  { query: 'romance', category: 'Romance', limit: 10 },
  { query: 'thriller', category: 'Thriller', limit: 10 },
  { query: 'biography', category: 'Biography', limit: 8 },
  { query: 'history', category: 'History', limit: 8 },
  { query: 'science', category: 'Science', limit: 8 },
  { query: 'self-help', category: 'Self-Help', limit: 8 },
  { query: 'philosophy', category: 'Philosophy', limit: 6 },
  { query: 'horror', category: 'Horror', limit: 8 },
  { query: 'adventure', category: 'Adventure', limit: 8 },
  { query: 'poetry', category: 'Poetry', limit: 5 },
  { query: 'psychology', category: 'Psychology', limit: 6 },
  { query: 'business', category: 'Business', limit: 6 },
];

const adminCreds = { username: 'admin', password: 'admin123' };

const app = {
  user: null,
  isAdmin: false,
  page: 'home',
  category: null,
  query: '',
  bookId: null,
  loaded: false,
  loading: false,

  get books()  { return JSON.parse(localStorage.getItem('pt_books') || '[]'); },
  set books(v) { localStorage.setItem('pt_books', JSON.stringify(v)); },

  get cart()   { return JSON.parse(localStorage.getItem('pt_cart') || '[]'); },
  set cart(v)  { localStorage.setItem('pt_cart', JSON.stringify(v)); refreshBadge(); },

  get users()  { return JSON.parse(localStorage.getItem('pt_users') || '[]'); },
  set users(v) { localStorage.setItem('pt_users', JSON.stringify(v)); },

  get orders()  { return JSON.parse(localStorage.getItem('pt_orders') || '[]'); },
  set orders(v) { localStorage.setItem('pt_orders', JSON.stringify(v)); },
};


const el  = sel => document.querySelector(sel);
const els = sel => document.querySelectorAll(sel);

const makeId = () => 'id_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

const price = p => '$' + parseFloat(p).toFixed(2);

function stars(rating) {
  let out = '';
  for (let i = 0; i < Math.floor(rating); i++) out += '★';
  if (rating % 1 >= 0.3) out += '☆';
  return out;
}

const grad = i => gradients[(i || 0) % gradients.length];

function coverUrl(id, size = 'M') {
  return id ? `https://covers.openlibrary.org/b/id/${id}-${size}.jpg` : null;
}

function toast(msg, type = 'success') {
  const box = el('#toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  t.innerHTML = `<span>${icons[type] || '•'}</span> ${msg}`;
  box.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toastOut 0.3s var(--ease) forwards';
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

function toggleLoader(show) {
  const overlay = el('#loading-overlay');
  if (overlay) overlay.style.display = show ? 'flex' : 'none';
}


async function loadBooks() {
  const cached = app.books;
  if (cached.length >= 80) {
    app.loaded = true;
    return;
  }

  app.loading = true;
  toggleLoader(true);

  let allBooks = [];
  let gi = 0;

  const jobs = subjects.map(async sub => {
    try {
      const resp = await fetch(`https://openlibrary.org/subjects/${sub.query}.json?limit=${sub.limit}&details=false`);
      if (!resp.ok) throw new Error(resp.status);
      const data = await resp.json();

      return (data.works || []).map(w => ({
        id: w.key ? w.key.replace('/works/', 'ol_') : makeId(),
        title: w.title || 'Untitled',
        author: w.authors?.length ? w.authors.map(a => a.name).join(', ') : 'Unknown Author',
        category: sub.category,
        price: +(5 + Math.random() * 25).toFixed(2),
        rating: +(3.5 + Math.random() * 1.5).toFixed(1),
        pages: Math.floor(150 + Math.random() * 600),
        year: w.first_publish_year || Math.floor(1950 + Math.random() * 74),
        stock: Math.floor(5 + Math.random() * 50),
        description: w.subject
          ? `A ${sub.category.toLowerCase()} book exploring themes of ${(w.subject || []).slice(0, 3).join(', ').toLowerCase() || sub.category.toLowerCase()}. Published in ${w.first_publish_year || 'unknown year'}.`
          : `An acclaimed ${sub.category.toLowerCase()} title by ${w.authors?.[0]?.name || 'a renowned author'}. Explore this captivating work from the world of ${sub.category.toLowerCase()}.`,
        coverId: w.cover_id || null,
        coverKey: w.cover_edition_key || null,
        gradient: gi++,
      }));
    } catch (err) {
      console.warn(`couldn't fetch ${sub.category}:`, err.message);
      return [];
    }
  });

  const results = await Promise.allSettled(jobs);
  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value) allBooks.push(...r.value);
  });

  const seen = new Set();
  const unique = allBooks.filter(b => {
    const k = b.title.toLowerCase().trim();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  if (unique.length > 0) {
    app.books = unique;
    toast(`Loaded ${unique.length} books from Open Library!`, 'info');
  } else {
    toast('Could not load books. Check your internet connection.', 'error');
  }

  app.loaded = true;
  app.loading = false;
  toggleLoader(false);
  handleHash();
}

async function fetchDescription(book) {
  if (book._descDone) return book.description;
  try {
    const key = book.id.replace('ol_', '');
    const resp = await fetch(`https://openlibrary.org/works/${key}.json`);
    if (!resp.ok) return book.description;
    const data = await resp.json();

    let desc = typeof data.description === 'string'
      ? data.description
      : data.description?.value || '';

    if (desc?.length > 10) {
      desc = desc.replace(/\[.*?\]\(.*?\)/g, '').replace(/\r?\n/g, ' ').trim();
      const books = app.books;
      const idx = books.findIndex(b => b.id === book.id);
      if (idx !== -1) {
        books[idx].description = desc;
        books[idx]._descDone = true;
        app.books = books;
      }
      return desc;
    }
  } catch (e) { /* shrug */ }
  return book.description;
}


function navigate(page, params = {}) {
  app.page = page;

  els('.page').forEach(p => p.classList.remove('active'));
  const target = el(`#page-${page}`);
  if (target) target.classList.add('active');

  el('#mobile-nav').classList.remove('open');

  const footer = el('#footer');
  if (footer) footer.style.display = page === 'admin' ? 'none' : 'block';

  switch (page) {
    case 'home':    renderHome(); break;
    case 'browse':  renderBrowse(params.category, params.query); break;
    case 'detail':  renderDetail(params.bookId); break;
    case 'cart':    renderCart(); break;
    case 'checkout': renderCheckout(); break;
    case 'orders':  renderOrders(); break;
    case 'admin':
      if (!app.isAdmin) { openAuth('admin'); navigate('home'); return; }
      renderAdmin();
      break;
    case 'confirmation': break;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleHash() {
  const hash = location.hash.slice(1) || 'home';
  const [page, param] = hash.split('/');
  const decoded = decodeURIComponent(param || '');

  switch (page) {
    case 'home':    navigate('home'); break;
    case 'browse':  navigate('browse', { category: decoded }); break;
    case 'detail':  navigate('detail', { bookId: decoded }); break;
    case 'cart':    navigate('cart'); break;
    case 'checkout': navigate('checkout'); break;
    case 'orders':
      if (!app.user) { openAuth('login'); navigate('home'); return; }
      navigate('orders'); break;
    case 'admin':   navigate('admin'); break;
    default:        navigate('home');
  }
}


function openAuth(tab = 'login') {
  el('#auth-modal').classList.add('open');
  switchTab(tab);
}

function closeAuth() {
  el('#auth-modal').classList.remove('open');
  clearErrors();
}

function switchTab(tab) {
  els('.auth-tab').forEach(t => t.classList.remove('active'));
  els('.auth-form').forEach(f => f.classList.add('hidden'));
  el(`#tab-${tab}`).classList.add('active');
  el(`#${tab}-form`).classList.remove('hidden');
  clearErrors();
}

function clearErrors() {
  el('#login-error').textContent = '';
  el('#register-error').textContent = '';
  el('#admin-error').textContent = '';
}

function handleRegister(e) {
  e.preventDefault();
  const name     = el('#reg-name').value.trim();
  const email    = el('#reg-email').value.trim();
  const password = el('#reg-password').value;
  const confirm  = el('#reg-confirm').value;

  if (password !== confirm) {
    el('#register-error').textContent = 'Passwords do not match';
    return;
  }

  const list = app.users;
  if (list.find(u => u.email === email)) {
    el('#register-error').textContent = 'An account with this email already exists';
    return;
  }

  const user = { id: makeId(), name, email, password, createdAt: new Date().toISOString() };
  list.push(user);
  app.users = list;

  signIn(user);
  closeAuth();
  toast(`Welcome to Bookstore, ${name}!`);
  el('#register-form').reset();
}

function handleLogin(e) {
  e.preventDefault();
  const email    = el('#login-email').value.trim();
  const password = el('#login-password').value;

  const user = app.users.find(u => u.email === email && u.password === password);
  if (!user) {
    el('#login-error').textContent = 'Invalid email or password';
    return;
  }

  signIn(user);
  closeAuth();
  toast(`Welcome back, ${user.name}!`);
  el('#login-form').reset();
}

function handleAdminLogin(e) {
  e.preventDefault();
  const user = el('#admin-username').value.trim();
  const pass = el('#admin-password').value;

  if (user === adminCreds.username && pass === adminCreds.password) {
    app.isAdmin = true;
    app.user = { name: 'Admin', email: 'admin@bookstore.com', isAdmin: true };
    refreshAuthUI();
    closeAuth();
    toast('Admin access granted', 'info');
    navigate('admin');
    el('#admin-form').reset();
  } else {
    el('#admin-error').textContent = 'Invalid admin credentials';
  }
}

function signIn(user) {
  app.user = user;
  app.isAdmin = false;
  localStorage.setItem('pt_session', JSON.stringify(user));
  refreshAuthUI();
}

function signOut() {
  app.user = null;
  app.isAdmin = false;
  localStorage.removeItem('pt_session');
  refreshAuthUI();
  toast('You have been logged out', 'info');
  navigate('home');
}

function restoreSession() {
  const saved = localStorage.getItem('pt_session');
  if (saved) {
    app.user = JSON.parse(saved);
    refreshAuthUI();
  }
}

function refreshAuthUI() {
  const u = app.user;

  el('#nav-login-btn').classList.toggle('hidden', !!u);
  el('#nav-user').classList.toggle('hidden', !u);
  el('#mobile-login-btn').classList.toggle('hidden', !!u);
  el('#mobile-logout-btn').classList.toggle('hidden', !u);
  el('#mobile-orders').classList.toggle('hidden', !u);
  el('#dropdown-admin').classList.toggle('hidden', !app.isAdmin);

  if (u) {
    el('#dropdown-user-info').innerHTML = `<strong>${u.name}</strong>${u.email}`;
  }
}


function addToCart(bookId) {
  if (!app.user) {
    openAuth('login');
    toast('Please sign in to add items to cart', 'info');
    return;
  }

  const cart = app.cart;
  const existing = cart.find(item => item.bookId === bookId);

  if (existing) existing.quantity += 1;
  else cart.push({ bookId, quantity: 1 });

  app.cart = cart;

  const badge = el('#cart-badge');
  badge.classList.remove('bump');
  void badge.offsetWidth; // force reflow lol
  badge.classList.add('bump');

  const book = app.books.find(b => b.id === bookId);
  toast(`"${book.title}" added to cart`);
}

function dropFromCart(bookId) {
  app.cart = app.cart.filter(item => item.bookId !== bookId);
  renderCart();
  toast('Item removed from cart', 'info');
}

function tweakQty(bookId, delta) {
  const cart = app.cart;
  const item = cart.find(i => i.bookId === bookId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) { dropFromCart(bookId); return; }

  app.cart = cart;
  renderCart();
}

function refreshBadge() {
  const total = app.cart.reduce((sum, item) => sum + item.quantity, 0);
  el('#cart-badge').textContent = total;
}

function cartTotal() {
  const books = app.books;
  return app.cart.reduce((sum, item) => {
    const book = books.find(b => b.id === item.bookId);
    return sum + (book ? book.price * item.quantity : 0);
  }, 0);
}


function renderHome() {
  renderFeatured();
  renderCategories();
  renderArrivals();
}

function renderFeatured() {
  const books = app.books;
  if (!books.length) return;
  const top = [...books].sort((a, b) => b.rating - a.rating).slice(0, 8);
  el('#featured-books').innerHTML = top.map(cardHTML).join('');
  wireCardEvents(el('#featured-books'));
}

function renderArrivals() {
  const books = app.books;
  if (!books.length) return;
  const newest = [...books].sort((a, b) => b.year - a.year).slice(0, 8);
  el('#new-arrivals').innerHTML = newest.map(cardHTML).join('');
  wireCardEvents(el('#new-arrivals'));
}

function renderCategories() {
  const cats = {};
  app.books.forEach(b => cats[b.category] = (cats[b.category] || 0) + 1);

  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);

  el('#categories-grid').innerHTML = sorted.map(([name, count]) => `
    <div class="category-card" data-category="${name}">
      <span class="category-icon">${catIcons[name] || '📚'}</span>
      <div class="category-name">${name}</div>
      <div class="category-count">${count} book${count !== 1 ? 's' : ''}</div>
    </div>
  `).join('');

  els('.category-card').forEach(card => {
    card.onclick = () => location.hash = `browse/${card.dataset.category}`;
  });
}

function cardHTML(book) {
  const img = coverUrl(book.coverId, 'M');
  const coverInner = img
    ? `<img src="${img}" alt="${book.title}" class="cover-img"
           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'; this.parentElement.querySelector('.cover-fallback-author') && (this.parentElement.querySelector('.cover-fallback-author').style.display='block');"
           loading="lazy">
       <span class="book-cover-title cover-fallback" style="display:none">${book.title}</span>
       <span class="book-cover-author cover-fallback-author" style="display:none">${book.author}</span>`
    : `<span class="book-cover-title">${book.title}</span>
       <span class="book-cover-author">${book.author}</span>`;

  return `
    <div class="book-card" data-id="${book.id}">
      <div class="book-cover" style="background: ${grad(book.gradient)}">
        ${coverInner}
      </div>
      <div class="book-info">
        <div class="book-title">${book.title}</div>
        <div class="book-author">${book.author}</div>
        <div class="book-meta">
          <span class="book-price">${price(book.price)}</span>
          <span class="book-rating">${stars(book.rating)} ${book.rating}</span>
        </div>
      </div>
      <div class="book-card-actions">
        <button class="btn btn-primary btn-sm add-to-cart-btn" data-id="${book.id}">Add to Cart</button>
      </div>
    </div>
  `;
}

function wireCardEvents(container) {
  container.querySelectorAll('.book-card').forEach(card => {
    card.onclick = e => {
      if (e.target.closest('.add-to-cart-btn')) return;
      location.hash = `detail/${card.dataset.id}`;
    };
  });

  container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.onclick = e => { e.stopPropagation(); addToCart(btn.dataset.id); };
  });
}


function renderBrowse(category, query) {
  app.category = category || null;
  app.query = query || '';
  renderSidebar();
  renderBookGrid();
}

function renderSidebar() {
  const cats = {};
  app.books.forEach(b => cats[b.category] = (cats[b.category] || 0) + 1);
  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);

  const list = el('#category-list');
  list.innerHTML = `<li class="${!app.category ? 'active' : ''}" data-category="">All Books <span>${app.books.length}</span></li>`;
  list.innerHTML += sorted.map(([name, count]) =>
    `<li class="${app.category === name ? 'active' : ''}" data-category="${name}">${name} <span>${count}</span></li>`
  ).join('');

  list.querySelectorAll('li').forEach(li => {
    li.onclick = () => {
      const cat = li.dataset.category;
      app.category = cat || null;
      location.hash = cat ? `browse/${cat}` : 'browse';
      renderSidebar();
      renderBookGrid();
    };
  });
}

function renderBookGrid() {
  let books = [...app.books];
  const q = app.query.toLowerCase();
  const cat = app.category;
  const maxP = parseFloat(el('#price-range').value);
  const sort = el('#sort-select').value;

  if (cat) books = books.filter(b => b.category === cat);

  if (q) {
    books = books.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
  }

  books = books.filter(b => b.price <= maxP);

  switch (sort) {
    case 'title':      books.sort((a, b) => a.title.localeCompare(b.title)); break;
    case 'title-desc': books.sort((a, b) => b.title.localeCompare(a.title)); break;
    case 'price-asc':  books.sort((a, b) => a.price - b.price); break;
    case 'price-desc': books.sort((a, b) => b.price - a.price); break;
    case 'rating':     books.sort((a, b) => b.rating - a.rating); break;
  }

  const heading = el('#browse-title');
  if (q)        heading.textContent = `Search: "${app.query}"`;
  else if (cat) heading.textContent = cat;
  else          heading.textContent = `All Books (${books.length})`;

  const grid = el('#browse-books');
  const nope = el('#no-results');

  if (books.length === 0) {
    grid.innerHTML = '';
    nope.classList.remove('hidden');
  } else {
    nope.classList.add('hidden');
    grid.innerHTML = books.map(cardHTML).join('');
    wireCardEvents(grid);
  }
}


async function renderDetail(bookId) {
  app.bookId = bookId;
  const book = app.books.find(b => b.id === bookId);
  if (!book) { navigate('home'); return; }

  const desc = await fetchDescription(book);

  const img = coverUrl(book.coverId, 'L');
  const coverInner = img
    ? `<img src="${img}" alt="${book.title}" class="cover-img-detail"
           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'; this.parentElement.querySelector('.detail-cover-author-fb') && (this.parentElement.querySelector('.detail-cover-author-fb').style.display='block');">
       <span class="detail-cover-title" style="display:none">${book.title}</span>
       <span class="detail-cover-author detail-cover-author-fb" style="display:none">${book.author}</span>`
    : `<span class="detail-cover-title">${book.title}</span>
       <span class="detail-cover-author">${book.author}</span>`;

  el('#detail-container').innerHTML = `
    <div class="detail-back" id="detail-back-btn">← Back to browsing</div>
    <div class="detail-layout">
      <div class="detail-cover" style="background: ${grad(book.gradient)}">${coverInner}</div>
      <div class="detail-info">
        <span class="detail-category">${book.category}</span>
        <h1 class="detail-title">${book.title}</h1>
        <p class="detail-author">by <span>${book.author}</span></p>
        <div class="detail-rating-row">
          <span class="detail-stars">${stars(book.rating)}</span>
          <span class="detail-rating-num">${book.rating} / 5</span>
        </div>
        <div class="detail-price">${price(book.price)}</div>
        <p class="detail-desc">${desc}</p>
        <div class="detail-meta">
          <div class="detail-meta-item"><span class="label">Pages</span><span class="value">${book.pages}</span></div>
          <div class="detail-meta-item"><span class="label">Published</span><span class="value">${book.year}</span></div>
          <div class="detail-meta-item"><span class="label">In Stock</span><span class="value">${book.stock > 0 ? book.stock : 'Out of stock'}</span></div>
        </div>
        <div class="detail-actions">
          <button class="btn btn-primary btn-lg" id="detail-add-cart" ${book.stock <= 0 ? 'disabled' : ''}>
            ${book.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>
          <a href="#browse" class="btn btn-outline btn-lg">Continue Shopping</a>
        </div>
      </div>
    </div>
  `;

  el('#detail-back-btn').onclick = () => history.back();
  const btn = el('#detail-add-cart');
  if (btn && book.stock > 0) btn.onclick = () => addToCart(book.id);
}


function renderCart() {
  const cart = app.cart;
  const books = app.books;
  const content = el('#cart-content');
  const empty = el('#cart-empty');

  if (!cart.length) {
    content.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  content.classList.remove('hidden');
  empty.classList.add('hidden');

  let html = '';
  cart.forEach(item => {
    const book = books.find(b => b.id === item.bookId);
    if (!book) return;

    const img = coverUrl(book.coverId, 'S');
    const thumb = img
      ? `<img src="${img}" alt="${book.title}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
         <span style="display:none">${book.title}</span>`
      : `<span>${book.title}</span>`;

    html += `
      <div class="cart-item">
        <div class="cart-item-cover" style="background: ${grad(book.gradient)}">${thumb}</div>
        <div class="cart-item-info">
          <div class="cart-item-title">${book.title}</div>
          <div class="cart-item-author">${book.author}</div>
        </div>
        <div class="cart-quantity">
          <button class="qty-minus" data-id="${book.id}">−</button>
          <span>${item.quantity}</span>
          <button class="qty-plus" data-id="${book.id}">+</button>
        </div>
        <div class="cart-item-price">${price(book.price * item.quantity)}</div>
        <button class="cart-remove" data-id="${book.id}" title="Remove">&times;</button>
      </div>
    `;
  });

  const total = cartTotal();
  html += `
    <div class="cart-footer">
      <div class="cart-total">Total: <strong>${price(total)}</strong></div>
      <a href="#checkout" class="btn btn-primary btn-lg">Proceed to Checkout</a>
    </div>
  `;

  content.innerHTML = html;

  content.querySelectorAll('.qty-minus').forEach(b => b.onclick = () => tweakQty(b.dataset.id, -1));
  content.querySelectorAll('.qty-plus').forEach(b => b.onclick = () => tweakQty(b.dataset.id, 1));
  content.querySelectorAll('.cart-remove').forEach(b => b.onclick = () => dropFromCart(b.dataset.id));
}


function renderCheckout() {
  if (!app.user) {
    openAuth('login');
    toast('Please sign in to checkout', 'info');
    navigate('cart');
    return;
  }

  if (!app.cart.length) { navigate('cart'); return; }

  const books = app.books;
  const summary = el('#checkout-summary');

  let html = '<h3>Order Summary</h3>';
  app.cart.forEach(item => {
    const book = books.find(b => b.id === item.bookId);
    if (!book) return;
    html += `
      <div class="checkout-summary-item">
        <span>${book.title} × ${item.quantity}</span>
        <span>${price(book.price * item.quantity)}</span>
      </div>
    `;
  });

  const sub = cartTotal();
  const ship = sub > 35 ? 0 : 4.99;
  const total = sub + ship;

  html += `
    <div class="checkout-summary-item"><span>Subtotal</span><span>${price(sub)}</span></div>
    <div class="checkout-summary-item"><span>Shipping</span><span>${ship === 0 ? 'FREE' : price(ship)}</span></div>
    <div class="checkout-summary-item total"><span>Total</span><span>${price(total)}</span></div>
  `;

  summary.innerHTML = html;
}

function handleCheckout(e) {
  e.preventDefault();

  const cart = app.cart;
  const books = app.books;
  const sub = cartTotal();
  const ship = sub > 35 ? 0 : 4.99;
  const total = sub + ship;

  const order = {
    id: 'ORD-' + Date.now().toString(36).toUpperCase(),
    userId: app.user.id || 'admin',
    userName: app.user.name,
    userEmail: app.user.email,
    items: cart.map(item => {
      const b = books.find(x => x.id === item.bookId);
      return { bookId: item.bookId, title: b?.title || 'Unknown', price: b?.price || 0, quantity: item.quantity };
    }),
    subtotal: sub, shipping: ship, total,
    status: 'pending',
    shippingAddress: {
      firstName: el('#ship-fname').value,
      lastName:  el('#ship-lname').value,
      address:   el('#ship-address').value,
      city:      el('#ship-city').value,
      zip:       el('#ship-zip').value,
      country:   el('#ship-country').value,
    },
    createdAt: new Date().toISOString(),
  };

  const allOrders = app.orders;
  allOrders.push(order);
  app.orders = allOrders;

  const allBooks = app.books;
  cart.forEach(item => {
    const b = allBooks.find(x => x.id === item.bookId);
    if (b) b.stock = Math.max(0, b.stock - item.quantity);
  });
  app.books = allBooks;

  app.cart = [];

  el('#confirmation-msg').textContent = `Order ${order.id} has been placed successfully.`;
  el('#confirmation-details').innerHTML = `
    <p><span>Order ID</span> <strong>${order.id}</strong></p>
    <p><span>Items</span> <strong>${order.items.length} book(s)</strong></p>
    <p><span>Total</span> <strong>${price(order.total)}</strong></p>
    <p><span>Status</span> <strong>Pending</strong></p>
  `;

  navigate('confirmation');
  toast('Order placed successfully!');
  el('#checkout-form').reset();
}


function renderOrders() {
  if (!app.user) { navigate('home'); return; }

  const mine = app.orders.filter(o => o.userEmail === app.user.email).reverse();
  const list = el('#orders-list');
  const empty = el('#orders-empty');

  if (!mine.length) {
    list.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  list.classList.remove('hidden');
  empty.classList.add('hidden');

  list.innerHTML = mine.map(o => `
    <div class="order-card">
      <div class="order-header">
        <span class="order-id">${o.id}</span>
        <span class="order-date">${new Date(o.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        <span class="order-status ${o.status}">${o.status}</span>
      </div>
      <div class="order-items">
        ${o.items.map(i => `<div class="order-item"><span>${i.title} × ${i.quantity}</span><span>${price(i.price * i.quantity)}</span></div>`).join('')}
      </div>
      <div class="order-total"><span>Total</span><span>${price(o.total)}</span></div>
    </div>
  `).join('');
}


function renderAdmin() {
  renderInventory();
  renderAdminOrders();
}

function renderInventory() {
  const books = app.books;
  const tbody = el('#inventory-tbody');

  tbody.innerHTML = books.map(b => {
    const img = coverUrl(b.coverId, 'S');
    const coverCell = img
      ? `<img src="${img}" alt="" style="width:50px;height:65px;object-fit:cover;border-radius:4px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
         <div class="cover-cell" style="background: ${grad(b.gradient)}; display:none">${b.title.substring(0, 15)}</div>`
      : `<div class="cover-cell" style="background: ${grad(b.gradient)}">${b.title.substring(0, 15)}</div>`;

    return `<tr>
      <td>${coverCell}</td>
      <td><strong>${b.title}</strong></td>
      <td>${b.author}</td>
      <td>${b.category}</td>
      <td>${price(b.price)}</td>
      <td>${b.stock}</td>
      <td>
        <div class="admin-actions">
          <button class="btn btn-outline btn-sm edit-book-btn" data-id="${b.id}">Edit</button>
          <button class="btn btn-danger btn-sm delete-book-btn" data-id="${b.id}">Delete</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('.edit-book-btn').forEach(b => b.onclick = () => openBookModal(b.dataset.id));
  tbody.querySelectorAll('.delete-book-btn').forEach(b => b.onclick = () => deleteBook(b.dataset.id));
}

function renderAdminOrders() {
  const orders = app.orders.slice().reverse();
  const tbody = el('#admin-orders-tbody');

  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">No orders yet</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.userName}<br><small style="color:var(--text-muted)">${o.userEmail}</small></td>
      <td>${new Date(o.createdAt).toLocaleDateString()}</td>
      <td>${o.items.length} item(s)</td>
      <td>${price(o.total)}</td>
      <td><span class="order-status ${o.status}">${o.status}</span></td>
      <td>
        <select class="status-select" data-order-id="${o.id}">
          <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Processing</option>
          <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
          <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
          <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.status-select').forEach(sel => {
    sel.onchange = () => updateStatus(sel.dataset.orderId, sel.value);
  });
}

function updateStatus(orderId, status) {
  const orders = app.orders;
  const found = orders.find(o => o.id === orderId);
  if (found) {
    found.status = status;
    app.orders = orders;
    renderAdminOrders();
    toast(`Order ${orderId} → "${status}"`, 'info');
  }
}


function openBookModal(bookId = null) {
  const modal = el('#book-modal');
  modal.classList.add('open');

  if (bookId) {
    const book = app.books.find(b => b.id === bookId);
    if (!book) return;
    el('#book-modal-title').textContent = 'Edit Book';
    el('#book-form-id').value = book.id;
    el('#book-title').value = book.title;
    el('#book-author').value = book.author;
    el('#book-category').value = book.category;
    el('#book-price').value = book.price;
    el('#book-stock').value = book.stock;
    el('#book-pages').value = book.pages;
    el('#book-desc').value = book.description;
    el('#book-year').value = book.year;
    el('#book-rating').value = book.rating;
  } else {
    el('#book-modal-title').textContent = 'Add New Book';
    el('#book-form').reset();
    el('#book-form-id').value = '';
  }
}

function closeBookModal() {
  el('#book-modal').classList.remove('open');
}

function handleBookForm(e) {
  e.preventDefault();

  const id = el('#book-form-id').value;
  const data = {
    title:    el('#book-title').value.trim(),
    author:   el('#book-author').value.trim(),
    category: el('#book-category').value,
    price:    parseFloat(el('#book-price').value),
    stock:    parseInt(el('#book-stock').value),
    pages:    parseInt(el('#book-pages').value) || 300,
    description: el('#book-desc').value.trim(),
    year:     parseInt(el('#book-year').value) || 2024,
    rating:   parseFloat(el('#book-rating').value) || 4.0,
  };

  const books = app.books;

  if (id) {
    const idx = books.findIndex(b => b.id === id);
    if (idx !== -1) {
      books[idx] = { ...books[idx], ...data };
      app.books = books;
      toast(`"${data.title}" updated`);
    }
  } else {
    books.push({ id: makeId(), ...data, coverId: null, gradient: Math.floor(Math.random() * gradients.length) });
    app.books = books;
    toast(`"${data.title}" added to inventory`);
  }

  closeBookModal();
  renderInventory();
}

function deleteBook(bookId) {
  const book = app.books.find(b => b.id === bookId);
  if (!book || !confirm(`Delete "${book.title}"?`)) return;

  app.books = app.books.filter(b => b.id !== bookId);
  renderInventory();
  toast(`"${book.title}" deleted`, 'info');
}


function wireEvents() {
  addEventListener('hashchange', handleHash);

  el('#nav-login-btn').onclick = () => openAuth('login');
  el('#mobile-login-btn').onclick = () => openAuth('login');
  el('#auth-modal-close').onclick = closeAuth;
  el('#auth-modal').onclick = e => { if (e.target === e.currentTarget) closeAuth(); };

  els('.auth-tab').forEach(tab => tab.onclick = () => switchTab(tab.dataset.tab));

  el('#register-form').onsubmit = handleRegister;
  el('#login-form').onsubmit = handleLogin;
  el('#admin-form').onsubmit = handleAdminLogin;

  el('#user-btn').onclick = e => { e.stopPropagation(); el('#user-dropdown').classList.toggle('open'); };
  document.onclick = () => el('#user-dropdown').classList.remove('open');

  el('#dropdown-logout').onclick = signOut;
  el('#mobile-logout-btn').onclick = signOut;

  el('#nav-cart-btn').onclick = () => location.hash = 'cart';

  el('#search-btn').onclick = doSearch;
  el('#search-input').onkeypress = e => { if (e.key === 'Enter') doSearch(); };

  el('#price-range').oninput = e => {
    el('#price-range-label').textContent = `Up to $${e.target.value}`;
    if (app.page === 'browse') renderBookGrid();
  };
  el('#sort-select').onchange = () => { if (app.page === 'browse') renderBookGrid(); };

  el('#checkout-form').onsubmit = handleCheckout;

  el('#hamburger').onclick = () => el('#mobile-nav').classList.toggle('open');

  els('.admin-tab').forEach(tab => {
    tab.onclick = () => {
      els('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      els('.admin-panel').forEach(p => p.classList.add('hidden'));
      el(`#admin-${tab.dataset.tab}`).classList.remove('hidden');
    };
  });

  el('#add-book-btn').onclick = () => openBookModal();
  el('#book-modal-close').onclick = closeBookModal;
  el('#book-modal').onclick = e => { if (e.target === e.currentTarget) closeBookModal(); };
  el('#book-form').onsubmit = handleBookForm;

  els('.footer-links a[data-category]').forEach(link => {
    link.onclick = e => { e.preventDefault(); location.hash = `browse/${link.dataset.category}`; };
  });

  document.onkeydown = e => {
    if (e.key === 'Escape') { closeAuth(); closeBookModal(); }
  };
}

function doSearch() {
  const q = el('#search-input').value.trim();
  if (q) {
    app.query = q;
    location.hash = 'browse';
    navigate('browse', { query: q });
  }
}


async function init() {
  restoreSession();
  wireEvents();
  refreshBadge();

  if (app.books.length >= 80) {
    app.loaded = true;
    handleHash();
  } else {
    handleHash();
    await loadBooks();
  }
}

document.addEventListener('DOMContentLoaded', init);
