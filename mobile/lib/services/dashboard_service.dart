import '../models/models.dart';
import 'api_client.dart';

// Endpoint /api/payments belum aktif di backend (payment.route.ts dikomentari),
// jadi belum ada payment_service.dart.
class DashboardService {
  DashboardService._();

  static Future<DashboardPetani> getDashboardPetani() async {
    final data = await ApiClient.request('GET', '/api/dashboard');
    return DashboardPetani.fromJson(asMap(data['dashboard']));
  }

  static Future<DashboardPembeli> getDashboardPembeli() async {
    final data = await ApiClient.request('GET', '/api/dashboard');
    return DashboardPembeli.fromJson(asMap(data['dashboard']));
  }
}
