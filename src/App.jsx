import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import Lottie from 'lottie-web';
import React, { useEffect, useState } from 'react';
import './App.css';
import imageData from './images.json';

const ffmpeg = createFFmpeg({
  log: true,
  corePath: 'static/js/ffmpeg-core.js',
});
console.log(imageData.images.length);

const URLS = [
  {
    name: 'blue slides',
    path: 'https://assets1.lottiefiles.com/packages/lf20_bjf6kwgv.json',
  },
  {
    name: 'glass',
    path: 'https://assets2.lottiefiles.com/packages/lf20_tyl9s8rw.json',
  },
  {
    name: 'line art',
    path: 'https://assets5.lottiefiles.com/packages/lf20_rdtdoam2.json',
  },
];

const QUALITY = {
  LOW: 'LOW',
  MID: 'MID',
  HIGH: 'HIGH',
};

function getDimension(quality) {
  switch (quality) {
    case QUALITY.LOW:
      return { width: 480, height: 852 };

    case QUALITY.LOW:
      return { width: 720, height: 1280 };

    case QUALITY.LOW:
      return { width: 1080, height: 1920 };

    default:
      return { width: 480, height: 852 };
  }
}

function App() {
  const [ready, setReady] = useState(false);
  const [output, setOutput] = useState();
  const [images, setImages] = useState([]);
  const [path, setPath] = useState(URLS[0].path);
  const [quality, setQuality] = useState(QUALITY.LOW);
  const [processing, setProcessing] = useState(false);
  const [fps, setFps] = useState('30');

  const load = async () => {
    await ffmpeg.load();
    setReady(true);
  };

  useEffect(() => {
    load();
  }, []);

  function getImages(path) {
    return new Promise((resolve, reject) => {
      var canvas = document.createElement('canvas');
      const { width, height } = getDimension(quality);
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
          animation.goToAndStop(index, true);
          images.push(canvas.toDataURL());
          console.log('capture');
        }
        console.log('completed capturing', images.length);
        animation.destroy();
        resolve(images);
      }
    });
  }

  async function startEncoding() {
    console.time('process');
    setProcessing(true);
    console.time('capturing');
    const imageSeq = await getImages(path);
    console.timeEnd('capturing');
    output && URL.revokeObjectURL(output);
    setOutput('');

    console.time('writing');
    console.log('start encoding');
    imageSeq.forEach(async (image, i) => {
      ffmpeg.FS(
        'writeFile',
        `img${String(i).padStart(5, '0')}.png`,
        await fetchFile(image),
      );
    });

    ffmpeg.FS('writeFile', `audio10.mp3`, await fetchFile('audio10.mp3'));
    console.timeEnd('writing');

    // Run the FFMpeg command
    console.time('encoding');

    // await ffmpeg.run('-h', 'full');

    await ffmpeg.run(
      '-framerate',
      fps,
      '-i',
      'img%05d.png',
      '-i',
      'audio10.mp3',
      'output.mp4',
    );
    console.timeEnd('encoding');

    // Read the result
    const data = ffmpeg.FS('readFile', 'output.mp4');

    // Create a URL
    const url = URL.createObjectURL(
      new Blob([data.buffer], { type: 'video/mp4' }),
    );

    setOutput(url);
    setProcessing(false);
    console.log({ url });
    imageSeq.forEach(async (image, i) => {
      ffmpeg.FS('unlink', `img${String(i).padStart(5, '0')}.png`);
    });
    ffmpeg.FS('unlink', `output.mp4`);
    ffmpeg.FS('unlink', `audio10.mp3`);

    console.timeEnd('process');
  }

  return ready ? (
    <div className="App">
      <h1>1. Pick lottie animation</h1>
      <h2>Type lottie url</h2>
      <input
        disabled={processing}
        type="text"
        value={path}
        onChange={(e) => setPath(e.target.value)}
      />
      <br />
      <h2>Or, select predefined ones</h2>
      <select
        disabled={processing}
        value={path}
        onChange={(e) => setPath(e.target.value)}
      >
        {URLS.map((item) => (
          <option value={item.path}>{item.name}</option>
        ))}
      </select>
      <br />
      <hr />

      <h1>2. Pick quality</h1>
      <select
        disabled={processing}
        value={quality}
        onChange={(e) => setQuality(e.target.value)}
      >
        {Object.keys(QUALITY).map((item) => (
          <option value={item}>{item}</option>
        ))}
      </select>
      <br />
      <hr />

      <h1>3. FPS</h1>
      <select
        disabled={processing}
        value={fps}
        onChange={(e) => setFps(e.target.value)}
      >
        {['30', '27', '25', '22', '20'].map((item) => (
          <option value={item}>{item}</option>
        ))}
      </select>
      <br />
      <hr />

      <button onClick={startEncoding} disabled={!path || processing}>
        {processing ? 'Encoding ...' : 'Start'}
      </button>
      <code>{processing && 'Open console to see progress'}</code>
      {processing && <img src="./loading.svg" alt="loading" />}

      {output && !processing && (
        <video controls autoPlay width="250" src={output}></video>
      )}
    </div>
  ) : (
    <p>Loading ffmpeg wasm...</p>
  );
}

export default App;
