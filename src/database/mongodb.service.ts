import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';
import { VendorProduct } from 'src/types/product';

@Injectable()
export class MongodbService implements OnModuleDestroy, OnModuleInit {
  private client: MongoClient;
  private db: Db;
  private readonly logger = new Logger(MongodbService.name);

  async onModuleInit() {
    this.client = new MongoClient(process.env.MONGODB_URI);
    try {
      await this.client.connect();
      this.db = this.client.db(process.env.DB_NAME);
      this.db.createIndex(process.env.DB_COLLECTION, {
        productId: 1,
      });
    } catch (error) {
      this.logger.error('Failed to connect to MongoDB', error);
      throw new Error('Failed to connect to MongoDB');
    }

    this.logger.log('Connected to MongoDB');
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      this.logger.log('Disconnected from MongoDB');
    }
  }

  async updateProductsAtMongodb(products: VendorProduct[]) {
    const collection = this.db.collection<VendorProduct>(
      process.env.DB_COLLECTION,
    );
    const queriesInsertion = products.map((el) => {
      return {
        updateOne: {
          filter: { productId: el.productId },
          update: { $set: { ...el, isActive: true } },
          upsert: true,
        },
      };
    });

    this.logger.debug({ queriesInsertion });
    let result = null;
    try {
      result = await collection.bulkWrite(queriesInsertion, {
        ordered: false,
      });
      this.logger.log('Bulk update made');
    } catch (err) {
      this.logger.error('Failed at update bulk, error:', err);
      // throw new Error('Failed at update bulk'); // this should not block the application.
    }

    return result;
  }

  async softDeleteProductsAtMongodb(products: string[]) {
    const collection = this.db.collection<VendorProduct>(
      process.env.DB_COLLECTION,
    );
    const queriesInsertion = products.map((productId) => {
      return {
        updateOne: {
          filter: { productId: productId },
          update: { $set: { isActive: false } },
          upsert: true,
        },
      };
    });

    // this.logger.debug({ queriesInsertion });
    let result = null;
    try {
      result = await collection.bulkWrite(queriesInsertion, {
        ordered: false,
      });
      this.logger.log('Bulk update made: ');
    } catch (err) {
      throw new Error('Failed at soft delete creation');
    }

    return result;
  }

  async getAllDocumentsID() {
    const collection = this.db.collection<VendorProduct>(
      process.env.DB_COLLECTION,
    );
    const answer = await collection
      .find({})
      .project({ productId: 1 })
      .toArray();
    const ids = answer.map((el) => el.productId);
    return new Set(ids);
  }

  async updateProducts(products: VendorProduct[], batchSize = 2000) {
    let documentIDs: Set<string>;
    try {
      documentIDs = await this.getAllDocumentsID();
    } catch (err) {
      this.logger.error('Failed to get all documents', err);
      throw new Error('Failed to get all documents');
    }

    const promises = [];
    let dataToBulk: VendorProduct[] = [];
    let dataToDelete: string[] = [];
    for (const product of products) {
      if (documentIDs.has(product.productId)) {
        documentIDs.delete(product.productId);
      }

      dataToBulk.push(product);

      if (dataToBulk.length === batchSize) {
        promises.push(this.updateProductsAtMongodb(dataToBulk));
        dataToBulk = [];
      }
    }

    for (const product of documentIDs) {
      dataToDelete.push(product);
      if (dataToDelete.length === batchSize) {
        promises.push(this.softDeleteProductsAtMongodb(dataToDelete));
        dataToDelete = [];
      }
    }

    if (dataToBulk.length > 0) {
      promises.push(this.updateProductsAtMongodb(dataToBulk));
    }

    if (dataToDelete.length > 0) {
      promises.push(this.softDeleteProductsAtMongodb(dataToDelete));
      dataToDelete = [];
    }

    try {
      await Promise.all(promises);
      this.logger.log('All products have been processed');
    } catch (err) {
      this.logger.error('Failed to process products', err);
    }

    return 0;
  }

  async getAllDocuments() {
    const collection = this.db.collection<VendorProduct>('products');
    return await collection.find({}).toArray();
  }

  async getDocuments(qtd: number): Promise<VendorProduct[]> {
    const collection = this.db.collection<VendorProduct>('products');
    const answer = collection.find({}).limit(qtd).toArray();
    return answer;
  }

  async enhanceDescriptionForProduct(answer: string, productId: string) {
    // console.log({ answer, productId });
    const collection = this.db.collection<VendorProduct>('products');
    await collection.updateOne(
      { productId: productId },
      { $set: { enhancedDescription: answer } },
    );
    // this.logger.debug('Update result:', result);
  }

  getDb(): Db {
    return this.db;
  }
}
