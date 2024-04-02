const fs = require('fs-extra')

const path = './node_modules/@uniswap/sdk/package.json'
let data = fs.readJSONSync(path)
data.version = '3.0.3-beta.1'
fs.writeJSONSync(path, data, { spaces: 2 })
