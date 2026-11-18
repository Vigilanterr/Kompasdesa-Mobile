import 'dart:convert';

/// Model data dibuat sederhana: constructor, fromJson, dan toJson bila perlu.
/// Nama field Di sini mengikuti nama kolom database yang dikirim backend.

int toInt(dynamic value) {
  if (value == null) return 0;
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value.toString()) ?? 0;
}

double toDouble(dynamic value) {
  if (value == null) return 0;
  if (value is double) return value;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString()) ?? 0;
}

String toStringValue(dynamic value) {
  if (value == null) return '';
  return value.toString();
}

DateTime? toDateTime(dynamic value) {
  if (value == null) return null;
  return DateTime.tryParse(value.toString());
}

class AppUser {
  final int id;
  final String nama;
  final String email;
  final String noHp;
  final String alamat;
  final String role;

  AppUser({
    required this.id,
    required this.nama,
    required this.email,
    required this.noHp,
    required this.alamat,
    required this.role,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: toInt(json['id']),
      nama: toStringValue(json['nama']),
      email: toStringValue(json['email']),
      noHp: toStringValue(json['no_hp']),
      alamat: toStringValue(json['alamat']),
      role: toStringValue(json['role']),
    );
  }

  bool get isPetani => role == 'petani';

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nama': nama,
      'email': email,
      'no_hp': noHp,
      'alamat': alamat,
      'role': role,
    };
  }
}

class Category {
  final int id;
  final String namaKategori;
  final String deskripsi;

  Category({
    required this.id,
    required this.namaKategori,
    required this.deskripsi,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: toInt(json['id']),
      namaKategori: toStringValue(json['nama_kategori']),
      deskripsi: toStringValue(json['deskripsi']),
    );
  }
}

class Product {
  final int id;
  final int farmerId;
  final int categoryId;
  final String namaProduk;
  final String deskripsi;
  final double harga;
  final double stok;
  final String satuan;
  final String fotoProduk;
  final String status;
  final DateTime? createdAt;

  Product({
    required this.id,
    required this.farmerId,
    required this.categoryId,
    required this.namaProduk,
    required this.deskripsi,
    required this.harga,
    required this.stok,
    required this.satuan,
    required this.fotoProduk,
    required this.status,
    this.createdAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: toInt(json['id']),
      farmerId: toInt(json['farmer_id']),
      categoryId: toInt(json['category_id']),
      namaProduk: toStringValue(json['nama_produk']),
      deskripsi: toStringValue(json['deskripsi']),
      harga: toDouble(json['harga']),
      stok: toDouble(json['stok']),
      satuan: toStringValue(json['satuan']),
      fotoProduk: toStringValue(json['foto_produk']),
      status: toStringValue(json['status']),
      createdAt: toDateTime(json['created_at']),
    );
  }

  bool get isActive => status == 'active';

  /// Teks status yang ramah dibaca pengguna.
  String get statusLabel {
    switch (status) {
      case 'active':
        return 'Tersedia';
      case 'inactive':
        return 'Nonaktif';
      case 'draft':
        return 'Draft';
      case 'out_of_stock':
        return 'Stok Habis';
      default:
        return status.isEmpty ? '-' : status;
    }
  }

  /// Kirim status yang benar sesuai ENUM database.
  /// ponytail: backend validator masih memakai 'Ready'/'sold out',
  /// enum DB memakai 'active'/'inactive'. Lihat laporan.
  Map<String, dynamic> toJson({int? newCategoryId, String? statusValue}) {
    return {
      'category_id': newCategoryId ?? categoryId,
      'nama_produk': namaProduk,
      'deskripsi': deskripsi,
      'harga': harga,
      'stok': stok.toInt(),
      'satuan': satuan,
      'foto_produk': fotoProduk,
      'status': statusValue ?? status,
    };
  }
}

class CartItem {
  final int id;
  final int productId;
  final double jumlah;
  final String namaProduk;
  final double harga;
  final double stok;
  final String satuan;

  CartItem({
    required this.id,
    required this.productId,
    required this.jumlah,
    required this.namaProduk,
    required this.harga,
    required this.stok,
    required this.satuan,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      id: toInt(json['id']),
      productId: toInt(json['product_id']),
      jumlah: toDouble(json['jumlah']),
      namaProduk: toStringValue(json['nama_produk']),
      harga: toDouble(json['harga']),
      stok: toDouble(json['stok']),
      satuan: toStringValue(json['satuan']),
    );
  }

  double get subtotal => harga * jumlah;
}

class Cart {
  final int id;
  final int buyerId;
  final List<CartItem> items;
  final double total;

  Cart({
    required this.id,
    required this.buyerId,
    required this.items,
    required this.total,
  });

  factory Cart.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'];
    final list = <CartItem>[];
    if (rawItems is List) {
      for (final item in rawItems) {
        if (item is Map<String, dynamic>) {
          list.add(CartItem.fromJson(item));
        } else if (item is Map) {
          list.add(CartItem.fromJson(Map<String, dynamic>.from(item)));
        }
      }
    }
    return Cart(
      id: toInt(json['id']),
      buyerId: toInt(json['buyer_id']),
      items: list,
      total: toDouble(json['total']),
    );
  }
}

class OrderItem {
  final int id;
  final int orderId;
  final int productId;
  final String namaProduk;
  final double jumlah;
  final double hargaSatuan;
  final double subtotal;

  OrderItem({
    required this.id,
    required this.orderId,
    required this.productId,
    required this.namaProduk,
    required this.jumlah,
    required this.hargaSatuan,
    required this.subtotal,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: toInt(json['id']),
      orderId: toInt(json['order_id']),
      productId: toInt(json['product_id']),
      namaProduk: toStringValue(json['nama_produk']),
      jumlah: toDouble(json['jumlah']),
      hargaSatuan: toDouble(json['harga_satuan']),
      subtotal: toDouble(json['subtotal']),
    );
  }
}

class Order {
  final int id;
  final int buyerId;
  final int farmerId;
  final String tanggalPesanan;
  final String alamatPengiriman;
  final double totalHarga;
  final String status;
  final String farmerNama;
  final String buyerNama;
  final List<OrderItem> items;

  Order({
    required this.id,
    required this.buyerId,
    required this.farmerId,
    required this.tanggalPesanan,
    required this.alamatPengiriman,
    required this.totalHarga,
    required this.status,
    required this.farmerNama,
    required this.buyerNama,
    this.items = const [],
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'];
    final list = <OrderItem>[];
    if (rawItems is List) {
      for (final item in rawItems) {
        if (item is Map) {
          list.add(OrderItem.fromJson(Map<String, dynamic>.from(item)));
        }
      }
    }
    return Order(
      id: toInt(json['id']),
      buyerId: toInt(json['buyer_id']),
      farmerId: toInt(json['farmer_id']),
      tanggalPesanan: toStringValue(json['tanggal_pesanan'] ?? json['created_at']),
      alamatPengiriman: toStringValue(json['alamat_pengiriman']),
      totalHarga: toDouble(json['total_harga']),
      status: toStringValue(json['status']),
      farmerNama: toStringValue(json['farmer_nama']),
      buyerNama: toStringValue(json['buyer_nama']),
      items: list,
    );
  }

  DateTime? get tanggal => toDateTime(tanggalPesanan);

  String get statusLabel {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'confirmed':
        return 'Dikonfirmasi';
      case 'processing':
        return 'Diproses';
      case 'shipped':
        return 'Dikirim';
      case 'completed':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status.isEmpty ? '-' : status;
    }
  }
}

/// Status pembayaran dibaca dari tabel payments bila tersedia.
class PaymentInfo {
  final int id;
  final int orderId;
  final String metodePembayaran;
  final String transactionId;
  final double jumlahPembayaran;
  final String status;
  final String tanggalPembayaran;

  PaymentInfo({
    required this.id,
    required this.orderId,
    required this.metodePembayaran,
    required this.transactionId,
    required this.jumlahPembayaran,
    required this.status,
    required this.tanggalPembayaran,
  });

  factory PaymentInfo.fromJson(Map<String, dynamic> json) {
    return PaymentInfo(
      id: toInt(json['id']),
      orderId: toInt(json['order_id']),
      metodePembayaran: toStringValue(json['metode_pembayaran']),
      transactionId: toStringValue(json['transaction_id']),
      jumlahPembayaran: toDouble(json['jumlah_pembayaran']),
      status: toStringValue(json['status']),
      tanggalPembayaran: toStringValue(json['tanggal_pembayaran']),
    );
  }

  String get statusLabel {
    switch (status) {
      case 'pending':
        return 'Menunggu Pembayaran';
      case 'paid':
        return 'Lunas';
      case 'failed':
        return 'Gagal';
      case 'expired':
        return 'Kedaluwarsa';
      case 'refunded':
        return 'Dikembalikan';
      default:
        return status.isEmpty ? '-' : status;
    }
  }
}

class DashboardPetani {
  final int totalProducts;
  final int availableProducts;
  final int totalOrders;
  final int completedOrders;
  final double totalRevenue;

  DashboardPetani({
    required this.totalProducts,
    required this.availableProducts,
    required this.totalOrders,
    required this.completedOrders,
    required this.totalRevenue,
  });

  factory DashboardPetani.fromJson(Map<String, dynamic> json) {
    return DashboardPetani(
      totalProducts: toInt(json['total_products']),
      availableProducts: toInt(json['available_products']),
      totalOrders: toInt(json['total_orders']),
      completedOrders: toInt(json['completed_orders']),
      totalRevenue: toDouble(json['total_revenue']),
    );
  }
}

class DashboardPembeli {
  final int totalOrders;
  final int pendingOrders;
  final int completedOrders;
  final List<Order> recentOrders;

  DashboardPembeli({
    required this.totalOrders,
    required this.pendingOrders,
    required this.completedOrders,
    required this.recentOrders,
  });

  factory DashboardPembeli.fromJson(Map<String, dynamic> json) {
    final raw = json['recent_orders'];
    final list = <Order>[];
    if (raw is List) {
      for (final item in raw) {
        if (item is Map) {
          list.add(Order.fromJson(Map<String, dynamic>.from(item)));
        }
      }
    }
    return DashboardPembeli(
      totalOrders: toInt(json['total_orders']),
      pendingOrders: toInt(json['pending_orders']),
      completedOrders: toInt(json['completed_orders']),
      recentOrders: list,
    );
  }
}

/// Parsing aman untuk response API yang bentuknya bisa berubah.
Map<String, dynamic> asMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return <String, dynamic>{};
}

List<Map<String, dynamic>> asMapList(dynamic value) {
  final result = <Map<String, dynamic>>[];
  if (value is List) {
    for (final item in value) {
      if (item is Map) {
        result.add(Map<String, dynamic>.from(item));
      }
    }
  }
  return result;
}

/// Decode response.json → Map. Dipakai api.dart.
Map<String, dynamic> decodeBody(String body) {
  try {
    final decoded = jsonDecode(body);
    if (decoded is Map) return Map<String, dynamic>.from(decoded);
  } catch (_) {
    // Dibiarkan kosong agar diproses sebagai respons tidak valid.
  }
  return {};
}
