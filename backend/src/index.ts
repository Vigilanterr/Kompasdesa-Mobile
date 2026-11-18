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
  const isProduction = process.env.NODE_ENV === 'production';
  app.get('/api-docs.json', docsGuard, (_req, res) => {
    res.json(swaggerSpec);
  });
  app.use(
    '/api-docs',
    docsGuard,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'KompasDesa API Docs',
      swaggerOptions: {
        // Jangan simpan JWT di localStorage browser saat production
        persistAuthorization: !isProduction,
        displayRequestDuration: true,
      },
    })
  );
}

app.use(errorHandler);

app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

app.listen(PORT, () => {
  console.log(`KompasDesa API listening on port ${PORT}`);
});