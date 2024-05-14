import pg from "pg";

class DBClient {
    clientData = {
        host: 'localhost',
        user: 'postgres',
        password: 'qwerty',
        port: 5432
    }
    client = new pg.Client(this.clientData)
    isConnected = false
    isLog = false
    isTimer = false

    constructor({isLog = false, isTimer = false}) {
        this.isLog = isLog
        this.isTimer = isTimer
    }

    async exec(sqlQuery) {
        const start = new Date().getTime();
        if (!this.isConnected) {
            await this.client.connect()
            this.isConnected = true
        }
        const res = await this.client.query(sqlQuery)
        if (this.isLog) {
            const resLog = {
                command: res['command'],
                rowCount: res['rowCount'],
                rows: res['rows']
            }
            console.log(resLog)
        }
        const end = new Date().getTime();
        if (this.isTimer) console.log(`${end - start}ms`)
        return res
    }

    async connect() {
        if (!this.isConnected) {
            await this.client.connect()
            this.isConnected = true
        } else {
            console.log('DB is connected')
        }
    }

    async close() {
        if (this.isConnected) {
            await this.client.end()
            this.isConnected = false
        } else {
            console.log('DB is not connected')
        }
    }

    async changeDatabase(database) {
        await this.close();
        this.clientData.database = database
        this.client = new pg.Client(this.clientData)
        await this.connect()
    }

    async getAllDatabases() {
        const query = 'SELECT datname FROM pg_database;'
        const {rows} = await this.exec(query)
        return rows.map((row) => row['datname'])
    }

    async createDatabase(database) {
        const query = `CREATE DATABASE ${database};`
        await this.exec(query)
    }

    async dropDatabase(database) {
        const query = `DROP DATABASE IF EXISTS ${database};`
        await this.exec(query)
    }

    async getAllTables(database) {
        await this.changeDatabase(database)
        const query = `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';`
        const {rows} = await this.exec(query)
        return rows.map((row) => row['tablename'])
    }

    async createTable(database, table) {
        await this.changeDatabase(database)
        const query = `CREATE TABLE ${table} ();`
        await this.exec(query)
    }

    async dropTable(database, table) {
        await this.changeDatabase(database)
        const query = `DROP TABLE IF EXISTS ${table};`
        await this.exec(query)
    }

    async changeNameTable(database, oldName, newName) {
        await this.changeDatabase(database)
        const query = `ALTER TABLE ${oldName} RENAME TO ${newName};`
        await this.exec(query)
    }

    async getAllColumns(database, table) {
        await this.changeDatabase(database)
        const query = `
            SELECT 
                c.column_name,
                c.column_default,
                c.is_nullable,
                c.data_type,
                tc.constraint_name,
                tc.constraint_type
            FROM information_schema.columns c LEFT JOIN information_schema.key_column_usage kcu 
            ON c.table_schema = kcu.table_schema 
            AND c.table_name = kcu.table_name AND c.column_name = kcu.column_name
            LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_schema = tc.constraint_schema 
            AND kcu.constraint_name = tc.constraint_name WHERE c.table_schema = 'public' AND c.table_name = '${table}';`
        const {rows} = await this.exec(query)
        return rows.map((row) => {
            return {
                columnName: row['column_name'],
                columnDefault: row['column_default'],
                isNullable: row['is_nullable'] !== 'NO',
                dataType: row['data_type'],
                constraintName: row['constraint_name'],
                constraintType: row['constraint_type']
            }
        })
    }
}

export default DBClient