import { ImageService } from "~image/image.service";
import { projectRoot } from "~root/main";

export class ExportImages {
  async run() {
    const service = new ImageService();
    const res = await service.find({limit: 1000});
    let csv = [];
    csv = csv.concat(res.data);
    for (let page = 2; page <= res.pages; page++) {
      console.log(`Page ${page} of ${res.pages}`);
      const data = await service.find({page, limit: 1000});
      csv = csv.concat(data.data);
    }
    // write csv to a file
    const fs = require('fs');
    const path = require('path');
    fs.writeFileSync(path.join(projectRoot, 'logs', 'images.json'), JSON.stringify(csv));
    console.log(`Got ${res.total} images and wrote ${csv.length} to images.json`);
  }
}
