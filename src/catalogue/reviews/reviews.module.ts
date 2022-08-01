import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";
import { ReviewModel } from "~catalogue/reviews/review.model";

@Module({
  imports: [
    SharedModule,
  ],
  providers: [
    ReviewModel
    ]
})
export class ReviewsModule {}
