import { Module } from '@nestjs/common';
import { Area51Service } from './area51.service';
import { Area51Controller } from './area51.controller';

@Module({
  providers: [Area51Service],
  controllers: [Area51Controller]
})
export class Area51Module {}
