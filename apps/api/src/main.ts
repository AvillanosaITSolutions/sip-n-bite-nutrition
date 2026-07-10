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
  // WEB_ORIGIN accepts a comma-separated list, e.g. "https://example.com,http://localhost:8082"
  const origins = process.env.WEB_ORIGIN?.split(",").map((o) => o.trim()).filter(Boolean);
  app.enableCors({ origin: origins?.length ? origins : true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Static uploads — drop files into apps/api/uploads/<subdir>/<file>.
  // They'll be served at http://localhost:3000/uploads/<subdir>/<file>.
  app.useStaticAssets(path.resolve(__dirname, "../uploads"), { prefix: "/uploads/" });

  app.setGlobalPrefix("api");
  await app.listen(Number(process.env.PORT ?? 3000));
}
bootstrap();
