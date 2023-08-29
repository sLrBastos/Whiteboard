package main

import (
	"net/http"

	"github.com/go-chi/chi"
	"github.com/gorilla/websocket"
)

var (
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
)

func main() {
	r := chi.NewRouter()

	// Serve the React frontend
	fs := http.FileServer(http.Dir("static"))
	r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
		fs.ServeHTTP(w, r)
	})

	r.Get("/ws", handleWebSocket)

	http.ListenAndServe(":8000", r)
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	for {
		// Read drawing action from the client

		// Broadcast the drawing action to all clients
	}
}
