const { EntitySchema } = require('typeorm');

const User = new EntitySchema({
    name: 'User',
    tableName: 'users',
    columns: {
        id: {
            primary: true,
            type: 'integer',
            generated: true
        },
        username: {
            type: 'varchar',
            unique: true,
            length: 50
        },
        password: {
            type: 'varchar',
            length: 255
        },
        createdAt: {
            type: 'datetime',
            createDate: true
        }
    }
});

module.exports = { User };
