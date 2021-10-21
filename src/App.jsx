import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import localforage from 'localforage';
import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { getImages } from './getImages';
import imageData from './images.json';

const ffmpeg = createFFmpeg({
  log: true,
  corePath: 'static/js/ffmpeg-core.js',
});
console.log(imageData.images.length);
localforage.config({
  driver: localforage.INDEXEDDB, // Force WebSQL; same as using setDriver()
  name: 'vidyback',
  version: 1.0,
  size: 4980736, // Size of database, in bytes. WebSQL-only for now.
  storeName: 'vidyback', // Should be alphanumeric, with underscores.
  description: 'asset storage for later processing',
});

function getFileExtenstionFromUrl(url) {
  const a = url.split('.');
  return a[a.length - 1];
}

export function toProxyUrl(url) {
  const path =
    'https://vidybackapi.herokuapp.com' + '/proxy/' + encodeURIComponent(url);
  return path;
}

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
  {
    name: 'small',
    path: 'https://assets1.lottiefiles.com/packages/lf20_6s59yx.json',
  },
];

const QUALITY = {
  LOW: 'LOW',
  MID: 'MID',
  HIGH: 'HIGH',
};

const RENDERER = {
  SVG: 'SVG',
  CANVAS: 'CANVAS',
};

function getDimension(quality) {
  switch (quality) {
    case QUALITY.LOW:
      return { width: 480, height: 852 };

    case QUALITY.MID:
      return { width: 720, height: 1280 };

    case QUALITY.HIGH:
      return { width: 1080, height: 1080 };

    default:
      return { width: 480, height: 852 };
  }
}

function App() {
  const [ready, setReady] = useState(false);
  const [output, setOutput] = useState();
  const [images, setImages] = useState([]);
  const [path, setPath] = useState(URLS[3].path);
  const [quality, setQuality] = useState(QUALITY.LOW);
  const [processing, setProcessing] = useState(false);
  const [fps, setFps] = useState('30');
  const ref = useRef();
  const [cover, setCover] = useState('');
  const [video, setVideo] = useState('');
  const [renderer, setRenderer] = useState(RENDERER.CANVAS);

  const load = async () => {
    await ffmpeg.load();
    setReady(true);
  };

  useEffect(() => {
    load();
  }, []);

  function updateText(i) {
    if (ref.current) {
      ref.current.innerHTML = i || 'ok';
    }
  }

  async function startEncoding() {
    console.time('process');
    setProcessing(true);
    console.time('capturing');
    const { width, height } = getDimension(quality);
    const imageSeq = await getImages(path, width, height, updateText);

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

    // ffmpeg.FS('writeFile', `audio10.mp3`, await fetchFile('audio10.mp3'));
    var filename = '';
    if (true) {
      filename =
        'audio.' +
        getFileExtenstionFromUrl(
          'https://cdn.hootout.com/behtarads/music/vv-template-08-s-02.aac',
        );
      ffmpeg.FS(
        'writeFile',
        filename,
        await fetchFile(
          toProxyUrl(
            'https://cdn.hootout.com/behtarads/music/vv-template-08-s-02.aac',
          ),
        ),
      );
    }
    console.timeEnd('writing');

    // Run the FFMpeg command
    console.time('encoding');

    // await ffmpeg.run('-h', 'full');

    // await ffmpeg.run(
    //   '-framerate',
    //   fps,
    //   '-i',
    //   'img%05d.png',
    //   '-i',
    //   'audio10.mp3',
    //   'output.mp4',
    // );

    // await ffmpeg.run(
    //   '-r',
    //   fps,
    //   '-i',
    //   'img%05d.png',
    //   "-ss" ,"0",
    //   '-i',
    //   'audio10.mp3',
    //   "-t" , "" + (Math.floor(imageSeq.length / fps)),
    //   '-c:v',
    //   'libx264',
    //   '-preset',
    //   'superfast',
    //   '-crf',
    //   '25',
    //   'output.mp4',
    // );

    await ffmpeg.run(
      '-r',
      fps,
      '-i',
      'img%05d.png',
      '-ss',
      '0',
      '-i',
      filename,
      '-t',
      '' + Math.floor(imageSeq.length / fps),
      '-c:v',
      'libx264',
      '-preset',
      'superfast',
      '-crf',
      '25',
      'output.mp4',
    );
    console.timeEnd('encoding');

    // Read the result
    const data = ffmpeg.FS('readFile', 'output.mp4');

    // Create a URL
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    console.timeEnd('process');
    setOutput(url);
    setProcessing(false);
    console.log({ url });
    imageSeq.forEach(async (image, i) => {
      ffmpeg.FS('unlink', `img${String(i).padStart(5, '0')}.png`);
    });
    ffmpeg.FS('unlink', `output.mp4`);
    ffmpeg.FS('unlink', filename);

    await localforage.setItem('entry', {
      image: imageSeq[5],
      video: blob,
      date: new Date().toISOString(),
    });
    console.log('added');
  }

  function upload() {
    var fd = new FormData();
    fd.append('uid', '123');
    fetch('localhost:3000/upload', {
      method: 'POST',
      body: fd,
    })
      .then((res) => console.log('uploaded'))
      .catch((error) => console.error(error));
  }

  async function loadCover() {
    const keys = await localforage.keys();
    console.log('loading cover', keys);
    const record = await localforage.getItem('entry');
    console.log(record);
    record.image && setCover(record.image);
    record.video && setVideo(record.video);
  }

  return ready ? (
    <div className="App">
      {/* {cover && video && (
        <div>
          <img src={cover} alt="cover" />
          <video
            controls
            src={URL.createObjectURL(video)}
            poster={cover}
          ></video>
        </div>
      )}
      <button onClick={loadCover}>load last saved video</button> */}
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
          <option value={item.path} key={item.path}>
            {item.name}
          </option>
        ))}
      </select>
      <br />
      <hr />

      <h1>
        2. Pick quality <code>{getDimension(quality)}</code>
      </h1>
      <select
        disabled={processing}
        value={quality}
        onChange={(e) => setQuality(e.target.value)}
      >
        {Object.keys(QUALITY).map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
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
          <option value={item} key={item}>
            {item}
          </option>
        ))}
      </select>
      <br />
      <hr />

      <h1>4. Renderer</h1>
      <select
        disabled={processing}
        value={renderer}
        onChange={(e) => setRenderer(e.target.value)}
      >
        {Object.keys(RENDERER).map((item) => (
          <option value={item} key={item}>
            {item}
          </option>
        ))}
      </select>
      <br />
      <hr />

      <button onClick={startEncoding} disabled={!path || processing}>
        {processing ? 'Encoding ...' : 'Start'}
      </button>
      <code>{processing && 'Open console to see progress'}</code>
      {processing && <img src="./loading.svg" alt="loading" />}
      {processing && <p ref={ref}>text</p>}

      {output && !processing && (
        <>
          <video controls autoPlay width="250" src={output}></video>
          <button onClick={upload}>upload</button>
        </>
      )}
    </div>
  ) : (
    <p>
      <img
        src="https://wd.imgix.net/image/CZmpGM8Eo1dFe0KNhEO9SGO8Ok23/tWnZEOnNmBeFcZxuR9Dx.jpg?auto=format&w=964"
        alt="banner"
      />
      <img
        src="https://cdn.shopify.com/s/files/1/0602/5019/4096/products/hlaf.jpg"
        alt="banner"
      />
      <img
        src="https://vidybackapi.herokuapp.com/proxy/https%3A%2F%2Fi.etsystatic.com%2F17095327%2Fr%2Fil%2F879610%2F2016510847%2Fil_fullxfull.2016510847_kn0j.jpg"
        alt="proxy"
      />
      Loading ffmpeg wasm...
    </p>
  );
}

export default App;
