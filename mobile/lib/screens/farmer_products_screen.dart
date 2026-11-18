import 'package:flutter/material.dart';

import '../services/api.dart';
import '../models/models.dart';
import 'product_detail_screen.dart';
import 'product_form_screen.dart';
import '../config/session.dart';
import '../config/theme.dart';
import '../widgets/widgets.dart';

/// Kelola produk milik petani yang login.
class FarmerProductsScreen extends StatefulWidget {
  const FarmerProductsScreen({super.key});

  @override
  State<FarmerProductsScreen> createState() => _FarmerProductsScreenState();
}

class _FarmerProductsScreenState extends State<FarmerProductsScreen> {
  bool _isLoading = true;
  String? _error;
  List<Product> _products = [];
  String _search = '';

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
      final all = await ApiService.getProducts();
      final meId = Session.user?.id;
      final mine = all.where((p) => p.farmerId == meId).toList();
      if (!mounted) return;
      setState(() => _products = mine);
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _error = error.message);
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = 'Gagal memuat produk: $error');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<Product> _tampil() {
    if (_search.trim().isEmpty) return _products;
    final q = _search.trim().toLowerCase();
    return _products
        .where((p) => p.namaProduk.toLowerCase().contains(q))
        .toList();
  }

  void _pesan(String text, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(text), backgroundColor: error ? AppColors.danger : AppColors.primary),
    );
  }

  Future<void> _tambah() async {
    final ok = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const ProductFormScreen()),
    );
    if (ok == true) {
      _pesan('Produk berhasil ditambahkan');
      _muat();
    }
  }

  Future<void> _edit(Product product) async {
    final ok = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => ProductFormScreen(product: product)),
    );
    if (ok == true) {
      _pesan('Produk berhasil diperbarui');
      _muat();
    }
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
                      title: 'Gagal memuat produk',
                      message: _error!,
                      onRetry: _muat,
                    ),
                  )
                : CustomScrollView(
                    slivers: [
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              TextField(
                                onChanged: (v) => setState(() => _search = v),
                                decoration: const InputDecoration(
                                  hintText: 'Cari produk milik Anda...',
                                  prefixIcon: Icon(Icons.search),
                                ),
                              ),
                              const SizedBox(height: 8),
                              FilledButton.icon(
                                onPressed: _tambah,
                                icon: const Icon(Icons.add),
                                label: const Text('Tambah Produk Baru'),
                              ),
                            ],
                          ),
                        ),
                      ),
                      if (_tampil().isEmpty)
                        const SliverFillRemaining(
                          hasScrollBody: false,
                          child: EmptyState(
                            icon: Icons.grass_outlined,
                            title: 'Belum ada produk',
                            message: 'Tambahkan produk pertama Anda untuk mulai menjual.',
                          ),
                        )
                      else
                        SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, index) {
                              final p = _tampil()[index];
                              return _ProductRow(
                                product: p,
                                onTap: () => _edit(p),
                              );
                            },
                            childCount: _tampil().length,
                          ),
                        ),
                    ],
                  ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _tambah,
        label: const Text('Tambah Produk'),
        icon: const Icon(Icons.add),
      ),
    );
  }
}

class _ProductRow extends StatelessWidget {
  final Product product;
  final VoidCallback onTap;

  const _ProductRow({
    required this.product,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: ListTile(
        onTap: onTap,
        leading: ProductImage(
          url: product.fotoProduk,
          width: 56,
          height: 56,
          borderRadius: BorderRadius.circular(8),
        ),
        title: Text(product.namaProduk, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Text(
          '${formatRupiah(product.harga)} / ${product.satuan} | Stok ${product.stok.toStringAsFixed(0)}',
          style: const TextStyle(fontSize: 12),
        ),
        trailing: PopupMenuButton<String>(
          onSelected: (value) {
            if (value == 'edit') {
              onTap();
            } else if (value == 'view') {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => ProductDetailScreen(productId: product.id),
                ),
              );
            }
          },
          itemBuilder: (_) => const [
            PopupMenuItem(
              value: 'edit',
              child: Row(
                children: [
                  Icon(Icons.edit_outlined, size: 16),
                  SizedBox(width: 8),
                  Text('Edit / Hapus'),
                ],
              ),
            ),
            PopupMenuItem(
              value: 'view',
              child: Row(
                children: [
                  Icon(Icons.visibility_outlined, size: 16),
                  SizedBox(width: 8),
                  Text('Lihat Detail'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
