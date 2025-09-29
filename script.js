// list of songs
let songs;
let currentfolder;

// Song-Slot to update
let currentsong = new Audio();

const playMusic = (track) => {
    currentsong.src = `/songs/${currentfolder}/` + track;
    currentsong.play();

    document.querySelector(".songinfo").innerHTML = track;
    document.querySelector(".songtime").innerHTML = "00:00/00:00";
};


// ---------------- GET SONGS ----------------
async function getsongs(folder) {
    currentfolder = folder;
    console.log("📂 Loading songs from folder via GitHub API:", folder);

    // GitHub API: list files inside folder
    let apiUrl = `https://api.github.com/repos/jitendra-jitu/jitendra-jitu.github.io/contents/songs/${folder}`;
    let res = await fetch(apiUrl);
    let files = await res.json();

    // only mp3 files
    songs = files
        .filter(f => f.name.endsWith(".mp3"))
        .map(f => f.name);

    console.log("🎵 Songs found:", songs);

    let songsUl = document.querySelector(".songs-list ul");
    songsUl.innerHTML = "";

    // load info.json
    let infoFile = files.find(f => f.name === "info.json");
    let jsondata = { Name: folder };
    if (infoFile) {
        let infoRes = await fetch(infoFile.download_url);
        jsondata = await infoRes.json();
    }

    for (const song of songs) {
        songsUl.innerHTML += `
            <li>
                <img src="svg/music.svg" alt="">
                <div class="info">
                    <div>${song}</div>
                    <div>${jsondata.Name}</div>
                </div>
                <div class="playnow">
                    <span>playnow</span>
                    <img class="invert" src="svg/playbtn.svg" alt="">
                </div>
            </li>`;
    }

    // click listener
    Array.from(songsUl.getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            let track = e.querySelector(".info").firstElementChild.innerText.trim();
            console.log("🖱️ Song clicked:", track);
            playMusic(track);
            document.querySelector("#play").src = "svg/pause.svg";
        });
    });

    return songs;
}


// ---------------- TIME FORMAT ----------------
function formatTime(seconds) {
    totalMilliseconds = seconds * 1000;
    const totalSeconds = Math.floor(totalMilliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = remainingSeconds.toString().padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}


// ---------------- DISPLAY ALBUMS ----------------
async function DisplayAlbums() {
    console.log("📀 Loading albums via GitHub API...");

    let apiUrl = `https://api.github.com/repos/jitendra-jitu/jitendra-jitu.github.io/contents/songs`;
    let res = await fetch(apiUrl);
    let folders = await res.json();

    let cardContainer = document.querySelector(".cardcontainer");

    for (const folder of folders) {
        if (folder.type !== "dir") continue; // only directories

        try {
            let infoRes = await fetch(`https://api.github.com/repos/jitendra-jitu/jitendra-jitu.github.io/contents/songs/${folder.name}/info.json`);
            let infoFile = await infoRes.json();
            let jsondata = {};

            if (infoFile.download_url) {
                let metaRes = await fetch(infoFile.download_url);
                jsondata = await metaRes.json();
            }

            cardContainer.innerHTML += `
                <div data-folder="${folder.name}" class="card">
                    <svg class="play" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="50" height="50">
                        <defs>
                            <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
                                <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="black" flood-opacity="0.5"/>
                            </filter>
                        </defs>
                        <circle cx="12" cy="12" r="10" fill="#3fd671" filter="url(#dropShadow)" />
                        <polygon points="10,8 16,12 10,16" fill="black"/>
                    </svg>
                    <img src="songs/${folder.name}/cover.jpeg" alt="">
                    <h4>${jsondata.Name || folder.name}</h4>
                    <p>${jsondata.Description || ""}</p>
                </div>`;
        } catch (err) {
            console.error("❌ Could not load info.json for:", folder.name, err);
        }
    }

    // album click
    setTimeout(() => {
        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async item => {
                let folder = item.currentTarget.dataset.folder;
                console.log("🖱️ Album clicked:", folder);
                let list = await getsongs(folder);
                console.log("🎵 Songs loaded for album:", list);
                if (list.length > 0) playMusic(list[0]);
            });
        });
    }, 500);
}


// ---------------- MAIN ----------------
async function main() {
    // load default album
    await getsongs("Manam");
    console.log("songs:", songs);

    // display albums
    DisplayAlbums();

    // play/pause
    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            play.src = "svg/pause.svg";
        } else {
            currentsong.pause();
            play.src = "svg/playbtn.svg";
        }
    });

    // time update
    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML =
            `${formatTime(currentsong.currentTime)}/${formatTime(currentsong.duration)}`;
        document.querySelector(".circle").style.left =
            (currentsong.currentTime / currentsong.duration) * 100 + "%";
    });

    // seekbar
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let percent = e.offsetX / e.target.getBoundingClientRect().width;
        currentsong.currentTime = percent * currentsong.duration;
    });

    // hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0px";
        document.querySelector(".left").style.width = "80vw";
    });

    // close menu
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-80vw";
    });

    // previous
    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
        if (index > 0) {
            playMusic(songs[index - 1]);
        } else {
            playMusic(songs[songs.length - 1]);
        }
    });

    // next
    next.addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
        if (index === songs.length - 1) {
            playMusic(songs[0]);
        } else {
            playMusic(songs[index + 1]);
        }
    });

    // volume slider
    range.addEventListener("change", (e) => {
        currentsong.volume = e.target.value / 100;
    });

    // mute/unmute
    document.querySelector(".volume img").addEventListener("click", (e) => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentsong.volume = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentsong.volume = 0.7;
        }
    });
}

main();
