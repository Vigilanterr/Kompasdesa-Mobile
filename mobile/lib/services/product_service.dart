import '../models/models.dart';
import 'api_client.dart';

class ProductService {
  ProductService._();

  static Future<List<Product>> getProducts() async {
    final data = await ApiClient.request('GET', '/api/products', auth: false);
    return asMapList(data['products']).map((item) => Product.fromJson(item)).toList();
  }

  static Future<Product> getProductById(int id) async {
    final data = await ApiClient.request('GET', '/api/products/$id', auth: false);
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
    final data = await ApiClient.request(
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
    final data = await ApiClient.request('PUT', '/api/products/$id', body: body);
    return Product.fromJson(asMap(data['product']));
  }

  static Future<void> deleteProduct(int id) async {
    await ApiClient.request('DELETE', '/api/products/$id');
  }
}
