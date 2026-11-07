#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{ChildStdin, Command, Stdio};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};

// stdin of `Greyhound.exe --server`, the C++ engine, or why it couldn't start
struct Engine(Mutex<Result<ChildStdin, String>>);

fn engine_path() -> PathBuf {
    // Shipped next to the UI; while developing, the Greyhound build in this repo
    let beside = std::env::current_exe().ok().and_then(|exe| exe.parent().map(|dir| dir.join("Greyhound.exe")));
    match beside {
        Some(path) if path.exists() => path,
        _ => Path::new(env!("CARGO_MANIFEST_DIR")).join("../../WraithXCOD/x64/Release/Greyhound.exe"),
    }
}

fn start_engine(app: &AppHandle) -> Result<ChildStdin, String> {
    let path = engine_path();
    let mut child = Command::new(&path)
        .arg("--server")
        .current_dir(path.parent().unwrap_or(Path::new(".")))
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .map_err(|e| format!("could not start {}: {e}", path.display()))?;

    let stdin = child.stdin.take().expect("stdin is piped");
    let stdout = child.stdout.take().expect("stdout is piped");
    let app = app.clone();
    std::thread::spawn(move || {
        // One JSON message per line, the frontend parses them
        for line in BufReader::new(stdout).lines().map_while(Result::ok) {
            let _ = app.emit("engine", line);
        }
        let _ = child.wait();
        let _ = app.emit("engine-exit", ());
    });

    // Dropping stdin when the UI closes makes the engine exit on its own
    Ok(stdin)
}

#[tauri::command]
fn send(line: String, engine: State<Engine>) -> Result<(), String> {
    let mut engine = engine.0.lock().map_err(|e| e.to_string())?;
    let stdin = engine.as_mut().map_err(|e| e.clone())?;
    writeln!(stdin, "{line}").and_then(|()| stdin.flush()).map_err(|e| format!("engine stopped: {e}"))
}

#[tauri::command]
fn reveal(path: String) -> Result<(), String> {
    // Only folders, this is for "open export folder"
    if !Path::new(&path).is_dir() {
        return Err(format!("{path} is not a folder"));
    }
    Command::new("explorer").arg(path).spawn().map(|_| ()).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let engine = start_engine(app.handle());
            app.manage(Engine(Mutex::new(engine)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![send, reveal])
        .run(tauri::generate_context!())
        .expect("error while running greyhound");
}
