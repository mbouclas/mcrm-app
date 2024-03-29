import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { MenuItemService } from "~website/menu/menu-item.service";
import { MenuService } from "~website/menu/menu.service";
import { MenuModel } from "~website/menu/models/menu.model";
import { MenuItemController } from "~website/menu/menu-item.controller";
import { IGenericObject } from "~models/general";
import { PermalinkBuilderService } from "~website/menu/permalink-builder.service";
import BaseHttpException from "~shared/exceptions/base-http-exception";

@Controller('api/menu')
export class MenuController {

/*
  onApplicationBootstrap() {
    setTimeout(async () => {
      // const itemService = new MenuItemService();
      // const s = await itemService.getRootTree();
      const service = new MenuService();
      const s = await service.findOne({ slug: 'top-menu' }, ['*']);
      console.log(s)
    });
  }
*/

  @Get('tree')
  async tree() {
    const itemService = new MenuItemService();
    return await itemService.getRootTree();
  }

  @Get('')
  async getMenus() {
    const service = new MenuService();
    return await service.find({}, ['*']);
  }

  @Get(':id')
  async getMenu(@Param('id') id: string) {
    const res = await new MenuService().findOne({ uuid: id });
    res['menuItem'] = await new MenuItemController().tree(id);

    return res;
  }

  @Patch(':id')
  async updateMenu(@Param('id') id: string, @Body() body: Partial<MenuModel>)
  {
    console.log(body)
    return await new MenuService().update(id, body);
  }

  @Post()
  async createMenu(@Body() body: Partial<MenuModel>) {
    return await new MenuService().store(body);
  }

  @Delete(':id')
  async deleteMenu(@Param('id') id: string) {
    return await new MenuService().delete(id);
  }

  @Post('make-permalink')
  async makePermalinkFromObject(@Body() body: {model: string, data: IGenericObject}) {
    try {
      return {
        permalink: new PermalinkBuilderService().build(body.model, body.data)
      };
    }
    catch (e) {
      throw new BaseHttpException({
        code: e.getCode(),
        statusCode: 500,
        error: e,
        reason: e.getMessage()
      });
    }
  }





  @Get('queries')
  async queries() {
    const itemService = new MenuItemService();
    const menuService = new MenuService();
    const menu = await menuService.findOne({ slug: 'top-menu' }, ['*']);

    const categories = [
      {
        "createdAt": "2023-05-22T01:27:33.626Z",
        "importName": "TEXTILE",
        "title": "Textile",
        "uuid": "4e0740c1-8a44-4afc-bded-7cc371ac1b97",
        "slug": "textile",
        "children": [
          {
            "createdAt": "2023-05-22T01:27:34.220Z",
            "importName": "KIDS AND BABY",
            "title": "Kids & Baby",
            "uuid": "f21748ad-f5c0-4838-a90e-1b6fb3ad45f6",
            "slug": "kids-baby",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:33.626Z",
                "importName": "TEXTILE",
                "title": "Textile",
                "uuid": "4e0740c1-8a44-4afc-bded-7cc371ac1b97",
                "slug": "textile"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:34.142Z",
            "importName": "WORKWEAR",
            "title": "Workwear",
            "uuid": "1cdb722e-4bfe-4a75-b0b4-d26a15b983ca",
            "slug": "workwear",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:33.626Z",
                "importName": "TEXTILE",
                "title": "Textile",
                "uuid": "4e0740c1-8a44-4afc-bded-7cc371ac1b97",
                "slug": "textile"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:34.066Z",
            "importName": "SPORTSWEAR",
            "title": "Sportswear",
            "uuid": "2154d76b-11ab-42c5-a108-fca4b2e41351",
            "slug": "sportswear",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:33.626Z",
                "importName": "TEXTILE",
                "title": "Textile",
                "uuid": "4e0740c1-8a44-4afc-bded-7cc371ac1b97",
                "slug": "textile"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:33.986Z",
            "importName": "CAPS AND HATS",
            "title": "Caps & Hats",
            "uuid": "4667bf27-29a7-4d60-95c1-584b3909b189",
            "slug": "caps-hats",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:33.626Z",
                "importName": "TEXTILE",
                "title": "Textile",
                "uuid": "4e0740c1-8a44-4afc-bded-7cc371ac1b97",
                "slug": "textile"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:33.906Z",
            "importName": "WINTER",
            "title": "Winter",
            "uuid": "1700f6ee-3af7-45a4-95ef-c2e60f047455",
            "slug": "winter",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:33.626Z",
                "importName": "TEXTILE",
                "title": "Textile",
                "uuid": "4e0740c1-8a44-4afc-bded-7cc371ac1b97",
                "slug": "textile"
              }
            ]
          },
          {
            "title": "Test",
            "uuid": "bd791507-b857-44a7-b855-7223cd456fda",
            "slug": "test",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:33.626Z",
                "importName": "TEXTILE",
                "title": "Textile",
                "uuid": "4e0740c1-8a44-4afc-bded-7cc371ac1b97",
                "slug": "textile"
              },
              {
                "createdAt": "2023-05-22T01:27:33.808Z",
                "importName": "SUMMER",
                "title": "Summer",
                "uuid": "85dfdcfe-b860-4d4f-8ac0-3eabf1d6f36d",
                "slug": "summer"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:33.808Z",
            "importName": "SUMMER",
            "title": "Summer",
            "uuid": "85dfdcfe-b860-4d4f-8ac0-3eabf1d6f36d",
            "slug": "summer",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:33.626Z",
                "importName": "TEXTILE",
                "title": "Textile",
                "uuid": "4e0740c1-8a44-4afc-bded-7cc371ac1b97",
                "slug": "textile"
              }
            ]
          }
        ]
      },
      {
        "createdAt": "2023-05-22T01:27:34.282Z",
        "importName": "OFFICE",
        "title": "Office",
        "uuid": "1bfc0baa-f84d-471a-abd6-745c680c7450",
        "slug": "office",
        "children": [
          {
            "createdAt": "2023-05-22T01:27:34.531Z",
            "importName": "LANYARDS",
            "title": "Lanyards",
            "uuid": "641c8a77-2b89-47ad-9515-b82950726077",
            "slug": "lanyards",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:34.282Z",
                "importName": "OFFICE",
                "title": "Office",
                "uuid": "1bfc0baa-f84d-471a-abd6-745c680c7450",
                "slug": "office"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:34.403Z",
            "importName": "LAPTOP BAGS",
            "title": "Laptop Bags",
            "uuid": "cd96ea1c-bcfb-40f4-9bf0-ab2c3350f83a",
            "slug": "laptop-bags",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:34.282Z",
                "importName": "OFFICE",
                "title": "Office",
                "uuid": "1bfc0baa-f84d-471a-abd6-745c680c7450",
                "slug": "office"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:34.744Z",
            "importName": "BRANDS",
            "title": "Brands",
            "uuid": "db06e832-428a-46fa-b1ec-2ff781433df6",
            "slug": "brands",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:34.282Z",
                "importName": "OFFICE",
                "title": "Office",
                "uuid": "1bfc0baa-f84d-471a-abd6-745c680c7450",
                "slug": "office"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:34.669Z",
            "importName": "FOLDERS AND NOTEBOOKS",
            "title": "Folders & Notebooks",
            "uuid": "5689395f-9229-475c-ba5c-0a39f5eb085f",
            "slug": "folders-notebooks",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:34.282Z",
                "importName": "OFFICE",
                "title": "Office",
                "uuid": "1bfc0baa-f84d-471a-abd6-745c680c7450",
                "slug": "office"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:34.584Z",
            "importName": "TECHNOLOGY",
            "title": "Technology",
            "uuid": "d8dd5f82-e1d9-4d5a-8026-b7361d5ed943",
            "slug": "technology",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:34.282Z",
                "importName": "OFFICE",
                "title": "Office",
                "uuid": "1bfc0baa-f84d-471a-abd6-745c680c7450",
                "slug": "office"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:34.326Z",
            "importName": "WRITING",
            "title": "Writing",
            "uuid": "857c5f19-0bf7-41d2-bda0-5927f23bbf59",
            "slug": "writing",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:34.282Z",
                "importName": "OFFICE",
                "title": "Office",
                "uuid": "1bfc0baa-f84d-471a-abd6-745c680c7450",
                "slug": "office"
              }
            ]
          }
        ]
      },
      {
        "createdAt": "2023-05-22T01:27:34.800Z",
        "importName": "GIFTS",
        "title": "Gifts",
        "uuid": "a3ddc384-6cda-49f7-a2f1-5e52254bcf90",
        "slug": "gifts",
        "children": [
          {
            "createdAt": "2023-05-22T01:27:35.409Z",
            "importName": "ANTIBACTERIAL",
            "title": "Antibacterial",
            "uuid": "48bce91b-6bc4-4430-8fb8-53467ee87588",
            "slug": "antibacterial",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:34.800Z",
                "importName": "GIFTS",
                "title": "Gifts",
                "uuid": "a3ddc384-6cda-49f7-a2f1-5e52254bcf90",
                "slug": "gifts"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:35.360Z",
            "importName": "SHOPPING BAGS",
            "title": "Shopping Bags",
            "uuid": "4f2676ab-94fb-460b-b49d-5070a146e9bf",
            "slug": "shopping-bags",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:34.800Z",
                "importName": "GIFTS",
                "title": "Gifts",
                "uuid": "a3ddc384-6cda-49f7-a2f1-5e52254bcf90",
                "slug": "gifts"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:35.295Z",
            "importName": "SUBLIMATION",
            "title": "Sublimation",
            "uuid": "370d1642-cd81-4113-9ff9-e5937076aad2",
            "slug": "sublimation",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:34.800Z",
                "importName": "GIFTS",
                "title": "Gifts",
                "uuid": "a3ddc384-6cda-49f7-a2f1-5e52254bcf90",
                "slug": "gifts"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:35.186Z",
            "importName": "SPORTS AND TRAVEL",
            "title": "Sports & Travel",
            "uuid": "766d1178-9abb-4b8e-ab71-bcfc1abc75b4",
            "slug": "sports-travel",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:34.800Z",
                "importName": "GIFTS",
                "title": "Gifts",
                "uuid": "a3ddc384-6cda-49f7-a2f1-5e52254bcf90",
                "slug": "gifts"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:35.125Z",
            "importName": "GIFTS AND PREMIUMS",
            "title": "Gifts & Premiums",
            "uuid": "cab0c9bd-e2ce-4b91-8631-51fafc007d34",
            "slug": "gifts-premiums",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:34.800Z",
                "importName": "GIFTS",
                "title": "Gifts",
                "uuid": "a3ddc384-6cda-49f7-a2f1-5e52254bcf90",
                "slug": "gifts"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:35.045Z",
            "importName": "MASKS AND HYGIENE",
            "title": "Masks & Hygiene",
            "uuid": "cd3300b7-83f2-4658-840c-fb9c096c917d",
            "slug": "masks-hygiene",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:34.800Z",
                "importName": "GIFTS",
                "title": "Gifts",
                "uuid": "a3ddc384-6cda-49f7-a2f1-5e52254bcf90",
                "slug": "gifts"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:34.965Z",
            "importName": "KIDS",
            "title": "Kids",
            "uuid": "b5fffe20-d608-4c2f-ba14-7e2d1bbfc0a6",
            "slug": "kids",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:34.800Z",
                "importName": "GIFTS",
                "title": "Gifts",
                "uuid": "a3ddc384-6cda-49f7-a2f1-5e52254bcf90",
                "slug": "gifts"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:34.915Z",
            "importName": "PERSONAL CARE",
            "title": "Personal Care",
            "uuid": "58d4dc9f-ea72-4647-bce9-c9bc915dfbbe",
            "slug": "personal-care",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:34.800Z",
                "importName": "GIFTS",
                "title": "Gifts",
                "uuid": "a3ddc384-6cda-49f7-a2f1-5e52254bcf90",
                "slug": "gifts"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:34.850Z",
            "importName": "WOMAN",
            "title": "Woman",
            "uuid": "b3f916e4-c7a3-42bf-8f62-307e1a4e89d3",
            "slug": "woman",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:34.800Z",
                "importName": "GIFTS",
                "title": "Gifts",
                "uuid": "a3ddc384-6cda-49f7-a2f1-5e52254bcf90",
                "slug": "gifts"
              }
            ]
          }
        ]
      },
      {
        "createdAt": "2023-05-22T01:27:35.485Z",
        "importName": "HOMEWEAR",
        "title": "Homewear",
        "uuid": "1f905629-120e-4ae8-b798-bddad1451e18",
        "slug": "homewear",
        "children": [
          {
            "createdAt": "2023-05-22T01:27:35.900Z",
            "importName": "TAKE AWAY",
            "title": "Take Away",
            "uuid": "d4011a68-f7c6-4d9a-a6c3-3d16b75e5b70",
            "slug": "take-away",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:35.485Z",
                "importName": "HOMEWEAR",
                "title": "Homewear",
                "uuid": "1f905629-120e-4ae8-b798-bddad1451e18",
                "slug": "homewear"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:35.787Z",
            "importName": "PET PRODUCTS",
            "title": "Pet Products",
            "uuid": "93a10c2f-041d-40b8-83c0-fac455ca006a",
            "slug": "pet-products",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:35.485Z",
                "importName": "HOMEWEAR",
                "title": "Homewear",
                "uuid": "1f905629-120e-4ae8-b798-bddad1451e18",
                "slug": "homewear"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:35.724Z",
            "importName": "BOTTLES AND THERMOS",
            "title": "Mugs, Bottles & Thermos",
            "uuid": "b4a5f5fa-cd87-4433-b391-d3e8097fbc27",
            "slug": "mugs-bottles-thermos",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:35.485Z",
                "importName": "HOMEWEAR",
                "title": "Homewear",
                "uuid": "1f905629-120e-4ae8-b798-bddad1451e18",
                "slug": "homewear"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:35.649Z",
            "importName": "TOOLS AND CAR",
            "title": "Tools & Car",
            "uuid": "dd0b64f9-8783-47d5-bd1a-9150729c96f5",
            "slug": "tools-car",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:35.485Z",
                "importName": "HOMEWEAR",
                "title": "Homewear",
                "uuid": "1f905629-120e-4ae8-b798-bddad1451e18",
                "slug": "homewear"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:35.574Z",
            "importName": "DECORATION AND HOME",
            "title": "Decoration & Home",
            "uuid": "836cfcb5-40c5-451b-841e-6620eb4fd1ef",
            "slug": "decoration-home",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:35.485Z",
                "importName": "HOMEWEAR",
                "title": "Homewear",
                "uuid": "1f905629-120e-4ae8-b798-bddad1451e18",
                "slug": "homewear"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:35.517Z",
            "importName": "WINE AND BAR ACCESSORIES",
            "title": "Wine & Bar Accessories",
            "uuid": "304a286a-82b0-47f4-b8cf-30c7fe86929b",
            "slug": "wine-bar-accessories",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:35.485Z",
                "importName": "HOMEWEAR",
                "title": "Homewear",
                "uuid": "1f905629-120e-4ae8-b798-bddad1451e18",
                "slug": "homewear"
              }
            ]
          }
        ]
      },
      {
        "createdAt": "2023-05-22T01:27:35.963Z",
        "importName": "SEASONAL",
        "title": "Seasonal",
        "uuid": "2a9148c1-4ee5-4d68-8c39-44bf639f585e",
        "slug": "seasonal",
        "children": [
          {
            "createdAt": "2023-05-22T01:27:36.137Z",
            "importName": "ECO FRIENDLY",
            "title": "Eco Friendly",
            "uuid": "6a5b0e38-4cf4-41c0-ba03-9fbbabbfa216",
            "slug": "eco-friendly",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:35.963Z",
                "importName": "SEASONAL",
                "title": "Seasonal",
                "uuid": "2a9148c1-4ee5-4d68-8c39-44bf639f585e",
                "slug": "seasonal"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:36.071Z",
            "importName": "PACKAGING",
            "title": "Packaging",
            "uuid": "886494aa-c099-4160-8ea9-00ed3c3def5d",
            "slug": "packaging",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:35.963Z",
                "importName": "SEASONAL",
                "title": "Seasonal",
                "uuid": "2a9148c1-4ee5-4d68-8c39-44bf639f585e",
                "slug": "seasonal"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:36.338Z",
            "importName": "EVENTS",
            "title": "Events",
            "uuid": "baa2a6c1-886e-4eea-8337-f3bcb2edca33",
            "slug": "events",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:35.963Z",
                "importName": "SEASONAL",
                "title": "Seasonal",
                "uuid": "2a9148c1-4ee5-4d68-8c39-44bf639f585e",
                "slug": "seasonal"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:36.282Z",
            "importName": "CHRISTMAS",
            "title": "Christmas",
            "uuid": "420065b4-416c-4d1c-b361-9e3cce523639",
            "slug": "christmas",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:35.963Z",
                "importName": "SEASONAL",
                "title": "Seasonal",
                "uuid": "2a9148c1-4ee5-4d68-8c39-44bf639f585e",
                "slug": "seasonal"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:36.193Z",
            "importName": "RAIN AND COLD",
            "title": "Rain & Cold",
            "uuid": "7b3d0aba-760e-46fd-81d3-1931ccf222c1",
            "slug": "rain-cold",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:35.963Z",
                "importName": "SEASONAL",
                "title": "Seasonal",
                "uuid": "2a9148c1-4ee5-4d68-8c39-44bf639f585e",
                "slug": "seasonal"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:35.988Z",
            "importName": "SUMMER AND BEACH",
            "title": "Seasonal & Beach",
            "uuid": "c102faca-f403-4e84-8692-d1056fa39037",
            "slug": "seasonal-beach",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:35.963Z",
                "importName": "SEASONAL",
                "title": "Seasonal",
                "uuid": "2a9148c1-4ee5-4d68-8c39-44bf639f585e",
                "slug": "seasonal"
              }
            ]
          }
        ]
      },
      {
        "createdAt": "2023-05-22T01:27:36.418Z",
        "importName": "OUTLET",
        "title": "Outlet",
        "uuid": "7750d0c1-46b5-4ae2-816e-0d33ee434cb3",
        "slug": "outlet"
      },
      {
        "createdAt": "2023-05-22T01:27:36.435Z",
        "importName": "AWARDS",
        "title": "Awards",
        "uuid": "d3e3e8c6-ab84-4e37-97f8-ff3c0dca241c",
        "slug": "awards",
        "children": [
          {
            "createdAt": "2023-05-22T01:27:36.716Z",
            "importName": "OTHER AWARDS",
            "title": "Other Awards",
            "uuid": "f9f21226-5bb4-462f-9bb1-79ae44bdf04e",
            "slug": "other-awards",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:36.435Z",
                "importName": "AWARDS",
                "title": "Awards",
                "uuid": "d3e3e8c6-ab84-4e37-97f8-ff3c0dca241c",
                "slug": "awards"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:36.638Z",
            "importName": "SPORTS AWARDS",
            "title": "Sports Awards",
            "uuid": "40d03f14-1110-48e2-b456-772f54f35426",
            "slug": "sports-awards",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:36.435Z",
                "importName": "AWARDS",
                "title": "Awards",
                "uuid": "d3e3e8c6-ab84-4e37-97f8-ff3c0dca241c",
                "slug": "awards"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:36.586Z",
            "importName": "TROPHIES",
            "title": "Trophies",
            "uuid": "74c87fa3-ac77-46ab-b6ff-e523f390b5d7",
            "slug": "trophies",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:36.435Z",
                "importName": "AWARDS",
                "title": "Awards",
                "uuid": "d3e3e8c6-ab84-4e37-97f8-ff3c0dca241c",
                "slug": "awards"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:36.517Z",
            "importName": "PLAQUES",
            "title": "Plaques",
            "uuid": "baff1d98-c45f-4590-a6af-ea9466fc75df",
            "slug": "plaques",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:36.435Z",
                "importName": "AWARDS",
                "title": "Awards",
                "uuid": "d3e3e8c6-ab84-4e37-97f8-ff3c0dca241c",
                "slug": "awards"
              }
            ]
          },
          {
            "createdAt": "2023-05-22T01:27:36.460Z",
            "importName": "MEDALS",
            "title": "Medals",
            "uuid": "779ed385-6a5e-4b8b-9778-cb20933f41ce",
            "slug": "medals",
            "parents": [
              {
                "createdAt": "2023-05-22T01:27:36.435Z",
                "importName": "AWARDS",
                "title": "Awards",
                "uuid": "d3e3e8c6-ab84-4e37-97f8-ff3c0dca241c",
                "slug": "awards"
              }
            ]
          }
        ]
      }
    ]



    const q = createCypherQuery('top-menu',categories);


    return q;
  }
}


function createCypherQuery(menuName: string, menu: any[], parent = null) {
  let queries = [];
  menu.forEach((item, index) => {


    let parentQuery = '';
    if (parent) {
      parentQuery = `
      WITH n
      MATCH (p:MenuItem {slug: "${parent.slug}"})
      WITH n,p
      MERGE (p)-[r:HAS_CHILD]->(n)
      ON CREATE SET r.createdAt = datetime(), r.updatedAt = datetime()
      ON MATCH SET r.updatedAt = datetime()
      `;
    }

    let menuSelectQuery = (!parent)? `MATCH (m:Menu {slug: "${menuName}"})` : '';
    let menuRelationQuery = (!parent)? `
    WITH m,n
    MERGE (m)-[r:HAS_CHILD]->(n)
          ON CREATE SET r.createdAt = datetime(), r.updatedAt = datetime()
      ON MATCH SET r.updatedAt = datetime()
    ` : '';
    const query = `
    ${menuSelectQuery}
    MERGE (n:MenuItem {itemId: "${item.uuid}"})
      SET n.title = "${item.title}", n.permalink = "/products/${item.slug}", n.slug = "${item.slug}", n.order = ${index}, n.active = true, n.itemId = "${item.uuid}", n.model = 'ProductCategory'
  ${menuRelationQuery}
      ${parentQuery}
      return *;
    `;


    queries.push(query);
        if (item.children) {
          queries = queries.concat(createCypherQuery(menuName, item.children, item));
        }
  });

  return queries.join('\n\n');
}
