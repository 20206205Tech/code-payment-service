import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  UserProfile,
  UserProfilePort,
} from '../../application/ports/services/user-profile.port';

@Injectable()
export class SupabaseUserProfileService implements UserProfilePort {
  private readonly logger = new Logger(SupabaseUserProfileService.name);
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const projectId = this.configService.getOrThrow<string>(
      'SUPABASE_PROJECT_ID',
    );
    this.supabaseUrl = `https://${projectId}.supabase.co`;
    this.supabaseAnonKey =
      this.configService.getOrThrow<string>('SUPABASE_ANON_KEY');
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const url = `${this.supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=full_name`;
    const headers = {
      apikey: this.supabaseAnonKey,
      Authorization: `Bearer ${this.supabaseAnonKey}`,
      'Content-Profile': 'public',
    };

    try {
      this.logger.log(`Fetching user profile from Supabase for user ${userId}`);
      const response = await firstValueFrom(
        this.httpService.get<Array<{ full_name: string }>>(url, {
          headers,
          timeout: 5000,
        }),
      );

      if (
        response.status === 200 &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        const profile = response.data[0];
        return {
          fullName: profile.full_name,
          // Email is usually not in the public.profiles table by default in standard Supabase setups,
          // but we return what we find or leave it for further enrichment.
        };
      }

      this.logger.warn(`No profile found in Supabase for user ${userId}`);
      return null;
    } catch (error) {
      this.logger.error(
        `Error fetching user profile from Supabase for user ${userId}:`,
        error,
      );
      return null;
    }
  }
}
