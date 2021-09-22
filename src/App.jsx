import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import React, { useEffect, useState } from 'react';
import './App.css';
import imageData from './images.json';

const ffmpeg = createFFmpeg({
  log: true,
  corePath: 'static/js/ffmpeg-core.js',
});
console.log(imageData.images.length);

function App() {
  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState();
  const [gif, setGif] = useState();

  const load = async () => {
    await ffmpeg.load();
    setReady(true);
  };

  useEffect(() => {
    load();
  }, []);

  const convertToGif = async () => {
    // Write the file to memory
    ffmpeg.FS('writeFile', 'test.mp4', await fetchFile(video));

    // Run the FFMpeg command
    await ffmpeg.run(
      '-i',
      'test.mp4',
      '-t',
      '2.5',
      '-ss',
      '2.0',
      '-f',
      'gif',
      'out.gif',
    );

    // Read the result
    const data = ffmpeg.FS('readFile', 'out.gif');

    // Create a URL
    const url = URL.createObjectURL(
      new Blob([data.buffer], { type: 'image/gif' }),
    );
    setGif(url);
  };

  async function startEncoding() {
    console.log('start encoding');

    // Write the file to memory
    imageData.images.forEach(async (image, i) => {
      ffmpeg.FS(
        'writeFile',
        `img${String(i).padStart(3, '0')}.png`,
        await fetchFile(image),
      );
    });

    // Run the FFMpeg command
    await ffmpeg.run('-framerate', '24', '-i', 'img%03d.png', 'output.mp4');

    // Read the result
    const data = ffmpeg.FS('readFile', 'output.mp4');

    // Create a URL
    const url = URL.createObjectURL(
      new Blob([data.buffer], { type: 'image/png' }),
    );
    console.log({ url });
    //setGif(url);
  }

  return ready ? (
    <div className="App">
      {video && (
        <video controls width="250" src={URL.createObjectURL(video)}></video>
      )}

      <input type="file" onChange={(e) => setVideo(e.target.files?.item(0))} />

      <h3>Result</h3>

      <button onClick={convertToGif}>Convert</button>

      {gif && <img src={gif} width="250" />}

      <button onClick={startEncoding}>start encoding</button>
    </div>
  ) : (
    <p>Loading...</p>
  );
}

export default App;
