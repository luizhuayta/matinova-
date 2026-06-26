import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const serverTarget = process.env.PORT || 8080;
  await app.listen(serverTarget);
}
bootstrap();
