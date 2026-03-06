import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './schemas/category.schema';
import { SubCategory, SubCategorySchema } from './schemas/subcategory.schema';
import { CategoriesService } from './categories.service';
import {
    CategoriesPublicController,
    CategoriesAdminController,
    SubCategoriesAdminController,
} from './categories.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Category.name, schema: CategorySchema },
            { name: SubCategory.name, schema: SubCategorySchema },
        ]),
    ],
    controllers: [
        CategoriesPublicController,
        CategoriesAdminController,
        SubCategoriesAdminController,
    ],
    providers: [CategoriesService],
    exports: [CategoriesService],
})
export class CategoriesModule { }
