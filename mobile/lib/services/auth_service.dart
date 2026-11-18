import 'api_client.dart';

class AuthService {
  AuthService._();

  static Future<Map<String, dynamic>> register({
    required String nama,
    required String email,
    required String password,
    required String role,
  }) {
    return ApiClient.request(
      'POST',
      '/api/auth/register',
      auth: false,
      body: {'nama': nama, 'email': email, 'password': password, 'role': role},
    );
  }

  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) {
    return ApiClient.request(
      'POST',
      '/api/auth/login',
      auth: false,
      body: {'email': email, 'password': password},
    );
  }
}
