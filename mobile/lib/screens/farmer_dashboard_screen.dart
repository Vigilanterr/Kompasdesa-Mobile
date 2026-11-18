import 'package:flutter/material.dart';

import '../services/api.dart';
import '../models/models.dart';
import '../config/theme.dart';
import '../widgets/widgets.dart';

/// Halaman dashboard petani.
class FarmerDashboardScreen extends StatefulWidget {
  const FarmerDashboardScreen({super.key});

  @override
  State<FarmerDashboardScreen> createState() => _FarmerDashboardScreenState();
}

class _FarmerDashboardScreenState extends State<FarmerDashboardScreen> {
  bool _isLoading = true;
  String? _error;
  DashboardPetani? _dash;

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
      final data = await ApiService.getDashboardPetani();
      if (!mounted) return;
      setState(() => _dash = data);
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _error = error.message);
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = 'Gagal memuat dashboard: $error');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: EmptyState(
                    icon: Icons.cloud_off_outlined,
                    title: 'Gagal memuat dashboard',
                    message: _error!,
                    onRetry: _muat,
                  ),
                )
              : _dash == null
                  ? const EmptyState(
                      icon: Icons.inbox_outlined,
                      title: 'Data kosong',
                      message: 'Belum ada data statistik.',
                    )
                  : CustomScrollView(
                      slivers: [
                        SliverToBoxAdapter(
                          child: Container(
                            padding: const EdgeInsets.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                  children: [
                                    _StatCard(
                                      title: 'Produk',
                                      value: _dash!.totalProducts.toString(),
                                      icon: Icons.inventory,
                                      color: AppColors.primary,
                                    ),
                                    _StatCard(
                                      title: 'Aktif',
                                      value: _dash!.availableProducts.toString(),
                                      icon: Icons.check_circle,
                                      color: Colors.green,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                  children: [
                                    _StatCard(
                                      title: 'Pesanan',
                                      value: _dash!.totalOrders.toString(),
                                      icon: Icons.receipt_long,
                                      color: Colors.blue,
                                    ),
                                    _StatCard(
                                      title: 'Selesai',
                                      value: _dash!.completedOrders.toString(),
                                      icon: Icons.check,
                                      color: AppColors.primary,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 24),
                                Text(
                                  'Total Pendapatan',
                                  style: const TextStyle(fontSize: 13, color: AppColors.muted),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  formatRupiah(_dash!.totalRevenue),
                                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.primary),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 6),
            Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: color)),
            const SizedBox(height: 4),
            Text(title, style: TextStyle(fontSize: 11, color: AppColors.muted)),
          ],
        ),
      ),
    );
  }
}