import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';

// Định nghĩa kiểu dữ liệu rõ ràng thay vì dùng 'any'
interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
  app_metadata?: {
    role?: string;
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const SUPABASE_PROJECT_ID = configService.getOrThrow<string>(
      'SUPABASE_PROJECT_ID',
    );
    const supabaseUrl = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: 'authenticated',
      issuer: `${supabaseUrl}/auth/v1`,
      algorithms: ['RS256', 'ES256'],

      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      }),
    });
  }

  // Xóa từ khóa 'async' vì không sử dụng 'await' bên trong
  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.app_metadata?.role || payload.role,
    };
  }
}
