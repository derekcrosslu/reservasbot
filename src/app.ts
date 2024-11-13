import 'dotenv/config';
import { createBot, MemoryDB } from '@builderbot/bot';
import AIClass from './services/ai';
import flow from './flows';
// import { providerTelegram as provider } from './provider/telegram';
import { provider } from './provider';
import { createServer } from 'node:http';

const BOT_PORT = process.env.PORT ?? 3001;
const HEALTH_PORT = process.env.HEALTH_PORT ?? 3000;
const ai = new AIClass(process.env.OPEN_API_KEY, 'gpt-3.5-turbo');

const createHealthServer = (port: number) => {
  const server = createServer((req, res) => {
    if (req?.url === '/health') {
      const healthData = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        env: process.env.NODE_ENV,
        version: process.version,
        botPort: BOT_PORT,
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(healthData, null, 2));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Health check available at http://localhost:${port}/health`);
  });

  return server;
};

const main = async () => {
  try {
    // Start health check server
    createHealthServer(+HEALTH_PORT);

    const { httpServer } = await createBot(
      {
        database: new MemoryDB(),
        provider,
        flow,
      },
      { extensions: { ai } }
    );

    // Fix: Check the httpServer signature from @builderbot/bot
    httpServer(+BOT_PORT);
    console.log(`Bot server running on port ${BOT_PORT}`);
  } catch (error) {
    console.error('Server error:', error);
    process.exit(1);
  }
};

main().catch(console.error);
