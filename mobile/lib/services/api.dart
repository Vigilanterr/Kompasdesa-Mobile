import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import 'config.dart';
import '../models/models.dart';
import '../config/session.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}
class ApiService {
  ApiService._();

  static Uri _uri(String path) => Uri.parse('${AppConfig.baseUrl}$path');

  static Map<String, String> _headers({bool auth = true}) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (auth) {
      final token = Session.token;
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }
  static Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
  }) async {
    Map<String, dynamic> responseBody;
    http.Response response;

    try {
      final uri = _uri(path);
      switch (method) {
        case 'GET':
          response = await http.get(uri, headers: _headers(auth: auth)).timeout(
                const Duration(seconds: 20),
              );
          break;
        case 'POST':
          response = await http
              .post(
                uri,
                headers: _headers(auth: auth),
                body: body == null ? null : jsonEncode(body),
              )
              .timeout(const Duration(seconds: 20));
          break;
        case 'PUT':
          response = await http
              .put(
                uri,
                headers: _headers(auth: auth),
                body: body == null ? null : jsonEncode(body),
              )
              .timeout(const Duration(seconds: 20));
          break;
        case 'PATCH':
          response = await http
              .patch(
                uri,
                headers: _headers(auth: auth),
                body: body == null ? null : jsonEncode(body),
              )
              .timeout(const Duration(seconds: 20));
          break;
        case 'DELETE':
          response = await http.delete(uri, headers: _headers(auth: auth)).timeout(
                const Duration(seconds: 20),
              );
          break;
        default:
          throw ApiException('Metode HTTP tidak didukung');
      }
      responseBody = decodeBody(response.body);
    } on SocketException {
      throw ApiException(
        'Tidak dapat terhubung ke server. Periksa koneksi internet dan alamat server.',
      );
    } on http.ClientException {
      throw ApiException('Gagal menghubungi server. Coba lagi beberapa saat.');
    } catch (error) {
      if (error is ApiException) rethrow;
      throw ApiException('Terjadi kesalahan: $error');
    }

    final status = response.statusCode;

    if (status == 401) {
      // Token tidak berlaku: hapus sesi supaya pengguna diminta login lagi.
      await Session.clear();
      throw ApiException('Sesi berakhir. Silakan login kembali.', statusCode: 401);
    }

    if (status >= 200 && status < 300) {
      return responseBody;
    }

    throw ApiException(_errorMessage(responseBody, status), statusCode: status);
  }

  static String _errorMessage(Map<String, dynamic> body, int status) {
    final error = toStringValue(body['error']);
    if (error.isNotEmpty) return error;

    final detail = body['detail'];
    if (detail is List && detail.isNotEmpty) {
      final messages = <String>[];
      for (final item in detail) {
        final map = asMap(item);
        final message = toStringValue(map['message']);
        if (message.isNotEmpty) messages.add(message);
      }
      if (messages.isNotEmpty) return messages.join(', ');
    }

    switch (status) {
      case 400:
        return 'Permintaan tidak valid. Periksa kembali input Anda.';
      case 403:
        return 'Akses ditolak untuk akun ini.';
      case 404:
        return 'Data tidak ditemukan.';
      case 422:
        return 'Data tidak valid.';
      case 500:
        return 'Terjadi kesalahan pada server.';
      default:
        return 'Gagal menghubungi server (kode $status).';
    }
  }

  static Future<Map<String, dynamic>> register({
    required String nama,
    required String email,
    required String password,
    required String role,
  }) async {
    return _request(
      'POST',
      '/api/auth/register',
      auth: false,
      body: {
        'nama': nama,
        'email': email,
        'password': password,
        'role': role,
      },
    );
  }

  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    return _request(
      'POST',
      '/api/auth/login',
      auth: false,
      body: {'email': email, 'password': password},
    );
  }


  static Future<AppUser> getProfile() async {
    final data = await _request('GET', '/api/users/profile');
    return AppUser.fromJson(asMap(data['user']));
  }

  static Future<AppUser> updateProfile({
    required String nama,
    required String noHp,
    required String alamat,
  }) async {
    final data = await _request(
      'PUT',
      '/api/users/profile',
      body: {'nama': nama, 'no_hp': noHp, 'alamat': alamat},
    );
    return AppUser.fromJson(asMap(data['user']));
  }


  static Future<List<Category>> getCategories() async {
    final data = await _request('GET', '/api/categories', auth: false);
    return asMapList(data['categories'])
        .map((item) => Category.fromJson(item))
        .toList();
  }

  static Future<Category> createCategory(String namaKategori, String deskripsi) async {
    final data = await _request(
      'POST',
      '/api/categories',
      body: {'nama_kategori': namaKategori, 'deskripsi': deskripsi},
    );
    return Category.fromJson(asMap(data['category']));
  }


  static Future<List<Product>> getProducts() async {
    final data = await _request('GET', '/api/products', auth: false);
    return asMapList(data['products']).map((item) => Product.fromJson(item)).toList();
  }

  static Future<Product> getProductById(int id) async {
    final data = await _request('GET', '/api/products/$id', auth: false);
    return Product.fromJson(asMap(data['product']));
  }

  static Future<Product> createProduct({
    required int categoryId,
    required String namaProduk,
    required String deskripsi,
    required double harga,
    required int stok,
    required String satuan,
    required String fotoProduk,
  }) async {
    final data = await _request(
      'POST',
      '/api/products',
      body: {
        'category_id': categoryId,
        'nama_produk': namaProduk,
        'deskripsi': deskripsi,
        'harga': harga,
        'stok': stok,
        'satuan': satuan,
        'foto_produk': fotoProduk,
      },
    );
    return Product.fromJson(asMap(data['product']));
  }

  static Future<Product> updateProduct(int id, Map<String, dynamic> body) async {
    final data = await _request('PUT', '/api/products/$id', body: body);
    return Product.fromJson(asMap(data['product']));
  }

  static Future<void> deleteProduct(int id) async {
    await _request('DELETE', '/api/products/$id');
  }

  // ---------------------------------------------------------------- CART

  static Future<Cart> getCart() async {
    final data = await _request('GET', '/api/cart');
    return Cart.fromJson(asMap(data['cart']));
  }

  static Future<void> addToCart({
    required int productId,
    required double jumlah,
  }) async {
    await _request(
      'POST',
      '/api/cart/items',
      body: {'product_id': productId, 'jumlah': jumlah},
    );
  }

  static Future<void> updateCartItem(int id, double jumlah) async {
    await _request(
      'PUT',
      '/api/cart/items/$id',
      body: {'jumlah': jumlah},
    );
  }

  static Future<void> removeCartItem(int id) async {
    await _request('DELETE', '/api/cart/items/$id');
  }

  static Future<void> clearCart() async {
    await _request('DELETE', '/api/cart');
  }

  // --------------------------------------------------------------- ORDER

  /// Backend mengembalikan DAFTAR order (satu per petani).
  static Future<List<Order>> createOrder({required String alamatPengiriman}) async {
    final data = await _request(
      'POST',
      '/api/orders',
      body: {'alamat_pengiriman': alamatPengiriman},
    );
    return asMapList(data['orders']).map((item) => Order.fromJson(item)).toList();
  }

  static Future<List<Order>> getOrders() async {
    final data = await _request('GET', '/api/orders');
    return asMapList(data['orders']).map((item) => Order.fromJson(item)).toList();
  }

  static Future<Order> getOrderById(int id) async {
    final data = await _request('GET', '/api/orders/$id');
    return Order.fromJson(asMap(data['order']));
  }

  static Future<Order> updateOrderStatus(int id, String status) async {
    final data = await _request(
      'PATCH',
      '/api/orders/$id/status',
      body: {'status': status},
    );
    return Order.fromJson(asMap(data['order']));
  }

  static Future<void> cancelOrder(int id) async {
    await _request('PATCH', '/api/orders/$id/cancel');
  }

  // ------------------------------------------------------------ DASHBOARD

  static Future<DashboardPetani> getDashboardPetani() async {
    final data = await _request('GET', '/api/dashboard');
    return DashboardPetani.fromJson(asMap(data['dashboard']));
  }

  static Future<DashboardPembeli> getDashboardPembeli() async {
    final data = await _request('GET', '/api/dashboard');
    return DashboardPembeli.fromJson(asMap(data['dashboard']));
  }

  // -------------------------------------------------------------- PAYMENT
  // ponytail: endpoint /api/payments tidak aktif di backend
  // (payment.route.ts seluruhnya dikomentari). Jangan dipanggil dari UI
  // sampai backend mengaktifkan route POST /api/payments dan webhook Midtrans.
}
