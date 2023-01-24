const { BlobServiceClient } = require('@azure/storage-blob');
const config = require('./config');
const axios = require('axios');

class BlobService {

    startup() {   
        const connectionString = config.azure_blob_connection_string;
        this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    }

    async createContainer(containerName) {
        try {
            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            await containerClient.create();
            return true;
        } catch (err){
            if( err.code == 'ContainerAlreadyExists' ){
                return true;
            }

            return false;
        }
    }

    async uploadFile(containerName, fileName, content) {
        const resultCreateContainer = await this.createContainer(containerName);

        if( !resultCreateContainer ){
            return {
                success: false,
                message: `Error creating container ${resultCreateContainer.code}`
            }
        }

        const containerClient = this.blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);
        const resultFileUpload = await blockBlobClient.upload(content, content.length);

        return resultFileUpload;
    }   

    async getFileTextContent(containerName, fileName) {
        const containerClient = this.blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);

        const url = blockBlobClient.url;

        const result = await axios.get(url);

        let content = result.data;

        if( typeof result.data === 'object' ){
            content = JSON.stringify(result.data);
        }

        return content;
    }

    async getFiles(containerName) {
        const containerClient = this.blobServiceClient.getContainerClient(containerName);
        const blobs = await containerClient.listBlobsFlat();
        const xmls = []
        let id = 1;
        for await (const blob of blobs) {
            xmls.push({
                id: id,
                filename: blob.name,
                content: await this.getFileTextContent(containerName, blob.name)
            });

            id++;
        }

        return xmls;
        
    }
}
module.exports = new BlobService();