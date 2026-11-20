const BASE = 'http://localhost:5000';

async function fetchJSON(url: string, opts: any = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

async function run() {
  const results = [];

  // ── AUTH ────────────────────────────────────────
  console.log('\n═══ AUTH ═══');

  // Register farmer
  let r = await fetchJSON(`${BASE}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama: 'PetaniAja', email: 'petani@test.com', password: 'rahasia123', role: 'petani' })
  });
  results.push({ endpoint: '/api/auth/register', method: 'POST', expected: 201, actual: r.status, pass: r.status === 201 });
  console.log(`POST /api/auth/register → ${r.status}`);

  // Login farmer
  r = await fetchJSON(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'petani@test.com', password: 'rahasia123' })
  });
  results.push({ endpoint: '/api/auth/login', method: 'POST', expected: 200, actual: r.status, pass: r.status === 200 && !!r.body.token });
  const farmerToken = r.body.token;
  const farmerId = r.body.user.id;console.log(`POST /api/auth/login → ${r.status} token=${!!farmerToken}`);

  // Wrong password (valid format 6+ chars) — should get 401
  r = await fetchJSON(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'petani@test.com', password: 'salahxyz' })
  });
  results.push({ endpoint: '/api/auth/login (wrong pw)', method: 'POST', expected: 401, actual: r.status, pass: r.status === 401 });
  console.log(`POST /api/auth/login (wrong pw) → ${r.status}`);

  // Missing fields
  r = await fetchJSON(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  results.push({ endpoint: '/api/auth/login (empty)', method: 'POST', expected: 400, actual: r.status, pass: r.status === 400 });
  console.log(`POST /api/auth/login (empty) → ${r.status}`);

  // Duplicate email
  r = await fetchJSON(`${BASE}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama: 'Dup', email: 'petani@test.com', password: 'xpass123', role: 'petani' })
  });
  results.push({ endpoint: '/api/auth/register (dup)', method: 'POST', expected: 400, actual: r.status, pass: r.status === 400 });
  console.log(`POST /api/auth/register (dup) → ${r.status}`);

  // Register buyer
  r = await fetchJSON(`${BASE}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama: 'PembeliAja', email: 'pembeli@test.com', password: 'rahasia123', role: 'pembeli' })
  });
  results.push({ endpoint: '/api/auth/register (buyer)', method: 'POST', expected: 201, actual: r.status, pass: r.status === 201 });
  const buyerLogin = await fetchJSON(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pembeli@test.com', password: 'rahasia123' })
  });
  const buyerToken = buyerLogin.body.token;
  console.log(`POST /api/auth/register (buyer) → ${r.status}, login → ${buyerLogin.status}`);

  // Bad token
  r = await fetchJSON(`${BASE}/api/users/profile`, {
    headers: { Authorization: 'Bearer invalidtoken123' }
  });
  results.push({ endpoint: '/api/users/profile (bad token)', method: 'GET', expected: 401, actual: r.status, pass: r.status === 401 });
  console.log(`GET /api/users/profile (bad token) → ${r.status}`);

  // No token
  r = await fetchJSON(`${BASE}/api/users/profile`);
  results.push({ endpoint: '/api/users/profile (no token)', method: 'GET', expected: 401, actual: r.status, pass: r.status === 401 });
  console.log(`GET /api/users/profile (no token) → ${r.status}`);

  // ── USER PROFILE ────────────────────────────────
  console.log('\n═══ USER PROFILE ═══');

  r = await fetchJSON(`${BASE}/api/users/profile`, {
    headers: { Authorization: `Bearer ${farmerToken}` }
  });
  results.push({ endpoint: '/api/users/profile', method: 'GET', expected: 200, actual: r.status, pass: r.status === 200 });
  console.log(`GET /api/users/profile → ${r.status} profile_image=${r.body?.user?.profile_image ? 'yes' : 'null'}`);

  r = await fetchJSON(`${BASE}/api/users/profile`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${farmerToken}` },
    body: JSON.stringify({ nama: 'PetaniUpdated' })
  });
  results.push({ endpoint: '/api/users/profile (update name)', method: 'PUT', expected: 200, actual: r.status, pass: r.status === 200 && r.body?.user?.nama === 'PetaniUpdated' });
  console.log(`PUT /api/users/profile → ${r.status} name=${r.body?.user?.nama}`);

  r = await fetchJSON(`${BASE}/api/users/profile`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${farmerToken}` },
    body: JSON.stringify({})
  });
  results.push({ endpoint: '/api/users/profile (empty body)', method: 'PUT', expected: 400, actual: r.status, pass: r.status === 400 });
  console.log(`PUT /api/users/profile (empty) → ${r.status}`);

  // Upload profile photo
  const base64Img = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  r = await fetchJSON(`${BASE}/api/users/profile/photo`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${farmerToken}` },
    body: JSON.stringify({ image: base64Img })
  });
  results.push({ endpoint: '/api/users/profile/photo', method: 'POST', expected: 200, actual: r.status, pass: r.status === 200 && !!r.body?.imageUrl });
  console.log(`POST /api/users/profile/photo → ${r.status} url=${String(r.body?.imageUrl || '').slice(0, 40)}...`);

  r = await fetchJSON(`${BASE}/api/users/profile/photo`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${farmerToken}` },
    body: JSON.stringify({ image: 'not-base64' })
  });
  results.push({ endpoint: '/api/users/profile/photo (bad)', method: 'POST', expected: 400, actual: r.status, pass: r.status === 400 });
  console.log(`POST /api/users/profile/photo (bad) → ${r.status}`);

  // Update without changing photo — photo should persist
  r = await fetchJSON(`${BASE}/api/users/profile`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${farmerToken}` },
    body: JSON.stringify({ nama: 'PetaniFinal' })
  });
  results.push({ endpoint: '/api/users/profile (keep photo)', method: 'PUT', expected: 200, actual: r.status, pass: r.status === 200 && !!r.body?.user?.profile_image });
  console.log(`PUT /api/users/profile (keep photo) → ${r.status} has_photo=${!!r.body?.user?.profile_image}`);

  // ── PRODUCTS ────────────────────────────────────
  console.log('\n═══ PRODUCTS ═══');

  r = await fetchJSON(`${BASE}/api/products`);
  results.push({ endpoint: '/api/products', method: 'GET', expected: 200, actual: r.status, pass: r.status === 200 });
  console.log(`GET /api/products → ${r.status} count=${r.body?.products?.length ?? 0}`);

  // Create product
  r = await fetchJSON(`${BASE}/api/products`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${farmerToken}` },
    body: JSON.stringify({
      category_id: 1, nama_produk: 'Wortel Organik', deskripsi: 'Wortel segar',
      harga: 25000, stok: 50, satuan: 'ikat', foto_produk: 'https://example.com/carrot.jpg'
    })
  });
  results.push({ endpoint: '/api/products', method: 'POST', expected: 201, actual: r.status, pass: r.status === 201 && r.body?.product?.status === 'ready' });
  const productId = r.body?.product?.id;
  console.log(`POST /api/products → ${r.status} id=${productId} status=${r.body?.product?.status}`);

  // No auth
  r = await fetchJSON(`${BASE}/api/products`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category_id: 1, nama_produk: 'X', deskripsi: 'x', harga: 1000, stok: 1, satuan: 'pcs', foto_produk: 'http://x.com/x.jpg' })
  });
  results.push({ endpoint: '/api/products (no auth)', method: 'POST', expected: 401, actual: r.status, pass: r.status === 401 });
  console.log(`POST /api/products (no auth) → ${r.status}`);

  // Get by ID
  if (productId) {
    r = await fetchJSON(`${BASE}/api/products/${productId}`);
    results.push({ endpoint: `/api/products/${productId}`, method: 'GET', expected: 200, actual: r.status, pass: r.status === 200 });
    console.log(`GET /api/products/${productId} → ${r.status} status=${r.body?.product?.status}`);
  }

  // Not found
  r = await fetchJSON(`${BASE}/api/products/99999`);
  results.push({ endpoint: '/api/products/99999', method: 'GET', expected: 404, actual: r.status, pass: r.status === 404 });
  console.log(`GET /api/products/99999 → ${r.status}`);

  // Invalid ID
  r = await fetchJSON(`${BASE}/api/products/abc`);
  results.push({ endpoint: '/api/products/abc', method: 'GET', expected: 400, actual: r.status, pass: r.status === 400 });
  console.log(`GET /api/products/abc → ${r.status}`);

  // Update product
  if (productId) {
    r = await fetchJSON(`${BASE}/api/products/${productId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${farmerToken}` },
      body: JSON.stringify({ nama_produk: 'Wortel Premium', harga: 30000 })
    });
    results.push({ endpoint: `/api/products/${productId}`, method: 'PUT', expected: 200, actual: r.status, pass: r.status === 200 });
    console.log(`PUT /api/products/${productId} → ${r.status} name=${r.body?.product?.nama_produk}`);

    // Invalid status
    r = await fetchJSON(`${BASE}/api/products/${productId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${farmerToken}` },
      body: JSON.stringify({ status: 'active' })
    });
    results.push({ endpoint: `/api/products/${productId} (bad status)`, method: 'PUT', expected: 400, actual: r.status, pass: r.status === 400 });
    console.log(`PUT /api/products/${productId} (bad status) → ${r.status}`);

    // Update non-existent
    r = await fetchJSON(`${BASE}/api/products/99999`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${farmerToken}` },
      body: JSON.stringify({ nama_produk: 'X' })
    });
    results.push({ endpoint: '/api/products/99999', method: 'PUT', expected: 404, actual: r.status, pass: r.status === 404 });
    console.log(`PUT /api/products/99999 → ${r.status}`);

    // Buyer cannot update
    r = await fetchJSON(`${BASE}/api/products/${productId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ nama_produk: 'X' })
    });
    results.push({ endpoint: `/api/products/${productId} (buyer PUT)`, method: 'PUT', expected: 403, actual: r.status, pass: r.status === 403 });
    console.log(`PUT /api/products/${productId} (buyer) → ${r.status}`);

    // Buyer cannot delete
    r = await fetchJSON(`${BASE}/api/products/${productId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${buyerToken}` }
    });
    results.push({ endpoint: `/api/products/${productId} (buyer DEL)`, method: 'DELETE', expected: 403, actual: r.status, pass: r.status === 403 });
    console.log(`DELETE /api/products/${productId} (buyer) → ${r.status}`);

    // Delete non-existent
    r = await fetchJSON(`${BASE}/api/products/99999`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${farmerToken}` }
    });
    results.push({ endpoint: '/api/products/99999', method: 'DELETE', expected: 404, actual: r.status, pass: r.status === 404 });
    console.log(`DELETE /api/products/99999 → ${r.status}`);
  }

  // ── CATEGORIES ──────────────────────────────────
  console.log('\n═══ CATEGORIES ═══');

  r = await fetchJSON(`${BASE}/api/categories`);
  results.push({ endpoint: '/api/categories', method: 'GET', expected: 200, actual: r.status, pass: r.status === 200 });
  console.log(`GET /api/categories → ${r.status}`);

  // Create category (needs petani token)
  r = await fetchJSON(`${BASE}/api/categories`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${farmerToken}` },
    body: JSON.stringify({ nama_kategori: 'Sayuran', deskripsi: 'Kategori sayur' })
  });
  results.push({ endpoint: '/api/categories', method: 'POST', expected: 201, actual: r.status, pass: r.status === 201 });
  const catId = r.body?.category?.id;
  console.log(`POST /api/categories → ${r.status} id=${catId}`);

  // Duplicate category
  r = await fetchJSON(`${BASE}/api/categories`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${farmerToken}` },
    body: JSON.stringify({ nama_kategori: 'Sayuran', deskripsi: 'dup' })
  });
  results.push({ endpoint: '/api/categories (dup)', method: 'POST', expected: 400, actual: r.status, pass: r.status === 400 });
  console.log(`POST /api/categories (dup) → ${r.status}`);

  // Create without auth
  r = await fetchJSON(`${BASE}/api/categories`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama_kategori: 'Test' })
  });
  results.push({ endpoint: '/api/categories (no auth)', method: 'POST', expected: 401, actual: r.status, pass: r.status === 401 });
  console.log(`POST /api/categories (no auth) → ${r.status}`);

  // Update category
  if (catId) {
    r = await fetchJSON(`${BASE}/api/categories/${catId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${farmerToken}` },
      body: JSON.stringify({ nama_kategori: 'Sayuran Segar' })
    });
    results.push({ endpoint: `/api/categories/${catId}`, method: 'PUT', expected: 200, actual: r.status, pass: r.status === 200 });
    console.log(`PUT /api/categories/${catId} → ${r.status}`);

    // Delete category without products — should succeed (no products reference it)
    r = await fetchJSON(`${BASE}/api/categories/${catId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${farmerToken}` }
    });
    results.push({ endpoint: `/api/categories/${catId} (no products)`, method: 'DELETE', expected: 200, actual: r.status, pass: r.status === 200 });
    console.log(`DELETE /api/categories/${catId} (no products) → ${r.status}`);
  }

  // Delete non-existent category
  r = await fetchJSON(`${BASE}/api/categories/99999`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${farmerToken}` }
  });
  results.push({ endpoint: '/api/categories/99999', method: 'DELETE', expected: 404, actual: r.status, pass: r.status === 404 });
  console.log(`DELETE /api/categories/99999 → ${r.status}`);

  // ── CART ────────────────────────────────────────
  console.log('\n═══ CART ═══');

  // Add to cart via /api/cart/items (correct route)
  if (productId) {
    r = await fetchJSON(`${BASE}/api/cart/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ product_id: productId, jumlah: 2 })
    });
    results.push({ endpoint: '/api/cart/items', method: 'POST', expected: 200, actual: r.status, pass: r.status === 200 });
    console.log(`POST /api/cart/items → ${r.status}`);

    // Farmer cannot add to cart
    r = await fetchJSON(`${BASE}/api/cart/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${farmerToken}` },
      body: JSON.stringify({ product_id: productId, jumlah: 1 })
    });
    results.push({ endpoint: '/api/cart/items (farmer)', method: 'POST', expected: 403, actual: r.status, pass: r.status === 403 });
    console.log(`POST /api/cart/items (farmer) → ${r.status}`);
  }

  // Get cart
  r = await fetchJSON(`${BASE}/api/cart`, {
    headers: { Authorization: `Bearer ${buyerToken}` }
  });
  results.push({ endpoint: '/api/cart', method: 'GET', expected: 200, actual: r.status, pass: r.status === 200 });
  console.log(`GET /api/cart → ${r.status} items=${r.body?.cart?.items?.length ?? 0}`);

  // Update cart item
  if (r.body?.cart?.items?.[0]?.id) {
    const cartItemId = r.body.cart.items[0].id;
    r = await fetchJSON(`${BASE}/api/cart/items/${cartItemId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ jumlah: 5 })
    });
    results.push({ endpoint: `/api/cart/items/${cartItemId}`, method: 'PUT', expected: 200, actual: r.status, pass: r.status === 200 });
    console.log(`PUT /api/cart/items/${cartItemId} → ${r.status}`);

    // Remove cart item
    r = await fetchJSON(`${BASE}/api/cart/items/${cartItemId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${buyerToken}` }
    });
    results.push({ endpoint: `/api/cart/items/${cartItemId}`, method: 'DELETE', expected: 200, actual: r.status, pass: r.status === 200 });
    console.log(`DELETE /api/cart/items/${cartItemId} → ${r.status}`);

    // Delete non-existent
    r = await fetchJSON(`${BASE}/api/cart/items/99999`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${buyerToken}` }
    });
    results.push({ endpoint: '/api/cart/items/99999', method: 'DELETE', expected: 404, actual: r.status, pass: r.status === 404 });
    console.log(`DELETE /api/cart/items/99999 → ${r.status}`);
  }

  // Clear cart
  r = await fetchJSON(`${BASE}/api/cart`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${buyerToken}` }
  });
  results.push({ endpoint: '/api/cart (clear)', method: 'DELETE', expected: 200, actual: r.status, pass: r.status === 200 });
  console.log(`DELETE /api/cart → ${r.status}`);

  // ── DASHBOARD ───────────────────────────────────
  console.log('\n═══ DASHBOARD ═══');

  // Correct route: /api/dashboard/dashboard
  r = await fetchJSON(`${BASE}/api/dashboard/dashboard`, {
    headers: { Authorization: `Bearer ${farmerToken}` }
  });
  results.push({ endpoint: '/api/dashboard/dashboard', method: 'GET', expected: 200, actual: r.status, pass: r.status === 200 });
  console.log(`GET /api/dashboard/dashboard → ${r.status} data=${JSON.stringify(r.body?.dashboard)}`);

  // Buyer access dashboard — should also work or be forbidden depending on implementation
  r = await fetchJSON(`${BASE}/api/dashboard/dashboard`, {
    headers: { Authorization: `Bearer ${buyerToken}` }
  });
  // Dashboard may allow both roles or block buyers
  results.push({ endpoint: '/api/dashboard/dashboard (buyer)', method: 'GET', expected: 403, actual: r.status, pass: r.status === 403 });
  console.log(`GET /api/dashboard/dashboard (buyer) → ${r.status}`);

  // ── ORDERS ──────────────────────────────────────
  console.log('\n═══ ORDERS ═══');

  // Re-login: clean-test may have deleted accounts, get fresh tokens
  const farmerLoginFresh = await fetchJSON(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'petani@test.com', password: 'rahasia123' })
  });
  const farmerTokenFresh = farmerLoginFresh.body?.token;
  const buyerLoginFresh = await fetchJSON(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pembeli@test.com', password: 'rahasia123' })
  });
  const buyerTokenFresh = buyerLoginFresh.body?.token;

  // Add item to cart then create order
  if (productId) {
    await fetchJSON(`${BASE}/api/cart/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ product_id: productId, jumlah: 2 })
    });

    r = await fetchJSON(`${BASE}/api/orders`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ alamat_pengiriman: 'Jl. Test No. 1' })
    });
    results.push({ endpoint: '/api/orders', method: 'POST', expected: 201, actual: r.status, pass: r.status === 201 && r.body?.orders?.length > 0 });
    const orderId = r.body?.orders?.[0]?.id;
    console.log(`POST /api/orders → ${r.status} order_id=${orderId} status=${r.body?.orders?.[0]?.status}`);

    if (orderId) {
      // Get orders
      r = await fetchJSON(`${BASE}/api/orders`, {
        headers: { Authorization: `Bearer ${buyerToken}` }
      });
      results.push({ endpoint: '/api/orders (get)', method: 'GET', expected: 200, actual: r.status, pass: r.status === 200 });
      console.log(`GET /api/orders → ${r.status} count=${r.body?.orders?.length ?? 0}`);

      // Get order by id
      r = await fetchJSON(`${BASE}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${buyerToken}` }
      });
      results.push({ endpoint: `/api/orders/${orderId}`, method: 'GET', expected: 200, actual: r.status, pass: r.status === 200 });
      console.log(`GET /api/orders/${orderId} → ${r.status} status=${r.body?.order?.status}`);

      // Cancel order
      r = await fetchJSON(`${BASE}/api/orders/${orderId}/cancel`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${buyerToken}` }
      });
      results.push({ endpoint: `/api/orders/${orderId}/cancel`, method: 'PATCH', expected: 200, actual: r.status, pass: r.status === 200 });
      console.log(`PATCH /api/orders/${orderId}/cancel → ${r.status}`);

      // Cancel again — should fail (already cancelled)
      r = await fetchJSON(`${BASE}/api/orders/${orderId}/cancel`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${buyerToken}` }
      });
      results.push({ endpoint: `/api/orders/${orderId}/cancel (again)`, method: 'PATCH', expected: 400, actual: r.status, pass: r.status === 400 });
      console.log(`PATCH /api/orders/${orderId}/cancel (again) → ${r.status}`);

      // Non-buyer cancel attempt
      r = await fetchJSON(`${BASE}/api/orders/${orderId}/cancel`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${farmerToken}` }
      });
      results.push({ endpoint: `/api/orders/${orderId}/cancel (farmer)`, method: 'PATCH', expected: 403, actual: r.status, pass: r.status === 403 });
      console.log(`PATCH /api/orders/${orderId}/cancel (farmer) → ${r.status}`);

      // Farmer update order status
      r = await fetchJSON(`${BASE}/api/orders/${orderId}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${farmerToken}` },
        body: JSON.stringify({ status: 'confirmed' })
      });
      // After cancel, status is cancelled — might fail or succeed depending on controller logic
      console.log(`PATCH /api/orders/${orderId}/status → ${r.status}`);

      // Get non-existent order
      r = await fetchJSON(`${BASE}/api/orders/99999`, {
        headers: { Authorization: `Bearer ${buyerToken}` }
      });
      results.push({ endpoint: '/api/orders/99999', method: 'GET', expected: 404, actual: r.status, pass: r.status === 404 });
      console.log(`GET /api/orders/99999 → ${r.status}`);

      // Delete order (not supported — no DELETE route)
      r = await fetchJSON(`${BASE}/api/orders/${orderId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${buyerToken}` }
      });
      results.push({ endpoint: '/api/orders/:id (DELETE not supported)', method: 'DELETE', expected: 404, actual: r.status, pass: r.status === 404 });
      console.log(`DELETE /api/orders/${orderId} → ${r.status}`);
    }
  }

  // ── PAYMENTS ────────────────────────────────────
  console.log('\n═══ PAYMENTS ═══');

  // Create order fresh for payment
  if (productId) {
    const orderResp = await fetchJSON(`${BASE}/api/orders`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ alamat_pengiriman: 'Jl. Test No. 2' })
    });
    const payOrderId = orderResp.body?.orders?.[0]?.id;
    if (payOrderId) {
      r = await fetchJSON(`${BASE}/api/payments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
        body: JSON.stringify({ order_id: payOrderId })
      });
      results.push({ endpoint: '/api/payments', method: 'POST', expected: 200, actual: r.status, pass: r.status === 200 });
      console.log(`POST /api/payments → ${r.status} token_present=${!!r.body?.token}`);

      // Payment for non-existent order
      r = await fetchJSON(`${BASE}/api/payments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
        body: JSON.stringify({ order_id: 99999 })
      });
      results.push({ endpoint: '/api/payments (bad order)', method: 'POST', expected: 404, actual: r.status, pass: r.status === 404 });
      console.log(`POST /api/payments (bad order) → ${r.status}`);

      // Get payment
      r = await fetchJSON(`${BASE}/api/payments/1`, {
        headers: { Authorization: `Bearer ${buyerToken}` }
      });
      // Might exist or not
      console.log(`GET /api/payments/1 → ${r.status}`);
    }
  }

  // Webhook (no auth needed)
  r = await fetchJSON(`${BASE}/api/payments/webhook`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: 'test', status_code: '200', gross_amount: '10000', signature_key: 'xxx' })
  });
  console.log(`POST /api/payments/webhook → ${r.status}`);

  // ── SUMMARY ─────────────────────────────────────
  console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                        TESTING REPORT                        ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  const passCount = results.filter(x => x.pass).length;
  const failResults = results.filter(x => !x.pass);
  for (const r of results) {
    const icon = r.pass ? 'PASS' : 'FAIL';
    const methodPad = r.method.padEnd(5);
    console.log(`║ [${icon}] ${methodPad} ${r.endpoint.padEnd(38)} ║`);
  }
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║ Total: ${results.length} | Passed: ${passCount} | Failed: ${failResults.length}                              ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝');
  if (failResults.length > 0) {
    console.log('\nFAILED DETAILS:');
    for (const f of failResults) {
      console.log(`  ${f.method} ${f.endpoint} → expected ${f.expected}, got ${f.actual}`);
    }
  }

  process.exit(failResults.length > 0 ? 1 : 0);
}

run().catch(err => { console.error(err); process.exit(1); });
