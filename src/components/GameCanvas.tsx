'use client';

import { useEffect, useRef, useState } from 'react';

const TILE_SIZE = 40;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 25;

interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: string;
  status: string;
  role: string;
}

interface GameCanvasProps {
  players: Player[];
  onMove: (x: number, y: number, direction: string) => void;
  currentSocketId?: string;
}

export default function GameCanvas({ players, onMove, currentSocketId }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localPlayer, setLocalPlayer] = useState<{ x: number; y: number }>({ x: 20, y: 12 });
  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let lastMoveTime = 0;

    // Helper to draw a plant
    const drawPlant = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
      ctx.fillStyle = '#bbf7d0'; // Pot base
      ctx.beginPath();
      ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Leaves
      const drawLeaf = (cx: number, cy: number, r: number, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      };

      drawLeaf(x, y, radius, '#15803d');
      drawLeaf(x - 5, y - 5, radius * 0.7, '#16a34a');
      drawLeaf(x + 5, y + 5, radius * 0.8, '#22c55e');
      drawLeaf(x - 4, y + 6, radius * 0.6, '#4ade80');
      drawLeaf(x + 4, y - 4, radius * 0.7, '#15803d');
    };

    // Helper to draw rounded rect
    const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
    };

    const render = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw Background (Modern Light Floor)
      ctx.fillStyle = '#f8fafc'; // Very light gray floor
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw modern large tiles (every 2 TILE_SIZE)
      ctx.strokeStyle = '#e2e8f0'; 
      ctx.lineWidth = 1;
      for (let i = 0; i < MAP_WIDTH; i += 2) {
        for (let j = 0; j < MAP_HEIGHT; j += 2) {
          ctx.strokeRect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE * 2);
        }
      }

      // 2. Draw Zones & Furniture
      
      // -- Reception Area (Top Center)
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(15 * TILE_SIZE, 0, 10 * TILE_SIZE, 5 * TILE_SIZE);
      
      // Curved Reception Desk
      ctx.fillStyle = '#fcd34d'; // Wood color
      ctx.beginPath();
      ctx.roundRect(16 * TILE_SIZE, 3 * TILE_SIZE, 8 * TILE_SIZE, 1.5 * TILE_SIZE, [10, 10, 10, 10]);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1'; // Top counter
      ctx.beginPath();
      ctx.roundRect(16 * TILE_SIZE + 5, 3 * TILE_SIZE + 5, 8 * TILE_SIZE - 10, 1.5 * TILE_SIZE - 10, [5, 5, 5, 5]);
      ctx.fill();

      // -- Co-working Desks (Right and Left Sides)
      const deskColor = '#fde68a'; // Light oak wood
      const chairColor = '#94a3b8';

      // Function to draw a workstation cluster
      const drawCluster = (startX: number, startY: number) => {
        // Table
        drawRoundedRect(ctx, startX * TILE_SIZE, startY * TILE_SIZE, 4 * TILE_SIZE, 2 * TILE_SIZE, 10, deskColor);
        // Chairs
        drawRoundedRect(ctx, startX * TILE_SIZE + 20, startY * TILE_SIZE - 20, 30, 20, 5, chairColor);
        drawRoundedRect(ctx, startX * TILE_SIZE + 100, startY * TILE_SIZE - 20, 30, 20, 5, chairColor);
        drawRoundedRect(ctx, startX * TILE_SIZE + 20, startY * TILE_SIZE + 2 * TILE_SIZE, 30, 20, 5, chairColor);
        drawRoundedRect(ctx, startX * TILE_SIZE + 100, startY * TILE_SIZE + 2 * TILE_SIZE, 30, 20, 5, chairColor);
      };

      drawCluster(4, 8);
      drawCluster(4, 15);
      drawCluster(28, 8);
      drawCluster(28, 15);

      // -- Waiting Area / Lounge (Bottom Left)
      ctx.fillStyle = '#dbeafe'; // Soft blue rug
      ctx.fillRect(2 * TILE_SIZE, 19 * TILE_SIZE, 8 * TILE_SIZE, 5 * TILE_SIZE);
      
      // Sofas (Orange & Blue)
      drawRoundedRect(ctx, 3 * TILE_SIZE, 19.5 * TILE_SIZE, 3 * TILE_SIZE, 1 * TILE_SIZE, 10, '#f97316');
      drawRoundedRect(ctx, 7 * TILE_SIZE, 21 * TILE_SIZE, 1 * TILE_SIZE, 3 * TILE_SIZE, 10, '#0ea5e9');
      // Coffee Table
      drawRoundedRect(ctx, 4 * TILE_SIZE, 21.5 * TILE_SIZE, 1.5 * TILE_SIZE, 1.5 * TILE_SIZE, 30, '#fff');

      // -- Plants
      drawPlant(ctx, 10 * TILE_SIZE, 4 * TILE_SIZE, 25);
      drawPlant(ctx, 30 * TILE_SIZE, 4 * TILE_SIZE, 25);
      drawPlant(ctx, 12 * TILE_SIZE, 20 * TILE_SIZE, 30);
      drawPlant(ctx, 25 * TILE_SIZE, 12 * TILE_SIZE, 25);


      // 3. Handle Movement
      if (time - lastMoveTime > 120) {
        let dx = 0; let dy = 0; let direction = 'down';
        if (keys.current['ArrowUp'] || keys.current['w']) { dy -= 1; direction = 'up'; }
        else if (keys.current['ArrowDown'] || keys.current['s']) { dy += 1; direction = 'down'; }
        else if (keys.current['ArrowLeft'] || keys.current['a']) { dx -= 1; direction = 'left'; }
        else if (keys.current['ArrowRight'] || keys.current['d']) { dx += 1; direction = 'right'; }

        if (dx !== 0 || dy !== 0) {
          setLocalPlayer((prev) => {
            const newX = Math.max(0, Math.min(MAP_WIDTH - 1, prev.x + dx));
            const newY = Math.max(0, Math.min(MAP_HEIGHT - 1, prev.y + dy));
            if (newX !== prev.x || newY !== prev.y) onMove(newX, newY, direction);
            return { x: newX, y: newY };
          });
          lastMoveTime = time;
        }
      }

      // 4. Draw Players (Avatar style)
      players.forEach((p) => {
        const isLocal = p.id === currentSocketId;
        const px = isLocal ? localPlayer.x : p.x;
        const py = isLocal ? localPlayer.y : p.y;
        
        // Target rendering coordinates
        const xPos = px * TILE_SIZE + TILE_SIZE / 2;
        const yPos = py * TILE_SIZE + TILE_SIZE / 2;

        // Shadow
        ctx.beginPath();
        ctx.ellipse(xPos, yPos + 15, 12, 6, 0, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fill();

        // Body Color based on Role
        const bodyColor = p.role === 'DIRECTOR' ? '#f59e0b' : p.role === 'EMPLOYEE' ? '#3b82f6' : '#10b981';
        const strokeColor = p.role === 'DIRECTOR' ? '#b45309' : p.role === 'EMPLOYEE' ? '#1d4ed8' : '#047857';
        
        // Draw Body (Capsule shape)
        ctx.beginPath();
        ctx.roundRect(xPos - 12, yPos - 20, 24, 34, 12);
        ctx.fillStyle = bodyColor;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = strokeColor;
        ctx.stroke();

        // Draw Visor / Head
        ctx.beginPath();
        ctx.roundRect(xPos - 8, yPos - 12, 20, 10, 5);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.stroke();

        // Status Indicator
        if (p.status !== 'OFFLINE') {
          ctx.beginPath();
          ctx.arc(xPos + 15, yPos - 20, 6, 0, 2 * Math.PI);
          ctx.fillStyle = p.status === 'ONLINE' ? '#22c55e' : p.status === 'BUSY' ? '#ef4444' : '#eab308';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.stroke();
        }

        // Name Tag
        ctx.fillStyle = '#334155'; // Dark slate for light background
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'center';
        
        // Name tag background
        const textWidth = ctx.measureText(p.name).width;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.roundRect(xPos - textWidth/2 - 4, yPos - 38, textWidth + 8, 16, 4);
        ctx.fill();
        
        ctx.fillStyle = '#0f172a';
        ctx.fillText(p.name, xPos, yPos - 26);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [players, currentSocketId, localPlayer, onMove]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#020617]">
      <canvas
        ref={canvasRef}
        width={MAP_WIDTH * TILE_SIZE}
        height={MAP_HEIGHT * TILE_SIZE}
        className="shadow-[0_0_80px_rgba(0,0,0,0.7)] border-4 border-slate-800 rounded-2xl bg-white"
      />
    </div>
  );
}
