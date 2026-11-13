import { analyticsOverviewQuerySchema } from '@doctor-tracker/contracts';
import type { Request, Response } from 'express';
import { parseWithSchema } from '../../common/http/parse-with-schema';
import { sendData } from '../../common/http/send-response';
import type { AnalyticsService } from './analytics.service';

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  getOverview = async (request: Request, response: Response): Promise<void> => {
    const { range } = parseWithSchema(analyticsOverviewQuerySchema, request.query);
    sendData(response, await this.analyticsService.getOverview(range));
  };
}
