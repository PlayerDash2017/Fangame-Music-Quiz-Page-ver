tsParticles.load("tsparticles", {
    particles: {
        number: {
          value: 70,  // Cantidad de partículas inicial
          density: {
            enable: false
          }
        },
        color: {
          value: "#93ff8fff"
        },
        shape: {
          type: "square"
        },
        opacity: {
          value: 0.5
        },
        size: {
          value: { min: 5, max: 15 } // Tamaño aleatorio
        },
        move: {
          enable: true,
          speed: { min: 0.2, max: 1 }, // Velocidad lenta y aleatoria
          direction: "left",
          angle: {
            value: { min: 160, max: 200 } // Ángulo de movimiento en grados
          },
          outModes: "out" // Se eliminan al salir de pantalla
        },
        rotate: {
          value: { min: 0, max: 360 },
          direction: "random",
          animation: {
            enable: true,
            speed: { min: 2, max: 5 } // Velocidad de giro
          }
        }
      },
      detectRetina: true
    });