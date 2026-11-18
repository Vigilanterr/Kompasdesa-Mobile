import 'package:flutter/material.dart';

import '../config/theme.dart';

/// Gambar produk dengan fallback bila URL kosong atau rusak.
class ProductImage extends StatelessWidget {
  final String url;
  final double? width;
  final double? height;
  final BorderRadius borderRadius;
  final IconData fallbackIcon;

  const ProductImage({
    super.key,
    required this.url,
    this.width,
    this.height,
    this.borderRadius = const BorderRadius.all(Radius.circular(12)),
    this.fallbackIcon = Icons.eco_outlined,
  });

  Widget _fallback() {
    return Container(
      width: width,
      height: height,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: const Color(0xFFE8F3EC),
        borderRadius: borderRadius,
      ),
      child: Icon(fallbackIcon, size: 40, color: AppColors.primary.withValues(alpha: 0.55)),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (url.trim().isEmpty) return _fallback();
    final uri = Uri.tryParse(url.trim());
    if (uri == null || (!uri.isAbsolute && !url.startsWith('/'))) {
      return _fallback();
    }

    return ClipRRect(
      borderRadius: borderRadius,
      child: Image.network(
        url.trim(),
        width: width,
        height: height,
        fit: BoxFit.cover,
        cacheWidth: 600,
        errorBuilder: (context, error, stackTrace) => _fallback(),
        loadingBuilder: (context, child, progress) {
          if (progress == null) return child;
          return Container(
            width: width,
            height: height,
            color: const Color(0xFFF1F5F2),
            alignment: Alignment.center,
            child: const SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(strokeWidth: 2.5),
            ),
          );
        },
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final VoidCallback? onRetry;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFFE8F3EC),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(icon, size: 38, color: AppColors.primary),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: AppColors.muted, height: 1.5),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh, size: 16),
                label: const Text('Coba Lagi'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class StatusChip extends StatelessWidget {
  final String label;
  final Color color;

  const StatusChip({super.key, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

Color orderStatusColor(String status) {
  switch (status) {
    case 'pending':
      return AppColors.accent;
    case 'confirmed':
      return Colors.blue;
    case 'processing':
      return Colors.indigo;
    case 'shipped':
      return Colors.purple;
    case 'completed':
      return AppColors.primary;
    case 'cancelled':
      return AppColors.danger;
    default:
      return AppColors.muted;
  }
}

/// Tombol +/- yang dipakai di detail produk dan keranjang.
class QuantityStepper extends StatelessWidget {
  final int value;
  final int max;
  final ValueChanged<int> onChanged;
  final bool compact;

  const QuantityStepper({
    super.key,
    required this.value,
    required this.max,
    required this.onChanged,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _stepButton(Icons.remove, value <= 1, () => onChanged(value - 1)),
        SizedBox(
          width: compact ? 30 : 42,
          child: Text(
            '$value',
            textAlign: TextAlign.center,
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
          ),
        ),
        _stepButton(Icons.add, value >= max, () => onChanged(value + 1)),
      ],
    );
  }

  Widget _stepButton(IconData icon, bool disabled, VoidCallback onTap) {
    return InkWell(
      onTap: disabled ? null : onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: 30,
        height: 30,
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 16, color: disabled ? AppColors.border : AppColors.primary),
      ),
    );
  }
}
