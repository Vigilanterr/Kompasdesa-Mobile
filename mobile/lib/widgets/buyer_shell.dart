import 'package:flutter/material.dart';

import '../screens/buyer_cart_screen.dart';
import '../screens/buyer_catalog_screen.dart';
import '../screens/buyer_home_screen.dart';
import '../screens/buyer_orders_screen.dart';
import '../screens/profile_screen.dart';

/// Navigasi utama untuk role pembeli.
class BuyerShell extends StatefulWidget {
  const BuyerShell({super.key});

  @override
  State<BuyerShell> createState() => _BuyerShellState();
}

class _BuyerShellState extends State<BuyerShell> {
  int _index = 0;
  int _cartRefresh = 0;

  late final List<Widget> _pages;

  @override
  void initState() {
    super.initState();
    _pages = [
      BuyerHomeScreen(
        onOpenCatalog: () => _pindah(1),
        onOpenCart: () => _pindah(2),
      ),
      const BuyerCatalogScreen(),
      BuyerCartScreen(onCheckoutSuccess: () => _pindah(3)),
      const BuyerOrdersScreen(),
      const ProfileScreen(),
    ];
  }

  void _pindah(int index) {
    if (index == 2) {
      _cartRefresh++;
      _pages[2] = BuyerCartScreen(
        key: ValueKey(_cartRefresh),
        onCheckoutSuccess: () => _pindah(3),
      );
    }
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
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Beranda'),
          BottomNavigationBarItem(icon: Icon(Icons.grid_view_outlined), activeIcon: Icon(Icons.grid_view), label: 'Produk'),
          BottomNavigationBarItem(icon: Icon(Icons.shopping_cart_outlined), activeIcon: Icon(Icons.shopping_cart), label: 'Keranjang'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long_outlined), activeIcon: Icon(Icons.receipt_long), label: 'Pesanan'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profil'),
        ],
      ),
    );
  }
}
