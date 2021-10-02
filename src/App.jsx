import React, { useState, useEffect } from 'react';
import './App.css';

import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
const ffmpeg = createFFmpeg({ log: true , 
  // corePath: 'static/js/ffmpeg-core.js'
 });

function App() {
  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState();
  const [gif, setGif] = useState();

  const load = async () => {
    await ffmpeg.load();
    setReady(true);
  }

  useEffect(() => {
    load();
  }, [])

  const convertToGif = async () => {
    // Write the file to memory 
    ffmpeg.FS('writeFile', 'test.mp4', await fetchFile(video));

    // Run the FFMpeg command
    await ffmpeg.run('-i', 'test.mp4', '-t', '2.5', '-ss', '2.0', '-f', 'gif', 'out.gif');

    // Read the result
    const data = ffmpeg.FS('readFile', 'out.gif');

    // Create a URL
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'image/gif' }));
    setGif(url)
  }

  return ready ? (
    
    <div className="App">
      { video && <video
        controls
        width="250"
        src={URL.createObjectURL(video)}>

      </video>}


      <input type="file" onChange={(e) => setVideo(e.target.files?.item(0))} />

      <h3>Result</h3>

      <button onClick={convertToGif}>Convert</button>

      { gif && <img src={gif} width="250" />}

    </div>
  )
    :
    (
      <p>
        <img src="https://wd.imgix.net/image/CZmpGM8Eo1dFe0KNhEO9SGO8Ok23/tWnZEOnNmBeFcZxuR9Dx.jpg?auto=format&w=964" alt="banner" />
        Loading...</p>
    );
}

export default App;
