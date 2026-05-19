import "reflect-metadata";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: true });
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Static uploads — drop files into apps/api/uploads/<subdir>/<file>.
  // They'll be served at http://localhost:3000/uploads/<subdir>/<file>.
  app.useStaticAssets(path.resolve(__dirname, "../uploads"), { prefix: "/uploads/" });

  app.setGlobalPrefix("api");
  await app.listen(Number(process.env.PORT ?? 3000));
}
bootstrap();
