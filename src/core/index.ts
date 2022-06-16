import { Sprite } from '@pixi/sprite';
import { Loader } from '@pixi/loaders';
import * as b2 from '../b2';
import app from '../app';
import {
  Ratio, Fruits, PositionIterations, VelocityIterations, TimeStep, Height, Width,
} from '../config';
import { b2Body } from '../b2/dynamics/b2_body';

const world = new b2.World({ x: 0, y: 10 });

const createWall = () => {
  const wallBodyDef = new b2.BodyDef();
  const wallFixtureDef = new b2.FixtureDef();
  wallBodyDef.type = b2.staticBody;
  wallFixtureDef.density = 0;
  wallFixtureDef.friction = 0.2;
  wallFixtureDef.restitution = 0.3;
  wallFixtureDef.filter.groupIndex = -20;
  wallFixtureDef.shape = new b2.ChainShape().CreateLoop([
    { x: 0, y: 0 / Ratio },
    { x: 0, y: Height / Ratio },
    { x: Width / Ratio, y: Height / Ratio },
    { x: Width / Ratio, y: 0 / Ratio },
  ]);
  const wallBody = world.CreateBody(wallBodyDef);
  wallBody.CreateFixture(wallFixtureDef);
  wallBody.SetUserData({ type: -1 });
};

const fruitDefaultY = 204 / Ratio;
const fruitBodyDef = new b2.BodyDef();
fruitBodyDef.type = b2.dynamicBody;
fruitBodyDef.position.Set(Width / 2 / Ratio, fruitDefaultY);
const fruitFixtureDefs = Fruits.map((fruit, index) => {
  const fixtureDef = new b2.FixtureDef();
  fixtureDef.density = 0.1;
  fixtureDef.friction = 0.2;
  fixtureDef.restitution = 0.3;
  fixtureDef.shape = new b2.CircleShape(fruit.radius / Ratio);
  fixtureDef.filter.groupIndex = 1;
  return fixtureDef;
});

let fruitId = 0;
const fruits: {[key: string]: {body: b2Body, sprite: Sprite}} = {};
const contactedFruits = new Map<number, number>();
const mergingFruitSet = new Set();
const createFruit = (id: number, x = Width / 2) => {
  let newX = x;
  if (x < 5) newX = 5;
  if (x > Width - 5) newX = Width - 5;
  const fruit = Fruits[id];
  const fruitBody = world.CreateBody(fruitBodyDef);
  fruitBody.SetSleepingAllowed(true);
  fruitBody.SetPositionXY(newX / Ratio, fruitDefaultY);
  fruitBody.CreateFixture(fruitFixtureDefs[id]);
  fruitBody.SetUserData({ type: id, id: fruitId });
  const sprite = new Sprite();
  sprite.anchor.set(0.5);
  sprite.x = -299;
  sprite.y = -299;
  sprite.texture = Loader.shared.resources[fruit.name].texture!;
  sprite.scale.set(fruit.radius / Fruits[id].imgRadius);
  app.stage.addChild(sprite);
  fruits[fruitId++] = { body: fruitBody, sprite };
};

const animationFruits = [];

const doWithContactedFruits = () => {
  contactedFruits.forEach((maxId, minId) => {
    let top = fruits[maxId];
    let bottom = fruits[minId];
    if (top.body.GetPosition().y > bottom.body.GetPosition().y) {
      const mid = top;
      top = bottom;
      bottom = mid;
    }
    bottom.body.DestroyFixture(bottom.body.GetFixtureList()!);
    const data = bottom.body.GetUserData();
    bottom.body.CreateFixture(fruitFixtureDefs[data.type + 1]);
    bottom.body.SetUserData({ ...data, type: data.type + 1 });
    mergingFruitSet.delete(minId);
    mergingFruitSet.delete(maxId);
    delete fruits[top.body.GetUserData().id];
    world.DestroyBody(top.body);
    app.stage.removeChild(top.sprite);
    const newFruit = Fruits[data.type + 1];
    bottom.sprite.texture = Loader.shared.resources[newFruit.name].texture!;
    bottom.sprite.scale.set(newFruit.radius / newFruit.imgRadius);
  });
  contactedFruits.clear();
};

const loop = () => {
  world.Step(TimeStep, VelocityIterations, PositionIterations);
  doWithContactedFruits();
  world.Step(TimeStep, VelocityIterations, PositionIterations);
  doWithContactedFruits();
  world.Step(TimeStep, VelocityIterations, PositionIterations);
  doWithContactedFruits();
  Object.keys(fruits).forEach((id) => {
    const fruit = fruits[id];
    const { body, sprite } = fruit;
    const { x, y } = body.GetPosition();
    const angle = body.GetAngle();
    sprite.x = x * Ratio;
    sprite.y = y * Ratio;
    sprite.rotation = angle;
  });
  requestAnimationFrame(loop);
};

const rootElement = document.getElementById('root')!;

export const init = () => {
  const canvas = document.getElementsByTagName('canvas')[0];
  canvas.addEventListener('touchend', (event) => {
    const { changedTouches } = event;
    if (changedTouches.length !== 1) return;
    const left = parseFloat(getComputedStyle(rootElement).marginLeft);
    const { clientX } = changedTouches[0];
    createFruit(0, (clientX - left) / 0.625);
  });
  canvas.addEventListener('click', (event) => {
    if ('ontouchend' in window) return;
    const { offsetX } = event;
    createFruit(Math.floor(3.99 * Math.random()), offsetX);
  });
  createWall();

  b2.ContactListener.prototype.PreSolve = (contact) => {
    const a = contact.GetFixtureA().GetBody().GetUserData();
    const b = contact.GetFixtureB().GetBody().GetUserData();
    if (a.type !== b.type || a.type >= 10) return;
    const minId = Math.min(a.id, b.id);
    const maxId = Math.max(a.id, b.id);
    const contactedFruit = contactedFruits.get(minId);
    if (!contactedFruit) {
      if (mergingFruitSet.has(minId) || mergingFruitSet.has(maxId)) return;
      contactedFruits.set(minId, maxId);
      mergingFruitSet.add(minId);
      mergingFruitSet.add(maxId);
      contact.SetEnabled(false);
      return;
    }
    if (contactedFruit === maxId) {
      contact.SetEnabled(false);
    }
  };
  loop();
};
