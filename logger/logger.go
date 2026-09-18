package logger

import (
	"io"
	"log"
	"os"
)

type Logger struct {
	Info  *log.Logger
	Error *log.Logger
	file  *os.File
}

func New(logFilePath string) (*Logger, error) {
	file, err := os.OpenFile(logFilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		return nil, err
	}

	// Write simultaneously to terminal (stdout/stderr) and the disk file
	infoWriter := io.MultiWriter(os.Stdout, file)
	errorWriter := io.MultiWriter(os.Stderr, file)

	return &Logger{
		Info:  log.New(infoWriter, "[INFO]  ", log.Ldate|log.Ltime|log.Lshortfile),
		Error: log.New(errorWriter, "[ERROR] ", log.Ldate|log.Ltime|log.Lshortfile),
		file:  file,
	}, nil
}

func (l *Logger) Close() error {
	return l.file.Close()
}