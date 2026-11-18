import '../models/models.dart';
import 'api_client.dart';

class CategoryService {
  CategoryService._();

  static Future<List<Category>> getCategories() async {
    final data = await ApiClient.request('GET', '/api/categories', auth: false);
    return asMapList(data['categories']).map((item) => Category.fromJson(item)).toList();
  }

  static Future<Category> createCategory(String namaKategori, String deskripsi) async {
    final data = await ApiClient.request(
      'POST',
      '/api/categories',
      body: {'nama_kategori': namaKategori, 'deskripsi': deskripsi},
    );
    return Category.fromJson(asMap(data['category']));
  }
}
