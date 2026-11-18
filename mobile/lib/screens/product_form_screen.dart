import 'package:flutter/material.dart';

import '../services/api.dart';
import '../models/models.dart';
import '../config/theme.dart';

/// Form untuk menambah atau mengedit produk petani.
/// Semua input divalidasi sebelum dikirim ke API /api/products.
class ProductFormScreen extends StatefulWidget {
  final Product? product;

  const ProductFormScreen({super.key, this.product});

  @override
  State<ProductFormScreen> createState() => _ProductFormScreenState();
}

class _ProductFormScreenState extends State<ProductFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _namaController = TextEditingController();
  final _deskripsiController = TextEditingController();
  final _hargaController = TextEditingController();
  final _stokController = TextEditingController();
  final _satuanController = TextEditingController();
  final _fotoController = TextEditingController();

  bool _isLoading = false;
  List<Category> _categories = [];
  Category? _selectedCategory;

  @override
  void initState() {
    super.initState();
    _muatKategori();
    if (widget.product != null) {
      _namaController.text = widget.product!.namaProduk;
      _deskripsiController.text = widget.product!.deskripsi;
      _hargaController.text = widget.product!.harga.toStringAsFixed(0);
      _stokController.text = widget.product!.stok.toStringAsFixed(0);
      _satuanController.text = widget.product!.satuan;
      _fotoController.text = widget.product!.fotoProduk;
    }
  }

  Future<void> _muatKategori() async {
    try {
      final categories = await ApiService.getCategories();
      if (!mounted) return;
      setState(() => _categories = categories);
      if (widget.product != null) {
        final found = categories.where((c) => c.id == widget.product!.categoryId).firstOrNull;
        if (found != null) {
          setState(() => _selectedCategory = found);
        }
      }
    } catch (_) {
      // Kategori gagal dimuat tetap bisa form diisi manual.
    }
  }

  void _tambahKategori() async {
    final input = TextEditingController();
    final deskripsiController = TextEditingController();
    await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Tambah Kategori'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: input,
              decoration: const InputDecoration(labelText: 'Nama Kategori'),
            ),
            TextField(
              controller: deskripsiController,
              decoration: const InputDecoration(labelText: 'Deskripsi (opsional)'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Batal')),
          FilledButton(
            onPressed: () async {
              if (input.text.trim().isEmpty) return;
              try {
                final kategori = await ApiService.createCategory(
                  input.text.trim(),
                  deskripsiController.text.trim(),
                );
                await _muatKategori();
                setState(() => _selectedCategory = kategori);
                if (!mounted) return;
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Kategori berhasil ditambahkan')),
                );
              } on ApiException catch (error) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(error.message), backgroundColor: AppColors.danger),
                );
              } catch (error) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Gagal menambah kategori: $error'), backgroundColor: AppColors.danger),
                );
              }
            },
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
  }

  String? _validasiAngka(String? value, String label) {
    if (value == null || value.trim().isEmpty) return '$label wajib diisi';
    final angka = double.tryParse(value.trim());
    if (angka == null) return '$label harus berupa angka';
    return null;
  }

  Future<void> _simpan() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih kategori produk')),
      );
      return;
    }

    final nama = _namaController.text.trim();
    final deskripsi = _deskripsiController.text.trim();
    final harga = double.tryParse(_hargaController.text.trim()) ?? 0;
    final stok = int.tryParse(_stokController.text.trim()) ?? 0;
    final satuan = _satuanController.text.trim();
    final foto = _fotoController.text.trim();

    if (harga <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Harga harus lebih dari 0')),
      );
      return;
    }
    if (stok < 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Stok tidak boleh negatif')),
      );
      return;
    }
    if (foto.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Masukkan URL foto produk')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      if (widget.product == null) {
        await ApiService.createProduct(
          categoryId: _selectedCategory!.id,
          namaProduk: nama,
          deskripsi: deskripsi,
          harga: harga,
          stok: stok,
          satuan: satuan,
          fotoProduk: foto,
        );
      } else {
        await ApiService.updateProduct(
          widget.product!.id,
          {
            'category_id': _selectedCategory!.id,
            'nama_produk': nama,
            'deskripsi': deskripsi,
            'harga': harga,
            'stok': stok,
            'satuan': satuan,
            'foto_produk': foto,
          },
        );
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Produk berhasil disimpan')),
      );
      Navigator.of(context).pop(true);
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message), backgroundColor: AppColors.danger),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal menyimpan: $error'), backgroundColor: AppColors.danger),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _namaController.dispose();
    _deskripsiController.dispose();
    _hargaController.dispose();
    _stokController.dispose();
    _satuanController.dispose();
    _fotoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.product == null ? 'Tambah Produk' : 'Edit Produk')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: ListView(
                  children: [
                    DropdownButtonFormField<Category>(
                      initialValue: _selectedCategory,
                      hint: const Text('Pilih Kategori'),
                      decoration: const InputDecoration(labelText: 'Kategori *'),
                      items: _categories.map((c) {
                        return DropdownMenuItem(
                          value: c,
                          child: Text(c.namaKategori),
                        );
                      }).toList(),
                      onChanged: (c) => setState(() => _selectedCategory = c),
                      validator: (value) => value == null ? 'Pilih kategori' : null,
                    ),
                    const SizedBox(height: 12),
                    if (_categories.isEmpty && _selectedCategory == null) ...[
                      TextButton.icon(
                        onPressed: _tambahKategori,
                        icon: const Icon(Icons.add, size: 16),
                        label: const Text('Buat Kategori Baru'),
                      ),
                      const SizedBox(height: 12),
                    ],
                    TextFormField(
                      controller: _namaController,
                      decoration: const InputDecoration(labelText: 'Nama Produk *'),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Nama wajib diisi' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _deskripsiController,
                      decoration: const InputDecoration(labelText: 'Deskripsi *'),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Deskripsi wajib diisi' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _hargaController,
                      decoration: const InputDecoration(labelText: 'Harga *'),
                      keyboardType: TextInputType.number,
                      validator: (v) => _validasiAngka(v, 'Harga'),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _stokController,
                      decoration: const InputDecoration(labelText: 'Stok *'),
                      keyboardType: TextInputType.number,
                      validator: (v) => _validasiAngka(v, 'Stok'),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _satuanController,
                      decoration: const InputDecoration(labelText: 'Satuan * (contoh: kg, ons, kg)',
                      ),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Satuan wajib diisi' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _fotoController,
                      decoration: const InputDecoration(
                        labelText: 'URL Foto Produk *',
                        hintText: 'https://...',
                        helperText: 'Tidak ada fitur upload foto; masukkan URL gambar.',
                      ),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'URL foto wajib diisi' : null,
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _isLoading ? null : _simpan,
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : Text(widget.product == null ? 'Tambah' : 'Simpan Perubahan'),
                    ),
                    if (widget.product != null) ...[
                      const SizedBox(height: 10),
                      OutlinedButton.icon(
                        onPressed: _isLoading ? null : () => _hapusKonfirm(),
                        icon: const Icon(Icons.delete_outline),
                        label: const Text('Hapus Produk'),
                        style: OutlinedButton.styleFrom(foregroundColor: AppColors.danger),
                      ),
                    ],
                  ],
                ),
              ),
            ),
    );
  }

  Future<void> _hapusKonfirm() async {
    final ya = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Hapus Produk'),
        content: const Text('Yakin ingin menghapus produk ini?'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Batal')),
          FilledButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Hapus')),
        ],
      ),
    );
    if (ya != true) return;

    setState(() => _isLoading = true);
    try {
      await ApiService.deleteProduct(widget.product!.id);
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message), backgroundColor: AppColors.danger),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal menghapus: $error'), backgroundColor: AppColors.danger),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
}
