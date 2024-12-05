const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Audio context setup
let audioContext;
let analyser;
let dataArray;
let audioSource;

// Particelle per il tornado
let particles = [];

// Variabili per il gradiente
let gradientColors = [
    { r: 15, g: 32, b: 39 },
    { r: 32, g: 58, b: 67 },
    { r: 44, g: 83, b: 100 },
];

// Classe per particelle energetiche
class Particle {
    constructor(x, y, radius, angle, color) {
        this.x = x;
        this.y = y;
        this.radius = radius; // Distanza dal centro
        this.angle = angle; // Angolo di rotazione
        this.color = color;
        this.speed = Math.random() * 0.02 + 0.01; // Velocità orbitale
        this.baseRadius = radius; // Raggio originale
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update(audioValue) {
        const speedFactor = audioValue / 256; // Normalizzazione
        this.angle += this.speed * (1 + speedFactor); // Velocità dinamica
        this.radius = this.baseRadius + audioValue * 0.5;

        // Posizione della particella
        this.x = canvas.width / 2 + Math.cos(this.angle) * this.radius;
        this.y = canvas.height / 2 + Math.sin(this.angle) * this.radius;

        this.draw();
    }
}

// Gestione file audio
document.getElementById("audioFile").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
        const audio = new Audio(URL.createObjectURL(file));
        audio.play();

        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;

            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);

            audioSource = audioContext.createMediaElementSource(audio);
            audioSource.connect(analyser);
            analyser.connect(audioContext.destination);

            // Crea particelle iniziali
            for (let i = 0; i < 200; i++) {
                const radius = Math.random() * 150 + 50;
                const angle = Math.random() * Math.PI * 2;
                const color = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.8)`;
                particles.push(new Particle(canvas.width / 2, canvas.height / 2, radius, angle, color));
            }
        }

        animate();
    }
});

// Animazione del tornado
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ottieni i dati audio
    analyser.getByteFrequencyData(dataArray);

    const audioValue = dataArray.reduce((a, b) => a + b) / dataArray.length;

    // Aggiorna gradiente
    updateGradient(audioValue);

    // Disegna e aggiorna particelle
    particles.forEach((particle, index) => {
        particle.update(dataArray[index % dataArray.length]);
    });

    // Connetti particelle con linee dinamiche
    connectParticles(audioValue);

    // Disegna il core centrale
    drawCore(audioValue);

    requestAnimationFrame(animate);
}

// Effetto al centro del tornado
function drawCore(audioValue) {
    ctx.beginPath();
    const radius = Math.min(150 + audioValue, 400); // Cerchio centrale ingrandito
    ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${audioValue * 2}, ${255 - audioValue}, ${audioValue * 3}, 0.5)`;
    ctx.fill();
}

// Connetti particelle con linee
function connectParticles(audioValue) {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(255, 255, 255, ${1 - distance / 100})`;
                ctx.lineWidth = 1 + audioValue * 0.01;
                ctx.stroke();
            }
        }
    }
}

// Aggiorna gradiente dello sfondo in base al ritmo
function updateGradient(audioValue) {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);

    gradient.addColorStop(
        0,
        `rgb(${Math.abs(gradientColors[0].r + audioValue % 255)}, 
             ${Math.abs(gradientColors[0].g - audioValue % 255)}, 
             ${Math.abs(gradientColors[0].b)})`
    );
    gradient.addColorStop(
        0.5,
        `rgb(${Math.abs(gradientColors[1].r - audioValue % 255)}, 
             ${Math.abs(gradientColors[1].g + audioValue % 255)}, 
             ${Math.abs(gradientColors[1].b)})`
    );
    gradient.addColorStop(
        1,
        `rgb(${Math.abs(gradientColors[2].r)}, 
             ${Math.abs(gradientColors[2].g - audioValue % 255)}, 
             ${Math.abs(gradientColors[2].b + audioValue % 255)})`
    );

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Resize dinamico
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = [];
    for (let i = 0; i < 200; i++) {
        const radius = Math.random() * 150 + 50;
        const angle = Math.random() * Math.PI * 2;
        const color = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.8)`;
        particles.push(new Particle(canvas.width / 2, canvas.height / 2, radius, angle, color));
    }
});
