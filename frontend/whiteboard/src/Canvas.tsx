import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  let isDrawing = false;
  const [color, setColor] = useState<string>("black");
  const [brushSize, setBrushSize] = useState<number>(2);
  const [tool, setTool] = useState<string>("pen");

  const socket = useRef<SocketIOClient.Socket | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas?.getContext("2d");
    if (!context) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (!socket.current) return;

      isDrawing = true;
      if (tool === "pen" || tool === "eraser") {
        context.beginPath();
        context.moveTo(
          e.clientX - canvas.getBoundingClientRect().left,
          e.clientY - canvas.getBoundingClientRect().top
        );

        if (tool === "pen") {
          context.globalCompositeOperation = "source-over"; // reset to default mode for pen
          context.strokeStyle = color;
          context.lineWidth = brushSize;
        } else if (tool === "eraser") {
          context.globalCompositeOperation = "destination-out"; // use "destination-out" mode for erasing
          context.lineWidth = brushSize * 2;
        }
        const data = {
          type: "start",
          x: e.clientX - canvas.getBoundingClientRect().left,
          y: e.clientY - canvas.getBoundingClientRect().top,
          color: tool === "pen" ? color : "white",
          size: tool === "pen" ? brushSize : brushSize * 2,
        };
        socket.current.emit("drawing", data);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!socket.current) return;

      if (!isDrawing) return;

      const x = e.clientX - canvas.getBoundingClientRect().left;
      const y = e.clientY - canvas.getBoundingClientRect().top;
      if (tool === "pen" || tool === "eraser") {
        context.lineTo(x, y);
        context.lineWidth = brushSize;
        context.strokeStyle = tool === "eraser" ? "white" : color;
        context.stroke();

        const data = {
          type: "draw",
          x,
          y,
        };
        socket.current.emit("drawing", data);
      }
    };

    const handleMouseUp = () => {
      if (!socket.current) return;

      if ((tool === "pen" || tool === "eraser") && isDrawing) {
        context.closePath();
        isDrawing = false;

        socket.current.emit("end");
      }
    };

    const handleMouseOut = () => {
      if (!socket.current) return;

      if ((tool === "pen" || tool === "eraser") && isDrawing) {
        context.closePath();
        isDrawing = false;

        socket.current.emit("end");
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseout", handleMouseOut);

    socket.current = io("http://localhost:8000");

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }

      // Remove event listeners if needed
      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseup", handleMouseUp);
      canvas.addEventListener("mouseout", handleMouseOut);
    };
  }, [color, brushSize, tool]);

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
  };

  const handleBrushSizeChange = (newSize: number) => {
    setBrushSize(newSize);
  };

  const handleToolChange = (newTool: string) => {
    setTool(newTool);
  };

  return (
    <div>
      <div>
        <button onClick={() => handleToolChange("pen")}>Pen</button>
        <button onClick={() => handleToolChange("eraser")}>Eraser</button>
        <input
          type="color"
          value={color}
          onChange={(e) => handleColorChange(e.target.value)}
        />
        <input
          type="range"
          min="1"
          max="10"
          value={brushSize}
          onChange={(e) => handleBrushSizeChange(Number(e.target.value))}
        />
      </div>
      <canvas ref={canvasRef} width={800} height={600} />;
    </div>
  );
};
export default Canvas;
