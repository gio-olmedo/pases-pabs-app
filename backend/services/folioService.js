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

    async filterFolios(data){
        const { fechaInicio, fechaFin, page, size, tipoPaciente, tipoPersona, tipoAtencion, status } = data;
        const query = this.folioRepository.createQueryBuilder('folio');

        if (fechaInicio != null && fechaInicio !== '') {
            query.andWhere('folio.fecha >= :fechaInicio', { fechaInicio });
        }
        if (fechaFin != null && fechaFin !== '') {
            query.andWhere('folio.fecha <= :fechaFin', { fechaFin });
        }
        if (tipoPaciente != null && tipoPaciente !== '') {
            query.andWhere('folio.tipoPaciente = :tipoPaciente', { tipoPaciente });
        }
        if (tipoPersona != null && tipoPersona !== '') {
            query.andWhere('folio.tipoPersona = :tipoPersona', { tipoPersona });
        }
        
        if (tipoAtencion != null && tipoAtencion !== '') {
            query.andWhere('folio.tipoAtencion = :tipoAtencion', { tipoAtencion });
        }
        if (status != null && status !== '') {
            if (status === 'active') {
                query.andWhere('folio.fechaDesactivacion IS NULL');
            } else if (status === 'deactivated') {
                query.andWhere('folio.fechaDesactivacion IS NOT NULL');
            }
        }

        query.orderBy('folio.createdAt', 'DESC');

        const skip = (page - 1) * size;
        query.skip(skip).take(size);

        return await query.getMany();
    }

    async findOneById(id) {
        return await this.folioRepository.findOneBy({ id });
    }

    async update(id, data) {
        const folio = await this.folioRepository.findOneBy({ id });
        if (!folio) {
            throw new Error('Folio no encontrado');
        }
        folio.fecha = data.fecha || folio.fecha;
        folio.tipoPersona = data.tipoPersona || folio.tipoPersona;
        folio.nombreTitular = data.nombreTitular || folio.nombreTitular;
        folio.tipoPaciente = data.tipoPaciente || folio.tipoPaciente;
        folio.nombrePaciente = data.nombrePaciente || folio.nombrePaciente;
        folio.tipoAtencion = data.tipoAtencion || folio.tipoAtencion;
        
        return await this.folioRepository.save(folio);
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
            usuarioRegistro: username,
            tipoAtencion: data.tipoAtencion
        });
        await this.folioRepository.save(newFolio);
    }

    async deactivateFolio(id) {
        const folio = await this.folioRepository.findOneBy({ id });
        if (!folio) {
            throw new Error('Folio no encontrado');
        }
        if(folio.fechaDesactivacion) {
            throw new Error('Folio ya está desactivado');
        }
        folio.fechaDesactivacion = new Date();
        await this.folioRepository.save(folio);
    }
}
const folioServiceInstance = new FolioService();

module.exports = { 
    FolioService, 
    foliosService: folioServiceInstance
};