import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ManufacturerModule } from './manufacturer/manufacturer.module';
import { PropertyModule } from './property/property.module';
import { ImportModule } from './import/import.module';
import { ExportModule } from './export/export.module';
import { SearchModule } from './search/search.module';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [
    ProductModule,
    ReviewsModule,
    ManufacturerModule,
    PropertyModule,
    ImportModule,
    ExportModule,
    SearchModule,
    SyncModule
  ],
})
export class CatalogueModule {}
