import 'package:flutter/material.dart';

import 'orders_screen.dart';

/// Riwayat penjualan petani: hanya pesanan dengan status completed.
class FarmerSalesScreen extends StatelessWidget {
  const FarmerSalesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const OrdersListScreen(
      isFarmer: true,
      initialStatus: 'completed',
      showRevenue: true,
    );
  }
}
