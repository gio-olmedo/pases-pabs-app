const Crypto = require('crypto');
const { AppDataSource } = require('../config/database');
const { Folios } = require('../entities/Folios');
const { Like } = require('typeorm');

class FolioService {
    constructor(folioRepository = null) {
        this.folioRepository = folioRepository || AppDataSource.getRepository(Folios);
    }

    async index() {
        return await this.folioRepository.find({
            order: { createdAt: 'DESC' },
            limit: 20
        });
    }

    async search(term) {
        return await this.folioRepository.find({ 
            where: [
            { folio: Like(`%${term}%`) }, 
            { hash: term },
            { nombreTitular: Like(`%${term}%`) },
            { nombrePaciente: Like(`%${term}%`) }
            ],
        });
    }

    async findByHash(hash) {
        return await this.folioRepository.findOne({ where: { hash } });
    }

    async generateFolio() {
        let lastFolio = await this.folioRepository.findOne({
            where: {}, // empty object matches any row
            order: { createdAt: 'DESC' }
        });
        lastFolio = lastFolio?.folio?.split('-')[1];
        let folioNumber = lastFolio ? parseInt(lastFolio) + 1 : 1;
        const finalFolio = "PBS-" + folioNumber.toString().padStart(6, '0');
        const hash = Crypto.createHash('sha256').update(`${finalFolio}-${Date.now()}`).digest('hex');
        return {
            folio: finalFolio,
            hash
        };
    }

    async registerFolio(data, username) {
        // console.log('Registrando folio:', data);
        const newFolio = this.folioRepository.create({
            folio: data.folio,
            hash: data.hash,
            fecha: data.fecha,
            tipoPersona: data.esEmpleado ? 'empleado' : 'cliente',
            nombreTitular: data.nombreTitular,
            tipoPaciente: data.tipoPaciente,
            nombrePaciente: data.nombrePaciente,
            usuarioRegistro: username
        });
        await this.folioRepository.save(newFolio);
    }
}
const folioServiceInstance = new FolioService();

module.exports = { 
    FolioService, 
    foliosService: folioServiceInstance
};