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
  const [localPlayer, setLocalPlayer] = useState<{ x: number; y: number }>({ x: 10, y: 10 });
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

    const render = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw Background (Floor)
      ctx.fillStyle = '#1e293b'; // Slate-800 floor
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid
      ctx.strokeStyle = '#334155'; // Slate-700
      ctx.lineWidth = 1;
      for (let i = 0; i < MAP_WIDTH; i++) {
        for (let j = 0; j < MAP_HEIGHT; j++) {
          ctx.strokeRect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }

      // 2. Draw Zones & Furniture
      // Reception Zone
      ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.fillRect(2 * TILE_SIZE, 2 * TILE_SIZE, 8 * TILE_SIZE, 6 * TILE_SIZE);
      ctx.fillStyle = '#0284c7'; // Reception Desk
      ctx.fillRect(4 * TILE_SIZE, 4 * TILE_SIZE, 4 * TILE_SIZE, 1 * TILE_SIZE);
      ctx.fillStyle = '#fff';
      ctx.font = '14px Inter';
      ctx.fillText('Qabulxona', 6 * TILE_SIZE, 3.5 * TILE_SIZE);

      // Director Office (Glass walls simulation)
      ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
      ctx.fillRect(25 * TILE_SIZE, 2 * TILE_SIZE, 12 * TILE_SIZE, 8 * TILE_SIZE);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.strokeRect(25 * TILE_SIZE, 2 * TILE_SIZE, 12 * TILE_SIZE, 8 * TILE_SIZE);
      ctx.fillStyle = '#b45309'; // Director Desk
      ctx.fillRect(29 * TILE_SIZE, 4 * TILE_SIZE, 4 * TILE_SIZE, 2 * TILE_SIZE);
      ctx.fillStyle = '#fff';
      ctx.fillText('Direktor Xonasi', 31 * TILE_SIZE, 3.5 * TILE_SIZE);

      // Employee Workstations (10 desks)
      const deskColors = '#475569';
      for(let i=0; i<5; i++) {
        // Top row desks
        ctx.fillStyle = deskColors;
        ctx.fillRect((4 + i*4) * TILE_SIZE, 12 * TILE_SIZE, 2 * TILE_SIZE, 1.5 * TILE_SIZE);
        // Bottom row desks
        ctx.fillRect((4 + i*4) * TILE_SIZE, 18 * TILE_SIZE, 2 * TILE_SIZE, 1.5 * TILE_SIZE);
      }
      ctx.fillStyle = '#fff';
      ctx.fillText('Notarius Xodimlari Ish Joyi', 12 * TILE_SIZE, 11 * TILE_SIZE);

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

      // 4. Draw Players (Among Us style simple blobs)
      players.forEach((p) => {
        const isLocal = p.id === currentSocketId;
        const px = isLocal ? localPlayer.x : p.x;
        const py = isLocal ? localPlayer.y : p.y;
        const xPos = px * TILE_SIZE + TILE_SIZE / 2;
        const yPos = py * TILE_SIZE + TILE_SIZE / 2;

        // Shadow
        ctx.beginPath();
        ctx.ellipse(xPos, yPos + 15, 12, 6, 0, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fill();

        // Body Color based on Role
        const bodyColor = p.role === 'DIRECTOR' ? '#f59e0b' : p.role === 'EMPLOYEE' ? '#3b82f6' : '#10b981';
        
        // Draw Body (Capsule shape)
        ctx.beginPath();
        ctx.roundRect(xPos - 12, yPos - 20, 24, 34, 12);
        ctx.fillStyle = bodyColor;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();

        // Draw Visor (Goggles)
        ctx.beginPath();
        ctx.roundRect(xPos - 8, yPos - 12, 20, 10, 5);
        ctx.fillStyle = '#94a3b8'; // Glass color
        ctx.fill();
        ctx.stroke();

        // Status Indicator
        if (p.status !== 'OFFLINE') {
          ctx.beginPath();
          ctx.arc(xPos + 15, yPos - 20, 6, 0, 2 * Math.PI);
          ctx.fillStyle = p.status === 'ONLINE' ? '#22c55e' : p.status === 'BUSY' ? '#ef4444' : '#eab308';
          ctx.fill();
          ctx.stroke();
        }

        // Name Tag
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(p.name, xPos, yPos - 28);
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
        className="shadow-[0_0_80px_rgba(0,0,0,0.7)] border-4 border-slate-800 rounded-2xl"
      />
    </div>
  );
}
