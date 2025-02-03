const axios = require('axios');
const fs = require('fs');
const readline = require('readline');

// Configuración para la lectura de consola
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Función para enviar un mensaje con embed al canal
async function sendEmbedWithMention(webhookUrl) {
  try {
    const embed = {
      title: '¡Atención todos!',
      description: 'Este mensaje tiene un **@everyone** que notificará a todos los miembros del servidor.',
      color: 0x00ff00, // Color del borde del embed (en hexadecimal)
      fields: [
        {
          name: 'Información importante',
          value: 'Aquí va la información relevante que deseas compartir con todos.',
          inline: false // Los campos se mostrarán en una sola columna
        }
      ],
      footer: {
        text: 'Enviado por el bot'
      },
      timestamp: new Date()
    };

    await axios.post(webhookUrl, {
      content: '@everyone', // Mención a todos antes del embed
      embeds: [embed], // Enviar el embed
    });
    console.log(`Embed enviado al webhook ${webhookUrl}`);
  } catch (error) {
    console.error('Error al enviar el embed:', error);
  }
}

// Función que lee el archivo wh.txt y obtiene las URLs de los webhooks
function readWebhooksFromFile() {
  return new Promise((resolve, reject) => {
    fs.readFile('wh.txt', 'utf8', (err, data) => {
      if (err) {
        return reject('Error al leer el archivo wh.txt');
      }
      // Extraer las URLs de los webhooks
      const webhooks = data.split('\n').map(line => line.trim()).filter(line => line !== '');
      
      // Verificar que no haya más de 10 webhooks
      if (webhooks.length > 100) {
        return reject('Solo se pueden usar hasta 100 webhooks.');
      }

      resolve(webhooks);
    });
  });
}

// Función que pide información por consola
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Función principal para interactuar
async function main() {
  try {
    // Leer los webhooks del archivo
    const webhookUrls = await readWebhooksFromFile();
    console.log(`Se encontraron ${webhookUrls.length} webhook(s).`);

    // Pedir cuántas veces enviar el embed
    const times = parseInt(await askQuestion('¿Cuántas veces deseas enviar el embed? '), 10);

    // Confirmar y ejecutar el envío del embed
    console.log(`Enviando el embed con @everyone a ${webhookUrls.length} webhook(s) ${times} veces...`);
    
    for (let i = 0; i < times; i++) {
      // Enviar el embed a todos los webhooks al mismo tiempo
      await Promise.all(webhookUrls.map(webhookUrl => sendEmbedWithMention(webhookUrl)));
      console.log(`Embed ${i + 1} de ${times} enviado a los ${webhookUrls.length} webhook(s).`);

      // Añadir un pequeño retraso entre los envíos para evitar problemas de rate-limiting
      if (i + 1 < times) {
        console.log('Esperando 1 segundo antes de enviar el siguiente embed...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo de espera
      }
    }

    // Cerrar la interfaz de consola después de terminar
    rl.close();

  } catch (error) {
    console.error(error);
    rl.close();
  }
}

// Ejecutar la función principal
main();
