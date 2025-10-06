const PDFDocument = require('pdfkit');
const authService = require('./authService');
const { foliosService } = require('./folioService');
const QRCode = require('qrcode');
const { APP_URL } = require('../config/constants');

class PDFService {
    constructor(folioService = null) {
        this.folioService = folioService || foliosService;
    }

    validatePDFData(data) {
        const { fecha, tipoPersona, nombreTitular, tipoPaciente, nombrePaciente } = data;

        if (!fecha || !tipoPersona || !nombreTitular || !tipoPaciente || !nombrePaciente) {
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

    async generatePaseMedico(data, username) {
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

    async generatePaseMedicov2(data, username) {
        this.validatePDFData(data);
        const response = await foliosService.generateFolio();
        let auxHeight = 0;

        const datos = {
            folio: response.folio,
            hash: response.hash,
            fecha: data.fecha,
            esEmpleado: data.tipoPersona === 'empleado',
            nombreTitular: data.nombreTitular,
            tipoPaciente: data.tipoPaciente,
            nombrePaciente: data.nombrePaciente
        };
        const qr = await this.generarQR(datos.hash);
        // console.log('QR generado:', qr);
        // ---------------------------------------------

        // Tamaño: media hoja carta en puntos (72 pt = 1 in)
        const width = 8.5 * 72;   // 612
        const height = 5.5 * 72;  // 396

        const doc = new PDFDocument(
            { margins: { right: 0 } }
        );

        // Helpers
        function drawCheckbox(x, y, size = 12, checked = false) {
            doc.rect(x, y, size, size).stroke();
            if (checked) {
                // dibuja una X
                doc.moveTo(x + 2, y + 2).lineTo(x + size - 2, y + size - 2).stroke();
                doc.moveTo(x + size - 2, y + 2).lineTo(x + 2, y + size - 2).stroke();
            }
        }

        function drawLineInput(x, y, w = 200, h = 1) {
            doc.moveTo(x, y).lineTo(x + w, y).stroke();
        }

        // // Diseño general
        doc.lineWidth(1);
        doc.rect(8, 8, width - 16, height - 80).stroke(); // borde externo

        // Encabezado: logo placeholder y título
        doc.fontSize(10).font('Helvetica-Bold');
        // doc.text('Pluspetrol', 28, 20); // placeholder logo texto
        doc.image('backend/assets/pabs.png', 28, 18, { width: 50 });
        doc.fontSize(22).text('Pase Médico', 0, 18, { continued: false, align: 'center' });
        const subtitle = 'Titular: ' + (datos.nombreTitular || '');
        doc.fontSize(12).text(subtitle, 0, 46, { align: 'center' });

        // Número de folio en esquina derecha
        doc.fontSize(10).font('Helvetica');
        doc.text('No. ' + datos.folio, 500, 18, { continued: false });

        // Línea separadora
        doc.moveTo(18, 78).lineTo(width - 18, 78).stroke();

        // Sección superior izquierda: Folio y Fecha
        doc.fontSize(11).font('Helvetica-Bold').text('Folio:', 28, 90);
        doc.fontSize(11).font('Helvetica').text(datos.folio || '', 80, 90);

        doc.fontSize(11).font('Helvetica-Bold').text('Fecha:', 28, 110);
        doc.fontSize(11).font('Helvetica').text(datos.fecha || '', 80, 110);

        let empleadoY = 140;
        // Empleado o Cliente (checkboxes)
        doc.fontSize(11).font('Helvetica-Bold').text('Empleado / Cliente:', 28, empleadoY);
        const cbX = 28;
        const cbY = 160;
        drawCheckbox(cbX, cbY, 12, !!datos.esEmpleado);
        doc.fontSize(10).font('Helvetica').text('Empleado', cbX + 18, cbY - 1);
        drawCheckbox(cbX + 110, cbY, 12, !datos.esEmpleado);
        doc.text('Cliente', cbX + 128, cbY - 1);

        auxHeight = 195;
        // // Nombre titular del servicio
        // doc.fontSize(11).font('Helvetica-Bold').text('Nombre titular del servicio:', 28, 195);
        // doc.fontSize(11).font('Helvetica');
        // drawLineInput(28, 225, width - 56 - 0); // línea larga
        // doc.text(datos.nombreTitular || '', 30, 210, { width: width - 60 });

        auxHeight = 195;
        // Sección Paciente: opciones (usar checkbox para que se marque una)
        doc.fontSize(11).font('Helvetica-Bold').text('Paciente (marcar una):', 28, auxHeight);

        auxHeight += 20;
        const opciones = ['hijo', 'esposo', 'beneficiario'];
        let optX = 28;
        const optY = auxHeight;
        opciones.forEach((opt, i) => {
            const checked = datos.tipoPaciente === opt;
            let name = opt + '(a)';
            name = name.charAt(0).toUpperCase() + name.slice(1);
            drawCheckbox(optX, optY, 12, checked);
            doc.fontSize(10).font('Helvetica').text(name, optX + 18, optY - 1);
            optX += 140;
        });

        auxHeight += 30;
        // Nombre del paciente
        doc.fontSize(11).font('Helvetica-Bold').text('Nombre del paciente:', 28, auxHeight);
        auxHeight += 16;
        doc.fontSize(11).font('Helvetica').text(datos.nombrePaciente || '', 30, auxHeight, { width: width - 60 });
        auxHeight += 16;
        drawLineInput(28, auxHeight, width - 56);
        auxHeight += 5;
        // Pie: aviso pequeño y espacio para sello/folio
        doc.fontSize(8).font('Helvetica-Oblique');
        doc.text('Cuide su salud y la de sus compañeros. Si tiene alguna molestia no se automedique, acuda a la sanidad del campamento.', 28, auxHeight, { width: width - 56 });

        auxHeight = empleadoY;
        auxHeight += 60;
        // Opcional: área para sello / firma a la derecha inferior
        doc.rect(width - 160, auxHeight, 130, 60).stroke();
        auxHeight += 40;
        doc.fontSize(9).font('Helvetica').text('Sello/Firma', width - 120, auxHeight);

        auxHeight -= 155;
        doc.image(qr, width - 145, auxHeight, { width: 100 });

        // Finaliza
        // doc.end();
        this.folioService.registerFolio(datos, username);
        return doc;
    }

    async generarQR(text) {
        const appUrl = APP_URL;
        const fullText = appUrl + text;
        let base64Qr = (await QRCode.toDataURL(fullText));
        return base64Qr;
    }
}
const pdfServiceInstance = new PDFService();

module.exports = {
    PDFService,
    pdfService: pdfServiceInstance
};