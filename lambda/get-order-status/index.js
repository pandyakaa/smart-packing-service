const AWS = require('aws-sdk')
const dynamoDB = new AWS.DynamoDB.DocumentClient()

exports.handler = (event, context, cb) => {
   const order_id_params = event.order_id ? event.order_id : 'null';
   const params = {
       TableName: 'item_packing',
       ExpressionAttributeValues: {
            ':order_id': order_id_params,
          },
        KeyConditionExpression: 'order_id = :order_id',
   }
    dynamoDB.query(params, (err, data) => {
        if (err) {
            console.log(err)
            cb(err)
        }
        else {
            let unmarshalledData = [data.Items[0]]
            
            let response = {
                data: null
            };
            
            if (unmarshalledData.length !== 0) {
                unmarshalledData = unmarshalledData[0];
                response = {
                    data: {
                        order_id: unmarshalledData.order_id,
                        full_list: unmarshalledData.items,
                        remaining_list: [],
                        extraneous_list: [],
                        labeled: unmarshalledData.shipping_id ? true : false                        
                    }
                };
            }

            console.log(response)
            cb(null, response)
        }
    })
};