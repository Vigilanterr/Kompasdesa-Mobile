import '../models/models.dart';
import 'api_client.dart';

class CartService {
  CartService._();

  static Future<Cart> getCart() async {
    final data = await ApiClient.request('GET', '/api/cart');
    return Cart.fromJson(asMap(data['cart']));
  }

  static Future<void> addToCart({required int productId, required double jumlah}) async {
    await ApiClient.request(
      'POST',
      '/api/cart/items',
      body: {'product_id': productId, 'jumlah': jumlah},
    );
  }

  static Future<void> updateCartItem(int id, double jumlah) async {
    await ApiClient.request('PUT', '/api/cart/items/$id', body: {'jumlah': jumlah});
  }

  static Future<void> removeCartItem(int id) async {
    await ApiClient.request('DELETE', '/api/cart/items/$id');
  }

  static Future<void> clearCart() async {
    await ApiClient.request('DELETE', '/api/cart');
  }
}
