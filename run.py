import http.server
import socketserver
import os
import subprocess
import sys
import time

PORT = 8000

def start_backend():
    print("Starting Flask Backend Server...")
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
    app_path = os.path.join(backend_dir, "app.py")
    
    # Run the Flask app
    return subprocess.Popen(
        [sys.executable, app_path],
        cwd=backend_dir
    )

def main():
    # Start the backend server first
    backend_process = None
    try:
        backend_process = start_backend()
        # Wait a moment for it to spin up
        time.sleep(2)
    except Exception as e:
        print(f"Warning: Could not automatically start backend server: {e}")
        print("You can manually run it using: python backend/app.py")

    print(f"Starting Medical Assistant Frontend Server...")
    
    # Change directory to frontend to serve those files
    frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")
    os.chdir(frontend_dir)
    
    Handler = http.server.SimpleHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"Frontend Server running at: http://localhost:{PORT}")
            print("Backend Server running at: http://localhost:5000")
            print("Please open the Frontend link in your browser.")
            print("Press Ctrl+C to stop both servers.")
            
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\nShutting down servers...")
    except OSError as e:
        print(f"\n❌ Error starting Frontend Server: {e}")
        print(f"Port {PORT} is likely already in use by an active background process.")
        print(f"To close it and free up port {PORT}, run this command in your PowerShell terminal:")
        print(f"  Stop-Process -Id (Get-NetTCPConnection -LocalPort {PORT}).OwningProcess -Force")
    finally:
        if backend_process:
            backend_process.terminate()
            backend_process.wait()
            print("Backend server stopped.")

if __name__ == "__main__":
    main()
