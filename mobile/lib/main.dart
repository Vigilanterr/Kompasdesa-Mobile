import 'package:flutter/material.dart';

import 'services/api.dart';
import 'screens/auth_screen.dart';
import 'widgets/buyer_shell.dart';
import 'widgets/farmer_shell.dart';
import 'config/session.dart';
import 'config/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Session.init();
  runApp(const KompasDesaApp());
}

class KompasDesaApp extends StatelessWidget {
  const KompasDesaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KompasDesa',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const SplashScreen(),
    );
  }
}

/// Cek sesi tersimpan saat aplikasi dibuka.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _cekSesi();
  }

  Future<void> _cekSesi() async {
    // Beri sedikit waktu agar animasi awal terlihat.
    await Future<void>.delayed(const Duration(milliseconds: 600));

    if (!mounted) return;
    if (!Session.isLoggedIn) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const AuthScreen()),
      );
      return;
    }

    // Token lokal belum tentu masih valid. Cek ke server lewat /profile.
    try {
      final user = await ApiService.getProfile();
      await Session.saveUser(user);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => user.isPetani ? const FarmerShell() : const BuyerShell(),
        ),
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      final pesan = error.statusCode == 401
          ? 'Sesi berakhir. Silakan login kembali.'
          : error.message;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => AuthScreen(pesanAwal: pesan)),
      );
    } catch (_) {
      // Jika server mati, tetap buka aplikasi dengan data sesi lokal.
      if (!mounted) return;
      final user = Session.user;
      if (user == null || user.role.isEmpty) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const AuthScreen()),
        );
        return;
      }
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => user.isPetani ? const FarmerShell() : const BuyerShell(),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.primary,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.eco, size: 64, color: Colors.white),
            SizedBox(height: 16),
            Text(
              'KompasDesa',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 26,
              ),
            ),
            SizedBox(height: 20),
            CircularProgressIndicator(color: Colors.white),
          ],
        ),
      ),
    );
  }
}
