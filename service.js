const azureBus = require('./azure-service-bus');
const azureStorage = require('./azure-storage');
const utils = require('./utils');
const config = require('./config.json');

class Migration {
    async getFilesFromBus() {
        azureBus.startup();
        const messages = await azureBus.receiveMessage(config.xml_queue, 5);
        return messages;
    }

    async getFilesFromStorage() {
        const files = await this.getFilesFromBus();
        const xmls = [];

        azureStorage.startup();
        for (const file of files) {
            const content = await azureStorage.getFileTextContent(config.xml_folder, file.body);
            
            xmls.push({
                filename: file.body,
                content: content
            });
        }

        return xmls;

    }

    async migrate() {
        try {
            const files = await this.getFilesFromStorage();
            const jsonFiles = [];

            //convert files to json
            for (const file of files) {
                const json = await utils.xmlToJson(file.content);
                
                jsonFiles.push({
                    filename: file.filename.replace('.xml', '.json'),
                    content: typeof json === 'object' ? JSON.stringify(json) : json
                });
            }
-
            //upload json files to storage
            azureStorage.startup();
            for (const file of jsonFiles) {
                await azureStorage.uploadFile(config.json_folder, file.filename, file.content);
            }
        } catch (err) {
            console.log(err);
        }

    }


}
module.exports = new Migration();