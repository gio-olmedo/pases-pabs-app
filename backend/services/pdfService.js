const PDFDocument = require('pdfkit');

class PDFService {
    static validatePDFData(data) {
        const { folio, fecha, tipoPersona, nombreTitular, tipoPaciente, nombrePaciente } = data;
        
        if (!folio || !fecha || !tipoPersona || !nombreTitular || !tipoPaciente || !nombrePaciente) {
            throw new Error('Todos los campos son requeridos');
        }

        if (!['empleado', 'cliente'].includes(tipoPersona)) {
            throw new Error('Tipo de persona debe ser "empleado" o "cliente"');
        }

        if (!['hijo', 'esposo', 'beneficiario'].includes(tipoPaciente)) {
            throw new Error('Tipo de paciente debe ser "hijo", "esposo" o "beneficiario"');
        }

        return true;
    }

    static generatePaseMedico(data, username) {
        this.validatePDFData(data);

        const {
            folio,
            fecha,
            tipoPersona,
            nombreTitular,
            tipoPaciente,
            nombrePaciente
        } = data;

        const doc = new PDFDocument();

        // Contenido del PDF
        doc.fontSize(20).text('PASE MÉDICO', 50, 50, { align: 'center' });
        doc.moveDown();

        // Información del pase
        doc.fontSize(12);
        doc.text(`Folio: ${folio}`, 50, 120);
        doc.text(`Fecha: ${fecha}`, 50, 140);
        
        // Tipo de persona (checkbox simulado)
        doc.text('Tipo de persona:', 50, 170);
        doc.text(`${tipoPersona === 'empleado' ? '☑' : '☐'} Empleado`, 50, 190);
        doc.text(`${tipoPersona === 'cliente' ? '☑' : '☐'} Cliente`, 50, 210);
        
        doc.text(`Nombre titular del servicio: ${nombreTitular}`, 50, 240);
        
        // Tipo de paciente
        doc.text('Paciente:', 50, 270);
        doc.text(`${tipoPaciente === 'hijo' ? '☑' : '☐'} Hijo`, 50, 290);
        doc.text(`${tipoPaciente === 'esposo' ? '☑' : '☐'} Esposo(a)`, 50, 310);
        doc.text(`${tipoPaciente === 'beneficiario' ? '☑' : '☐'} Beneficiario`, 50, 330);
        
        doc.text(`Nombre del paciente: ${nombrePaciente}`, 50, 360);
        
        // Información adicional
        doc.moveDown();
        doc.text(`Generado por: ${username}`, 50, 400);
        doc.text(`Fecha de generación: ${new Date().toLocaleString('es-MX')}`, 50, 420);

        return doc;
    }
}

module.exports = { PDFService };