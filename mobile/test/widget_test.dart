import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/screens/auth_screen.dart';
import 'package:mobile/models/models.dart';
import 'package:mobile/config/theme.dart';

void main() {
  test('formatRupiah memberi pemisah ribuan', () {
    expect(formatRupiah(15000), 'Rp 15.000');
    expect(formatRupiah(1250000), 'Rp 1.250.000');
  });

  test('Product membaca JSON backend dan status label', () {
    final product = Product.fromJson({
      'id': 7,
      'farmer_id': 2,
      'category_id': 3,
      'nama_produk': 'Bayam',
      'deskripsi': 'Bayam segar',
      'harga': '5000.00',
      'stok': '12',
      'satuan': 'ikat',
      'foto_produk': '',
      'status': 'active',
    });

    expect(product.id, 7);
    expect(product.harga, 5000);
    expect(product.stok, 12);
    expect(product.statusLabel, 'Tersedia');
  });

  testWidgets('AuthScreen menampilkan form login', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: AuthScreen()));
    expect(find.text('Masuk'), findsWidgets);
    expect(find.text('Email'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
  });
}
