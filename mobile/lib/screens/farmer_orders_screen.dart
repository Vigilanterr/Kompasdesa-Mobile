import 'package:flutter/material.dart';

import 'orders_screen.dart';

/// Pesanan yang masuk ke petani (semua status, bisa difilter).
class FarmerOrdersScreen extends StatelessWidget {
  const FarmerOrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const OrdersListScreen(isFarmer: true);
  }
}
