package main

import (
	"fmt"
	"net/http"

	socketio "github.com/googollee/go-socket.io"
	"github.com/rs/cors"
)

func main() {

	server := socketio.NewServer(nil)

	//Store connected clients
	clients := make(map[string]socketio.Conn)

	server.OnConnect("/", func(s socketio.Conn) error {
		fmt.Println("real beans", clients)
		fmt.Println("Client connected:", s.ID())
		clients[s.ID()] = s
		return nil
	})

	server.OnDisconnect("/", func(s socketio.Conn, reason string) {
		fmt.Println("Client disconnected:", s.ID())
		delete(clients, s.ID())
	})

	server.OnEvent("/", "drawing", func(s socketio.Conn, msg string) {
		fmt.Println("Drawing data received from client:", msg)

		//Broadcast the drawing data to all connected clients
		for id, client := range clients {
			if id != s.ID() { // so it does not send to the one that is sending
				client.Emit("drawing", msg)
			}
		}

	})

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:5174"}, // Add your frontend URLs here
		AllowCredentials: true,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders:   []string{"Content-Type"},
	})

	http.Handle("/socket.io/", c.Handler(server))

	go func() {
		if err := server.Serve(); err != nil {
			fmt.Println("Websocket server error:", err)
			return

		}
		defer server.Close()
	}()

	fmt.Println("Server is running on :8000")
	if err := http.ListenAndServe(":8000", nil); err != nil {
		fmt.Println("Server error:", err)
	}

}
