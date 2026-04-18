import { ICommand } from '@nestjs/cqrs';

export class CreatePlanCommand implements ICommand {
  constructor(
    public readonly name: string,
    public readonly durationMonths: number,
    public readonly price: number,
    public readonly isActive: boolean,
  ) {}
}
