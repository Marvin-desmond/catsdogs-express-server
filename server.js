import * as tf from "@tensorflow/tfjs";
import { loadGraphModel } from "@tensorflow/tfjs-converter";
// Define "require"
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const express = require("express"),
  app = express(),
  port = process.env.PORT || 8080,
  fileUpload = require("express-fileupload"),
  Jimp = require("jimp");

import "./firebaseinit.js";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
const storage = getStorage();
let model; 

let loadModel = async()=>{
  await getDownloadURL(ref(storage, "/model.json"))
    .then(async(url) => {
      model = await loadGraphModel(url);
      console.log("Model loaded");
    })
    .catch((error) => {});
}

await loadModel();
app.use(fileUpload());

let result = {};
result["success"] = false;

let ImageLoader = async (data) => {
  try {
    let image = await Jimp.read(data).then((data) => {
      return data.resize(224, 224).bitmap;
    });
    let img = tf.browser.fromPixels(image);
    img = img.expandDims(0);
    let prediction = model.predict(img);
    result["success"] = true;
    return prediction;
  } catch (e) {
    console.log(e);
  }
};

app.post("/predict", async (req, res) => {
  let prediction = await ImageLoader(req.files.image.data);
  result["prediction"] = `${prediction}`;
  res.send(result);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
