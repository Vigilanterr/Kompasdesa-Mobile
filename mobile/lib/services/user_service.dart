import '../models/models.dart';
import 'api_client.dart';

class UserService {
  UserService._();

  static Future<AppUser> getProfile() async {
    final data = await ApiClient.request('GET', '/api/users/profile');
    return AppUser.fromJson(asMap(data['user']));
  }

  static Future<AppUser> updateProfile({
    required String nama,
    required String noHp,
    required String alamat,
  }) async {
    final data = await ApiClient.request(
      'PUT',
      '/api/users/profile',
      body: {'nama': nama, 'no_hp': noHp, 'alamat': alamat},
    );
    return AppUser.fromJson(asMap(data['user']));
  }
}
