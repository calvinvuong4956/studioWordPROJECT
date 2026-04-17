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
    width: 260,
    height: 200,
  });

  layer.add(yoda);
};
imageObj.src =
  "https://static.wikia.nocookie.net/disneythehunchbackofnotredame/images/6/68/Hollow_Ichigo.jpg/revision/latest?cb=20140312233035";
