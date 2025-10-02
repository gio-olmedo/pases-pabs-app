require("reflect-metadata");
const { DataSource } = require('typeorm');
const { User } = require('../entities/User');
const { Folios } = require('../entities/Folios');

const AppDataSource = new DataSource({
    type: 'sqlite',
    database: './database.sqlite',
    synchronize: true,
    logging: false,
    entities: [User, Folios]
});

module.exports = { AppDataSource };
