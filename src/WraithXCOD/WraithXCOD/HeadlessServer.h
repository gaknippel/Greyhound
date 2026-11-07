#pragma once

// Runs Greyhound without a window, driven by JSON lines on stdin, replies and events on stdout (used by the Tauri UI)
class HeadlessServer
{
public:
    // Blocks until stdin is closed
    static void Run();
};
