import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service';
import { MongodbService } from '@database/mongodb.service';
import { VendorProduct } from './types/product';
import { NaologicAgent, LlmFactory } from './integrations/llm/llm.service';
import { readFileSync } from 'fs';
import { Cron, CronExpression } from '@nestjs/schedule';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  agent: NaologicAgent;

  constructor(
    private readonly appService: AppService,
    private readonly mongodbService: MongodbService,
    readonly llmFactory: LlmFactory,
  ) {
    const prompt = readFileSync(process.env.PROMPT_PATH).toString();
    this.agent = llmFactory.createAgency(prompt);
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  etlCron() {
    this.doETL();
  }

  @Get('etl')
  async doETL() {
    let jsonData: VendorProduct[];
    console.log('executing cron');
    try {
      jsonData = await this.appService.parseCsv(process.env.CSV_PATH);
      this.logger.log('csv parsed', jsonData.length);
      await this.mongodbService.updateProducts(jsonData);
    } catch (err) {
      // this.logger.error(err);
      throw new HttpException(
        'Failed to parse csv or update productin mongodb',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // now let's get a part of the application
    try {
      // the correct should be not get 10 products but 10 without enhancement description. But for better testing, we will always get 10 products without filter
      const products = await this.mongodbService.getDocuments(10);

      for (const product of products) {
        let answer: string;
        // I notice that sometimes the productDescription is empty, so we need to check if it's empty
        // in this case i prefer don't use the agency. to encharce an description, we need have one.
        if (product.productDescription) {
          const question = {
            name: product.name,
            description: product.productDescription,
            nameOfCategory: `${product.PrimaryCategoryName}, ${product.SecondaryCategoryName}`,
          };
          // this.logger.debug({ question });
          answer = await this.agent.ask(question);
        }
        this.logger.log({ answer, productId: product.productId });
        this.mongodbService.enhanceDescriptionForProduct(
          answer,
          product.productId,
        );
        this.logger.log('product updated: ', product.productId);
      }
    } catch (err) {
      this.logger.log('error:', err);
    }

    return jsonData;
  }

  // curl -X GET http://localhost:8080/etl
  @Get('all-documents')
  getAllDocuments() {
    return this.mongodbService.getAllDocuments();
  }

  // curl -X GET http://localhost:8080/test
  @Get('test-read')
  fromDatabase() {
    const db = this.mongodbService.getDb();
    return db.collection('test01').find().toArray();
  }
  // curl -X POST http://localhost:8080/test -d '{"name":"test"}'
  @Post('test-write')
  insertToDatabase() {
    const db = this.mongodbService.getDb();
    return db.collection('test01').insertOne({ name: 'test' });
  }
}
