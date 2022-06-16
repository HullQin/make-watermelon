import { Sprite } from '@pixi/sprite';
import { Loader } from '@pixi/loaders';
import app from './app';
import * as b2 from './b2';
import { b2Body } from './b2/dynamics/b2_body';
import { ChainShape } from './b2';

const PTM_RATIO = 35;
const timeStep = 1 / 120;
const velocityIterations = 10;
const positionIterations = 10;

const spritePlayer = new Sprite();
const spritePlayer2 = new Sprite();
const spritePlayer3 = new Sprite();
const spritePlayer4 = new Sprite();
spritePlayer.anchor.set(0.5);
spritePlayer2.anchor.set(0.5);
spritePlayer3.anchor.set(0.5);
spritePlayer4.anchor.set(0.5);

const data = {
  world: new b2.World({ x: 0, y: 10 }),
  wallBodyDef: new b2.BodyDef(),
  fruitBodyDef: new b2.BodyDef(),
  wallFixtureDef: new b2.FixtureDef(),
  fruitFixtureDef: new b2.FixtureDef(),
  fruitBody: {} as b2Body,
  wallBody: {} as b2Body,
};

data.wallBodyDef.type = b2.staticBody;
data.fruitBodyDef.type = b2.dynamicBody;
data.wallFixtureDef.density = 0;
data.wallFixtureDef.friction = 0.5;
data.wallFixtureDef.shape = new b2.ChainShape();
(data.wallFixtureDef.shape as ChainShape).CreateLoop([{ x: 0, y: -100 / PTM_RATIO }, { x: 0, y: 880 / PTM_RATIO }, { x: 440 / PTM_RATIO, y: 880 / PTM_RATIO }, { x: 440 / PTM_RATIO, y: -100 / PTM_RATIO }]);
data.wallBodyDef.position.Set(0 / PTM_RATIO, 0 / PTM_RATIO);
data.wallBody = data.world.CreateBody(data.wallBodyDef);
data.wallBody.CreateFixture(data.wallFixtureDef);
data.fruitFixtureDef.density = 1;
data.fruitFixtureDef.friction = 0.5;
data.fruitFixtureDef.restitution = 0.3;
data.fruitFixtureDef.shape = new b2.CircleShape(26 / PTM_RATIO);
data.fruitBodyDef.position.Set(220 / PTM_RATIO, 26 / PTM_RATIO);
data.fruitBody = data.world.CreateBody(data.fruitBodyDef);
data.fruitBody.CreateFixture(data.fruitFixtureDef);
const fruit2 = data.world.CreateBody(data.fruitBodyDef);
fruit2.CreateFixture(data.fruitFixtureDef);
fruit2.SetPosition({ x: 200 / PTM_RATIO, y: 126 / PTM_RATIO });
const fruit3 = data.world.CreateBody(data.fruitBodyDef);
fruit3.CreateFixture(data.fruitFixtureDef);
fruit3.SetPosition({ x: 200 / PTM_RATIO, y: 26 / PTM_RATIO });
const fruit4 = data.world.CreateBody(data.fruitBodyDef);
fruit4.CreateFixture(data.fruitFixtureDef);
fruit4.SetPosition({ x: 231 / PTM_RATIO, y: 126 / PTM_RATIO });
function gameLoop() {
  data.world.Step(timeStep, velocityIterations, positionIterations);
  data.world.Step(timeStep, velocityIterations, positionIterations);
  data.world.Step(timeStep, velocityIterations, positionIterations);
  const { x, y } = data.fruitBody.GetPosition();
  spritePlayer.x = x * PTM_RATIO;
  spritePlayer.y = y * PTM_RATIO;
  spritePlayer.rotation = data.fruitBody.GetAngle();
  spritePlayer2.x = fruit2.GetPosition().x * PTM_RATIO;
  spritePlayer2.y = fruit2.GetPosition().y * PTM_RATIO;
  spritePlayer2.rotation = fruit2.GetAngle();
  spritePlayer3.x = fruit3.GetPosition().x * PTM_RATIO;
  spritePlayer3.y = fruit3.GetPosition().y * PTM_RATIO;
  spritePlayer3.rotation = fruit2.GetAngle();
  spritePlayer4.x = fruit4.GetPosition().x * PTM_RATIO;
  spritePlayer4.y = fruit4.GetPosition().y * PTM_RATIO;
  spritePlayer4.rotation = fruit2.GetAngle();
  requestAnimationFrame(gameLoop);
}

export default function setup() {
  spritePlayer.texture = Loader.shared.resources['/fruits/fruit_1.png'].texture!;
  spritePlayer2.texture = Loader.shared.resources['/fruits/fruit_1.png'].texture!;
  spritePlayer3.texture = Loader.shared.resources['/fruits/fruit_1.png'].texture!;
  spritePlayer4.texture = Loader.shared.resources['/fruits/fruit_1.png'].texture!;
  app.stage.addChild(spritePlayer);
  app.stage.addChild(spritePlayer2);
  app.stage.addChild(spritePlayer3);
  app.stage.addChild(spritePlayer4);
  gameLoop();
}
