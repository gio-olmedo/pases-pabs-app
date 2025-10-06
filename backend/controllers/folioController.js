const { foliosService } = require('../services/folioService');

class FolioController {
    static async index(req, res) {
        try {
            const folios = await foliosService.index();
            res.json(folios);
        } catch (error) {
            console.error('Error fetching folios:', error);
            res.status(500).json({ error: 'Error fetching folios' });
        }
    }

    static async search(req, res) {
        const { folio } = req.params;
        try {
            const folioData = await foliosService.search(folio);
            res.json(folioData || []);
        } catch (error) {
            console.error('Error searching for folio:', error);
            res.status(500).json({ error: 'Error searching for folio' });
        }
    }

    static async byHash(req, res) {
        const { hash } = req.params;
        try {
            const folioData = await foliosService.findByHash(hash);
            if (folioData) {
                res.json(folioData);
            } else {
                res.status(404).json({ error: 'Folio not found' });
            }
        } catch (error) {
            console.error('Error searching for folio by hash:', error);
            res.status(500).json({ error: 'Error searching for folio by hash' });
        }
    }
}

module.exports = { FolioController };