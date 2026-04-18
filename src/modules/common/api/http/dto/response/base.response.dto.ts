export class BaseResponseDto<T> {
  message: string;
  data: T;

  constructor(partial: Partial<BaseResponseDto<T>>) {
    Object.assign(this, partial);
  }
}
