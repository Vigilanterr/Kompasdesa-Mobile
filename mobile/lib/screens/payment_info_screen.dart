import 'package:flutter/material.dart';

import '../services/api.dart';
import '../models/models.dart';
import '../config/theme.dart';
import '../widgets/widgets.dart';

/// Layar informasi pembayaran.
///
/// Backend saat ini tidak memiliki endpoint pembayaran yang aktif:
/// file backend/src/routes/payment.route.ts seluruhnya dikomentari.
/// Karena itu layar ini tidak bisa membuat transaksi Midtrans atau
/// menampilkan status pembayaran dari server. Yang ditampilkan adalah
/// status pesanan dari endpoint /api/orders/:id yang benar-benar ada.
class PaymentInfoScreen extends StatefulWidget {
  final Order order;

  const PaymentInfoScreen({super.key, required this.order});

  @override
  State<PaymentInfoScreen> createState() => _PaymentInfoScreenState();
}

class _PaymentInfoScreenState extends State<PaymentInfoScreen> {
  bool _isLoading = false;
  late Order _order;

  @override
  void initState() {
    super.initState();
    _order = widget.order;
  }

  Future<void> _refresh() async {
    setState(() => _isLoading = true);
    try {
      final order = await ApiService.getOrderById(_order.id);
      if (!mounted) return;
      setState(() => _order = order);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Gagal menyegar status pesanan')),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pembayaran')),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.info_outline, size: 36, color: AppColors.primary),
                      const SizedBox(height: 10),
                      const Text(
                        'Pembayaran Belum Tersedia',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Endpoint pembayaran Midtrans di backend belum diaktifkan. '
                        'Status pembayaran tidak bisa dibuat atau dicek dari aplikasi. '
                        'Pesanan tetap tersimpan dan statusnya dapat dipantau di sini.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 13, color: AppColors.muted, height: 1.5),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Pesanan #${_order.id}',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Total', style: TextStyle(color: AppColors.muted)),
                            Text(
                              formatRupiah(_order.totalHarga),
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                        const Divider(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Status pesanan', style: TextStyle(color: AppColors.muted)),
                            StatusChip(
                              label: _order.statusLabel,
                              color: orderStatusColor(_order.status),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: _isLoading ? null : _refresh,
                  icon: _isLoading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Icon(Icons.refresh),
                  label: const Text('Segar Status Pesanan'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
