import {
    Injectable, NotFoundException, ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { SubCategory, SubCategoryDocument } from './schemas/subcategory.schema';
import { CreateCategoryDto, UpdateCategoryDto, ReorderDto } from './dto/category.dto';
import { CreateSubCategoryDto, UpdateSubCategoryDto } from './dto/subcategory.dto';

function slugify(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

@Injectable()
export class CategoriesService {
    constructor(
        @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
        @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategoryDocument>,
    ) { }

    // ─────────────────────────── CATEGORY CRUD ────────────────────────────────

    async createCategory(dto: CreateCategoryDto): Promise<Category> {
        const slug = slugify(dto.name);

        const exists = await this.categoryModel.findOne({ slug }).lean();
        if (exists) throw new ConflictException(`Category with slug "${slug}" already exists`);

        // Default displayOrder = current max + 1
        if (dto.displayOrder === undefined) {
            const last = await this.categoryModel.findOne().sort({ displayOrder: -1 }).lean();
            dto.displayOrder = last ? (last as any).displayOrder + 1 : 0;
        }

        const category = new this.categoryModel({ ...dto, slug });
        return category.save();
    }

    async findAllCategories(activeOnly = false): Promise<Category[]> {
        const filter = activeOnly ? { isActive: true } : {};
        return this.categoryModel.find(filter).sort({ displayOrder: 1 }).lean();
    }

    async findCategoryBySlug(slug: string): Promise<Category> {
        const category = await this.categoryModel.findOne({ slug }).lean();
        if (!category) throw new NotFoundException(`Category "${slug}" not found`);
        return category;
    }

    async updateCategory(id: string, dto: UpdateCategoryDto): Promise<Category> {
        const update: any = { ...dto };

        if (dto.name) {
            const newSlug = slugify(dto.name);
            const conflict = await this.categoryModel.findOne({ slug: newSlug, _id: { $ne: new Types.ObjectId(id) } }).lean();
            if (conflict) throw new ConflictException(`Slug "${newSlug}" already in use`);
            update.slug = newSlug;
        }

        const updated = await this.categoryModel.findByIdAndUpdate(id, update, { new: true }).lean();
        if (!updated) throw new NotFoundException('Category not found');
        return updated;
    }

    async deleteCategory(id: string, force = false): Promise<void> {
        const category = await this.categoryModel.findById(id).lean();
        if (!category) throw new NotFoundException('Category not found');

        const subCount = await this.subCategoryModel.countDocuments({ categoryId: new Types.ObjectId(id) });
        if (subCount > 0 && !force) {
            throw new BadRequestException(
                `Cannot delete: ${subCount} subcategory(ies) exist. Use force=true to cascade delete.`,
            );
        }

        if (force) {
            await this.subCategoryModel.deleteMany({ categoryId: new Types.ObjectId(id) });
        }

        await this.categoryModel.findByIdAndDelete(id);
    }

    async reorderCategories(dto: ReorderDto): Promise<void> {
        const ops = dto.items.map(item =>
            this.categoryModel.findByIdAndUpdate(item.id, { displayOrder: item.displayOrder }).exec(),
        );
        await Promise.all(ops);
    }

    // ─────────────────────────── SUBCATEGORY CRUD ─────────────────────────────

    async createSubCategory(dto: CreateSubCategoryDto): Promise<SubCategory> {
        const category = await this.categoryModel.findById(dto.categoryId).lean();
        if (!category) throw new NotFoundException('Parent category not found');

        const slug = slugify(`${(category as any).name}-${dto.name}`);

        const exists = await this.subCategoryModel.findOne({
            categoryId: new Types.ObjectId(dto.categoryId),
            name: dto.name,
        }).lean();
        if (exists) throw new ConflictException(`Subcategory "${dto.name}" already exists in this category`);

        if (dto.displayOrder === undefined) {
            const last = await this.subCategoryModel
                .findOne({ categoryId: new Types.ObjectId(dto.categoryId) })
                .sort({ displayOrder: -1 })
                .lean();
            dto.displayOrder = last ? (last as any).displayOrder + 1 : 0;
        }

        const subCategory = new this.subCategoryModel({
            ...dto,
            slug,
            categoryId: new Types.ObjectId(dto.categoryId),
        });
        return subCategory.save();
    }

    async findSubCategoriesByCategoryId(
        categoryId: string,
        activeOnly = false,
    ): Promise<SubCategory[]> {
        const filter: any = { categoryId: new Types.ObjectId(categoryId) };
        if (activeOnly) filter.isActive = true;
        return this.subCategoryModel.find(filter).sort({ displayOrder: 1 }).lean();
    }

    async updateSubCategory(id: string, dto: UpdateSubCategoryDto): Promise<SubCategory> {
        const update: any = { ...dto };

        if (dto.categoryId) {
            update.categoryId = new Types.ObjectId(dto.categoryId);
        }

        if (dto.name) {
            const sub = await this.subCategoryModel.findById(id).lean();
            if (!sub) throw new NotFoundException('Subcategory not found');
            const catId = (dto.categoryId ? new Types.ObjectId(dto.categoryId) : (sub as any).categoryId);
            const category = await this.categoryModel.findById(catId).lean();
            update.slug = slugify(`${(category as any)?.name ?? 'cat'}-${dto.name}`);
        }

        const updated = await this.subCategoryModel.findByIdAndUpdate(id, update, { new: true }).lean();
        if (!updated) throw new NotFoundException('Subcategory not found');
        return updated;
    }

    async deleteSubCategory(id: string): Promise<void> {
        const deleted = await this.subCategoryModel.findByIdAndDelete(id);
        if (!deleted) throw new NotFoundException('Subcategory not found');
    }

    async reorderSubCategories(dto: ReorderDto): Promise<void> {
        const ops = dto.items.map(item =>
            this.subCategoryModel.findByIdAndUpdate(item.id, { displayOrder: item.displayOrder }).exec(),
        );
        await Promise.all(ops);
    }
}
