import { MessageContext } from 'vk-io';
import { NextMiddleware, NextMiddlewareReturn } from 'middleware-io';
import { IQuestionMessageContext, QuestionManager } from 'vk-io-question';

import { AbstractMiddleware, MiddlewareType } from '@/core';

const questionManager: QuestionManager = new QuestionManager();
export class ContextMiddleware implements AbstractMiddleware {
  type = MiddlewareType.BEFORE;

  middleware(
    context: MessageContext,
    next: NextMiddleware
  ): NextMiddlewareReturn {
    return questionManager.middleware(
      context as unknown as IQuestionMessageContext,
      next
    );
  }
}
