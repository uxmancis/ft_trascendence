
const API_BASE =
 window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "http://backend:3000/api";

interface StatsData {
  playerName: string;
  avatarUrl: string;
  winRate: number;   // porcentaje 0-100
  matchHistory: { opponent: string; result: "Win" | "Lose" }[];
  accuracy: number;  // porcentaje 0-100
  goalsScored: number;
  goalsReceived: number;
}

export async function StatsPage(root: HTMLElement) {
  const userId = localStorage.getItem("alias"); // o un ID real según backend
  if (!userId) {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
    return;
  }

  // Fetch stats from backend
  let data: StatsData;
  try {
    const res = await fetch(`${API_BASE}/stats/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    data = await res.json();
  } catch (err) {
    root.innerHTML = `<p class="text-red-500 text-center mt-10">Error loading stats</p>`;
    console.error(err);
    return;
  }

  // Outer container
  const container = document.createElement("div");
  container.className = "grid grid-cols-5 grid-rows-5 gap-4 p-4";

  // 1. Player avatar + name
  const playerCard = document.createElement("div");
  playerCard.className = "col-span-2 row-span-3 bg-white rounded-xl shadow p-4 flex flex-col items-center justify-center";
  const avatar = document.createElement("img");
  avatar.src = data.avatarUrl;
  avatar.alt = "Player Avatar";
  avatar.className = "w-24 h-24 rounded-full mb-4";
  const playerName = document.createElement("h2");
  playerName.className = "text-xl font-bold";
  playerName.textContent = data.playerName;
  playerCard.append(avatar, playerName);
  container.appendChild(playerCard);

  // 2. Winrate
  const winrateCard = document.createElement("div");
  winrateCard.className = "col-span-2 row-span-3 col-start-3 bg-white rounded-xl shadow p-4 flex flex-col items-center justify-center";
  const winTitle = document.createElement("h3");
  winTitle.className = "text-lg font-semibold mb-2";
  winTitle.textContent = "Win Rate";
  const winPercent = document.createElement("div");
  winPercent.className = "text-4xl font-bold text-green-500";
  winPercent.textContent = `${data.winRate}%`;
  const winBarContainer = document.createElement("div");
  winBarContainer.className = "w-full bg-gray-200 rounded-full h-4 mt-4";
  const winBar = document.createElement("div");
  winBar.className = "bg-green-500 h-4 rounded-full";
  winBar.style.width = `${data.winRate}%`;
  winBarContainer.appendChild(winBar);
  winrateCard.append(winTitle, winPercent, winBarContainer);
  container.appendChild(winrateCard);

  // 3. Match history
  const matchCard = document.createElement("div");
  matchCard.className = "row-span-5 col-start-5 bg-white rounded-xl shadow p-4 overflow-y-auto";
  const matchTitle = document.createElement("h3");
  matchTitle.className = "text-lg font-semibold mb-2";
  matchTitle.textContent = "Match History";
  const matchList = document.createElement("ul");
  matchList.className = "space-y-2";
  data.matchHistory.forEach(match => {
    const li = document.createElement("li");
    li.className = "flex justify-between";
    const opponent = document.createElement("span");
    opponent.textContent = `vs ${match.opponent}`;
    const result = document.createElement("span");
    result.textContent = match.result;
    li.append(opponent, result);
    matchList.appendChild(li);
  });
  matchCard.append(matchTitle, matchList);
  container.appendChild(matchCard);

  // 4. Accuracy circular
  const accuracyCard = document.createElement("div");
  accuracyCard.className = "col-span-2 row-span-2 row-start-4 bg-white rounded-xl shadow p-4 flex flex-col items-center justify-center";
  const accTitle = document.createElement("h3");
  accTitle.className = "text-lg font-semibold mb-2";
  accTitle.textContent = "Accuracy";
  const accWrapper = document.createElement("div");
  accWrapper.className = "relative w-24 h-24";
  accWrapper.innerHTML = `
    <svg class="w-full h-full">
      <circle cx="50%" cy="50%" r="45%" stroke="#e5e7eb" stroke-width="8" fill="none"/>
      <circle cx="50%" cy="50%" r="45%" stroke="#2563eb" stroke-width="8" fill="none"
        stroke-dasharray="282.6"
        stroke-dashoffset="${282.6 - 282.6 * data.accuracy / 100}"
        transform="rotate(-90 50 50)" />
    </svg>
    <div class="absolute inset-0 flex items-center justify-center text-xl font-bold">${data.accuracy}%</div>
  `;
  accuracyCard.append(accTitle, accWrapper);
  container.appendChild(accuracyCard);

  // 5. Goals scored / received
  const goalsCard = document.createElement("div");
  goalsCard.className = "col-span-2 row-span-2 col-start-3 row-start-4 bg-white rounded-xl shadow p-4 flex flex-col items-center justify-center";
  const goalsTitle = document.createElement("h3");
  goalsTitle.className = "text-lg font-semibold mb-2";
  goalsTitle.textContent = "Goals";
  const goalsWrapper = document.createElement("div");
  goalsWrapper.className = "flex gap-4";
  const scoredDiv = document.createElement("div");
  scoredDiv.className = "flex flex-col items-center";
  scoredDiv.innerHTML = `<span class="text-2xl font-bold text-green-500">${data.goalsScored}</span><span class="text-sm text-gray-500">Scored</span>`;
  const receivedDiv = document.createElement("div");
  receivedDiv.className = "flex flex-col items-center";
  receivedDiv.innerHTML = `<span class="text-2xl font-bold text-red-500">${data.goalsReceived}</span><span class="text-sm text-gray-500">Received</span>`;
  goalsWrapper.append(scoredDiv, receivedDiv);
  goalsCard.append(goalsTitle, goalsWrapper);
  container.appendChild(goalsCard);

  // Append to root
  root.innerHTML = "";
  root.appendChild(container);
}
