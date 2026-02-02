"use client";

import { useEffect, useRef, useCallback } from "react";

// ─── Constants ───────────────────────────────────────────
const CANVAS_W = 800;
const CANVAS_H = 500;
const GRAVITY = 0.6;
const JUMP_FORCE = -13;
const PLAYER_SPEED = 5;
const GROUND_Y = 400;
const SCROLL_SPEED = 3;
const PORTAL_INTERVAL = 2800;
const OBSTACLE_INTERVAL = 1200;
const COIN_INTERVAL = 900;
const PARTICLE_COUNT = 30;

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
  transitionAlpha: number;
  transitionTarget: World | null;
  screenShake: number;
}

interface BackgroundElement {
  x: number;
  y: number;
  size: number;
  type: string;
  speed: number;
  bobOffset: number;
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
  const sunX = 680;
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
    ctx.arc(400, 250, 280 - i * 15, Math.PI, 0);
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 14;
    ctx.stroke();
  }
  ctx.restore();

  // Clouds
  const clouds = [
    { x: (100 - offset * 0.15) % (CANVAS_W + 200) - 100, y: 50, s: 1 },
    { x: (350 - offset * 0.1) % (CANVAS_W + 200) - 100, y: 30, s: 0.8 },
    { x: (600 - offset * 0.12) % (CANVAS_W + 200) - 100, y: 70, s: 0.9 },
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
  const moonX = 680;
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
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 250 - offset * 0.08 + tick * 0.2) % (CANVAS_W + 200)) - 100;
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
  // Hills background
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

  // Main ground
  const gGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
  gGrad.addColorStop(0, "#4CAF50");
  gGrad.addColorStop(0.3, "#388E3C");
  gGrad.addColorStop(1, "#2E7D32");
  ctx.fillStyle = gGrad;
  ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

  // Grass tufts
  ctx.strokeStyle = "#66BB6A";
  ctx.lineWidth = 2;
  for (let i = 0; i < 30; i++) {
    const gx = ((i * 30 - offset * 0.5) % CANVAS_W + CANVAS_W) % CANVAS_W;
    const sway = Math.sin(tick * 0.05 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(gx, GROUND_Y);
    ctx.lineTo(gx + sway - 3, GROUND_Y - 12);
    ctx.moveTo(gx, GROUND_Y);
    ctx.lineTo(gx + sway + 3, GROUND_Y - 10);
    ctx.stroke();
  }

  // Flowers on ground
  const flowerEmojis = ["🌸", "🌺", "🌻", "🌷"];
  ctx.font = "16px serif";
  for (let i = 0; i < 12; i++) {
    const fx = ((i * 75 - offset * 0.4) % CANVAS_W + CANVAS_W) % CANVAS_W;
    const bob = Math.sin(tick * 0.03 + i * 2) * 3;
    ctx.fillText(flowerEmojis[i % 4], fx, GROUND_Y - 2 + bob);
  }
}

function drawHellGround(ctx: CanvasRenderingContext2D, offset: number, tick: number) {
  // Lava glow
  ctx.save();
  const lavaGrad = ctx.createLinearGradient(0, GROUND_Y - 20, 0, CANVAS_H);
  lavaGrad.addColorStop(0, "#4d0000");
  lavaGrad.addColorStop(0.3, "#8B0000");
  lavaGrad.addColorStop(0.6, "#CC3300");
  lavaGrad.addColorStop(1, "#FF4500");
  ctx.fillStyle = lavaGrad;
  ctx.fillRect(0, GROUND_Y - 20, CANVAS_W, CANVAS_H - GROUND_Y + 20);
  ctx.restore();

  // Lava bubbles
  for (let i = 0; i < 8; i++) {
    const bx = ((i * 110 - offset * 0.2 + tick * 0.5) % CANVAS_W + CANVAS_W) % CANVAS_W;
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

  // Lava cracks
  ctx.strokeStyle = "#FF8C00";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#FF4500";
  ctx.shadowBlur = 8;
  for (let i = 0; i < 10; i++) {
    const cx = ((i * 90 - offset * 0.3) % CANVAS_W + CANVAS_W) % CANVAS_W;
    ctx.beginPath();
    ctx.moveTo(cx, GROUND_Y + 10);
    ctx.lineTo(cx + 15, GROUND_Y + 25);
    ctx.lineTo(cx + 5, GROUND_Y + 45);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Skull decorations
  ctx.font = "20px serif";
  for (let i = 0; i < 5; i++) {
    const sx = ((i * 180 - offset * 0.35) % CANVAS_W + CANVAS_W) % CANVAS_W;
    ctx.fillText("💀", sx, GROUND_Y - 5);
  }
}

function drawBackgroundElements(
  ctx: CanvasRenderingContext2D,
  elements: BackgroundElement[],
  offset: number,
  tick: number,
  world: World
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
    // Grass top
    ctx.fillStyle = "#81C784";
    ctx.fillRect(sx + 2, p.y, p.w - 4, 4);
    // Flowers on top
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
    // Lava drip
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
  const sx = o.x - camX;
  if (sx > CANVAS_W + 50 || sx + o.w < -50) return;

  ctx.save();
  if (o.world === "paradise") {
    // Thorny bush or rock
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
    // Hell obstacles
    if (o.type === "fireball") {
      const bob = Math.sin(tick * 0.12 + o.frame) * 12;
      ctx.font = `${o.h}px serif`;
      ctx.fillText("☄️", sx, o.y + bob);
      // Glow
      ctx.shadowColor = "#FF4500";
      ctx.shadowBlur = 15;
      ctx.fillText("☄️", sx, o.y + bob);
    } else if (o.type === "demon") {
      const shake = Math.sin(tick * 0.2) * 3;
      ctx.font = `${o.h}px serif`;
      ctx.fillText("👹", sx + shake, o.y + o.h - 5);
    } else {
      ctx.font = `${o.h}px serif`;
      ctx.fillText("🔥", sx, o.y + o.h - 5);
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
  // Outer glow
  const glowColor = p.targetWorld === "hell" ? "rgba(255,0,0," : "rgba(100,255,100,";
  const innerColor = p.targetWorld === "hell" ? "#FF1A1A" : "#44FF44";
  const midColor = p.targetWorld === "hell" ? "#660000" : "#006600";

  for (let i = 3; i >= 0; i--) {
    ctx.beginPath();
    ctx.arc(cx, cy, r + i * 8, 0, Math.PI * 2);
    ctx.fillStyle = glowColor + (0.1 - i * 0.02) + ")";
    ctx.fill();
  }

  // Swirl
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, innerColor);
  grad.addColorStop(0.5, midColor);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Spinning arcs
  for (let i = 0; i < 4; i++) {
    const angle = tick * 0.05 + (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 5, angle, angle + 0.8);
    ctx.strokeStyle = innerColor;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Label
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

function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, world: World, tick: number) {
  ctx.save();

  if (p.invincible > 0 && Math.floor(tick / 4) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  const emoji = world === "paradise" ? "😺" : "🙀";
  const bounce = p.onGround ? Math.abs(Math.sin(tick * 0.15)) * 3 : 0;

  // Shadow
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.ellipse(p.x + p.w / 2, GROUND_Y + 2, p.w / 2, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();

  ctx.font = `${p.h + 4}px serif`;
  ctx.fillText(emoji, p.x - 4, p.y + p.h - bounce - 2);

  // Running particles
  if (p.onGround && Math.abs(p.vx) > 0.5 && tick % 4 === 0) {
    ctx.globalAlpha = 0.4;
    ctx.font = "10px serif";
    ctx.fillText("💨", p.x - 8, p.y + p.h);
  }

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
  score: number,
  lives: number,
  world: World,
  highScore: number,
  combo: number
) {
  // Score background
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = world === "paradise" ? "#1B5E20" : "#4D0000";
  roundRect(ctx, 10, 10, 200, 80, 10);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.font = "bold 20px Arial";
  ctx.fillStyle = "#FFD700";
  ctx.fillText(`Score: ${score}`, 25, 38);

  ctx.font = "16px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText(`Best: ${highScore}`, 25, 60);

  // Lives
  ctx.font = "22px serif";
  for (let i = 0; i < lives; i++) {
    ctx.fillText("❤️", 25 + i * 28, 82);
  }

  // Combo
  if (combo > 1) {
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`x${combo} COMBO!`, CANVAS_W - 140, 35);
  }

  // World indicator
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = world === "paradise" ? "#1B5E20" : "#4D0000";
  roundRect(ctx, CANVAS_W / 2 - 60, 10, 120, 30, 8);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.font = "bold 14px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(world === "paradise" ? "🌈 PARADISE" : "🔥 HELL", CANVAS_W / 2, 30);
  ctx.textAlign = "left";

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

  const initGame = useCallback(() => {
    const hs = typeof window !== "undefined"
      ? parseInt(localStorage.getItem("catrunner-hs") || "0", 10)
      : 0;

    gameRef.current = {
      running: true,
      started: false,
      gameOver: false,
      player: {
        x: 100,
        y: GROUND_Y - 45,
        w: 40,
        h: 45,
        vy: 0,
        vx: 0,
        onGround: true,
        lives: 3,
        invincible: 0,
        frame: 0,
        frameTimer: 0,
      },
      platforms: [],
      obstacles: [],
      portals: [],
      coins: [],
      particles: [],
      bgElements: [],
      stars: [],
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
      transitionAlpha: 0,
      transitionTarget: null,
      screenShake: 0,
    };

    // Generate initial background elements
    generateBgElements(gameRef.current.bgElements, "paradise");
    generateStars(gameRef.current.stars);
    generateInitialPlatforms(gameRef.current.platforms, "paradise");
  }, []);

  useEffect(() => {
    initGame();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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
      if ((e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") && gameRef.current.player.onGround) {
        gameRef.current.player.vy = JUMP_FORCE;
        gameRef.current.player.onGround = false;
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
    <div className="flex h-screen w-screen items-center justify-center bg-black">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="rounded-lg shadow-2xl"
        style={{ imageRendering: "auto" }}
      />
    </div>
  );
}

// ─── Generation ──────────────────────────────────────────
function generateBgElements(arr: BackgroundElement[], world: World) {
  arr.length = 0;
  if (world === "paradise") {
    const types = ["🌳", "🌲", "🌴", "🏠", "⛪"];
    for (let i = 0; i < 15; i++) {
      arr.push({
        x: Math.random() * CANVAS_W * 3,
        y: GROUND_Y - 60 - Math.random() * 30,
        size: 35 + Math.random() * 20,
        type: types[Math.floor(Math.random() * types.length)],
        speed: 0.2 + Math.random() * 0.3,
        bobOffset: Math.random() * Math.PI * 2,
      });
    }
  } else {
    const types = ["🏚️", "🪦", "⚰️", "🦇"];
    for (let i = 0; i < 12; i++) {
      arr.push({
        x: Math.random() * CANVAS_W * 3,
        y: GROUND_Y - 55 - Math.random() * 30,
        size: 30 + Math.random() * 20,
        type: types[Math.floor(Math.random() * types.length)],
        speed: 0.2 + Math.random() * 0.3,
        bobOffset: Math.random() * Math.PI * 2,
      });
    }
  }
}

function generateStars(arr: Star[]) {
  arr.length = 0;
  for (let i = 0; i < 60; i++) {
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
  const heights = [GROUND_Y - 90, GROUND_Y - 140, GROUND_Y - 190];
  for (let i = 0; i < 5; i++) {
    arr.push({
      x: 400 + i * 350,
      y: heights[Math.floor(Math.random() * heights.length)],
      w: 80 + Math.random() * 60,
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
    y: isFlying ? GROUND_Y - 80 - Math.random() * 60 : GROUND_Y - 40,
    w: 35,
    h: 38,
    type,
    world: g.world,
    frame: Math.random() * Math.PI * 2,
  });
}

function spawnPortal(g: GameState) {
  const spawnX = g.camX + CANVAS_W + 80;
  g.portals.push({
    x: spawnX,
    y: GROUND_Y - 90,
    w: 60,
    h: 80,
    targetWorld: g.world === "paradise" ? "hell" : "paradise",
    pulse: Math.random() * Math.PI * 2,
  });
}

function spawnCoin(g: GameState) {
  const spawnX = g.camX + CANVAS_W + 30;
  const isHigh = Math.random() > 0.5;
  g.coins.push({
    x: spawnX,
    y: isHigh ? GROUND_Y - 100 - Math.random() * 50 : GROUND_Y - 30,
    r: 14,
    world: g.world,
    collected: false,
    bobOffset: Math.random() * Math.PI * 2,
  });
}

function spawnPlatform(g: GameState) {
  const spawnX = g.camX + CANVAS_W + 100;
  const heights = [GROUND_Y - 90, GROUND_Y - 140, GROUND_Y - 190];
  g.platforms.push({
    x: spawnX,
    y: heights[Math.floor(Math.random() * heights.length)],
    w: 80 + Math.random() * 60,
    h: 18,
    world: g.world,
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

  // Horizontal movement
  p.vx = 0;
  if (g.keys["ArrowRight"] || g.keys["d"] || g.keys["D"]) p.vx = PLAYER_SPEED;
  if (g.keys["ArrowLeft"] || g.keys["a"] || g.keys["A"]) p.vx = -PLAYER_SPEED;

  // Auto scroll forward
  g.camX += SCROLL_SPEED;
  p.x += SCROLL_SPEED + p.vx;

  // Keep player on screen
  if (p.x < g.camX + 20) p.x = g.camX + 20;
  if (p.x + p.w > g.camX + CANVAS_W - 20) p.x = g.camX + CANVAS_W - 20 - p.w;

  // Gravity
  p.vy += GRAVITY;
  p.y += p.vy;

  // Ground collision
  if (p.y + p.h >= GROUND_Y) {
    p.y = GROUND_Y - p.h;
    p.vy = 0;
    p.onGround = true;
  }

  // Platform collision
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

  // Invincibility timer
  if (p.invincible > 0) p.invincible--;

  // Combo timer
  if (g.comboTimer > 0) {
    g.comboTimer--;
    if (g.comboTimer <= 0) g.combo = 0;
  }

  // Score from distance
  if (g.tick % 10 === 0) g.score++;

  // Spawn obstacles
  if (g.camX - g.lastObstacle > OBSTACLE_INTERVAL) {
    spawnObstacle(g);
    g.lastObstacle = g.camX;
  }

  // Spawn portals
  if (g.camX - g.lastPortal > PORTAL_INTERVAL) {
    spawnPortal(g);
    g.lastPortal = g.camX;
  }

  // Spawn coins
  if (g.camX - g.lastCoin > COIN_INTERVAL) {
    spawnCoin(g);
    g.lastCoin = g.camX;
    // Sometimes spawn a line of coins
    if (Math.random() > 0.6) {
      for (let i = 1; i <= 3; i++) {
        g.coins.push({
          x: g.camX + CANVAS_W + 30 + i * 40,
          y: GROUND_Y - 30,
          r: 14,
          world: g.world,
          collected: false,
          bobOffset: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  // Spawn platforms
  if (g.camX - g.lastPlatform > 400) {
    spawnPlatform(g);
    g.lastPlatform = g.camX;
  }

  // Obstacle collision
  g.obstacles.forEach((o) => {
    const ox = o.type === "bee" || o.type === "fireball" ? o.x : o.x;
    const oy = o.type === "bee" ? o.y + Math.sin(g.tick * 0.15 + o.frame) * 10 - o.h / 2 :
               o.type === "fireball" ? o.y + Math.sin(g.tick * 0.12 + o.frame) * 12 - o.h / 2 :
               o.y;
    if (
      p.invincible <= 0 &&
      p.x + p.w - 8 > ox &&
      p.x + 8 < ox + o.w &&
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
      spawnParticles(
        g.particles,
        c.x,
        c.y,
        c.world === "paradise" ? "#FFD700" : "#00FFFF",
        8
      );
    }
  });

  // Portal collision
  g.portals.forEach((portal) => {
    const px = portal.x;
    if (
      p.x + p.w > px &&
      p.x < px + portal.w &&
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
      // Update existing platform worlds
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

  // Screen shake decay
  if (g.screenShake > 0) g.screenShake--;

  // Cleanup off-screen objects
  const cleanX = g.camX - 200;
  g.obstacles = g.obstacles.filter((o) => o.x > cleanX);
  g.portals = g.portals.filter((p) => p.x > cleanX);
  g.coins = g.coins.filter((c) => c.x > cleanX && !c.collected);
  g.platforms = g.platforms.filter((p) => p.x + p.w > cleanX);
}

// ─── Draw ────────────────────────────────────────────────
function draw(ctx: CanvasRenderingContext2D, g: GameState) {
  ctx.save();

  // Screen shake
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
    // Stars in hell
    g.stars.forEach((s) => {
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.sin(g.tick * s.speed + s.twinkle) * 0.3;
      ctx.fillStyle = "#FF6666";
      ctx.fillRect(s.x, s.y, s.size, s.size);
      ctx.restore();
    });
  }

  // Background elements
  drawBackgroundElements(ctx, g.bgElements, g.camX, g.tick, g.world);

  // Ground
  if (g.world === "paradise") {
    drawParadiseGround(ctx, g.camX, g.tick);
  } else {
    drawHellGround(ctx, g.camX, g.tick);
  }

  // Platforms
  g.platforms.forEach((p) => drawPlatform(ctx, p, g.camX));

  // Coins
  g.coins.forEach((c) => drawCoin(ctx, c, g.camX, g.tick));

  // Portals
  g.portals.forEach((p) => drawPortal(ctx, p, g.camX, g.tick));

  // Obstacles
  g.obstacles.forEach((o) => drawObstacle(ctx, o, g.camX, g.tick));

  // Player
  const screenPlayerX = g.player.x - g.camX;
  drawPlayer(
    ctx,
    { ...g.player, x: screenPlayerX },
    g.world,
    g.tick
  );

  // Particles
  drawParticles(ctx, g.particles);

  // Transition overlay
  if (g.transitionAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = g.transitionAlpha;
    if (g.transitionTarget === "hell") {
      ctx.fillStyle = "#1a0000";
    } else {
      ctx.fillStyle = "#fff";
    }
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Fire / sparkle effect during transition
    ctx.font = "40px serif";
    const emoji = g.transitionTarget === "hell" ? "🔥" : "✨";
    for (let i = 0; i < 8; i++) {
      const tx = Math.random() * CANVAS_W;
      const ty = Math.random() * CANVAS_H;
      ctx.fillText(emoji, tx, ty);
    }
    ctx.restore();
  }

  // HUD
  drawHUD(ctx, g.score, g.player.lives, g.world, g.highScore, g.combo);

  // Start screen
  if (!g.started && !g.gameOver) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = "center";

    // Title
    ctx.font = "bold 48px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "#FF6600";
    ctx.shadowBlur = 20;
    ctx.fillText("🐱 CAT RUNNER 🐱", CANVAS_W / 2, 160);
    ctx.shadowBlur = 0;

    ctx.font = "20px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText("Run through Paradise & Hell!", CANVAS_W / 2, 210);

    ctx.font = "24px Arial";
    ctx.fillStyle = "#FFD700";
    const pulse = Math.sin(g.tick * 0.05) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillText("Press any key to start", CANVAS_W / 2, 280);
    ctx.globalAlpha = 1;

    ctx.font = "16px Arial";
    ctx.fillStyle = "#aaa";
    ctx.fillText("← → or A D to move  |  SPACE or ↑ to jump", CANVAS_W / 2, 340);
    ctx.fillText("Collect ⭐ and 💎  |  Dodge obstacles  |  Enter portals!", CANVAS_W / 2, 370);

    ctx.textAlign = "left";
    ctx.restore();
  }

  // Game over
  if (g.gameOver) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = "center";

    ctx.font = "bold 52px Arial";
    ctx.fillStyle = "#FF3333";
    ctx.shadowColor = "#FF0000";
    ctx.shadowBlur = 25;
    ctx.fillText("GAME OVER", CANVAS_W / 2, 170);
    ctx.shadowBlur = 0;

    ctx.font = "28px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`Score: ${g.score}`, CANVAS_W / 2, 230);

    ctx.font = "22px Arial";
    ctx.fillStyle = "#aaa";
    ctx.fillText(`Best: ${g.highScore}`, CANVAS_W / 2, 270);

    if (g.score >= g.highScore && g.score > 0) {
      ctx.font = "bold 20px Arial";
      ctx.fillStyle = "#FFD700";
      const np = Math.sin(g.tick * 0.08) * 0.3 + 0.7;
      ctx.globalAlpha = np;
      ctx.fillText("🏆 NEW HIGH SCORE! 🏆", CANVAS_W / 2, 310);
      ctx.globalAlpha = 1;
    }

    ctx.font = "22px Arial";
    ctx.fillStyle = "#fff";
    const pulse = Math.sin(g.tick * 0.05) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillText("Press SPACE to restart", CANVAS_W / 2, 360);

    ctx.textAlign = "left";
    ctx.restore();
  }

  ctx.restore();
}
