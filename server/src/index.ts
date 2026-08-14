import app from './app';
import { env } from './config/env';
import { initDatabase } from './utils/db';

async function startServer() {
  try {
    // Automatically initialize database tables if they do not exist
    await initDatabase();
    console.log(`✅ Native MySQL Database '${env.DB_DATABASE}' initialized successfully!`);

    const server = app.listen(Number(env.PORT), '0.0.0.0', () => {
      console.log(`=================================`);
      console.log(`🚀 Express Server running on port ${env.PORT} (listening on 0.0.0.0)`);
      console.log(`📡 Local:   http://localhost:${env.PORT}/api/v1`);
      console.log(`🌐 Network: http://<YOUR_IP>:${env.PORT}/api/v1`);
      console.log(`🗄️  Database: Native MySQL (${env.DB_HOST}:${env.DB_PORT}/${env.DB_DATABASE})`);
      console.log(`=================================`);
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
    });
  } catch (error) {
    console.error('❌ Failed to connect to MySQL database:', error);
    process.exit(1);
  }
}

startServer();
