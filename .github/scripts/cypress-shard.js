const glob = require('glob')

const shard = Number(process.argv[2])
const totalShards = Number(process.argv[3])

const specs = glob.sync('integration_tests/e2e/**/*.cy.ts').sort()

const shardSpecs = specs.filter((_, index) => index % totalShards === shard - 1)
process.stdout.write(shardSpecs.join(','))
