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
                const shipping_id_params = event.shipping_id
                response = {
                    data: {
                        order_id: order_id_params,
                        shipping_id: shipping_id_params,
                    }
                }; 
               const updateParams = {
                   TableName: 'item_packing',
                   ExpressionAttributeValues: {
                        ':shipping_id': shipping_id_params,
                      },
                    Key: { order_id: order_id_params },
                    ExpressionAttributeNames: {
                        "#sid": "shipping_id"
                    },
                    UpdateExpression: "set #sid = :shipping_id",
               }
                dynamoDB.update(updateParams, (err, data) => {
                    if (err) {
                        console.log(err)
                        cb(err)
                    }
                })
            }

            console.log(response)
            cb(null, response)
        }
    })
};