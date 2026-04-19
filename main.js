// KONVA Drag-and-Drop-Resize Img
const width = window.innerWidth;
const height = window.innerHeight;

const stage = new Konva.Stage({
  container: "container",
  width: 500,
  height: 500,
});

const layer = new Konva.Layer();
stage.add(layer);

// Only download images within these canvas dimensions
layer.clip({
  x: 0,
  y: 0,
  width: 500,
  height: 500,
});

// ------------------------------------------------------------------------------------------------
// KONVA ANCHOR-POINTS
const transformer = new Konva.Transformer({
  rotateEnabled: true,
  borderStroke: "#000000",
  borderStrokeWidth: 0.5,
  anchorStroke: "#666",
  anchorFill: "#ddd",
  anchorSize: 8,
  anchorCornerRadius: 4,
  keepRatio: false,
  shouldOverdrawWholeArea: true,
});
layer.add(transformer);

// Function to update image size based on anchor movement
function update(activeAnchor) {
  const group = activeAnchor.getParent();

  const topLeft = group.findOne(".topLeft");
  const topRight = group.findOne(".topRight");
  const bottomRight = group.findOne(".bottomRight");
  const bottomLeft = group.findOne(".bottomLeft");
  const image = group.findOne("Image");

  const anchorX = activeAnchor.x();
  const anchorY = activeAnchor.y();

  // Update anchor positions based on which anchor was moved
  switch (activeAnchor.getName()) {
    case "topLeft":
      topRight.y(anchorY);
      bottomLeft.x(anchorX);
      break;
    case "topRight":
      topLeft.y(anchorY);
      bottomRight.x(anchorX);
      break;
    case "bottomRight":
      bottomLeft.y(anchorY);
      topRight.x(anchorX);
      break;
    case "bottomLeft":
      bottomRight.y(anchorY);
      topLeft.x(anchorX);
      break;
  }

  // Position image at top-left corner
  image.position(topLeft.position());

  // Update image dimensions
  const width = topRight.x() - topLeft.x();
  const height = bottomLeft.y() - topLeft.y();
  if (width && height) {
    image.width(width);
    image.height(height);
  }
}

// ------------------------------------------------------------------------------------------------
// CROPPER JS ANCHOR-POINTS
function addAnchor(group, x, y, name) {
  const anchor = new Konva.Circle({
    x: x,
    y: y,
    stroke: "#666",
    fill: "#ddd",
    strokeWidth: 2,
    radius: 7,
    name: name,
    draggable: true,
    dragOnTop: false,
    visible: false, //anchors hidden by default to remove visual clutter
  });

  // Add event listeners for resize behavior
  anchor.on("dragmove", function () {
    update(this);
  });

  anchor.on("mousedown touchstart", function () {
    group.draggable(false);
    this.moveToTop();
  });

  anchor.on("dragend", function () {
    group.draggable(true);
  });

  // Add hover styling
  anchor.on("mouseover", function () {
    document.body.style.cursor = "pointer";
    this.strokeWidth(4);
  });

  anchor.on("mouseout", function () {
    document.body.style.cursor = "default";
    this.strokeWidth(2);
  });

  group.add(anchor);
}

// Hide ALL anchors in every group in the layer
function hideAllAnchors() {
  transformer.nodes([]);
  // layer.find("Circle").forEach((anchor) => anchor.hide());
  layer.draw();
}

// Show anchors only for a specific group (Cropped Images)
function showAnchorsFor(group) {
  transformer.nodes([group]);
  transformer.moveToTop();
  // group.find("Circle").forEach((anchor) => anchor.show());
  layer.draw();
}

// Create Image-Group with Image and anchors
// const ichigoImg = new Konva.Image({
//   width: 200,
//   height: 137,
// });

// const ichigoGroup = new Konva.Group({
//   x: 180,
//   y: 50,
//   draggable: true,
// });

// layer.add(ichigoGroup);
// ichigoGroup.add(ichigoImg);

// Add anchors at the corners
// addAnchor(ichigoGroup, 0, 0, "topLeft");
// addAnchor(ichigoGroup, 200, 0, "topRight");
// addAnchor(ichigoGroup, 200, 137, "bottomRight");
// addAnchor(ichigoGroup, 0, 137, "bottomLeft");

// Load the images
const imageObj1 = new Image();
imageObj1.onload = function () {
  // ichigoImg.image(imageObj1);
};
// imageObj1.src =
//   "https://static.wikia.nocookie.net/disneythehunchbackofnotredame/images/6/68/Hollow_Ichigo.jpg/revision/latest?cb=20140312233035";

// ------------------------------------------------------------------------------------------------
// Cropper.JS Implementation
document.addEventListener("DOMContentLoaded", () => {
  const imageInput = document.getElementById("inputImage");
  const croppedImage = document.getElementById("croppedImage");
  const cropButton = document.getElementById("cropButton");
  const downloadButton = document.getElementById("downloadButton");

  let cropper;
  let copiedGroup = null;

  // Function to hide anchors when clicking anything on the page
  document.addEventListener("mousedown", (e) => {
    const container = document.getElementById("container");
    if (!container.contains(e.target)) {
      hideAllAnchors();
      layer.find("Group").forEach((g) => g.name(""));
    }
  });

  stage.on("mousedown touchstart", (e) => {
    if (e.target === stage) {
      hideAllAnchors();
      layer.find("Group").forEach((g) => g.name(""));
    }
  });

  // ------------------------------------------------------------------------------------------------
  // KEYBINDS
  // "Delete" - Deleted selected cropped image
  document.addEventListener("keydown", (e) => {
    if (e.key === "Delete") {
      const selected = layer.findOne(".selected");
      if (selected) {
        selected.destroy();
        layer.draw();
      }
    }

    // "Enter" - Crop Image
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault(); // Prevents default spacebar import image action
      cropButton.querySelector("button").click();
    }

    // Copy and Paste for Cropped Images
    if (e.ctrlKey && e.key === "c") {
      const selected = layer.findOne(".selected");
      if (selected) {
        copiedGroup = selected;
      }
    }

    if (e.ctrlKey && e.key === "v") {
      if (copiedGroup) {
        const clone = copiedGroup.clone({
          x: copiedGroup.x() + 20, // Offset Pasted Clone to differentiate from original
          y: copiedGroup.y() + 20,
          draggable: true,
        });

        clone.on("mousedown touchstart", function () {
          this.moveToTop();
          hideAllAnchors();
          layer.find("Group").forEach((g) => g.name(""));
          this.name("selected");
          showAnchorsFor(this);
        });

        layer.add(clone);
        transformer.moveToTop();

        // Auto-select Pasted Clone
        hideAllAnchors();
        layer.find("Group").forEach((g) => g.name(""));
        clone.name("selected");
        showAnchorsFor(clone);

        layer.draw();
      }
    }
  });

  // ------------------------------------------------------------------------------------------------
  let cropAsCircle = false;
  // ------------------------------------------------------------------------------------------------
  // TOGGLE SHAPE ICON
  // Square Toggle
  document.getElementById("squareToggle").addEventListener("click", () => {
    cropAsCircle = false;
    document.getElementById("squareToggle").classList.add("active");
    document.getElementById("circleToggle").classList.remove("active");
    document.body.classList.remove("circle-mode");
  });
  // Circle Toggle
  document.getElementById("circleToggle").addEventListener("click", () => {
    cropAsCircle = true;
    document.getElementById("circleToggle").classList.add("active");
    document.getElementById("squareToggle").classList.remove("active");
    document.body.classList.add("circle-mode");
  });

  // ------------------------------------------------------------------------------------------------
  // CIRCLE CROP
  function getRoundedCanvas(sourceCanvas) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    canvas.width = width;
    canvas.height = height;
    context.imageSmoothingEnabled = true;
    context.drawImage(sourceCanvas, 0, 0, width, height);
    context.globalCompositeOperation = "destination-in";
    context.beginPath();
    context.ellipse(
      width / 2,
      height / 2,
      width / 2,
      height / 2,
      0,
      0,
      2 * Math.PI,
    );
    context.fill();
    return canvas;
  }

  // ------------------------------------------------------------------------------------------------
  // IMAGE INPUT FUNCTION
  imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        croppedImage.src = e.target.result;
        croppedImage.classList.remove("hidden");

        // Destroys previous cropper instance before creating a new one, preventing ERRORS
        if (cropper) {
          cropper.destroy();
        }

        // CROPPER.JS OPTIONS
        // Put "aspectRatio: 1" in the {} before viewmode to crop in SQUARE
        cropper = new Cropper(croppedImage, {
          viewMode: 1,
          wheelZoomRatio: 0.35, // Adjust zoom sensitivity
        });
        cropButton.style.display = "inline-block";
      };
      reader.readAsDataURL(file);
    }
  });

  // ------------------------------------------------------------------------------------------------
  // CROP BUTTON+IMAGE FUNCTION
  cropButton.addEventListener("click", () => {
    let croppedCanvas = cropper.getCroppedCanvas();
    if (cropAsCircle) {
      croppedCanvas = getRoundedCanvas(croppedCanvas);
    }
    const croppedDataURL = croppedCanvas.toDataURL();
    croppedImage.src = croppedDataURL;
    downloadButton.style.display = "inline-block";

    // Send Cropped-Image to Konva Canvas
    const imageObj = new Image();
    imageObj.onload = function () {
      // Scale cropped image to fit within Canvas while maintaining aspect ratio of the Crop
      const maxSize = 200;
      const scale = Math.min(
        // 1, to prevent upscaling of small crops and only allows downscaling of large crops
        1,
        maxSize / croppedCanvas.width,
        maxSize / croppedCanvas.height,
      );
      const imgWidth = croppedCanvas.width * scale;
      const imgHeight = croppedCanvas.height * scale;

      // Random positions of cropped image on the canvas
      // "500" and "500" are the dimensions of the canvas
      // Minus image dimensions to prevent it from being placed outside the canvas
      const group = new Konva.Group({
        x: Math.random() * (500 - imgWidth),
        y: Math.random() * (500 - imgHeight),
        draggable: true,
      });

      const konvaImage = new Konva.Image({
        width: imgWidth,
        height: imgHeight,
        image: imageObj,
      });

      group.add(konvaImage);

      // Resize anchors at corners
      // addAnchor(group, 0, 0, "topLeft");
      // addAnchor(group, imgWidth, 0, "topRight");
      // addAnchor(group, imgWidth, imgHeight, "bottomRight");
      // addAnchor(group, 0, imgHeight, "bottomLeft");

      // Bring Clicked image to the Top Layer
      group.on("mousedown touchstart", function () {
        this.moveToTop();
        hideAllAnchors();
        layer.find("Group").forEach((g) => g.name(""));
        this.name("selected");
        showAnchorsFor(this);
      });

      layer.add(group);
      layer.draw();
    };

    imageObj.src = croppedDataURL; // loads the cropped result into Konva
  });
});

// ------------------------------------------------------------------------------------------------
// DOWNLOAD BUTTON FUNCTION
downloadButton.addEventListener("click", () => {
  // Hide anchor points when exporting
  // layer.find("Circle").forEach((anchor) => anchor.hide());
  transformer.nodes([]);
  layer.draw();

  const dataURL = stage.toDataURL({ pixelRatio: 2 }); // Higher quality image export
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "collage.png";

  // [ Link "download" button to the single, most recent Cropped Image ]
  // link.href = croppedImage.src;
  // link.download = "cropped_image.png";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Show anchor points again after export
  layer.find("Circle").forEach((anchor) => anchor.show());
  layer.draw();
});
