const stage = new Konva.Stage({
  container: "container",
  width: window.innerWidth,
  height: window.innerHeight,
});

const layer = new Konva.Layer();
stage.add(layer);

// main API:
const imageObj = new Image();
imageObj.onload = function () {
  const yoda = new Konva.Image({
    x: 100,
    y: 50,
    image: imageObj,
    width: 200,
    height: 218,
  });

  layer.add(yoda);
};
imageObj.src = "https://konvajs.org/assets/yoda.jpg";
