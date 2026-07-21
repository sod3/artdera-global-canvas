import { afterEach, describe, expect, it } from "vitest";

import { EnvironmentConfigurationError, getEnv, resetEnvForTests } from "../server/config/env";

const originalValues = {
  NODE_ENV: process.env.NODE_ENV,
  DEMO_PAYMENT_MODE: process.env.DEMO_PAYMENT_MODE,
  DEMO_OTP_MODE: process.env.DEMO_OTP_MODE,
};

afterEach(() => {
  for (const [key, value] of Object.entries(originalValues)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  resetEnvForTests();
});

describe("server environment parsing", () => {
  it("normalizes quoted and space-padded Vercel scalar values", () => {
    process.env.NODE_ENV = ' "production" ';
    process.env.DEMO_PAYMENT_MODE = " 'false' ";
    process.env.DEMO_OTP_MODE = " false ";
    resetEnvForTests();

    expect(getEnv()).toMatchObject({
      NODE_ENV: "production",
      DEMO_PAYMENT_MODE: false,
      DEMO_OTP_MODE: false,
    });
  });

  it("identifies the enabled demo flags instead of blaming NODE_ENV", () => {
    process.env.NODE_ENV = "production";
    process.env.DEMO_PAYMENT_MODE = "true";
    process.env.DEMO_OTP_MODE = "true";
    resetEnvForTests();

    try {
      getEnv();
      throw new Error("Expected production demo-mode validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(EnvironmentConfigurationError);
      expect((error as EnvironmentConfigurationError).fields).toEqual([
        "DEMO_PAYMENT_MODE",
        "DEMO_OTP_MODE",
      ]);
    }
  });
});
