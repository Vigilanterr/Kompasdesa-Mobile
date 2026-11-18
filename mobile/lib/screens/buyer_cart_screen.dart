import 'package:flutter/material.dart';

import '../services/api.dart';
import 'buyer_checkout_screen.dart';
import '../models/models.dart';
import '../config/theme.dart';
import '../widgets/widgets.dart';

/// Layar keranjang pembeli.
class BuyerCartScreen extends StatefulWidget {
  /// Dipanggil setelah checkout berhasil untuk pindah ke tab pesanan.
  final VoidCallback? onCheckoutSuccess;

  const BuyerCartScreen({super.key, this.onCheckoutSuccess});

  @override
  State<BuyerCartScreen> createState() => _BuyerCartScreenState();
}

class _BuyerCartScreenState extends State<BuyerCartScreen> {
  bool _isLoading = true;
  List<CartItem> _items = [];
  String? _error;

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
      final cart = await ApiService.getCart();
      if (!mounted) return;
      setState(() => _items = cart.items);
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _error = error.message);
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = 'Gagal mengambil keranjang: $error');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  double _getTotal() {
    double total = 0;
    for (final item in _items) {
      total += item.subtotal;
    }
    return total;
  }

  Future<void> _updateQuantity(int itemId, double newQty) async {
    try {
      await ApiService.updateCartItem(itemId, newQty);
      if (!mounted) return;
      await _fetch();
    } on ApiException catch (error) {
      if (!mounted) return;
      _pesan(error.message, error: true);
    } catch (error) {
      if (!mounted) return;
      _pesan('Gagal memperbarui: $error', error: true);
    }
  }

  Future<void> _removeItem(int itemId) async {
    try {
      await ApiService.removeCartItem(itemId);
      if (!mounted) return;
      await _fetch();
    } on ApiException catch (error) {
      if (!mounted) return;
      _pesan(error.message, error: true);
    } catch (error) {
      if (!mounted) return;
      _pesan('Gagal menghapus: $error', error: true);
    }
  }

  Future<void> _clearCart() async {
    try {
      await ApiService.clearCart();
      if (!mounted) return;
      await _fetch();
    } on ApiException catch (error) {
      if (!mounted) return;
      _pesan(error.message, error: true);
    } catch (error) {
      if (!mounted) return;
      _pesan('Gagal mengosongkan keranjang: $error', error: true);
    }
  }

  void _pesan(String text, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(text), backgroundColor: error ? AppColors.danger : AppColors.primary),
    );
  }

  void _bukaCheckout() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => BuyerCheckoutScreen(
          items: _items,
          total: _getTotal(),
          onSelesai: widget.onCheckoutSuccess,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Keranjang Saya'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_forever_outlined),
            tooltip: 'Kosongkan keranjang',
            onPressed: _items.isEmpty ? null : _clearCart,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: EmptyState(
                    icon: Icons.cloud_off_outlined,
                    title: 'Gagal memuat keranjang',
                    message: _error!,
                    onRetry: _fetch,
                  ),
                )
              : _items.isEmpty
                  ? Center(
                      child: EmptyState(
                        icon: Icons.shopping_cart_outlined,
                        title: 'Keranjang Kosong',
                        message: 'Belum ada produk di keranjang. Temukan produk favoritmu!',
                        onRetry: _fetch,
                      ),
                    )
                  : Column(
                      children: [
                        Expanded(
                          child: ListView.builder(
                            padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
                            itemCount: _items.length,
                            itemBuilder: (context, index) {
                              final item = _items[index];
                              return _CartItemWidget(
                                item: item,
                                onUpdate: _updateQuantity,
                                onRemove: _removeItem,
                              );
                            },
                          ),
                        ),
                        _CartFooter(total: _getTotal(), onCheckout: _bukaCheckout),
                      ],
                    ),
    );
  }
}

class _CartItemWidget extends StatelessWidget {
  final CartItem item;
  final Function(int, double) onUpdate;
  final Function(int) onRemove;

  const _CartItemWidget({
    required this.item,
    required this.onUpdate,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            ProductImage(
              url: '', // API keranjang tidak mengirim URL foto.
              width: 64,
              height: 64,
              borderRadius: BorderRadius.circular(10),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.namaProduk,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    '${item.satuan} | ${formatRupiah(item.harga)}',
                    style: const TextStyle(fontSize: 11, color: AppColors.muted),
                  ),
                  Text(
                    'Subtotal ${formatRupiah(item.subtotal)}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            QuantityStepper(
              value: item.jumlah.toInt(),
              max: item.stok < 1 ? 1 : item.stok.toInt(),
              onChanged: (value) => onUpdate(item.id, value.toDouble()),
            ),
            TextButton.icon(
              onPressed: () => onRemove(item.id),
              icon: const Icon(Icons.delete, size: 16),
              label: const Text('Hapus'),
            ),
          ],
        ),
      ),
    );
  }
}

class _CartFooter extends StatelessWidget {
  final double total;
  final VoidCallback onCheckout;

  const _CartFooter({required this.total, required this.onCheckout});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Total', style: TextStyle(fontSize: 12, color: AppColors.muted)),
              Text(
                formatRupiah(total),
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.primary),
              ),
            ],
          ),
          FilledButton(onPressed: onCheckout, child: const Text('Checkout')),
        ],
      ),
    );
  }
}
