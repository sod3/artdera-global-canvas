import "dotenv/config";
import { z } from "zod";

function normalizeVercelScalar(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  const quote = trimmed[0];
  if ((quote === '"' || quote === "'") && trimmed.at(-1) === quote) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function isVercelRuntime() {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
}

const nodeEnvironment = z
  .preprocess(
    (value) => (isVercelRuntime() ? "production" : normalizeVercelScalar(value)),
    z.enum(["development", "test", "production"]).default("development"),
  )
  .catch("development");

const booleanFromString = z.unknown().transform((value) => {
  const normalized = String(normalizeVercelScalar(value) ?? "").toLowerCase();
  return ["true", "1", "yes", "on"].includes(normalized);
});

const originsFromString = z.unknown().transform((value) =>
  String(normalizeVercelScalar(value) ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => z.string().url().safeParse(origin).success),
);

const optionalUrl = z
  .preprocess((value) => normalizeVercelScalar(value) || undefined, z.string().url().optional())
  .catch(undefined);

const envSchema = z
  .object({
    NODE_ENV: nodeEnvironment,
    MONGODB_URI: z.preprocess(normalizeVercelScalar, z.string().min(1, "MONGODB_URI is required")),
    MONGODB_DB_NAME: z
      .preprocess(
        normalizeVercelScalar,
        z
          .string()
          .regex(/^[a-zA-Z0-9_-]+$/)
          .default("artdera"),
      )
      .catch("artdera"),
    AUTH_SECRET: z.preprocess(
      normalizeVercelScalar,
      z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
    ),
    APP_URL: z
      .preprocess(normalizeVercelScalar, z.string().url().default("http://localhost:3000"))
      .catch("http://localhost:3000"),
    ALLOWED_ORIGINS: originsFromString,
    API_PORT: z.coerce.number().int().min(1).max(65535).default(3001).catch(3001),
    DEMO_PAYMENT_MODE: booleanFromString,
    PAYMENT_PROVIDER: z
      .preprocess(normalizeVercelScalar, z.string().min(1).default("demo"))
      .catch("demo"),
    DEMO_OTP_MODE: booleanFromString,
    DEMO_OTP_CODE: z
      .preprocess(
        (value) => normalizeVercelScalar(value) || undefined,
        z
          .string()
          .regex(/^\d{6}$/)
          .optional(),
      )
      .catch(undefined),
    UPLOAD_PROVIDER: z
      .preprocess(
        normalizeVercelScalar,
        z.enum(["local", "mongodb", "cloudinary", "s3"]).default("mongodb"),
      )
      .catch("mongodb"),
    UPLOAD_DIR: z
      .preprocess(normalizeVercelScalar, z.string().min(1).default("uploads"))
      .catch("uploads"),
    UPLOAD_PUBLIC_BASE_URL: optionalUrl,
    MAX_ARTWORK_IMAGE_SIZE_MB: z.coerce.number().positive().max(25).default(10).catch(10),
    MAX_PROFILE_IMAGE_SIZE_MB: z.coerce.number().positive().max(10).default(5).catch(5),
    EMAIL_PROVIDER: z
      .preprocess(normalizeVercelScalar, z.string().min(1).default("console"))
      .catch("console"),
    SEED_DEMO_DATA: booleanFromString,
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production" && env.DEMO_OTP_MODE && !env.DEMO_OTP_CODE) {
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
  const production = result.data.NODE_ENV === "production";
  if (
    production &&
    (result.data.DEMO_PAYMENT_MODE || result.data.DEMO_OTP_MODE || result.data.SEED_DEMO_DATA)
  ) {
    console.warn("Development-only modes were configured in production and have been disabled.");
  }
  cachedEnv = production
    ? {
        ...result.data,
        DEMO_PAYMENT_MODE: false,
        DEMO_OTP_MODE: false,
        SEED_DEMO_DATA: false,
        UPLOAD_PROVIDER:
          isVercelRuntime() && result.data.UPLOAD_PROVIDER === "local"
            ? "mongodb"
            : result.data.UPLOAD_PROVIDER,
      }
    : result.data;
  return cachedEnv;
}

export function resetEnvForTests() {
  cachedEnv = undefined;
}
