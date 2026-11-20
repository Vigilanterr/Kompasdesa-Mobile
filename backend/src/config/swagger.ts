import swaggerJSDoc from 'swagger-jsdoc';

const isProduction = process.env.NODE_ENV === 'production';

const bearerAuth = { bearerAuth: [] as string[] };
const err400 = { description: 'Input tidak valid' };
const err401 = { description: 'Token tidak valid atau kadaluarsa' };
const err403 = { description: 'Akses ditolak' };
const err404 = { description: 'Data tidak ditemukan' };

const UserSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        nama: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string', enum: ['pembeli', 'petani'] },
        no_hp: { type: 'string', nullable: true },
        alamat: { type: 'string', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
    },
};

const ProductSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        farmer_id: { type: 'integer' },
        category_id: { type: 'integer' },
        nama_produk: { type: 'string' },
        deskripsi: { type: 'string' },
        harga: { type: 'number' },
        stok: { type: 'integer' },
        satuan: { type: 'string' },
        foto_produk: { type: 'string' },
        status: { type: 'string', enum: ['ready', 'sold_out'] },
        created_at: { type: 'string', format: 'date-time' },
    },
};

const CategorySchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        nama_kategori: { type: 'string' },
        deskripsi: { type: 'string', nullable: true },
    },
};

const OrderSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        buyer_id: { type: 'integer' },
        farmer_id: { type: 'integer' },
        total_harga: { type: 'number' },
        status: { type: 'string' },
        alamat_pengiriman: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
    },
};

export const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Kompas Desa API Docs',
            version: '1.0.0',
            description: 'Dokumentasi REST API untuk platform Kompas Desa',
        },
        servers: [
            {
                url: isProduction ? 'https://backend.kompasdesa.site' : 'http://localhost:5000',
                description: isProduction ? 'Production Server' : 'Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: UserSchema,
                Product: ProductSchema,
                Category: CategorySchema,
                Order: OrderSchema,
            },
        },
        paths: {
            // ==================== AUTH ====================
            '/api/auth/register': {
                post: {
                    tags: ['Auth'],
                    summary: 'Registrasi user baru',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['nama', 'email', 'password', 'role'],
                                    properties: {
                                        nama: { type: 'string', example: 'Budi Santoso' },
                                        email: { type: 'string', format: 'email', example: 'budi@example.com' },
                                        password: { type: 'string', minLength: 6, example: 'rahasia123' },
                                        role: { type: 'string', enum: ['pembeli', 'petani'], example: 'pembeli' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Registrasi berhasil' },
                        400: { description: 'Input tidak valid / email telah terdaftar' },
                    },
                },
            },
            '/api/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Login dan dapatkan JWT',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: { type: 'string', format: 'email', example: 'budi@example.com' },
                                        password: { type: 'string', example: 'rahasia123' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Login berhasil, berisi token dan user' },
                        401: { description: 'Email atau password salah' },
                    },
                },
            },

            // ==================== USERS ====================
            '/api/users/profile': {
                get: {
                    tags: ['Users'],
                    summary: 'Ambil profil user yang login',
                    security: [bearerAuth],
                    responses: { 200: { description: 'OK' }, 401: err401 },
                },
                put: {
                    tags: ['Users'],
                    summary: 'Update profil user yang login',
                    security: [bearerAuth],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        nama: { type: 'string', minLength: 3, maxLength: 100 },
                                        no_hp: { type: 'string', maxLength: 20 },
                                        alamat: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: 'Profil berhasil diupdate' }, 400: err400 },
                },
            },

            // ==================== PRODUCTS ====================
            '/api/products': {
                get: {
                    tags: ['Products'],
                    summary: 'Daftar semua produk',
                    security: [],
                    responses: { 200: { description: 'OK' }, 500: { description: 'Server error' } },
                },
                post: {
                    tags: ['Products'],
                    summary: 'Tambah produk baru (khusus petani)',
                    security: [bearerAuth],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['category_id', 'nama_produk', 'deskripsi', 'harga', 'stok', 'satuan', 'foto_produk'],
                                    properties: {
                                        category_id: { type: 'integer' },
                                        nama_produk: { type: 'string' },
                                        deskripsi: { type: 'string' },
                                        harga: { type: 'number' },
                                        stok: { type: 'integer' },
                                        satuan: { type: 'string' },
                                        foto_produk: { type: 'string', description: 'URL gambar dari Cloudinary' },
        status: { type: 'string', enum: ['ready', 'sold_out'] },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 201: { description: 'Produk berhasil dibuat' }, 400: err400, 401: err401, 403: err403 },
                },
            },
            '/api/products/{id}': {
                get: {
                    tags: ['Products'],
                    summary: 'Detail produk',
                    security: [],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' }, 400: err400, 404: err404 },
                },
                put: {
                    tags: ['Products'],
                    summary: 'Update produk (khusus petani pemilik)',
                    security: [bearerAuth],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        nama_produk: { type: 'string' },
                                        harga: { type: 'number' },
                                        stok: { type: 'integer' },
                                        foto_produk: { type: 'string' },
                                        status: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: 'Produk berhasil diupdate' }, 400: err400, 401: err401, 403: err403, 404: err404 },
                },
                delete: {
                    tags: ['Products'],
                    summary: 'Hapus produk (khusus petani pemilik)',
                    security: [bearerAuth],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Produk berhasil dihapus' }, 400: err400, 401: err401, 403: err403, 404: err404 },
                },
            },

            // ==================== CATEGORIES ====================
            '/api/categories': {
                get: {
                    tags: ['Categories'],
                    summary: 'Daftar semua kategori',
                    security: [],
                    responses: { 200: { description: 'OK' } },
                },
                post: {
                    tags: ['Categories'],
                    summary: 'Tambah kategori baru (khusus petani)',
                    security: [bearerAuth],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { type: 'object', required: ['nama_kategori'], properties: { nama_kategori: { type: 'string' }, deskripsi: { type: 'string' } } } } },
                    },
                    responses: { 201: { description: 'Kategori berhasil dibuat' }, 400: err400, 401: err401, 403: err403 },
                },
            },
            '/api/categories/{id}': {
                get: {
                    tags: ['Categories'],
                    summary: 'Detail kategori',
                    security: [],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' }, 400: err400, 404: err404 },
                },
                put: {
                    tags: ['Categories'],
                    summary: 'Update kategori (khusus petani)',
                    security: [bearerAuth],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        content: { 'application/json': { schema: { type: 'object', properties: { nama_kategori: { type: 'string' }, deskripsi: { type: 'string' } } } } },
                    },
                    responses: { 200: { description: 'Kategori berhasil diupdate' }, 400: err400, 401: err401, 403: err403, 404: err404 },
                },
                delete: {
                    tags: ['Categories'],
                    summary: 'Hapus kategori (khusus petani)',
                    security: [bearerAuth],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Kategori berhasil dihapus' }, 400: err400, 401: err401, 403: err403, 404: err404 },
                },
            },

            // ==================== CART ====================
            '/api/cart': {
                get: {
                    tags: ['Cart'],
                    summary: 'Lihat isi keranjang belanja',
                    security: [bearerAuth],
                    responses: { 200: { description: 'OK' }, 401: err401, 403: err403 },
                },
                delete: {
                    tags: ['Cart'],
                    summary: 'Kosongkan keranjang',
                    security: [bearerAuth],
                    responses: { 200: { description: 'Keranjang berhasil dikosongkan' }, 401: err401, 403: err403, 404: err404 },
                },
            },
            '/api/cart/items': {
                post: {
                    tags: ['Cart'],
                    summary: 'Tambah produk ke keranjang',
                    security: [bearerAuth],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { type: 'object', required: ['product_id', 'jumlah'], properties: { product_id: { type: 'integer' }, jumlah: { type: 'number' } } } } },
                    },
                    responses: { 200: { description: 'Berhasil' }, 400: err400, 401: err401, 403: err403, 404: err404 },
                },
            },
            '/api/cart/items/{id}': {
                put: {
                    tags: ['Cart'],
                    summary: 'Ubah jumlah item di keranjang',
                    security: [bearerAuth],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        content: { 'application/json': { schema: { type: 'object', required: ['jumlah'], properties: { jumlah: { type: 'number' } } } } },
                    },
                    responses: { 200: { description: 'Berhasil' }, 400: err400, 401: err401, 403: err403, 404: err404 },
                },
                delete: {
                    tags: ['Cart'],
                    summary: 'Hapus item dari keranjang',
                    security: [bearerAuth],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Berhasil' }, 400: err400, 401: err401, 403: err403, 404: err404 },
                },
            },

            // ==================== ORDERS ====================
            '/api/orders': {
                get: {
                    tags: ['Orders'],
                    summary: 'Daftar pesanan (pembeli: pesanan saya, petani: pesanan masuk)',
                    security: [bearerAuth],
                    responses: { 200: { description: 'OK' }, 401: err401 },
                },
                post: {
                    tags: ['Orders'],
                    summary: 'Checkout keranjang menjadi pesanan',
                    security: [bearerAuth],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { type: 'object', required: ['alamat_pengiriman'], properties: { alamat_pengiriman: { type: 'string' } } } } },
                    },
                    responses: { 201: { description: 'Pesanan berhasil dibuat' }, 400: err400, 401: err401, 404: err404 },
                },
            },
            '/api/orders/{id}': {
                get: {
                    tags: ['Orders'],
                    summary: 'Detail pesanan',
                    security: [bearerAuth],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' }, 400: err400, 401: err401, 403: err403, 404: err404 },
                },
            },
            '/api/orders/{id}/status': {
                patch: {
                    tags: ['Orders'],
                    summary: 'Update status pesanan (khusus petani penjual)',
                    security: [bearerAuth],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'] } } } } },
                    },
                    responses: { 200: { description: 'Status berhasil diupdate' }, 400: err400, 401: err401, 403: err403, 404: err404 },
                },
            },
            '/api/orders/{id}/cancel': {
                patch: {
                    tags: ['Orders'],
                    summary: 'Batalkan pesanan berstatus pending (khusus pembeli)',
                    security: [bearerAuth],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Pesanan berhasil dibatalkan' }, 400: err400, 401: err401, 403: err403, 404: err404 },
                },
            },

            // ==================== PAYMENTS ====================
            '/api/payments/webhook': {
                post: {
                    tags: ['Payments'],
                    summary: 'Webhook notifikasi dari Midtrans (tidak butuh JWT)',
                    security: [],
                    requestBody: {
                        content: { 'application/json': { schema: { type: 'object' } } },
                    },
                    responses: { 200: { description: 'Notifikasi diproses' }, 401: { description: 'Verifikasi signature gagal' }, 404: err404 },
                },
            },
            '/api/payments': {
                post: {
                    tags: ['Payments'],
                    summary: 'Buat token pembayaran untuk pesanan',
                    security: [bearerAuth],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { type: 'object', required: ['order_id'], properties: { order_id: { type: 'integer' } } } } },
                    },
                    responses: { 201: { description: 'Pembayaran berhasil dibuat' }, 400: err400, 401: err401, 403: err403, 404: err404 },
                },
            },
            '/api/payments/{id}': {
                get: {
                    tags: ['Payments'],
                    summary: 'Detail pembayaran',
                    security: [bearerAuth],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' }, 400: err400, 401: err401, 403: err403, 404: err404 },
                },
            },

            // ==================== DASHBOARD ====================
            '/api/dashboard': {
                get: {
                    tags: ['Dashboard'],
                    summary: 'Statistik dashboard (khusus petani)',
                    security: [bearerAuth],
                    responses: { 200: { description: 'OK' }, 401: err401, 403: err403 },
                },
            },
        },
    },
    apis: [],
});
