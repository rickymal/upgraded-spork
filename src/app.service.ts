import { Injectable, Logger } from '@nestjs/common';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { RawVendorProduct, VendorProduct } from './types/product';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  getHello(): string {
    return 'Hello World!';
  }

  /**
   * @todo should be interesting return a stream of products insteads of an array all loaded in memory
   * @param fileName absolute path to the csv file
   * @returns array of products
   */
  async parseCsv(
    fileName: string = './public/images40-partial-1.csv',
  ): Promise<VendorProduct[]> {
    const readStream = createReadStream(fileName, { encoding: 'utf-8' });
    let header = null;

    /**
     * @see https://nodejs.org/api/readline.html#readline_example_read_file_stream_line_by_line
     * in Resume: Create an extra pipeline the send chunks by line, not per bytes as readStream does by default
     */
    const rl = await createInterface({
      input: readStream,
      crlfDelay: Infinity,
    });

    return new Promise((resolve: (data: VendorProduct[]) => void, reject) => {
      const productMap = new Map<string, RawVendorProduct[]>();

      rl.on('line', (line) => {
        const data = line.split(/\t/).map((el) => el.trim());
        if (!header) {
          header = data;
          return;
        }
        const obj: RawVendorProduct = data.reduce((acc, cur, index) => {
          acc[header[index]] = cur;
          return acc;
        }, {} as RawVendorProduct);

        if (!productMap.has(obj.ProductID)) {
          productMap.set(obj.ProductID, []);
        }
        // this.logger.debug({ obj });
        productMap.get(obj.ProductID).push(obj); // better for memory usage.
      });

      rl.on('close', () => {
        const formattedProducts: VendorProduct[] = [];
        productMap.forEach((products) => {
          if (products.length > 0) {
            formattedProducts.push({
              updatedAt: new Date(),
              productId: products[0].ProductID,
              name: products[0].ProductName,
              productDescription: products[0].ProductDescription,
              primaryCategoryID: products[0].PrimaryCategoryID,
              PrimaryCategoryName: products[0].PrimaryCategoryName,
              SecondaryCategoryID: products[0].SecondaryCategoryID,
              SecondaryCategoryName: products[0].SecondaryCategoryName,
              variants: products.map((product) => ({
                PKG: product.PKG,
                UnitPrice: product.UnitPrice,
                PriceDescription: product.PriceDescription,
                ItemDescription: product.ItemDescription,
              })),
            });
          }
        });

        resolve(formattedProducts);
      });

      rl.on('error', (error) => {
        reject(error);
      });
    });
  }

  // async sendToMongodb() {
  //   // to be implemented
  // }
}
