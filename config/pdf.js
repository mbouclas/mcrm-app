const { resolve } = require("path");
module.exports = {
  driver: 'PdfCreator',
  serviceOptions: {
    saveToObjectStorage: true,
    bucketName: 'pdfs',
  },
  driverOptions: {
    outputDirectory: resolve(process.cwd(), 'upload'),
    format: "A4",
    orientation: "portrait",
    border: "10mm",
    headerTemplate: null,
    header: {
      height: "45mm",
      contents: `<div style="text-align: center;">Author: Shyam Hajare</div>`
    },
    footerTemplate: null,
    footer: {
      height: "28mm",
      contents: {
        // first: 'Cover page',
        // 2: 'Second page', // Any page number is working. 1-based index
        default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
        // last: 'Last Page'
      }
    },
  }
}
