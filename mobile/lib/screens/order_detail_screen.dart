import 'package:flutter/material.dart';

import '../services/api.dart';
import '../models/models.dart';
import 'payment_info_screen.dart';
import '../config/session.dart';
import '../config/theme.dart';
import '../widgets/widgets.dart';

/// Detail pesanan. Dipakai pembeli dan petani.
/// Petani bisa mengubah status sesuai transisi yang diizinkan.
/// Pembeli bisa membatalkan pesanan yang masih pending.
class OrderDetailScreen extends StatefulWidget {
  final int orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  bool _isLoading = true;
  bool _isUpdating = false;
  String? _error;
  Order? _order;

  /// Transisi status yang diizinkan untuk petani.
  static const Map<String, List<String>> _transisi = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['processing', 'cancelled'],
    'processing': ['shipped', 'cancelled'],
    'shipped': ['completed'],
    'completed': [],
    'cancelled': [],
  };

  @override
  void initState() {
    super.initState();
    _muat();
  }

  Future<void> _muat() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final order = await ApiService.getOrderById(widget.orderId);
      if (!mounted) return;
      setState(() => _order = order);
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _error = error.message);
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = 'Gagal memuat pesanan: $error');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _pesan(String text, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(text),
        backgroundColor: error ? AppColors.danger : AppColors.primary,
      ),
    );
  }

  Future<void> _ubahStatus(String status) async {
    setState(() => _isUpdating = true);
    try {
      await ApiService.updateOrderStatus(widget.orderId, status);
      if (!mounted) return;
      await _muat();
      _pesan('Status pesanan berhasil diperbarui');
    } on ApiException catch (error) {
      if (!mounted) return;
      _pesan(error.message, error: true);
    } catch (error) {
      if (!mounted) return;
      _pesan('Gagal mengubah status: $error', error: true);
    } finally {
      if (mounted) setState(() => _isUpdating = false);
    }
  }

  Future<void> _batalkan() async {
    final ya = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Batalkan Pesanan'),
        content: const Text('Stok produk akan dikembalikan. Lanjutkan?'),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(false), child: const Text('Tidak')),
          FilledButton(onPressed: () => Navigator.of(dialogContext).pop(true), child: const Text('Ya, Batalkan')),
        ],
      ),
    );
    if (ya != true) return;

    setState(() => _isUpdating = true);
    try {
      await ApiService.cancelOrder(widget.orderId);
      if (!mounted) return;
      await _muat();
      _pesan('Pesanan berhasil dibatalkan');
    } on ApiException catch (error) {
      if (!mounted) return;
      _pesan(error.message, error: true);
    } catch (error) {
      if (!mounted) return;
      _pesan('Gagal membatalkan: $error', error: true);
    } finally {
      if (mounted) setState(() => _isUpdating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isPetani = Session.user?.isPetani ?? false;

    return Scaffold(
      appBar: AppBar(title: const Text('Detail Pesanan')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: EmptyState(
                    icon: Icons.cloud_off_outlined,
                    title: 'Gagal memuat pesanan',
                    message: _error!,
                    onRetry: _muat,
                  ),
                )
              : _order == null
                  ? const EmptyState(
                      icon: Icons.receipt_long_outlined,
                      title: 'Pesanan tidak ditemukan',
                      message: 'Pesanan mungkin sudah dihapus.',
                    )
                  : RefreshIndicator(
                      onRefresh: _muat,
                      child: ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.all(16),
                        children: [
                          _buildRingkasan(isPetani),
                          const SizedBox(height: 14),
                          const Text('Produk Dipesan', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                          const SizedBox(height: 8),
                          ..._order!.items.map(_buildItem),
                          const SizedBox(height: 14),
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Informasi Pengiriman', style: TextStyle(fontWeight: FontWeight.w700)),
                                  const SizedBox(height: 8),
                                  Text('Alamat: ${_order!.alamatPengiriman}', style: const TextStyle(fontSize: 13)),
                                  const SizedBox(height: 4),
                                  Text('Tanggal: ${formatTanggal(_order!.tanggalPesanan)}',
                                      style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          OutlinedButton.icon(
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => PaymentInfoScreen(order: _order!),
                                ),
                              );
                            },
                            icon: const Icon(Icons.payment_outlined),
                            label: const Text('Informasi Pembayaran'),
                          ),
                          if (isPetani && !_isUpdating) ..._buildTombolPetani(),
                          if (!isPetani && _order!.status == 'pending' && !_isUpdating) ...[
                            const SizedBox(height: 12),
                            OutlinedButton.icon(
                              onPressed: _batalkan,
                              icon: const Icon(Icons.cancel_outlined),
                              label: const Text('Batalkan Pesanan'),
                              style: OutlinedButton.styleFrom(foregroundColor: AppColors.danger),
                            ),
                          ],
                          if (_isUpdating)
                            const Padding(
                              padding: EdgeInsets.all(16),
                              child: Center(child: CircularProgressIndicator()),
                            ),
                        ],
                      ),
                    ),
    );
  }

  Widget _buildRingkasan(bool isPetani) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Pesanan #${_order!.id}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                StatusChip(
                  label: _order!.statusLabel,
                  color: orderStatusColor(_order!.status),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              isPetani ? 'Pembeli: ${_order!.buyerNama}' : 'Petani: ${_order!.farmerNama}',
              style: const TextStyle(fontSize: 13, color: AppColors.muted),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total', style: TextStyle(fontSize: 13, color: AppColors.muted)),
                Text(
                  formatRupiah(_order!.totalHarga),
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: AppColors.primary),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildItem(OrderItem item) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        title: Text(item.namaProduk, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        subtitle: Text(
          '${item.jumlah.toStringAsFixed(0)} × ${formatRupiah(item.hargaSatuan)}',
          style: const TextStyle(fontSize: 12),
        ),
        trailing: Text(
          formatRupiah(item.subtotal),
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
        ),
      ),
    );
  }

  List<Widget> _buildTombolPetani() {
    final status = _order!.status;
    final pilihan = _transisi[status] ?? <String>[];
    if (pilihan.isEmpty) return [];

    final label = <String, String>{
      'confirmed': 'Konfirmasi Pesanan',
      'processing': 'Mulai Proses',
      'shipped': 'Tandai Dikirim',
      'completed': 'Selesaikan Pesanan',
      'cancelled': 'Batalkan Pesanan',
    };

    return [
      const SizedBox(height: 12),
      const Text('Perbarui Status', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
      const SizedBox(height: 8),
      Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: pilihan.map((statusBaru) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: FilledButton.tonal(
              onPressed: () => _ubahStatus(statusBaru),
              child: Text(label[statusBaru] ?? statusBaru),
            ),
          );
        }).toList(),
      ),
    ];
  }
}
