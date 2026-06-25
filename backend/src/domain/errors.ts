export type DomainErrorCode =
  | 'ILLEGAL_TRANSITION'
  | 'FORBIDDEN'
  | 'COMMENT_REQUIRED';

export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

export class IllegalTransitionError extends DomainError {
  constructor(from: string, action: string) {
    super('ILLEGAL_TRANSITION', `Cannot '${action}' an application in status ${from}`);
    this.name = 'IllegalTransitionError';
  }
}

export class ForbiddenTransitionError extends DomainError {
  constructor(action: string, role: string) {
    super('FORBIDDEN', `Role ${role} is not permitted to '${action}'`);
    this.name = 'ForbiddenTransitionError';
  }
}

export class CommentRequiredError extends DomainError {
  constructor(action: string) {
    super('COMMENT_REQUIRED', `A comment is required to '${action}'`);
    this.name = 'CommentRequiredError';
  }
}
