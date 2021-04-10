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
            cb(err);
        }
        else {
            let unmarshalledData = [data.Items[0]]

            let response = {
                data: null
            };

            if (unmarshalledData.length !== 0 && unmarshalledData[0]) {
                unmarshalledData = unmarshalledData[0];
                const station_id_params = event.station_id ? event.station_id : "null";
                const remainingItems = new Set()
                unmarshalledData.items.forEach((item) => {
                    remainingItems.add(item.id_item)
                })
                response = {
                    data: {
                        order_id: unmarshalledData.order_id,
                        full_list: unmarshalledData.items,
                        remaining_list: remainingItems,
                        extraneous_list: [],
                        labeled: remainingItems.length === 0 ? true : false
                    }
                };
                const liveParams = {
                    TableName: 'item_live',
                    ExpressionAttributeValues: {
                        ':station_id': station_id_params,
                    },
                    KeyConditionExpression: 'station_id = :station_id',
                }

                dynamoDB.query(liveParams, (err, liveData) => {
                    if (err) {
                        console.log(err)
                        cb(err);
                    }
                    else {
                        liveData = liveData.Items;
                        liveData.forEach((ld) => {
                            remainingItems.delete(parseInt(ld.item_id))
                        })
                        const remainingItemsArr = Array.from(remainingItems)
                        response.data.remaining_list = []
                        remainingItemsArr.forEach((item) => {
                            unmarshalledData.items.forEach((data) => {
                                if (data.id_item == item) {
                                    response.data.remaining_list.push(data)
                                }
                            })
                        })
                        response.data.labeled = response.data.remaining_list.length === 0 && response.data.extraneous_list.length === 0 ? true : false
                        cb(null, response);
                    }
                })
            } else {
                console.log(response)
                cb(null, response);
            }
        }
    })
};
