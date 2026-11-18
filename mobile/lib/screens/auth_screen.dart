import 'package:flutter/material.dart';

import '../services/api.dart';
import '../widgets/farmer_shell.dart';
import '../widgets/buyer_shell.dart';
import '../models/models.dart';
import '../config/session.dart';
import '../config/theme.dart';

/// Satu layar untuk Login dan Registrasi (toggle dengan tab).
class AuthScreen extends StatefulWidget {
  /// Pesan dari splash saat sesi tidak valid.
  final String? pesanAwal;

  const AuthScreen({super.key, this.pesanAwal});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool _isLogin = true;
  bool _isLoading = false;
  bool _obscurePassword = true;

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _namaController = TextEditingController();
  String _role = 'pembeli';

  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    final pesan = widget.pesanAwal;
    if (pesan != null && pesan.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _showMessage(pesan, error: true));
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _namaController.dispose();
    super.dispose();
  }

  void _showMessage(String text, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(text),
        backgroundColor: error ? AppColors.danger : AppColors.primary,
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      if (_isLogin) {
        final data = await ApiService.login(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );

        final token = toStringValue(data['token']);
        var user = AppUser.fromJson(asMap(data['user']));

        // Simpan token dulu supaya request profil memakai Authorization header.
        await Session.saveLogin(token: token, user: user);

        // Ambil profil lengkap agar nama dan alamat tersedia di aplikasi.
        try {
          user = await ApiService.getProfile();
          await Session.saveLogin(token: token, user: user);
        } catch (_) {
          // Profil bisa diambil lagi dari halaman profil/beranda.
        }

        if (!mounted) return;
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => user.isPetani ? const FarmerShell() : const BuyerShell(),
          ),
        );
      } else {
        await ApiService.register(
          nama: _namaController.text.trim(),
          email: _emailController.text.trim(),
          password: _passwordController.text,
          role: _role,
        );

        // Backend register mengembalikan user tanpa token; login langsung.
        final data = await ApiService.login(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
        final token = toStringValue(data['token']);
        var user = AppUser.fromJson(asMap(data['user']));

        // Simpan dulu agar getProfile bisa dipanggil dengan header Authorization.
        await Session.saveLogin(token: token, user: user);

        try {
          user = await ApiService.getProfile();
          await Session.saveLogin(token: token, user: user);
        } catch (_) {}

        if (!mounted) return;
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => user.isPetani ? const FarmerShell() : const BuyerShell(),
          ),
        );
      }
    } on ApiException catch (error) {
      _showMessage(error.message, error: true);
    } catch (error) {
      _showMessage('Terjadi kesalahan: $error', error: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildHeader(),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const SizedBox(height: 26),
                      Text(
                        _isLogin ? 'Selamat datang kembali' : 'Buat akun baru',
                        style: const TextStyle(
                          fontSize: 23,
                          fontWeight: FontWeight.w800,
                          color: AppColors.text,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _isLogin
                            ? 'Masuk untuk berbelanja atau mengelola hasil panen.'
                            : 'Bergabung dengan petani dan pembeli lainnya.',
                        style: const TextStyle(fontSize: 13, color: AppColors.muted),
                      ),
                      const SizedBox(height: 24),
                      if (!_isLogin) ...[
                        TextFormField(
                          controller: _namaController,
                          textCapitalization: TextCapitalization.words,
                          decoration: const InputDecoration(
                            labelText: 'Nama lengkap',
                            prefixIcon: Icon(Icons.person_outline),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().length < 3) {
                              return 'Nama minimal 3 karakter';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 14),
                      ],
                      TextFormField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        autocorrect: false,
                        decoration: const InputDecoration(
                          labelText: 'Email',
                          prefixIcon: Icon(Icons.mail_outline),
                        ),
                        validator: (value) {
                          if (value == null || !value.contains('@') || !value.contains('.')) {
                            return 'Masukkan email yang valid';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        decoration: InputDecoration(
                          labelText: 'Password',
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                            ),
                            onPressed: () {
                              setState(() => _obscurePassword = !_obscurePassword);
                            },
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.length < 6) {
                            return 'Password minimal 6 karakter';
                          }
                          return null;
                        },
                      ),
                      if (!_isLogin) ...[
                        const SizedBox(height: 20),
                        const Text(
                          'Daftar sebagai',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(child: _roleOption('pembeli', 'Pembeli', Icons.shopping_bag_outlined)),
                            const SizedBox(width: 12),
                            Expanded(child: _roleOption('petani', 'Petani', Icons.agriculture)),
                          ],
                        ),
                      ],
                      const SizedBox(height: 26),
                      FilledButton(
                        onPressed: _isLoading ? null : _submit,
                        child: _isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                              )
                            : Text(_isLogin ? 'Masuk' : 'Daftar'),
                      ),
                      const SizedBox(height: 18),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            _isLogin ? 'Belum punya akun?' : 'Sudah punya akun?',
                            style: const TextStyle(fontSize: 13, color: AppColors.muted),
                          ),
                          TextButton(
                            onPressed: () {
                              setState(() => _isLogin = !_isLogin);
                            },
                            child: Text(_isLogin ? 'Daftar' : 'Masuk'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 36, 24, 44),
      decoration: const BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(28),
          bottomRight: Radius.circular(28),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.eco, color: Colors.white, size: 30),
          ),
          const SizedBox(width: 14),
          const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'KompasDesa',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                'Hasil panen, langsung dari petani',
                style: TextStyle(color: Color(0xFFD1F2E2), fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _roleOption(String value, String label, IconData icon) {
    final selected = _role == value;
    return GestureDetector(
      onTap: () => setState(() => _role = value),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary.withValues(alpha: 0.08) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.border,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, color: selected ? AppColors.primary : AppColors.muted),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: selected ? AppColors.primary : AppColors.text,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
