import "server-only";

// Reads a required server-side environment variable and fails loudly if it is
// missing, instead of failing later with a confusing error.
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}
