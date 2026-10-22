export class BusinessError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}
``