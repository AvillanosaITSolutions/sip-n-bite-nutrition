import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtStrategy } from "./jwt.strategy";
import { RolesGuard } from "./roles.guard";
import { User } from "../users/user.entity";

@Module({
  imports: [PassportModule, TypeOrmModule.forFeature([User])],
  providers: [JwtStrategy, RolesGuard],
  exports: [PassportModule, RolesGuard, TypeOrmModule],
})
export class AuthModule {}
