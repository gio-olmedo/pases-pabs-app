const { DataSource } = require('typeorm');
const { User } = require('../entities/User');

const AppDataSource = new DataSource({
    type: 'sqlite',
    database: './database.sqlite',
    synchronize: true,
    logging: false,
    entities: [User]
});

module.exports = { AppDataSource };
