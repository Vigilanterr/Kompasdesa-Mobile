import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/error.middleware';
import { docsGuard, isDocsEnabled } from './middleware/docs.middleware';
import authRoutes from './routes/auth.route';
import userRoutes from './routes/user.route';
import productRoutes from './routes/product.route';
import categoryRoutes from './routes/category.route';
import cartRoutes from './routes/cart.route';
import orderRoutes from './routes/order.route';
import dashboardRoutes from './routes/dashboard.route';

const PORT = process.env.PORT || 5000;
const isVercel = process.env.VERCEL === '1';
const app = express();

// Di belakang reverse proxy (Nginx/Cloudflare) agar req.protocol = https
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  res.json({ message: 'KompasDesa API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);

// API Docs (Swagger) — di production dilindungi Basic Auth & bisa dimatikan via env
if (isDocsEnabled()) {
  // Vercel tidak mengirim aset statis dari node_modules -> pakai CDN.
  // ponytail: fallback ke aset lokal jika pindah ke server non-serverless.
  const CSS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css';
  const JS_URLS = [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui-bundle.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui-standalone-preset.js',
  ];
  app.get('/api-docs.json', docsGuard, (_req, res) => {
    res.json(swaggerSpec);
  });
  app.use(
    '/api-docs',
    docsGuard,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'KompasDesa API Docs',
      customCssUrl: CSS_URL,
      customJs: JS_URLS,
      swaggerOptions: {
        // Jangan simpan JWT di localStorage browser saat production
        persistAuthorization: !isVercel && process.env.NODE_ENV !== 'production',
        displayRequestDuration: true,
      },
    })
  );
}

app.use(errorHandler);

app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

export default app;

if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`KompasDesa API listening on port ${PORT}`);
  });
}