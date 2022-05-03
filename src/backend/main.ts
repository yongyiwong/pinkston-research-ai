import * as dotenv from 'dotenv';
dotenv.config();

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const configService = app.get(ConfigService);
  if (configService.get('ENVIRONMENT') === 'development') {
    const swaggerOptions = new DocumentBuilder()
      .setTitle('Pinkstone research ai')
      .setDescription(
        'Below You can test out the backend api and read the description of all endpoints and it`s examples',
      )
      .setVersion('0.0.1')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'jwt',
      })
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerOptions);

    SwaggerModule.setup(globalPrefix, app, swaggerDocument, {
      swaggerUrl: `${configService.get('BACKEND_HOST')}/api/docs-json/`,
      explorer: true,
      swaggerOptions: {
        docExpansion: 'list',
        filter: true,
        displayRequestDuration: true,
      },
      customCss:
        '.opblock-summary-path {font-size: 18px !important; font-weight: normal !important;}' +
        '.opblock-summary-description {font-size: 18px !important; text-align: right !important;' +
        'font-weight: bold !important;}',
    });
  }

  const port = process.env.BACKEND_PORT || 3333;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}
bootstrap();
