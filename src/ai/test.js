let file = "public/uploads/post-1.jpg";

console.log({ file });

const {
  loadImageModel,
  loadImageClassifierModel,
  PreTrainedImageModels,
  topClassificationResult,
} = require("tensorflow-helpers");

async function main() {
  // auto cache locally
  let baseModel = await loadImageModel({
    spec: PreTrainedImageModels.mobilenet["mobilenet-v3-large-100"],
    dir: "saved_models/base_model",
  });
  console.log("embedding features:", baseModel.spec.features);
  // [print] embedding features: 1280

  // restore or create new model
  let classifier = await loadImageClassifierModel({
    baseModel,
    modelDir: "saved_models/classifier_model",
    hiddenLayers: [128],
    datasetDir: "dataset",
    // classNames: ['anime', 'real', 'others'], // auto scan from datasetDir
  });


  // auto load image from filesystem, resize and crop
  let classes = await classifier.classifyImageFile(file);
  console.log({classes})
  let food = classes.find(cls => cls.label == 'food').confidence
  let others = classes.find(cls => cls.label == 'others').confidence
  let pet = classes.find(cls => cls.label == 'pet').confidence
  let selfie = classes.find(cls => cls.label == 'selfie').confidence
  let travel = classes.find(cls => cls.label == 'travel').confidence
  console.log({food,others,pet,selfie,travel})

//   let topClass = topClassificationResult(classes);
//   console.log("result:", {topClass});
  // [print] result: { label: 'anime', confidence: 0.7991582155227661 }
}

main();
