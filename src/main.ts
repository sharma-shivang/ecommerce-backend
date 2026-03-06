import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './modules/users/users.service';
import * as bcrypt from 'bcrypt';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix
  app.setGlobalPrefix('api');

  // Security Headers
  app.use(helmet());

  // Compression
  app.use(compression());

  // Enable validation pipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip non-whitelisted properties
      transform: true, // transform payload to DTO instances
      forbidNonWhitelisted: true, // throw an error if non-whitelisted properties are present
    }),
  );

  // Enable global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Enable CORS
  app.enableCors();

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  const usersService = app.get(UsersService);
  const defaultAdminPass = await bcrypt.hash('admin123', 10);
  await usersService.createInitialAdmin(defaultAdminPass);

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap();
