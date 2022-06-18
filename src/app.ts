import pixi from './pixi';
import { Height, Width } from './config';

export default new pixi.Application({
  width: Width,
  height: Height,
  antialias: true,
  backgroundColor: 0xffe89d,
});
