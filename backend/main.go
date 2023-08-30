package main

import (
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error upgrading connection:", err)
		return
	}
	defer conn.Close()

	fmt.Println("Client connected")

	for {
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			fmt.Println("Error reading message:", err)
			return
		}

		err = conn.WriteMessage(messageType, p)
		if err != nil {
			fmt.Println("Error writing message:", err)
			return
		}
	}
}

func main() {
	http.HandleFunc("/ws", handleWebSocket)

	port := ":8000"
	fmt.Printf("WebSocket server is listening on port %s\n", port)
	http.ListenAndServe(port, nil)
}
