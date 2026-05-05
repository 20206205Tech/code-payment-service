import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot(): Record<string, string> {
    return {
      message: 'Hello World',
      docs: `/code-payment-service/docs`,
    };
  }
}
