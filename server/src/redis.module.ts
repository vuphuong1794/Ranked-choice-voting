import { DynamicModule, FactoryProvider, ModuleMetadata } from '@nestjs/common';
import { Module } from '@nestjs/common';
import IORedis, { Redis, RedisOptions } from 'ioredis';

export const IORedisKey = 'IORedis';

//định nghĩa kiểu trả về cho useFactory
type RedisModuleOptions = {
  connectionOptions: RedisOptions; //Chứa các thông tin cấu hình để kết nối Redis.
  onClientReady?: (client: Redis) => void; //callback, được gọi khi client kết nối thành công.
};

type RedisAsyncModuleOptions = {
  useFactory: ( //Hàm trả về một cấu hình RedisModuleOptions, có thể là async.
    ...args: any[]
  ) => Promise<RedisModuleOptions> | RedisModuleOptions;
} & Pick<ModuleMetadata, 'imports'> &
  Pick<FactoryProvider, 'inject'>;

@Module({})
export class RedisModule {
  // khởi tạo Redis với cấu hình động
  static async registerAsync({
    useFactory,
    imports,
    inject,
  }: RedisAsyncModuleOptions): Promise<DynamicModule> {
    const redisProvider = {
      provide: IORedisKey, // Định nghĩa provider với key 'IORedis', để có thể inject vào các service khác.
      useFactory: async (...args) => {
        const { connectionOptions, onClientReady } = await useFactory(...args);

        const client = await new IORedis(connectionOptions);

        onClientReady(client);

        return client;
      },
      inject,
    };

    return {
      module: RedisModule,
      imports,
      providers: [redisProvider],
      exports: [redisProvider],
    };
  }
}
