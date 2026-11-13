import type { IncomingMessage, ServerResponse } from 'node:http';
import { bootstrapApplication, type BootstrappedApplication } from './bootstrap';

/**
 * Serverless entry point (e.g. Vercel Functions). The bootstrapped app — and with it the MongoDB
 * and Redis connections — is created once per warm instance and reused across invocations.
 * A failed bootstrap is not cached, so the next request retries instead of failing forever.
 */
let pendingBootstrap: Promise<BootstrappedApplication> | null = null;

function getBootstrappedApplication(): Promise<BootstrappedApplication> {
  pendingBootstrap ??= bootstrapApplication().catch((error: unknown) => {
    pendingBootstrap = null;
    throw error;
  });
  return pendingBootstrap;
}

export default async function handleServerlessRequest(request: IncomingMessage, response: ServerResponse) {
  try {
    const { application } = await getBootstrappedApplication();
    application(request, response);
  } catch (error) {
    console.error('API bootstrap failed:', error);
    response.statusCode = 503;
    response.setHeader('Content-Type', 'application/json');
    response.end(
      JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Service is starting up. Please retry shortly.' } }),
    );
  }
}
