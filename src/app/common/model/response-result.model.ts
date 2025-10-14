export class ResponseResult<T> {
  statusCode: number;
  success: boolean;
  hiddenMessage: string;
  message: string;
  data: T;

  constructor(
    statusCode: number,
    success: boolean,
    message: string,
    data: T,
    hiddenMessage: string = ''
  ) {
    this.statusCode = statusCode;
    this.success = success;
    this.message = message;
    this.data = data;
    this.hiddenMessage = hiddenMessage;
  }
}
