import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './app/worker.module';

async function bootstrap() {
  const app = await NestFactory.create(WorkerModule);
  // Worker runs headless — no HTTP server needed
  await app.init();
  console.log('🔧 Worker started — listening for BullMQ jobs');
}

bootstrap();
