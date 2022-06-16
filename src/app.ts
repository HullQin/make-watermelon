import { Application } from 'pixi.js';
import { Height, Width } from './config';

export default new Application({
  width: Width,
  height: Height,
  antialias: true,
  backgroundColor: 0xffe89d,
});
