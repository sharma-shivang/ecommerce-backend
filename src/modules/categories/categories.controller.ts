import {
    Controller, Get, Post, Put, Delete, Patch,
    Param, Body, Query, UseGuards, ParseBoolPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto, ReorderDto } from './dto/category.dto';
import { CreateSubCategoryDto, UpdateSubCategoryDto } from './dto/subcategory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

// ════════════════════════════════════════
// PUBLIC ROUTES
// ════════════════════════════════════════
@Controller('categories')
export class CategoriesPublicController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Get()
    getActiveCategories() {
        return this.categoriesService.findAllCategories(true);
    }

    @Get(':slug')
    getCategoryBySlug(@Param('slug') slug: string) {
        return this.categoriesService.findCategoryBySlug(slug);
    }

    @Get(':categoryId/subcategories')
    getSubCategoriesByCategoryId(
        @Param('categoryId') categoryId: string,
        @Query('activeOnly', new DefaultValuePipe(true), ParseBoolPipe) activeOnly: boolean,
    ) {
        return this.categoriesService.findSubCategoriesByCategoryId(categoryId, activeOnly);
    }
}

// ════════════════════════════════════════
// ADMIN ROUTES
// ════════════════════════════════════════
@Controller('admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class CategoriesAdminController {
    constructor(private readonly categoriesService: CategoriesService) { }

    // ── Categories ─────────────────────────

    @Get()
    getAllCategories() {
        return this.categoriesService.findAllCategories(false);
    }

    @Post()
    createCategory(@Body() dto: CreateCategoryDto) {
        return this.categoriesService.createCategory(dto);
    }

    @Put(':id')
    updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
        return this.categoriesService.updateCategory(id, dto);
    }

    @Delete(':id')
    deleteCategory(
        @Param('id') id: string,
        @Query('force', new DefaultValuePipe(false), ParseBoolPipe) force: boolean,
    ) {
        return this.categoriesService.deleteCategory(id, force);
    }

    @Patch('reorder')
    reorderCategories(@Body() dto: ReorderDto) {
        return this.categoriesService.reorderCategories(dto);
    }

    // ── Subcategories ──────────────────────

    @Post('/admin/subcategories')
    createSubCategory(@Body() dto: CreateSubCategoryDto) {
        return this.categoriesService.createSubCategory(dto);
    }

    @Put('/admin/subcategories/:id')
    updateSubCategory(@Param('id') id: string, @Body() dto: UpdateSubCategoryDto) {
        return this.categoriesService.updateSubCategory(id, dto);
    }

    @Delete('/admin/subcategories/:id')
    deleteSubCategory(@Param('id') id: string) {
        return this.categoriesService.deleteSubCategory(id);
    }

    @Patch('/admin/subcategories/reorder')
    reorderSubCategories(@Body() dto: ReorderDto) {
        return this.categoriesService.reorderSubCategories(dto);
    }
}

// ════════════════════════════════════════
// ADMIN SUBCATEGORY ROUTES (Separate controller for cleaner routing)
// ════════════════════════════════════════
@Controller('admin/subcategories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SubCategoriesAdminController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    createSubCategory(@Body() dto: CreateSubCategoryDto) {
        return this.categoriesService.createSubCategory(dto);
    }

    @Put(':id')
    updateSubCategory(@Param('id') id: string, @Body() dto: UpdateSubCategoryDto) {
        return this.categoriesService.updateSubCategory(id, dto);
    }

    @Delete(':id')
    deleteSubCategory(@Param('id') id: string) {
        return this.categoriesService.deleteSubCategory(id);
    }

    @Patch('reorder')
    reorderSubCategories(@Body() dto: ReorderDto) {
        return this.categoriesService.reorderSubCategories(dto);
    }
}
