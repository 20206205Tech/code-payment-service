import { BaseEntityOrmRepository } from './base-entity.orm-repository';

describe('BaseEntityOrmRepository', () => {
  it('should be defined', () => {
    expect(new BaseEntityOrmRepository()).toBeDefined();
  });
});
