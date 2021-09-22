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
  const [output, setOutput] = useState();
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

    [0, 1].forEach((m) => {
      imageData.images.forEach(async (image, i) => {
        ffmpeg.FS(
          'writeFile',
          `img${String(i + 61 * m).padStart(4, '0')}.png`,
          await fetchFile(image),
        );
      });
    });

    ffmpeg.FS('writeFile', `audio.mp3`, await fetchFile('audio.aac'));

    // Run the FFMpeg command
    await ffmpeg.run(
      '-framerate',
      '30',
      '-i',
      'img%04d.png',
      '-i',
      'audio.mp3',
      'output.mp4',
    );

    // Read the result
    const data = ffmpeg.FS('readFile', 'output.mp4');

    // Create a URL
    const url = URL.createObjectURL(
      new Blob([data.buffer], { type: 'video/mp4' }),
    );
    console.log({ url });
    setOutput(url);
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

      {output && <video controls width="250" src={output}></video>}
    </div>
  ) : (
    <p>Loading...</p>
  );
}

export default App;
