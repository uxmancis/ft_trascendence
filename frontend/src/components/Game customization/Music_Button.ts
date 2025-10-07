/* Export functions can be called from other files */
export function MusicButton() 
{
  // Duplicate prevention
  if (document.getElementById("music-btn"))
    return;

  /* Create Button */
  const img : HTMLImageElement = document.createElement("img");
  img.id = "music-btn"
  img.src = new URL("/src/assets/music_next.png", import.meta.url).href;
  img.alt = "Music - Customization";

  /* CSS style for button*/
  img.style.bottom = "20px"; //Position in screen, separed 20px from bottom
  img.style.left = "20px"; //Position in screen, separed 20px from bottom
  img.style.position = "fixed"; //Mandatory so that width and height actually work
  img.style.width = "40px";
  img.style.height = "40px";
  img.style.backgroundColor = "transparent";
  img.style.cursor = "pointer";


  /* Let's make button actually do something when clicking */
  const tracks = [ 
    new URL("/src/assets/music1.mp3", import.meta.url).href,
    new URL("/src/assets/music2.mp3", import.meta.url).href,
    new URL("/src/assets/music3.mp3", import.meta.url).href,
  ];
  const labels = ["🎵 Music 1", "🎵 Music 2", "🎵 Music 3", "🔇 Silence"];

  let currentTrack = 0; // 0–3 (last = silence)
  let isPlaying = false;
  let audio: HTMLAudioElement | null = null;

  /* When user 'clicks', following action will happen */
  img.addEventListener("click", () => {

    /* Micro-animación */
    img.style.transition = "transform 0.2s ease";
    img.style.transform = "scale(0.9)"; // presiona hacia dentro
    setTimeout(() => {
      img.style.transform = "scale(1.1)"; // rebota hacia fuera
      setTimeout(() => {
        img.style.transform = "scale(1)"; // vuelve al tamaño original
      }, 100);
    }, 100);
    
    
    // Move to next mode
    currentTrack = (currentTrack + 1) % (tracks.length + 1); /* tracks.length = 3 | +1 = Silence mode | % returns division's rest, e.g.: 5%2 = 1 (hondarra) */
    img.textContent = labels[currentTrack];

    //Change icon in front depending on currentTrack
    if (currentTrack === tracks.length)
      img.src = new URL("/src/assets/silence.png", import.meta.url).href;
    else
      img.src = new URL("/src/assets/music_next.png", import.meta.url).href;

    // if (currentTrack = 0) //Cuando es silencio, icono distinto
    //     img.src = /* TO DO */ new URL("/src/assets/music_icon.png", import.meta.url).href;

    // Stop any current music: if a song is currently playing (audio exists), stop it before playing a new one.
    if (audio) {
      audio.pause();
      audio = null;
    }

    // If not "Silence", start the new track
    if (currentTrack < tracks.length) {
      audio = new Audio(tracks[currentTrack]);
      audio.loop = true;
      audio.volume = 0.5; // optional
      audio.play();
      isPlaying = true;
      console.log(`🎶 Now playing: ${labels[currentTrack]}`);
    } else {
      isPlaying = false;
      console.log("🔇 Music stopped");
    }
  });

  /* Added to body */
  document.body.appendChild(img);
}

