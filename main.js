import DBClient from "./DBClient.js";

const client = new DBClient({
    isLog: false,
    isTimer: true
})
const databases = await client.getAllDatabases()
const database = databases[0]
const tables = await client.getAllTables(databases[0])
const columns = await client.getAllColumns(database, 'users')
console.log(columns)
await client.close()
