import { DomainException } from '@20206205tech/nestjs-common';

export class PlanNotFoundException extends DomainException {
  constructor(planId?: string) {
    const message = planId
      ? `Gói dịch vụ với ID "${planId}" không tồn tại.`
      : 'Không tìm thấy gói dịch vụ yêu cầu.';
    super(message);
  }
}
