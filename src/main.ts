import pixi from './pixi';
import { Fruits, Height, Width } from './config';
import app from './app';
import { init } from './core';
import './index.css';

const { Loader } = pixi;
const images = Fruits.map((i) => i.name);
const root = document.getElementById('root')!;
const canvas = app.view;
root.appendChild(canvas);
Loader.shared.add(images).load(init);

const resetSize = () => {
  canvas.style.width = `${Width}px`;
  canvas.style.height = `${Height}px`;
  const { innerWidth, innerHeight } = window;
  if (innerWidth / innerHeight > Width / Height) {
    root.style.height = `${innerHeight}px`;
    root.style.width = `${innerHeight / Height * Width}px`;
    canvas.style.transform = `scale(${innerHeight / Height})`;
  } else {
    root.style.width = `${innerWidth}px`;
    root.style.height = `${innerWidth / Width * Height}px`;
    canvas.style.transform = `scale(${innerWidth / Width})`;
  }
};

resetSize();

window.onresize = resetSize;
