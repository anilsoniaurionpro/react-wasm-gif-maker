function _getSvgImages(path) {
  return new Promise((resolve, reject) => {
    var images = [];
    const container = document.createElement('div');

    var animation = lottie.loadAnimation({
      container,
      loop: false,
      autoplay: true,
      path:
        path || 'https://assets5.lottiefiles.com/packages/lf20_hcae8wxn.json',
      rendererSettings: {
        scaleMode: 'noScale',
        clearCanvas: true,
        progressiveLoad: false,
        hideOnTransparent: true,
      },
    });

    animation.addEventListener('complete', function captureFrame() {
      console.log('completed', images.length);
      resolve(images);
    });

    animation.addEventListener('data_ready', function captureFrame() {
      console.log(animation.getDuration(true));
      animation.play();
      setTimeout(() => {
        run();
      }, 3000);
    });

    function run() {
      console.time('svg');
      const totalFrames = animation.getDuration(true);
      for (let index = 0; index < totalFrames; index++) {
        animation.goToAndStop(index, true);
        images.push(container.children[0].cloneNode(true));
        console.log('scapture');
      }
      console.timeEnd('svg');
      resolve(images);
    }
  });
}

export async function getSvgImages(path, width, height, callback) {
  return new Promise((resolve, reject) => {
    _getSvgImages(path).then(async (svgImages) => {
      console.time('canvas');
      console.log({ images: svgImages }, svgImages.length);

      // const canvas = document.createElement("canvas");
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      const images = [];

      let gid = null;
      let index = 0;
      // const { stop, recorder } = start(canvas.captureStream(30));
      // recorder.start();

      async function drawFrame() {
        ctx.clearRect(0, 0, width, height);
        await drawSVG(svgImages[index++], ctx, 0, 0, width, height);
        if (index < svgImages.length) {
          setTimeout(() => {
            callback(index);
          }, 0);
          setTimeout(() => {
            images.push(canvas.toDataURL());
            gid = requestAnimationFrame(drawFrame);
          }, 0);
        } else {
          setTimeout(() => {
            cancelAnimationFrame(gid);
            console.timeEnd('canvas');
            resolve(images);
          }, 0);
        }
      }
      requestAnimationFrame(drawFrame);
    });
  });
}
