// Données de la piste en cours
let playlistData=[];
let currentSoundIndex=0;
let currentThemeIndex=0;
let audioContext,analyserMode,sourceMode,dataArray,bufferLength;

// Constantes 

const AUDIO =document.querySelector("audio");
const TRACK =document.getElementById("track");
const TRACK_TIME =document.getElementById("track-time");
const CURRENT_TIME =document.getElementById("current-time");
const SONG_TITLE =document.getElementById("song_title");
const ARTISTE_NAME =document.getElementById("artist_name");
const  SONG_PICTURE=document.getElementById("songPicture");
const VOLUME =document.getElementById("volume");
const VISUALIZER_CANVAS =document.getElementById("musicVisualizerCanvas");
const THEME_SWITCHER_BTN =document.getElementById("themeSwitcherBtn");
const THEMES = ['theme-neon','theme-cyberpunk','theme-pastel'];
const THEME_STORAGE_KEY='evanMusicStationTheme';
const FFT_SIZE=1024;
const PLAY_BTN =document.getElementById("play-btn");
const PAUSE_BTN=document.getElementById("pause-btn");
const NEXT_BTN =document.getElementById("skipF-btn");
const PREVIOUS_BTN =document.getElementById("skipB-btn");
const VOLUME_ICON =document.getElementById("volume_icon");
const VOLUME_OFF =document.getElementById("volume_off");

// Convertie la durée de la chanson en minutes et en secondes 
function buildDuration(duration){
    let minutes=Math.floor(duration/60)
    let reste=duration%60;
    let seconds=Math.floor(reste);
    seconds=String(seconds).padStart(2,0);
    return minutes+":" + seconds;
}

// Play
PLAY_BTN.addEventListener("click",function () {
    if(!audioContext){
       setupVisualizer();
    }
    if(audioContext.state==='suspended'){
        audioContext.resume();
    }
    AUDIO.volume=VOLUME.value;
    AUDIO.play();
    PAUSE_BTN.style.display="inline-block";
    PLAY_BTN.style.display="none";
    drawVisualizer();
});

// Pause
PAUSE_BTN.addEventListener("click",function () {
    PLAY_BTN.style.display="inline-block";
    PAUSE_BTN.style.display="none";
    AUDIO.pause();
    if(audioContext.state==='running'){
        audioContext.suspend();
    }
});
// timer actuel de la chanson
AUDIO.addEventListener("timeupdate",function () {
    TRACK.value=this.currentTime;
    CURRENT_TIME.textContent=buildDuration(this.currentTime);
});

// Permet de faire avancer la musique en déplaçant le curseur
TRACK.addEventListener("input", function () {
    CURRENT_TIME.textContent=buildDuration(this.value);
    AUDIO.currentTime=this.value
});

// Volume
VOLUME.addEventListener("click", function () {
    AUDIO.VOLUME=this.value

});

VOLUME_ICON.addEventListener("click", function () {
    Audio.VOLUME=0;
    VOLUME_OFF.style.display="inline-block";
    VOLUME_ICON.style.display="none";
});

VOLUME_OFF.addEventListener("click", function () {
    Audio.VOLUME=1;
    VOLUME_ICON.style.display="inline-block";
    VOLUME_OFF.style.display="none";
});

// Bouton Next
NEXT_BTN.addEventListener("click", function () {
    currentSoundIndex++;
    if(currentSoundIndex>=playlistData.length){
        currentSoundIndex=0;
    }
    setSongInfos(currentSoundIndex);
    AUDIO.play();
    PAUSE_BTN.style.display="inline-block";
    PLAY_BTN.style.display="none";
});

// Bouton Previous
PREVIOUS_BTN.addEventListener("click", function () {
    currentSoundIndex--;
    if(currentSoundIndex<0){
        currentSoundIndex=playlistData.length-1;
    }
    setSongInfos(currentSoundIndex);
    AUDIO.play();
    PAUSE_BTN.style.display="inline-block";
    PLAY_BTN.style.display="none";
});

// Récupération et donnés de la musique

function setSongInfos(newIndex){
    currentSoundIndex=newIndex;
    const song =playlistData[currentSoundIndex];
    if(!song){
        console.error("chanson non trouvée à l'index " + currentSoundIndex);
        return;
    }
    SONG_TITLE.innerHTML=song.title;
    ARTISTE_NAME.innerHTML=song.artist;
    SONG_PICTURE.setAttribute("src",song.img);
    AUDIO.src.song.path;
    AUDIO.onloadedmetadata=()=>{
        TRACK_TIME.textContent=buildDuration(AUDIO.duration)
        TRACK.max=AUDIO.duration
    }
    AUDIO.load();
}

// Récupération des données une fois lors du chargement de la page

document.addEventListener("DOMContentLoaded",()=>{
    fetch("./assets/playlist.json")
        .then((res)=>{
            if(!res.ok){
                SONG_TITLE.innerHTML="erreur de récupération de la playlist";
                ARTISTE_NAME.innerHTML="statut: "+res.status;
                throw newError("erreur http! statut:"+res.status);
            }
            return res.json();
        })
        .then((data)=>{
            playlistData=data
            if(playlistData && playlistData.length>0){
                setSongInfos(currentSoundIndex);
            }
            else{
                console.error("la playlist est vide soit invalide")
                SONG_TITLE.innerHTML="la playlist est vide soit invalide";
                ARTISTE_NAME.innerHTML="";
            }
        })
        .catch((error)=>{
            console.error("erreur à l'ouverture de la playlist:",error);
            if(SONG_TITLE.innerHTML==="Titre de la chanson"){
                SONG_TITLE.innerHTML="erreur à l'ouverture de la playlist:";
                ARTISTE_NAME.innerHTML=error.message.includes("erreur http") ? error.message : "regarder les détails dans la console";
            }
        });
    resizeVisualizerCanvas
    
});

window.addEventListener("resize",resizeVisualizerCanvas);

// fonctions themes 
function applyTheme(themeName){
    THEMES.forEach(t=>{
        if(document.body.classList.contains(t)){
            document.body.classList.remove(t);
        }
    });
    document.body.classList.add(themeName)
    localStorage.setItem(THEME_STORAGE_KEY,themeName);
    currentThemeIndex=THEMES.indexOf(themeName);
}

if(THEME_SWITCHER_BTN){
    THEME_SWITCHER_BTN.addEventListener("click", function () {
        currentThemeIndex=(currentThemeIndex+1) % THEMES.length;
        applyTheme(THEMES[currentThemeIndex])
    });
}

function loadSavedTheme(){
    const savedTheme=localStorage.getItem(THEME_STORAGE_KEY);
    if(savedTheme && THEMES.includes(savedTheme)){
        applyTheme(savedTheme);
    }
    else{
        applyTheme(THEMES[0]);
    }
}

function resizeVisualizerCanvas(){
    if(VISUALIZER_CANVAS){
        VISUALIZER_CANVAS.width=VISUALIZER_CANVAS.clientWidth;
        VISUALIZER_CANVAS.height=VISUALIZER_CANVAS.clientHeight;
    }
}
function setupVisualizer(){
    audioContext = new(window.AudioContext || window.webkitAudioContext)();
    analyserMode = audioContext.createAnalyser();
    analyserMode.fftSize = FFT_SIZE;
    bufferLength = analyserMode.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    if(!sourceMode){
        sourceMode = audioContext.createMediaElementSource(AUDIO);
    }
    sourceMode.connect(analyserMode);
    analyserMode.connect(audioContext.destination);
    resizeVisualizerCanvas();
}

function drawVisualizer(){
    if(!VISUALIZER_CANVAS){
        requestAnimationFrame(drawVisualizer);
        return;
    }
    const canvasCtx = VISUALIZER_CANVAS.getContext('2d');
    if(!canvaCtx){
        requestAnimationFrame(drawVisualizer);
        return;
    }
    if(!analyserMode || !audioContext || audioContext.state ==='suspended'){
        let clearBgColor = "#000000";
        if(document.body.className.includes('theme-')){
            try{
                clearBgColor = getComputedStyle(document.body).getPropertyValue('--background_2').trim();
            }catch(e){

            }
        }
        canvasCtx.fillStyle = clearBgColor;
        canvasCtx.fillRect(0,0,VISUALIZER_CANVAS.width,VISUALIZER_CANVAS.height);
        requestAnimationFrame(drawVisualizer);
        return;
    }
    requestAnimationFrame(drawVisualizer);
    analyserMode.getByteFrequencyData(dataArray);
    const bodyStyles = getComputedStyle(document.body);
    // Provide fallbacks for all color properties in case CSS variables are missing temporarily
    const trailColor = bodyStyles.getPropertyValue('--canvas_trail_color').trim() || 'rgba(0,0,0,0.1)'; // Assuming --canvas_trail_color will be added to CSS themes
    const barPrimaryColor = bodyStyles.getPropertyValue('--canvas_visualizer_bar_primary').trim() || '#00ff00';
    const barSecondaryColor = bodyStyles.getPropertyValue('--canvas_visualizer_bar_secondary').trim() || '#ff00ff';
    const barPeakColor = bodyStyles.getPropertyValue('--canvas_visualizer_bar_peak').trim() || '#ffffff';
    const shadowColor = barPrimaryColor;
    const centralLineColor = bodyStyles.getPropertyValue('--text_1').trim() || 'rgba(255,255,255,0.2)';

    canvasCtx.fillStyle = trailColor;
    canvasCtx.fillRect(0, 0, VISUALIZER_CANVAS.width, VISUALIZER_CANVAS.height);
    
    const spacing = 1;
    const totalSpacing = (bufferLength - 1) * spacing;
    const barWidth = Math.max(1, (VISUALIZER_CANVAS.width - totalSpacing) / bufferLength);
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];
        // Gradient extent calculation needs to be robust
        let gradientMaxY = VISUALIZER_CANVAS.height - ((barHeight / 255) * VISUALIZER_CANVAS.height * 0.7);
        if (gradientMaxY < 0) gradientMaxY = 0; // Ensure it doesn't go negative

        const gradient = canvasCtx.createLinearGradient(
            x, VISUALIZER_CANVAS.height, x, gradientMaxY
        );
        gradient.addColorStop(0, barPrimaryColor);
        gradient.addColorStop(0.7, barSecondaryColor);
        gradient.addColorStop(1, barHeight > 200 ? barPeakColor : barSecondaryColor);
        canvasCtx.fillStyle = gradient;
    
        let scaledHeight = (barHeight / 255) * VISUALIZER_CANVAS.height * 0.7;

        canvasCtx.shadowBlur = 5;
        canvasCtx.shadowColor = shadowColor;

        canvasCtx.fillRect(
            x, (VISUALIZER_CANVAS.height / 2) - (scaledHeight / 2),
            barWidth, scaledHeight
        );
    
        canvasCtx.shadowBlur = 0;
        x += barWidth + spacing;
    }

    canvasCtx.beginPath();
    canvasCtx.moveTo(0, VISUALIZER_CANVAS.height / 2);
    canvasCtx.lineTo(VISUALIZER_CANVAS.width, VISUALIZER_CANVAS.height / 2);
    canvasCtx.strokeStyle = centralLineColor;
    canvasCtx.lineWidth = 1;
    canvasCtx.stroke();
}

// S'assurer qu'il y est l'appel après que le DOM soit prêt
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', loadSavedTheme);
} else {
    loadSavedTheme(); // DOM is already ready
}
