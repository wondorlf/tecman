import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator.js';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener mi perfil' })
  getProfile(@GetCurrentUser('id') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Actualizar mi perfil' })
  updateProfile(@GetCurrentUser('id') userId: string, @Body() dto: Partial<CreateUserDto>) {
    // Prevent non-admins from changing their role or active status through this endpoint
    const { roleId: _roleId, active: _active, ...safeData } = dto as any;
    return this.usersService.update(userId, safeData);
  }

  @Get('roles')
  @ApiOperation({ summary: 'Listar roles disponibles' })
  getRoles() {
    return this.usersService.getRoles();
  }

  @Post()
  @Roles('Administrador')
  @ApiOperation({ summary: 'Crear usuario' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuarios con paginación y búsqueda' })
  findAll(@Query() query: Record<string, string>) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Actualizar usuario' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateUserDto>) {
    return this.usersService.update(id, dto);
  }

  @Put(':id/toggle')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Activar o desactivar usuario' })
  toggle(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }
}
