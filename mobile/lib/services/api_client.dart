import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../config/session.dart';
import '../models/models.dart';
import 'config.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient._();

  static const _timeout = Duration(seconds: 20);

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

  static Future<Map<String, dynamic>> request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
  }) async {
    Map<String, dynamic> responseBody;
    http.Response response;

    try {
      final uri = Uri.parse('${AppConfig.baseUrl}$path');
      final headers = _headers(auth: auth);
      final encoded = body == null ? null : jsonEncode(body);
      switch (method) {
        case 'GET':
          response = await http.get(uri, headers: headers).timeout(_timeout);
          break;
        case 'POST':
          response = await http.post(uri, headers: headers, body: encoded).timeout(_timeout);
          break;
        case 'PUT':
          response = await http.put(uri, headers: headers, body: encoded).timeout(_timeout);
          break;
        case 'PATCH':
          response = await http.patch(uri, headers: headers, body: encoded).timeout(_timeout);
          break;
        case 'DELETE':
          response = await http.delete(uri, headers: headers).timeout(_timeout);
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
        final message = toStringValue(asMap(item)['message']);
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
}
