import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  const buildHost = (response: {
    status: jest.Mock;
    json: jest.Mock;
  }): ArgumentsHost =>
    ({
      switchToHttp: () => ({ getResponse: () => response }),
    }) as unknown as ArgumentsHost;

  it('forwards the status and body of an HttpException', () => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const filter = new AllExceptionsFilter();
    const exception = new HttpException('not found', HttpStatus.NOT_FOUND);

    filter.catch(exception, buildHost(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(response.json).toHaveBeenCalledWith(exception.getResponse());
  });

  it('returns a generic 500 for unexpected errors', () => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const filter = new AllExceptionsFilter();

    filter.catch(new Error('boom'), buildHost(response));

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  });

  it('handles a thrown non-Error value', () => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const filter = new AllExceptionsFilter();

    filter.catch('unexpected string', buildHost(response));

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });
});
