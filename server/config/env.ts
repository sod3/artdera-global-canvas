import "dotenv/config";
import { z } from "zod";

const booleanFromString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const originsFromString = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string().url()));

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    MONGODB_DB_NAME: z
      .string()
      .regex(/^[a-zA-Z0-9_-]+$/)
      .default("artdera"),
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
    APP_URL: z.string().url().default("http://localhost:3000"),
    ALLOWED_ORIGINS: originsFromString,
    API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    DEMO_PAYMENT_MODE: booleanFromString,
    PAYMENT_PROVIDER: z.string().default("demo"),
    DEMO_OTP_MODE: booleanFromString,
    DEMO_OTP_CODE: z
      .string()
      .regex(/^\d{6}$/)
      .optional(),
    UPLOAD_PROVIDER: z.enum(["local", "mongodb", "cloudinary", "s3"]).default("mongodb"),
    UPLOAD_DIR: z.string().default("uploads"),
    UPLOAD_PUBLIC_BASE_URL: z.string().url().optional(),
    MAX_ARTWORK_IMAGE_SIZE_MB: z.coerce.number().positive().max(25).default(10),
    MAX_PROFILE_IMAGE_SIZE_MB: z.coerce.number().positive().max(10).default(5),
    EMAIL_PROVIDER: z.string().default("console"),
    SEED_DEMO_DATA: booleanFromString,
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === "production" && (env.DEMO_PAYMENT_MODE || env.DEMO_OTP_MODE)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NODE_ENV"],
        message: "Demo payment and OTP modes must be disabled in production",
      });
    }
    if (env.DEMO_OTP_MODE && !env.DEMO_OTP_CODE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DEMO_OTP_CODE"],
        message: "DEMO_OTP_CODE is required when demo OTP mode is enabled",
      });
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

export class EnvironmentConfigurationError extends Error {
  readonly fields: string[];

  constructor(fields: string[]) {
    super(`Server configuration is invalid or incomplete: ${fields.join(", ")}`);
    this.name = "EnvironmentConfigurationError";
    this.fields = fields;
  }
}

let cachedEnv: AppEnv | undefined;

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
    throw new EnvironmentConfigurationError(fields);
  }
  cachedEnv = result.data;
  return cachedEnv;
}

export function resetEnvForTests() {
  cachedEnv = undefined;
}
