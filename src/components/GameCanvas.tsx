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

    const setShadow = (ctx: CanvasRenderingContext2D, blur: number, y: number, opacity: number) => {
      ctx.shadowColor = `rgba(0, 0, 0, ${opacity})`;
      ctx.shadowBlur = blur;
      ctx.shadowOffsetY = y;
      ctx.shadowOffsetX = 0;
    };

    const clearShadow = (ctx: CanvasRenderingContext2D) => {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    };

    // Helper to draw a modern plant
    const drawPlant = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
      setShadow(ctx, 15, 8, 0.2);
      
      // Pot
      ctx.fillStyle = '#e2e8f0'; // White/gray ceramic pot
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Pot inner dirt
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(x, y, radius - 3, 0, Math.PI * 2);
      ctx.fill();

      clearShadow(ctx);

      // Leaves with gradients
      const drawLeaf = (cx: number, cy: number, r: number, angle: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        const grad = ctx.createLinearGradient(0, 0, r, 0);
        grad.addColorStop(0, '#16a34a');
        grad.addColorStop(1, '#14532d');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(r/2, 0, r/2, r/4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      for(let i=0; i<8; i++) {
        drawLeaf(x, y, radius * 1.5, (Math.PI / 4) * i);
      }
      for(let i=0; i<6; i++) {
        drawLeaf(x, y, radius * 1.1, (Math.PI / 3) * i + 0.5);
      }
    };

    // Helper to draw realistic top-down desk with computers
    const drawDesk = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
      setShadow(ctx, 15, 10, 0.15);
      
      // Desk surface (Wood gradient)
      const deskGrad = ctx.createLinearGradient(x, y, x, y + h);
      deskGrad.addColorStop(0, '#fcd34d'); // Light wood
      deskGrad.addColorStop(1, '#d97706'); // Darker wood
      
      ctx.fillStyle = deskGrad;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();
      clearShadow(ctx);

      // Desk border
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#b45309';
      ctx.stroke();

      // Monitor 1
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(x + 20, y + 15, 30, 8, 2);
      ctx.fill();
      // Keyboard 1
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(x + 22, y + 30, 26, 10);

      // Monitor 2 (if desk is wide enough)
      if (w > 100) {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(x + w - 50, y + 15, 30, 8, 2);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(x + w - 48, y + 30, 26, 10);
      }
    };

    const drawChair = (ctx: CanvasRenderingContext2D, x: number, y: number, facing: 'up' | 'down') => {
      setShadow(ctx, 10, 5, 0.2);
      ctx.fillStyle = '#334155'; // Dark gray premium chair
      ctx.beginPath();
      ctx.roundRect(x, y, 26, 26, 8);
      ctx.fill();
      clearShadow(ctx);
      
      // Backrest
      ctx.fillStyle = '#1e293b';
      if (facing === 'up') {
        ctx.beginPath(); ctx.roundRect(x, y + 20, 26, 6, 3); ctx.fill();
      } else {
        ctx.beginPath(); ctx.roundRect(x, y, 26, 6, 3); ctx.fill();
      }
    };

    const render = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw Premium Floor
      ctx.fillStyle = '#f8fafc'; // White/gray base
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle modern tile grid
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)'; 
      ctx.lineWidth = 1;
      for (let i = 0; i < MAP_WIDTH; i += 2) {
        for (let j = 0; j < MAP_HEIGHT; j += 2) {
          ctx.strokeRect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE * 2);
        }
      }

      // 2. Draw Zones & Furniture
      
      // -- Reception Area --
      // Glass Wall Area
      ctx.fillStyle = 'rgba(241, 245, 249, 0.7)';
      ctx.fillRect(13 * TILE_SIZE, 0, 14 * TILE_SIZE, 6 * TILE_SIZE);
      
      // Reception Desk
      setShadow(ctx, 20, 15, 0.1);
      ctx.fillStyle = '#ffffff'; // White marble counter
      ctx.beginPath();
      ctx.roundRect(15 * TILE_SIZE, 3.5 * TILE_SIZE, 10 * TILE_SIZE, 1.5 * TILE_SIZE, 15);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();
      clearShadow(ctx);

      // Reception Monitors
      ctx.fillStyle = '#0f172a';
      ctx.roundRect(16.5 * TILE_SIZE, 3.8 * TILE_SIZE, 1.5 * TILE_SIZE, 10, 2); ctx.fill();
      ctx.roundRect(22 * TILE_SIZE, 3.8 * TILE_SIZE, 1.5 * TILE_SIZE, 10, 2); ctx.fill();

      // -- Co-working Workstations --
      const drawCluster = (startX: number, startY: number) => {
        // Rug under desk
        ctx.fillStyle = '#f1f5f9';
        ctx.roundRect((startX - 0.5) * TILE_SIZE, (startY - 1) * TILE_SIZE, 5 * TILE_SIZE, 4 * TILE_SIZE, 10);
        ctx.fill();

        // Table
        drawDesk(ctx, startX * TILE_SIZE, startY * TILE_SIZE, 4 * TILE_SIZE, 2 * TILE_SIZE);
        
        // Chairs
        drawChair(ctx, startX * TILE_SIZE + 20, startY * TILE_SIZE - 20, 'down');
        drawChair(ctx, startX * TILE_SIZE + 100, startY * TILE_SIZE - 20, 'down');
        drawChair(ctx, startX * TILE_SIZE + 20, startY * TILE_SIZE + 2 * TILE_SIZE - 6, 'up');
        drawChair(ctx, startX * TILE_SIZE + 100, startY * TILE_SIZE + 2 * TILE_SIZE - 6, 'up');
      };

      drawCluster(4, 9);
      drawCluster(4, 16);
      drawCluster(32, 9);
      drawCluster(32, 16);

      // -- Lounge Area (Bottom Left) --
      // Premium Rug
      setShadow(ctx, 10, 5, 0.05);
      const rugGrad = ctx.createLinearGradient(2 * TILE_SIZE, 20 * TILE_SIZE, 10 * TILE_SIZE, 25 * TILE_SIZE);
      rugGrad.addColorStop(0, '#e0f2fe');
      rugGrad.addColorStop(1, '#bae6fd');
      ctx.fillStyle = rugGrad;
      ctx.beginPath();
      ctx.roundRect(2 * TILE_SIZE, 20 * TILE_SIZE, 8 * TILE_SIZE, 4.5 * TILE_SIZE, 15);
      ctx.fill();
      clearShadow(ctx);
      
      // Modern Sofas
      setShadow(ctx, 15, 8, 0.15);
      // Main Sofa
      ctx.fillStyle = '#0284c7'; // Deep blue velvet
      ctx.beginPath(); ctx.roundRect(3 * TILE_SIZE, 20.5 * TILE_SIZE, 4 * TILE_SIZE, 1.2 * TILE_SIZE, 10); ctx.fill();
      // Sofa cushions
      ctx.fillStyle = '#0369a1';
      ctx.beginPath(); ctx.roundRect(3.2 * TILE_SIZE, 20.7 * TILE_SIZE, 1.8 * TILE_SIZE, 0.8 * TILE_SIZE, 5); ctx.fill();
      ctx.beginPath(); ctx.roundRect(5.1 * TILE_SIZE, 20.7 * TILE_SIZE, 1.7 * TILE_SIZE, 0.8 * TILE_SIZE, 5); ctx.fill();

      // Side Sofa
      ctx.fillStyle = '#ea580c'; // Burnt orange
      ctx.beginPath(); ctx.roundRect(7.5 * TILE_SIZE, 21.5 * TILE_SIZE, 1.2 * TILE_SIZE, 2.5 * TILE_SIZE, 10); ctx.fill();

      // Coffee Table (Glass/Wood)
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(5 * TILE_SIZE, 22.5 * TILE_SIZE, 20, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d97706'; ctx.lineWidth = 3; ctx.stroke();
      clearShadow(ctx);


      // -- Director Office (Glass Walls) --
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(28 * TILE_SIZE, 0, 12 * TILE_SIZE, 6 * TILE_SIZE);
      // Glass lines
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = 4;
      ctx.strokeRect(28 * TILE_SIZE, 0, 12 * TILE_SIZE, 6 * TILE_SIZE);
      
      // Executive Desk
      drawDesk(ctx, 31 * TILE_SIZE, 2 * TILE_SIZE, 5 * TILE_SIZE, 2.5 * TILE_SIZE);
      drawChair(ctx, 33 * TILE_SIZE, 1 * TILE_SIZE, 'down');
      
      // Executive plant
      drawPlant(ctx, 38 * TILE_SIZE, 1.5 * TILE_SIZE, 20);

      // -- General Plants --
      drawPlant(ctx, 10 * TILE_SIZE, 4 * TILE_SIZE, 25);
      drawPlant(ctx, 28 * TILE_SIZE, 4 * TILE_SIZE, 25);
      drawPlant(ctx, 12 * TILE_SIZE, 20 * TILE_SIZE, 30);
      drawPlant(ctx, 20 * TILE_SIZE, 15 * TILE_SIZE, 35); // Centerpiece plant
      drawPlant(ctx, 25 * TILE_SIZE, 23 * TILE_SIZE, 25);


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

      // 4. Draw Players (Professional Top-Down Avatars)
      players.forEach((p) => {
        const isLocal = p.id === currentSocketId;
        const px = isLocal ? localPlayer.x : p.x;
        const py = isLocal ? localPlayer.y : p.y;
        
        const xPos = px * TILE_SIZE + TILE_SIZE / 2;
        const yPos = py * TILE_SIZE + TILE_SIZE / 2;

        setShadow(ctx, 15, 10, 0.3);

        // Body Colors based on role
        const shirtColor = p.role === 'DIRECTOR' ? '#1e293b' : p.role === 'EMPLOYEE' ? '#0284c7' : '#059669';
        
        // Shoulders (Rounded Rect)
        ctx.beginPath();
        ctx.roundRect(xPos - 16, yPos - 10, 32, 20, 10);
        ctx.fillStyle = shirtColor;
        ctx.fill();

        // Head (Circle)
        ctx.beginPath();
        ctx.arc(xPos, yPos, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#fcd34d'; // Skin tone (abstract)
        ctx.fill();
        
        // Hair (Abstract curve)
        ctx.beginPath();
        ctx.arc(xPos, yPos - 2, 10, Math.PI, 0);
        ctx.fillStyle = '#451a03'; // Dark hair
        ctx.fill();

        clearShadow(ctx);

        // Status Indicator (Glowing dot)
        if (p.status !== 'OFFLINE') {
          ctx.beginPath();
          ctx.arc(xPos + 12, yPos - 12, 5, 0, 2 * Math.PI);
          ctx.fillStyle = p.status === 'ONLINE' ? '#22c55e' : p.status === 'BUSY' ? '#ef4444' : '#eab308';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#fff';
          ctx.stroke();
        }

        // Professional Name Tag
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'center';
        
        const textWidth = ctx.measureText(p.name).width;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.roundRect(xPos - textWidth/2 - 6, yPos - 32, textWidth + 12, 18, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = '#0f172a';
        ctx.fillText(p.name, xPos, yPos - 19);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [players, currentSocketId, localPlayer, onMove]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#0f172a]">
      <canvas
        ref={canvasRef}
        width={MAP_WIDTH * TILE_SIZE}
        height={MAP_HEIGHT * TILE_SIZE}
        className="shadow-[0_0_80px_rgba(0,0,0,0.5)] rounded-xl bg-white"
      />
    </div>
  );
}
