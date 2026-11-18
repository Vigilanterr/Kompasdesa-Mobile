import 'package:flutter/material.dart';

import '../services/api.dart';
import '../models/models.dart';
import '../config/session.dart';
import '../config/theme.dart';
import '../widgets/widgets.dart';

/// Layar checkout: ringkasan keranjang, alamat pengiriman, dan tombol konfirmasi.
class BuyerCheckoutScreen extends StatefulWidget {
  final List<CartItem> items;
  final double total;

  /// Dipanggil setelah pesanan berhasil dibuat untuk pindah ke tab pesanan.
  final VoidCallback? onSelesai;

  const BuyerCheckoutScreen({
    super.key,
    required this.items,
    required this.total,
    this.onSelesai,
  });

  @override
  State<BuyerCheckoutScreen> createState() => _BuyerCheckoutScreenState();
}

class _BuyerCheckoutScreenState extends State<BuyerCheckoutScreen> {
  bool _isLoading = false;
  late TextEditingController _alamatController;
  String? _alamatError;

  @override
  void initState() {
    super.initState();
    _alamatController = TextEditingController(text: Session.user?.alamat ?? '');
  }

  @override
  void dispose() {
    _alamatController.dispose();
    super.dispose();
  }

  void _pesan(String text, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(text), backgroundColor: error ? AppColors.danger : AppColors.primary),
    );
  }

  Future<void> _checkout() async {
    final alamat = _alamatController.text.trim();
    if (alamat.length < 5) {
      setState(() => _alamatError = 'Alamat pengiriman minimal 5 karakter');
      return;
    }
    setState(() {
      _alamatError = null;
      _isLoading = true;
    });
    try {
      final orders = await ApiService.createOrder(alamatPengiriman: alamat);
      if (!mounted) return;
      if (orders.isEmpty) {
        setState(() => _isLoading = false);
        _pesan('Gagal membuat pesanan: tidak ada item keranjang', error: true);
        return;
      }
      await ApiService.clearCart();
      if (!mounted) return;
      // Ganti layar checkout dengan hasil, bukan tumpuk route (tidak ada route '/cart').
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => _CheckoutResultScreen(
            orders: orders,
            onSelesai: widget.onSelesai,
          ),
        ),
      );
    } on ApiException catch (error) {
      setState(() => _isLoading = false);
      if (!mounted) return;
      _pesan(error.message, error: true);
    } catch (error) {
      setState(() => _isLoading = false);
      if (!mounted) return;
      _pesan('Gagal checkout: $error', error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text(
                  'Ringkasan Pesanan',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 12),
                ...widget.items.map((it) => _itemRow(it)),
                const Divider(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total', style: TextStyle(fontSize: 14)),
                    Text(
                      formatRupiah(widget.total),
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                const Text(
                  'Alamat Pengiriman',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _alamatController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    labelText: 'Alamat lengkap',
                    helperText: 'Alamat ini akan dikirim ke petani.',
                    errorText: _alamatError,
                    border: const OutlineInputBorder(),
                  ),
                  validator: (v) => (v == null || v.trim().length < 5)
                      ? 'Alamat minimal 5 karakter'
                      : null,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Pesanan akan diproses oleh masing-masing petani.',
                  style: TextStyle(fontSize: 12, color: AppColors.muted, fontStyle: FontStyle.italic),
                ),
              ],
            ),
          ),
          _checkoutBar(),
        ],
      ),
    );
  }

  Widget _itemRow(CartItem item) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: ProductImage(
          url: '',
          width: 48,
          height: 48,
          borderRadius: BorderRadius.circular(8),
        ),
        title: Text(item.namaProduk, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(
          '${item.satuan} × ${item.jumlah.toStringAsFixed(0)}',
          style: const TextStyle(fontSize: 12),
        ),
        trailing: Text(formatRupiah(item.subtotal), style: const TextStyle(fontWeight: FontWeight.w700)),
      ),
    );
  }

  Widget _checkoutBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: SafeArea(
        child: Row(
          children: [
            const Spacer(),
            FilledButton(
              onPressed: _isLoading ? null : _checkout,
              child: _isLoading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Text('Pesan Sekarang'),
            ),
          ],
        ),
      ),
    );
  }
}

/// Screen tampilan hasil checkout yang menampilkan daftar order.
class _CheckoutResultScreen extends StatelessWidget {
  final List<Order> orders;
  final VoidCallback? onSelesai;

  const _CheckoutResultScreen({required this.orders, this.onSelesai});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pesanan Dibuat')),
      body: orders.isEmpty
          ? const Center(child: EmptyState(
              icon: Icons.cancel_outlined,
              title: 'Pesanan kosong',
              message: 'Gagal membuat pesanan.',
            ))
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
              itemCount: orders.length,
              itemBuilder: (context, i) {
                final o = orders[i];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                'Pesanan #${o.id}',
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                              ),
                            ),
                            Text(
                              o.statusLabel,
                              style: TextStyle(
                                color: orderStatusColor(o.status),
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                        Text(
                          'Total: ${formatRupiah(o.totalHarga)}',
                          style: const TextStyle(fontSize: 13, color: AppColors.muted),
                        ),
                        Text(
                          'Tanggal: ${formatTanggal(o.tanggalPesanan)}',
                          style: const TextStyle(fontSize: 12, color: AppColors.muted),
                        ),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: o.items.map((it) {
                            return Chip(
                              label: Text(
                                '${it.namaProduk} × ${it.jumlah.toInt()}',
                                style: const TextStyle(fontSize: 11),
                              ),
                              backgroundColor: AppColors.surface,
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
      bottomNavigationBar: orders.isEmpty
          ? null
          : Container(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: SafeArea(
                child: FilledButton.icon(
                  onPressed: () {
                    Navigator.of(context).pop();
                    onSelesai?.call();
                  },
                  icon: const Icon(Icons.receipt_long, size: 18),
                  label: const Text('Lihat Pesanan Saya'),
                ),
              ),
            ),
    );
  }
}
