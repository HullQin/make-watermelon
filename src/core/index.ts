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

const fruitDefaultY = 150 / Ratio;
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
const createSprite = (type: number, x = -299, y = -299) => {
  const fruit = Fruits[type];
  const sprite = new Sprite();
  sprite.anchor.set(0.5);
  sprite.x = x;
  sprite.y = y;
  sprite.texture = Loader.shared.resources[fruit.name].texture!;
  sprite.scale.set(fruit.radius / fruit.imgRadius);
  return sprite;
};
const currentNextFruit = {
  current: 0,
  next: 0,
};
let currentFruitSprite: Sprite;
let nextFruitSprite: Sprite;
const setCurrentNextFruit = () => {
  let currentFruit = 0;
  let nextFruit = 0;
  Object.defineProperty(currentNextFruit, 'current', {
    get() {
      return currentFruit;
    },
    set(value) {
      currentFruit = value;
      const fruit = Fruits[value];
      currentFruitSprite.texture = Loader.shared.resources[fruit.name].texture!;
      currentFruitSprite.scale.set(fruit.radius / fruit.imgRadius);
    },
  });
  Object.defineProperty(currentNextFruit, 'next', {
    get() {
      return nextFruit;
    },
    set(value) {
      nextFruit = value;
      const fruit = Fruits[value];
      nextFruitSprite.texture = Loader.shared.resources[fruit.name].texture!;
      nextFruitSprite.scale.set(fruit.radius / fruit.imgRadius);
    },
  });
};
setCurrentNextFruit();
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
  const sprite = createSprite(id);
  app.stage.addChild(sprite);
  fruits[fruitId++] = { body: fruitBody, sprite };
  currentNextFruit.current = currentNextFruit.next;
  if (fruitId < 4) currentNextFruit.next = Math.floor(Math.random() * 2);
  else if (fruitId < 8) currentNextFruit.next = Math.floor(Math.random() * 3);
  else if (fruitId < 16) currentNextFruit.next = Math.round(Math.random() * 3.5);
  else currentNextFruit.next = Math.round(Math.random() * 4);
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
let lastClickTime = 0;
const tooFrequent = () => {
  const now = new Date().getTime();
  if (now - lastClickTime < 100) return true;
  lastClickTime = now;
  return false;
};

export const init = () => {
  const canvas = document.getElementsByTagName('canvas')[0];
  canvas.addEventListener('touchmove', (event) => {
    const { changedTouches } = event;
    if (changedTouches.length !== 1) return;
    const left = parseFloat(getComputedStyle(rootElement).marginLeft);
    const { clientX } = changedTouches[0];
    // @ts-ignore
    const newX = (clientX - left) / parseFloat(rootElement.childNodes[0].style.transform.slice(6));
    currentFruitSprite.x = newX;
  });
  canvas.addEventListener('touchend', (event) => {
    if (tooFrequent()) return;
    const { changedTouches } = event;
    if (changedTouches.length !== 1) return;
    const left = parseFloat(getComputedStyle(rootElement).marginLeft);
    const { clientX } = changedTouches[0];
    // @ts-ignore
    const newX = (clientX - left) / parseFloat(rootElement.childNodes[0].style.transform.slice(6));
    currentFruitSprite.x = newX;
    // @ts-ignore
    createFruit(currentNextFruit.current, newX);
  });
  canvas.addEventListener('mousemove', (event) => {
    if ('ontouchend' in window) return;
    const { offsetX } = event;
    currentFruitSprite.x = offsetX;
  });
  canvas.addEventListener('click', (event) => {
    if ('ontouchend' in window) return;
    if (tooFrequent()) return;
    const { offsetX } = event;
    currentFruitSprite.x = offsetX;
    createFruit(currentNextFruit.current, offsetX);
  });
  createWall();
  currentFruitSprite = createSprite(currentNextFruit.current, Width / 2, fruitDefaultY * Ratio);
  nextFruitSprite = createSprite(currentNextFruit.next, Width / 2, 0);
  app.stage.addChild(currentFruitSprite);
  app.stage.addChild(nextFruitSprite);

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
