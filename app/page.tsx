"use client";

import { useEffect, useRef, useCallback, useState } from "react";

// ─── Dynamic Canvas ──────────────────────────────────────
let CW = 1280;
let CH = 720;
let GY = 580;
const GRAVITY = 0.65;
const JUMP_FORCE = -14.5;
const PLAYER_SPEED = 5.5;
const PARTICLE_COUNT = 30;
const PROJECTILE_SPEED = 10;

type World = "paradise" | "hell";

// ─── Level Definitions ───────────────────────────────────
interface LevelDef {
  world: World;
  name: string;
  scrollSpeed: number;
  obstacleInterval: number;
  portalInterval: number;
  coinInterval: number;
  powerupInterval: number;
  levelLength: number; // distance to litter box
  skyColors: string[];
  groundColors: string[];
  bgEmojis: string[];
  obstacleTypes: string[];
  description: string;
}

const LEVELS: LevelDef[] = [
  {
    world: "paradise", name: "Sunny Meadows", scrollSpeed: 3, obstacleInterval: 1400,
    portalInterval: 3200, coinInterval: 900, powerupInterval: 3800, levelLength: 4000,
    skyColors: ["#4FC3F7", "#81D4FA", "#B2EBF2", "#69c96d"],
    groundColors: ["#4CAF50", "#388E3C", "#2E7D32"],
    bgEmojis: ["🌳", "🌲", "🏠", "🌻", "🦋"],
    obstacleTypes: ["rock", "bee", "cactus"],
    description: "A peaceful meadow with gentle breezes",
  },
  {
    world: "hell", name: "Ember Caverns", scrollSpeed: 3.5, obstacleInterval: 1200,
    portalInterval: 3000, coinInterval: 850, powerupInterval: 3500, levelLength: 4500,
    skyColors: ["#1a0000", "#330000", "#4d0000", "#8B0000"],
    groundColors: ["#4d0000", "#8B0000", "#CC3300"],
    bgEmojis: ["🏚️", "🪦", "⚰️", "🦇", "💀"],
    obstacleTypes: ["fireball", "demon", "fire"],
    description: "The fires of hell await...",
  },
  {
    world: "paradise", name: "Crystal Beach", scrollSpeed: 3.8, obstacleInterval: 1100,
    portalInterval: 2800, coinInterval: 800, powerupInterval: 3200, levelLength: 5000,
    skyColors: ["#E0F7FA", "#80DEEA", "#4DD0E1", "#FFD54F"],
    groundColors: ["#FFE082", "#FFD54F", "#FFC107"],
    bgEmojis: ["🌴", "🐚", "🦀", "🏖️", "⛵"],
    obstacleTypes: ["rock", "bee", "cactus"],
    description: "Sandy shores with crystal-clear waves",
  },
  {
    world: "hell", name: "Blood Swamp", scrollSpeed: 4, obstacleInterval: 1000,
    portalInterval: 2600, coinInterval: 750, powerupInterval: 3000, levelLength: 5500,
    skyColors: ["#1B0A00", "#2D1100", "#3E1800", "#5C0000"],
    groundColors: ["#2D1100", "#4A1A00", "#6B2200"],
    bgEmojis: ["🕷️", "🐍", "🦠", "🍄", "💀"],
    obstacleTypes: ["fireball", "demon", "fire", "skull"],
    description: "Toxic swamps oozing with blood",
  },
  {
    world: "paradise", name: "Enchanted Forest", scrollSpeed: 4.2, obstacleInterval: 950,
    portalInterval: 2500, coinInterval: 700, powerupInterval: 2800, levelLength: 6000,
    skyColors: ["#1B5E20", "#2E7D32", "#66BB6A", "#A5D6A7"],
    groundColors: ["#33691E", "#558B2F", "#689F38"],
    bgEmojis: ["🍄", "🌿", "🦌", "🦉", "🌺"],
    obstacleTypes: ["rock", "bee", "cactus", "spider"],
    description: "Ancient trees whisper secrets",
  },
  {
    world: "hell", name: "Demon's Throne", scrollSpeed: 4.5, obstacleInterval: 850,
    portalInterval: 2300, coinInterval: 650, powerupInterval: 2500, levelLength: 6500,
    skyColors: ["#0D0000", "#1A0000", "#330000", "#660000"],
    groundColors: ["#1A0000", "#330000", "#660000"],
    bgEmojis: ["👹", "🔱", "⚔️", "🦇", "☠️"],
    obstacleTypes: ["fireball", "demon", "fire", "skull"],
    description: "The Demon King's domain",
  },
  {
    world: "paradise", name: "Sky Kingdom", scrollSpeed: 4.8, obstacleInterval: 800,
    portalInterval: 2200, coinInterval: 600, powerupInterval: 2200, levelLength: 7000,
    skyColors: ["#E1BEE7", "#CE93D8", "#BA68C8", "#AB47BC"],
    groundColors: ["#E1BEE7", "#CE93D8", "#BA68C8"],
    bgEmojis: ["☁️", "⭐", "🌙", "🦅", "🏰"],
    obstacleTypes: ["rock", "bee", "cactus", "lightning"],
    description: "Floating islands above the clouds",
  },
  {
    world: "hell", name: "The Abyss", scrollSpeed: 5, obstacleInterval: 700,
    portalInterval: 2000, coinInterval: 550, powerupInterval: 2000, levelLength: 7500,
    skyColors: ["#000000", "#0A0000", "#150000", "#200000"],
    groundColors: ["#0A0000", "#150000", "#200A00"],
    bgEmojis: ["👁️", "🕳️", "⛓️", "🩸", "☠️"],
    obstacleTypes: ["fireball", "demon", "fire", "skull", "void"],
    description: "The deepest pit of despair",
  },
];

// ─── Interfaces ──────────────────────────────────────────
interface Player {
  x: number; y: number; w: number; h: number;
  vy: number; vx: number; onGround: boolean;
  lives: number; invincible: number;
  frame: number; frameTimer: number;
  hasPowerup: boolean; powerupTimer: number;
  pooping: boolean; poopTimer: number;
}

interface Platform { x: number; y: number; w: number; h: number; world: World; }
interface Obstacle {
  x: number; y: number; w: number; h: number;
  type: string; world: World; frame: number; dead: boolean;
}
interface Portal { x: number; y: number; w: number; h: number; targetWorld: World; pulse: number; }
interface Coin { x: number; y: number; r: number; world: World; collected: boolean; bobOffset: number; }
interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; color: string; size: number;
  type?: "blood" | "normal" | "poop";
}
interface Star { x: number; y: number; size: number; twinkle: number; speed: number; }
interface BackgroundElement { x: number; y: number; size: number; type: string; speed: number; bobOffset: number; }
interface Projectile { x: number; y: number; vx: number; vy: number; world: World; life: number; }
interface Powerup { x: number; y: number; w: number; h: number; world: World; collected: boolean; bobOffset: number; }
interface LitterBox { x: number; y: number; w: number; h: number; reached: boolean; }
interface BloodSplat { x: number; y: number; size: number; life: number; maxLife: number; drops: {dx: number; dy: number; s: number}[]; }

interface GameState {
  running: boolean; started: boolean; gameOver: boolean;
  player: Player;
  platforms: Platform[]; obstacles: Obstacle[];
  portals: Portal[]; coins: Coin[];
  particles: Particle[]; bgElements: BackgroundElement[];
  stars: Star[]; projectiles: Projectile[];
  powerups: Powerup[]; bloodSplats: BloodSplat[];
  litterBox: LitterBox | null;
  world: World; level: number; levelStartX: number;
  score: number; highScore: number;
  combo: number; comboTimer: number;
  camX: number; tick: number;
  keys: Record<string, boolean>;
  lastObstacle: number; lastPortal: number;
  lastCoin: number; lastPlatform: number; lastPowerup: number;
  transitionAlpha: number; transitionTarget: World | null;
  screenShake: number;
  levelComplete: boolean; levelTransitionTimer: number;
  showLevelIntro: boolean; levelIntroTimer: number;
}

// ─── Blood & Gore Effects ────────────────────────────────
function spawnBlood(particles: Particle[], x: number, y: number, count: number) {
  const bloodColors = ["#8B0000", "#CC0000", "#FF0000", "#660000", "#990000"];
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.8) * 8 - 3,
      life: 40 + Math.random() * 30,
      maxLife: 70,
      color: bloodColors[Math.floor(Math.random() * bloodColors.length)],
      size: 2 + Math.random() * 5,
      type: "blood",
    });
  }
}

function spawnBloodSplat(splats: BloodSplat[], x: number, y: number) {
  const drops: {dx: number; dy: number; s: number}[] = [];
  for (let i = 0; i < 8; i++) {
    drops.push({
      dx: (Math.random() - 0.5) * 40,
      dy: (Math.random() - 0.5) * 30,
      s: 3 + Math.random() * 6,
    });
  }
  splats.push({ x, y, size: 20 + Math.random() * 15, life: 120, maxLife: 120, drops });
}

function spawnPoop(particles: Particle[], x: number, y: number) {
  const poopColors = ["#8B4513", "#654321", "#A0522D", "#D2691E"];
  for (let i = 0; i < 12; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y - Math.random() * 5,
      vx: (Math.random() - 0.5) * 3,
      vy: -Math.random() * 4 - 1,
      life: 50 + Math.random() * 30,
      maxLife: 80,
      color: poopColors[Math.floor(Math.random() * poopColors.length)],
      size: 2 + Math.random() * 3,
      type: "poop",
    });
  }
}

// ─── Cat Drawing ─────────────────────────────────────────
function drawCatBody(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  world: World, tick: number, onGround: boolean,
  vx: number, vy: number, hasPowerup: boolean, pooping: boolean
) {
  ctx.save();
  const cx = x + w / 2;
  const cy = y + h / 2;
  const runFrame = onGround && !pooping ? tick * 0.22 : 0;
  const legSwing = Math.sin(runFrame) * 0.6;
  const bodyBob = onGround && Math.abs(vx) > 0.5 && !pooping ? Math.abs(Math.sin(runFrame)) * 3 : 0;

  if (hasPowerup) {
    ctx.save();
    const gc = world === "paradise" ? "rgba(255,200,50," : "rgba(255,80,0,";
    const pr = 35 + Math.sin(tick * 0.15) * 10;
    const grad = ctx.createRadialGradient(cx, cy - bodyBob, 5, cx, cy - bodyBob, pr);
    grad.addColorStop(0, gc + "0.5)");
    grad.addColorStop(1, gc + "0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy - bodyBob, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const bodyColor = world === "paradise" ? "#FF9933" : "#444";
  const bellyColor = world === "paradise" ? "#FFD699" : "#777";
  const darkColor = world === "paradise" ? "#CC7722" : "#333";
  const earInner = world === "paradise" ? "#FF6699" : "#990000";
  const eyeColor = world === "paradise" ? "#333" : "#FF0000";
  const noseColor = world === "paradise" ? "#FF6699" : "#CC0000";

  // Tail
  ctx.save();
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  const tw = Math.sin(tick * 0.12) * (pooping ? 0.8 : 0.4);
  ctx.beginPath();
  ctx.moveTo(x + 2, cy - bodyBob);
  ctx.bezierCurveTo(
    x - 10, cy - 15 - bodyBob + Math.sin(tick * 0.1) * 5,
    x - 18 + Math.sin(tw) * 12, cy - 30 - bodyBob,
    x - 10 + Math.sin(tw) * 15, cy - 38 - bodyBob
  );
  ctx.stroke();
  ctx.restore();

  // Stripes on body
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = darkColor;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(cx - 5 + i * 8, cy - 5 - bodyBob, 3, h / 4, 0.2 + i * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Back legs
  const drawLeg = (lx: number, angle: number) => {
    ctx.save();
    ctx.translate(lx, y + h - 5 - bodyBob);
    ctx.rotate(angle);
    ctx.fillStyle = bodyColor;
    roundRect(ctx, -5, 0, 10, 16, 4);
    ctx.fill();
    ctx.fillStyle = darkColor;
    roundRect(ctx, -5, 12, 10, 5, 3);
    ctx.fill();
    ctx.fillStyle = bellyColor;
    ctx.beginPath();
    ctx.ellipse(0, 17, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  if (pooping) {
    drawLeg(x + 8, 0.5);
    drawLeg(x + 18, -0.5);
  } else {
    drawLeg(x + 8, onGround ? legSwing : 0.3);
    drawLeg(x + 18, onGround ? -legSwing : -0.3);
  }

  // Body
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(cx, cy - bodyBob, w / 2 + 3, h / 2.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body shadow
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 5 - bodyBob, w / 2, h / 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Belly
  ctx.fillStyle = bellyColor;
  ctx.beginPath();
  ctx.ellipse(cx + 5, cy + 3 - bodyBob, w / 2.8, h / 3.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Front legs
  if (pooping) {
    drawLeg(x + w - 16, -0.4);
    drawLeg(x + w - 6, 0.4);
  } else {
    drawLeg(x + w - 16, onGround ? -legSwing : -0.2);
    drawLeg(x + w - 6, onGround ? legSwing : 0.2);
  }

  // Head
  const headX = x + w - 6;
  const headY = y + 4 - bodyBob + (pooping ? 5 : 0);
  const headR = 16;

  // Head shadow
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(headX + 2, headY + 2, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(headX, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // Cheeks
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = world === "paradise" ? "#FF9999" : "#660000";
  ctx.beginPath();
  ctx.ellipse(headX - 12, headY + 4, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(headX + 12, headY + 4, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Ears
  const drawEar = (ex: number, dir: number) => {
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(headX + ex - 4 * dir, headY - 10);
    ctx.lineTo(headX + ex + 2 * dir, headY - 28);
    ctx.lineTo(headX + ex + 8 * dir, headY - 12);
    ctx.fill();
    ctx.fillStyle = earInner;
    ctx.beginPath();
    ctx.moveTo(headX + ex - 2 * dir, headY - 12);
    ctx.lineTo(headX + ex + 2 * dir, headY - 24);
    ctx.lineTo(headX + ex + 6 * dir, headY - 13);
    ctx.fill();
  };
  drawEar(-8, -1);
  drawEar(8, 1);

  // Eyes
  if (world === "hell") {
    ctx.save();
    ctx.shadowColor = "#FF0000";
    ctx.shadowBlur = 10;
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.ellipse(headX - 6, headY - 2, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headX + 6, headY - 2, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.fillRect(headX - 7, headY - 5, 2, 7);
    ctx.fillRect(headX + 5, headY - 5, 2, 7);
    ctx.restore();
  } else {
    ctx.fillStyle = "#fff";
    [-6, 6].forEach(ox => {
      ctx.beginPath();
      ctx.ellipse(headX + ox, headY - 2, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = eyeColor;
    const blink = Math.sin(tick * 0.03) > 0.95 ? 0.5 : 1;
    [-5, 7].forEach(ox => {
      ctx.beginPath();
      ctx.arc(headX + ox, headY - 1, 3, 0, Math.PI * 2);
      ctx.save();
      ctx.scale(1, blink);
      ctx.fill();
      ctx.restore();
    });
    ctx.fillStyle = "#fff";
    [-4, 8].forEach(ox => {
      ctx.beginPath();
      ctx.arc(headX + ox, headY - 3, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Nose
  ctx.fillStyle = noseColor;
  ctx.beginPath();
  ctx.moveTo(headX, headY + 4);
  ctx.lineTo(headX - 3, headY + 7);
  ctx.lineTo(headX + 3, headY + 7);
  ctx.fill();

  // Mouth
  ctx.strokeStyle = world === "paradise" ? "#CC5577" : "#880000";
  ctx.lineWidth = 1.5;
  if (pooping) {
    ctx.beginPath();
    ctx.arc(headX, headY + 10, 4, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(headX, headY + 7);
    ctx.quadraticCurveTo(headX - 5, headY + 11, headX - 7, headY + 9);
    ctx.moveTo(headX, headY + 7);
    ctx.quadraticCurveTo(headX + 5, headY + 11, headX + 7, headY + 9);
    ctx.stroke();
  }

  // Whiskers
  ctx.strokeStyle = world === "paradise" ? "#CC8844" : "#555";
  ctx.lineWidth = 1;
  [[-1, -2, -24], [-1, 1, -22], [1, -2, 24], [1, 1, 22]].forEach(([dir, oy, len]) => {
    ctx.beginPath();
    ctx.moveTo(headX + 10 * dir, headY + 3 + oy);
    ctx.lineTo(headX + len, headY + oy + 1);
    ctx.stroke();
  });

  if (!onGround && vy < -3) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 8 + i * 8, y + h + 5);
      ctx.lineTo(x + 8 + i * 8, y + h + 15 + i * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

// ─── Drawing Functions ───────────────────────────────────
function drawSky(ctx: CanvasRenderingContext2D, colors: string[], offset: number, tick: number, world: World) {
  const grad = ctx.createLinearGradient(0, 0, 0, CH);
  colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);

  if (world === "paradise") {
    // Sun
    ctx.save();
    const sunX = CW - 130;
    const sunY = 80;
    const sg = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 90);
    sg.addColorStop(0, "rgba(255,255,200,1)");
    sg.addColorStop(0.3, "rgba(255,223,100,0.7)");
    sg.addColorStop(0.6, "rgba(255,180,50,0.2)");
    sg.addColorStop(1, "rgba(255,180,50,0)");
    ctx.fillStyle = sg;
    ctx.fillRect(sunX - 90, sunY - 90, 180, 180);
    // Sun rays
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.translate(sunX, sunY);
    ctx.rotate(tick * 0.003);
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6);
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(-2, 30, 4, 40);
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(sunX, sunY, 32, 0, Math.PI * 2);
    ctx.fillStyle = "#FFF176";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sunX - 5, sunY - 5, 28, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fill();
    ctx.restore();

    // Rainbow
    ctx.save();
    ctx.globalAlpha = 0.2;
    ["#FF0000", "#FF7700", "#FFFF00", "#00FF00", "#0099FF", "#6633FF"].forEach((c, i) => {
      ctx.beginPath();
      ctx.arc(CW / 2, GY * 0.65, CW * 0.32 - i * 16, Math.PI, 0);
      ctx.strokeStyle = c;
      ctx.lineWidth = 15;
      ctx.stroke();
    });
    ctx.restore();

    // Clouds
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 290 - offset * (0.08 + i * 0.02)) % (CW + 300) + CW + 300) % (CW + 300) - 150;
      const cy = 35 + i * 20 + Math.sin(tick * 0.01 + i) * 5;
      const s = 0.7 + (i % 3) * 0.2;
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx, cy, 28 * s, 0, Math.PI * 2);
      ctx.arc(cx + 22 * s, cy - 12 * s, 24 * s, 0, Math.PI * 2);
      ctx.arc(cx + 48 * s, cy - 2 * s, 26 * s, 0, Math.PI * 2);
      ctx.arc(cx + 24 * s, cy + 6 * s, 20 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else {
    // Evil moon with craters
    ctx.save();
    const mx = CW - 130;
    const my = 75;
    const mg = ctx.createRadialGradient(mx, my, 5, mx, my, 65);
    mg.addColorStop(0, "rgba(255,50,50,1)");
    mg.addColorStop(0.4, "rgba(200,0,0,0.6)");
    mg.addColorStop(1, "rgba(100,0,0,0)");
    ctx.fillStyle = mg;
    ctx.fillRect(mx - 65, my - 65, 130, 130);
    ctx.beginPath();
    ctx.arc(mx, my, 28, 0, Math.PI * 2);
    ctx.fillStyle = "#FF3333";
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    [[5, -5, 4], [-8, 3, 3], [3, 8, 2]].forEach(([dx, dy, r]) => {
      ctx.beginPath();
      ctx.arc(mx + dx, my + dy, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Smoke
    for (let i = 0; i < 6; i++) {
      const sx = ((i * 240 - offset * 0.06 + tick * 0.15) % (CW + 200) + CW + 200) % (CW + 200) - 100;
      ctx.save();
      ctx.globalAlpha = 0.15 + Math.sin(tick * 0.02 + i) * 0.05;
      ctx.fillStyle = "#220000";
      ctx.beginPath();
      ctx.arc(sx, 70 + i * 18, 45, 0, Math.PI * 2);
      ctx.arc(sx + 35, 60 + i * 18, 38, 0, Math.PI * 2);
      ctx.arc(sx + 60, 75 + i * 18, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (tick % 250 < 4) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "#FF4444";
      ctx.fillRect(0, 0, CW, CH);
      ctx.restore();
    }
  }
}

function drawGround(ctx: CanvasRenderingContext2D, colors: string[], offset: number, tick: number, world: World, level: number) {
  // Wavy hills
  ctx.save();
  ctx.fillStyle = colors[0] || "#444";
  ctx.beginPath();
  ctx.moveTo(0, GY - 45);
  for (let x = 0; x <= CW; x += 4) {
    ctx.lineTo(x, GY - 45 + Math.sin((x + offset * 0.25) * 0.008 + level) * 30
      + Math.sin((x + offset * 0.15) * 0.015) * 15);
  }
  ctx.lineTo(CW, CH);
  ctx.lineTo(0, CH);
  ctx.fill();
  ctx.restore();

  // Main ground with gradient
  const gGrad = ctx.createLinearGradient(0, GY, 0, CH);
  colors.forEach((c, i) => gGrad.addColorStop(i / (colors.length - 1), c));
  ctx.fillStyle = gGrad;
  ctx.fillRect(0, GY, CW, CH - GY);

  if (world === "paradise") {
    // Grass
    ctx.strokeStyle = colors[0] || "#66BB6A";
    ctx.lineWidth = 2;
    for (let i = 0; i < 50; i++) {
      const gx = ((i * 28 - offset * 0.5) % CW + CW) % CW;
      const sw = Math.sin(tick * 0.05 + i * 0.7) * 4;
      ctx.beginPath();
      ctx.moveTo(gx, GY);
      ctx.quadraticCurveTo(gx + sw, GY - 8, gx + sw - 2, GY - 14);
      ctx.moveTo(gx + 4, GY);
      ctx.quadraticCurveTo(gx + 4 + sw, GY - 6, gx + 4 + sw + 2, GY - 11);
      ctx.stroke();
    }
    // Flowers
    const flowers = ["🌸", "🌺", "🌻", "🌷", "🌼", "💮"];
    ctx.font = "14px serif";
    for (let i = 0; i < 20; i++) {
      const fx = ((i * 68 - offset * 0.4) % CW + CW) % CW;
      const bob = Math.sin(tick * 0.03 + i * 1.5) * 3;
      ctx.fillText(flowers[i % flowers.length], fx, GY - 1 + bob);
    }
  } else {
    // Lava bubbles
    for (let i = 0; i < 12; i++) {
      const bx = ((i * 110 - offset * 0.2 + tick * 0.4) % CW + CW) % CW;
      const by = GY + 25 + Math.sin(tick * 0.07 + i * 2.5) * 18;
      const br = 3 + Math.sin(tick * 0.09 + i) * 2;
      ctx.save();
      ctx.shadowColor = "#FF6600";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#FF6600";
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Cracks
    ctx.save();
    ctx.strokeStyle = "#FF8C00";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#FF4500";
    ctx.shadowBlur = 10;
    for (let i = 0; i < 14; i++) {
      const cx = ((i * 95 - offset * 0.3) % CW + CW) % CW;
      ctx.beginPath();
      ctx.moveTo(cx, GY + 8);
      ctx.lineTo(cx + 12 + Math.sin(i) * 5, GY + 22);
      ctx.lineTo(cx + 4, GY + 40);
      ctx.lineTo(cx + 15, GY + 55);
      ctx.stroke();
    }
    ctx.restore();
    // Skulls
    ctx.font = "18px serif";
    for (let i = 0; i < 8; i++) {
      const sx = ((i * 160 - offset * 0.35) % CW + CW) % CW;
      ctx.fillText("💀", sx, GY - 4);
    }
  }
}

function drawBgElements(ctx: CanvasRenderingContext2D, els: BackgroundElement[], offset: number, tick: number) {
  els.forEach(el => {
    const sx = ((el.x - offset * el.speed) % (CW + 200) + CW + 200) % (CW + 200) - 100;
    const bob = Math.sin(tick * 0.02 + el.bobOffset) * 5;
    ctx.font = `${el.size}px serif`;
    ctx.fillText(el.type, sx, el.y + bob);
  });
}

function drawPlatform(ctx: CanvasRenderingContext2D, p: Platform, camX: number) {
  const sx = p.x - camX;
  if (sx > CW + 50 || sx + p.w < -50) return;
  if (p.world === "paradise") {
    const g = ctx.createLinearGradient(sx, p.y, sx, p.y + p.h);
    g.addColorStop(0, "#66BB6A");
    g.addColorStop(1, "#388E3C");
    ctx.fillStyle = g;
    roundRect(ctx, sx, p.y, p.w, p.h, 6);
    ctx.fill();
    ctx.fillStyle = "#81C784";
    ctx.fillRect(sx + 2, p.y, p.w - 4, 4);
    ctx.font = "10px serif";
    for (let i = 0; i < p.w / 25; i++) ctx.fillText("🌼", sx + 4 + i * 24, p.y - 2);
  } else {
    const g = ctx.createLinearGradient(sx, p.y, sx, p.y + p.h);
    g.addColorStop(0, "#5D0000");
    g.addColorStop(1, "#3D0000");
    ctx.fillStyle = g;
    roundRect(ctx, sx, p.y, p.w, p.h, 6);
    ctx.fill();
    ctx.fillStyle = "#CC3300";
    for (let i = 0; i < p.w / 18; i++) {
      ctx.beginPath();
      ctx.arc(sx + 8 + i * 16, p.y + p.h + 1, 3, 0, Math.PI);
      ctx.fill();
    }
  }
}

function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle, camX: number, tick: number) {
  if (o.dead) return;
  const sx = o.x - camX;
  if (sx > CW + 50 || sx + o.w < -50) return;
  ctx.save();
  if (o.world === "paradise") {
    const em = o.type === "rock" ? "🪨" : o.type === "bee" ? "🐝" : o.type === "spider" ? "🕷️" : "🌵";
    const bob = (o.type === "bee" || o.type === "spider") ? Math.sin(tick * 0.15 + o.frame) * 12 : 0;
    ctx.font = `${o.h}px serif`;
    ctx.fillText(em, sx, o.y + o.h - 5 + bob);
  } else {
    if (o.type === "fireball") {
      const bob = Math.sin(tick * 0.12 + o.frame) * 14;
      ctx.shadowColor = "#FF4500";
      ctx.shadowBlur = 18;
      ctx.font = `${o.h}px serif`;
      ctx.fillText("☄️", sx, o.y + bob);
    } else if (o.type === "demon" || o.type === "skull") {
      const shake = Math.sin(tick * 0.2) * 3;
      ctx.font = `${o.h}px serif`;
      ctx.fillText(o.type === "skull" ? "☠️" : "👹", sx + shake, o.y + o.h - 5);
    } else if (o.type === "void") {
      ctx.save();
      const vg = ctx.createRadialGradient(sx + o.w/2, o.y + o.h/2, 0, sx + o.w/2, o.y + o.h/2, o.w);
      vg.addColorStop(0, "rgba(0,0,0,0.9)");
      vg.addColorStop(0.5, "rgba(50,0,50,0.5)");
      vg.addColorStop(1, "transparent");
      ctx.fillStyle = vg;
      ctx.beginPath();
      ctx.arc(sx + o.w/2, o.y + o.h/2, o.w * (0.8 + Math.sin(tick * 0.1) * 0.2), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.shadowColor = "#FF4500";
      ctx.shadowBlur = 14;
      ctx.font = `${o.h}px serif`;
      ctx.fillText("🔥", sx, o.y + o.h - 5);
    }
  }
  ctx.restore();
}

function drawPortal(ctx: CanvasRenderingContext2D, p: Portal, camX: number, tick: number) {
  const sx = p.x - camX;
  if (sx > CW + 60 || sx + p.w < -60) return;
  const pulse = Math.sin(tick * 0.08 + p.pulse) * 6;
  const pcx = sx + p.w / 2;
  const pcy = p.y + p.h / 2;
  const r = p.w / 2 + pulse;
  ctx.save();
  const gc = p.targetWorld === "hell" ? "rgba(255,0,0," : "rgba(100,255,100,";
  const ic = p.targetWorld === "hell" ? "#FF1A1A" : "#44FF44";
  const mc = p.targetWorld === "hell" ? "#660000" : "#006600";
  for (let i = 3; i >= 0; i--) {
    ctx.beginPath();
    ctx.arc(pcx, pcy, r + i * 10, 0, Math.PI * 2);
    ctx.fillStyle = gc + (0.12 - i * 0.025) + ")";
    ctx.fill();
  }
  const g = ctx.createRadialGradient(pcx, pcy, 0, pcx, pcy, r);
  g.addColorStop(0, ic);
  g.addColorStop(0.5, mc);
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(pcx, pcy, r, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    const a = tick * 0.06 + (i * Math.PI * 2) / 5;
    ctx.beginPath();
    ctx.arc(pcx, pcy, r - 5, a, a + 0.7);
    ctx.strokeStyle = ic;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.font = "bold 14px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(p.targetWorld === "hell" ? "⚡ HELL ⚡" : "✨ PARADISE ✨", pcx, p.y - 18);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawCoin(ctx: CanvasRenderingContext2D, c: Coin, camX: number, tick: number) {
  if (c.collected) return;
  const sx = c.x - camX;
  if (sx > CW + 20 || sx < -20) return;
  const bob = Math.sin(tick * 0.06 + c.bobOffset) * 5;
  ctx.save();
  ctx.globalAlpha = Math.sin(tick * 0.1 + c.bobOffset) * 0.3 + 0.7;
  ctx.font = "24px serif";
  ctx.fillText(c.world === "paradise" ? "⭐" : "💎", sx - 12, c.y + bob + 8);
  ctx.restore();
}

function drawPowerup(ctx: CanvasRenderingContext2D, pu: Powerup, camX: number, tick: number) {
  if (pu.collected) return;
  const sx = pu.x - camX;
  if (sx > CW + 30 || sx < -30) return;
  const bob = Math.sin(tick * 0.08 + pu.bobOffset) * 6;
  ctx.save();
  ctx.globalAlpha = Math.sin(tick * 0.12) * 0.2 + 0.8;
  ctx.shadowColor = pu.world === "paradise" ? "#FFD700" : "#FF4500";
  ctx.shadowBlur = 18;
  const g = ctx.createLinearGradient(sx, pu.y + bob, sx, pu.y + bob + pu.h);
  if (pu.world === "paradise") { g.addColorStop(0, "#FFD700"); g.addColorStop(1, "#FF8C00"); }
  else { g.addColorStop(0, "#FF4500"); g.addColorStop(1, "#CC0000"); }
  ctx.fillStyle = g;
  roundRect(ctx, sx, pu.y + bob, pu.w, pu.h, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.font = "22px serif";
  ctx.fillText(pu.world === "paradise" ? "🌈" : "🔥", sx + 3, pu.y + bob + 26);
  ctx.restore();
}

function drawLitterBox(ctx: CanvasRenderingContext2D, lb: LitterBox, camX: number, tick: number) {
  const sx = lb.x - camX;
  if (sx > CW + 80 || sx < -80) return;
  ctx.save();

  // Glow
  const pulse = Math.sin(tick * 0.06) * 10 + 30;
  const gg = ctx.createRadialGradient(sx + lb.w/2, lb.y + lb.h/2, 5, sx + lb.w/2, lb.y + lb.h/2, pulse + 20);
  gg.addColorStop(0, "rgba(255,215,0,0.4)");
  gg.addColorStop(1, "rgba(255,215,0,0)");
  ctx.fillStyle = gg;
  ctx.beginPath();
  ctx.arc(sx + lb.w/2, lb.y + lb.h/2, pulse + 20, 0, Math.PI * 2);
  ctx.fill();

  // Box
  ctx.fillStyle = "#D2B48C";
  roundRect(ctx, sx, lb.y, lb.w, lb.h, 6);
  ctx.fill();
  ctx.fillStyle = "#C4A882";
  ctx.fillRect(sx + 4, lb.y + 4, lb.w - 8, lb.h / 3);
  // Sand texture dots
  ctx.fillStyle = "#BFA87A";
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.arc(sx + 8 + (i % 4) * 14, lb.y + 20 + Math.floor(i / 4) * 10, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#A0896C";
  ctx.lineWidth = 2;
  roundRect(ctx, sx, lb.y, lb.w, lb.h, 6);
  ctx.stroke();

  // Label
  ctx.font = "bold 12px Arial";
  ctx.fillStyle = "#FFD700";
  ctx.textAlign = "center";
  ctx.fillText("🚽 LITTER BOX", sx + lb.w/2, lb.y - 12);
  const arrow = Math.sin(tick * 0.1) * 5;
  ctx.font = "20px serif";
  ctx.fillText("⬇️", sx + lb.w/2, lb.y - 20 + arrow);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile, camX: number, tick: number) {
  const sx = proj.x - camX;
  if (sx > CW + 30 || sx < -30) return;
  ctx.save();
  if (proj.world === "paradise") {
    const colors = ["#FF0000", "#FF7700", "#FFFF00", "#00FF00", "#0099FF", "#6633FF"];
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(sx - i * 5, proj.y + Math.sin(tick * 0.3 + i) * 3, 6 - i * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = colors[i];
      ctx.globalAlpha = 1 - i * 0.13;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(sx, proj.y, 7, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.shadowColor = "#FF4500";
    ctx.shadowBlur = 18;
    const fg = ctx.createRadialGradient(sx, proj.y, 0, sx, proj.y, 12);
    fg.addColorStop(0, "#FFFF00");
    fg.addColorStop(0.3, "#FF6600");
    fg.addColorStop(1, "#CC0000");
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(sx, proj.y, 9, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 1; i <= 6; i++) {
      ctx.globalAlpha = 0.7 - i * 0.1;
      ctx.beginPath();
      ctx.arc(sx - i * 7, proj.y + Math.sin(tick * 0.4 + i) * 3, 7 - i * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? "#FF4500" : "#FF6600";
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawBloodSplats(ctx: CanvasRenderingContext2D, splats: BloodSplat[]) {
  splats.forEach(s => {
    ctx.save();
    ctx.globalAlpha = (s.life / s.maxLife) * 0.8;
    s.drops.forEach(d => {
      ctx.fillStyle = "#8B0000";
      ctx.beginPath();
      ctx.arc(s.x + d.dx, s.y + d.dy, d.s * (s.life / s.maxLife), 0, Math.PI * 2);
      ctx.fill();
    });
    // Central splat
    ctx.fillStyle = "#CC0000";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size * 0.4 * (s.life / s.maxLife), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, world: World, tick: number) {
  ctx.save();
  if (p.invincible > 0 && Math.floor(tick / 4) % 2 === 0) ctx.globalAlpha = 0.4;
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.ellipse(p.x + p.w / 2, GY + 2, p.w / 2, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();
  drawCatBody(ctx, p.x, p.y, p.w, p.h, world, tick, p.onGround, p.vx, p.vy, p.hasPowerup, p.pooping);
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    if (p.type === "blood") {
      ctx.shadowColor = "#FF0000";
      ctx.shadowBlur = 4;
      // Stretched blood drops
      ctx.beginPath();
      const s = p.size * (p.life / p.maxLife);
      ctx.ellipse(p.x, p.y, s, s * 1.5, Math.atan2(p.vy, p.vx), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === "poop") {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5C3317";
      ctx.beginPath();
      ctx.arc(p.x + 1, p.y - 1, p.size * 0.5 * (p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawHUD(ctx: CanvasRenderingContext2D, g: GameState) {
  const lv = LEVELS[g.level % LEVELS.length];
  ctx.save();
  // Score panel
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = g.world === "paradise" ? "#1B5E20" : "#4D0000";
  roundRect(ctx, 10, 10, 230, 95, 10);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.font = "bold 22px Arial";
  ctx.fillStyle = "#FFD700";
  ctx.fillText(`Score: ${g.score}`, 25, 36);
  ctx.font = "14px Arial";
  ctx.fillStyle = "#ccc";
  ctx.fillText(`Best: ${g.highScore}`, 25, 54);
  ctx.font = "bold 13px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText(`Level ${g.level + 1}: ${lv.name}`, 25, 72);
  ctx.font = "22px serif";
  for (let i = 0; i < g.player.lives; i++) ctx.fillText("❤️", 25 + i * 26, 94);

  // Progress bar
  const dist = g.camX - g.levelStartX;
  const progress = Math.min(dist / lv.levelLength, 1);
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = "#333";
  roundRect(ctx, CW / 2 - 150, 12, 300, 14, 7);
  ctx.fill();
  ctx.fillStyle = g.world === "paradise" ? "#4CAF50" : "#FF4500";
  roundRect(ctx, CW / 2 - 150, 12, 300 * progress, 14, 7);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.font = "10px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(`${Math.floor(progress * 100)}% → 🚽`, CW / 2, 23);
  // Cat on progress bar
  ctx.font = "14px serif";
  ctx.fillText("🐱", CW / 2 - 150 + 300 * progress, 10);
  ctx.textAlign = "left";

  // Powerup
  if (g.player.hasPowerup) {
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = g.world === "paradise" ? "#1B5E20" : "#4D0000";
    roundRect(ctx, 250, 10, 170, 38, 8);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(g.world === "paradise" ? "🌈 RAINBOW" : "🔥 FIREBALL", 260, 30);
    ctx.fillStyle = "#333";
    roundRect(ctx, 260, 36, 100, 6, 3);
    ctx.fill();
    ctx.fillStyle = g.world === "paradise" ? "#FFD700" : "#FF4500";
    roundRect(ctx, 260, 36, 100 * (g.player.powerupTimer / 300), 6, 3);
    ctx.fill();
  }

  // Combo
  if (g.combo > 1) {
    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "#FF6600";
    ctx.shadowBlur = 10;
    ctx.fillText(`x${g.combo} COMBO!`, CW - 170, 38);
    ctx.shadowBlur = 0;
  }

  ctx.font = "11px Arial";
  ctx.fillStyle = "#666";
  ctx.fillText("← → Move | SPACE Jump | F Shoot", 10, CH - 8);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
    const hs = parseInt(typeof window !== "undefined" ? localStorage.getItem("catrunner-hs") || "0" : "0", 10);
    const lv = LEVELS[0];
    gameRef.current = {
      running: true, started: false, gameOver: false,
      player: {
        x: 150, y: GY - 55, w: 48, h: 55, vy: 0, vx: 0, onGround: true,
        lives: 3, invincible: 0, frame: 0, frameTimer: 0,
        hasPowerup: false, powerupTimer: 0, pooping: false, poopTimer: 0,
      },
      platforms: [], obstacles: [], portals: [], coins: [],
      particles: [], bgElements: [], stars: [],
      projectiles: [], powerups: [], bloodSplats: [],
      litterBox: null,
      world: lv.world, level: 0, levelStartX: 0,
      score: 0, highScore: hs, combo: 0, comboTimer: 0,
      camX: 0, tick: 0, keys: {},
      lastObstacle: 0, lastPortal: 0, lastCoin: 0, lastPlatform: 0, lastPowerup: 0,
      transitionAlpha: 0, transitionTarget: null, screenShake: 0,
      levelComplete: false, levelTransitionTimer: 0,
      showLevelIntro: true, levelIntroTimer: 150,
    };
    genBg(gameRef.current.bgElements, lv);
    genStars(gameRef.current.stars);
    genPlatforms(gameRef.current.platforms, lv.world);
  }, []);

  useEffect(() => {
    function onResize() {
      CW = window.innerWidth; CH = window.innerHeight; GY = Math.floor(CH * 0.8);
      setDims({ w: CW, h: CH });
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    initGame();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let shootCD = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if (!g) return;
      g.keys[e.key] = true;
      if (!g.started && !g.gameOver) g.started = true;
      if (g.gameOver && e.key === " ") { initGame(); if (gameRef.current) gameRef.current.started = true; }
      if ((e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") && g.player.onGround && !g.player.pooping) {
        g.player.vy = JUMP_FORCE;
        g.player.onGround = false;
      }
      if ((e.key === "f" || e.key === "F" || e.key === "e" || e.key === "E") && shootCD <= 0 && g.started && !g.gameOver && g.player.hasPowerup) {
        g.projectiles.push({ x: g.player.x + g.player.w, y: g.player.y + g.player.h / 2, vx: PROJECTILE_SPEED, vy: 0, world: g.world, life: 80 });
        spawnParticles(g.particles, g.player.x + g.player.w, g.player.y + g.player.h / 2, g.world === "paradise" ? "#FFD700" : "#FF4500", 6);
        shootCD = 10;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => { if (gameRef.current) gameRef.current.keys[e.key] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let animId: number;
    function loop() {
      const g = gameRef.current;
      if (!g || !ctx) return;
      g.tick++;
      if (shootCD > 0) shootCD--;
      if (g.started && !g.gameOver) update(g);
      draw(ctx, g);
      animId = requestAnimationFrame(loop);
    }
    animId = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, [initGame]);

  return <canvas ref={canvasRef} width={dims.w} height={dims.h} className="block" style={{ width: "100vw", height: "100vh" }} />;
}

// ─── Generation ──────────────────────────────────────────
function genBg(arr: BackgroundElement[], lv: LevelDef) {
  arr.length = 0;
  for (let i = 0; i < 22; i++) {
    arr.push({
      x: Math.random() * CW * 3,
      y: GY - 55 - Math.random() * 35,
      size: 32 + Math.random() * 28,
      type: lv.bgEmojis[Math.floor(Math.random() * lv.bgEmojis.length)],
      speed: 0.15 + Math.random() * 0.35,
      bobOffset: Math.random() * Math.PI * 2,
    });
  }
}

function genStars(arr: Star[]) {
  arr.length = 0;
  for (let i = 0; i < 90; i++) arr.push({
    x: Math.random() * CW, y: Math.random() * (GY - 50),
    size: 1 + Math.random() * 2.5, twinkle: Math.random() * Math.PI * 2, speed: 0.02 + Math.random() * 0.03,
  });
}

function genPlatforms(arr: Platform[], world: World) {
  const hs = [GY - 105, GY - 155, GY - 205];
  for (let i = 0; i < 6; i++) arr.push({
    x: 500 + i * 400, y: hs[Math.floor(Math.random() * hs.length)],
    w: 90 + Math.random() * 80, h: 18, world,
  });
}

function spawnParticles(particles: Particle[], x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) particles.push({
    x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 - 2,
    life: 30 + Math.random() * 20, maxLife: 50, color, size: 2 + Math.random() * 4,
  });
}

// ─── Update ──────────────────────────────────────────────
function update(g: GameState) {
  const lv = LEVELS[g.level % LEVELS.length];
  const p = g.player;

  // Level intro
  if (g.showLevelIntro) {
    g.levelIntroTimer--;
    if (g.levelIntroTimer <= 0) g.showLevelIntro = false;
    return;
  }

  // Level complete transition
  if (g.levelComplete) {
    g.levelTransitionTimer--;
    if (p.pooping) {
      p.poopTimer--;
      if (p.poopTimer % 8 === 0) spawnPoop(g.particles, p.x + p.w / 2, p.y + p.h);
      if (p.poopTimer <= 0) {
        p.pooping = false;
        g.score += 100;
      }
    }
    if (g.levelTransitionTimer <= 0) {
      // Next level
      g.level++;
      const nlv = LEVELS[g.level % LEVELS.length];
      g.world = nlv.world;
      g.levelStartX = g.camX;
      g.levelComplete = false;
      g.litterBox = null;
      g.showLevelIntro = true;
      g.levelIntroTimer = 120;
      genBg(g.bgElements, nlv);
      g.platforms.forEach(pl => pl.world = nlv.world);
    }
    return;
  }

  // Movement
  p.vx = 0;
  if (!p.pooping) {
    if (g.keys["ArrowRight"] || g.keys["d"] || g.keys["D"]) p.vx = PLAYER_SPEED;
    if (g.keys["ArrowLeft"] || g.keys["a"] || g.keys["A"]) p.vx = -PLAYER_SPEED;
  }

  g.camX += lv.scrollSpeed;
  p.x += lv.scrollSpeed + p.vx;
  if (p.x < g.camX + 20) p.x = g.camX + 20;
  if (p.x + p.w > g.camX + CW - 20) p.x = g.camX + CW - 20 - p.w;

  p.vy += GRAVITY;
  p.y += p.vy;
  if (p.y + p.h >= GY) { p.y = GY - p.h; p.vy = 0; p.onGround = true; }

  p.onGround = p.y + p.h >= GY;
  g.platforms.forEach(pl => {
    if (p.vy >= 0 && p.x + p.w > pl.x && p.x < pl.x + pl.w && p.y + p.h >= pl.y && p.y + p.h <= pl.y + pl.h + 10) {
      p.y = pl.y - p.h; p.vy = 0; p.onGround = true;
    }
  });

  if (p.invincible > 0) p.invincible--;
  if (p.hasPowerup) { p.powerupTimer--; if (p.powerupTimer <= 0) p.hasPowerup = false; }
  if (g.comboTimer > 0) { g.comboTimer--; if (g.comboTimer <= 0) g.combo = 0; }
  if (g.tick % 10 === 0) g.score++;

  const dist = g.camX - g.levelStartX;

  // Spawn litter box near end of level
  if (!g.litterBox && dist > lv.levelLength * 0.9) {
    g.litterBox = { x: g.camX + CW + 200, y: GY - 45, w: 60, h: 40, reached: false };
  }

  // Litter box collision
  if (g.litterBox && !g.litterBox.reached) {
    const lb = g.litterBox;
    if (p.x + p.w > lb.x && p.x < lb.x + lb.w && p.y + p.h > lb.y && p.y < lb.y + lb.h) {
      lb.reached = true;
      g.levelComplete = true;
      g.levelTransitionTimer = 120;
      p.pooping = true;
      p.poopTimer = 60;
      g.screenShake = 12;
      spawnParticles(g.particles, p.x + p.w/2, p.y + p.h, "#8B4513", 15);
    }
  }

  // Spawning
  if (g.camX - g.lastObstacle > lv.obstacleInterval) {
    const types = lv.obstacleTypes;
    const type = types[Math.floor(Math.random() * types.length)];
    const fly = type === "bee" || type === "fireball" || type === "spider";
    g.obstacles.push({ x: g.camX + CW + 50, y: fly ? GY - 95 - Math.random() * 65 : GY - 44, w: 40, h: 42, type, world: g.world, frame: Math.random() * Math.PI * 2, dead: false });
    g.lastObstacle = g.camX;
  }
  if (g.camX - g.lastPortal > lv.portalInterval) {
    g.portals.push({ x: g.camX + CW + 80, y: GY - 100, w: 68, h: 90, targetWorld: g.world === "paradise" ? "hell" : "paradise", pulse: Math.random() * Math.PI * 2 });
    g.lastPortal = g.camX;
  }
  if (g.camX - g.lastCoin > lv.coinInterval) {
    const hi = Math.random() > 0.5;
    g.coins.push({ x: g.camX + CW + 30, y: hi ? GY - 115 - Math.random() * 50 : GY - 38, r: 14, world: g.world, collected: false, bobOffset: Math.random() * Math.PI * 2 });
    if (Math.random() > 0.55) for (let i = 1; i <= 4; i++) g.coins.push({ x: g.camX + CW + 30 + i * 42, y: GY - 38, r: 14, world: g.world, collected: false, bobOffset: Math.random() * Math.PI * 2 });
    g.lastCoin = g.camX;
  }
  if (g.camX - g.lastPlatform > 440) {
    const hs = [GY - 105, GY - 155, GY - 205];
    g.platforms.push({ x: g.camX + CW + 100, y: hs[Math.floor(Math.random() * hs.length)], w: 90 + Math.random() * 80, h: 18, world: g.world });
    g.lastPlatform = g.camX;
  }
  if (g.camX - g.lastPowerup > lv.powerupInterval) {
    g.powerups.push({ x: g.camX + CW + 60, y: GY - 65 - Math.random() * 85, w: 32, h: 32, world: g.world, collected: false, bobOffset: Math.random() * Math.PI * 2 });
    g.lastPowerup = g.camX;
  }

  // Projectile updates
  g.projectiles = g.projectiles.filter(proj => {
    proj.x += proj.vx; proj.y += proj.vy; proj.life--;
    g.obstacles.forEach(o => {
      if (o.dead) return;
      if (proj.x > o.x - 12 && proj.x < o.x + o.w + 12 && proj.y > o.y - 12 && proj.y < o.y + o.h + 12) {
        o.dead = true; proj.life = 0;
        g.score += 25; g.screenShake = 10;
        // BLOOD
        spawnBlood(g.particles, o.x + o.w/2, o.y + o.h/2, 25);
        spawnBloodSplat(g.bloodSplats, o.x + o.w/2 - g.camX, o.y + o.h/2);
        spawnParticles(g.particles, o.x + o.w/2, o.y + o.h/2, "#FF0000", 10);
      }
    });
    return proj.life > 0;
  });

  // Player obstacle collision
  g.obstacles.forEach(o => {
    if (o.dead) return;
    const oy = (o.type === "bee" || o.type === "spider") ? o.y + Math.sin(g.tick * 0.15 + o.frame) * 12 - o.h/2 :
               o.type === "fireball" ? o.y + Math.sin(g.tick * 0.12 + o.frame) * 14 - o.h/2 : o.y;
    if (p.invincible <= 0 && p.x + p.w - 8 > o.x && p.x + 8 < o.x + o.w && p.y + p.h - 5 > oy && p.y + 5 < oy + o.h) {
      p.lives--; p.invincible = 90; g.combo = 0; g.screenShake = 18;
      spawnBlood(g.particles, p.x + p.w/2, p.y + p.h/2, 15);
      if (p.lives <= 0) { g.gameOver = true; if (g.score > g.highScore) { g.highScore = g.score; localStorage.setItem("catrunner-hs", String(g.score)); } }
    }
  });

  // Coin collection
  g.coins.forEach(c => {
    if (c.collected) return;
    const bob = Math.sin(g.tick * 0.06 + c.bobOffset) * 5;
    if (p.x + p.w > c.x - c.r && p.x < c.x + c.r && p.y + p.h > c.y + bob - c.r && p.y < c.y + bob + c.r) {
      c.collected = true; g.combo++; g.comboTimer = 120; g.score += 10 * g.combo;
      spawnParticles(g.particles, c.x, c.y, c.world === "paradise" ? "#FFD700" : "#00FFFF", 8);
    }
  });

  // Powerup collection
  g.powerups.forEach(pu => {
    if (pu.collected) return;
    const bob = Math.sin(g.tick * 0.08 + pu.bobOffset) * 6;
    if (p.x + p.w > pu.x && p.x < pu.x + pu.w && p.y + p.h > pu.y + bob && p.y < pu.y + bob + pu.h) {
      pu.collected = true; p.hasPowerup = true; p.powerupTimer = 300; g.screenShake = 10;
      spawnParticles(g.particles, pu.x + pu.w/2, pu.y + pu.h/2, pu.world === "paradise" ? "#FFD700" : "#FF4500", 20);
    }
  });

  // Portal collision
  g.portals.forEach(portal => {
    if (p.x + p.w > portal.x && p.x < portal.x + portal.w && p.y + p.h > portal.y && p.y < portal.y + portal.h && !g.transitionTarget) {
      g.transitionTarget = portal.targetWorld;
      spawnParticles(g.particles, p.x + p.w/2, p.y + p.h/2, portal.targetWorld === "hell" ? "#FF4400" : "#44FF44", PARTICLE_COUNT);
      g.screenShake = 20;
    }
  });

  if (g.transitionTarget) {
    g.transitionAlpha += 0.04;
    if (g.transitionAlpha >= 1) {
      g.world = g.transitionTarget; g.transitionTarget = null; g.transitionAlpha = 0;
      const nlv = LEVELS[g.level % LEVELS.length];
      genBg(g.bgElements, { ...nlv, world: g.world, bgEmojis: g.world === "paradise" ? nlv.bgEmojis : LEVELS[1].bgEmojis });
      g.platforms.forEach(pl => pl.world = g.world);
    }
  }

  g.particles = g.particles.filter(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += pt.type === "blood" ? 0.15 : 0.1; pt.life--; return pt.life > 0; });
  g.bloodSplats = g.bloodSplats.filter(s => { s.life--; return s.life > 0; });
  if (g.screenShake > 0) g.screenShake--;

  const cx = g.camX - 200;
  g.obstacles = g.obstacles.filter(o => o.x > cx && !o.dead);
  g.portals = g.portals.filter(p => p.x > cx);
  g.coins = g.coins.filter(c => c.x > cx && !c.collected);
  g.platforms = g.platforms.filter(p => p.x + p.w > cx);
  g.powerups = g.powerups.filter(pu => pu.x > cx && !pu.collected);
}

// ─── Draw ────────────────────────────────────────────────
function draw(ctx: CanvasRenderingContext2D, g: GameState) {
  const lv = LEVELS[g.level % LEVELS.length];
  ctx.save();

  if (g.screenShake > 0) {
    ctx.translate((Math.random() - 0.5) * g.screenShake, (Math.random() - 0.5) * g.screenShake);
  }

  drawSky(ctx, lv.skyColors, g.camX, g.tick, g.world);

  if (g.world === "hell") {
    g.stars.forEach(s => {
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.sin(g.tick * s.speed + s.twinkle) * 0.3;
      ctx.fillStyle = "#FF6666";
      ctx.fillRect(s.x, s.y, s.size, s.size);
      ctx.restore();
    });
  }

  drawBgElements(ctx, g.bgElements, g.camX, g.tick);
  drawGround(ctx, lv.groundColors, g.camX, g.tick, g.world, g.level);
  drawBloodSplats(ctx, g.bloodSplats);
  g.platforms.forEach(p => drawPlatform(ctx, p, g.camX));
  g.coins.forEach(c => drawCoin(ctx, c, g.camX, g.tick));
  g.powerups.forEach(pu => drawPowerup(ctx, pu, g.camX, g.tick));
  g.portals.forEach(p => drawPortal(ctx, p, g.camX, g.tick));
  g.obstacles.forEach(o => drawObstacle(ctx, o, g.camX, g.tick));
  if (g.litterBox) drawLitterBox(ctx, g.litterBox, g.camX, g.tick);
  g.projectiles.forEach(proj => drawProjectile(ctx, proj, g.camX, g.tick));

  const spx = g.player.x - g.camX;
  drawPlayer(ctx, { ...g.player, x: spx }, g.world, g.tick);
  drawParticles(ctx, g.particles);

  // Poop on ground after pooping
  if (g.levelComplete && g.litterBox) {
    const lbsx = g.litterBox.x - g.camX;
    ctx.font = "28px serif";
    ctx.fillText("💩", lbsx + 15, g.litterBox.y - 5);
  }

  if (g.transitionAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = g.transitionAlpha;
    ctx.fillStyle = g.transitionTarget === "hell" ? "#1a0000" : "#fff";
    ctx.fillRect(0, 0, CW, CH);
    ctx.font = "50px serif";
    const em = g.transitionTarget === "hell" ? "🔥" : "✨";
    for (let i = 0; i < 14; i++) ctx.fillText(em, Math.random() * CW, Math.random() * CH);
    ctx.restore();
  }

  drawHUD(ctx, g);

  // Level intro overlay
  if (g.showLevelIntro) {
    ctx.save();
    const a = Math.min(g.levelIntroTimer / 30, 1);
    ctx.globalAlpha = a * 0.8;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, CW, CH);
    ctx.globalAlpha = a;
    ctx.textAlign = "center";
    ctx.font = "bold 52px Arial";
    ctx.fillStyle = g.world === "paradise" ? "#4CAF50" : "#FF4500";
    ctx.shadowColor = g.world === "paradise" ? "#2E7D32" : "#CC0000";
    ctx.shadowBlur = 20;
    ctx.fillText(`Level ${g.level + 1}`, CW / 2, CH * 0.35);
    ctx.shadowBlur = 0;
    ctx.font = "bold 36px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(lv.name, CW / 2, CH * 0.45);
    ctx.font = "20px Arial";
    ctx.fillStyle = "#ccc";
    ctx.fillText(lv.description, CW / 2, CH * 0.54);
    ctx.font = "18px Arial";
    ctx.fillStyle = "#aaa";
    ctx.fillText("🚽 Reach the litter box to complete the level!", CW / 2, CH * 0.62);
    ctx.textAlign = "left";
    ctx.restore();
  }

  // Level complete
  if (g.levelComplete && g.levelTransitionTimer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, CW, CH);
    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
    ctx.font = "bold 48px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "#FF8C00";
    ctx.shadowBlur = 20;
    ctx.fillText(g.player.pooping ? "💩 TAKING A DUMP... 💩" : "✅ LEVEL COMPLETE!", CW / 2, CH * 0.35);
    ctx.shadowBlur = 0;
    ctx.font = "28px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(`Score: ${g.score}`, CW / 2, CH * 0.48);
    ctx.font = "22px Arial";
    ctx.fillStyle = "#aaa";
    ctx.fillText(`Next: ${LEVELS[(g.level + 1) % LEVELS.length].name}`, CW / 2, CH * 0.57);
    ctx.textAlign = "left";
    ctx.restore();
  }

  // Start screen
  if (!g.started && !g.gameOver) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, CW, CH);
    ctx.textAlign = "center";
    ctx.font = "bold 60px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "#FF6600";
    ctx.shadowBlur = 30;
    ctx.fillText("🐱 CAT RUNNER 🐱", CW / 2, CH * 0.25);
    ctx.shadowBlur = 0;
    ctx.font = "24px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText("Run through Paradise & Hell!", CW / 2, CH * 0.34);
    ctx.font = "20px Arial";
    ctx.fillStyle = "#ccc";
    ctx.fillText("Reach the litter box to complete each level!", CW / 2, CH * 0.41);
    ctx.font = "30px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.globalAlpha = Math.sin(g.tick * 0.05) * 0.3 + 0.7;
    ctx.fillText("Press any key to start", CW / 2, CH * 0.52);
    ctx.globalAlpha = 1;
    ctx.font = "17px Arial";
    ctx.fillStyle = "#999";
    ctx.fillText("← → or A D to move  |  SPACE or ↑ to jump", CW / 2, CH * 0.62);
    ctx.fillText("F or E to shoot (need powerup 🌈🔥)  |  💩 Poop at the litter box!", CW / 2, CH * 0.67);
    ctx.fillText(`8 unique levels  |  Gets harder each level!`, CW / 2, CH * 0.72);
    ctx.textAlign = "left";
    ctx.restore();
  }

  // Game over
  if (g.gameOver) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, CW, CH);
    ctx.textAlign = "center";
    ctx.font = "bold 64px Arial";
    ctx.fillStyle = "#FF3333";
    ctx.shadowColor = "#FF0000";
    ctx.shadowBlur = 30;
    ctx.fillText("GAME OVER", CW / 2, CH * 0.28);
    ctx.shadowBlur = 0;
    ctx.font = "32px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`Score: ${g.score}`, CW / 2, CH * 0.4);
    ctx.font = "22px Arial";
    ctx.fillStyle = "#aaa";
    ctx.fillText(`Best: ${g.highScore}  |  Reached Level ${g.level + 1}`, CW / 2, CH * 0.48);
    if (g.score >= g.highScore && g.score > 0) {
      ctx.font = "bold 24px Arial";
      ctx.fillStyle = "#FFD700";
      ctx.globalAlpha = Math.sin(g.tick * 0.08) * 0.3 + 0.7;
      ctx.fillText("🏆 NEW HIGH SCORE! 🏆", CW / 2, CH * 0.56);
      ctx.globalAlpha = 1;
    }
    ctx.font = "28px Arial";
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = Math.sin(g.tick * 0.05) * 0.3 + 0.7;
    ctx.fillText("Press SPACE to restart", CW / 2, CH * 0.66);
    ctx.textAlign = "left";
    ctx.restore();
  }

  ctx.restore();
}
