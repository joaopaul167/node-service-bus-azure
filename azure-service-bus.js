const { ServiceBusClient } = require("@azure/service-bus");
const config = require('./config');

class ServiceBus {
    startup() {
        const connectionString = config.azure_service_bus_connection_string;
        this.serviceBusClient = new ServiceBusClient(connectionString);
    }


    async sendMessages(queueName, messages) {
        try{
            const sender = this.serviceBusClient.createSender(queueName);
            
            let batch = await sender.createMessageBatch();

            for (const message of messages) {
                if(!batch.tryAddMessage(message)){
                    await sender.sendMessages(batch);

                    batch = await sender.createMessageBatch();
                    await batch.tryAddMessage(message);
                }
            }
    
            await sender.sendMessages(batch);
            await sender.close();
            
            return true;

        } catch(err){
            console.log(err)
        }
    }

    async receiveMessage(queueName, maxMessages = 1) {
        try{
            const receiver = this.serviceBusClient.createReceiver(queueName);
            const messagesBus = await receiver.receiveMessages(maxMessages, { maxWaitTimeInMs: 5000 });

            const messages = messagesBus.map(m => {
                return {
                    body: m.body,
                }
            });

            for(const message of messagesBus){
                //remove message from queue
                await receiver.completeMessage(message); 
            }

            await receiver.close();

            return messages;
            
        } catch(err){
            console.log(err)
        }
    }

}
module.exports = new ServiceBus();