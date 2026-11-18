/**
 * Spesifikasi OpenAPI ditulis langsung sebagai object (bukan hasil scan komentar
 * JSDoc di ./src/routes/*.ts). Dengan begitu spec tetap lengkap ketika aplikasi
 * di-deploy / di-build ke dist, apa pun working directory-nya.
 */

const isVercel = process.env.VERCEL === '1';
const isProduction = process.env.NODE_ENV === 'production' || isVercel;
const PRODUCTION_DOMAIN = isVercel
  ? 'https://kompasdesa-mobile.vercel.app'
  : 'https://backend.kompasdesa.site';
// Di production pakai API_URL (jika diisi), selain itu domain default di atas.
const productionUrl = (
  isProduction && process.env.API_URL ? process.env.API_URL : PRODUCTION_DOMAIN
).replace(/\/+$/, '');
const port = process.env.PORT || 5000;

const servers = isProduction
  ? [{ url: productionUrl, description: 'Production server' }]
  : [
      { url: `http://localhost:${port}`, description: 'Development server' },
      { url: productionUrl, description: 'Production server' },
    ];

const json = (schema: object) => ({ 'application/json': { schema } });
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const resp = (description: string, schema: object = ref('Message')) => ({
  description,
  content: json(schema),
});
const err = (description: string) => resp(description, ref('Error'));

const idParam = (name = 'id', description = 'ID resource') => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'integer', minimum: 1 },
});

const authErrors = {
  401: err('Token tidak ada / tidak valid / kadaluarsa'),
  403: err('Akses ditolak untuk role ini'),
};
const serverError = { 500: err('Terjadi kesalahan pada server') };
const secured = [{ bearerAuth: [] as string[] }];

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'KompasDesa API',
    description:
      'API untuk aplikasi marketplace pertanian KompasDesa.\n\n' +
      'Untuk endpoint yang terkunci: login via `POST /api/auth/login`, salin `token`, ' +
      'lalu klik tombol **Authorize** dan tempel token tersebut (tanpa prefix `Bearer`).',
    version: '1.0.0',
  },
  servers,
  tags: [
    { name: 'Auth', description: 'Registrasi & login' },
    { name: 'Users', description: 'Profil user yang sedang login' },
    { name: 'Products', description: 'Produk (tulis: khusus petani)' },
    { name: 'Categories', description: 'Kategori produk (tulis: khusus petani)' },
    { name: 'Cart', description: 'Keranjang belanja (khusus pembeli)' },
    { name: 'Orders', description: 'Pesanan' },
    { name: 'Dashboard', description: 'Ringkasan data sesuai role' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Message: {
        type: 'object',
        properties: { message: { type: 'string', example: 'Berhasil' } },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Input tidak valid' },
          detail: { type: 'array', items: { type: 'object' }, description: 'Detail validasi (opsional)' },
        },
      },
      Role: { type: 'string', enum: ['pembeli', 'petani'] },
      RegisterInput: {
        type: 'object',
        required: ['nama', 'email', 'password', 'role'],
        properties: {
          nama: { type: 'string', minLength: 3, example: 'Budi Santoso' },
          email: { type: 'string', format: 'email', example: 'budi@example.com' },
          password: { type: 'string', minLength: 6, format: 'password', example: 'rahasia123' },
          role: ref('Role'),
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'budi@example.com' },
          password: { type: 'string', minLength: 6, format: 'password', example: 'rahasia123' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Login berhasil' },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              email: { type: 'string', example: 'budi@example.com' },
              role: ref('Role'),
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nama: { type: 'string', example: 'Budi Santoso' },
          email: { type: 'string', example: 'budi@example.com' },
          role: ref('Role'),
          no_hp: { type: 'string', nullable: true, example: '081234567890' },
          alamat: { type: 'string', nullable: true, example: 'Desa Sukamaju' },
        },
      },
      UpdateUserInput: {
        type: 'object',
        properties: {
          nama: { type: 'string', minLength: 3, maxLength: 100 },
          no_hp: { type: 'string', maxLength: 20 },
          alamat: { type: 'string' },
        },
      },
      ProductStatus: { type: 'string', enum: ['Ready', 'sold out'] },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          farmer_id: { type: 'integer', example: 2 },
          category_id: { type: 'integer', example: 1 },
          nama_produk: { type: 'string', example: 'Beras Pandan Wangi' },
          deskripsi: { type: 'string', example: 'Beras premium hasil panen sendiri' },
          harga: { type: 'number', example: 15000 },
          stok: { type: 'integer', example: 100 },
          satuan: { type: 'string', example: 'kg' },
          foto_produk: { type: 'string', example: 'https://res.cloudinary.com/.../beras.jpg' },
          status: ref('ProductStatus'),
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      ProductInput: {
        type: 'object',
        required: ['category_id', 'nama_produk', 'deskripsi', 'harga', 'stok', 'satuan', 'foto_produk'],
        properties: {
          category_id: { type: 'integer', minimum: 1, example: 1 },
          nama_produk: { type: 'string', maxLength: 150, example: 'Beras Pandan Wangi' },
          deskripsi: { type: 'string', example: 'Beras premium hasil panen sendiri' },
          harga: { type: 'number', exclusiveMinimum: true, minimum: 0, example: 15000 },
          stok: { type: 'integer', minimum: 0, example: 100 },
          satuan: { type: 'string', maxLength: 30, example: 'kg' },
          foto_produk: { type: 'string', maxLength: 255, example: 'https://res.cloudinary.com/.../beras.jpg' },
          status: ref('ProductStatus'),
        },
      },
      ProductUpdateInput: {
        type: 'object',
        description: 'Semua field opsional, minimal satu diisi',
        properties: {
          category_id: { type: 'integer', minimum: 1 },
          nama_produk: { type: 'string', maxLength: 150 },
          deskripsi: { type: 'string' },
          harga: { type: 'number' },
          stok: { type: 'integer', minimum: 0 },
          satuan: { type: 'string', maxLength: 30 },
          foto_produk: { type: 'string', maxLength: 255 },
          status: ref('ProductStatus'),
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nama_kategori: { type: 'string', example: 'Sayuran' },
          deskripsi: { type: 'string', nullable: true, example: 'Sayuran segar' },
        },
      },
      CategoryInput: {
        type: 'object',
        required: ['nama_kategori'],
        properties: {
          nama_kategori: { type: 'string', minLength: 1, maxLength: 100, example: 'Sayuran' },
          deskripsi: { type: 'string', example: 'Sayuran segar' },
        },
      },
      CategoryUpdateInput: {
        type: 'object',
        properties: {
          nama_kategori: { type: 'string', minLength: 1, maxLength: 100 },
          deskripsi: { type: 'string' },
        },
      },
      AddToCartInput: {
        type: 'object',
        required: ['product_id', 'jumlah'],
        properties: {
          product_id: { type: 'integer', minimum: 1, example: 1 },
          jumlah: { type: 'number', example: 2 },
        },
      },
      UpdateCartItemInput: {
        type: 'object',
        required: ['jumlah'],
        properties: { jumlah: { type: 'number', example: 3 } },
      },
      OrderStatus: {
        type: 'string',
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'],
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          buyer_id: { type: 'integer', example: 1 },
          farmer_id: { type: 'integer', example: 2 },
          total_harga: { type: 'number', example: 30000 },
          status: ref('OrderStatus'),
          alamat_pengiriman: { type: 'string', example: 'Jl. Merdeka No. 1' },
          created_at: { type: 'string', format: 'date-time' },
        },
        additionalProperties: true,
      },
      CreateOrderInput: {
        type: 'object',
        required: ['alamat_pengiriman'],
        properties: { alamat_pengiriman: { type: 'string', minLength: 5, example: 'Jl. Merdeka No. 1, Desa Sukamaju' } },
      },
      UpdateOrderStatusInput: {
        type: 'object',
        required: ['status'],
        properties: { status: ref('OrderStatus') },
      },
    },
  },
  paths: {
    // ---------------- AUTH ----------------
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrasi user baru',
        security: [],
        requestBody: { required: true, content: json(ref('RegisterInput')) },
        responses: {
          201: resp('Registrasi berhasil', {
            type: 'object',
            properties: { message: { type: 'string' }, user: ref('User') },
          }),
          400: err('Input tidak valid / email telah terdaftar'),
          ...serverError,
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login dan dapatkan JWT',
        security: [],
        requestBody: { required: true, content: json(ref('LoginInput')) },
        responses: {
          200: resp('Login berhasil', ref('LoginResponse')),
          400: err('Input tidak valid'),
          401: err('Email atau password salah'),
          ...serverError,
        },
      },
    },

    // ---------------- USERS ----------------
    '/api/users/profile': {
      get: {
        tags: ['Users'],
        summary: 'Ambil profil user yang login',
        security: secured,
        responses: {
          200: resp('OK', { type: 'object', properties: { user: ref('User') } }),
          401: authErrors[401],
          404: err('User tidak ditemukan'),
          ...serverError,
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Update profil user yang login',
        security: secured,
        requestBody: { required: true, content: json(ref('UpdateUserInput')) },
        responses: {
          200: resp('Profil berhasil diupdate', {
            type: 'object',
            properties: { message: { type: 'string' }, user: ref('User') },
          }),
          400: err('Input tidak valid / tidak ada data yang diupdate'),
          401: authErrors[401],
          ...serverError,
        },
      },
    },

    // ---------------- PRODUCTS ----------------
    '/api/products': {
      get: {
        tags: ['Products'],
        summary: 'Daftar semua produk',
        security: [],
        responses: {
          200: resp('OK', { type: 'object', properties: { products: { type: 'array', items: ref('Product') } } }),
          ...serverError,
        },
      },
      post: {
        tags: ['Products'],
        summary: 'Tambah produk (petani)',
        security: secured,
        requestBody: { required: true, content: json(ref('ProductInput')) },
        responses: {
          201: resp('Produk berhasil dibuat', {
            type: 'object',
            properties: { message: { type: 'string' }, product: ref('Product') },
          }),
          400: err('Input tidak valid'),
          ...authErrors,
          ...serverError,
        },
      },
    },
    '/api/products/{id}': {
      parameters: [idParam('id', 'ID produk')],
      get: {
        tags: ['Products'],
        summary: 'Detail produk',
        security: [],
        responses: {
          200: resp('OK', { type: 'object', properties: { product: ref('Product') } }),
          400: err('ID tidak valid'),
          404: err('Produk tidak ditemukan'),
          ...serverError,
        },
      },
      put: {
        tags: ['Products'],
        summary: 'Update produk (petani)',
        security: secured,
        requestBody: { required: true, content: json(ref('ProductUpdateInput')) },
        responses: {
          200: resp('Produk berhasil diupdate', {
            type: 'object',
            properties: { message: { type: 'string' }, product: ref('Product') },
          }),
          400: err('Input tidak valid'),
          ...authErrors,
          404: err('Produk tidak ditemukan'),
          ...serverError,
        },
      },
      delete: {
        tags: ['Products'],
        summary: 'Hapus produk (petani pemilik)',
        security: secured,
        responses: {
          200: resp('Produk berhasil dihapus'),
          400: err('ID tidak valid'),
          ...authErrors,
          404: err('Produk tidak ditemukan'),
          ...serverError,
        },
      },
    },

    // ---------------- CATEGORIES ----------------
    '/api/categories': {
      get: {
        tags: ['Categories'],
        summary: 'Daftar kategori',
        security: [],
        responses: {
          200: resp('OK', { type: 'object', properties: { categories: { type: 'array', items: ref('Category') } } }),
          ...serverError,
        },
      },
      post: {
        tags: ['Categories'],
        summary: 'Tambah kategori (petani)',
        security: secured,
        requestBody: { required: true, content: json(ref('CategoryInput')) },
        responses: {
          201: resp('Kategori berhasil dibuat', {
            type: 'object',
            properties: { message: { type: 'string' }, category: ref('Category') },
          }),
          400: err('Input tidak valid / kategori sudah ada'),
          ...authErrors,
          ...serverError,
        },
      },
    },
    '/api/categories/{id}': {
      parameters: [idParam('id', 'ID kategori')],
      get: {
        tags: ['Categories'],
        summary: 'Detail kategori',
        security: [],
        responses: {
          200: resp('OK', { type: 'object', properties: { category: ref('Category') } }),
          400: err('ID tidak valid'),
          404: err('Kategori tidak ditemukan'),
          ...serverError,
        },
      },
      put: {
        tags: ['Categories'],
        summary: 'Update kategori (petani)',
        security: secured,
        requestBody: { required: true, content: json(ref('CategoryUpdateInput')) },
        responses: {
          200: resp('Kategori berhasil diupdate', {
            type: 'object',
            properties: { message: { type: 'string' }, category: ref('Category') },
          }),
          400: err('Input tidak valid / nama kategori sudah digunakan'),
          ...authErrors,
          404: err('Kategori tidak ditemukan'),
          ...serverError,
        },
      },
      delete: {
        tags: ['Categories'],
        summary: 'Hapus kategori (petani)',
        security: secured,
        responses: {
          200: resp('Kategori berhasil dihapus'),
          400: err('ID tidak valid / kategori masih memiliki produk'),
          ...authErrors,
          404: err('Kategori tidak ditemukan'),
          ...serverError,
        },
      },
    },

    // ---------------- CART ----------------
    '/api/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Lihat isi keranjang (pembeli)',
        security: secured,
        responses: {
          200: resp('OK', { type: 'object', additionalProperties: true }),
          ...authErrors,
          ...serverError,
        },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Kosongkan keranjang (pembeli)',
        security: secured,
        responses: {
          200: resp('Keranjang berhasil dikosongkan'),
          ...authErrors,
          404: err('Keranjang tidak ditemukan'),
          ...serverError,
        },
      },
    },
    '/api/cart/items': {
      post: {
        tags: ['Cart'],
        summary: 'Tambah produk ke keranjang (pembeli)',
        security: secured,
        requestBody: { required: true, content: json(ref('AddToCartInput')) },
        responses: {
          200: resp('Produk berhasil ditambahkan ke keranjang'),
          400: err('Input tidak valid / produk tidak tersedia / stok tidak mencukupi'),
          ...authErrors,
          404: err('Produk tidak ditemukan'),
          ...serverError,
        },
      },
    },
    '/api/cart/items/{id}': {
      parameters: [idParam('id', 'ID item keranjang')],
      put: {
        tags: ['Cart'],
        summary: 'Ubah jumlah item keranjang (pembeli)',
        security: secured,
        requestBody: { required: true, content: json(ref('UpdateCartItemInput')) },
        responses: {
          200: resp('Jumlah item berhasil diupdate'),
          400: err('Input tidak valid / stok tidak mencukupi'),
          ...authErrors,
          404: err('Item keranjang tidak ditemukan'),
          ...serverError,
        },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Hapus item dari keranjang (pembeli)',
        security: secured,
        responses: {
          200: resp('Item berhasil dihapus dari keranjang'),
          400: err('ID tidak valid'),
          ...authErrors,
          404: err('Item keranjang tidak ditemukan'),
          ...serverError,
        },
      },
    },

    // ---------------- ORDERS ----------------
    '/api/orders': {
      get: {
        tags: ['Orders'],
        summary: 'Daftar pesanan (pembeli: pesanan saya, petani: pesanan masuk)',
        security: secured,
        responses: {
          200: resp('OK', { type: 'object', properties: { orders: { type: 'array', items: ref('Order') } } }),
          401: authErrors[401],
          ...serverError,
        },
      },
      post: {
        tags: ['Orders'],
        summary: 'Checkout keranjang menjadi pesanan',
        security: secured,
        requestBody: { required: true, content: json(ref('CreateOrderInput')) },
        responses: {
          201: resp('Pesanan berhasil dibuat', { type: 'object', additionalProperties: true }),
          400: err('Input tidak valid / keranjang kosong / stok tidak mencukupi'),
          401: authErrors[401],
          404: err('Keranjang tidak ditemukan'),
          ...serverError,
        },
      },
    },
    '/api/orders/{id}': {
      parameters: [idParam('id', 'ID pesanan')],
      get: {
        tags: ['Orders'],
        summary: 'Detail pesanan',
        security: secured,
        responses: {
          200: resp('OK', { type: 'object', additionalProperties: true }),
          400: err('ID tidak valid'),
          ...authErrors,
          404: err('Pesanan tidak ditemukan'),
          ...serverError,
        },
      },
    },
    '/api/orders/{id}/status': {
      parameters: [idParam('id', 'ID pesanan')],
      patch: {
        tags: ['Orders'],
        summary: 'Update status pesanan (petani penjual)',
        security: secured,
        requestBody: { required: true, content: json(ref('UpdateOrderStatusInput')) },
        responses: {
          200: resp('Status pesanan berhasil diupdate', { type: 'object', additionalProperties: true }),
          400: err('Input tidak valid'),
          ...authErrors,
          404: err('Pesanan tidak ditemukan'),
          ...serverError,
        },
      },
    },
    '/api/orders/{id}/cancel': {
      parameters: [idParam('id', 'ID pesanan')],
      patch: {
        tags: ['Orders'],
        summary: 'Batalkan pesanan berstatus pending (pembeli)',
        security: secured,
        responses: {
          200: resp('Pesanan berhasil dibatalkan'),
          400: err('ID tidak valid / pesanan bukan pending'),
          ...authErrors,
          404: err('Pesanan tidak ditemukan'),
          ...serverError,
        },
      },
    },

    // ---------------- DASHBOARD ----------------
    '/api/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: 'Ringkasan dashboard sesuai role user',
        security: secured,
        responses: {
          200: resp('OK', { type: 'object', additionalProperties: true }),
          401: authErrors[401],
          ...serverError,
        },
      },
    },
  },
};
