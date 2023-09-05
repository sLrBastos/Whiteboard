import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface DrawingData {
  type: string;
  x: number;
  y: number;
  color: string;
  size: number;
}

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  let isDrawing = false;
  const [color, setColor] = useState<string>("black");
  const [brushSize, setBrushSize] = useState<number>(2);
  const [tool, setTool] = useState<string>("pen");
  const socket = useRef<Socket | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    console.log("Canvas Width:", canvas.width);
    console.log("Canvas Height:", canvas.height);

    const handleMouseDown = (e: MouseEvent) => {
      if (!socket.current) return;

      console.log("Mouse Down - X:", e.clientX, "Y:", e.clientY);

      isDrawing = true;
      if (tool === "pen" || tool === "eraser") {
        context.beginPath();
        context.moveTo(
          e.clientX - canvas.getBoundingClientRect().left,
          e.clientY - canvas.getBoundingClientRect().top
        );

        if (tool === "pen") {
          context.globalCompositeOperation = "source-over"; // reset to default mode for pen
          context.lineWidth = brushSize;
        } else if (tool === "eraser") {
          context.globalCompositeOperation = "destination-out"; // use "destination-out" mode for erasing
          context.lineWidth = brushSize * 2;
        }
        context.strokeStyle = color; // Set the stroke color directly
        const data: DrawingData = {
          type: "start",
          x: e.clientX - canvas.getBoundingClientRect().left,
          y: e.clientY - canvas.getBoundingClientRect().top,
          color,
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

    if (!socket.current) {
      socket.current = io("http://localhost:8000");
    }

    return () => {
      // Remove event listeners if needed
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseout", handleMouseOut);
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [color, brushSize, tool]);

  useEffect(() => {
    if (!socket.current) return;

    console.log("Registering drawing event handler...");

    socket.current.on("drawing", (data: DrawingData) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext("2d");
      if (!context) return;

      console.log("Received Drawing Data:", data);

      if (data.type === "start") {
        context.beginPath();
        context.moveTo(data.x, data.y);
      } else if (data.type === "draw") {
        context.lineTo(data.x, data.y);
        context.lineWidth = data.size;
        context.strokeStyle = data.color;
        context.stroke();
      }
    });
  }, []);

  const handleColorChange = (newColor: string) => {
    if (!socket.current) return;

    setColor(newColor);

    // Set the new color
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.strokeStyle = newColor; // Set the new color
  };

  const handleBrushSizeChange = (newSize: number) => {
    setBrushSize(newSize);
  };

  const handleToolChange = (newTool: string) => {
    setTool(newTool);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Clear the entire canvas by filling it with a background color
    context.fillStyle = "white"; // You can use any color you prefer
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Emit a clear event to notify other users to clear their canvas
    socket.current?.emit("clear");
  };

  return (
    <div>
      <div>
        <button
          className={tool === "pen" ? "active" : ""}
          onClick={() => handleToolChange("pen")}
        >
          Pen
        </button>
        <button
          className={tool === "eraser" ? "active" : ""}
          onClick={() => handleToolChange("eraser")}
        >
          Eraser
        </button>
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
        <button onClick={clearCanvas}>Clear Canvas</button>
      </div>
      <canvas ref={canvasRef} width={800} height={600} />
    </div>
  );
};
export default Canvas;
