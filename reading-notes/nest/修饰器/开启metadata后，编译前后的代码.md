编译前：

```Typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ChromeService } from './chrome.service';
import { CreateChromeDto } from './dto/create-chrome.dto';
import { UpdateChromeDto } from './dto/update-chrome.dto';

function propertyDec() {
  return (target, property) => {
    console.log(target, property);
  };
}

function argsDec() {
  return (target, key, index) => {
    console.log(target, key, index);
  };
}

@Controller('chrome')
export class ChromeController {
  @propertyDec()
  prop = 1;

  @propertyDec()
  static prop1 = 2;

  constructor(private readonly chromeService: ChromeService) {}

  @Post('plugins')
  create(@Body() createChromeDto: CreateChromeDto) {
    return this.chromeService.create(createChromeDto);
  }

  @Get('plugins')
  findAll(@argsDec() name: string) {
    console.log(name);
    return this.chromeService.findAll();
  }

  @Get('plugins/:id')
  findOne(@Param('id') id: string) {
    return this.chromeService.findOne(+id);
  }

  @Patch('plugins/:id')
  update(@Param('id') id: string, @Body() updateChromeDto: UpdateChromeDto) {
    return this.chromeService.update(+id, updateChromeDto);
  }

  @Delete('plugins/:id')
  remove(@Param('id') id: string) {
    return this.chromeService.remove(+id);
  }
  @Delete('plugins/:id')
  static getAll(@Param('id') id: string) {}
}

```

编译后：

```JavaScript
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
        r = Reflect.decorate(decorators, target, key, desc);
    else
        for (var i = decorators.length - 1; i >= 0; i--)
            if (d = decorators[i])
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromeController = void 0;
const common_1 = require("@nestjs/common");
const chrome_service_1 = require("./chrome.service");
const create_chrome_dto_1 = require("./dto/create-chrome.dto");
const update_chrome_dto_1 = require("./dto/update-chrome.dto");
function propertyDec() {
    return (target, property) => {
        console.log(target, property);
    };
}
function argsDec() {
    return (target, key, index) => {
        console.log(target, key, index);
    };
}
let ChromeController = class ChromeController {
    constructor(chromeService) {
        this.chromeService = chromeService;
        this.prop = 1;
    }
    create(createChromeDto) {
        return this.chromeService.create(createChromeDto);
    }
    findAll(name) {
        console.log(name);
        return this.chromeService.findAll();
    }
    findOne(id) {
        return this.chromeService.findOne(+id);
    }
    update(id, updateChromeDto) {
        return this.chromeService.update(+id, updateChromeDto);
    }
    remove(id) {
        return this.chromeService.remove(+id);
    }
    static getAll(id) { }
};
exports.ChromeController = ChromeController;
ChromeController.prop1 = 2;
/**
 * 属性的元数据只有design:type，值为属性的类型，当没有明确指定类型时，会被统一推断为Object
 * 如果ts类型指定为number，那么design:type会为Number
 */
__decorate([
    propertyDec(),
    __metadata("design:type", Object)
], ChromeController.prototype, "prop", void 0);

/**
 * 方法的元数据，有design:type、design:paramtypes和design:returntype，分别为指定或推断的类型
 */
__decorate([
    (0, common_1.Post)('plugins'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_chrome_dto_1.CreateChromeDto]),
    __metadata("design:returntype", void 0)
], ChromeController.prototype, "create", null);

__decorate([
    (0, common_1.Get)('plugins'),
    __param(0, argsDec()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChromeController.prototype, "findAll", null);

__decorate([
    (0, common_1.Get)('plugins/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChromeController.prototype, "findOne", null);

__decorate([
    (0, common_1.Patch)('plugins/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_chrome_dto_1.UpdateChromeDto]),
    __metadata("design:returntype", void 0)
], ChromeController.prototype, "update", null);

__decorate([
    (0, common_1.Delete)('plugins/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChromeController.prototype, "remove", null);

__decorate([
    propertyDec(),
    __metadata("design:type", Object)
], ChromeController, "prop1", void 0);

__decorate([
    (0, common_1.Delete)('plugins/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChromeController, "getAll", null);

exports.ChromeController = ChromeController = __decorate([
    (0, common_1.Controller)('chrome'),
    __metadata("design:paramtypes", [chrome_service_1.ChromeService])
], ChromeController);
//# sourceMappingURL=chrome.controller.js.map
```

这里也许有个疑问，为啥 prop 和 prop1 已经被赋值为数字 1 了，为啥在编译后的元数据 design:type 中被推断为 Object，Typescript 本身具备类型推断，那么它们的类型也应该是 1 和 2，怎么也不应该为 OBject，这是为啥呢？

实际上，Typescript 确实会自动推断变量的类型，但是当涉及到装饰器和元数据反射时，情况却有所不同。元数据反射通常需要显示的类型注解来正确的推断和存储元数据。如果没有显示的类型注解，Typescript 编译器默认会将属性的类型视为 Object。这是因为装饰器的设计初衷是与类型系统松耦合，主要用于运行时的行为，而不仅仅是在编译时进行类型检查。

因此，即使从复制 1 和 2 可以推断出他们是 number 类型，但在使用装饰器和元数据时，如果没有显示指定类型，编译器还是会将
类型设为 Object。这是为了保证元数据能够在运行时正确描述属性，特别是在涉及到依赖注入或其他框架特性时，这种明确的类型标注变得尤为重要。
