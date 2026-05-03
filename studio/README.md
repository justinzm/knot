# Knot Studio

Knot Studio is a local desktop workflow builder and execution console for Knot runtimes. It gives operators a visual way to inspect project briefs, specs, taskboards, gate rules, validation status, run output, and generated artifacts without replacing the file-based Knot runtime model.

## Development

Install the frontend and Tauri dependencies:

```bash
npm install
```

Run the frontend test suite:

```bash
npm run test -- --run
```

Build the frontend:

```bash
npm run build
```

Run the Rust test suite:

```bash
cd src-tauri
cargo test
```

Check the Rust crate:

```bash
cd src-tauri
cargo check
```

Start the desktop app in development mode from the `studio/` directory:

```bash
npm run tauri dev
```

## MVP Capabilities

- Open and inspect a local Knot runtime.
- Edit project brief, project spec, and taskboard files.
- View workflow structure, dependencies, and gate rules.
- Run preflight from the desktop console.
- Start Knot execution and inspect run output.
- Inspect progress, review files, and output files from the loaded runtime.
