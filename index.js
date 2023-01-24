const express = require('express');
const app = express();
const azureStorage = require('./azure-storage');
const azureBus = require('./azure-service-bus');
const utils = require('./utils');
const config = require('./config.json');
const service = require('./service');
require('dotenv').config()

app.use(express.json());

app.post('/webhook-xml', (req, res) => {
    console.log(req)
})

app.get('/xml', async (req, res) => {
    try {
        azureStorage.startup();
        const files = await azureStorage.getFiles(config.xml_folder);
        res.send(files);
    } catch (err) {
        console.log(err);
    }
})

app.get('/json', async (req, res) => {
    try {
        azureStorage.startup();
        const files = await azureStorage.getFiles(config.json_folder);
        res.send(files);
    } catch (err) {
        console.log(err);
    }
})

app.post('/xml', async (req, res) => {
    const body = req.body;

    const invalidFiles = utils.getInvalidFiles(body);

    if( invalidFiles && invalidFiles.lenght > 0 ){
        return res.status(400).send({
            error: 'INVALID_FILES',
            message: invalidFiles
        });
    }

    azureStorage.startup();
    azureBus.startup();
    let messages = [];
    for (const file of body) {
        await azureStorage.uploadFile(config.xml_folder, file.filename, file.content);   
        messages.push({
            body: file.filename,
        });
    }
    
   await azureBus.sendMessages(config.xml_queue, messages);

    res.send({
        success: true
    });

})

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on port ${process.env.PORT || 3000}`);
})

setInterval(() => {
    service.migrate();
}, 10000);