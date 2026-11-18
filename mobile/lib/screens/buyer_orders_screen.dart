import 'package:flutter/material.dart';

import 'orders_screen.dart';

/// Pesanan milik pembeli.
class BuyerOrdersScreen extends StatelessWidget {
  const BuyerOrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const OrdersListScreen(isFarmer: false);
  }
}
