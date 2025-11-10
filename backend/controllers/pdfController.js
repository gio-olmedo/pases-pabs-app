const { pdfService } = require('../services/pdfService');

class PDFController {
    static async generatePDF(req, res) {
        try {
            const pdfData = req.body;
            const username = req.user.username;

            // Generar el PDF usando el servicio
            // return await pdfService.generatePaseMedicov2(pdfData, username);
            const doc = await pdfService.generatePaseMedicov2(pdfData, username);
            
            // Configurar headers para descarga
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="pase-${pdfData.folio}.pdf"`);

            // Pipe del PDF a la respuesta
            doc.pipe(res);

            // Finalizar el PDF
            doc.end();
        } catch (error) {
            console.error('Error al generar PDF:', error);
            
            if (error.message === 'Todos los campos son requeridos' ||
                error.message.includes('Tipo de persona') ||
                error.message.includes('Tipo de paciente')) {
                return res.status(400).json({ error: error.message });
            }
            
            res.status(500).json({ error: 'Error al generar PDF' });
        }
    }

    static async regeneratePDF(req, res) {
        try {
            const folioId = req.params.id;

            // Generar el PDF usando el servicio
            const doc = await pdfService.regeneratePDF(folioId);
            
            // Configurar headers para descarga
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="pase-regenerado-${folioId}.pdf"`);

            // Pipe del PDF a la respuesta
            doc.pipe(res);

            // Finalizar el PDF
            doc.end();
        } catch (error) {
            console.error('Error al regenerar PDF:', error);
            res.status(500).json({ error: 'Error al regenerar PDF' });
        }
    }
}

module.exports = { PDFController };