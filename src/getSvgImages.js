import Lottie from 'lottie-web';

function _getSvgImages(path) {
  return new Promise((resolve, reject) => {
    var images = [];
    const container = document.createElement('div');

    var animation = Lottie.loadAnimation({
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

function drawSVG(svg, x, y, width, height) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const img = new Image();
    const serialized = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(
      new Blob([serialized], { type: 'image/svg+xml' }),
    );
    img.onload = function () {
      console.log('d');
      canvas.getContext('2d').drawImage(img, x, y, width, height);
      resolve(img);
    };
    img.src = url;
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

      const images = await Promise.all(
        svgImages.map((svg, i) => drawSVG(svg, 0, 0, width, height)),
      );
      console.log('images', images);
      resolve(images);
    });
  });
}
