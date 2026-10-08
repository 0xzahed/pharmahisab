import mongoose from "mongoose";

const uri = process.env.MONGODB_URI ?? "";

declare global {
  // eslint-disable-next-line no-var
  var __phMongoose: Promise<typeof mongoose> | undefined;
}

/** Connect once per server instance. Null when no URI is configured. */
export async function db(): Promise<typeof mongoose | null> {
  if (!uri) return null;
  if (!global.__phMongoose) {
    global.__phMongoose = mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  }
  try {
    return await global.__phMongoose;
  } catch {
    global.__phMongoose = undefined;
    return null;
  }
}
