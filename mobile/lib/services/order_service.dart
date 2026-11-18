import '../models/models.dart';
import 'api_client.dart';

class OrderService {
  OrderService._();

  /// Backend mengembalikan DAFTAR order (satu per petani).
  static Future<List<Order>> createOrder({required String alamatPengiriman}) async {
    final data = await ApiClient.request(
      'POST',
      '/api/orders',
      body: {'alamat_pengiriman': alamatPengiriman},
    );
    return asMapList(data['orders']).map((item) => Order.fromJson(item)).toList();
  }

  static Future<List<Order>> getOrders() async {
    final data = await ApiClient.request('GET', '/api/orders');
    return asMapList(data['orders']).map((item) => Order.fromJson(item)).toList();
  }

  static Future<Order> getOrderById(int id) async {
    final data = await ApiClient.request('GET', '/api/orders/$id');
    return Order.fromJson(asMap(data['order']));
  }

  static Future<Order> updateOrderStatus(int id, String status) async {
    final data = await ApiClient.request(
      'PATCH',
      '/api/orders/$id/status',
      body: {'status': status},
    );
    return Order.fromJson(asMap(data['order']));
  }

  static Future<void> cancelOrder(int id) async {
    await ApiClient.request('PATCH', '/api/orders/$id/cancel');
  }
}
