import * as dotenv from "dotenv";
dotenv.config();

const config = {
  app_url: process.env.APP_URL ?? "",
  salt_rounds: process.env.SALT_ROUNDS ?? 10,
  token_secret: process.env.JWT_SECRET ?? "secret",
  environment: process.env.NODE_ENV ?? "development",
  port: process.env.PORT,
  database: {
    connection_url: "",
    private_key: "",
    database: ""
  },
  storage: {
    connection_url: process.env.STORAGE_URL ?? "",
    private_key: process.env.STORAGE_KEY ?? "",
    qr_bucket: "merchant-qr-codes"
  },
  queue: {
    connection_url: process.env.QUEUE_CONNECTION_URL ?? "",
  },
  notifications: {
    email: {
      public_key: process.env.EMAIL_PUBLIC_KEY ?? "",
      private_key: process.env.EMAIL_PRIVATE_KEY ?? ""
    },
    sms: {

    }
  }
}

export default config;

export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
  }
}
