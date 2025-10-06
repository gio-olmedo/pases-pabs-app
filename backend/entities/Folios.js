const { EntitySchema } = require('typeorm');

const Folios = new EntitySchema({
    name: 'Folios',
    tableName: 'folios',
    columns: {
        id: {
            primary: true,
            type: 'integer',
            generated: true
        },
        folio: {
            type: 'varchar',
            length: 100
        },
        hash: {
            type: 'varchar',
            length: 100,
            nullable: true,
        },
        fecha: {
            type: 'date'
        },
        tipoPersona: {
            type: 'varchar',
            length: 50
        },
        nombreTitular: {
            type: 'varchar',
            length: 255
        },
        tipoPaciente: {
            type: 'varchar',
            length: 50
        },
        nombrePaciente: {
            type: 'varchar',
            length: 255
        },
        usuarioRegistro: {
            type: 'varchar',
            length: 50,
            nullable: true
        },
        activo :{
            type: 'boolean',
            default: true
        },
        createdAt: {
            type: 'datetime',
            default: () => 'CURRENT_TIMESTAMP'
        }
    }
});

module.exports = { Folios };