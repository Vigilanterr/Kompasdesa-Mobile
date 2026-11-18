import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/models.dart';

/// Menyimpan data login di perangkat.
/// Hanya token dan data profil dasar yang disimpan.
/// Password dan data pembayaran TIDAK pernah disimpan di sini.
class Session {
  Session._();

  static const String _tokenKey = 'jwt_token';
  static const String _userKey = 'auth_user';

  static SharedPreferences? _prefs;
  static String? _token;
  static AppUser? _user;

  /// Dipanggil sekali di main() sebelum runApp().
  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    _token = _prefs?.getString(_tokenKey);
    final raw = _prefs?.getString(_userKey);
    if (raw != null && raw.isNotEmpty) {
      try {
        _user = AppUser.fromJson(asMap(jsonDecode(raw)));
      } catch (_) {
        _user = null;
      }
    }
  }

  static String? get token => _token;
  static AppUser? get user => _user;
  static bool get isLoggedIn => _token != null && _token!.isNotEmpty;

  static Future<void> saveLogin({
    required String token,
    required AppUser user,
  }) async {
    _token = token;
    _user = user;
    await _prefs?.setString(_tokenKey, token);
    await _prefs?.setString(_userKey, jsonEncode(user.toJson()));
  }

  /// Dipakai setelah profil diubah agar nama di beranda ikut berubah.
  static Future<void> saveUser(AppUser user) async {
    _user = user;
    await _prefs?.setString(_userKey, jsonEncode(user.toJson()));
  }

  static Future<void> clear() async {
    _token = null;
    _user = null;
    await _prefs?.remove(_tokenKey);
    await _prefs?.remove(_userKey);
  }
}
