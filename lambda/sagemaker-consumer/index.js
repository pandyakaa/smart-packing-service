const AWS = require("aws-sdk");
const atob = require("atob");
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const DYN_TABLE_NAME = "item_live";
const OBJ_THR = 0.2;
const OBJ_CAT = [
  "person",
  "bicycle",
  "car",
  "motorbike",
  "aeroplane",
  "bus",
  "train",
  "truck",
  "boat",
  "traffic light",
  "fire hydrant",
  "stop sign",
  "parking meter",
  "bench",
  "bird",
  "cat",
  "dog",
  "horse",
  "sheep",
  "cow",
  "elephant",
  "bear",
  "zebra",
  "giraffe",
  "backpack",
  "umbrella",
  "handbag",
  "tie",
  "suitcase",
  "frisbee",
  "skis",
  "snowboard",
  "sports ball",
  "kite",
  "baseball bat",
  "baseball glove",
  "skateboard",
  "surfboard",
  "tennis racket",
  "bottle",
  "wine glass",
  "cup",
  "fork",
  "knife",
  "spoon",
  "bowl",
  "banana",
  "apple",
  "sandwich",
  "orange",
  "broccoli",
  "carrot",
  "hot dog",
  "pizza",
  "donut",
  "cake",
  "chair",
  "sofa",
  "pottedplant",
  "bed",
  "diningtable",
  "toilet",
  "tvmonitor",
  "laptop",
  "mouse",
  "remote",
  "keyboard",
  "cell phone",
  "microwave",
  "oven",
  "toaster",
  "sink",
  "refrigerator",
  "book",
  "clock",
  "vase",
  "scissors",
  "teddy bear",
  "hair drier",
  "toothbrush",
];

exports.handler = (event, context, cb) => {
  event.Records.forEach(async (record) => {
    const payload = Buffer.from(record.kinesis.data, "base64").toString(
      "ascii"
    );
    const payloadJson = JSON.parse(payload);
    const sagemakerOutput = JSON.parse(atob(payloadJson.sageMakerOutput));
    const predictions = sagemakerOutput.prediction;
    const stationName = payloadJson.streamName || "default-station";

    const validPredictions = predictions.filter((p) => p[1] >= OBJ_THR);
    const itemCounts = {};
    for (const p of validPredictions) {
      const labelValue = OBJ_CAT[p[0]];
      if (labelValue in itemCounts) {
        itemCounts[labelValue] += 1;
      } else {
        itemCounts[labelValue] = 1;
      }
    }
    console.log(`[INFO] ${JSON.stringify(itemCounts)}`);

    for (const k in itemCounts) {
      dynamoDB.put(
        {
          TableName: DYN_TABLE_NAME,
          Item: {
            station_id: stationName,
            item_id: k,
            item_counts: itemCounts[k],
          },
        },
        (err, data) => {
          if (err) {
            console.error(`[ERR] ${JSON.stringify(err)}`);
          }

          cb(null);
        }
      );
    }
  });

  console.log("[INFO] Sagemaker consumed!");
};
