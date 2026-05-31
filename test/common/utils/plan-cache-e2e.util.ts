import Redis from 'ioredis';

export const ALL_PLANS_CACHE_KEY = `${process.env.ENVIRONMENT ?? 'production'}_payment:plans:active:0:100`;

export async function captureRedisCommands<T>(
  redis: Redis,
  action: () => Promise<T>,
): Promise<{ result: T; commands: string[] }> {
  const commands: string[] = [];
  const monitor = await redis.monitor();
  monitor.on('monitor', (_time: number, args: string[]) => {
    commands.push(args.join(' ').toLowerCase());
  });

  try {
    const result = await action();
    return { result, commands };
  } finally {
    monitor.disconnect();
  }
}
