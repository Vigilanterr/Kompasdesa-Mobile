import 'package:flutter/material.dart';

import '../services/api.dart';
import 'buyer_cart_screen.dart';
import '../models/models.dart';
import '../config/theme.dart';
import '../widgets/widgets.dart';

class ProductDetailScreen extends StatefulWidget {
  final int productId;

  const ProductDetailScreen({super.key, required this.productId});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  bool _isLoading = true;
  bool _isAdding = false;
  String? _error;
  Product? _product;
  String _namaKategori = '-';
  int _quantity = 1;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final product = await ApiService.getProductById(widget.productId);
      String namaKategori = '-';
      try {
        final categories = await ApiService.getCategories();
        for (final category in categories) {
          if (category.id == product.categoryId) {
            namaKategori = category.namaKategori;
            break;
          }
        }
      } catch (_) {
        // Kategori hanya informational, tidak menggagalkan halaman.
      }
      if (!mounted) return;
      setState(() {
        _product = product;
        _namaKategori = namaKategori;
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

  Future<void> _addToCart() async {
    final product = _product;
    if (product == null) return;

    if (!product.isActive) {
      _pesan('Produk sedang tidak tersedia', error: true);
      return;
    }
    if (product.stok <= 0) {
      _pesan('Stok produk habis', error: true);
      return;
    }
    if (_quantity > product.stok) {
      _pesan('Jumlah melebihi stok yang tersedia', error: true);
      return;
    }

    setState(() => _isAdding = true);
    try {
      await ApiService.addToCart(
        productId: product.id,
        jumlah: _quantity.toDouble(),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Produk berhasil ditambahkan ke keranjang'),
          action: SnackBarAction(
            label: 'Lihat',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const BuyerCartScreen()),
              );
            },
          ),
        ),
      );
    } on ApiException catch (error) {
      _pesan(error.message, error: true);
    } catch (error) {
      _pesan('Gagal menambahkan ke keranjang: $error', error: true);
    } finally {
      if (mounted) setState(() => _isAdding = false);
    }
  }

  void _pesan(String text, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(text), backgroundColor: error ? AppColors.danger : AppColors.primary),
    );
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
                    title: 'Gagal memuat produk',
                    message: _error!,
                    onRetry: _load,
                  ),
                )
              : _product == null
                  ? const EmptyState(
                      icon: Icons.inventory_2_outlined,
                      title: 'Produk tidak ditemukan',
                      message: 'Produk mungkin sudah dihapus.',
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            _buildHero(),
                            Padding(
                              padding: const EdgeInsets.all(20),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Row(
                                    children: [
                                      StatusChip(
                                        label: _product!.statusLabel,
                                        color: _product!.isActive ? AppColors.primary : AppColors.muted,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Kategori: $_namaKategori',
                                        style: const TextStyle(fontSize: 12, color: AppColors.muted),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    _product!.namaProduk,
                                    style: const TextStyle(
                                      fontSize: 21,
                                      fontWeight: FontWeight.w800,
                                      height: 1.25,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    '${formatRupiah(_product!.harga)} / ${_product!.satuan}',
                                    style: const TextStyle(
                                      fontSize: 19,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                  const SizedBox(height: 18),
                                  const Text(
                                    'Deskripsi',
                                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    _product!.deskripsi.isEmpty
                                        ? 'Belum ada deskripsi.'
                                        : _product!.deskripsi,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      color: AppColors.muted,
                                      height: 1.6,
                                    ),
                                  ),
                                  const SizedBox(height: 18),
                                  _buildInfoRow(
                                    Icons.inventory_2_outlined,
                                    'Stok tersedia',
                                    '${_product!.stok.toStringAsFixed(0)} ${_product!.satuan}',
                                  ),
                                  _buildInfoRow(
                                    Icons.agriculture_outlined,
                                    'Petani',
                                    'ID petani ${_product!.farmerId}',
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
      bottomNavigationBar: _product == null
          ? null
          : _buildBottomBar(),
    );
  }

  Widget _buildHero() {
    return Stack(
      children: [
        ProductImage(
          url: _product!.fotoProduk,
          height: 280,
          width: double.infinity,
          borderRadius: BorderRadius.zero,
        ),
        Positioned(
          top: 12,
          left: 12,
          child: CircleAvatar(
            backgroundColor: Colors.white.withValues(alpha: 0.92),
            child: IconButton(
              icon: const Icon(Icons.arrow_back, color: AppColors.text),
              onPressed: () => Navigator.of(context).pop(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, size: 19, color: AppColors.primary),
          const SizedBox(width: 10),
          Text(label, style: const TextStyle(fontSize: 13, color: AppColors.muted)),
          const Spacer(),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    final bisaDibeli = _product!.isActive && _product!.stok > 0;
    final max = _product!.stok < 1 ? 1 : _product!.stok.toInt();

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: SafeArea(
        child: Row(
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Jumlah', style: TextStyle(fontSize: 11, color: AppColors.muted)),
                const SizedBox(height: 4),
                QuantityStepper(
                  value: _quantity,
                  max: max,
                  onChanged: (value) => setState(() => _quantity = value),
                ),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: FilledButton.icon(
                onPressed: bisaDibeli && !_isAdding ? _addToCart : null,
                icon: _isAdding
                    ? const SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Icon(Icons.add_shopping_cart, size: 18),
                label: Text(
                  !bisaDibeli ? 'Tidak tersedia' : 'Tambah ke Keranjang',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
