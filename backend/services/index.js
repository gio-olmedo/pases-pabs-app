const { AuthService, authService, createAuthService } = require('./authService');
const { PDFService } = require('./pdfService');
const { FolioService, foliosService } = require('./folioService');

module.exports = {
    AuthService,
    authService,
    FolioService,
    foliosService,
    createAuthService,
    PDFService
};