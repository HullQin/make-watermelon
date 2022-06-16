import { Loader } from '@pixi/loaders';
import { Fruits } from './config';
import app from './app';
import { init } from './core';
import './index.css';

const images = Fruits.map((i) => i.name);
document.getElementById('root')!.appendChild(app.view);
Loader.shared.add(images).load(init);
