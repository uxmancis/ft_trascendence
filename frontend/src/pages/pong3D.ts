// import { Engine, Scene, ArcRotateCamera, HemisphericLight, MeshBuilder, Color3, StandardMaterial, Vector3 } from "@babylonjs/core";

// const canvas = document.getElementById("pong") as HTMLCanvasElement;
// const engine = new Engine(canvas, true);
// const scene = new Scene(engine);

// // function resizeCanvas() {
// //   canvas.width = window.innerWidth * 0.8;  // 80% del ancho de la ventana
// //   canvas.height = window.innerHeight * 0.6; // 60% del alto
// // }

// // window.addEventListener("resize", resizeCanvas);
// // resizeCanvas();

// // Cámara
// const camera = new ArcRotateCamera("camera", Math.PI/2, Math.PI/3, 40, Vector3.Zero(), scene);
// camera.attachControl(canvas, true);

// // Luz
// new HemisphericLight("light", new Vector3(0, 1, 0), scene);

// // Material helper
// function createMaterial(color: Color3) {
//   const mat = new StandardMaterial("mat", scene);
//   mat.diffuseColor = color;
//   return mat;
// }

// // Paddle jugador
// const playerPaddle = MeshBuilder.CreateBox("player", { width: 1, height: 5, depth: 1 }, scene);
// playerPaddle.material = createMaterial(Color3.White());
// playerPaddle.position.x = -15;

// // Paddle IA
// const aiPaddle = MeshBuilder.CreateBox("ai", { width: 1, height: 5, depth: 1 }, scene);
// aiPaddle.material = createMaterial(Color3.White());
// aiPaddle.position.x = 15;

// // Pelota
// const ballMesh = MeshBuilder.CreateSphere("ball", { diameter: 1 }, scene);
// ballMesh.material = createMaterial(Color3.White());

// // Suelo
// const ground = MeshBuilder.CreateGround("ground", { width: 40, height: 20 }, scene);
// ground.material = createMaterial(new Color3(0.1,0.1,0.1));

// // --- Sincronizar lógica 2D con 3D ---
// function syncMeshes() {
//     playerPaddle.position.y = (player.y / canvas.height) * 20 - 10;
//     aiPaddle.position.y = (ai.y / canvas.height) * 20 - 10;
  
//     ballMesh.position.x = (ball.x / canvas.width) * 30 - 15;
//     ballMesh.position.y = (ball.y / canvas.height) * 20 - 10;
// }
  
// // --- Loop principal ---
// engine.runRenderLoop(() => {
// update();       // mueve bola, IA, colisiones...
// syncMeshes();   // aplica posiciones en 3D
// document.body.style.background = "linear-gradient(to right, blue, yellow)";
// scene.render(); // dibuja todo
// });
