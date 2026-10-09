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
  
  // Use refs for dynamic data to prevent restarting the animation loop
  const playersRef = useRef(players);
  const currentSocketIdRef = useRef(currentSocketId);
  const [localPlayer, setLocalPlayer] = useState<{ x: number; y: number }>({ x: 20, y: 12 });
  const localPlayerRef = useRef(localPlayer);
  const keys = useRef<{ [key: string]: boolean }>({});
  const onMoveRef = useRef(onMove);
  
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  // Sync refs when props/state change
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { currentSocketIdRef.current = currentSocketId; }, [currentSocketId]);
  useEffect(() => { localPlayerRef.current = localPlayer; }, [localPlayer]);
  useEffect(() => { onMoveRef.current = onMove; }, [onMove]);

  // Handle keyboard events
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

  // Load the beautiful background image
  useEffect(() => {
    const img = new Image();
    img.src = '/bg.jpg';
    img.onload = () => { bgImageRef.current = img; };
  }, []);

  // Main animation loop (runs continuously, NO dependencies)
  useEffect(() => {
    let animationFrameId: number;
    let lastMoveTime = 0;

    const render = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw the stunning background image
      if (bgImageRef.current) {
        ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 2. Handle Movement
      if (time - lastMoveTime > 120) {
        let dx = 0; let dy = 0; let direction = 'down';
        if (keys.current['ArrowUp'] || keys.current['w']) { dy -= 1; direction = 'up'; }
        else if (keys.current['ArrowDown'] || keys.current['s']) { dy += 1; direction = 'down'; }
        else if (keys.current['ArrowLeft'] || keys.current['a']) { dx -= 1; direction = 'left'; }
        else if (keys.current['ArrowRight'] || keys.current['d']) { dx += 1; direction = 'right'; }

        if (dx !== 0 || dy !== 0) {
          const currentLocal = localPlayerRef.current;
          const newX = Math.max(0, Math.min(MAP_WIDTH - 1, currentLocal.x + dx));
          const newY = Math.max(0, Math.min(MAP_HEIGHT - 1, currentLocal.y + dy));
          
          const isSolid = (x: number, y: number) => {
            if (x <= 0 || x >= 39 || y <= 0 || y >= 24) return true; // borders
            
            // Left area (Reception & Bar Stools)
            if (x >= 1 && x <= 9 && y >= 1 && y <= 11) return true; 
            
            // Left area (Lounge & Sofas)
            if (x >= 1 && x <= 10 && y >= 17 && y <= 23) return true;

            // Top workspace (desks, plants, conference room)
            if (x >= 12 && x <= 38 && y >= 1 && y <= 8) return true;
            
            // Bottom workspace (desks, vertical plants)
            if (x >= 12 && x <= 38 && y >= 17 && y <= 23) return true;

            return false;
          };

          if (!isSolid(newX, newY) && (newX !== currentLocal.x || newY !== currentLocal.y)) {
            onMoveRef.current(newX, newY, direction);
            setLocalPlayer({ x: newX, y: newY });
          } else if (newX === currentLocal.x && newY === currentLocal.y) {
            // Just turned around without moving
             onMoveRef.current(newX, newY, direction);
          }
          lastMoveTime = time;
        }
      }

      // 3. Draw Players
      playersRef.current.forEach((p) => {
        const isLocal = p.id === currentSocketIdRef.current;
        const px = isLocal ? localPlayerRef.current.x : p.x;
        const py = isLocal ? localPlayerRef.current.y : p.y;
        
        const xPos = px * TILE_SIZE + TILE_SIZE / 2;
        const yPos = py * TILE_SIZE + TILE_SIZE / 2;

        // Shadow
        ctx.beginPath();
        ctx.ellipse(xPos, yPos + 12, 16, 8, 0, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fill();

        // Body Colors
        const shirtColor = p.role === 'DIRECTOR' ? '#1e293b' : p.role === 'EMPLOYEE' ? '#0284c7' : '#059669';
        
        // Shoulders
        ctx.beginPath();
        ctx.roundRect(xPos - 16, yPos - 10, 32, 20, 10);
        ctx.fillStyle = shirtColor;
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(xPos, yPos, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#fcd34d'; 
        ctx.fill();
        
        // Hair
        ctx.beginPath();
        ctx.arc(xPos, yPos - 2, 10, Math.PI, 0);
        ctx.fillStyle = '#451a03';
        ctx.fill();

        // Status Indicator
        if (p.status !== 'OFFLINE') {
          ctx.beginPath();
          ctx.arc(xPos + 12, yPos - 12, 5, 0, 2 * Math.PI);
          ctx.fillStyle = p.status === 'ONLINE' ? '#22c55e' : p.status === 'BUSY' ? '#ef4444' : '#eab308';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#fff';
          ctx.stroke();
        }

        // Name Tag
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
