FROM golang:1.22-alpine
WORKDIR /app
COPY . .
RUN cd signal-api && go build -o /pantheon-api main.go
EXPOSE 8080
CMD ["/pantheon-api"]
