module.exports = {
    "editableRegions": [
      {
        name: 'homepage',
        label: 'Homepage',
        regions: [
          {
            name: 'slider',
            label: 'Slider',
            type: 'generic',
            allow: ['item'],
            maxItemsAllowed: 5,
            regionSettings: {
              itemSelector: {
                allow: ['Product', 'Page']
              }
            }
          }
        ]
      }
    ]
}
