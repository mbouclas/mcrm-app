import { BaseNeoService } from "~shared/services/base-neo.service";

export class OrderStatsService extends BaseNeoService {
  public processors: Function[] = [
    this.salesByDate,
    this.salesByMonth,
    this.salesByYear,
    this.salesByCategory,
    this.predictNextMonthSales,
    this.salesByProduct,
    this.salesByCustomer,
    this.topGrossingUsers,
    this.topGrossingCategories,
    this.topGrossingProducts,
    this.topGrossingProductsByCategory,
    this.topGrossingProductVariants,
  ];

  async getAggregateStats() {
    // get total number of orders, total sales, total customers, total products
    const query = `
    MATCH (o:Order)
    WITH COUNT(o) AS totalOrders, SUM(o.total) AS totalSales
    MATCH (u:User)
    WITH totalOrders, totalSales, COUNT(u) AS totalUsers
    MATCH (p:Product)
    WITH totalOrders, totalSales, totalUsers, COUNT(p) AS totalProducts
    MATCH (u:User)-[:HAS_ROLE]->(r:Role {name: "customer"})
    RETURN totalOrders, totalSales, totalUsers, totalProducts, COUNT(DISTINCT u) AS totalCustomers
    `;

    const res = await this.neo.readWithCleanUp(query);

    return res[0];
  }

  async salesByDate(days = 30) {
    const query = `
    MATCH (o:Order)
  WHERE o.createdAt >= datetime() - duration({days: ${days}})
RETURN date(o.createdAt) AS saleDate, COUNT(o) AS totalSales
  ORDER BY saleDate;
    `;

    return await this.neo.readWithCleanUp(query);
  }

  async salesByMonth(months = 6) {
    const query = `
    MATCH (o:Order)
  WHERE o.createdAt >= datetime() - duration({months: ${months}})
RETURN
  date({
    year: o.createdAt.year,
    month: o.createdAt.month,
    day: 1
  }) AS saleMonth,
  COUNT(o) AS totalSales
  ORDER BY saleMonth;
    `;

    return await this.neo.readWithCleanUp(query);
  }

  async salesByYear(years = 3) {
    const query = `
    MATCH (o:Order)
  WHERE o.createdAt >= datetime() - duration({years: ${years}})
RETURN
  date({
    year: o.createdAt.year,
    month: 1,
    day: 1
  }) AS saleYear,
  COUNT(o) AS totalSales
  ORDER BY saleYear;
    `;

    return await this.neo.readWithCleanUp(query);
  }

  async salesByCategory(limit = 5, days = 30) {
    const query = `
    MATCH (o:Order)-[:HAS_ITEM]->(p:Product)-[:HAS_CATEGORY]->(c:ProductCategory)
    WHERE o.createdAt >= datetime() - duration({days: ${days}})
    WITH c, COUNT(o) AS orderCount
    ORDER BY orderCount DESC
    LIMIT ${limit}
    RETURN c AS category, orderCount
    `;

    return await this.neo.readWithCleanUp(query);
  }

  async predictNextMonthSales(previousMonths = 6) {
    const query = `
    MATCH (o:Order)
  WHERE o.createdAt >= datetime() - duration({months: ${previousMonths}})
WITH date({
  year: o.createdAt.year,
  month: o.createdAt.month,
  day: 1
}) AS saleDate, o
WITH saleDate, COUNT(o) AS count
WITH COLLECT({saleDate: saleDate, count: count}) AS salesData
WITH salesData,
     REDUCE(s = 0, x IN salesData | s + x.count) AS totalSales,
     size(salesData) AS numMonths
WITH salesData,
     totalSales / numMonths AS averageSales
RETURN salesData,
       [
         {saleDate: date() + duration({months: 1}), count: averageSales},
         {saleDate: date() + duration({months: 2}), count: averageSales},
         {saleDate: date() + duration({months: 3}), count: averageSales}
       ] AS predictedSales;
    `;

    return await this.neo.readWithCleanUp(query);
  }

  async salesByProduct(limit = 5, days = 30) {
    const query = `
      MATCH (o:Order)-[:HAS_ITEM]->(p:Product)
      WHERE o.createdAt >= datetime() - duration({days: ${days}})
      WITH p, COUNT(o) AS orderCount
      ORDER BY orderCount DESC
      LIMIT ${limit}
      RETURN p AS product, orderCount
    `;

    return await this.neo.readWithCleanUp(query);
  }

  async salesByCustomer(limit = 5, days = 30) {
    const query = `
    MATCH (u:User)-[:HAS_CREATED]->(o:Order)
    WHERE o.createdAt >= datetime() - duration({days: ${days}})
    WITH u, COUNT(o) AS orderCount
    ORDER BY orderCount DESC
    LIMIT ${limit}
    RETURN u AS user, orderCount
    `;

    return await this.neo.readWithCleanUp(query);
  }

  async topGrossingUsers(limit = 5, days = 30) {
    const query = `
    MATCH (u:User)-[:HAS_CREATED]->(o:Order)
    WHERE o.createdAt >= datetime() - duration({days: ${days}})
    WITH u, SUM(o.total) AS totalAmount
    ORDER BY totalAmount DESC
    LIMIT ${limit}
    RETURN u AS user, totalAmount

    `;

    return await this.neo.readWithCleanUp(query);
  }

  async topGrossingCategories(limit = 5, days = 30) {
    const query = `
    MATCH (o:Order)-[:HAS_ITEM]->(p:Product)-[:HAS_CATEGORY]->(c:ProductCategory)
    WHERE o.createdAt >= datetime() - duration({days: ${days}})
    WITH c, SUM(o.total) AS totalSales
    ORDER BY totalSales DESC
    LIMIT ${limit}
    RETURN c AS category, totalSales
`;

    return await this.neo.readWithCleanUp(query);
  }

  async topGrossingProducts(limit = 5, days = 30) {
    const query = `
    MATCH (o:Order)-[:HAS_ITEM]->(p:Product)
    WHERE o.createdAt >= datetime() - duration({days: ${days}})
    WITH p, SUM(o.total) AS totalSales
    ORDER BY totalSales DESC
    LIMIT ${limit}
    RETURN p AS product, totalSales

    `;

    return await this.neo.readWithCleanUp(query);
  }

  async topGrossingProductsByCategory(limit = 5, days = 30) {
    const query = `
    MATCH (o:Order)-[:HAS_ITEM]->(p:Product)-[:HAS_CATEGORY]->(c:ProductCategory)
    WHERE o.createdAt >= datetime() - duration({days: ${days}})
    WITH c, p, SUM(o.total) AS totalSales
    ORDER BY c, totalSales DESC
    WITH c, COLLECT({product: p, totalSales: totalSales}) AS products
    LIMIT ${limit}
    RETURN c AS category, products[0..5] AS topGrossingProducts

    `;

    return await this.neo.readWithCleanUp(query);
  }

  async topGrossingProductVariants(limit = 5, days = 30) {
    const query = `
    MATCH (o:Order)-[:HAS_ITEM]->(p:Product)-[:HAS_VARIANTS]->(v:ProductVariant)
    WHERE o.createdAt >= datetime() - duration({days: ${days}})
    WITH v, p, COUNT(o) AS salesCount, SUM(o.total) AS totalSales
    ORDER BY totalSales DESC
    LIMIT ${limit}
    RETURN v AS variant, p AS product, salesCount, totalSales

    `;

    return await this.neo.readWithCleanUp(query);
  }

  /**
   * Runs all processors with defaults params
   * @param items
   */
  async loader(items = ['*']) {
    const promises: {[key: string]: any} = {};
    // load all
    if (items.length === 1 && items[0] === '*') {
      for (const processor of this.processors) {
        promises[processor.name] = await processor.bind(this)();
      }
    } else {
      // load specific
      for (const item of items) {
        const processor = this.processors.find((p) => p.name === item);
        if (processor) {
          promises[processor.name] = await processor.bind(this)();
        }
      }
    }

    return promises;

  }
}
