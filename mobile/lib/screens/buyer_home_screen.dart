import 'package:flutter/material.dart';

import '../services/api.dart';
import '../models/models.dart';
import '../config/theme.dart';
import '../widgets/widgets.dart';
import 'product_detail_screen.dart';

/// Layar beranda untuk pembeli.
class BuyerHomeScreen extends StatefulWidget {
  /// Callback ketika pengguna memilih produk utama atau ingin membuka katalog.
  final VoidCallback onOpenCatalog;
  final VoidCallback onOpenCart;

  const BuyerHomeScreen({
    super.key,
    required this.onOpenCatalog,
    required this.onOpenCart,
  });

  @override
  State<BuyerHomeScreen> createState() => _BuyerHomeScreenState();
}

class _BuyerHomeScreenState extends State<BuyerHomeScreen> {
  bool _isLoading = true;
  String? _error;
  AppUser? _user;
  List<Category> _categories = [];
  List<Product> _products = [];
  List<Product> _filteredProducts = [];
  String _search = '';
  int? _selectedCategoryId;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final user = await ApiService.getProfile();
      final categories = await ApiService.getCategories();
      final products = await ApiService.getProducts();
      if (!mounted) return;
      setState(() {
        _user = user;
        _categories = categories;
        _products = products;
        _applyFilter();
      });
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _applyFilter() {
    var list = _products;
    if (_selectedCategoryId != null) {
      list = list.where((p) => p.categoryId == _selectedCategoryId).toList();
    }
    if (_search.isNotEmpty) {
      final q = _search.trim().toLowerCase();
      list = list
          .where((p) =>
              p.namaProduk.toLowerCase().contains(q) ||
              p.deskripsi.toLowerCase().contains(q))
          .toList();
    }
    _filteredProducts = list;
  }

  void _onSearchChanged(String value) {
    setState(() {
      _search = value;
      _applyFilter();
    });
  }

  void _toggleCategory(int? id) {
    setState(() {
      _selectedCategoryId = id;
      _search = '';
      _applyFilter();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('KompasDesa'),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_cart_outlined),
            tooltip: 'Keranjang',
            onPressed: widget.onOpenCart,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetch,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(
                    child: EmptyState(
                      icon: Icons.cloud_off_outlined,
                      title: 'Gagal memuat data',
                      message: _error!,
                      onRetry: _fetch,
                    ),
                  )
                : CustomScrollView(
                    slivers: [
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _greeting(),
                                style: const TextStyle(fontSize: 12, color: AppColors.muted),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _user?.nama.isNotEmpty == true
                                    ? 'Halo, ${_user!.nama}!'
                                    : 'Selamat datang di KompasDesa.',
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                              ),
                              const SizedBox(height: 12),
                              _buildSearchBar(),
                              const SizedBox(height: 14),
                              const Text(
                                'Kategori',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                              ),
                              const SizedBox(height: 8),
                              _buildCategoryChips(),
                            ],
                          ),
                        ),
                      ),
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Produk Terbaru',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                              ),
                              TextButton(
                                onPressed: widget.onOpenCatalog,
                                child: const Text('Lihat Semua'),
                              ),
                            ],
                          ),
                        ),
                      ),
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                        sliver: SliverList(
                          delegate: SliverChildBuilderDelegate((context, index) {
                            return _buildProductCard(context, _filteredProducts[index]);
                          }, childCount: _filteredProducts.length),
                        ),
                      ),
                    ],
                  ),
      ),
    );
  }

  Widget _buildProductCard(BuildContext context, Product product) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => ProductDetailScreen(productId: product.id),
              ),
            );
          },
          borderRadius: BorderRadius.circular(16),
          child: Ink(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Hero(
                  tag: 'hero-${product.id}',
                  child: ProductImage(
                    url: product.fotoProduk,
                    width: double.infinity,
                    height: 140,
                    fallbackIcon: Icons.eco_outlined,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              product.namaProduk,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                            ),
                          ),
                          Text(
                            formatRupiah(product.harga),
                            style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text('${product.satuan} | Stok ${product.stok.toStringAsFixed(0)}',
                          style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                      const SizedBox(height: 4),
                      Text(
                        'Ketuk untuk melihat detail',
                        style: TextStyle(fontSize: 11, color: AppColors.primary.withValues(alpha: 0.8)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return TextField(
      onChanged: _onSearchChanged,
      decoration: InputDecoration(
        hintText: 'Cari sayur, buah, atau beras...',
        prefixIcon: const Icon(Icons.search, color: AppColors.muted),
        suffixIcon: _search.isNotEmpty
            ? IconButton(
                icon: const Icon(Icons.clear, color: AppColors.muted),
                onPressed: () => _onSearchChanged(''),
              )
            : null,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(999)),
      ),
    );
  }

  Widget _buildCategoryChips() {
    return SizedBox(
      height: 36,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _categoryChip(null, 'Semua'),
          const SizedBox(width: 8),
          ..._categories.map((c) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: _categoryChip(c.id, c.namaKategori),
              )),
        ],
      ),
    );
  }

  Widget _categoryChip(int? id, String label) {
    final active = _selectedCategoryId == id;
    return ChoiceChip(
      selected: active,
      selectedColor: AppColors.primary,
      checkmarkColor: Colors.white,
      label: Text(label),
      labelStyle: TextStyle(
        color: active ? Colors.white : AppColors.text,
        fontWeight: active ? FontWeight.w700 : FontWeight.w500,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(999),
        side: BorderSide(color: active ? AppColors.primary : AppColors.border),
      ),
      onSelected: (_) => _toggleCategory(id),
    );
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  }
}
