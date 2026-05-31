import { ICommand } from '@nestjs/cqrs';
import { DEFAULT_PLAN_FEATURES } from '../../domain/value-objects/constants';

export class CreatePlanCommand implements ICommand {
  constructor(
    public readonly name: string,
    public readonly durationMonths: number,
    public readonly price: number,
    public readonly isActive: boolean,
    public readonly features: string[] = DEFAULT_PLAN_FEATURES,
  ) {}
}
