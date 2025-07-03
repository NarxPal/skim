import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'https://skim-alpha.vercel.app/', // frontend port
    credentials: true,
  });
  await app.listen(process.env.DB_PORT ?? 3001);
}
bootstrap();
