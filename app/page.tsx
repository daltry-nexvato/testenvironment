"use client";

import { useEffect, useRef, useCallback, useState } from "react";

// ─── Dynamic Constants (set on resize) ───────────────────
let CANVAS_W = 1280;
let CANVAS_H = 720;
let GROUND_Y = 580;
const GRAVITY = 0.6;
const JUMP_FORCE = -14;
const PLAYER_SPEED = 5;
const SCROLL_SPEED = 3.5;
const PORTAL_INTERVAL = 2800;
const OBSTACLE_INTERVAL = 1100;
const COIN_INTERVAL = 850;
const PARTICLE_COUNT = 30;
const POWERUP_INTERVAL = 3500;
const PROJECTILE_SPEED = 9;

type World = "paradise" | "hell";

interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  vx: number;
  onGround: boolean;
  lives: number;
  invincible: number;
  frame: number;
  frameTimer: number;
  hasPowerup: boolean;
  powerupTimer: number;
}

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  world: World;
}

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  world: World;
  frame: number;
  dead: boolean;
}

interface Portal {
  x: number;
  y: number;
  w: number;
  h: number;
  targetWorld: World;
  pulse: number;
}

interface Coin {
  x: number;
  y: number;
  r: number;
  world: World;
  collected: boolean;
  bobOffset: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  twinkle: number;
  speed: number;
}

interface BackgroundElement {
  x: number;
  y: number;
  size: number;
  type: string;
  speed: number;
  bobOffset: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  world: World;
  life: number;
}

interface Powerup {
  x: number;
  y: number;
  w: number;
  h: number;
  world: World;
  collected: boolean;
  bobOffset: number;
}

interface GameState {
  running: boolean;
  started: boolean;
  gameOver: boolean;
  player: Player;
  platforms: Platform[];
  obstacles: Obstacle[];
  portals: Portal[];
  coins: Coin[];
  particles: Particle[];
  bgElements: BackgroundElement[];
  stars: Star[];
  projectiles: Projectile[];
  powerups: Powerup[];
  world: World;
  score: number;
  highScore: number;
  combo: number;
  comboTimer: number;
  camX: number;
  tick: number;
  keys: Record<string, boolean>;
  lastObstacle: number;
  lastPortal: number;
  lastCoin: number;
  lastPlatform: number;
  lastPowerup: number;
  transitionAlpha: number;
  transitionTarget: World | null;
  screenShake: number;
}

// ─── Cat Drawing ─────────────────────────────────────────
function drawCatBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  world: World,
  tick: number,
  onGround: boolean,
  vx: number,
  vy: number,
  hasPowerup: boolean
) {
  ctx.save();
  const cx = x + w / 2;
  const cy = y + h / 2;

  // Running animation frame
  const runFrame = onGround ? tick * 0.2 : 0;
  const legSwing = Math.sin(runFrame) * 0.5;
  const bodyBob = onGround && Math.abs(vx) > 0.5 ? Math.abs(Math.sin(runFrame)) * 3 : 0;

  // Powerup glow
  if (hasPowerup) {
    ctx.save();
    const glowColor = world === "paradise" ? "rgba(255,200,50," : "rgba(255,80,0,";
    const pulseR = 30 + Math.sin(tick * 0.15) * 8;
    const grad = ctx.createRadialGradient(cx, cy - bodyBob, 5, cx, cy - bodyBob, pulseR);
    grad.addColorStop(0, glowColor + "0.4)");
    grad.addColorStop(1, glowColor + "0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy - bodyBob, pulseR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const bodyColor = world === "paradise" ? "#FF9933" : "#555";
  const bellyColor = world === "paradise" ? "#FFD699" : "#888";
  const earInner = world === "paradise" ? "#FF6699" : "#990000";
  const eyeColor = world === "paradise" ? "#333" : "#FF0000";
  const noseColor = world === "paradise" ? "#FF6699" : "#CC0000";

  // Tail
  ctx.save();
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  const tailWag = Math.sin(tick * 0.12) * 0.4;
  ctx.beginPath();
  ctx.moveTo(x + 2, cy - bodyBob);
  ctx.quadraticCurveTo(
    x - 12, cy - 20 - bodyBob + Math.sin(tick * 0.1) * 5,
    x - 8 + Math.sin(tailWag) * 8, cy - 30 - bodyBob
  );
  ctx.stroke();
  ctx.restore();

  // Back legs
  ctx.save();
  ctx.fillStyle = bodyColor;
  // Left back leg
  const backLegAngle1 = onGround ? legSwing : 0.3;
  ctx.save();
  ctx.translate(x + 8, y + h - 5 - bodyBob);
  ctx.rotate(backLegAngle1);
  roundRect(ctx, -4, 0, 8, 14, 3);
  ctx.fill();
  // Paw
  ctx.fillStyle = bellyColor;
  ctx.beginPath();
  ctx.ellipse(0, 14, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Right back leg
  const backLegAngle2 = onGround ? -legSwing : -0.3;
  ctx.save();
  ctx.translate(x + 16, y + h - 5 - bodyBob);
  ctx.rotate(backLegAngle2);
  ctx.fillStyle = bodyColor;
  roundRect(ctx, -4, 0, 8, 14, 3);
  ctx.fill();
  ctx.fillStyle = bellyColor;
  ctx.beginPath();
  ctx.ellipse(0, 14, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();

  // Body
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(cx, cy - bodyBob, w / 2 + 2, h / 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belly
  ctx.fillStyle = bellyColor;
  ctx.beginPath();
  ctx.ellipse(cx + 4, cy + 2 - bodyBob, w / 3, h / 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Front legs
  ctx.save();
  ctx.fillStyle = bodyColor;
  // Left front leg
  const frontLegAngle1 = onGround ? -legSwing : -0.2;
  ctx.save();
  ctx.translate(x + w - 16, y + h - 5 - bodyBob);
  ctx.rotate(frontLegAngle1);
  roundRect(ctx, -4, 0, 8, 14, 3);
  ctx.fill();
  ctx.fillStyle = bellyColor;
  ctx.beginPath();
  ctx.ellipse(0, 14, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Right front leg
  const frontLegAngle2 = onGround ? legSwing : 0.2;
  ctx.save();
  ctx.translate(x + w - 8, y + h - 5 - bodyBob);
  ctx.rotate(frontLegAngle2);
  ctx.fillStyle = bodyColor;
  roundRect(ctx, -4, 0, 8, 14, 3);
  ctx.fill();
  ctx.fillStyle = bellyColor;
  ctx.beginPath();
  ctx.ellipse(0, 14, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();

  // Head
  const headX = x + w - 8;
  const headY = y + 6 - bodyBob;
  const headR = 14;

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(headX, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(headX - 10, headY - 10);
  ctx.lineTo(headX - 14, headY - 24);
  ctx.lineTo(headX - 2, headY - 14);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(headX + 10, headY - 10);
  ctx.lineTo(headX + 14, headY - 24);
  ctx.lineTo(headX + 2, headY - 14);
  ctx.fill();

  // Ear inner
  ctx.fillStyle = earInner;
  ctx.beginPath();
  ctx.moveTo(headX - 9, headY - 12);
  ctx.lineTo(headX - 12, headY - 21);
  ctx.lineTo(headX - 4, headY - 14);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(headX + 9, headY - 12);
  ctx.lineTo(headX + 12, headY - 21);
  ctx.lineTo(headX + 4, headY - 14);
  ctx.fill();

  // Eyes
  if (world === "hell") {
    // Glowing red eyes
    ctx.save();
    ctx.shadowColor = "#FF0000";
    ctx.shadowBlur = 8;
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.ellipse(headX - 5, headY - 2, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headX + 5, headY - 2, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Slit pupils
    ctx.fillStyle = "#000";
    ctx.fillRect(headX - 6, headY - 5, 2, 6);
    ctx.fillRect(headX + 4, headY - 5, 2, 6);
    ctx.restore();
  } else {
    // Cute eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(headX - 5, headY - 2, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headX + 5, headY - 2, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(headX - 4, headY - 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headX + 6, headY - 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Eye shine
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(headX - 3, headY - 3, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headX + 7, headY - 3, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Nose
  ctx.fillStyle = noseColor;
  ctx.beginPath();
  ctx.moveTo(headX, headY + 3);
  ctx.lineTo(headX - 3, headY + 6);
  ctx.lineTo(headX + 3, headY + 6);
  ctx.fill();

  // Mouth
  ctx.strokeStyle = world === "paradise" ? "#CC5577" : "#880000";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(headX, headY + 6);
  ctx.lineTo(headX - 4, headY + 9);
  ctx.moveTo(headX, headY + 6);
  ctx.lineTo(headX + 4, headY + 9);
  ctx.stroke();

  // Whiskers
  ctx.strokeStyle = world === "paradise" ? "#CC8844" : "#666";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(headX - 8, headY + 3);
  ctx.lineTo(headX - 22, headY);
  ctx.moveTo(headX - 8, headY + 5);
  ctx.lineTo(headX - 22, headY + 6);
  ctx.moveTo(headX + 8, headY + 3);
  ctx.lineTo(headX + 22, headY);
  ctx.moveTo(headX + 8, headY + 5);
  ctx.lineTo(headX + 22, headY + 6);
  ctx.stroke();

  // Jump squash/stretch
  if (!onGround && vy < -2) {
    // Stretch indicator - speed lines
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 10 + i * 10, y + h + 5);
      ctx.lineTo(x + 10 + i * 10, y + h + 15);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

// ─── Drawing Helpers ─────────────────────────────────────
function drawParadiseSky(ctx: CanvasRenderingContext2D, offset: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, "#4FC3F7");
  grad.addColorStop(0.4, "#81D4FA");
  grad.addColorStop(0.7, "#B2EBF2");
  grad.addColorStop(1, "#69c96d");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Sun with glow
  ctx.save();
  const sunX = CANVAS_W - 120;
  const sunY = 70;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 80);
  sunGrad.addColorStop(0, "rgba(255,255,200,1)");
  sunGrad.addColorStop(0.3, "rgba(255,223,100,0.8)");
  sunGrad.addColorStop(0.6, "rgba(255,180,50,0.3)");
  sunGrad.addColorStop(1, "rgba(255,180,50,0)");
  ctx.fillStyle = sunGrad;
  ctx.fillRect(sunX - 80, sunY - 80, 160, 160);
  ctx.beginPath();
  ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
  ctx.fillStyle = "#FFF176";
  ctx.fill();
  ctx.restore();

  // Rainbow
  ctx.save();
  ctx.globalAlpha = 0.25;
  const colors = ["#FF0000", "#FF7700", "#FFFF00", "#00FF00", "#0099FF", "#6633FF"];
  for (let i = 0; i < colors.length; i++) {
    ctx.beginPath();
    ctx.arc(CANVAS_W / 2, GROUND_Y * 0.6, CANVAS_W * 0.3 - i * 15, Math.PI, 0);
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 14;
    ctx.stroke();
  }
  ctx.restore();

  // Clouds
  const clouds = [
    { x: ((100 - offset * 0.15) % (CANVAS_W + 200) + CANVAS_W + 200) % (CANVAS_W + 200) - 100, y: 50, s: 1 },
    { x: ((350 - offset * 0.1) % (CANVAS_W + 200) + CANVAS_W + 200) % (CANVAS_W + 200) - 100, y: 30, s: 0.8 },
    { x: ((600 - offset * 0.12) % (CANVAS_W + 200) + CANVAS_W + 200) % (CANVAS_W + 200) - 100, y: 70, s: 0.9 },
    { x: ((900 - offset * 0.08) % (CANVAS_W + 200) + CANVAS_W + 200) % (CANVAS_W + 200) - 100, y: 45, s: 1.1 },
  ];
  clouds.forEach((c) => {
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(c.x, c.y, 30 * c.s, 0, Math.PI * 2);
    ctx.arc(c.x + 25 * c.s, c.y - 10 * c.s, 25 * c.s, 0, Math.PI * 2);
    ctx.arc(c.x + 50 * c.s, c.y, 28 * c.s, 0, Math.PI * 2);
    ctx.arc(c.x + 20 * c.s, c.y + 5 * c.s, 22 * c.s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawHellSky(ctx: CanvasRenderingContext2D, offset: number, tick: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, "#1a0000");
  grad.addColorStop(0.3, "#330000");
  grad.addColorStop(0.6, "#4d0000");
  grad.addColorStop(1, "#8B0000");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Evil moon
  ctx.save();
  const moonX = CANVAS_W - 120;
  const moonY = 70;
  const moonGrad = ctx.createRadialGradient(moonX, moonY, 5, moonX, moonY, 60);
  moonGrad.addColorStop(0, "rgba(255,50,50,1)");
  moonGrad.addColorStop(0.4, "rgba(200,0,0,0.6)");
  moonGrad.addColorStop(1, "rgba(100,0,0,0)");
  ctx.fillStyle = moonGrad;
  ctx.fillRect(moonX - 60, moonY - 60, 120, 120);
  ctx.beginPath();
  ctx.arc(moonX, moonY, 25, 0, Math.PI * 2);
  ctx.fillStyle = "#FF3333";
  ctx.fill();
  ctx.restore();

  // Smoke/ash clouds
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 280 - offset * 0.08 + tick * 0.2) % (CANVAS_W + 200) + CANVAS_W + 200) % (CANVAS_W + 200) - 100;
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "#330000";
    ctx.beginPath();
    ctx.arc(cx, 80 + i * 15, 40, 0, Math.PI * 2);
    ctx.arc(cx + 30, 70 + i * 15, 35, 0, Math.PI * 2);
    ctx.arc(cx + 55, 85 + i * 15, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Lightning flash
  if (tick % 300 < 5) {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#FF6666";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();
  }
}

function drawParadiseGround(ctx: CanvasRenderingContext2D, offset: number, tick: number) {
  ctx.save();
  ctx.fillStyle = "#5cb85c";
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y - 40);
  for (let x = 0; x <= CANVAS_W; x += 5) {
    ctx.lineTo(x, GROUND_Y - 40 + Math.sin((x + offset * 0.3) * 0.01) * 25);
  }
  ctx.lineTo(CANVAS_W, CANVAS_H);
  ctx.lineTo(0, CANVAS_H);
  ctx.fill();
  ctx.restore();

  const gGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
  gGrad.addColorStop(0, "#4CAF50");
  gGrad.addColorStop(0.3, "#388E3C");
  gGrad.addColorStop(1, "#2E7D32");
  ctx.fillStyle = gGrad;
  ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

  ctx.strokeStyle = "#66BB6A";
  ctx.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    const gx = ((i * 35 - offset * 0.5) % CANVAS_W + CANVAS_W) % CANVAS_W;
    const sway = Math.sin(tick * 0.05 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(gx, GROUND_Y);
    ctx.lineTo(gx + sway - 3, GROUND_Y - 12);
    ctx.moveTo(gx, GROUND_Y);
    ctx.lineTo(gx + sway + 3, GROUND_Y - 10);
    ctx.stroke();
  }

  const flowerEmojis = ["🌸", "🌺", "🌻", "🌷"];
  ctx.font = "16px serif";
  for (let i = 0; i < 16; i++) {
    const fx = ((i * 80 - offset * 0.4) % CANVAS_W + CANVAS_W) % CANVAS_W;
    const bob = Math.sin(tick * 0.03 + i * 2) * 3;
    ctx.fillText(flowerEmojis[i % 4], fx, GROUND_Y - 2 + bob);
  }
}

function drawHellGround(ctx: CanvasRenderingContext2D, offset: number, tick: number) {
  ctx.save();
  const lavaGrad = ctx.createLinearGradient(0, GROUND_Y - 20, 0, CANVAS_H);
  lavaGrad.addColorStop(0, "#4d0000");
  lavaGrad.addColorStop(0.3, "#8B0000");
  lavaGrad.addColorStop(0.6, "#CC3300");
  lavaGrad.addColorStop(1, "#FF4500");
  ctx.fillStyle = lavaGrad;
  ctx.fillRect(0, GROUND_Y - 20, CANVAS_W, CANVAS_H - GROUND_Y + 20);
  ctx.restore();

  for (let i = 0; i < 10; i++) {
    const bx = ((i * 130 - offset * 0.2 + tick * 0.5) % CANVAS_W + CANVAS_W) % CANVAS_W;
    const by = GROUND_Y + 30 + Math.sin(tick * 0.08 + i * 3) * 15;
    const br = 4 + Math.sin(tick * 0.1 + i) * 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fillStyle = "#FF6600";
    ctx.shadowColor = "#FF6600";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
  }

  ctx.strokeStyle = "#FF8C00";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#FF4500";
  ctx.shadowBlur = 8;
  for (let i = 0; i < 12; i++) {
    const cx = ((i * 100 - offset * 0.3) % CANVAS_W + CANVAS_W) % CANVAS_W;
    ctx.beginPath();
    ctx.moveTo(cx, GROUND_Y + 10);
    ctx.lineTo(cx + 15, GROUND_Y + 25);
    ctx.lineTo(cx + 5, GROUND_Y + 45);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  ctx.font = "20px serif";
  for (let i = 0; i < 7; i++) {
    const sx = ((i * 190 - offset * 0.35) % CANVAS_W + CANVAS_W) % CANVAS_W;
    ctx.fillText("💀", sx, GROUND_Y - 5);
  }
}

function drawBackgroundElements(
  ctx: CanvasRenderingContext2D,
  elements: BackgroundElement[],
  offset: number,
  tick: number
) {
  elements.forEach((el) => {
    const screenX = ((el.x - offset * el.speed) % (CANVAS_W + 200) + CANVAS_W + 200) % (CANVAS_W + 200) - 100;
    const bob = Math.sin(tick * 0.02 + el.bobOffset) * 5;
    ctx.font = `${el.size}px serif`;
    ctx.fillText(el.type, screenX, el.y + bob);
  });
}

function drawPlatform(ctx: CanvasRenderingContext2D, p: Platform, camX: number) {
  const sx = p.x - camX;
  if (sx > CANVAS_W + 50 || sx + p.w < -50) return;

  if (p.world === "paradise") {
    const pGrad = ctx.createLinearGradient(sx, p.y, sx, p.y + p.h);
    pGrad.addColorStop(0, "#66BB6A");
    pGrad.addColorStop(1, "#388E3C");
    ctx.fillStyle = pGrad;
    roundRect(ctx, sx, p.y, p.w, p.h, 6);
    ctx.fill();
    ctx.fillStyle = "#81C784";
    ctx.fillRect(sx + 2, p.y, p.w - 4, 4);
    ctx.font = "12px serif";
    for (let i = 0; i < p.w / 30; i++) {
      ctx.fillText("🌼", sx + 5 + i * 28, p.y - 2);
    }
  } else {
    const pGrad = ctx.createLinearGradient(sx, p.y, sx, p.y + p.h);
    pGrad.addColorStop(0, "#5D0000");
    pGrad.addColorStop(1, "#3D0000");
    ctx.fillStyle = pGrad;
    roundRect(ctx, sx, p.y, p.w, p.h, 6);
    ctx.fill();
    ctx.fillStyle = "#CC3300";
    for (let i = 0; i < p.w / 20; i++) {
      const dx = sx + 8 + i * 18;
      ctx.beginPath();
      ctx.arc(dx, p.y + p.h, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle, camX: number, tick: number) {
  if (o.dead) return;
  const sx = o.x - camX;
  if (sx > CANVAS_W + 50 || sx + o.w < -50) return;

  ctx.save();
  if (o.world === "paradise") {
    if (o.type === "rock") {
      ctx.font = `${o.h}px serif`;
      ctx.fillText("🪨", sx, o.y + o.h - 5);
    } else if (o.type === "bee") {
      const bob = Math.sin(tick * 0.15 + o.frame) * 10;
      ctx.font = `${o.h}px serif`;
      ctx.fillText("🐝", sx, o.y + bob);
    } else {
      ctx.font = `${o.h}px serif`;
      ctx.fillText("🌵", sx, o.y + o.h - 5);
    }
  } else {
    if (o.type === "fireball") {
      const bob = Math.sin(tick * 0.12 + o.frame) * 12;
      ctx.font = `${o.h}px serif`;
      ctx.shadowColor = "#FF4500";
      ctx.shadowBlur = 15;
      ctx.fillText("☄️", sx, o.y + bob);
    } else if (o.type === "demon") {
      const shake = Math.sin(tick * 0.2) * 3;
      ctx.font = `${o.h}px serif`;
      ctx.fillText("👹", sx + shake, o.y + o.h - 5);
    } else {
      ctx.font = `${o.h}px serif`;
      ctx.shadowColor = "#FF4500";
      ctx.shadowBlur = 12;
      ctx.fillText("🔥", sx, o.y + o.h - 5);
    }
  }
  ctx.restore();
}

function drawPortal(ctx: CanvasRenderingContext2D, p: Portal, camX: number, tick: number) {
  const sx = p.x - camX;
  if (sx > CANVAS_W + 60 || sx + p.w < -60) return;

  const pulse = Math.sin(tick * 0.08 + p.pulse) * 5;
  const cx = sx + p.w / 2;
  const cy = p.y + p.h / 2;
  const r = p.w / 2 + pulse;

  ctx.save();
  const glowColor = p.targetWorld === "hell" ? "rgba(255,0,0," : "rgba(100,255,100,";
  const innerColor = p.targetWorld === "hell" ? "#FF1A1A" : "#44FF44";
  const midColor = p.targetWorld === "hell" ? "#660000" : "#006600";

  for (let i = 3; i >= 0; i--) {
    ctx.beginPath();
    ctx.arc(cx, cy, r + i * 8, 0, Math.PI * 2);
    ctx.fillStyle = glowColor + (0.1 - i * 0.02) + ")";
    ctx.fill();
  }

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, innerColor);
  grad.addColorStop(0.5, midColor);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 4; i++) {
    const angle = tick * 0.05 + (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 5, angle, angle + 0.8);
    ctx.strokeStyle = innerColor;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.font = "bold 14px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(p.targetWorld === "hell" ? "⚡ HELL ⚡" : "✨ PARADISE ✨", cx, p.y - 15);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawCoin(ctx: CanvasRenderingContext2D, c: Coin, camX: number, tick: number) {
  if (c.collected) return;
  const sx = c.x - camX;
  if (sx > CANVAS_W + 20 || sx < -20) return;

  const bob = Math.sin(tick * 0.06 + c.bobOffset) * 5;
  const sparkle = Math.sin(tick * 0.1 + c.bobOffset) * 0.3 + 0.7;

  ctx.save();
  ctx.globalAlpha = sparkle;
  ctx.font = "24px serif";
  ctx.fillText(c.world === "paradise" ? "⭐" : "💎", sx - 12, c.y + bob + 8);
  ctx.restore();
}

function drawPowerup(ctx: CanvasRenderingContext2D, pu: Powerup, camX: number, tick: number) {
  if (pu.collected) return;
  const sx = pu.x - camX;
  if (sx > CANVAS_W + 30 || sx < -30) return;

  const bob = Math.sin(tick * 0.08 + pu.bobOffset) * 6;
  const pulse = Math.sin(tick * 0.12) * 0.2 + 0.8;

  ctx.save();
  ctx.globalAlpha = pulse;

  // Glow
  const glowColor = pu.world === "paradise" ? "rgba(255,200,50,0.4)" : "rgba(255,80,0,0.4)";
  ctx.shadowColor = pu.world === "paradise" ? "#FFD700" : "#FF4500";
  ctx.shadowBlur = 15;

  // Box
  const bx = sx;
  const by = pu.y + bob;
  const grad = ctx.createLinearGradient(bx, by, bx, by + pu.h);
  if (pu.world === "paradise") {
    grad.addColorStop(0, "#FFD700");
    grad.addColorStop(1, "#FF8C00");
  } else {
    grad.addColorStop(0, "#FF4500");
    grad.addColorStop(1, "#CC0000");
  }
  ctx.fillStyle = grad;
  roundRect(ctx, bx, by, pu.w, pu.h, 8);
  ctx.fill();

  // Icon
  ctx.shadowBlur = 0;
  ctx.font = "20px serif";
  ctx.fillText(pu.world === "paradise" ? "🌈" : "🔥", bx + 4, by + 24);

  ctx.restore();
}

function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile, camX: number, tick: number) {
  const sx = proj.x - camX;
  if (sx > CANVAS_W + 30 || sx < -30) return;

  ctx.save();
  if (proj.world === "paradise") {
    // Rainbow projectile
    const colors = ["#FF0000", "#FF7700", "#FFFF00", "#00FF00", "#0099FF", "#6633FF"];
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(sx - i * 4, proj.y + Math.sin(tick * 0.3 + i) * 2, 5 - i * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = colors[i];
      ctx.globalAlpha = 1 - i * 0.12;
      ctx.fill();
    }
    // Sparkle head
    ctx.globalAlpha = 1;
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(sx, proj.y, 6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Fireball projectile
    ctx.shadowColor = "#FF4500";
    ctx.shadowBlur = 15;
    // Core
    const fbGrad = ctx.createRadialGradient(sx, proj.y, 0, sx, proj.y, 10);
    fbGrad.addColorStop(0, "#FFFF00");
    fbGrad.addColorStop(0.4, "#FF6600");
    fbGrad.addColorStop(1, "#CC0000");
    ctx.fillStyle = fbGrad;
    ctx.beginPath();
    ctx.arc(sx, proj.y, 8, 0, Math.PI * 2);
    ctx.fill();
    // Trail
    for (let i = 1; i <= 5; i++) {
      ctx.globalAlpha = 0.6 - i * 0.1;
      ctx.beginPath();
      ctx.arc(sx - i * 6, proj.y + Math.sin(tick * 0.4 + i) * 2, 6 - i, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? "#FF4500" : "#FF6600";
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, world: World, tick: number) {
  ctx.save();

  if (p.invincible > 0 && Math.floor(tick / 4) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  // Shadow
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.ellipse(p.x + p.w / 2, GROUND_Y + 2, p.w / 2, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();

  drawCatBody(ctx, p.x, p.y, p.w, p.h, world, tick, p.onGround, p.vx, p.vy, p.hasPowerup);

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  g: GameState
) {
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = g.world === "paradise" ? "#1B5E20" : "#4D0000";
  roundRect(ctx, 10, 10, 220, 90, 10);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.font = "bold 22px Arial";
  ctx.fillStyle = "#FFD700";
  ctx.fillText(`Score: ${g.score}`, 25, 38);

  ctx.font = "16px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText(`Best: ${g.highScore}`, 25, 60);

  // Lives
  ctx.font = "22px serif";
  for (let i = 0; i < g.player.lives; i++) {
    ctx.fillText("❤️", 25 + i * 28, 86);
  }

  // Powerup indicator
  if (g.player.hasPowerup) {
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = g.world === "paradise" ? "#1B5E20" : "#4D0000";
    roundRect(ctx, 240, 10, 160, 35, 8);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "#FFD700";
    const barW = 100;
    const remaining = g.player.powerupTimer / 300;
    ctx.fillText(g.world === "paradise" ? "🌈 RAINBOW" : "🔥 FIREBALL", 250, 30);
    ctx.fillStyle = "#333";
    roundRect(ctx, 250, 36, barW, 5, 2);
    ctx.fill();
    ctx.fillStyle = g.world === "paradise" ? "#FFD700" : "#FF4500";
    roundRect(ctx, 250, 36, barW * remaining, 5, 2);
    ctx.fill();
  }

  // Combo
  if (g.combo > 1) {
    ctx.font = "bold 20px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`x${g.combo} COMBO!`, CANVAS_W - 160, 35);
  }

  // World indicator
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = g.world === "paradise" ? "#1B5E20" : "#4D0000";
  roundRect(ctx, CANVAS_W / 2 - 70, 10, 140, 32, 8);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.font = "bold 16px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(g.world === "paradise" ? "🌈 PARADISE" : "🔥 HELL", CANVAS_W / 2, 32);
  ctx.textAlign = "left";

  // Shoot hint
  ctx.font = "12px Arial";
  ctx.fillStyle = "#aaa";
  ctx.fillText("F or E to shoot", 10, CANVAS_H - 10);

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Main Component ──────────────────────────────────────
export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState | null>(null);
  const [dims, setDims] = useState({ w: 1280, h: 720 });

  const initGame = useCallback(() => {
    const hs = typeof window !== "undefined"
      ? parseInt(localStorage.getItem("catrunner-hs") || "0", 10)
      : 0;

    gameRef.current = {
      running: true,
      started: false,
      gameOver: false,
      player: {
        x: 150,
        y: GROUND_Y - 50,
        w: 45,
        h: 50,
        vy: 0,
        vx: 0,
        onGround: true,
        lives: 3,
        invincible: 0,
        frame: 0,
        frameTimer: 0,
        hasPowerup: false,
        powerupTimer: 0,
      },
      platforms: [],
      obstacles: [],
      portals: [],
      coins: [],
      particles: [],
      bgElements: [],
      stars: [],
      projectiles: [],
      powerups: [],
      world: "paradise",
      score: 0,
      highScore: hs,
      combo: 0,
      comboTimer: 0,
      camX: 0,
      tick: 0,
      keys: {},
      lastObstacle: 0,
      lastPortal: 0,
      lastCoin: 0,
      lastPlatform: 0,
      lastPowerup: 0,
      transitionAlpha: 0,
      transitionTarget: null,
      screenShake: 0,
    };

    generateBgElements(gameRef.current.bgElements, "paradise");
    generateStars(gameRef.current.stars);
    generateInitialPlatforms(gameRef.current.platforms, "paradise");
  }, []);

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      CANVAS_W = w;
      CANVAS_H = h;
      GROUND_Y = Math.floor(h * 0.8);
      setDims({ w, h });
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    initGame();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let shootCooldown = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameRef.current) return;
      gameRef.current.keys[e.key] = true;

      if (!gameRef.current.started && !gameRef.current.gameOver) {
        gameRef.current.started = true;
      }
      if (gameRef.current.gameOver && e.key === " ") {
        initGame();
        if (gameRef.current) gameRef.current.started = true;
      }
      if (
        (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") &&
        gameRef.current.player.onGround
      ) {
        gameRef.current.player.vy = JUMP_FORCE;
        gameRef.current.player.onGround = false;
      }
      // Shoot
      if ((e.key === "f" || e.key === "F" || e.key === "e" || e.key === "E") && shootCooldown <= 0) {
        const g = gameRef.current;
        if (g.started && !g.gameOver && g.player.hasPowerup) {
          g.projectiles.push({
            x: g.player.x + g.player.w,
            y: g.player.y + g.player.h / 2,
            vx: PROJECTILE_SPEED,
            vy: 0,
            world: g.world,
            life: 80,
          });
          spawnParticles(
            g.particles,
            g.player.x + g.player.w,
            g.player.y + g.player.h / 2,
            g.world === "paradise" ? "#FFD700" : "#FF4500",
            6
          );
          shootCooldown = 12;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!gameRef.current) return;
      gameRef.current.keys[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let animId: number;

    function gameLoop() {
      const g = gameRef.current;
      if (!g || !ctx) return;

      g.tick++;
      if (shootCooldown > 0) shootCooldown--;

      if (g.started && !g.gameOver) {
        update(g);
      }

      draw(ctx, g);

      animId = requestAnimationFrame(gameLoop);
    }

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [initGame]);

  return (
    <canvas
      ref={canvasRef}
      width={dims.w}
      height={dims.h}
      className="block"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}

// ─── Generation ──────────────────────────────────────────
function generateBgElements(arr: BackgroundElement[], world: World) {
  arr.length = 0;
  if (world === "paradise") {
    const types = ["🌳", "🌲", "🌴", "🏠", "⛪"];
    for (let i = 0; i < 20; i++) {
      arr.push({
        x: Math.random() * CANVAS_W * 3,
        y: GROUND_Y - 60 - Math.random() * 30,
        size: 35 + Math.random() * 25,
        type: types[Math.floor(Math.random() * types.length)],
        speed: 0.2 + Math.random() * 0.3,
        bobOffset: Math.random() * Math.PI * 2,
      });
    }
  } else {
    const types = ["🏚️", "🪦", "⚰️", "🦇"];
    for (let i = 0; i < 16; i++) {
      arr.push({
        x: Math.random() * CANVAS_W * 3,
        y: GROUND_Y - 55 - Math.random() * 30,
        size: 30 + Math.random() * 25,
        type: types[Math.floor(Math.random() * types.length)],
        speed: 0.2 + Math.random() * 0.3,
        bobOffset: Math.random() * Math.PI * 2,
      });
    }
  }
}

function generateStars(arr: Star[]) {
  arr.length = 0;
  for (let i = 0; i < 80; i++) {
    arr.push({
      x: Math.random() * CANVAS_W,
      y: Math.random() * (GROUND_Y - 50),
      size: 1 + Math.random() * 2,
      twinkle: Math.random() * Math.PI * 2,
      speed: 0.02 + Math.random() * 0.03,
    });
  }
}

function generateInitialPlatforms(arr: Platform[], world: World) {
  const heights = [GROUND_Y - 100, GROUND_Y - 150, GROUND_Y - 200];
  for (let i = 0; i < 6; i++) {
    arr.push({
      x: 500 + i * 380,
      y: heights[Math.floor(Math.random() * heights.length)],
      w: 90 + Math.random() * 70,
      h: 18,
      world,
    });
  }
}

function spawnObstacle(g: GameState) {
  const spawnX = g.camX + CANVAS_W + 50;
  const types = g.world === "paradise" ? ["rock", "bee", "cactus"] : ["fireball", "demon", "fire"];
  const type = types[Math.floor(Math.random() * types.length)];
  const isFlying = type === "bee" || type === "fireball";

  g.obstacles.push({
    x: spawnX,
    y: isFlying ? GROUND_Y - 90 - Math.random() * 60 : GROUND_Y - 42,
    w: 38,
    h: 40,
    type,
    world: g.world,
    frame: Math.random() * Math.PI * 2,
    dead: false,
  });
}

function spawnPortal(g: GameState) {
  const spawnX = g.camX + CANVAS_W + 80;
  g.portals.push({
    x: spawnX,
    y: GROUND_Y - 95,
    w: 65,
    h: 85,
    targetWorld: g.world === "paradise" ? "hell" : "paradise",
    pulse: Math.random() * Math.PI * 2,
  });
}

function spawnCoin(g: GameState) {
  const spawnX = g.camX + CANVAS_W + 30;
  const isHigh = Math.random() > 0.5;
  g.coins.push({
    x: spawnX,
    y: isHigh ? GROUND_Y - 110 - Math.random() * 50 : GROUND_Y - 35,
    r: 14,
    world: g.world,
    collected: false,
    bobOffset: Math.random() * Math.PI * 2,
  });
}

function spawnPlatform(g: GameState) {
  const spawnX = g.camX + CANVAS_W + 100;
  const heights = [GROUND_Y - 100, GROUND_Y - 150, GROUND_Y - 200];
  g.platforms.push({
    x: spawnX,
    y: heights[Math.floor(Math.random() * heights.length)],
    w: 90 + Math.random() * 70,
    h: 18,
    world: g.world,
  });
}

function spawnPowerup(g: GameState) {
  const spawnX = g.camX + CANVAS_W + 60;
  g.powerups.push({
    x: spawnX,
    y: GROUND_Y - 60 - Math.random() * 80,
    w: 30,
    h: 30,
    world: g.world,
    collected: false,
    bobOffset: Math.random() * Math.PI * 2,
  });
}

function spawnParticles(
  particles: Particle[],
  x: number,
  y: number,
  color: string,
  count: number
) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6 - 2,
      life: 30 + Math.random() * 20,
      maxLife: 50,
      color,
      size: 2 + Math.random() * 4,
    });
  }
}

// ─── Update ──────────────────────────────────────────────
function update(g: GameState) {
  const p = g.player;

  p.vx = 0;
  if (g.keys["ArrowRight"] || g.keys["d"] || g.keys["D"]) p.vx = PLAYER_SPEED;
  if (g.keys["ArrowLeft"] || g.keys["a"] || g.keys["A"]) p.vx = -PLAYER_SPEED;

  g.camX += SCROLL_SPEED;
  p.x += SCROLL_SPEED + p.vx;

  if (p.x < g.camX + 20) p.x = g.camX + 20;
  if (p.x + p.w > g.camX + CANVAS_W - 20) p.x = g.camX + CANVAS_W - 20 - p.w;

  p.vy += GRAVITY;
  p.y += p.vy;

  if (p.y + p.h >= GROUND_Y) {
    p.y = GROUND_Y - p.h;
    p.vy = 0;
    p.onGround = true;
  }

  p.onGround = p.y + p.h >= GROUND_Y;
  g.platforms.forEach((plat) => {
    if (
      p.vy >= 0 &&
      p.x + p.w > plat.x &&
      p.x < plat.x + plat.w &&
      p.y + p.h >= plat.y &&
      p.y + p.h <= plat.y + plat.h + 10
    ) {
      p.y = plat.y - p.h;
      p.vy = 0;
      p.onGround = true;
    }
  });

  if (p.invincible > 0) p.invincible--;

  // Powerup timer
  if (p.hasPowerup) {
    p.powerupTimer--;
    if (p.powerupTimer <= 0) {
      p.hasPowerup = false;
    }
  }

  if (g.comboTimer > 0) {
    g.comboTimer--;
    if (g.comboTimer <= 0) g.combo = 0;
  }

  if (g.tick % 10 === 0) g.score++;

  // Spawning
  if (g.camX - g.lastObstacle > OBSTACLE_INTERVAL) {
    spawnObstacle(g);
    g.lastObstacle = g.camX;
  }

  if (g.camX - g.lastPortal > PORTAL_INTERVAL) {
    spawnPortal(g);
    g.lastPortal = g.camX;
  }

  if (g.camX - g.lastCoin > COIN_INTERVAL) {
    spawnCoin(g);
    g.lastCoin = g.camX;
    if (Math.random() > 0.6) {
      for (let i = 1; i <= 4; i++) {
        g.coins.push({
          x: g.camX + CANVAS_W + 30 + i * 40,
          y: GROUND_Y - 35,
          r: 14,
          world: g.world,
          collected: false,
          bobOffset: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  if (g.camX - g.lastPlatform > 420) {
    spawnPlatform(g);
    g.lastPlatform = g.camX;
  }

  if (g.camX - g.lastPowerup > POWERUP_INTERVAL) {
    spawnPowerup(g);
    g.lastPowerup = g.camX;
  }

  // Projectile updates
  g.projectiles = g.projectiles.filter((proj) => {
    proj.x += proj.vx;
    proj.y += proj.vy;
    proj.life--;

    // Hit obstacles
    g.obstacles.forEach((o) => {
      if (o.dead) return;
      if (
        proj.x > o.x - 10 &&
        proj.x < o.x + o.w + 10 &&
        proj.y > o.y - 10 &&
        proj.y < o.y + o.h + 10
      ) {
        o.dead = true;
        proj.life = 0;
        g.score += 25;
        g.screenShake = 8;
        spawnParticles(
          g.particles,
          o.x + o.w / 2,
          o.y + o.h / 2,
          proj.world === "paradise" ? "#FFD700" : "#FF4500",
          15
        );
      }
    });

    return proj.life > 0;
  });

  // Obstacle collision
  g.obstacles.forEach((o) => {
    if (o.dead) return;
    const oy = o.type === "bee" ? o.y + Math.sin(g.tick * 0.15 + o.frame) * 10 - o.h / 2 :
               o.type === "fireball" ? o.y + Math.sin(g.tick * 0.12 + o.frame) * 12 - o.h / 2 :
               o.y;
    if (
      p.invincible <= 0 &&
      p.x + p.w - 8 > o.x &&
      p.x + 8 < o.x + o.w &&
      p.y + p.h - 5 > oy &&
      p.y + 5 < oy + o.h
    ) {
      p.lives--;
      p.invincible = 90;
      g.combo = 0;
      g.screenShake = 15;
      spawnParticles(g.particles, p.x + p.w / 2, p.y + p.h / 2, "#FF0000", 15);

      if (p.lives <= 0) {
        g.gameOver = true;
        if (g.score > g.highScore) {
          g.highScore = g.score;
          localStorage.setItem("catrunner-hs", String(g.score));
        }
      }
    }
  });

  // Coin collection
  g.coins.forEach((c) => {
    if (c.collected) return;
    const bob = Math.sin(g.tick * 0.06 + c.bobOffset) * 5;
    if (
      p.x + p.w > c.x - c.r &&
      p.x < c.x + c.r &&
      p.y + p.h > c.y + bob - c.r &&
      p.y < c.y + bob + c.r
    ) {
      c.collected = true;
      g.combo++;
      g.comboTimer = 120;
      g.score += 10 * g.combo;
      spawnParticles(g.particles, c.x, c.y, c.world === "paradise" ? "#FFD700" : "#00FFFF", 8);
    }
  });

  // Powerup collection
  g.powerups.forEach((pu) => {
    if (pu.collected) return;
    const bob = Math.sin(g.tick * 0.08 + pu.bobOffset) * 6;
    if (
      p.x + p.w > pu.x &&
      p.x < pu.x + pu.w &&
      p.y + p.h > pu.y + bob &&
      p.y < pu.y + bob + pu.h
    ) {
      pu.collected = true;
      p.hasPowerup = true;
      p.powerupTimer = 300; // ~5 seconds
      g.screenShake = 10;
      spawnParticles(
        g.particles,
        pu.x + pu.w / 2,
        pu.y + pu.h / 2,
        pu.world === "paradise" ? "#FFD700" : "#FF4500",
        20
      );
    }
  });

  // Portal collision
  g.portals.forEach((portal) => {
    if (
      p.x + p.w > portal.x &&
      p.x < portal.x + portal.w &&
      p.y + p.h > portal.y &&
      p.y < portal.y + portal.h
    ) {
      if (!g.transitionTarget) {
        g.transitionTarget = portal.targetWorld;
        spawnParticles(
          g.particles,
          p.x + p.w / 2,
          p.y + p.h / 2,
          portal.targetWorld === "hell" ? "#FF4400" : "#44FF44",
          PARTICLE_COUNT
        );
        g.screenShake = 20;
      }
    }
  });

  // World transition
  if (g.transitionTarget) {
    g.transitionAlpha += 0.04;
    if (g.transitionAlpha >= 1) {
      g.world = g.transitionTarget;
      g.transitionTarget = null;
      g.transitionAlpha = 0;
      generateBgElements(g.bgElements, g.world);
      g.platforms.forEach((pl) => (pl.world = g.world));
    }
  }

  // Update particles
  g.particles = g.particles.filter((part) => {
    part.x += part.vx;
    part.y += part.vy;
    part.vy += 0.1;
    part.life--;
    return part.life > 0;
  });

  if (g.screenShake > 0) g.screenShake--;

  // Cleanup
  const cleanX = g.camX - 200;
  g.obstacles = g.obstacles.filter((o) => o.x > cleanX && !o.dead);
  g.portals = g.portals.filter((p) => p.x > cleanX);
  g.coins = g.coins.filter((c) => c.x > cleanX && !c.collected);
  g.platforms = g.platforms.filter((p) => p.x + p.w > cleanX);
  g.powerups = g.powerups.filter((pu) => pu.x > cleanX && !pu.collected);
}

// ─── Draw ────────────────────────────────────────────────
function draw(ctx: CanvasRenderingContext2D, g: GameState) {
  ctx.save();

  if (g.screenShake > 0) {
    const shakeX = (Math.random() - 0.5) * g.screenShake;
    const shakeY = (Math.random() - 0.5) * g.screenShake;
    ctx.translate(shakeX, shakeY);
  }

  // Sky
  if (g.world === "paradise") {
    drawParadiseSky(ctx, g.camX);
  } else {
    drawHellSky(ctx, g.camX, g.tick);
    g.stars.forEach((s) => {
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.sin(g.tick * s.speed + s.twinkle) * 0.3;
      ctx.fillStyle = "#FF6666";
      ctx.fillRect(s.x, s.y, s.size, s.size);
      ctx.restore();
    });
  }

  drawBackgroundElements(ctx, g.bgElements, g.camX, g.tick);

  if (g.world === "paradise") {
    drawParadiseGround(ctx, g.camX, g.tick);
  } else {
    drawHellGround(ctx, g.camX, g.tick);
  }

  g.platforms.forEach((p) => drawPlatform(ctx, p, g.camX));
  g.coins.forEach((c) => drawCoin(ctx, c, g.camX, g.tick));
  g.powerups.forEach((pu) => drawPowerup(ctx, pu, g.camX, g.tick));
  g.portals.forEach((p) => drawPortal(ctx, p, g.camX, g.tick));
  g.obstacles.forEach((o) => drawObstacle(ctx, o, g.camX, g.tick));
  g.projectiles.forEach((proj) => drawProjectile(ctx, proj, g.camX, g.tick));

  // Player
  const screenPlayerX = g.player.x - g.camX;
  drawPlayer(ctx, { ...g.player, x: screenPlayerX }, g.world, g.tick);

  drawParticles(ctx, g.particles);

  // Transition overlay
  if (g.transitionAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = g.transitionAlpha;
    ctx.fillStyle = g.transitionTarget === "hell" ? "#1a0000" : "#fff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.font = "50px serif";
    const emoji = g.transitionTarget === "hell" ? "🔥" : "✨";
    for (let i = 0; i < 12; i++) {
      ctx.fillText(emoji, Math.random() * CANVAS_W, Math.random() * CANVAS_H);
    }
    ctx.restore();
  }

  drawHUD(ctx, g);

  // Start screen
  if (!g.started && !g.gameOver) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = "center";

    ctx.font = "bold 56px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "#FF6600";
    ctx.shadowBlur = 25;
    ctx.fillText("🐱 CAT RUNNER 🐱", CANVAS_W / 2, CANVAS_H * 0.3);
    ctx.shadowBlur = 0;

    ctx.font = "24px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText("Run through Paradise & Hell!", CANVAS_W / 2, CANVAS_H * 0.38);

    ctx.font = "28px Arial";
    ctx.fillStyle = "#FFD700";
    const pulse = Math.sin(g.tick * 0.05) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillText("Press any key to start", CANVAS_W / 2, CANVAS_H * 0.5);
    ctx.globalAlpha = 1;

    ctx.font = "18px Arial";
    ctx.fillStyle = "#aaa";
    ctx.fillText("← → or A D to move  |  SPACE or ↑ to jump", CANVAS_W / 2, CANVAS_H * 0.6);
    ctx.fillText("F or E to shoot  |  Collect powerups 🌈🔥 to fire!", CANVAS_W / 2, CANVAS_H * 0.65);
    ctx.fillText("Collect ⭐ 💎  |  Dodge obstacles  |  Enter portals!", CANVAS_W / 2, CANVAS_H * 0.7);

    ctx.textAlign = "left";
    ctx.restore();
  }

  // Game over
  if (g.gameOver) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = "center";

    ctx.font = "bold 60px Arial";
    ctx.fillStyle = "#FF3333";
    ctx.shadowColor = "#FF0000";
    ctx.shadowBlur = 25;
    ctx.fillText("GAME OVER", CANVAS_W / 2, CANVAS_H * 0.3);
    ctx.shadowBlur = 0;

    ctx.font = "32px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`Score: ${g.score}`, CANVAS_W / 2, CANVAS_H * 0.4);

    ctx.font = "24px Arial";
    ctx.fillStyle = "#aaa";
    ctx.fillText(`Best: ${g.highScore}`, CANVAS_W / 2, CANVAS_H * 0.47);

    if (g.score >= g.highScore && g.score > 0) {
      ctx.font = "bold 22px Arial";
      ctx.fillStyle = "#FFD700";
      const np = Math.sin(g.tick * 0.08) * 0.3 + 0.7;
      ctx.globalAlpha = np;
      ctx.fillText("🏆 NEW HIGH SCORE! 🏆", CANVAS_W / 2, CANVAS_H * 0.54);
      ctx.globalAlpha = 1;
    }

    ctx.font = "26px Arial";
    ctx.fillStyle = "#fff";
    const pulse = Math.sin(g.tick * 0.05) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillText("Press SPACE to restart", CANVAS_W / 2, CANVAS_H * 0.64);

    ctx.textAlign = "left";
    ctx.restore();
  }

  ctx.restore();
}
