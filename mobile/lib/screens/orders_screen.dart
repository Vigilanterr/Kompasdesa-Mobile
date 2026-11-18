import 'package:flutter/material.dart';

import '../services/api.dart';
import '../models/models.dart';
import 'order_detail_screen.dart';
import '../config/theme.dart';
import '../widgets/widgets.dart';

/// Daftar pesanan yang bisa dipakai pembeli maupun petani.
class OrdersListScreen extends StatefulWidget {
  final bool isFarmer;

  /// Filter awal, misalnya 'completed' untuk riwayat penjualan.
  final String? initialStatus;
  final bool showRevenue;

  const OrdersListScreen({
    super.key,
    required this.isFarmer,
    this.initialStatus,
    this.showRevenue = false,
  });

  @override
  State<OrdersListScreen> createState() => _OrdersListScreenState();
}

class _OrdersListScreenState extends State<OrdersListScreen> {
  bool _isLoading = true;
  String? _error;
  List<Order> _orders = [];
  String? _status;

  @override
  void initState() {
    super.initState();
    _status = widget.initialStatus;
    _muat();
  }

  Future<void> _muat() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final orders = await ApiService.getOrders();
      if (!mounted) return;
      setState(() => _orders = orders);
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

  List<Order> _tampil() {
    if (_status == null) return _orders;
    return _orders.where((o) => o.status == _status).toList();
  }

  double _totalPendapatan() {
    double total = 0;
    for (final o in _tampil()) {
      if (o.status != 'cancelled') total += o.totalHarga;
    }
    return total;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _muat,
        child: _isLoading
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
                : CustomScrollView(
                    slivers: [
                      if (widget.showRevenue)
                        SliverToBoxAdapter(
                          child: Container(
                            margin: const EdgeInsets.all(16),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Total Penjualan',
                                  style: TextStyle(color: Color(0xFFD1F2E2), fontSize: 12),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  formatRupiah(_totalPendapatan()),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 22,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      if (widget.initialStatus == null)
                        SliverToBoxAdapter(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
                            child: SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(
                                children: [
                                  _filterChip(null, 'Semua'),
                                  const SizedBox(width: 6),
                                  _filterChip('pending', 'Menunggu'),
                                  const SizedBox(width: 6),
                                  _filterChip('confirmed', 'Dikonfirmasi'),
                                  const SizedBox(width: 6),
                                  _filterChip('processing', 'Diproses'),
                                  const SizedBox(width: 6),
                                  _filterChip('shipped', 'Dikirim'),
                                  const SizedBox(width: 6),
                                  _filterChip('completed', 'Selesai'),
                                  const SizedBox(width: 6),
                                  _filterChip('cancelled', 'Batal'),
                                ],
                              ),
                            ),
                          ),
                        ),
                      if (_tampil().isEmpty)
                        const SliverFillRemaining(
                          hasScrollBody: false,
                          child: EmptyState(
                            icon: Icons.receipt_long_outlined,
                            title: 'Belum ada pesanan',
                            message: 'Pesanan yang masuk akan tampil di halaman ini.',
                          ),
                        )
                      else
                        SliverPadding(
                          padding: const EdgeInsets.all(12),
                          sliver: SliverList(
                            delegate: SliverChildBuilderDelegate(
                              (context, index) {
                                final o = _tampil()[index];
                                return _OrderTile(order: o, isFarmer: widget.isFarmer);
                              },
                              childCount: _tampil().length,
                            ),
                          ),
                        ),
                    ],
                  ),
      ),
    );
  }

  Widget _filterChip(String? value, String label) {
    return ChoiceChip(
      label: Text(label, style: const TextStyle(fontSize: 11)),
      selected: _status == value,
      selectedColor: AppColors.primary,
      checkmarkColor: Colors.white,
      labelStyle: TextStyle(
        color: _status == value ? Colors.white : AppColors.text,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(999),
        side: BorderSide(
          color: _status == value ? AppColors.primary : AppColors.border,
        ),
      ),
      onSelected: (_) => setState(() => _status = value),
    );
  }
}

class _OrderTile extends StatelessWidget {
  final Order order;
  final bool isFarmer;

  const _OrderTile({required this.order, required this.isFarmer});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => OrderDetailScreen(orderId: order.id),
            ),
          );
        },
        title: Row(
          children: [
            Expanded(
              child: Text(
                'Pesanan #${order.id}',
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
              ),
            ),
            StatusChip(
              label: order.statusLabel,
              color: orderStatusColor(order.status),
            ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 6),
            Text(
              isFarmer
                  ? 'Pembeli: ${order.buyerNama.isNotEmpty ? order.buyerNama : "ID ${order.buyerId}"}'
                  : 'Petani: ${order.farmerNama.isNotEmpty ? order.farmerNama : "ID ${order.farmerId}"}',
              style: const TextStyle(fontSize: 12),
            ),
            Text(
              '${formatRupiah(order.totalHarga)} • ${formatTanggal(order.tanggalPesanan)}',
              style: const TextStyle(fontSize: 11, color: AppColors.muted),
            ),
          ],
        ),
        trailing: const Icon(Icons.chevron_right, size: 18, color: AppColors.muted),
      ),
    );
  }
}
