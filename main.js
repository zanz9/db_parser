import DBClient from "./DBClient.js";
const client = new DBClient({
    isLog: true,
    isTimer: true
})
const databases = await client.getAllDatabases()
const tables = await client.getAllTables(databases[0])
console.log(tables)
const columns = await client.getAllColumns(databases[0], 'users')

await client.close()
