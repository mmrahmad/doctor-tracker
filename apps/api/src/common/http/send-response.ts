import type { ApiSuccessBody } from '@doctor-tracker/contracts';
import type { Response } from 'express';

export function sendData<TData>(response: Response, data: TData, httpStatus = 200): void {
  const body: ApiSuccessBody<TData> = { data };
  response.status(httpStatus).json(body);
}

export function sendNoContent(response: Response): void {
  response.status(204).end();
}
