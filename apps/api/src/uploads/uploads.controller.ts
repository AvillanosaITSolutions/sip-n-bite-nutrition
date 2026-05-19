import {
  BadRequestException,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as path from "path";
import * as fs from "fs";
import { Role } from "@snb/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

const ALLOWED_DIRS = ["menu", "products", "landing", "about-us", "customers"] as const;
type Bucket = (typeof ALLOWED_DIRS)[number];

const UPLOADS_ROOT = path.resolve(__dirname, "../../uploads");

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

@Controller("uploads")
export class UploadsController {
  @Post(":bucket")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (req, _file, cb) => {
          const bucket = req.params.bucket as Bucket;
          if (!ALLOWED_DIRS.includes(bucket)) return cb(new BadRequestException("Invalid upload bucket"), "");
          const dir = path.join(UPLOADS_ROOT, bucket);
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
          const base = slug(path.basename(file.originalname, ext)) || "image";
          const stamp = Date.now().toString(36);
          cb(null, `${base}-${stamp}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!/^image\/(jpeg|jpg|png|webp|gif)$/i.test(file.mimetype)) {
          return cb(new BadRequestException("Only image files are allowed"), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  upload(
    @Param("bucket") bucket: Bucket,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("No file uploaded");
    const url = `/uploads/${bucket}/${file.filename}`;
    return { url, filename: file.filename };
  }
}
