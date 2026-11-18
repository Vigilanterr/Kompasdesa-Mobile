import 'package:flutter/material.dart';

import '../services/api.dart';
import '../models/models.dart';
import 'product_detail_screen.dart';
import '../config/theme.dart';
import '../widgets/widgets.dart';

/// Katalog produk dengan pencarian dan filter kategori.
class BuyerCatalogScreen extends StatefulWidget {
  const BuyerCatalogScreen({super.key});

  @override
  State<BuyerCatalogScreen> createState() => _BuyerCatalogScreenState();
}

class _BuyerCatalogScreenState extends State<BuyerCatalogScreen> {
  bool _isLoading = true;
  String? _error;
  List<Product> _products = [];
  List<Category> _categories = [];
  List<Product> _tampil = [];
  String _search = '';
  int? _kategoriId;

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
      final products = await ApiService.getProducts();
      final categories = await ApiService.getCategories();
      if (!mounted) return;
      setState(() {
        _products = products;
        _categories = categories;
        _terapkanFilter();
      });
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

  void _terapkanFilter() {
    var list = _products;
    if (_kategoriId != null) {
      list = list.where((p) => p.categoryId == _kategoriId).toList();
    }
    if (_search.trim().isNotEmpty) {
      final q = _search.trim().toLowerCase();
      list = list
          .where((p) =>
              p.namaProduk.toLowerCase().contains(q) ||
              p.deskripsi.toLowerCase().contains(q))
          .toList();
    }
    _tampil = list;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Jelajahi Produk')),
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
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                          child: Column(
                            children: [
                              TextField(
                                onChanged: (value) {
                                  setState(() {
                                    _search = value;
                                    _terapkanFilter();
                                  });
                                },
                                decoration: const InputDecoration(
                                  hintText: 'Cari produk pertanian...',
                                  prefixIcon: Icon(Icons.search),
                                ),
                              ),
                              const SizedBox(height: 12),
                              SizedBox(
                                height: 36,
                                child: ListView(
                                  scrollDirection: Axis.horizontal,
                                  children: [
                                    _chip(null, 'Semua'),
                                    const SizedBox(width: 8),
                                    ..._categories.map(
                                      (c) => Padding(
                                        padding: const EdgeInsets.only(right: 8),
                                        child: _chip(c.id, c.namaKategori),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      if (_tampil.isEmpty)
                        const SliverFillRemaining(
                          hasScrollBody: false,
                          child: EmptyState(
                            icon: Icons.search_off_outlined,
                            title: 'Produk tidak ditemukan',
                            message: 'Coba kata kunci lain atau pilih kategori berbeda.',
                          ),
                        )
                      else
                        SliverPadding(
                          padding: const EdgeInsets.fromLTRB(12, 8, 12, 80),
                          sliver: SliverGrid(
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              mainAxisSpacing: 10,
                              crossAxisSpacing: 10,
                              childAspectRatio: 0.72,
                            ),
                            delegate: SliverChildBuilderDelegate((context, index) {
                              final product = _tampil[index];
                              return _ProductCard(product: product);
                            }, childCount: _tampil.length),
                          ),
                        ),
                    ],
                  ),
      ),
    );
  }

  Widget _chip(int? id, String label) {
    final aktif = _kategoriId == id;
    return ChoiceChip(
      label: Text(label),
      selected: aktif,
      selectedColor: AppColors.primary,
      checkmarkColor: Colors.white,
      labelStyle: TextStyle(
        color: aktif ? Colors.white : AppColors.text,
        fontSize: 12,
        fontWeight: aktif ? FontWeight.w700 : FontWeight.w500,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(999),
        side: BorderSide(color: aktif ? AppColors.primary : AppColors.border),
      ),
      onSelected: (_) {
        setState(() {
          _kategoriId = id;
          _terapkanFilter();
        });
      },
    );
  }
}

class _ProductCard extends StatelessWidget {
  final Product product;

  const _ProductCard({required this.product});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => ProductDetailScreen(productId: product.id),
            ),
          );
        },
        borderRadius: BorderRadius.circular(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ProductImage(
              url: product.fotoProduk,
              width: double.infinity,
              height: 110,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.namaProduk,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    formatRupiah(product.harga),
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'per ${product.satuan} • stok ${product.stok.toStringAsFixed(0)}',
                    style: const TextStyle(fontSize: 10, color: AppColors.muted),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
