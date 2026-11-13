import mongoose, { type ClientSession, type Connection } from 'mongoose';
import type { Logger } from '../logger';

export async function connectMongo(
  mongodbUri: string,
  options: { autoIndex: boolean; logger: Logger },
): Promise<Connection> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongodbUri, {
    autoIndex: options.autoIndex,
    maxPoolSize: 50,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5_000,
    socketTimeoutMS: 30_000,
    retryWrites: true,
  });
  options.logger.info('MongoDB connected');
  return mongoose.connection;
}

export function isMongoReady(connection: Connection): boolean {
  return connection.readyState === mongoose.ConnectionStates.connected;
}

/** Runs units of work atomically across collections. */
export interface TransactionRunner {
  run<TResult>(unitOfWork: (session: ClientSession) => Promise<TResult>): Promise<TResult>;
}

/** Uses Mongoose's helper, which retries automatically on transient transaction errors. */
export class MongoTransactionRunner implements TransactionRunner {
  constructor(private readonly connection: Connection) {}

  run<TResult>(unitOfWork: (session: ClientSession) => Promise<TResult>): Promise<TResult> {
    return this.connection.transaction(unitOfWork);
  }
}
