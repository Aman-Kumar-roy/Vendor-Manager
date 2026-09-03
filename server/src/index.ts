import app from './app';
import { connectMongoDB } from './config/db';
import { env } from './config/env';

const PORT = Number(env.PORT);

async function bootstrap() {
  await connectMongoDB();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Vasudha Polymer VTMS Server active on port ${PORT}`);
  });
}

bootstrap();
