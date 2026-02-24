const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('./ocr.controller');

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}. Please upload an image file.`), false);
        }
    },
});

router.post('/upload-prescription', upload.single('prescriptionImage'), controller.uploadPrescription);

router.post('/generate-plan-from-prescription', controller.generatePlanFromPrescription);

router.get('/history', controller.getHistory);

router.get('/:id', controller.getById);

module.exports = router;
