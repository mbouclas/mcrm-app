import slugify from "slug";

const tree = [
  {
    title: "Textile",
    slug: slugify("Textile", { lower: true }),
    importName: "TEXTILE",
    children: [
      {
        title: "Summer",
        slug: slugify("Summer", { lower: true }),
        importName: "SUMMER",
      },
      {
        title: "Winter",
        slug: slugify("Winter", { lower: true }),
        importName: "WINTER",
      },
      {
        title: "Caps & Hats",
        slug: slugify("Caps & Hats", { lower: true }),
        importName: "CAPS AND HATS",
      },
      {
        title: "Sportswear",
        slug: slugify("Sportswear", { lower: true }),
        importName: "SPORTSWEAR",
      },
      {
        title: "Workwear",
        slug: slugify("Workwear", { lower: true }),
        importName: "WORKWEAR",
      },
      {
        title: "Kids & Baby",
        slug: slugify("Kids & Baby", { lower: true }),
        importName: "KIDS AND BABY",
      },
    ]
  },
  {
    title: "Office",
    slug: slugify("Office", { lower: true }),
    importName: "OFFICE",
    children: [
      {
        title: "Writing",
        slug: slugify("Writing", { lower: true }),
        importName: "WRITING",
      },
      {
        title: "Technology",
        slug: slugify("Technology", { lower: true }),
        importName: "TECHNOLOGY",
      },
      {
        title: "Folders & Notebooks",
        slug: slugify("Folders & Notebooks", { lower: true }),
        importName: "FOLDERS AND NOTEBOOKS",
      },
      {
        title: "Brands",
        slug: slugify("Brands", { lower: true }),
        importName: "BRANDS",
      },
    ]
  },
  {
    title: "Gifts",
    slug: slugify("Gifts", { lower: true }),
    importName: "GIFTS",
    children: [
      {
        title: "Woman",
        slug: slugify("Woman", { lower: true }),
        importName: "WOMAN",
      },
      {
        title: "Personal Care",
        slug: slugify("Personal Care", { lower: true }),
        importName: "PERSONAL CARE",
      },
      {
        title: "Kids",
        slug: slugify("Kids", { lower: true }),
        importName: "KIDS",
      },
      {
        title: "Masks & Hygiene",
        slug: slugify("Masks & Hygiene", { lower: true }),
        importName: "MASKS AND HYGIENE",
      },
      {
        title: "Gifts & Premiums",
        slug: slugify("Gifts & Premiums", { lower: true }),
        importName: "GIFTS AND PREMIUMS",
      },
      {
        title: "Sports & Travel",
        slug: slugify("Sports & Travel", { lower: true }),
        importName: "SPORTS AND TRAVEL",
      },
      {
        title: "Sublimation",
        slug: slugify("Sublimation", { lower: true }),
        importName: "SUBLIMATION",
      },
      {
        title: "Shopping Bags",
        slug: slugify("Shopping Bags", { lower: true }),
        importName: "SHOPPING BAGS",
      },
      {
        title: "Antibacterial",
        slug: slugify("Antibacterial", { lower: true }),
        importName: "ANTIBACTERIAL",
      },
    ]
  },
  {
    title: "Homewear",
    slug: slugify("Homewear", { lower: true }),
    importName: "HOMEWEAR",
    children: [
      {
        title: "Wine & Bar Accessories",
        slug: slugify("Wine & Bar Accessories", { lower: true }),
        importName: "WINE AND BAR ACCESSORIES",
      },
      {
        title: "Decoration & Home",
        slug: slugify("Decoration & Home", { lower: true }),
        importName: "DECORATION AND HOME",
      },
      {
        title: "Tools & Car",
        slug: slugify("Tools & Car", { lower: true }),
        importName: "TOOLS AND CAR",
      },
      {
        title: "Mugs, Bottles & Thermos",
        slug: slugify("Mugs, Bottles & Thermos", { lower: true }),
        importName: "MUGS",
      },
      {
        title: "Pet Products",
        slug: slugify("Pet Products", { lower: true }),
        importName: "PET PRODUCTS",
      },
      {
        title: "Take Away",
        slug: slugify("Take Away", { lower: true }),
        importName: "TAKEAWAY",
      },
    ],
  },
  {
    title: "Seasonal",
    slug: slugify("Seasonal", { lower: true }),
    importName: "SEASONAL",
    children: [
      {
        title: "Seasonal & Beach",
        slug: slugify("Seasonal & Beach", { lower: true }),
        importName: "SUMMER AND BEACH",
      },
      {
        title: "Rain & Cold",
        slug: slugify("Rain & Cold", { lower: true }),
        importName: "RAIN AND COLD",
      },
      {
        title: "Christmas",
        slug: slugify("Christmas", { lower: true }),
        importName: "CHRISTMAS",
      },
      {
        title: "Events",
        slug: slugify("Events", { lower: true }),
        importName: "EVENTS",
      },
    ],
  },
  {
    title: "Outlet",
    slug: slugify("Outlet", { lower: true }),
    importName: "OUTLET",
  },
  {
    title: "Awards",
    slug: slugify("Awards", { lower: true }),
    importName: "AWARDS",
    children: [
      {
        title: "Medals",
        slug: slugify("Medals", { lower: true }),
        importName: "MEDALS",
      },
      {
        title: "Plaques",
        slug: slugify("Plaques", { lower: true }),
        importName: "PLAQUES",
      },
      {
        title: "Trophies",
        slug: slugify("Trophies", { lower: true }),
        importName: "TROPHIES",
      },
      {
        title: "Sports Awards",
        slug: slugify("Sports Awards", { lower: true }),
        importName: "SPORTS AWARDS",
      },
      {
        title: "Other Awards",
        slug: slugify("Other Awards", { lower: true }),
        importName: "OTHER AWARDS",
      },
    ]
  },
];

for (let i = 0; i < tree.length; i++) {
  console.log(createCypher(tree[i]));
  if (tree[i].children) {
    for (let j = 0; j < tree[i].children.length; j++) {
      console.log(createCypher(tree[i].children[j]));
      console.log(relateChildToParent(tree[i].children[j], tree[i]));
    }
  }
}

function createCypher(item) {
  return `MERGE (n:ProductCategory {slug: '${item.slug}'}) set n.title = '${item.title}', n.importName = '${item.importName}', n.createdAt = datetime() return *;`;
}

function relateChildToParent(child, parent) {
  return `
  MATCH (parent:ProductCategory {slug:'${parent.slug}'})
  MATCH (child:ProductCategory {slug:'${child.slug}'})
  
  MERGE (parent)-[r1:HAS_CHILD]->(child) ON CREATE SET r1.createdAt = datetime() ON MATCH SET r1.updatedAt = datetime()
  RETURN *;
  `;
}
