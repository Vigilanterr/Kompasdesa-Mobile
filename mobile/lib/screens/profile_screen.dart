import 'package:flutter/material.dart';

import '../services/api.dart';
import 'auth_screen.dart';
import '../models/models.dart';
import '../config/session.dart';
import '../config/theme.dart';
import '../widgets/widgets.dart';

/// Profil untuk pembeli dan petani.
/// Role hanya ditampilkan, tidak bisa diubah dari sini.
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isLoading = true;
  bool _isSaving = false;
  bool _isEdit = false;
  String? _error;
  AppUser? _user;

  final _namaController = TextEditingController();
  final _noHpController = TextEditingController();
  final _alamatController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _muat();
  }

  Future<void> _muat() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final user = await ApiService.getProfile();
      if (!mounted) return;
      await Session.saveUser(user);
      if (!mounted) return;
      setState(() {
        _user = user;
        _namaController.text = user.nama;
        _noHpController.text = user.noHp;
        _alamatController.text = user.alamat;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      if (error.statusCode == 401) {
        _keluar();
        return;
      }
      setState(() {
        _user = Session.user;
        _error = error.message;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _user = Session.user;
        _error = 'Gagal memuat profil: $error';
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _simpan() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);
    try {
      final user = await ApiService.updateProfile(
        nama: _namaController.text.trim(),
        noHp: _noHpController.text.trim(),
        alamat: _alamatController.text.trim(),
      );
      await Session.saveUser(user);
      if (!mounted) return;
      setState(() {
        _user = user;
        _isEdit = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profil berhasil diperbarui')),
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.message),
          backgroundColor: AppColors.danger,
        ),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Gagal menyimpan profil: $error'),
          backgroundColor: AppColors.danger,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _keluar() async {
    final ya = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Keluar Akun'),
        content: const Text('Yakin ingin keluar dari aplikasi?'),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(false), child: const Text('Batal')),
          FilledButton(onPressed: () => Navigator.of(dialogContext).pop(true), child: const Text('Keluar')),
        ],
      ),
    );
    if (ya != true) return;
    await Session.clear();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const AuthScreen()),
      (_) => false,
    );
  }

  @override
  void dispose() {
    _namaController.dispose();
    _noHpController.dispose();
    _alamatController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _muat,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                    child: Text(
                      (_user?.nama.isNotEmpty == true)
                          ? _user!.nama.substring(0, 1).toUpperCase()
                          : 'K',
                      style: const TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _user?.nama.isNotEmpty == true ? _user!.nama : 'Pengguna KompasDesa',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Center(
                    child: StatusChip(
                      label: _user?.isPetani == true ? 'PETANI' : 'PEMBELI',
                      color: AppColors.primary,
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 16),
                    Text(
                      _error!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AppColors.danger, fontSize: 12),
                    ),
                  ],
                  const SizedBox(height: 24),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: _isEdit
                          ? Form(
                              key: _formKey,
                              child: Column(
                                children: [
                                  TextFormField(
                                    controller: _namaController,
                                    decoration: const InputDecoration(labelText: 'Nama'),
                                    validator: (v) => (v == null || v.trim().length < 3)
                                        ? 'Nama minimal 3 karakter'
                                        : null,
                                  ),
                                  const SizedBox(height: 12),
                                  TextFormField(
                                    controller: _noHpController,
                                    decoration: const InputDecoration(labelText: 'Nomor HP'),
                                    keyboardType: TextInputType.phone,
                                  ),
                                  const SizedBox(height: 12),
                                  TextFormField(
                                    controller: _alamatController,
                                    decoration: const InputDecoration(
                                      labelText: 'Alamat',
                                      helperText: 'Alamat ini dipakai saat checkout.',
                                    ),
                                    maxLines: 3,
                                  ),
                                  const SizedBox(height: 18),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: OutlinedButton(
                                          onPressed: () => setState(() => _isEdit = false),
                                          child: const Text('Batal'),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: FilledButton(
                                          onPressed: _isSaving ? null : _simpan,
                                          child: _isSaving
                                              ? const SizedBox(
                                                  width: 18,
                                                  height: 18,
                                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                                )
                                              : const Text('Simpan'),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            )
                          : Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _baris(Icons.person_outline, 'Nama', _user?.nama ?? '-'),
                                _baris(Icons.mail_outline, 'Email', _user?.email ?? '-'),
                                _baris(Icons.phone_outlined, 'Nomor HP',
                                    _user?.noHp.isNotEmpty == true ? _user!.noHp : '-'),
                                _baris(Icons.location_on_outlined, 'Alamat',
                                    _user?.alamat.isNotEmpty == true ? _user!.alamat : '-'),
                                _baris(Icons.badge_outlined, 'Role',
                                    _user?.isPetani == true ? 'Petani' : 'Pembeli'),
                                const Divider(height: 24),
                                FilledButton.tonal(
                                  onPressed: () => setState(() => _isEdit = true),
                                  child: const Text('Ubah Profil'),
                                ),
                              ],
                            ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: _keluar,
                    icon: const Icon(Icons.logout),
                    label: const Text('Keluar Akun'),
                    style: OutlinedButton.styleFrom(foregroundColor: AppColors.danger),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _baris(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppColors.primary),
          const SizedBox(width: 10),
          SizedBox(width: 76, child: Text(label, style: const TextStyle(fontSize: 12, color: AppColors.muted))),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
