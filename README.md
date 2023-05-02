This is the base project.
additional customization will be imported from either an npm git module or a 
git submodule
# Installation
* Run the APOC UUID First
* Then the Model.cyp

### TODO Import
* when all queues are drained, then inform the admin somehow
* Import templates
* Validate the variants
* Import properties and values
* Validate the properties and values

### TODO Photos Import
* The first variants image is the main image. Add it to the product as thumb
* If the image is main then add it to the variant as a thumb property


### Export products list
* Call export products `http://localhost:3003/sync/astro/products?page=1&limit=1&rels[]=category&rels[]=manufacturer&rels[]=variants&rels[]=images`
* Export All images with rels `match (n:Image)-[r]-(m) return *` and build a map per model/rel. Some rels contain extra images where `type !== 'main'`
* Foreach of the images with model `Product`, attach the image to the product list
* Foreach of the images with model `ProductVariant`, attach the image to the product variant within the product list
* Get all properties and values, will use them for lookups 
