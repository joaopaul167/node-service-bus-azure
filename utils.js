const parseString = require('xml2js').parseString;

const getInvalidFiles = (files) => {
    const invalidFiles = files.filter(file => {
        if( !file.filename || !file.content ){
            return true;
        }

        return false;

    });

    if( invalidFiles.length > 0 ){
        return invalidFiles.map((file, index) => {
            return `File ${index} is invalid`;
        }).join(',');
    }

    return false;
}
module.exports.getInvalidFiles = getInvalidFiles

const xmlToJson = async (xml) => {
    return new Promise((resolve, reject) => {
        try {
            parseString(xml, (err, result) => {
                if( err ){
                    reject(err);
                }
    
                resolve(result);
            });

        } catch (err) {
            reject(err);
        }
    });
}
module.exports.xmlToJson = xmlToJson