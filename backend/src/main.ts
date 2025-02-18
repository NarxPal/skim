import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:3000', // frontend port
    credentials: true,
  });
  await app.listen(process.env.DB_PORT ?? 3001);
}
bootstrap();
