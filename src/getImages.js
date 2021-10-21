import Lottie from 'lottie-web';

export function getImages(path, width, height, callback) {
  return new Promise((resolve, reject) => {
    var canvas = document.createElement('canvas');
    console.log({ width, height });
    canvas.width = width;
    canvas.height = height;

    var ctx = canvas.getContext('2d');
    var images = [];

    var animation = Lottie.loadAnimation({
      renderer: 'canvas',
      loop: false,
      autoplay: true,
      path: path,
      rendererSettings: {
        context: ctx, // the canvas context
        // scaleMode: "scale",
        clearCanvas: true,
        progressiveLoad: false, // Boolean, only svg renderer, loads dom elements when needed. Might speed up initialization for large number of elements.
        hideOnTransparent: true, //Boolean, only svg renderer, hides elements when opacity reaches 0 (defaults to true)
        preserveAspectRatio: 'xMidYMid meet',
      },
    });
    // return;
    // animation.setSpeed(0.5);
    // animation.setSubframe(false);

    // animation.addEventListener('enterFrame', function captureFrame(e) {
    //   console.log('ef');
    //   // images.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    // });

    // animation.addEventListener('complete', function captureFrame() {
    //   console.log('completed', images.length);
    //   resolve(images);
    // });

    animation.addEventListener('data_ready', function captureFrame() {
      animation.play();
      setTimeout(() => {
        run();
      }, 3000);
    });

    function run() {
      const totalFrames = animation.getDuration(true);
      for (let index = 0; index < totalFrames; index++) {
        setTimeout(() => {
          animation.goToAndStop(index, true);
          images.push(canvas.toDataURL());
          console.log('capture');
        }, 0);
        setTimeout(() => {
          callback(index);
        }, 0);
      }
      setTimeout(() => {
        console.log('completed capturing', images.length);
        animation.destroy();
        resolve(images);
      }, 0);
    }
  });
}
