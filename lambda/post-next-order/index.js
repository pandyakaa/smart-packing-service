const AWS = require('aws-sdk')
const dynamoDB = new AWS.DynamoDB.DocumentClient()

exports.handler = (event, context, cb) => {
   const order_station_id = event.station_id ? event.station_id : 'null';
   const params = {
       TableName: 'item_packing',
       ExpressionAttributeValues: {
            ':false': false
          },
        ExpressionAttributeNames: {
            "#ps": "processed"
        },
        FilterExpression: "#ps = :false",
        Limit: 1
   }
   
   dynamoDB.delete({
       TableName: 'live_item',
       Key: {
           "station_id": order_station_id
       }
   }, (err, data) => {
       if (err) {
           console.error(err)
       }
   })
   
    dynamoDB.scan(params, (err, data) => {
        if (err) {
            console.log(err)
            cb(err)
        }
        else {
            let unmarshalledData = [data.Items[0]]
            
            let response = {
                data: null
            };
        
            if (unmarshalledData.length !== 0 && unmarshalledData[0]) {
                unmarshalledData = unmarshalledData[0];
                response = {
                    data: {
                        order_id: unmarshalledData.order_id,
                        full_list: unmarshalledData.items,
                    }
                };
               const updateParams = {
                   TableName: 'item_packing',
                   ExpressionAttributeValues: {
                        ':station_id': order_station_id,
                        ':true': true
                      },
                    Key: { order_id: unmarshalledData.order_id },
                    ExpressionAttributeNames: {
                        "#ps": "processed"
                    },
                    UpdateExpression: "set processed_by = :station_id, #ps = :true",
               }
                dynamoDB.update(updateParams, (err, data) => {
                    if (err) {
                        console.error(err)
                        cb(err)
                    }
                })
            }

            console.log(response)
            cb(null, response)
        }
    })
};