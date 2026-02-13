const express = require("express");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;

/* ================= SECURITY ================= */

// Oculta que es Express
app.disable("x-powered-by");

// Helmet (protección headers)
app.use(helmet());

// Rate limit global
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200, // máximo 200 requests por IP
    message: "Demasiadas solicitudes. Intentá más tarde."
});
app.use(globalLimiter);

// Rate limit más estricto para descargas
const downloadLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 10, // máximo 10 descargas por IP
    message: "Demasiadas descargas. Esperá unos minutos."
});

/* ================= STATIC FILES ================= */

// Sirve archivos estáticos pero sin index automático
app.use(express.static(path.join(__dirname, "public"), {
    index: false,
    redirect: false
}));

/* ================= ROUTES ================= */

// Página principal
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Página ZR Music
app.get("/zr-music", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "zr-music.html"));
});

// Página AEGIS
app.get("/aegis", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "aegis.html"));
});
app.get("/zr-studio", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "zr-studio.html"));
});
/* ================= DOWNLOAD SYSTEM ================= */

function secureDownload(filePath, fileName) {
    return (req, res) => {

        // Verifica que el archivo exista
        if (!require("fs").existsSync(filePath)) {
            return res.status(404).send("Archivo no encontrado.");
        }

        // Fuerza descarga
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error("Error descargando:", err);
                if (!res.headersSent) {
                    res.status(500).send("Error al descargar.");
                }
            }
        });
    };
}

// Versiones antiguas
app.get(
    "/download/zr-build-v1-9x82k",
    downloadLimiter,
    secureDownload(
        path.join(__dirname, "public/private/ZR-Music-1.0.0.exe"),
        "ZR-Music-1.0.0.exe"
    )
);

app.get(
    "/download/zr-build-v2-9x82k",
    downloadLimiter,
    secureDownload(
        path.join(__dirname, "public/private/ZR-Music-1.1.0.exe"),
        "ZR-Music-1.1.0.exe"
    )
);

// Installer principal
app.get(
    "/download/zr-build-v3-installer",
    downloadLimiter,
    secureDownload(
        path.join(__dirname, "public/private/ZR-Music-installer.zip"),
        "ZR-Music-installer.zip"
    )
);


/* ================= ERROR HANDLING ================= */

// Ruta inexistente
app.use((req, res) => {
    res.status(404).send("404 - Página no encontrada");
});

// Error handler
app.use((err, req, res, next) => {
    console.error("Error:", err.stack);
    res.status(500).send("Error interno del servidor");
});

/* ================= START SERVER ================= */

app.listen(PORT, () => {
    console.log("🔥 Portafolio seguro corriendo en http://localhost:" + PORT);
});
