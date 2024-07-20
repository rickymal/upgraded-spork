import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';

export class NaologicAgent {
  private openAI: OpenAI;
  private promptTemplate: string;
  private logger = new Logger(NaologicAgent.name);

  constructor(promptTemplate: string) {
    this.openAI = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.promptTemplate = promptTemplate;
  }

  async ask(message: { [key: string]: string }): Promise<string> {
    let promptTemplate = this.promptTemplate;
    Object.keys(message).forEach((key) => {
      promptTemplate = promptTemplate.replace(
        new RegExp(`\\$${key}`, 'g'),
        message[key],
      );
    });
    // this.logger.log({ promptTemplate });
    /**
     * @todo set the prompt in two parts 'system' and 'user'
     */
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'user',
        content: promptTemplate,
      },
    ];

    const response = await this.openAI.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
    });
    // this.logger.log('model answer', { response });
    return response.choices[0].message.content;
  }
}

// it's just a wrapping to create the agent. I don't like expose the API resource directly.
@Injectable()
export class LlmFactory implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(LlmFactory.name);
  async onModuleInit() {
    // console.log('Model initialized with OpenAI');
  }

  async onModuleDestroy() {
    // console.log('Model cleanup on module destroy');
  }

  createAgency(promptTemplate: string): NaologicAgent {
    return new NaologicAgent(promptTemplate);
  }
}
