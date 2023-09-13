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
* Allow for all products to be processed. Now we only allow 1



### Export products list
* Call export products `http://localhost:3003/sync/astro/products?page=1&limit=1&rels[]=category&rels[]=manufacturer&rels[]=variants&rels[]=images`
* Export All images with rels `match (n:Image)-[r]-(m) return *` and build a map per model/rel. Some rels contain extra images where `type !== 'main'`
* Foreach of the images with model `Product`, attach the image to the product list
* Foreach of the images with model `ProductVariant`, attach the image to the product variant within the product list
* Get all properties and values, will use them for lookups 

### ES
* Create a new index
* variants is nested and contains the id, title, price, thumb, color, sku, slug
* color is a nested property on the root. Contains code, id, name, slug
* categories is a nested property


* On cart add pull all the rules and see if any of them apply to the cart
* Need to scan the product first to see if there's a rule for this product
