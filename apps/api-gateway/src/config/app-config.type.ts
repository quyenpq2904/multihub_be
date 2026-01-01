export type AppConfig = {
  name: string;
  port: number;
  description: string;
  clientUrl: string;
  authGrpcUrl: string;
  chatGrpcUrl: string;
  redisHost: string;
  redisPort: number;
  redisUsername: string;
  redisPassword: string;
};
