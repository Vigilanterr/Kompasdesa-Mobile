import 'package:flutter/material.dart';

import '../screens/farmer_dashboard_screen.dart';
import '../screens/farmer_orders_screen.dart';
import '../screens/farmer_products_screen.dart';
import '../screens/farmer_sales_screen.dart';
import '../screens/profile_screen.dart';

/// Navigasi utama untuk role petani.
class FarmerShell extends StatefulWidget {
  const FarmerShell({super.key});

  @override
  State<FarmerShell> createState() => _FarmerShellState();
}

class _FarmerShellState extends State<FarmerShell> {
  int _index = 0;

  late final List<Widget> _pages;

  @override
  void initState() {
    super.initState();
    _pages = [
      const FarmerDashboardScreen(),
      const FarmerProductsScreen(),
      const FarmerOrdersScreen(),
      const FarmerSalesScreen(),
      const ProfileScreen(),
    ];
  }

  void _pindah(int index) {
    setState(() => _index = index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: _pindah,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.space_dashboard_outlined), activeIcon: Icon(Icons.space_dashboard), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.grass_outlined), activeIcon: Icon(Icons.grass), label: 'Produk'),
          BottomNavigationBarItem(icon: Icon(Icons.inbox_outlined), activeIcon: Icon(Icons.inbox), label: 'Pesanan'),
          BottomNavigationBarItem(icon: Icon(Icons.history), label: 'Riwayat'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profil'),
        ],
      ),
    );
  }
}
