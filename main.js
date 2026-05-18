// KONVA Drag-and-Drop-Resize Img
const width = window.innerWidth;
const height = window.innerHeight;

const stage = new Konva.Stage({
  container: "cropped-container",
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
  let pasteCount = 1;

  // Cropped-Image Rotation Variables
  let qRotate = false;
  let eRotate = false;
  let rotationSpeed = 0.55;

  // Function to hide anchors when clicking anything on the page
  document.addEventListener("mousedown", (e) => {
    const container = document.getElementById("cropped-container");
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
  // RIGHT-CLICK DRAG NAVIGATION IN CROPPER.JS CONTAINER
  // Greatly enhances usability
  // HEAVILY mitigates the frustration of cropper's janky mechanisms.
  let rightDrag = false;
  let startX, startY;

  const cropperWrapper = document.getElementById("cropperContainer");

  // Remove right-click default windows context menu to appear when clicking right-click within the Cropper Container
  // Right-click context menu still pops up anywhere else on the page
  cropperWrapper.addEventListener("contextmenu", (e) => e.preventDefault());

  // Right-click Mouse-EventListener
  cropperWrapper.addEventListener("mousedown", (e) => {
    if (e.button === 2 && cropper) {
      rightDrag = true;
      startX = e.pageX;
      startY = e.pageY;
    }
  });

  // Allows navigation within cropper-container even if mouse hovers off cropper container, when right-click is being held
  window.addEventListener("mousemove", (e) => {
    if (rightDrag && cropper) {
      const dx = e.pageX - startX;
      const dy = e.pageY - startY;
      cropper.move(dx, dy);
      startX = e.pageX;
      startY = e.pageY;
    }
  });

  // Stop navigation function once right-click is released
  window.addEventListener("mouseup", (e) => {
    if (e.button === 2) {
      rightDrag = false;
    }
  });

  // ------------------------------------------------------------------------------------------------
  // Cropped-Image Rotation Function
  function startRotationLoop() {
    const selected = layer.findOne(".selected");
    if (selected) {
      if (qRotate) {
        selected.rotation(selected.rotation() - rotationSpeed);
      }
      if (eRotate) {
        selected.rotation(selected.rotation() + rotationSpeed);
      }
      if (qRotate || eRotate) {
        layer.batchDraw();
      }
    }
    requestAnimationFrame(startRotationLoop);
  }

  startRotationLoop();

  // ------------------------------------------------------------------------------------------------
  // KEYBINDS
  // "Delete/Backspace" - Deleted selected cropped image
  document.addEventListener("keydown", (e) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      const selected = layer.findOne(".selected");
      if (selected) {
        transformer.nodes([]);
        selected.destroy();
        layer.draw();
      }
    }

    // "Enter/Space" - Crop Image
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault(); // Prevents default spacebar import image action
      cropButton.querySelector("button").click();
    }

    // "Copy" and "Paste" for Cropped Images
    if (e.ctrlKey && e.key === "c") {
      const selected = layer.findOne(".selected");
      if (selected) {
        copiedGroup = selected.clone();
        // Reset pasteCount back to 1, hence resetting potential offset of the pasted image, when copying a new cropped image
        pasteCount = 1;
      }
    }

    if (e.ctrlKey && e.key === "v") {
      if (copiedGroup) {
        const clone = copiedGroup.clone({
          x: copiedGroup.x() + 20 * pasteCount, // Offset Pasted Clones to differentiate from original and prior cropped images
          y: copiedGroup.y() + 20 * pasteCount,
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
        pasteCount++;
        transformer.moveToTop();

        // Auto-select Pasted Clone
        hideAllAnchors();
        layer.find("Group").forEach((g) => g.name(""));
        clone.name("selected");
        showAnchorsFor(clone);

        layer.draw();
      }
    }

    // "Q" and "E" - Rotate Cropped Image
    // It honestly is especially tedious trying to rotate an image through clicking that one tiny anchor point at the top
    // To reduce the amount of clicks needed to manipulate an image, using keybinds to rotate an image seems very intuitive,
    // greatly improving work-flow and usability.
    document.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();
      if (key === "q") qRotate = true;
      if (key === "e") eRotate = true;
    });

    document.addEventListener("keyup", (e) => {
      const key = e.key.toLowerCase();
      if (key === "q") qRotate = false;
      if (key === "e") eRotate = false;
    });
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
          autoCropArea: 0.5, // Initial Crop Preview Size
        });
        // Have "Crop Image" button visible after an image is uploaded
        cropButton.style.visibility = "visible";
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

    // Have "Download" and "Clear Canvas" buttons visible after cropping an image

    // These buttons appear seemingly very conveniently after the respective action has been.
    // (i.e. cropButton appears after an image has been imported => downloadButton & clearCanvasButton appears after a crop has been made)
    // Similar to the CSS comments, this "convenient appearance" behaviour enhances learnability and usability while retaining the minimalism style,
    // as it basically gives users step-by-step instructions in a text-less form.
    downloadButton.style.visibility = "visible";
    document.getElementById("clearCanvasButton").style.visibility = "visible";

    // Send Cropped-Image to Konva Canvas
    const imageObj = new Image();
    imageObj.onload = function () {
      // Scale cropped image to fit within Canvas while maintaining aspect ratio of the Crop
      const maxSize = 200;
      const minSize = 70;
      let scale = Math.min(
        // 1, to prevent upscaling of small crops and only allows downscaling of large crops
        1,
        maxSize / croppedCanvas.width,
        maxSize / croppedCanvas.height,
      );
      // Ensures the cropped images is never smaller than the const. minSize
      // If the crop is smaller than 70px, the resulting pasted cropped image will default to 70px
      // In the instance that a user may crop something that is smaller than 70px, this code will help remove the frustration of manipulating images that are TINY.
      const minScale = Math.max(
        minSize / croppedCanvas.width,
        minSize / croppedCanvas.height,
      );
      if (minScale > scale) {
        scale = minScale;
      }
      const imgWidth = croppedCanvas.width * scale;
      const imgHeight = croppedCanvas.height * scale;

      // Random positions of cropped image on the canvas
      // "500" and "500" are the dimensions of the canvas
      // Minus image dimensions to prevent it from being placed outside the canvas
      const group = new Konva.Group({
        x: Math.random() * (500 - imgWidth) + imgWidth / 2,
        y: Math.random() * (500 - imgHeight) + imgHeight / 2,
        width: imgWidth,
        height: imgHeight,
        // Set Origin of Rotation to center of the cropped image
        offsetX: imgWidth / 2,
        offsetY: imgHeight / 2,
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
  // Scroll-hint Arrow Disappearing Function

  // The arrow slowly fades out after the user has scrolled-down more than 50px (scrollY > 50)
  // Since it is assumed the arrow has done it's job of making users scroll down and have discovered the keybind controls,
  // I believe that the arrow is no longer needed, and it's existence simply is regarded as visual clutter.
  // To remove it seemlessly, a slow fade out is applied (in css, transition: opacity 0.5s ease)
  // All in all, this helps retain the minimalistic style and pleasant user experience of my creative tool.
  const scrollHint = document.getElementById("scroll-hint");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      scrollHint.style.opacity = "0";
      scrollHint.style.pointerEvents = "none";
    }
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
  link.download = "cropllage.png";

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

// ------------------------------------------------------------------------------------------------
// CLEAR CANVAS BUTTON + WARNING FUNCTION
let clearClickCount = 0;
let clearTimeoutRef = null;

document.getElementById("clearCanvasButton").addEventListener("click", () => {
  const clearBtn = document.getElementById("clear-btn");

  if (clearClickCount === 0) {
    // The first click arms the clear button and starts the timer for the clear-canvas function
    clearClickCount = 1;
    clearBtn.classList.add("armed");

    // Timer starts
    clearTimeoutRef = setTimeout(() => {
      // Time expires - clear button is disarmed denoted via in an instant change in colour back to the original colour of the clear-canvas button (i.e grey)
      clearBtn.classList.remove("armed");
      clearBtn.classList.add("expired");

      setTimeout(() => {
        clearBtn.classList.remove("expired");
        clearClickCount = 0;
        // 300ms (0.3s) is how long the "secondary" warning color (i.e amber) is shown for.
        // 300ms I found to be the sweet spot for the colour to be shown long enough for the users to easily comprehend while also being visually pleasant
      }, 300);
      // 500ms (0.5s) is the Timer's total Duration.
      // I believe 500ms is a good duration as it gives users enough time to click on the clear-canvas a second time
      // as well as being short enough to reduce the chance of users accidentally clicking the button a second time while the timer is armed.
    }, 500);

    // The second click executes the function while changing the colour back to default grey, resetting the click count and the timer.
  } else if (clearClickCount === 1) {
    if (clearTimeoutRef) {
      clearTimeout(clearTimeoutRef);
    }

    clearTimeoutRef = null;
    clearClickCount = 0;
    clearBtn.classList.remove("armed");

    // Before executing the clear canvas function, it removes the transformer first
    // which retains all the relevant image manipulation functions and saves it from being destroyed by the code
    // This ensures that the only thing being destroyed within the cropped-container are the cropped images
    transformer.remove();
    layer.destroyChildren();
    // After the cropped images have been deleted
    // The transformer is then re-added, restoring relevant image-manipulation functions
    layer.add(transformer);
    transformer.nodes([]);
    layer.draw();
  }
});
