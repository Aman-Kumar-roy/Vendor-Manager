import app from './app';
import { connectMongoDB } from './config/db';
import { env } from './config/env';

const PORT = Number(process.env.PORT || env.PORT || 5000);

async function bootstrap() {
  try {
    await connectMongoDB();
    console.log('✅ MongoDB Connected successfully!');
  } catch (err: any) {
    console.warn('⚠️ Warning: Initial MongoDB connection failed/pending:', err?.message || err);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Vasudha Polymer VTMS Server active on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
