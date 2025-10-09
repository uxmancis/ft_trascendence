export function MusicButton(returnElement = false): HTMLElement {
  if (!returnElement && document.getElementById("music-btn")) return document.getElementById("music-btn")!;

  const img: HTMLImageElement = document.createElement("img");
  img.id = "music-btn";
  img.src = new URL("/src/assets/music_next.png", import.meta.url).href;
  img.alt = "Music - Customization";
  img.className = "accessibility-btn"; // estilo reutilizable

  const tracks = [
    new URL("/src/assets/music1.mp3", import.meta.url).href,
    new URL("/src/assets/music2.mp3", import.meta.url).href,
    new URL("/src/assets/music3.mp3", import.meta.url).href,
  ];
  const labels = ["🎵 Music 1", "🎵 Music 2", "🎵 Music 3", "🔇 Silence"];

  let currentTrack = 0;
  let audio: HTMLAudioElement | null = null;

  img.addEventListener("click", () => {
    animateButton(img);

    currentTrack = (currentTrack + 1) % (tracks.length + 1);

    // Cambiar ícono según track
    img.src = currentTrack === tracks.length
      ? new URL("/src/assets/silence.png", import.meta.url).href
      : new URL("/src/assets/music_next.png", import.meta.url).href;

    if (audio) {
      audio.pause();
      audio = null;
    }

    if (currentTrack < tracks.length) {
      audio = new Audio(tracks[currentTrack]);
      audio.loop = true;
      audio.volume = 0.5;
      audio.play();
      console.log(`🎶 Now playing: ${labels[currentTrack]}`);
    } else {
      console.log("🔇 Music stopped");
    }
  });

  if (!returnElement) document.body.appendChild(img);
  return img;
}

function animateButton(btn: HTMLElement) {
  btn.style.transition = "transform 0.2s ease";
  btn.style.transform = "scale(0.9)";
  setTimeout(() => {
    btn.style.transform = "scale(1.1)";
    setTimeout(() => {
      btn.style.transform = "scale(1)";
    }, 100);
  }, 100);
}
