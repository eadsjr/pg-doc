/// TODO: interactive terminal test
/// TODO: hook into pgdoc.js for direct run case
/// TODO: load config from file
/// TODO: Change examples/tests to a template application example.

const pgdoc = require(`./pgdoc.js`)
const str = pgdoc.JSON.stringify
const assert = require(`assert`)
const rl = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

let config
try {
  config = require(`./config.js`)
  rl.write(`NOTE: config loaded from ./config.js\n\n`)
}
catch (err) {
  rl.write(`NOTE: config generated from defaults\n\n`)
  config = {}
  config.username = `pgdoc`
  config.password = `password`
  config.hostname = `127.0.0.1`
  config.port     = `5432`
  config.database = `pgdoc`
  config.connectionString = `postgres://${config.username}:${config.password}@${config.hostname}:${config.port}/${config.database}`
  config.schema   = `pgdoc`
  config.verbose  = false
  config.quiet    = false
}

let testBasic = async () => {
  rl.write(`Testing Basic Use Cases...\n`)
  rl.write(`connect()...                                                   `)
  let connectionString = config.connectionString
  let options = { verbose: config.verbose }
  let rv = await pgdoc.connect( { connectionString, options } )
  assert( !rv.error )
  rl.write(`passed.\n`)

  rl.write(`configure()...                                                 `)
  rv = await pgdoc.configure( { options: { verbose: config.verbose, quiet: config.quiet } } )
  assert( !rv.error )
  rl.write(`passed.\n`)

  let type = `pgdocTest`

  rl.write(`requestID()...                                                 `)
  rv = await pgdoc.requestID( { type } )
  assert( !rv.error )
  let id = rv
  rl.write(`passed.\n  ID: ${id}\n`)

  rl.write(`ensuring no conflicting records in database via delete()...    `)
  rv = await pgdoc.delete( { type: `pgdocTest` } )
  assert( !rv.error )
  rl.write(`passed.\n  Deleted ${rv.deleted} documents.\n`)

  let doc = { id, x: 1, y: 2, z: 3 }

  rl.write(`store()...                                                     `)
  rv = await pgdoc.store( { type, doc } )
  assert( !rv.error )
  rl.write(`passed.\n  Stored: ${str(doc)}\n`)

  let search = { id }

  rl.write(`retrieve()...                                                  `)
  rv = await pgdoc.retrieve( { type, search } )
  assert( rv.length == 1 )
  rl.write(`passed.\n  Retrieved: ${str(rv[0])}\n`)

  rl.write(`delete()...                                                    `)
  rv = await pgdoc.delete( { type, search } )
  assert( !rv.error )
  assert( rv.deleted == 1 )
  rl.write(`passed.\n  Deleted ${rv.deleted} documents.\n`)

  rl.write(`Testing Basic Use Cases...                                     passed.\n\n`)

  process.exit(0)
}

let testAdvanced = async () => {
  rl.write(`Testing Advanced Use Cases...\n`)

  let connectionString = config.connectionString
  let options = { verbose: config.verbose }
  let rv = await pgdoc.connect( { connectionString, options } )
  assert( !rv.error )

  let type = `pgdocTest`

  rl.write(`ensuring no conflicting records in database via delete()...    `)
  rv = await pgdoc.delete( { type: `pgdocTest` } )
  assert( !rv.error )
  rl.write(`passed.\n  Deleted ${rv.deleted} documents.\n`)

  rl.write(`store() search test...                                         `)
  let oldDoc = { id: `-15`, v: 1 }
  rv = await pgdoc.store( { type, doc: oldDoc } )
  assert( !rv.error )
  assert( rv.deleted == 0 )
  let newDoc = { id: `-15`, v: 2 }
  let search = { id: `-15` }
  rv = await pgdoc.store( { type, doc: newDoc, search } )
  assert( !rv.error )
  assert( rv.deleted == 1 )
  rl.write(`passed.\n  Stored: ${str(oldDoc)}\n  Updated: ${str(newDoc)}\n`)

  rl.write(`store() search + maxMatch test...                              `)
  oldDoc = { id: `-16`, v: 1 }
  rv = await pgdoc.store( { type, doc: oldDoc } )
  assert( !rv.error )
  assert( rv.deleted == 0 )
  newDoc = { id: `-16`, v: 2 }
  search = { id: `-16` }
  let maxMatch = 1
  rv = await pgdoc.store( { type, doc: newDoc, search, maxMatch } )
  assert( !rv.error )
  assert( rv.deleted == 1 )
  rl.write(`passed.\n  Stored: ${str(oldDoc)}\n  Updated: ${str(newDoc)}\n`)

  rl.write(`store() search, exclude test...                                `)
  oldDoc = { id: `-17`, v: 1, ignore: false }
  rv = await pgdoc.store( { type, doc: oldDoc } )
  assert( !rv.error )
  assert( rv.deleted == 0 )
  oldDoc2 = { id: `-17`, v: 1, ignore: true }
  rv = await pgdoc.store( { type, doc: oldDoc2 } )
  assert( !rv.error )
  assert( rv.deleted == 0 )
  newDoc = { id: `-17`, v: 100, ignore: false }
  search = { id: `-17` }
  let exclude = { ignore: true }
  rv = await pgdoc.store( { type, doc: newDoc, search, exclude } )
  assert( !rv.error )
  assert( rv.deleted == 1 )
  let deleted = rv.deleted
  rv = await pgdoc.retrieve( { type, search } )
  assert( rv.length == 2 )
  rl.write(`passed.\n  Stored: ${str(oldDoc)}\n  Stored: ${str(oldDoc2)}\n  Updated: ${str(newDoc)}\n  Deleted: ${deleted}\n  Retrieved: ${str(rv[0])}\n  Retrieved: ${str(rv[1])}\n`)


  rl.write(`store() search + maxMatch, exclude test...                     `)
  oldDoc = { id: `-18`, v: 1, ignore: false }
  rv = await pgdoc.store( { type, doc: oldDoc } )
  assert( !rv.error )
  assert( rv.deleted == 0 )
  oldDoc2 = { id: `-18`, v: 100, ignore: true }
  rv = await pgdoc.store( { type, doc: oldDoc2 } )
  assert( !rv.error )
  assert( rv.deleted == 0 )
  newDoc = { id: `-18`, v: 2 }
  search = { id: `-18` }
  maxMatch = 1
  exclude = { ignore: true }
  rv = await pgdoc.store( { type, doc: newDoc, search, exclude, maxMatch } )
  assert( !rv.error )
  assert( rv.deleted == 1 )
  rl.write(`passed.\n  Stored: ${str(oldDoc)}\n  Stored: ${str(oldDoc2)}\n  Updated: ${str(newDoc)}\n  Deleted: ${rv.deleted}\n`)



  // console.error(rv)
  // console.error(!rv.error)
  // rv = await pgdoc.configure( { options: { verbose: true, quiet: false } } )

}

let testErrors = async () => {}

tests = async () => {
  // await testBasic()
  await testAdvanced()
  // await testErrors()
  process.exit(0)
}
try {
  tests()
}
catch (err) {
  console.error(err)
  process.exit(1)
}
