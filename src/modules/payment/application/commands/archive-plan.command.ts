import { ICommand } from '@nestjs/cqrs';

export class ArchivePlanCommand implements ICommand {
  constructor(public readonly planId: string) {}
}
