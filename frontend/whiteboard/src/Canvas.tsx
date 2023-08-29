import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [socket, setSocket] = useState<SocketIOClient.Socket | null>(null);
  const [drawing, setDrawing] = useState<any[]>([]);

  useEffect(() => {
    const newSocket = io("http://localhost:8000");
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("draw", (data: any) => {
        setDrawing((prevDrawing) => [...prevDrawing, data]);
      });
    }
  }, [socket]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

      canvas.addEventListener("mousedown", (e) => {
        isDrawing = true;
        lastX = e.clientX - canvas.getBoundingClientRect().left;
        lastY = e.clientY - canvas.getBoundingClientRect().top;
        context.beginPath();
        context.moveTo(lastX, lastY);
      });

      canvas.addEventListener("mousemove", (e) => {
        if (!isDrawing) return;

        const x = e.clientX - canvas.getBoundingClientRect().left;
        const y = e.clientY - canvas.getBoundingClientRect().top;

        context.lineTo(x, y);
        context.stroke();
        lastX = x;
        lastY = y;
      });

      canvas.addEventListener("mouseup", () => {
        if (isDrawing) {
          context.closePath();
          isDrawing = false;
        }
      });

      canvas.addEventListener("mouseout", () => {
        if (isDrawing) {
          context.closePath();
          isDrawing = false;
        }
      });
    }

    return () => {
      // Remove event listeners if needed
    };
  }, []);

  return <canvas ref={canvasRef} width={800} height={600} />;
};
export default Canvas;
